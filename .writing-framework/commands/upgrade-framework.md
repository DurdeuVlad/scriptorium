# /upgrade-framework

**Phase:** 6
**Status:** active
**Owner:** framework-sync-agent
**Category:** sync

## Purpose
Advanced compatibility surface for versioned upgrades. Prefer `/import-framework` for normal framework updates. Use this command only when migration rules must be applied during an upgrade.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| framework_path | string | Yes | (none) | Absolute path to the newer framework repo |
| framework_version | string | No | (read from source) | Expected target framework version |
| components | array of strings | No | [doctrine, styles, commands, agents, workflows, schemas, templates, guides, adapters] | Limit upgrade to specific components |
| dry_run | boolean | No | false | If true, preview the upgrade without writing |
| backup | boolean | No | true | Create a timestamped backup before applying changes |

## Behavior
1. Validate `framework_path`.
2. Read any available migration rules from `sync/migration-rules/`.
3. Run `/import-framework` with:
   - `source_path = framework_path`
   - `components = components`
   - `conflict_resolution_mode = ask`
   - `dry_run = dry_run`
   - `backup = backup`
4. Collect the sync manifest from `/import-framework`.
5. Apply any matching migration rules to the imported framework state.
6. Write an `upgrade_report` summarizing imported components, migrations applied, unresolved manual steps, and final version status.

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| sync_manifest | JSON | sync_manifest | Upgrade import record at `sync/sync_manifest.json` |
| upgrade_report | markdown | â€” | Migration-aware upgrade summary |
| backup | directory | â€” | Pre-upgrade backup if requested |

## Quality Gate
- Delegated `/import-framework` run must complete successfully.
- All applicable migration rules must be recorded in the upgrade report.
- Protected local paths must not be overwritten.

## Error Handling
- Migration rules are missing for a required version jump: halt and surface the missing migration.
- `/import-framework` fails: halt and surface the delegated error.

## Related Commands
- Preferred replacement for normal updates: `/import-framework`
- Related legacy commands: `/sync-framework`, `/sync-principles`
- Related: `/install-framework`

## Related Agents
- framework-sync-agent

## Escalation Triggers
- A migration rule marks the upgrade as breaking: require explicit confirmation before applying non-dry-run changes.

## Tool Adapter Notes
- **Claude Code:** Delegates core sync logic to `/import-framework`, then applies migration rules.
- **Codex:** Prefer invoking `/import-framework` directly unless migration rules are required.
- **Windsurf:** Prefer invoking `/import-framework` directly unless migration rules are required.
- **Copilot:** Prefer invoking `/import-framework` directly unless migration rules are required.

