# /qa-coherence

**Phase:** 4
**Status:** active
**Owner:** qa-coherence
**Category:** qa

## Purpose
Review a draft for structural logic, internal consistency, and flow. This command produces a single-perspective `review_report.json` focused on contradictions, broken transitions, missing support steps, and scope drift.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| draft | file path or object | Yes | (none) | Draft document to review |
| brief | file path or object | No | (active brief) | Context for purpose and scope |
| outline | file path or object | No | (active outline) | Useful for checking structure against planned sections |
| run_id | string | No | (active run) | Cache-server run identifier |

## Behavior
1. Load the draft and any available brief/outline context.
2. Review for:
   - contradictions within the draft
   - missing transitions or broken flow
   - argument or reasoning gaps
   - sections that drift outside the established scope
   - conclusions that do not follow from the body
3. Produce a schema-valid `review_report.json` with:
   - `perspectives_applied: ["coherence"]`
   - issue items using `perspective: "coherence"`
   - severity values `block|revise|note`
   - `gate_decision: ACCEPT|REVISE|BLOCK`
4. Save the report to cache-server when available.

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| review_report.json | JSON object | review_report.schema.json | Coherence-perspective QA report |

## Quality Gate
- Contradictions are identified specifically enough to locate both ends of the conflict.
- Coherence findings stay focused on structure and logic rather than style or factual accuracy alone.
- `gate_decision` follows from the severity mix in the report.

## Error Handling
- Missing draft: return an input error.
- Missing brief or outline: proceed with the draft alone and note the missing structural context.

## Related Commands
- Run with: `/qa-reader`, `/qa-skeptic`, `/qa-domain`, `/qa-style`, `/qa-ai-stink`
- Run before: `/qa-final`

## Related Agents
- qa-coherence

## Escalation Triggers
- None. This command reports findings only.
