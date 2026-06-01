# /session-start

**Phase:** 2
**Status:** stub
**Owner:** lead-orchestrator
**Category:** foundation

## Purpose
Initialize a working session by loading doctrine, scanning for active runs, and surfacing the recommended next action. Establishes the operating context for all subsequent commands in the session.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| run_id | string | No | (none) | If provided, resume a specific run by ID |
| project | string | No | (inferred) | Project identifier; inferred from cwd if not specified |

## Behavior
1. Read `CLAUDE.md` from the project root. Extract: framework version, active style pack, current phase, any flagged blockers.
2. Read all files from `doctrine/`. Note: load order is alphabetical. Doctrine is active for the entire session.
3. Scan `logs/` for recent run records. Identify the most recent run by timestamp. Extract: run ID, phase, status, last action.
4. (Phase 2+) Query `cache-server` for any currently active runs. If an active run is found and no `run_id` was specified, surface it as the recommended context.
5. If a `run_id` argument was given, load that specific run's state from cache-server (Phase 2+) or `logs/` (Phase 1).
6. Load active style pack from `styles/` if specified in CLAUDE.md. Confirm it is readable.
7. Produce a session context summary:
   - Framework version
   - Doctrine files loaded (list by filename)
   - Active style pack (or "none")
   - Active run ID and current phase (or "no active run")
   - Recommended next step (single command with brief justification)
8. Output the summary to the user.

**Phase 1 behavior:** Steps 1–2 and 6–8 only. Skip cache-server query. Infer recommended next step from filesystem state alone.

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| session_context | markdown (stdout) | none | Rendered summary of session state |
| active_run_id | string | none | Written to session memory for use by subsequent commands |
| loaded_doctrine | string[] | none | List of doctrine filenames confirmed loaded |

## Quality Gate
- Doctrine must load without errors. If any doctrine file fails to read, block session start and report the specific file.
- If CLAUDE.md is missing, warn but do not block — the session can proceed with doctrine only.

## Error Handling
- `CLAUDE.md` not found: warn user, continue with doctrine load only.
- `doctrine/` empty or missing: warn user that no doctrine is loaded; note this may affect command behavior.
- `logs/` not readable: skip run history scan, note absence in summary.
- `cache-server` unreachable (Phase 2+): fall back to `logs/` scan, note degraded state in summary.
- Style pack specified in CLAUDE.md but not found in `styles/`: warn user and list available style packs.

## Related Commands
- Run before: all other commands (this is the session initializer)
- `/status` — for mid-session run status check
- `/project-scan` — for deeper project context scan

## Related Agents
- lead-orchestrator

## Escalation Triggers
- If multiple active runs are found and no `run_id` was specified: list all active runs and ask user to select one or start a new session.
- If doctrine conflicts are detected (Phase 2+): surface the conflicts and ask user to resolve before proceeding.

## Tool Adapter Notes
- **Claude Code:** Reads filesystem directly. Session context is held in Claude's active context window.
- **Codex:** Invoke by prompting "Start a session" or "Run /session-start". Codex reads CLAUDE.md and doctrine/ files.
- **Windsurf:** `.windsurfrules` loads doctrine automatically. `/session-start` supplements with run state and recommendations.
- **Copilot:** Invoke in Copilot Chat. Copilot reads CLAUDE.md and doctrine/ via `copilot-instructions.md` persistent context.
