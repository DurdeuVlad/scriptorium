# /status

**Phase:** 2
**Status:** stub
**Owner:** lead-orchestrator
**Category:** foundation

## Purpose
Show the status of the current or most recent run — what phase it is in, what has been completed, what is pending, and what is blocked.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| run_id | string | No | (active run) | If omitted, use active run from session context; if no active run, use most recent from logs/ |

## Behavior
1. (Phase 2+) Query `cache-server` for the active or specified run. If found, retrieve full run state: run ID, phase, completed steps, pending steps, open blockers, artifacts produced.
2. (Phase 1) Read `logs/` directory for the most recent run record. Parse whatever state is stored there.
3. Render status report:
   - Run ID
   - Phase (current)
   - Completed steps (list)
   - Pending steps (list)
   - Open blockers (list with blocker type and description)
   - Artifacts produced (list with paths)
   - Elapsed time since run start (if available)
   - Recommended next action (single line)
4. If no active run and no recent run found in logs/: display a "no active run" message and recommend `/session-start` or `/discovery`.

**Phase 1 behavior:** Show a message that run state tracking requires cache-server (Phase 2). Show what can be inferred from the filesystem: presence of artifacts, presence of log files, doctrine load state.

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| status_report | markdown (stdout) | none | Human-readable run status |

## Quality Gate
- Status report must always include a recommended next action.
- Open blockers must be listed explicitly, never suppressed.

## Error Handling
- `cache-server` unreachable (Phase 2+): fall back to `logs/` scan and note degraded state.
- `run_id` not found: report which run IDs are available and ask user to clarify.
- No run history at all: tell user no runs have been recorded yet.

## Related Commands
- Run after: `/session-start`
- `/whats-next` — for recommendation without full status report
- `/project-scan` — for broader project state

## Related Agents
- lead-orchestrator

## Escalation Triggers
- If a run has been in the same phase for an unexpectedly long time (Phase 2+): surface this and ask user if intervention is needed.
- If blocking issues are present: list them and ask user how to proceed.

## Tool Adapter Notes
- **Claude Code:** Phase 1 uses filesystem reads. Phase 2 uses cache-server MCP tools.
- **Codex:** Invoke with "Show run status" or "Run /status". Reads logs/ if cache-server not available.
- **Windsurf:** Invoke via AI panel. Reads available run state from workspace.
- **Copilot:** Invoke in Copilot Chat. Reads logs/ and surfaces available state.
