# /orchestrate-draft

**Phase:** 3
**Status:** stub
**Owner:** lead-orchestrator
**Category:** orchestration

## Purpose
Orchestrate full draft production: from a validated outline through section drafting, merging, normalization passes, and draft QA. Returns a complete, normalized, draft-QA-passed document ready for full review.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| outline | file path or string | No | (active outline) | Validated outline to draft from |
| research_report | file path or string | No | (most recent) | Research to inform drafting |

## Behavior
1. Load the active outline and brief. Validate outline schema before proceeding.
2. **Step 1 - Research check:** Confirm a research report is available. If not, and if the brief requires research-backed claims, run `/research` for the key topics before drafting. If research is not required for the domain, proceed without it.
3. **Step 2 - Section drafting:** Run `/draft-document` to produce all section drafts and a merged document.
4. **Step 3 - Normalization passes:** Run `/line-edit` and `/voice-pass` on the merged draft to normalize line quality and style compliance.
5. **Step 4 - Draft QA:** Run `/qa-reader`, `/qa-coherence`, and `/qa-ai-stink` as a draft-stage QA set. Record the three review reports.
6. **Step 5 - Gate evaluation:** Evaluate the three draft QA reports:
   - If all three `gate_decision` values are `ACCEPT`, advance to finalization.
   - If any `gate_decision` is `REVISE`, produce a rewrite plan from the reported issues and run `/rewrite`.
   - If any `gate_decision` is `BLOCK`, apply a full revision pass and re-run the relevant QA perspectives.
7. After the gate passes, output the final draft and an orchestration summary.

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| draft | markdown (file) | none | Complete normalized draft document |
| draft_qa_reports | review_report[] | review_report | Reader, coherence, AI-stink reports |
| orchestration_summary | markdown (stdout) | none | Steps, gate result, recommended next command |

## Quality Gate
- All sections from the outline must be present in the output draft.
- Reader, coherence, and AI-stink perspective reports must all reach `ACCEPT` or be revised before the draft is marked complete.
- Any report with `REVISE` or `BLOCK` findings must be addressed before the draft is marked complete.

## Error Handling
- Section draft failures: include all successful sections; mark failures as stubs; continue; note in summary.
- Persistent `BLOCK` verdict after revision pass: deliver the best available draft with the blocking findings documented.

## Related Commands
- Run after: `/orchestrate-outline`
- Run before: `/orchestrate-review`

## Related Agents
- lead-orchestrator
- lead-editor
- section-drafter
- merge-normalizer

## Escalation Triggers
- If two consecutive revision passes still produce a `BLOCK` verdict: surface the persistent findings and ask user for intervention.

## Tool Adapter Notes
- **Claude Code:** Orchestrates multi-step draft production via sequential command invocations.
- **Codex:** Invoke with "Orchestrate the draft" or "Run /orchestrate-draft".
- **Windsurf:** Invoke via AI panel.
- **Copilot:** Invoke in Copilot Chat.
