# write-pdf

**Category:** Artifacts
**Phase:** 5 — Artifact Production

## Purpose
Render the current production artifact as a .pdf file. Routes through Markdown to PDF pipeline via the artifact-server. Applies typographic and layout rules from the active style pack.

## Inputs
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| source | string | yes | Path to merged draft or finalized Markdown source |
| output_path | string | no | Output file path. Default: `artifacts/[slug]-[timestamp].pdf` |
| style_pack | string | no | Style pack for layout and typography. Inherits from session if omitted. |
| page_size | enum | no | `A4` (default) or `letter` |

## Outputs
- Writes .pdf file to `artifacts/`
- Updates `artifact_manifest.json`
- Returns artifact record conforming to `artifact_manifest.schema.json`

## Behavior
1. Load source Markdown document
2. Invoke artifact-server `render_pdf` operation (Markdown to PDF via configured renderer)
3. Apply page size, margin, and font rules from style pack
4. Write .pdf output
5. Register in artifact manifest

## Blockers
| Code | Condition |
|------|-----------|
| B4 | Source file not found |
| B5 | artifact-server render_pdf call failed (missing renderer dependency) |
| B9 | Output validation failed |

## Related Commands
- `/export-pdf` — export .pdf to external destination
- `/write-markdown` — source format
- `/write-latex` — alternative high-quality PDF path via LaTeX
