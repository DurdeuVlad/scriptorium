# /import-principles

**Phase:** 6
**Status:** active
**Owner:** framework-sync-agent
**Category:** sync

## Purpose
Legacy compatibility surface for doctrine/style-only framework imports. Prefer `/import-framework` with `components=[doctrine, styles]`.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| source_path | string | Yes | (none) | Absolute path to the source framework repo or bundle |
| scope | string | No | both | One of: doctrine, style-packs, both |
| conflict_resolution_mode | string | Yes | (none) | One of: ask, prefer-local, prefer-source |
| dry_run | boolean | No | false | If true, report what would change without writing anything |

## Behavior
1. Translate this invocation into `/import-framework` with:
   - `source_path = source_path`
   - `components = [doctrine, styles]` filtered by `scope`
   - `conflict_resolution_mode = conflict_resolution_mode`
   - `dry_run = dry_run`
2. Execute the `/import-framework` workflow.
3. Return the resulting sync manifest and summary, preserving the legacy command name in the report for audit readability.

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| sync_manifest | JSON | sync_manifest | Import record at `sync/sync_manifest.json` |
| import_summary | markdown (stdout) | â€” | Compatibility summary from the delegated `/import-framework` run |

## Quality Gate
- Delegated `/import-framework` run must complete successfully.
- The resulting manifest must only contain doctrine/style components.

## Error Handling
- Invalid `scope`: halt with a descriptive validation error.
- Invalid source path: halt and surface the delegated validation error.

## Related Commands
- Preferred replacement: `/import-framework`
- Related legacy command: `/sync-principles`
- Related: `/apply-doctrine`, `/apply-style-pack`

## Related Agents
- framework-sync-agent

## Escalation Triggers
- More than 10 doctrine/style conflicts are detected: surface a summarized conflict report before proceeding.

## Tool Adapter Notes
- **Claude Code:** Thin compatibility wrapper over `/import-framework`.
- **Codex:** Prefer invoking `/import-framework` directly for new work.
- **Windsurf:** Prefer invoking `/import-framework` directly for new work.
- **Copilot:** Prefer invoking `/import-framework` directly for new work.

