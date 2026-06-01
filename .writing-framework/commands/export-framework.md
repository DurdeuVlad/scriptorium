# /export-framework

**Phase:** 6
**Status:** active
**Owner:** import-export-orchestrator
**Category:** sync

## Purpose
Export this repository's framework for use in another repository. This is the primary user-facing outbound sync command. It can either write a portable framework bundle or apply the framework directly to a target repo while preserving manifests and adapter files.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| destination_path | string | No | sync/export-packs/ | Target repo path or base output directory for a bundle |
| destination_type | string | No | auto | One of: auto, repo, bundle |
| components | array of strings | No | [doctrine, styles, commands, agents, workflows, schemas, templates, guides, adapters] | Limit export to specific framework components |
| pack_name | string | No | framework-export-{timestamp} | Bundle directory name when exporting as a bundle |
| conflict_resolution_mode | string | No | ask | Used only for `destination_type: repo`; one of ask, prefer-local, prefer-source |
| dry_run | boolean | No | false | If true, report planned actions without writing |
| backup | boolean | No | true | For repo destinations, create a timestamped backup before overwriting target files |

## Behavior
1. Resolve `destination_type`.
   - `repo`: export directly into another repository
   - `bundle`: create a portable export bundle
   - `auto`: treat an existing repo path as `repo`; otherwise create a bundle under `destination_path`
2. Validate the requested `components`.
3. Collect the selected framework core items from `.writing-framework/`.
4. Collect adapter items when `components` includes `adapters`:
   - `.claude/`
   - `.codex/`
   - `.copilot/`
   - `.windsurf/`
   - `.github/copilot-instructions.md`
5. If exporting to a repo:
   - Validate the target repo path
   - Create a backup if `backup: true` and `dry_run` is false
   - Diff source items against target items
   - Apply `conflict_resolution_mode`
   - Write approved files into the target repo
6. If exporting to a bundle:
   - Create `{destination_path}/{pack_name}/`
   - Copy all selected items into the bundle, preserving relative paths
   - Compute checksums and write `pack_manifest.json`
7. Write or update `sync/sync_manifest.json` with export destination, mode, components, per-item status, and backup path when applicable.
8. Return an export summary with the destination path and recommended next step:
   - repo destination: run `/session-start` in the receiving repo
   - bundle destination: use `/import-framework` from the receiving repo

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| framework_export | directory | — | Target repo updates or bundle directory |
| pack_manifest | JSON | — | Present for bundle exports |
| sync_manifest | JSON | sync_manifest | Export record at `sync/sync_manifest.json` |
| export_summary | markdown (stdout) | — | Summary of exported items and next step |

## Quality Gate
- Every exported item must be recorded in `sync_manifest.json`.
- Bundle exports must include `pack_manifest.json` with checksums for every file.
- Repo exports must not overwrite protected receiving-repo canon or decision-record files.
- If `backup: true` for a repo export, the backup must exist before writes begin.

## Error Handling
- `destination_type: repo` but the target path is not a repo root: halt with a descriptive validation error.
- A bundle directory cannot be created: halt and surface the specific path error.
- A file copy fails: record it in the manifest and continue with remaining approved items.

## Related Commands
- Primary companion: `/import-framework`
- Legacy compatibility commands: `/export-pack`, `/export-principles`, `/install-framework`
- Related: `/orchestrate-export`

## Related Agents
- import-export-orchestrator
- framework-sync-agent

## Escalation Triggers
- A repo export would overwrite more than 25 target files: require explicit confirmation before writing.
- Any receiving-repo protected-path collision is detected: surface it explicitly and skip the file.

## Tool Adapter Notes
- **Claude Code:** Invoke with "Export framework" or `Run /export-framework destination_path=[path]`.
- **Codex:** Prefer `destination_type=repo` when updating another checked-out repo directly; otherwise allow bundle mode.
- **Windsurf:** Bundle exports appear in the file explorer after completion.
- **Copilot:** Copilot should request `destination_path` when the user does not specify a target.
