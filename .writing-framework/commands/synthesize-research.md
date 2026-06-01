# /synthesize-research

**Phase:** 3
**Status:** stub
**Owner:** discovery-agent
**Category:** research

## Purpose
Merge multiple `research_report` objects into a single unified evidence summary. Deduplicates sources, resolves conflicts between reports, and produces a coherent synthesis narrative covering all research topics.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| reports | file paths or string list | Yes | (none) | Two or more research_report paths or inline reports to synthesize |
| brief | file path or string | No | (active brief) | Brief for relevance-guided synthesis |

## Behavior
1. Load all specified research reports.
2. Deduplicate sources: if the same source appears in multiple reports, merge its summaries into a single entry with the highest relevance score.
3. Identify conflicting findings: where reports draw different conclusions from the same or similar sources, note the conflict explicitly.
4. Group sources by topic cluster, keyed to the brief's sections if a brief is available.
5. Produce a unified synthesis narrative:
   - One coherent prose section per major topic cluster
   - Conflicts noted inline with explanation
   - All source citations preserved in the merged report
6. Produce a merged gaps section: all gaps from all input reports, deduplicated.
7. Output a single unified `research_report`-schema-compliant object representing the full research base.

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| unified_research_report | JSON + markdown | research_report | Merged, deduplicated report with unified synthesis |

## Quality Gate
- All sources from all input reports must appear in the output (none may be silently dropped).
- Conflicts must be explicitly noted — they cannot be silently resolved.
- Merged synthesis must be a coherent narrative, not a concatenation of per-report syntheses.

## Error Handling
- Fewer than two reports provided: note this and return the single report as-is without synthesis.
- Reports are for incompatible domains: flag this and ask user whether synthesis is intentional.
- A conflict cannot be resolved from available information: mark it as an open conflict in the output.

## Related Commands
- Run after: `/research`, `/validate-research`
- Run before: `/draft-document`

## Related Agents
- discovery-agent

## Escalation Triggers
- If synthesis finds more than three unresolvable conflicts: surface them and ask user to adjudicate.

## Tool Adapter Notes
- **Claude Code:** Reads multiple research report files and produces merged output in chat.
- **Codex:** Invoke with "Synthesize research reports" or "Run /synthesize-research".
- **Windsurf:** Invoke via AI panel with report paths.
- **Copilot:** Invoke in Copilot Chat.
