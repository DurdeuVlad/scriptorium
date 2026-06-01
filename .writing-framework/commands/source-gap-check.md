# /source-gap-check

**Phase:** 3
**Status:** stub
**Owner:** adversarial-reviewer
**Category:** research

## Purpose
Scan a document draft for claims that lack supporting research. For each unsupported claim found, report its location, the type of support needed, and the severity of the gap.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| draft | file path or string | Yes | (none) | Document draft to check |
| research_report | file path or string | No | (most recent) | Research report to check claims against |

## Behavior
1. Load the draft and the research report (if provided).
2. Parse the draft for claim types:
   - Factual claims: statements of fact about the world, the domain, or the subject.
   - Evaluative claims: assessments, comparisons, rankings, or judgments.
   - Causal claims: statements about cause-and-effect relationships.
   - Statistical claims: any numbers, percentages, or quantified assertions.
3. For each claim, check whether it is supported by:
   - A source in the research report
   - A canon guide record for the domain
   - Commonly accepted domain knowledge (note this is a weaker form of support)
   - No support (flagged as a gap)
4. Produce a gap report listing each unsupported claim:
   - Location: section, paragraph
   - Claim text (verbatim or paraphrased)
   - Claim type
   - Gap severity: critical (blocks publication), major (should be addressed), minor (acceptable with acknowledgment)
   - Recommended action: find source, qualify claim, remove claim, or note as domain assumption

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| gap_report | markdown (stdout) | none | Structured list of unsupported claims with severity and recommendations |

## Quality Gate
- All claim types in the draft must be covered.
- Each gap must have a severity rating and a recommended action.
- Critical gaps must be listed first and clearly labeled.

## Error Handling
- Draft not found: report error; recommend specifying the correct path.
- No research report provided: check against canon records only; note that research support cannot be evaluated.
- Draft contains no evaluatable claims: note this and return a clean report.

## Related Commands
- Run after: `/draft-document`, `/merge-draft`
- `/evidence-map` — produces a full claim-to-source mapping

## Related Agents
- adversarial-reviewer

## Escalation Triggers
- If five or more critical gaps are found: escalate before review proceeds; recommend an additional research pass.

## Tool Adapter Notes
- **Claude Code:** Reads draft and research report from filesystem. Produces gap report in chat.
- **Codex:** Invoke with "Check for source gaps" or "Run /source-gap-check".
- **Windsurf:** Invoke via AI panel.
- **Copilot:** Invoke in Copilot Chat.
