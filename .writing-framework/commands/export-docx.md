# export-docx

**Category:** Artifacts
**Phase:** 5 — Artifact Production

## Purpose
Export a .docx artifact to an external destination — file system path, shared drive, or configured export target. Validates the artifact before export and logs the export event.

## Inputs
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| artifact_path | string | yes | Path to the .docx artifact to export |
| destination | string | yes | Export destination path or target identifier |
| validate_before | boolean | no | Validate artifact against manifest before exporting. Default: true. |

## Outputs
- Copies artifact to destination
- Appends export event to `artifact_manifest.json` (destination, timestamp, status)

## Behavior
1. If validate_before=true: run artifact-validate check on the artifact
2. Copy artifact to destination via artifact-server `export_file` operation
3. Log export event in artifact manifest

## Blockers
| Code | Condition |
|------|-----------|
| B4 | artifact_path not found |
| B5 | Export write failed (permissions, path not found) |
| B6 | Artifact validation failed before export |

## Related Commands
- `/write-docx` — produce the artifact
- `/artifact-validate` — explicit validation step
- `/export-pdf` — PDF export equivalent
