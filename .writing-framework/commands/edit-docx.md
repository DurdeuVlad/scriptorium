# edit-docx

**Category:** Artifacts
**Phase:** 5 — Artifact Production

## Purpose
Apply targeted edits to an existing .docx artifact. Used for post-render corrections — heading style fixes, tracked changes, comment insertion — without re-running the full render pipeline.

## Inputs
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| artifact_path | string | yes | Path to the .docx file to edit |
| edits | array | yes | List of edit operations. Each: `{ "type": "replace|style|comment", "target": "...", "value": "..." }` |
| track_changes | boolean | no | Enable Word track changes mode. Default: false. |

## Outputs
- Writes updated .docx to same path (overwrites) or new path if output_path specified
- Appends edit event to `artifact_manifest.json`

## Behavior
1. Load .docx via artifact-server `open_docx` operation
2. Apply each edit operation in order
3. If track_changes=true, wrap edits in track-changes markup
4. Save output
5. Update artifact manifest

## Blockers
| Code | Condition |
|------|-----------|
| B4 | artifact_path not found |
| B5 | artifact-server edit call failed |
| B7 | Edit operation schema invalid |

## Related Commands
- `/write-docx` — initial render
- `/export-docx` — export after editing
