# /discovery-simulate-user

**Phase:** 2
**Status:** stub
**Owner:** discovery-orchestrator
**Category:** discovery

## Purpose
Run discovery without user interaction. Simulate the answers a typical user would give to standard discovery questions, based entirely on what can be inferred from existing repo content, doctrine defaults, and guide records. Used for unattended pipeline runs where a human cannot respond to discovery questions.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| domain | string | No | (inferred) | Domain to simulate user responses for |
| confidence_threshold | string | No | medium | Options: high, medium, low — controls how aggressively defaults are applied |

## Behavior
1. Run the full discovery sequence from `/discovery`, but suppress all escalation triggers (do not pause to ask user questions).
2. For each genuine blocker identified during discovery:
   a. Attempt to apply a domain-appropriate default.
   b. If a default exists and confidence meets or exceeds `confidence_threshold`: apply it and record the assumption.
   c. If confidence is below threshold: record the blocker as a low-confidence assumption, apply the safest default, and flag for user review.
3. Produce a discovery report identical in structure to the standard report, with an additional section:
   - **Simulated Answers** — each question that would have been asked, with the simulated answer and its confidence level (high/medium/low).
4. All simulated answers are assumptions — they must be reviewed before high-stakes production work proceeds.

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| discovery_report | markdown (stdout) | none | Full discovery report with Simulated Answers section |
| simulated_answers | object[] | none | List of {question, simulated_answer, confidence, rationale} |

## Quality Gate
- Every simulated answer must have an explicitly stated confidence level.
- Low-confidence simulated answers must be clearly flagged for review.
- No simulated answer may be presented as a confirmed fact.

## Error Handling
- If a critical field cannot be simulated even at low confidence: record it as a residual blocker; do not invent an answer.
- If `confidence_threshold` is set to `high` and few answers meet the threshold: complete discovery with the available high-confidence answers and flag all others as residual blockers.

## Related Commands
- `/discovery` — standard interactive discovery
- `/write-brief` — typically run after discovery report is confirmed

## Related Agents
- discovery-orchestrator
- discovery-agent

## Escalation Triggers
- None. This command is designed for unattended execution; it does not escalate.

## Tool Adapter Notes
- **Claude Code:** Used in automated pipeline runs. Invokes the same discovery agents but with escalation suppressed.
- **Codex:** Invoke with "Run /discovery-simulate-user" or "Run discovery without asking me questions".
- **Windsurf:** Invoke via AI panel when running the framework in unattended mode.
- **Copilot:** Invoke in Copilot Chat. Copilot applies defaults and flags all assumptions.
