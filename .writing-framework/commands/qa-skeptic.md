# /qa-skeptic

**Phase:** 4
**Status:** active
**Owner:** qa-skeptic
**Category:** qa

## Purpose
Review a draft from a skeptical perspective. This command produces a single-perspective `review_report.json` focused on unsupported claims, weak reasoning, padding, hedging, and conclusions that outrun the evidence.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| draft | file path or object | Yes | (none) | Draft document to review |
| brief | file path or object | No | (active brief) | Useful for interpreting document goals and success criteria |
| run_id | string | No | (active run) | Cache-server run identifier |

## Behavior
1. Load the draft and, when available, the brief.
2. Review the draft as a hostile but fair skeptic.
3. Flag:
   - unsupported factual or evaluative claims
   - weak or missing reasoning links
   - padding and empty sentences
   - over-hedging that obscures the actual point
   - conclusions that exceed what the draft establishes
4. Produce a schema-valid `review_report.json` with:
   - `perspectives_applied: ["skeptic"]`
   - issue items using `perspective: "skeptic"`
   - severity values `block|revise|note`
   - `gate_decision: ACCEPT|REVISE|BLOCK`
5. Save the report to cache-server when available.

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| review_report.json | JSON object | review_report.schema.json | Skeptic-perspective QA report |

## Quality Gate
- Every issue identifies a specific passage or location.
- Skeptic findings focus on substance, not style or grammar.
- `gate_decision` is consistent with the presence or absence of blocking issues.

## Error Handling
- Missing draft: return an input error.
- Missing brief: proceed against the draft's own claims and note the missing context.

## Related Commands
- Run with: `/qa-reader`, `/qa-domain`, `/qa-style`, `/qa-coherence`, `/qa-ai-stink`
- Run before: `/qa-final`

## Related Agents
- qa-skeptic

## Escalation Triggers
- None. This command reports findings only.
