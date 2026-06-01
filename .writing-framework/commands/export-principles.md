# /export-principles

**Phase:** 6
**Status:** active
**Owner:** import-export-orchestrator
**Category:** sync

## Purpose
Legacy compatibility surface for doctrine/style-only framework exports. Prefer `/export-framework` with `components=[doctrine, styles]`.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| output_path | string | No | sync/export-packs/ | Directory where the exported bundle will be written |
| pack_name | string | No | principles-export-{timestamp} | Name for the exported bundle directory |
| include_local_extensions | boolean | No | true | Retained for compatibility; new work should use `/export-framework` component selection |
| scope | string | No | both | One of: doctrine, style-packs, both |
| include_guide_records | boolean | No | false | Retained for compatibility; ignored unless the bundle format supports extra metadata |

## Behavior
1. Translate this invocation into `/export-framework` with:
   - `destination_path = output_path`
   - `destination_type = bundle`
   - `components = [doctrine, styles]` filtered by `scope`
   - `pack_name = pack_name`
2. Execute the `/export-framework` workflow.
3. Return the resulting export summary, preserving the legacy command name in the report for audit readability.

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| export_pack | directory | â€” | Exported doctrine/style bundle |
| pack_manifest | JSON | â€” | Bundle manifest |
| sync_manifest | JSON | sync_manifest | Export record at `sync/sync_manifest.json` |
| export_summary | markdown (stdout) | â€” | Compatibility summary from the delegated `/export-framework` run |

## Quality Gate
- Delegated `/export-framework` run must complete successfully.
- The resulting manifest must only contain doctrine/style components.

## Error Handling
- Invalid `scope`: halt with a descriptive validation error.
- Bundle directory cannot be created: halt and surface the specific path error.

## Related Commands
- Preferred replacement: `/export-framework`
- Related legacy command: `/sync-principles`
- Related: `/import-framework`

## Related Agents
- import-export-orchestrator

## Escalation Triggers
- Export would produce an empty doctrine/style bundle: surface it as a warning before writing.

## Tool Adapter Notes
- **Claude Code:** Thin compatibility wrapper over `/export-framework`.
- **Codex:** Prefer invoking `/export-framework` directly for new work.
- **Windsurf:** Prefer invoking `/export-framework` directly for new work.
- **Copilot:** Prefer invoking `/export-framework` directly for new work.

