# mcp/artifact-server/ — Artifact Server MCP

## Overview

The artifact-server MCP handles all artifact I/O for the framework — creating, updating, validating, normalizing, and exporting documents in multiple formats. It abstracts the filesystem and document toolchain behind a consistent operation set so that agents do not need to know whether they are writing a markdown file, updating a Word document, or compiling LaTeX.

Agents write to and read from artifacts exclusively through artifact-server. Direct filesystem access is not prohibited, but artifact-server provides format validation, normalization enforcement, and consistent path management that direct writes cannot.

**Implementation status:** Phase 5. Artifact-server is among the later infrastructure phases, after the core guide and cache infrastructure is in place. Until Phase 5, agents produce markdown output only, written directly to `artifacts/`. The operations described here define the target API.

---

## Backend

- **Primary storage:** Filesystem (`artifacts/` directory structure)
- **Format support:** Markdown (native), DOCX (via python-docx or pandoc), LaTeX (via native writes), PDF (via LaTeX compilation or pandoc)
- **Metadata:** SQLite sidecar for artifact metadata — path, type, format, producing run and step, version history, validation status
- **No binary content in MCP responses:** Artifact-server returns paths and metadata. Binary files (PDF, DOCX) are read from the filesystem by the client — artifact-server does not return binary blobs in MCP tool responses.

**Dependencies needed for implementation:**
- Python 3.9+ (primary runtime)
- `pandoc` — for markdown-to-docx and markdown-to-pdf conversions
- `python-docx` — for native DOCX creation and structured updates without round-tripping through pandoc
- LaTeX toolchain (TeX Live or MiKTeX) — for LaTeX compilation to PDF. Required only for LaTeX-format artifacts.
- `pdflatex` or `xelatex` — invoked as subprocess by artifact-server
- MCP SDK (Anthropic)

Pandoc and the LaTeX toolchain are optional at initial Phase 5 deployment if those format types are not yet needed. The markdown operations are independent of these dependencies.

---

## Supported Artifact Types

| Format | Extension | Description | Dependency |
|---|---|---|---|
| Markdown | `.md` | Primary working format. All drafts start as markdown. | None |
| DOCX | `.docx` | Word-compatible export for human review and delivery | pandoc or python-docx |
| LaTeX | `.tex` | Structured typesetting source | None (write-only) |
| PDF (from LaTeX) | `.pdf` | Compiled from `.tex` source | LaTeX toolchain |
| PDF (from Markdown) | `.pdf` | Exported from `.md` via pandoc | pandoc |

Markdown is the canonical intermediate format. Other formats are derived from or exported from markdown, except for LaTeX workflows where `.tex` is the authoring format and PDF is the output.

---

## Operations

### `create_markdown`
Create a new markdown artifact file.

```
create_markdown(
  path: string,             # relative to artifacts/ or absolute
  content: string,
  metadata?: object         # optional YAML frontmatter to prepend
)
→ { artifact_id: string, path: string }
```

Creates the file. Fails if the file already exists; use `update_markdown` for modifications.

---

### `update_markdown`
Update an existing markdown artifact. Supports full replacement or targeted section replacement.

```
update_markdown(
  artifact_id: string,
  content?: string,         # full replacement content
  section?: string,         # section header to target for partial replacement
  section_content?: string, # replacement content for the targeted section
  append?: string           # content to append to the document
)
→ { artifact_id: string, version: number }
```

Full replacement increments the version counter. Section replacement also increments the version counter. Previous versions are retained in the artifact metadata (not on disk by default unless versioning is enabled for the artifact).

---

### `create_docx`
Create a new DOCX artifact from structured content.

```
create_docx(
  path: string,
  title: string,
  sections: Array<{heading?: string, level?: number, content: string}>,
  template?: string         # path to a .docx template file to apply styles from
)
→ { artifact_id: string, path: string }
```

Sections are written in order. Heading level controls the heading style applied (H1-H6). If no template is provided, a minimal default style is used.

---

### `update_docx`
Update specific sections of an existing DOCX file.

```
update_docx(
  artifact_id: string,
  replacements: Array<{find: string, replace: string}>,
  append_section?: {heading?: string, content: string}
)
→ { artifact_id: string, version: number }
```

Find/replace operates on paragraph text. For structural changes (reordering sections, changing heading levels), use `export_markdown_to_docx` from an updated markdown source instead.

---

### `create_latex`
Create a new LaTeX source artifact.

```
create_latex(
  path: string,
  content: string,          # complete LaTeX source including \documentclass preamble
  document_class?: string   # default: "article"
)
→ { artifact_id: string, path: string }
```

