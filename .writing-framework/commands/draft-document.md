# /draft-document

**Phase:** 3
**Status:** active
**Owner:** lead-orchestrator
**Category:** editorial

## Purpose
Orchestrate the complete drafting pass for a document: draft each section from the outline, preserve partial progress, then merge the section drafts into a unified draft and merge report.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| outline | file path or object | No | (active outline) | Validated outline to execute |
| brief | file path or object | No | (active brief) | Context for all drafted sections |
| research_report | file path or object | No | (most recent) | Optional shared research context |
| parallel | boolean | No | false | Whether section drafting should be dispatched in parallel when the environment supports it |
| run_id | string | No | (active run) | Cache-server run identifier |

## Behavior
1. Load and validate the active outline and brief.
2. Build the section drafting plan from `outline.sections`.
3. For each section:
   - invoke `/draft-section`
   - save the section result to cache-server
   - create resume-friendly partial progress after each completed section
4. If one section fails, continue drafting unaffected sections and preserve a partial draft state.
5. Invoke `/merge-draft` with the completed section drafts and the active brief.
6. Save the merged draft and merge report to cache-server.
7. Run the Draft Gate before returning:
   - all sections are present or explicitly marked blocked
   - no undocumented placeholders remain
   - merge-report status matches the assembled draft
8. Return the merged draft plus section-to-artifact mappings for traceability.

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| merged_draft | markdown | none | Full assembled document draft |
| merge_report | JSON object | merge_report.schema.json | Merge-normalizer output |
| section_artifacts | JSON object | none | Mapping of `section_id` to artifact identifiers or paths |

## Quality Gate
- Every section in the outline is accounted for.
- Partial failures are documented instead of silently dropped.
- The merged draft is reviewable and matches the merge report.

## Error Handling
- Invalid outline: stop and return validation errors.
- Section-level draft failure: preserve successful sections, create blocker and resume point, continue where possible.
- Merge failure: return the merge failure, preserve section drafts, and provide a resume path.

## Related Commands
- Run after: `/write-outline`, `/validate-outline`
- Calls: `/draft-section`, `/merge-draft`
- Run before: review and QA commands

## Related Agents
- lead-orchestrator
- section-drafter
- merge-normalizer

## Escalation Triggers
- More than half the planned sections are blocked.
- The brief and outline conflict strongly enough that drafting cannot continue safely.

## Tool Adapter Notes
- **Claude Code:** Coordinates per-section drafting, records progress, and returns the merged result.
- **Codex:** Invoke with "Run /draft-document" using the active brief and outline.
- **Windsurf:** Invoke through the command adapter.
- **Copilot:** Invoke in chat using the active run context.
