# write-markdown

**Category:** Artifacts
**Phase:** 5 — Artifact Production

## Purpose
Render the current production artifact as a formatted Markdown file. Applies document structure, heading hierarchy, and any domain-specific Markdown conventions from the active style pack.

## Inputs
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| source | string | yes | Path to merged draft or finalized document to render |
| output_path | string | no | Output file path. Default: `artifacts/[slug]-[timestamp].md` |
| style_pack | string | no | Style pack to apply for formatting conventions. Inherits from session if omitted. |
| include_metadata | boolean | no | Prepend YAML frontmatter block. Default: false. |

## Outputs
- Writes Markdown file to `artifacts/` (or specified output_path)
- Updates `artifact_manifest.json` with new artifact entry
- Returns artifact record conforming to `artifact_manifest.schema.json`

## Behavior
1. Load source document
2. Apply active style pack Markdown formatting rules
3. Normalize heading hierarchy (H1 = title, H2 = sections, H3 = subsections)
4. Optionally prepend YAML frontmatter (title, date, author, domain)
5. Write output file
6. Register in artifact manifest

## Blockers
| Code | Condition |
|------|-----------|
| B4 | Source file not found |
| B5 | File write failed |
| B9 | Output does not validate against artifact_manifest schema |

## Related Commands
- `/write-docx` — Word format output
- `/write-pdf` — PDF format output
- `/normalize-artifact` — normalize formatting before export
