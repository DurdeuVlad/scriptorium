# /qa-final

**Phase:** 4
**Status:** active
**Owner:** qa-final
**Category:** qa

## Purpose
Aggregate QA outputs and issue the formal QA gate result. This command consumes the perspective reports and produces a schema-valid `quality_gate.json` that determines whether the document may advance.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| draft | file path or object | Yes | (none) | Draft document being evaluated |
| perspective_reports | array of file paths or objects | No | (most recent reports from this run) | Reader, skeptic, domain, style, coherence, and ai-stink reports |
| brief | file path or object | No | (active brief) | Used to evaluate success criteria and scope |
| run_id | string | No | (active run) | Cache-server run identifier |

## Behavior
1. Load all available perspective reports and the active brief.
2. Confirm required QA coverage; if reports are missing, treat that as a gate failure rather than silently closing the gate.
3. Aggregate issue severity across the reports.
4. Map the aggregated result to the `quality_gate.schema.json` contract:
   - `gate_id`
   - `phase: "qa"`
   - `run_id`
   - `artifact_ref`
   - `decision: PASS|FAIL|OVERRIDE`
   - `criteria_results`
   - `unmet_criteria`
   - `next_action`
   - `created_by`
   - `created_at`
5. Gate-decision logic:
   - `PASS` when required QA coverage exists and no unresolved blocking issues remain
   - `FAIL` when required coverage is missing or any blocking QA issue remains
   - `OVERRIDE` only when an explicit user override exists
6. Save the gate result to cache-server when available.

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| quality_gate.json | JSON object | quality_gate.schema.json | Formal QA gate result |

## Quality Gate
- Missing required QA perspectives must produce `FAIL`, not a silent partial pass.
- Any unresolved `block` issue from perspective reports must produce `FAIL`.
- `next_action` must tell the caller whether to advance, rewrite, or resolve missing QA coverage.

## Error Handling
- No perspective reports: fail the gate and instruct the caller to run the missing QA commands.
- Mixed-run reports: fail the gate and require a consistent QA set.

## Related Commands
- Run after: `/qa-reader`, `/qa-skeptic`, `/qa-domain`, `/qa-style`, `/qa-coherence`, `/qa-ai-stink`
- Run before: artifact/finalization commands

## Related Agents
- qa-final
- lead-editor

## Escalation Triggers
- A true `OVERRIDE` decision requires explicit user authorization.
