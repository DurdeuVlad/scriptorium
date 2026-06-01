# /orchestrate-brief

**Phase:** 3
**Status:** stub
**Owner:** lead-orchestrator
**Category:** orchestration

## Purpose
Orchestrate full brief production: from raw project context through discovery, requirements extraction, brief writing, and brief validation. Returns a validated brief and a summary of the orchestration run.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| context | string | No | (none) | Freetext description of the project |
| domain | string | No | (inferred) | Domain override |

## Behavior
1. Invoke `lead-orchestrator` to manage the following sequence:
2. **Step 1 - Session Start:** Run `/session-start` if no active session exists.
3. **Step 2 - Discovery:** Run `/discovery` to gather full project context.
4. **Step 3 - Blocker check:** Review the discovery report. If there are `must_ask` blockers, surface them to the user and collect responses. Apply responses to the context. Continue all unblocked work in parallel.
5. **Step 4 - Requirements Brief:** Run `/requirements-brief` using the discovery report and any user-provided context.
6. **Step 5 - Brief writing:** Run `/write-brief` using the requirements brief.
7. **Step 6 - Brief validation:** Run `/validate-brief` against the produced brief to check both schema compliance and the Brief Gate.
8. **Gate:** If the validation report passes, advance. If it fails, apply one revision pass and re-run `/validate-brief`.
9. Output the final validated brief and a summary of the orchestration run.

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| brief | JSON + markdown | brief | Schema-validated project brief |
| orchestration_summary | markdown (stdout) | none | Steps completed, gate result, and recommended next command |

## Quality Gate
- Brief must pass schema validation.
- Brief must pass the Brief Gate.
- A failed validation after the revision pass requires user intervention before proceeding.

## Error Handling
- Discovery produces no usable context: surface the specific gaps; proceed with what is available.
- Brief schema validation fails: report specific failing fields; do not deliver an invalid brief.
- User cannot resolve a blocker during the orchestration: produce the best partial brief achievable; note residual gaps.

## Related Commands
- Run after: `/session-start`
- Run before: `/orchestrate-outline`
- Component commands: `/discovery`, `/requirements-brief`, `/write-brief`, `/validate-brief`

## Related Agents
- lead-orchestrator
- brief-writer
- discovery-orchestrator

## Escalation Triggers
- If two or more `must_ask` blockers remain unresolved after one round of user interaction: deliver a partial brief with all resolvable fields complete and list the gaps.

## Tool Adapter Notes
- **Claude Code:** Orchestrates by invoking component slash commands in sequence. Tracks state in session context.
- **Codex:** Invoke with "Orchestrate the brief" or "Run /orchestrate-brief".
- **Windsurf:** Invoke via AI panel.
- **Copilot:** Invoke in Copilot Chat.
