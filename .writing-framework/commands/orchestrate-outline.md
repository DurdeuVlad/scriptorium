# /orchestrate-outline

**Phase:** 3
**Status:** stub
**Owner:** lead-orchestrator
**Category:** orchestration

## Purpose
Orchestrate full outline production: from a validated brief through outline writing and outline QA. Returns a validated document outline ready for drafting.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| brief | file path or string | No | (active brief) | Validated brief to outline from |

## Behavior
1. Load the active brief. Validate it against the `brief` schema. If invalid, stop and report the errors.
2. **Step 1 — Guide retrieval:** (Phase 2+) Query guide-server for templates, examples, and anti-patterns for the brief's domain. Load applicable results.
3. **Step 2 — Outline writing:** Run `/write-outline` using the brief and any loaded templates.
4. **Step 3 — Outline QA:** Evaluate the outline against:
   - Structural soundness: does the section sequence argue for the brief's goal?
   - Scope coverage: does the outline cover all brief success criteria?
   - Estimated scope: is the total estimated word count within brief constraints?
   - Section distinctness: no two sections share the same stated purpose.
5. **Gate:** If all checks pass: advance. If issues found: apply one revision pass and re-evaluate.
6. Output the final validated outline and an orchestration summary.

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| outline | JSON + markdown | outline | Schema-validated document outline |
| orchestration_summary | markdown (stdout) | none | Steps completed, gate result, recommended next command |

## Quality Gate
- Outline must pass `outline` schema validation.
- All brief success criteria must be addressable from the outline sections.
- Outline QA checks must all pass or have noted resolutions.

## Error Handling
- Brief not found or invalid: report errors; recommend `/orchestrate-brief` if brief needs to be produced.
- Outline schema fails after revision: report the persistent failures; do not deliver an invalid outline.

## Related Commands
- Run after: `/orchestrate-brief`
- Run before: `/orchestrate-draft`

## Related Agents
- lead-orchestrator
- outline-architect

## Escalation Triggers
- If scope cannot fit the brief's constraints in a single document: surface this and ask user whether to split or adjust scope.

## Tool Adapter Notes
- **Claude Code:** Orchestrates by invoking `/write-outline` and running evaluation passes.
- **Codex:** Invoke with "Orchestrate the outline" or "Run /orchestrate-outline".
- **Windsurf:** Invoke via AI panel.
- **Copilot:** Invoke in Copilot Chat.
