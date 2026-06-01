# /rewrite

**Phase:** 3
**Status:** active
**Owner:** section-drafter
**Category:** editorial

## Purpose
Apply a structured `rewrite_plan` to an existing draft without redoing unaffected content. This is the primary revision surface after QA findings, review feedback, or focused user changes.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| rewrite_plan | file path or object | Yes | (none) | Must validate against `rewrite_plan.schema.json` |
| draft | file path or object | No | (active draft) | Draft to revise |
| run_id | string | No | (active run) | Cache-server run identifier |

## Behavior
1. Load and validate the `rewrite_plan`.
2. Load the target draft.
3. Apply revisions in priority order using the current schema vocabulary:
   - `cut`
   - `rewrite`
   - `expand`
   - `restructure`
   - `voice-fix`
   - `fact-check`
   - `canon-fix`
4. Restrict edits to the scopes named in the plan unless the plan explicitly requires broader structural change.
5. Re-check revised areas for structural integrity, coherence, and obvious style drift.
6. Save the revised draft and revision summary to cache-server.

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| revised_draft | markdown | none | Updated draft document |
| changes_summary | markdown or JSON | none | Applied revisions, skipped revisions, and rationale |

## Quality Gate
- Every revision in the plan is either applied or explicitly skipped with justification.
- Non-targeted content remains unchanged unless a restructuring revision requires movement.
- Revised regions remain consistent with the outline, brief, and documented intent of the rewrite plan.

## Error Handling
- Invalid rewrite plan: stop and return validation errors.
- Missing target scope: skip that revision, record it in the changes summary, and continue with the remaining revisions.
- Revision causes structural breakage: stop, preserve the prior draft, and return the failing change.

## Related Commands
- Run after: `/qa-final`, `/orchestrate-review`, focused user revision requests
- Run before: another QA pass, `/line-edit`, `/voice-pass`

## Related Agents
- section-drafter
- clarity-editor

## Escalation Triggers
- The rewrite plan effectively replaces most of the document and should become a re-draft instead.
- Fact-check or canon-fix revisions require source material that is still missing.

## Tool Adapter Notes
- **Claude Code:** Applies the plan to the current draft and records the revision result.
- **Codex:** Invoke with "Run /rewrite" and provide the rewrite plan.
- **Windsurf:** Invoke through the command adapter.
- **Copilot:** Invoke in chat using the active draft and plan.
