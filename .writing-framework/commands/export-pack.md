# /export-pack

**Phase:** 6
**Status:** active
**Owner:** import-export-orchestrator
**Category:** sync

## Purpose
Legacy compatibility surface for bundle-based framework exports. Prefer `/export-framework`. This command maps to `/export-framework` with `destination_type: bundle`.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| scope | string | Yes | (none) | One of: doctrine, style-packs, commands, agents, workflows, schemas, guides, adapters, all |
| output_path | string | No | sync/export-packs/ | Base directory where the versioned bundle directory will be created |
| pack_name | string | No | {scope}-pack-{timestamp} | Name for the bundle directory |
| include_version | boolean | No | true | Whether to embed the local framework VERSION in the bundle manifest |
| tag | string | No | (none) | Optional version tag or label |

## Behavior
1. Validate `scope`.
2. Translate `scope` into `/export-framework` component names.
3. Execute `/export-framework` with:
   - `destination_path = output_path`
   - `destination_type = bundle`
   - `components = translated scope`
   - `pack_name = pack_name`
4. Return the resulting bundle path, `pack_manifest.json`, and export summary, preserving the legacy command name in the report for audit readability.

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| export_pack | directory | â€” | Versioned bundle at `{output_path}/{pack_name}/` |
| pack_manifest | JSON | â€” | Manifest at the bundle root |
| sync_manifest | JSON | sync_manifest | Export record at `sync/sync_manifest.json` |
| export_summary | markdown (stdout) | â€” | Compatibility summary from the delegated `/export-framework` run |

## Quality Gate
- Delegated `/export-framework` run must emit a valid `pack_manifest.json`.
- Every exported item must appear in the manifest.
- The legacy invocation must be recorded in the sync report for audit readability.

## Error Handling
- Scope cannot be translated: halt with a descriptive validation error.
- Bundle directory cannot be created: halt and surface the specific path error.

## Related Commands
- Preferred replacement: `/export-framework`
- Run before: `/import-framework` in bundle mode
- Related legacy commands: `/export-principles`
- Related: `/orchestrate-export`, `/install-framework`

## Related Agents
- import-export-orchestrator

## Escalation Triggers
- Export would produce an empty bundle: surface it as a warning before writing.

## Tool Adapter Notes
- **Claude Code:** Thin compatibility wrapper over `/export-framework`.
- **Codex:** Prefer invoking `/export-framework` directly for new work.
- **Windsurf:** Prefer invoking `/export-framework` directly for new work.
- **Copilot:** Prefer invoking `/export-framework` directly for new work.

