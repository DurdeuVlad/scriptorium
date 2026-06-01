# /sync-principles

**Phase:** 6
**Status:** active
**Owner:** framework-sync-agent
**Category:** sync

## Purpose
Legacy compatibility surface for two-way doctrine/style alignment. Prefer `/import-framework` for pulling updates and `/export-framework` for publishing updates.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| source_framework_path | string | Yes | (none) | Absolute path to the source framework repo |
| conflict_resolution_mode | string | Yes | (none) | One of: ask, prefer-local, prefer-source |
| scope | string | No | both | One of: doctrine, style-packs, both |
| dry_run | boolean | No | false | If true, preview the import phase without writing |
| export_output_path | string | No | sync/export-packs/ | Where to write the compatibility export bundle |

## Behavior
1. Validate `source_framework_path`.
2. Translate the import side into `/import-framework` with `components=[doctrine, styles]`.
3. Translate the export side into `/export-framework` with `components=[doctrine, styles]` and `destination_type=bundle`.
4. Execute the two phases in sequence, preserving the legacy command name in the combined manifest and summary.

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| sync_manifest | JSON | sync_manifest | Combined compatibility record at `sync/sync_manifest.json` |
| sync_summary | markdown (stdout) | â€” | Import/export summary for doctrine/style compatibility mode |

## Quality Gate
- Both delegated phases must complete successfully.
- The combined manifest must only contain doctrine/style components.

## Error Handling
- Import phase fails: halt before export and surface the delegated error.
- Export phase fails: preserve the import results and surface the delegated error.

## Related Commands
- Preferred replacements: `/import-framework`, `/export-framework`
- Component legacy commands: `/import-principles`, `/export-principles`

## Related Agents
- framework-sync-agent
- import-export-orchestrator

## Escalation Triggers
- Any doctrine/style conflict remains unresolved after the import phase: surface it before starting the export phase.

## Tool Adapter Notes
- **Claude Code:** Legacy wrapper that chains `/import-framework` and `/export-framework`.
- **Codex:** Prefer invoking `/import-framework` and `/export-framework` directly for new work.
- **Windsurf:** Prefer invoking `/import-framework` and `/export-framework` directly for new work.
- **Copilot:** Prefer invoking `/import-framework` and `/export-framework` directly for new work.

