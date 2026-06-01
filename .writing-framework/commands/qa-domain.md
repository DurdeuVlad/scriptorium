# /qa-domain

**Phase:** 4
**Status:** active
**Owner:** qa-domain
**Category:** qa

## Purpose
Review a draft for domain accuracy, correct terminology, and canon compliance. This command produces a single-perspective `review_report.json` for factual, technical, or canon-level issues.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| draft | file path or object | Yes | (none) | Draft document to review |
| brief | file path or object | No | (active brief) | Source of domain context and canon references |
| domain | string | No | (from brief) | Explicit domain override |
| run_id | string | No | (active run) | Cache-server run identifier |

## Behavior
1. Load the draft and resolve the active domain from the brief or explicit input.
2. Load any relevant canon or guide records when available.
3. Review for:
   - factual or technical inaccuracies
   - canon conflicts
   - incorrect terminology
   - outdated or incomplete domain-specific guidance
4. Produce a schema-valid `review_report.json` with:
   - `perspectives_applied: ["domain"]`
   - issue items using `perspective: "domain"`
   - severity values `block|revise|note`
   - `gate_decision: ACCEPT|REVISE|BLOCK`
5. Save the report to cache-server when available.

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| review_report.json | JSON object | review_report.schema.json | Domain-perspective QA report |

## Quality Gate
- Canon or factual conflicts that materially break correctness are marked `block`.
- Terminology findings identify the incorrect usage clearly enough to fix.
- Domain findings do not drift into style or reader-only concerns.

## Error Handling
- Missing domain context: infer conservatively and note the limitation.
- Missing draft: return an input error.

## Related Commands
- Run with: `/qa-reader`, `/qa-skeptic`, `/qa-style`, `/qa-coherence`, `/qa-ai-stink`
- Run before: `/qa-final`
- `/canon-check` may be used as a dedicated domain follow-up when needed

## Related Agents
- qa-domain

## Escalation Triggers
- None. This command reports findings only.
