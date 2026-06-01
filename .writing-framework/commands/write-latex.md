# write-latex

**Category:** Artifacts
**Phase:** 5 — Artifact Production

## Purpose
Render the current production artifact as a .tex (LaTeX) file. Used when typographic quality requirements exceed what PDF-via-Markdown can produce — academic papers, formal publications, structured technical documents.

## Inputs
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| source | string | yes | Path to merged draft or finalized Markdown source |
| output_path | string | no | Output file path. Default: `artifacts/[slug]-[timestamp].tex` |
| document_class | string | no | LaTeX document class. Default: `article`. Options: `article`, `report`, `book`. |
| style_pack | string | no | Style pack for LaTeX conventions. Inherits from session if omitted. |

## Outputs
- Writes .tex file to `artifacts/`
- Updates `artifact_manifest.json`
- Returns artifact record conforming to `artifact_manifest.schema.json`

## Behavior
1. Load source Markdown document
2. Convert to LaTeX structure via artifact-server `render_latex` operation
3. Apply document_class and style pack LaTeX rules (font, spacing, section formatting)
4. Write .tex output
5. Register in artifact manifest

## Blockers
| Code | Condition |
|------|-----------|
| B4 | Source file not found |
| B5 | artifact-server render_latex call failed |
| B9 | Output validation failed |

## Related Commands
- `/edit-latex` — post-render edits to .tex
- `/write-pdf` — alternative PDF path via direct Markdown rendering
