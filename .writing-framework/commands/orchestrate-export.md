# /orchestrate-export

**Phase:** 6
**Status:** stub
**Owner:** import-export-orchestrator
**Category:** orchestration

## Purpose
Packages a completed production run for delivery or sync by collecting all run artifacts, briefs, outlines, reports, and the final document into a versioned export bundle, then generating a `sync_manifest.json` that describes the full package contents.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| run_id | string | Yes | (active run) | Identifies which run to export |
| export_scope | array of strings | No | [artifacts, brief, outline, reports, final] | Which content categories to include in the pack |
| output_path | string | No | sync/export-packs/ | Base directory where the framework export bundle will be written |
| pack_name | string | No | [run_id]-export | Name for the export bundle directory |
| include_logs | boolean | No | false | Whether to include run logs in the export |

## Behavior
1. Resolve the active run context from cache-server using `run_id`. Confirm that the run exists and that a `FINAL_PASS` gate is on record. If no final pass exists, warn the user that the run is not complete, then ask whether to proceed with a partial export or halt.
2. Create the output directory at `{output_path}/{pack_name}/` if it does not exist.
3. **Collect artifacts by scope.** For each category in `export_scope`:
   - `final`: Copy the final approved document from `artifacts/final/` to the pack.
   - `artifacts`: Copy all entries in `artifact_manifest.json` that have `validation_status: valid` to the pack's `artifacts/` subdirectory. Copy `artifact_manifest.json` itself.
   - `brief`: Copy `brief.json` and the brief markdown from the run's brief directory.
   - `outline`: Copy `outline.json` and the outline markdown.
   - `reports`: Copy all `review_report.json` files and the `quality_gate.json` from the run.
   - `logs`: (Only if `include_logs` is true) Copy the run log from cache-server or the session log file.
4. Write a `run_summary.json` into the pack root containing: run_id, document title (from brief), total word count of final document, list of all QA perspectives run and their verdicts, FINAL_PASS gate timestamp, and list of all generated artifact formats.
5. Compute a SHA-256 checksum for every file collected into the pack. Record all paths and checksums in `sync_manifest.json`.
6. Write `sync_manifest.json` to the pack root with fields: pack_name, run_id, created_at, export_scope, total_files, files (array of {path, checksum, size_bytes, category}).
7. Output export summary: pack location, total files included, sync_manifest path, and recommended delivery or sync steps.

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| export_pack | directory | — | Versioned export bundle directory at {output_path}/{pack_name}/ |
| sync_manifest | JSON | sync_manifest | Full manifest of exported files with checksums |
| run_summary | JSON | — | High-level summary of the run written into the pack root |
| export_summary | markdown (stdout) | — | Pack location, file count, and next steps |

## Quality Gate
- `sync_manifest.json` must be present in the pack root and must reference every file in the pack.
- Every file referenced in `sync_manifest.json` must exist on disk with a matching checksum.
- The `final` document must be included in the pack if it exists on record (unless explicitly excluded from `export_scope`).

## Error Handling
- `run_id` not found in cache-server: attempt to locate run artifacts by scanning `artifacts/` and `sync/` for the run_id prefix. If found, reconstruct partial manifest and warn that cache-server metadata may be incomplete.
- An artifact file referenced in `artifact_manifest.json` is missing from disk: note the missing file in the sync_manifest with `status: missing`; do not halt the export run.
- Output directory cannot be created (permissions error): surface the error with the target path; ask the user to resolve permissions or provide an alternate output path.
- Checksum computation fails for a file: record the file with `checksum: null` and a warning; do not omit the file from the manifest.

## Related Commands
- Run after: `/orchestrate-artifact`
- Run before: `/import-framework` (on the receiving end)
- Component commands: `/export-framework`, `/export-docx`, `/export-pdf`

## Related Agents
- import-export-orchestrator
- artifact-orchestrator

## Escalation Triggers
- Run has no `FINAL_PASS` gate and user has not confirmed partial export: halt and surface the incomplete run status to the user.
- More than 20% of expected artifact files are missing from disk: warn the user before proceeding; list all missing files explicitly.

## Tool Adapter Notes
- **Claude Code:** Reads run state from cache-server, uses filesystem tools for all file copies and writes. Computes checksums via Bash if a checksum tool is available; otherwise records `checksum: computed-by-agent`.
- **Codex:** Invoke with "Export this run" or "Run /orchestrate-export". Codex assembles the pack by copying files and writing the manifest sequentially.
- **Windsurf:** Invoke via AI panel. The export bundle directory will appear in the file explorer after the command completes.
- **Copilot:** Invoke in Copilot Chat. Copilot surfaces the pack location and sync_manifest path in the response.
