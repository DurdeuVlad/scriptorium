# /orchestrate-review

**Phase:** 4
**Status:** stub
**Owner:** lead-orchestrator
**Category:** orchestration

## Purpose
Runs all seven QA perspectives in a coordinated sequence: six perspective reviewers followed by a final aggregation pass. Returns either an approved draft, a structured rewrite plan, or a halt condition for unresolved QA failures.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| draft | file path | Yes | (none) | Path to `draft.md` being reviewed |
| brief | file path | Yes | (none) | Path to `brief.json` for this run |
| run_id | string | No | (active run) | Used to scope cache-server reads/writes |
| perspective_set | array of strings | No | [qa-reader, qa-skeptic, qa-domain, qa-style, qa-coherence, qa-ai-stink] | Override to run a subset of perspectives |

## Behavior
1. Validate that both `draft` and `brief` inputs are present and readable. If either is missing, surface a B1 blocker and halt.
2. Load the active run context from cache-server (or session state) to confirm `run_id` and phase.
3. **Parallel QA dispatch:** Invoke the six standard QA agents, passing `draft` and `brief` to each.
4. Wait for all six agents to return `review_report.json` outputs. Track any agent that fails to return a report within its allotted window and flag missing reports as coverage gaps.
5. **Aggregation pass:** Pass all collected `review_report.json` files to `/qa-final` along with the `draft` and `run_id`. Instruct `qa-final` to produce a `quality_gate.json`.
6. **Gate evaluation:**
   - If `quality_gate.json` has `decision: PASS`, return the approved draft path and `quality_gate.json`.
   - If `quality_gate.json` has `decision: FAIL` and `next_action` routes back to rewrite work, extract the unmet criteria and perspective issues into a `rewrite_plan.json` and recommend running `/rewrite`.
   - If `quality_gate.json` has `decision: FAIL` for missing coverage or unresolved blocking issues, escalate to `lead-editor` and halt finalization.
   - If `quality_gate.json` has `decision: OVERRIDE`, return the approved draft path and the override rationale, and mark the summary as an override advance.
7. Persist `quality_gate.json` to cache-server under the active `run_id`.
8. Output an orchestration summary: perspectives run, individual verdicts, overall gate decision, and recommended next command.

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| quality_gate | JSON | quality_gate | Aggregated gate result from qa-final |
| approved_draft | file path | - | Returned only on PASS or OVERRIDE; points to the reviewed draft |
| rewrite_plan | JSON | rewrite_plan | Returned only on FAIL when the gate routes back to rewrite work |
| orchestration_summary | markdown (stdout) | - | Per-perspective verdicts, overall result, and recommended next step |

## Quality Gate
- All six perspective reports must be present in the QA set or explicitly called out as missing coverage.
- The gate verdict must be one of: `PASS`, `FAIL`, or `OVERRIDE`.
- A `FAIL` verdict must include at least one unmet criterion.
- A `PASS` verdict must not leave required criteria unmet.

## Error Handling
- One or more QA agents fail to return a report: log the failure, note the coverage gap in the gate output, and proceed with available reports. Surface the gap prominently in the orchestration summary.
- `qa-final` fails: retry once. If it fails again, surface the error and deliver individual perspective reports to the user for manual review.
- `brief.json` fails schema validation: flag as B1 blocker; do not proceed with QA until a valid brief is available.
- Draft is empty or below minimum viable length: flag as B1 blocker before dispatching QA agents.

## Related Commands
- Run after: `/orchestrate-draft`, `/rewrite`
- Run before: `/orchestrate-finalize`
- Component commands: `/qa-reader`, `/qa-skeptic`, `/qa-domain`, `/qa-style`, `/qa-coherence`, `/qa-ai-stink`, `/qa-final`

## Related Agents
- lead-orchestrator
- qa-reader
- qa-skeptic
- qa-domain
- qa-style
- qa-coherence
- qa-ai-stink
- qa-final

## Escalation Triggers
- `FAIL` verdict from `qa-final` with unresolved blocking issues or missing coverage: halt downstream commands, surface all unmet criteria, and require explicit lead-editor or user authorization before re-running or proceeding.
- One or more QA agents produce no report after a retry: alert the user and request guidance on whether to proceed with partial coverage.
- Draft path does not exist at command start: halt immediately with a B1 blocker message.

## Tool Adapter Notes
- **Claude Code:** Dispatches QA agents as parallel tool calls where the tool environment supports concurrency; otherwise runs them sequentially and aggregates. Reads/writes reports via cache-server when available.
- **Codex:** Invoke with "Run full QA review" or "Run /orchestrate-review". Codex runs each QA step sequentially.
- **Windsurf:** Invoke via the AI panel. Each QA perspective may surface its report inline; the final gate result is the authoritative output.
- **Copilot:** Invoke in Copilot Chat. Copilot runs perspectives sequentially and presents the aggregated gate result.
