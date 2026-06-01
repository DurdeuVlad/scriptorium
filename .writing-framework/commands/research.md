# /research

**Phase:** 3
**Status:** stub
**Owner:** discovery-agent
**Category:** research

## Purpose
Conduct a research pass for a given topic, document section, or project brief. Produces a validated `research_report` with sources, summaries, relevance scores, and identified gaps.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| topic | string | Yes | (none) | Topic, question, or section spec to research |
| brief | file path or string | No | (active brief) | Project brief to use for context and relevance scoring |
| depth | string | No | standard | Options: quick (3–5 sources), standard (5–10 sources), deep (10+ sources) |

## Behavior
1. Load the brief if available. Extract: domain, audience, scope, and success criteria. These inform relevance scoring.
2. Conduct research on the specified `topic`:
   - Search available knowledge sources: guide-server canon records, loaded style packs, project files, any attached source materials.
   - If external research is needed and tools are available, use them. Note the tool used for each source.
3. For each source found:
   - Record the citation (title, author/origin, date if available, type).
   - Write a source summary (2–4 sentences).
   - Assign a relevance score (1–5) based on alignment with the brief's goal, audience, and scope.
   - Assign a reliability indicator: primary, secondary, or inferred.
4. Write a synthesis section: a coherent 1–3 paragraph narrative that integrates the key findings across all sources.
5. Identify gaps: topics that the research could not cover, sources that were sought but not found, and questions that remain open.
6. Produce the output as a `research_report`-schema-compliant object.
7. (Phase 3+) Save to cache-server as a run artifact.

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| research_report | JSON + markdown | research_report | Schema-validated report with sources, synthesis, and gaps |

## Quality Gate
- Each source must have a citation, summary, and relevance score.
- Synthesis must be a coherent narrative — not a list of bullet points.
- Gaps section must be present; may note "no gaps identified" if coverage is complete.

## Error Handling
- No relevant sources found for topic: produce a report with an empty sources list, a gaps section describing what was searched, and a recommendation to provide source materials.
- Brief not available: proceed with research but note that relevance scoring is approximate without brief context.
- Tool failure during research: record what was attempted, include what was found before failure, flag the gap.

## Related Commands
- Run after: `/write-brief`
- Run before: `/validate-research`, `/synthesize-research`, `/draft-document`
- `/validate-research` — validates the research report
- `/synthesize-research` — merges multiple research reports

## Related Agents
- discovery-agent

## Escalation Triggers
- If research uncovers information that contradicts the brief's stated scope: surface this before proceeding.
- If no usable sources are found and the topic is central to the document: escalate before drafting begins.

## Tool Adapter Notes
- **Claude Code:** Uses filesystem reads and any available tool integrations for research. Produces report in chat.
- **Codex:** Invoke with "Research [topic]" or "Run /research [topic]". Codex performs knowledge-base search.
- **Windsurf:** Invoke via AI panel with the topic argument.
- **Copilot:** Invoke in Copilot Chat. Copilot uses workspace context and Copilot knowledge for research.
