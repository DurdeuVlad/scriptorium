# /discovery-agent

**Phase:** 2
**Status:** stub
**Owner:** discovery-agent
**Category:** discovery

## Purpose
Run a targeted discovery pass against a specific scope — a single directory, file set, or topic — without running a full project discovery. Used when additional context is needed mid-task without restarting the full discovery workflow.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| scope | string | Yes | (none) | What to inspect: file path, directory name, topic keyword, or named artifact type |
| question | string | No | (none) | Specific question the discovery should answer |

## Behavior
1. Receive `scope` argument. Determine what to read:
   - If `scope` is a file path: read that file and extract all editorial context from it.
   - If `scope` is a directory: list and read all files within it.
   - If `scope` is an artifact type (e.g., "brief", "outline", "draft"): find all matching artifacts in the project.
   - If `scope` is a topic keyword: search `guides/` and `doctrine/` for matching content.
2. If a `question` argument was provided, focus the discovery pass on answering that specific question.
3. Extract: confirmed facts, inferred context, uncertainties.
4. Produce a targeted discovery note — shorter than a full discovery report, but using the same four-section structure: Confirmed Context, Inferred Context, Assumptions, and any Blockers.
5. Return the targeted discovery note to the calling command or agent.

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| targeted_discovery_note | markdown (stdout) | none | Scoped discovery result, four-section format |

## Quality Gate
- Scope must be resolvable — if `scope` matches nothing, report what was searched and recommend alternatives.
- Targeted note must use the same four-section structure as the full discovery report.

## Error Handling
- Scope resolves to no readable files: report this; suggest a broader scope or a different artifact type.
- Question cannot be answered from the scoped content: produce what was found and note the gap explicitly.

## Related Commands
- `/discovery` — full project discovery
- `/requirements-brief` — uses discovery output to produce a requirements brief

## Related Agents
- discovery-agent

## Escalation Triggers
- None. This command always produces output even if partial.

## Tool Adapter Notes
- **Claude Code:** Reads specific files or directories as directed by the scope argument.
- **Codex:** Invoke with "Run /discovery-agent [scope]" or "Inspect [scope] for context".
- **Windsurf:** Invoke via AI panel with a specific scope target.
- **Copilot:** Invoke in Copilot Chat with a file path or topic as scope.