---

### `update_latex`
Replace the content of an existing LaTeX source file.

```
update_latex(
  artifact_id: string,
  content: string
)
→ { artifact_id: string, version: number }
```

Full replacement only. For structured LaTeX edits, update the source in markdown and re-export, or update the `.tex` file directly and call `update_latex` with the full replacement.

---

### `compile_latex_to_pdf`
Compile a `.tex` artifact to PDF.

```
compile_latex_to_pdf(
  artifact_id: string,      # must be a LaTeX artifact
  engine?: string           # "pdflatex" (default) | "xelatex" | "lualatex"
  passes?: number           # default: 2 (required for cross-references)
)
→ {
    pdf_artifact_id: string,
    path: string,
    success: bool,
    compiler_output?: string  # included on failure
  }
```

Compilation runs in the artifact's directory. Output path is `[source_path_without_extension].pdf`. Compiler output is included in the response on failure for diagnosis.

---

### `export_markdown_to_docx`
Convert a markdown artifact to DOCX via pandoc.

```
export_markdown_to_docx(
  artifact_id: string,      # must be a markdown artifact
  output_path?: string,     # default: same path, .docx extension
  reference_doc?: string    # path to a .docx reference doc for styling
)
→ { artifact_id: string, path: string, success: bool }
```

The reference doc (pandoc `--reference-doc`) applies Word styles from a template DOCX. If not provided, pandoc's default styles are applied.

---

### `export_markdown_to_pdf`
Convert a markdown artifact to PDF via pandoc.

```
export_markdown_to_pdf(
  artifact_id: string,
  output_path?: string,
  template?: string,        # pandoc PDF template
  variables?: object        # pandoc template variables (fontsize, margin, etc.)
)
→ { artifact_id: string, path: string, success: bool }
```

Pandoc PDF conversion uses LaTeX internally. Requires either the LaTeX toolchain or a pandoc PDF engine (wkhtmltopdf, weasyprint) depending on configuration.

---

### `inspect_artifact`
Return metadata and summary information about an artifact without reading its full content.

```
inspect_artifact(
  artifact_id: string
)
→ {
    artifact_id: string,
    path: string,
    format: string,
    size_bytes: number,
    word_count?: number,    # for text formats
    version: number,
    created_at: string,
    updated_at: string,
    producing_run_id?: string,
    producing_step_id?: string,
    validation_status?: string
  }
```

---

### `validate_artifact`
Validate an artifact against format and content requirements.

```
validate_artifact(
  artifact_id: string,
  checks?: string[]         # optional list of specific checks to run
                            # default: all applicable checks for the format
)
→ {
    valid: bool,
    findings: Array<{
      check: string,
      status: "pass" | "fail" | "warning",
      detail: string,
      location?: string
    }>
  }
```

Default validation checks by format:
- **Markdown:** valid YAML frontmatter (if present), no broken internal links, heading hierarchy (no skipped levels), no empty sections
- **DOCX:** file integrity, template style compliance (if a reference doc was used)
- **LaTeX:** compilability (a dry-run compile)
- **PDF:** file integrity, page count

---

### `normalize_artifact`
Apply normalization rules to an artifact: consistent heading capitalization, trailing whitespace removal, standardized frontmatter fields, consistent list formatting.

```
normalize_artifact(
  artifact_id: string,
  rules?: string[]          # optional list of specific normalizations to apply
                            # default: all applicable normalizations for the format
)
→ {
    artifact_id: string,
    version: number,
    changes_made: string[]  # list of normalizations applied
  }
```

Normalization is non-destructive to content — it only modifies formatting and structural consistency. If a normalization would change meaning, it is not applied and is flagged in the response.

---

## Artifact Path Conventions

Artifacts are organized under `artifacts/` by run and type:

```
artifacts/
  [run_id]/
    drafts/
      [step_name]-v[n].md
    revisions/
      [step_name]-v[n].md
    qa-reports/
      [step_name]-qa-[n].md
    exports/
      [title].[ext]
  shared/
    templates/
    reference-docs/
```

Artifacts without a run ID (manually created, imported) go under `artifacts/shared/`.

---

## Related

- `artifacts/` — filesystem storage managed by artifact-server
- `mcp/cache-server/README.md` — run and step records that reference artifact IDs
- `mcp/guide-server/README.md` — guide records that are read-only (not managed by artifact-server)
- `sync/README.md` — sync operations that may move or export artifacts
- `doctrine/artifact-formats.md` — framework doctrine on when to use which format
