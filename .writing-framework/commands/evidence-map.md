# /evidence-map

**Phase:** 3
**Status:** stub
**Owner:** adversarial-reviewer
**Category:** research

## Purpose
Produce a complete evidence map linking every claim in a document to its supporting source, or flagging it as unsupported. Provides a machine-readable and human-readable audit trail of evidentiary support across the full document.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| draft | file path or string | Yes | (none) | Document draft to map |
| research_report | file path or string | No | (most recent) | Research report containing sources |

## Behavior
1. Load the draft. Parse every sentence that contains a claim (factual, evaluative, causal, or statistical).
2. Load the research report if provided. Index all sources by citation.
3. For each claim:
   - Attempt to link it to a source from the research report.
   - If no direct link exists, check canon guide records for domain-standard knowledge.
   - If no support exists, mark as unsupported.
4. Produce an evidence map in structured format:
   - For each section of the document: list of {claim_text, claim_type, support_status, source_citation, note}.
   - `support_status` options: supported, partially_supported, domain_standard, unsupported.
5. Produce a summary table at the top: total claims, supported, partially supported, domain standard, unsupported.
6. Produce a recommendations section: list of unsupported claims that are candidates for removal, qualification, or additional research.

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| evidence_map | markdown (stdout) | none | Full claim-to-source mapping with summary table |

## Quality Gate
- Every claim in the draft must appear in the map.
- Support status must be one of the four defined values — no ambiguous entries.
- Summary table counts must match the detail section.

## Error Handling
- Draft not found: report error; direct user to specify a valid path.
- No research report and no canon records applicable: map all claims as "domain_standard" or "unsupported" as appropriate; note the limitation.

## Related Commands
- Run after: `/source-gap-check`, `/draft-document`
- `/validate-research` — validates the research report before evidence mapping

## Related Agents
- adversarial-reviewer

## Escalation Triggers
- If more than 30% of claims are unsupported: surface the ratio and recommend an additional research pass before review.

## Tool Adapter Notes
- **Claude Code:** Reads draft and research report. Produces evidence map in chat.
- **Codex:** Invoke with "Map evidence in the draft" or "Run /evidence-map".
- **Windsurf:** Invoke via AI panel.
- **Copilot:** Invoke in Copilot Chat.
