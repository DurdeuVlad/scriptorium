# /whats-next

**Phase:** 2
**Status:** stub
**Owner:** lead-orchestrator
**Category:** foundation

## Purpose
Given the current project state, recommend the single most valuable next action the user should take. Surfaces the clearest path forward without requiring the user to understand the full workflow.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| run_id | string | No | (active run) | Run to evaluate |
| context | string | No | (none) | Optional freetext context to influence recommendation |

## Behavior
1. Load current run state (from cache-server Phase 2+, or logs/ Phase 1).
2. Inspect project filesystem: what artifacts exist, what schemas are satisfied, what gates have passed.
3. Identify the current phase and the lowest-completed step within it.
4. Evaluate pending blockers. If any are present, the recommended action is always to address the highest-priority blocker first.
5. Apply recommendation logic:
   - If no run is active and no brief exists: recommend `/discovery` or `/session-start`.
   - If discovery report exists but no brief: recommend `/write-brief`.
   - If brief exists but no outline: recommend `/write-outline`.
   - If outline exists but no draft: recommend `/draft-document`.
   - If draft exists but no QA: recommend `/qa-final` or `/orchestrate-review`.
   - If QA complete but no final: recommend `/orchestrate-finalize`.
   - If blockers present: recommend resolving the specific blocker.
6. Output: a single recommended command, with a 2–3 sentence justification explaining why this is the most valuable next step.

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| recommendation | markdown (stdout) | none | Single recommended command + justification |

## Quality Gate
- Must always output exactly one recommendation.
- Recommendation must name a specific command (not a vague description).
- Justification must reference specific project state (not generic advice).

## Error Handling
- If state is entirely ambiguous (no artifacts, no runs, no doctrine): recommend `/session-start` as the safe default.
- Never output more than one recommendation — choose the highest priority.

## Related Commands
- Run after: `/status`
- Often followed by: whichever command is recommended

## Related Agents
- lead-orchestrator

## Escalation Triggers
- None. This command always produces a recommendation; it never escalates. If the situation is genuinely ambiguous, it recommends `/session-start` and asks user to clarify goals.

## Tool Adapter Notes
- **Claude Code:** Uses filesystem inspection plus session context. Reads current run state directly.
- **Codex:** Invoke with "What should I do next?" or "Run /whats-next".
- **Windsurf:** Invoke via AI panel. Windsurf's file tree context informs the recommendation.
- **Copilot:** Invoke in Copilot Chat. Copilot uses workspace context to produce the recommendation.
