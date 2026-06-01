# /orchestrate-finalize

**Phase:** 4
**Status:** stub
**Owner:** lead-orchestrator
**Category:** orchestration

## Purpose
Runs the full finalization sequence after the QA gate has passed: applies a voice pass, compresses the document, performs a publication check, then issues a Final Gate verdict. Returns the final approved document and a `quality_gate.json`.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| draft | file path | Yes | (none) | QA-approved draft to finalize |
| brief | file path | Yes | (none) | Path to brief.json for this run |
| run_id | string | No | (active run) | Used to scope cache-server reads/writes |
| skip_voice_pass | boolean | No | false | Set true only if voice-pass was already applied in this run |
| skip_compress | boolean | No | false | Set true only if compress was already applied in this run |

## Behavior
1. Confirm that a valid `quality_gate.json` from `/orchestrate-review` exists for this run with a `PASS` or `REVISE-resolved` verdict. If no passing gate exists, surface a B2 blocker and halt — do not finalize an unreviewed draft.
2. Load `brief.json` and confirm it is schema-valid. If not, surface a B1 blocker.
3. **Step 1 — Voice Pass:** Run `/voice-pass` on the approved draft. Pass the active style pack loaded from `brief.json` (or from guide-server if brief references one). `/voice-pass` returns a revised draft with voice and tone corrections applied.
4. **Step 2 — Compress:** Run `/compress` on the voice-pass output. Target compression parameters are derived from `brief.json` (word count target, verbosity setting). Returns a compressed draft.
5. **Step 3 — Publication Check:** Run `/publication-check` on the compressed draft against `brief.json`. The publication check evaluates: completeness against brief requirements, formatting compliance, citation and source validity (if applicable), and any client-specific checklist items from the brief.
6. **Step 4 — Final Gate:** Evaluate the publication-check report:
   - If all checks pass: record a `FINAL_PASS` verdict. Mark the compressed draft as the final approved document.
   - If minor issues found: apply targeted fixes inline. Re-run the failing publication checks. If they now pass: record `FINAL_PASS`.
   - If blocking issues found: record a `FINAL_BLOCK` verdict. Surface the specific failures. Do not mark the document as final.
7. On `FINAL_PASS`: write the final document to `artifacts/final/[run_id]-final.md` (or the path specified in brief). Update cache-server with the final document path. Emit `quality_gate.json` with `verdict: FINAL_PASS`.
8. Output orchestration summary: steps completed, any inline fixes applied, final gate verdict, and recommended next command (typically `/orchestrate-artifact`).

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| final_document | markdown file | — | Final approved document at artifacts/final/ |
| quality_gate | JSON | quality_gate | Gate result with FINAL_PASS or FINAL_BLOCK verdict |
| orchestration_summary | markdown (stdout) | — | Steps taken, issues resolved, final verdict, and next step |

## Quality Gate
- A prior `PASS` verdict from `/orchestrate-review` (or `/qa-final`) must exist for the active run before finalization proceeds.
- The final document must pass all publication-check items without any blocking findings remaining.
- The `quality_gate.json` output must contain a `verdict` field set to `FINAL_PASS` or `FINAL_BLOCK`.

## Error Handling
- `/voice-pass` fails: log the error, skip voice-pass, note the omission in the orchestration summary, and continue to compress. Do not block finalization on a voice-pass failure.
- `/compress` produces output longer than the input: flag as a warning but do not block; surface to user for review.
- `/publication-check` returns blocking issues that cannot be resolved inline: record `FINAL_BLOCK`, surface the specific issues, and recommend targeted fixes before re-running finalization.
- Final document write fails (filesystem or cache-server error): report the error; do not mark the document as final until a successful write is confirmed.

## Related Commands
- Run after: `/orchestrate-review` (must have PASS verdict)
- Run before: `/orchestrate-artifact`
- Component commands: `/voice-pass`, `/compress`, `/publication-check`

## Related Agents
- lead-orchestrator
- voice-editor
- compression-editor
- publication-checker

## Escalation Triggers
- No passing QA gate exists for the current run: halt and require user to run `/orchestrate-review` first.
- `FINAL_BLOCK` verdict after one round of inline fixes: escalate to lead-editor, surface all blocking publication-check findings, require explicit user authorization to proceed.
- Draft has changed since the last QA gate was issued (file modification timestamp mismatch): warn the user and recommend re-running `/orchestrate-review` before finalizing.

## Tool Adapter Notes
- **Claude Code:** Runs each finalization step as a sequential slash command invocation. Reads and writes state via cache-server. Writes the final document using the Write tool.
- **Codex:** Invoke with "Finalize the document" or "Run /orchestrate-finalize". Runs steps sequentially in chat context.
- **Windsurf:** Invoke via AI panel. Intermediate drafts from each step may be previewed in the editor pane.
- **Copilot:** Invoke in Copilot Chat. Each step produces a discrete output that Copilot surfaces before the next step runs.
