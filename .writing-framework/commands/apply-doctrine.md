# /apply-doctrine

**Phase:** 2
**Status:** stub
**Owner:** lead-orchestrator
**Category:** sync

## Purpose
Loads and applies one or more doctrine files for the current session, registering them in the run context so all agents can reference the active doctrine rules, and surfacing any conflicts between loaded doctrine and active user instructions.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| doctrine_names | array of strings or "all" | Yes | (none) | Names of doctrine files to load, or "all" to load all doctrine files from .writing-framework/doctrine/ |
| run_id | string | No | (active run) | Run context to register the loaded doctrine against |
| conflict_check | boolean | No | true | Whether to check for conflicts between loaded doctrine and current user instructions |

## Behavior
1. Validate that `doctrine_names` is provided and non-empty. If not, surface a validation error and halt.
2. **Resolve doctrine files:**
   - If `doctrine_names` is `"all"`: scan `.writing-framework/doctrine/` for all doctrine files. Build the load list from all discovered files.
   - If `doctrine_names` is an array: for each name, locate the matching file in `.writing-framework/doctrine/` (case-insensitive filename match). If a named doctrine file is not found locally, attempt to retrieve it from guide-server by calling `/find-guides type=doctrine query={name}`. If still not found, log a warning for that specific name and continue loading the others.
3. Read and parse each resolved doctrine file. Record key rules, constraints, and guidelines from each file. Identify the doctrine category for each (e.g., editorial quality, AI pattern avoidance, source standards, structural standards).
4. Check for internal conflicts between multiple loaded doctrine files: if two doctrine files make contradictory statements about the same behavior, surface the conflict with both doctrine names and the specific contradicting rules. Do not block loading on internal conflicts — surface them for awareness.
5. If `conflict_check` is true: compare the loaded doctrine rules against any active user instructions or brief-level overrides registered in the run context. If a user instruction contradicts a doctrine rule, surface the conflict per HUMAN_IN_THE_LOOP_GATES.md Gate 3 logic: present both the doctrine rule and the conflicting instruction, ask the user to confirm which takes precedence, and record the resolution.
6. Register the loaded doctrine in the run context via cache-server: list of doctrine file names, loaded_at timestamp, run_id, and any recorded conflict resolutions.
7. Output a doctrine summary:
   - List of doctrine files loaded
   - Key rules highlighted (3–5 most impactful rules per doctrine file)
   - Any inter-doctrine conflicts noted
   - Any user instruction conflicts and their resolutions
   - Any doctrine files that could not be found (gaps)

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| active_doctrine_record | JSON | — | Registered doctrine list in run context (names, paths, loaded_at) |
| doctrine_summary | markdown (stdout) | — | Formatted summary of loaded doctrine with key rules and any conflicts |

## Quality Gate
- At least one doctrine file must be successfully loaded for the command to report success.
- All loaded doctrine files must be registered in the run context before the command exits.
- Any conflict between doctrine and user instructions must be resolved (or explicitly deferred) before the command exits — never leave a doctrine conflict unresolved in an active run.

## Error Handling
- A named doctrine file cannot be found in either the filesystem or guide-server: log a gap warning. If all named doctrine files are missing, surface a B2 blocker. If some are found and some are missing, proceed with the found files and note the gaps.
- cache-server is unavailable for registration: store the active doctrine list in session context only. Log a warning that doctrine registration will not persist across session restarts.
- User instruction conflict cannot be resolved (user is unavailable or does not respond): record the conflict as unresolved in the run context. Flag it prominently so downstream agents know there is an unresolved doctrine conflict for this run.

## Related Commands
- Run after: `/session-start` (doctrine is typically loaded at session start)
- Run before: `/orchestrate-brief`, `/orchestrate-draft`
- Related: `/apply-style-pack`, `/find-guides`, `/guide-gap-check`

## Related Agents
- lead-orchestrator
- lead-editor
- guide-server (MCP tool)

## Escalation Triggers
- Conflict between a loaded doctrine rule and a user instruction that cannot be auto-resolved: escalate per HUMAN_IN_THE_LOOP_GATES.md Gate 3. Pause the current run until the user provides an explicit resolution.
- `doctrine_names: all` loads zero doctrine files (empty doctrine directory): raise a B2 blocker. An empty doctrine directory likely means the framework was not correctly installed or the `.writing-framework/doctrine/` path is wrong.

## Tool Adapter Notes
- **Claude Code:** Scans the doctrine directory with the Glob tool. Reads doctrine files with the Read tool. Registers loaded doctrine in cache-server via MCP tool call. Outputs the summary as formatted markdown.
- **Codex:** Invoke with "Apply doctrine" or "Run /apply-doctrine doctrine_names=all". Codex will load all doctrine files and present the summary.
- **Windsurf:** Invoke via AI panel. Windsurf will display the doctrine summary inline after loading.
- **Copilot:** Invoke in Copilot Chat. Specify doctrine_names in the invocation, or use "all" to load everything.
