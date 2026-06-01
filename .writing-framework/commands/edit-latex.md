# edit-latex

**Category:** Artifacts
**Phase:** 5 — Artifact Production

## Purpose
Apply targeted edits to an existing .tex artifact. Used for post-render LaTeX corrections — macro adjustments, environment fixes, bibliography entries — without re-running the full conversion pipeline.

## Inputs
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| artifact_path | string | yes | Path to the .tex file to edit |
| edits | array | yes | List of edit operations. Each: `{ "type": "replace|insert|delete", "target": "...", "value": "..." }` |
| validate_after | boolean | no | Run LaTeX syntax validation after edits. Default: true. |

## Outputs
- Writes updated .tex to same path (overwrites) or specified output_path
- Appends edit event to `artifact_manifest.json`

## Behavior
1. Load .tex file
2. Apply each edit operation in order (string replace, line insert, line delete)
3. If validate_after=true: check for unbalanced environments and undefined commands
4. Save output
5. Update artifact manifest

## Blockers
| Code | Condition |
|------|-----------|
| B4 | artifact_path not found |
| B5 | File write failed |
| B9 | Post-edit LaTeX validation failed (unbalanced environments, missing packages) |

## Related Commands
- `/write-latex` — initial render
- `/write-pdf` — compile .tex to PDF (requires LaTeX installation)
