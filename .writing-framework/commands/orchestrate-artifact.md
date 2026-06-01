# /orchestrate-artifact

**Phase:** 5
**Status:** stub
**Owner:** artifact-orchestrator
**Category:** orchestration

## Purpose
Generates all requested artifact formats from a finalized document by calling the appropriate artifact commands for each target format, validating each output, and producing a consolidated `artifact_manifest.json` that records all generated files.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| source_document | file path | Yes | (none) | Path to the final approved markdown document |
| target_formats | array of strings | Yes | (none) | One or more of: markdown, docx, pdf, latex |
| output_directory | string | No | artifacts/ | Base directory for all generated artifacts |
| run_id | string | No | (active run) | Used to scope artifact_manifest entries |
| template_path | string | No | (none) | Optional style template for docx/pdf output |

## Behavior
1. Confirm that `source_document` exists and that a `FINAL_PASS` gate exists for this run in cache-server. If no final pass exists, surface a B2 blocker and halt.
2. Validate that `target_formats` contains at least one valid format identifier. If an unrecognized format is listed, log a warning and skip it; do not halt the run for unknown formats.
3. Load or initialize `artifact_manifest.json` at `{output_directory}/artifact_manifest.json`.
4. **Per-format artifact generation:** For each format in `target_formats`, run the corresponding artifact command:
   - `markdown`: Run `/write-markdown` with `source_document` as input and `{output_directory}/[run_id].md` as output path.
   - `docx`: Run `/write-docx` with `source_document`, `output_directory`, and optional `template_path`.
   - `pdf`: Run `/write-pdf` with `source_document` and `output_directory`. Uses the docx-intermediate path by default.
   - `latex`: Run `/write-latex` with `source_document` and `{output_directory}/[run_id].tex`.
5. For each format, run `/artifact-validate` on the generated file immediately after creation.
   - If validation passes: mark the format entry in `artifact_manifest.json` as `validation_status: valid`.
   - If validation fails: mark as `validation_status: invalid`, record the error, and continue to the next format. Do not halt the entire run for a single format failure.
6. Update `artifact_manifest.json` with all generated files: path, format, file size, checksum, validation_status, and generated_at timestamp.
7. Output orchestration summary: formats requested, formats generated successfully, formats failed, manifest path, and recommended next command (typically `/orchestrate-export`).

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| artifact_manifest | JSON | artifact_manifest | Records all generated artifacts with paths, checksums, and validation status |
| generated_files | list of file paths | — | One path per successfully generated and validated artifact |
| orchestration_summary | markdown (stdout) | — | Summary of formats generated, failures, and next step |

## Quality Gate
- At least one artifact format must be generated and validated successfully for the command to report success.
- `artifact_manifest.json` must exist and contain an entry for every format in `target_formats` (each with a `validation_status` of either `valid` or `invalid` — never absent).
- All `valid` artifacts must have a checksum recorded in the manifest.

## Error Handling
- `source_document` does not exist: halt with B1 blocker before dispatching any artifact commands.
- All requested formats fail validation: report this as a B5 blocker (artifact generation failure). Surface all individual error messages. Do not deliver an empty manifest.
- `artifact-server` is unavailable: fall back to direct filesystem writes for markdown only; log that docx/pdf/latex generation requires artifact-server and mark those entries as `validation_status: skipped`.
- Output directory cannot be created: halt with a filesystem error message and instructions for the user to resolve permissions.

## Related Commands
- Run after: `/orchestrate-finalize` (must have FINAL_PASS gate)
- Run before: `/orchestrate-export`
- Component commands: `/write-markdown`, `/write-docx`, `/write-pdf`, `/write-latex`, `/artifact-validate`

## Related Agents
- artifact-orchestrator
- lead-orchestrator

## Escalation Triggers
- Two or more formats fail validation after one retry each: surface the failures to the user and ask which formats are mandatory vs. optional before continuing.
- Source document was modified after the FINAL_PASS gate was issued: warn the user that the document may not match the reviewed version; recommend re-running finalization.

## Tool Adapter Notes
- **Claude Code:** Dispatches artifact commands sequentially (parallel dispatch supported if the tool environment allows). Manages artifact_manifest.json via direct filesystem writes using the Write tool.
- **Codex:** Invoke with "Generate all artifacts" or "Run /orchestrate-artifact". Codex runs format generation steps sequentially.
- **Windsurf:** Invoke via AI panel. Generated artifact paths appear in the file explorer after each format completes.
- **Copilot:** Invoke in Copilot Chat. Each generated artifact is surfaced as a file reference in the response.
