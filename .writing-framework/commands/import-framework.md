# /import-framework

**Phase:** 6
**Status:** active
**Owner:** framework-sync-agent
**Category:** sync

## Purpose
Import framework updates into the current repository from another framework repo or an exported framework bundle. This is the primary user-facing sync command. It auto-detects whether the source is a live repo or a portable bundle, protects local canon and decision records, and records every evaluated item in a `sync_manifest.json`.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| source_path | string | Yes | (none) | Absolute path to the source repo or exported framework bundle |
| conflict_resolution_mode | string | No | ask | One of: ask, prefer-local, prefer-source |
| components | array of strings | No | [doctrine, styles, commands, agents, workflows, schemas, templates, guides, adapters] | Limit import to specific framework components |
| dry_run | boolean | No | false | If true, report the proposed import without writing changes |
| backup | boolean | No | true | Create a timestamped backup before writing any changes |

## Behavior
1. Validate that `source_path` exists.
2. Detect the source type:
   - **repo source:** `source_path` contains a `.writing-framework/` directory
   - **bundle source:** `source_path` contains a `pack_manifest.json`
3. Validate `conflict_resolution_mode`. Halt on invalid values.
4. If `backup` is true and `dry_run` is false: create a timestamped backup at `sync/backups/import-framework-{timestamp}/`.
5. Build the source inventory for the requested `components`.
   - Framework core components are read from `.writing-framework/`
   - Adapter components include `.claude/`, `.codex/`, `.copilot/`, `.windsurf/`, and `.github/copilot-instructions.md` when present
6. Build the matching local inventory for the same component set.
7. Diff each source item against local state and classify as `new`, `identical`, `conflict`, or `local-only`.
8. Never overwrite protected local paths:
   - `.writing-framework/guides/canon/`
   - `.writing-framework/guides/decision-records/`
   - `artifacts/`
   - `logs/`
9. Apply `conflict_resolution_mode`:
   - `ask`: surface conflicts for user choice
   - `prefer-local`: skip conflicting local files
   - `prefer-source`: overwrite conflicting local files except protected paths
10. Apply all approved writes.
11. Write `sync/sync_manifest.json` with source type, source path, components evaluated, per-item status, backup path (if any), and final counts.
12. Return an import summary with counts, skipped protected paths, and the recommended next step (`/session-start` if the framework changed materially).

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| sync_manifest | JSON | sync_manifest | Full import record at `sync/sync_manifest.json` |
| backup | directory | — | Pre-import backup if `backup: true` and not dry run |
| import_summary | markdown (stdout) | — | Summary of applied, skipped, and conflicted items |

## Quality Gate
- Every evaluated item must appear in `sync_manifest.json`.
- Protected local paths must never be overwritten.
- If `backup: true`, the backup must exist before writes begin.
- Bundle imports must validate `pack_manifest.json` before any writes occur.

## Error Handling
- `source_path` is not a framework repo or bundle: halt with a descriptive validation error.
- Backup creation fails: halt before any writes.
- A file write fails: record the failure in the manifest and continue with remaining approved items.
- Bundle integrity check fails: halt unless the user explicitly approves proceeding despite the mismatch.

## Related Commands
- Primary companion: `/export-framework`
- Legacy compatibility commands: `/sync-framework`, `/import-pack`, `/import-principles`, `/sync-principles`, `/upgrade-framework`
- Related: `/install-framework`

## Related Agents
- framework-sync-agent
- import-export-orchestrator

## Escalation Triggers
- More than 25 conflicting items are detected: present a summarized conflict report before proceeding.
- Any protected-path collision is detected: surface it explicitly and skip the file.

## Tool Adapter Notes
- **Claude Code:** Invoke with "Import framework from [path]" or `Run /import-framework source_path=[path]`.
- **Codex:** Load `.writing-framework/workflows/sync.md` in addition to this spec when a full sync plan is needed.
- **Windsurf:** Invoke via AI panel with `source_path`; set `dry_run=true` for a preview.
- **Copilot:** Invoke in Copilot Chat; Copilot should request `source_path` if omitted.
