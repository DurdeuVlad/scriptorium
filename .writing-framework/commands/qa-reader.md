# /qa-reader

**Phase:** 4
**Status:** active
**Owner:** qa-reader
**Category:** qa

## Purpose
Review a draft from the intended reader's perspective. This command produces a single-perspective `review_report.json` that captures clarity problems, assumed knowledge, confusing structure, and reader-friction issues.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| draft | file path or object | Yes | (none) | Draft document to review |
| brief | file path or object | No | (active brief) | Needed to establish audience, knowledge level, and reader needs |
| run_id | string | No | (active run) | Cache-server run identifier |

## Behavior
1. Load the draft and the active brief.
2. Infer the intended reader from `brief.audience`.
3. Evaluate the draft for:
   - assumed knowledge the audience would not reasonably have
   - unclear passages or logic jumps
   - missing context or undefined terms
   - structure that does not serve the reader's goal
4. Produce a schema-valid `review_report.json` using the current review-report contract:
   - `review_id`
   - `draft_ref`
   - `brief_id` when available
   - `run_id`
   - `perspectives_applied: ["reader"]`
   - `issues` with `perspective: "reader"` and `severity: block|revise|note`
   - `gate_decision: ACCEPT|REVISE|BLOCK`
   - `gate_justification`
   - counts and metadata
5. Save the report to cache-server as a QA output when available.

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| review_report.json | JSON object | review_report.schema.json | Reader-perspective QA report |

## Quality Gate
- Every issue includes `location`, `description`, and `severity`.
- Reader-perspective findings stay within reader concerns, not domain/style concerns.
- `gate_decision` follows from the issue set.

## Error Handling
- Missing brief: evaluate using the draft's implied reader and note the limitation.
- Missing draft: return an input error.

## Related Commands
- Run with: `/qa-skeptic`, `/qa-domain`, `/qa-style`, `/qa-coherence`, `/qa-ai-stink`
- Run before: `/qa-final`

## Related Agents
- qa-reader

## Escalation Triggers
- None. This command reports findings only.
