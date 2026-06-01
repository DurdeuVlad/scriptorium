# artifact-validate

**Category:** Artifacts
**Phase:** 5 — Artifact Production

## Purpose
Validate an artifact against its manifest entry and schema. Confirms that the artifact file exists, matches the registered checksum, and that its manifest entry is well-formed. Run before export or before marking a production run complete.

## Inputs
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| artifact_path | string | yes | Path to the artifact file to validate |
| manifest_path | string | no | Path to artifact manifest. Default: `artifacts/artifact_manifest.json` |
| check_schema | boolean | no | Validate manifest entry against `artifact_manifest.schema.json`. Default: true. |
| check_checksum | boolean | no | Verify file checksum matches manifest record. Default: true. |

## Outputs
- Returns validation result: PASS or FAIL with list of failing checks
- Produces `blocker_report.json` (B6) on FAIL

## Behavior
1. Load artifact file and manifest
2. Find manifest entry for artifact_path
3. If check_schema=true: validate manifest entry against `artifact_manifest.schema.json`
4. If check_checksum=true: compute file checksum and compare to manifest record
5. Report PASS or FAIL with details

## Blockers
| Code | Condition |
|------|-----------|
| B4 | Artifact file not found |
| B6 | Artifact fails validation (checksum mismatch, schema invalid, manifest entry missing) |

## Related Commands
- `/export-docx` — export after validation
- `/export-pdf` — export after validation
- `/orchestrate-finalize` — final stage that calls this command
