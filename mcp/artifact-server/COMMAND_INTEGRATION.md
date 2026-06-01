# Command Integration — artifact-server MCP

**Status:** Canonical. Defines how commands integrate with artifact-server tools.
**Phase:** 7
**Related:** workflows/artifacts.md, ARTIFACT_MODEL.md

---

## Purpose

Define how editorial commands integrate with artifact-server MCP tools. This document maps command operations to artifact-server tool calls and defines expected workflows.

---

## Command-to-Tool Mapping

### /write-markdown

**Purpose:** Create new markdown artifact from content.

**Tool call:**
```javascript
create_markdown({
  path: "artifacts/[run_id]/drafts/[filename].md",
  content: "[markdown content]",
  metadata: {
    title: "[document title]",
    author: "[agent name]",
    date: "[ISO 8601 timestamp]"
  },
  run_id: "[run_id]",
  step_id: "[step_id]"
})
```

**Response:**
```json
{
  "artifact_id": "art_1234567890_abcd1234",
  "path": "/absolute/path/to/artifact.md",
  "size_bytes": 5432,
  "word_count": 850
}
```

**Follow-up:** Call `validate_artifact` to check markdown validity.

---

### /write-docx

**Purpose:** Export markdown artifact to DOCX format.

**Workflow:**
1. Create markdown artifact first (if not exists)
2. Export to DOCX

**Tool calls:**
```javascript
// Step 1: Create markdown
create_markdown({ path, content, metadata, run_id, step_id })
→ { artifact_id: "art_123" }

// Step 2: Export to DOCX
export_markdown_to_docx({
  artifact_id: "art_123",
  output_path: "artifacts/[run_id]/exports/[filename].docx",
  reference_doc: "[optional template path]"
})
→ { artifact_id: "art_456", path, success: true }
```

**Dependencies:** Requires pandoc.

**Fallback:** If pandoc unavailable, return markdown artifact with B5 blocker (degraded).

---

### /write-pdf

**Purpose:** Export markdown or LaTeX artifact to PDF format.

**Workflow (from markdown):**
```javascript
// Step 1: Create markdown
create_markdown({ path, content, metadata, run_id, step_id })
→ { artifact_id: "art_123" }

// Step 2: Export to PDF
export_markdown_to_pdf({
  artifact_id: "art_123",
  output_path: "artifacts/[run_id]/exports/[filename].pdf",
  template: "[optional pandoc template]",
  variables: { fontsize: "12pt", margin: "1in" }
})
→ { artifact_id: "art_789", path, success: true }
```

**Workflow (from LaTeX):**
```javascript
// Step 1: Create LaTeX source
create_latex({
  path: "artifacts/[run_id]/drafts/[filename].tex",
  content: "[latex source]",
  document_class: "article",
  run_id, step_id
})
→ { artifact_id: "art_123" }

// Step 2: Compile to PDF
compile_latex_to_pdf({
  artifact_id: "art_123",
  engine: "pdflatex",
  passes: 2
})
→ { pdf_artifact_id: "art_789", path, success: true }
```

**Dependencies:** 
- Markdown → PDF: Requires pandoc
- LaTeX → PDF: Requires LaTeX toolchain (pdflatex/xelatex/lualatex)

---

### /edit-markdown

**Purpose:** Update existing markdown artifact.

**Tool call:**
```javascript
update_markdown({
  artifact_id: "art_123",
  content: "[full replacement content]"
})
→ { artifact_id: "art_123", version: 2, size_bytes, word_count }
```

**Or append:**
```javascript
update_markdown({
  artifact_id: "art_123",
  append: "[content to append]"
})
→ { artifact_id: "art_123", version: 2 }
```

**Version increment:** Every update increments version number.

---

### /normalize-artifact

**Purpose:** Apply formatting normalization to artifact.

**Tool call:**
```javascript
normalize_artifact({
  artifact_id: "art_123",
  rules: ["trailing_whitespace", "line_endings", "section_spacing"]
})
→ { artifact_id: "art_123", version: 3, changes_made: ["removed_trailing_whitespace", "normalized_line_endings"] }
```

**Supported for:** Markdown only (currently).

**Changes applied:**
- Remove trailing whitespace
- Normalize line endings to `\n`
- Ensure single blank line between sections
- Ensure file ends with single newline

---

### /artifact-validate

**Purpose:** Validate artifact format and content.

