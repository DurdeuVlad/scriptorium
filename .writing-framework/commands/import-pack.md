# /import-pack

**Phase:** 6
**Status:** active
**Owner:** import-export-orchestrator
**Category:** sync

## Purpose
Legacy compatibility surface for bundle-based framework imports. Prefer `/import-framework`. This command maps to `/import-framework` with a bundle source.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| pack_path | string | Yes | (none) | Absolute path to the exported framework bundle |
| conflict_resolution_mode | string | Yes | (none) | One of: ask, prefer-local, prefer-source |
| components | array of strings | No | (all in pack) | Override to apply only specific components from the pack |
| dry_run | boolean | No | false | If true, validate and report without writing any changes |
| backup | boolean | No | true | Create a timestamped backup before applying |

## Behavior
1. Validate `pack_path`.
2. Translate this invocation into `/import-framework` with:
   - `source_path = pack_path`
   - `components = components`
   - `conflict_resolution_mode = conflict_resolution_mode`
   - `dry_run = dry_run`
   - `backup = backup`
3. Execute the `/import-framework` workflow in bundle mode.
4. Return the resulting sync manifest and import summary, preserving the legacy command name in the report for audit readability.

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| sync_manifest | JSON | sync_manifest | Import record at `sync/sync_manifest.json` |
| backup | directory | â€” | Pre-import backup if requested |
| import_summary | markdown (stdout) | â€” | Compatibility summary from the delegated `/import-framework` run |

## Quality Gate
- Delegated `/import-framework` run must validate `pack_manifest.json` before writing.
- Protected local paths must not be overwritten.
- The legacy invocation must be recorded in the sync report for audit readability.

## Error Handling
- Bundle is invalid or missing `pack_manifest.json`: halt and surface the same validation error that `/import-framework` would produce.
- Backup creation fails: halt before any writes.

## Related Commands
- Preferred replacement: `/import-framework`
- Run after: `/export-framework` in bundle mode
- Related legacy commands: `/sync-framework`, `/upgrade-framework`
- Related: `/install-framework`

## Related Agents
- import-export-orchestrator
- framework-sync-agent

## Escalation Triggers
- Bundle integrity mismatch detected: always surface it explicitly before proceeding.

## Tool Adapter Notes
- **Claude Code:** Thin compatibility wrapper over `/import-framework`.
- **Codex:** Prefer invoking `/import-framework` directly for new work.
- **Windsurf:** Prefer invoking `/import-framework` directly for new work.
- **Copilot:** Prefer invoking `/import-framework` directly for new work.

