# /qa-ai-stink

**Phase:** 4
**Status:** active
**Owner:** qa-ai-stink
**Category:** qa

## Purpose
Review a draft for machine-generated or generic-AI language patterns. This command produces a single-perspective `review_report.json` focused on filler phrasing, hollow transitions, unearned gravitas, and other doctrine-defined AI-stink patterns.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| draft | file path or object | Yes | (none) | Draft document to review |
| run_id | string | No | (active run) | Cache-server run identifier |

## Behavior
1. Load the draft and the AI-stink guidance from doctrine/voice rules when available.
2. Review for:
   - generic filler phrases
   - oversmooth or formulaic transitions
   - suspiciously balanced conclusions
   - hedge clusters
   - noun-heavy or corporate cadence
   - repetitive machine-like phrasing patterns
3. Produce a schema-valid `review_report.json` with:
   - `perspectives_applied: ["ai-stink"]`
   - issue items using `perspective: "ai-stink"`
   - severity values `block|revise|note`
   - `gate_decision: ACCEPT|REVISE|BLOCK`
4. Save the report to cache-server when available.

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| review_report.json | JSON object | review_report.schema.json | AI-stink-perspective QA report |

## Quality Gate
- Each issue identifies the flagged passage or location specifically.
- Findings align with doctrine-defined AI-stink concerns rather than generic stylistic taste.
- Severe, pervasive AI-stink is reflected in `gate_decision`.

## Error Handling
- Missing draft: return an input error.
- Very short draft: proceed but note the limited surface area.

## Related Commands
- Run with: `/qa-reader`, `/qa-skeptic`, `/qa-domain`, `/qa-style`, `/qa-coherence`
- Run before: `/qa-final`

## Related Agents
- qa-ai-stink

## Escalation Triggers
- None. This command reports findings only.
