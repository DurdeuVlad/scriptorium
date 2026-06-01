# /sync-framework

**Phase:** 6
**Status:** active
**Owner:** framework-sync-agent
**Category:** sync

## Purpose
Legacy compatibility surface for full-framework imports. Prefer `/import-framework` for all new work. This command maps to `/import-framework` with a repo source and full component scope.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| source_framework_path | string | Yes | (none) | Absolute path to the source framework repo |
| conflict_resolution_mode | string | Yes | (none) | One of: ask, prefer-local, prefer-source |
| components | array of strings | No | [doctrine, commands, agents, workflows, schemas, styles, guides, adapters] | Override to sync a subset of components |
| dry_run | boolean | No | false | If true, report all changes without writing anything |
| backup | boolean | No | true | If true, create a timestamped backup before applying changes |

## Behavior
1. Validate `source_framework_path`.
2. Translate this invocation into `/import-framework` with:
   - `source_path = source_framework_path`
   - `components = components`
   - `conflict_resolution_mode = conflict_resolution_mode`
   - `dry_run = dry_run`
   - `backup = backup`
3. Execute the `/import-framework` workflow against the source repo.
4. Return the resulting sync manifest and summary, preserving the legacy command name in the report for audit readability.

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| sync_manifest | JSON | sync_manifest | Import record at `sync/sync_manifest.json` |
| backup | directory | â€” | Pre-import backup if requested |
| sync_report | markdown (stdout) | â€” | Compatibility summary from the delegated `/import-framework` run |

## Quality Gate
- Delegated `/import-framework` run must complete successfully.
- Protected local paths must not be overwritten.
- The legacy invocation must be recorded in the sync report for audit readability.

## Error Handling
- Source repo is invalid: halt and surface the same validation error that `/import-framework` would produce.
- Backup creation fails: halt before any writes.

## Related Commands
- Preferred replacement: `/import-framework`
- Related legacy commands: `/sync-principles`, `/import-pack`, `/upgrade-framework`
- Related: `/install-framework`

## Related Agents
- framework-sync-agent

## Escalation Triggers
- Any protected-path collision is detected: surface it explicitly and skip the file.

## Tool Adapter Notes
- **Claude Code:** Thin compatibility wrapper over `/import-framework`.
- **Codex:** Prefer invoking `/import-framework` directly for new work.
- **Windsurf:** Prefer invoking `/import-framework` directly for new work.
- **Copilot:** Prefer invoking `/import-framework` directly for new work.

