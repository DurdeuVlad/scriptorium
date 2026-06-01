# write-docx

**Category:** Artifacts
**Phase:** 5 — Artifact Production

## Purpose
Render the current production artifact as a .docx file. Applies heading styles, paragraph formatting, and any domain-specific Word conventions from the active style pack via the artifact-server.

## Inputs
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| source | string | yes | Path to merged draft or finalized Markdown source to convert |
| output_path | string | no | Output file path. Default: `artifacts/[slug]-[timestamp].docx` |
| style_pack | string | no | Style pack for formatting. Inherits from session if omitted. |
| template_docx | string | no | Path to a .docx template file to apply Word styles from. |

## Outputs
- Writes .docx file to `artifacts/`
- Updates `artifact_manifest.json`
- Returns artifact record conforming to `artifact_manifest.schema.json`

## Behavior
1. Load source Markdown document
2. Convert via artifact-server `render_docx` operation
3. Apply template_docx styles if provided, otherwise use default style pack heading/paragraph rules
4. Write .docx output
5. Register in artifact manifest

## Blockers
| Code | Condition |
|------|-----------|
| B4 | Source file not found |
| B5 | artifact-server render_docx call failed |
| B9 | Output validation failed |

## Related Commands
- `/edit-docx` — post-render edits to .docx
- `/export-docx` — export .docx to external destination
- `/write-markdown` — Markdown format output
