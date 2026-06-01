# /project-scan

**Phase:** 2
**Status:** stub
**Owner:** discovery-agent
**Category:** foundation

## Purpose
Scan the current project directory for editorial context — existing artifacts, loaded guides, active style packs, and prior runs. Produces a structured snapshot of the project's current state.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| scope | string | No | full | Options: full, artifacts, guides, runs, styles |
| path | string | No | cwd | Root directory to scan |

## Behavior
1. Scan `styles/` — list all style pack files. Identify the active style pack (from CLAUDE.md or session context).
2. Scan `guides/` — list all guide files by type. Count by category: doctrine, style_pack, canon, template, rubric, example, anti_pattern, decision_record.
3. Scan `doctrine/` — list all doctrine files by filename.
4. Scan `artifacts/` — list all artifacts. For each: name, type, format, creation date, status (draft/final/exported).
5. Scan `logs/` — list recent run records. For each: run ID, started, phase, status.
6. Scan `schemas/` — list schema files present.
7. Scan `workflows/` — list workflow definition files.
8. Scan `templates/` — list available templates.
9. Produce a structured project scan report with sections for each category above.
10. Flag any anomalies: missing directories, empty required directories, orphaned artifacts (no matching run), schema files without matching commands.

If `scope` argument is provided, restrict scan to that category only.

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| scan_report | markdown (stdout) | none | Human-readable project snapshot |
| artifact_inventory | list | none | Summary of all artifacts found |
| guide_inventory | list | none | Summary of all guides found |
| run_history | list | none | Summary of recent runs |

## Quality Gate
- Scan must cover all listed directories.
- Any unreadable directory must be reported (not silently skipped).

## Error Handling
- Directory not found: note in report as "missing" — do not fail the scan.
- File read errors: log specific file, continue scan, append error list to report footer.
- No artifacts found: note this explicitly — do not omit the section.

## Related Commands
- Run after: `/session-start`
- Run before: `/discovery`
- `/status` — for run-level status

## Related Agents
- discovery-agent

## Escalation Triggers
- If critical directories (`doctrine/`, `schemas/`, `core/commands/`) are missing or empty: surface a warning and recommend framework setup steps.

## Tool Adapter Notes
- **Claude Code:** Uses filesystem tools to read directory listings. Renders scan report in chat.
- **Codex:** Invoke with "Scan this project" or "Run /project-scan". Codex performs directory reads.
- **Windsurf:** Invoke via AI panel. Windsurf has native file tree access.
- **Copilot:** Invoke in Copilot Chat. Copilot reads the workspace file tree.