**Tool call:**
```javascript
validate_artifact({
  artifact_id: "art_123",
  checks: ["yaml_frontmatter", "heading_hierarchy", "empty_sections"]
})
→ {
  valid: true,
  findings: [
    { check: "yaml_frontmatter", status: "pass", detail: "Valid YAML frontmatter" },
    { check: "heading_hierarchy", status: "pass", detail: "No skipped heading levels" }
  ]
}
```

**Validation by format:**
- **Markdown:** YAML frontmatter, heading hierarchy, empty sections
- **DOCX/PDF:** File integrity, size > 0
- **LaTeX:** File exists

---

### /artifact-inspect

**Purpose:** Get artifact metadata without reading full content.

**Tool call:**
```javascript
inspect_artifact({
  artifact_id: "art_123"
})
→ {
  artifact_id: "art_123",
  path: "/absolute/path/to/artifact.md",
  format: "markdown",
  title: "Document Title",
  size_bytes: 5432,
  word_count: 850,
  version: 2,
  created_at: "2026-03-29T00:00:00Z",
  updated_at: "2026-03-29T01:00:00Z",
  producing_run_id: "run_123",
  validation_status: "valid"
}
```

---

## Workflow Integration

### End-to-End Artifact Generation

**Typical workflow:**
1. Review workflow produces `full_draft.md`
2. QA Gate passes (ACCEPT decision)
3. Artifact workflow triggered
4. artifact-orchestrator calls artifact-server:

```javascript
// Step 1: Create markdown artifact
create_markdown({
  path: "artifacts/run_123/exports/final-draft.md",
  content: "[reviewed draft content]",
  metadata: { title: "Final Draft", author: "lead-editor" },
  run_id: "run_123",
  step_id: "step_456"
})
→ { artifact_id: "art_789" }

// Step 2: Validate
validate_artifact({ artifact_id: "art_789" })
→ { valid: true, findings: [...] }

// Step 3: Export to DOCX
export_markdown_to_docx({
  artifact_id: "art_789",
  output_path: "artifacts/run_123/exports/final-draft.docx"
})
→ { artifact_id: "art_890", success: true }

// Step 4: Export to PDF
export_markdown_to_pdf({
  artifact_id: "art_789",
  output_path: "artifacts/run_123/exports/final-draft.pdf"
})
→ { artifact_id: "art_891", success: true }
```

**Result:** 3 artifacts created (markdown, docx, pdf) with relationships tracked.

---

## Error Handling Patterns

### Missing Dependencies

**Scenario:** pandoc not installed, user requests DOCX export.

**Response:**
```json
{
  "error": "pandoc not found. Install pandoc to export to DOCX."
}
```

**Workflow action:**
- Classify as B5 blocker (failed-toolchain) with degraded severity
- Offer markdown fallback
- Document in export_operations table with status='failed'

### Validation Failure

**Scenario:** Artifact validation fails.

**Response:**
```json
{
  "valid": false,
  "findings": [
    { check: "yaml_frontmatter", status: "fail", detail: "YAML frontmatter not properly closed", location: "line 1" }
  ]
}
```

**Workflow action:**
- Update artifact validation_status to 'invalid'
- Classify as B6 blocker (artifact-export-failure)
- Attempt fallback format if applicable
- Document in artifact manifest validation_errors array

### File Write Failure

**Scenario:** Output path not writable.

**Response:**
```json
{
  "error": "EACCES: permission denied, open '/protected/path/artifact.md'"
}
```

**Workflow action:**
- Classify as B6 blocker (artifact-export-failure)
- Request writable path from user
- Do not create partial artifact

---

## Cache-Server Integration

**Artifact metadata saved to cache-server:**

After artifact creation, artifact-orchestrator calls:
```javascript
save_artifact({
  run_id: "run_123",
  step_id: "step_456",
  artifact_type: "structured-data",
  content: JSON.stringify({
    artifact_id: "art_789",
    artifact_type: "markdown",
    output_path: "/absolute/path/to/artifact.md",
    generation_method: "create",
    validation_status: "valid",
    file_size_bytes: 5432,
    word_count: 850,
    created_at: "2026-03-29T00:00:00Z"
  }),
  metadata: { format: "artifact_manifest" }
})
```

**Artifact manifest conforms to:** `schemas/artifact_manifest.schema.json`

---

## Cross-References

- `workflows/artifacts.md` — artifact workflow
- `mcp/artifact-server/ARTIFACT_MODEL.md` — artifact metadata model
- `mcp/cache-server/COMMAND_INTEGRATION.md` — cache-server integration
- `schemas/artifact_manifest.schema.json` — manifest schema
- `doctrine/BLOCKER_CLASSIFICATION.md` — B5/B6/B9 definitions
