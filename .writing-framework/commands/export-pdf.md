# export-pdf

**Category:** Artifacts
**Phase:** 5 — Artifact Production

## Purpose
Export a .pdf artifact to an external destination. Validates the artifact before export and logs the export event in the artifact manifest.

## Inputs
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| artifact_path | string | yes | Path to the .pdf artifact to export |
| destination | string | yes | Export destination path or target identifier |
| validate_before | boolean | no | Validate artifact against manifest before exporting. Default: true. |

## Outputs
- Copies artifact to destination
- Appends export event to `artifact_manifest.json`

## Behavior
1. If validate_before=true: run artifact-validate check
2. Copy artifact to destination via artifact-server `export_file` operation
3. Log export event in artifact manifest

## Blockers
| Code | Condition |
|------|-----------|
| B4 | artifact_path not found |
| B5 | Export write failed |
| B6 | Artifact validation failed before export |

## Related Commands
- `/write-pdf` — produce the artifact
- `/artifact-validate` — explicit validation step
- `/export-docx` — Word export equivalent
