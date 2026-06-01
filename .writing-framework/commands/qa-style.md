# /qa-style

**Phase:** 4
**Status:** active
**Owner:** qa-style
**Category:** qa

## Purpose
Review a draft for style-pack compliance. This command produces a single-perspective `review_report.json` covering tone, voice, formatting, prohibited vocabulary, and other style-pack rules.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| draft | file path or object | Yes | (none) | Draft document to review |
| brief | file path or object | No | (active brief) | Source of the active style pack |
| style_pack | string | No | (from brief) | Explicit style-pack override |
| run_id | string | No | (active run) | Cache-server run identifier |

## Behavior
1. Load the draft and resolve the active style pack.
2. Review the draft against style-pack requirements:
   - voice and tone consistency
   - prohibited or preferred terminology
   - formatting and structural conventions
   - style-specific anti-patterns
3. Produce a schema-valid `review_report.json` with:
   - `perspectives_applied: ["style"]`
   - issue items using `perspective: "style"`
   - severity values `block|revise|note`
   - `gate_decision: ACCEPT|REVISE|BLOCK`
4. Save the report to cache-server when available.

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| review_report.json | JSON object | review_report.schema.json | Style-perspective QA report |

## Quality Gate
- Explicit style-pack prohibitions are listed individually.
- Style findings cite a concrete deviation, not a generic preference.
- The report stays within style concerns rather than content accuracy.

## Error Handling
- Missing style pack: fall back to baseline style evaluation and note the limitation.
- Missing draft: return an input error.

## Related Commands
- Run with: `/qa-reader`, `/qa-skeptic`, `/qa-domain`, `/qa-coherence`, `/qa-ai-stink`
- Run before: `/qa-final`

## Related Agents
- qa-style

## Escalation Triggers
- None. This command reports findings only.
