# /validate-research

**Phase:** 3
**Status:** stub
**Owner:** discovery-agent
**Category:** research

## Purpose
Validate a completed `research_report` for source quality, currency, relevance to the brief, and coverage completeness. Produces a validation summary with `ACCEPT`, `REVISE`, or `BLOCK` verdicts.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| research_report | file path or string | Yes | (none) | The `research_report` to validate |
| brief | file path or string | No | (active brief) | Brief to use for relevance assessment |

## Behavior
1. Load the research report and brief.
2. Evaluate each source in the report:
   - Relevance: does the source actually address the brief's goal and scope?
   - Reliability: is the source type appropriate?
   - Currency: for time-sensitive domains, is the source recent enough?
   - Summary accuracy: does the source summary accurately represent the source content?
3. Evaluate the synthesis section:
   - Coherence: does the synthesis accurately represent the source set?
   - Coverage: does the synthesis address the research topic fully?
   - Grounding: are all synthesis claims traceable to specific sources?
4. Evaluate the gaps section:
   - Completeness: are all significant knowledge gaps identified?
5. Issue a verdict:
   - `ACCEPT` - research is sufficient to proceed to drafting
   - `REVISE` - research is usable with caveats that must be addressed
   - `BLOCK` - research has critical gaps or quality issues that must be remediated

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| validation_summary | markdown (stdout) | review_report | Verdict with findings per source and synthesis |

## Quality Gate
- Every source must be individually evaluated.
- Verdict must be one of the three defined values.
- A `BLOCK` verdict must specify exactly what must be remediated.

## Error Handling
- Research report not found: report error and recommend running `/research` first.
- Brief not available: validate research on its own merits and note that relevance scoring is not contextualized.
- Report fails schema validation: report schema errors before proceeding with content evaluation.

## Related Commands
- Run after: `/research`
- Run before: `/synthesize-research`, `/draft-document`

## Related Agents
- discovery-agent
- adversarial-reviewer

## Escalation Triggers
- If a `BLOCK` verdict is issued, surface the blocking findings to the user before any drafting proceeds.

## Tool Adapter Notes
- **Claude Code:** Reads the research report from the filesystem and produces the validation summary inline.
- **Codex:** Invoke with "Validate research" or "Run /validate-research".
- **Windsurf:** Invoke via AI panel.
- **Copilot:** Invoke in Copilot Chat.
