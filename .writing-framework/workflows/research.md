# Research Workflow

**Status:** Phase 1 — Structure defined. Full implementation in Phase 2.
**Owner:** lead-editor
**Trigger:** /research command or /orchestrate-draft when research phase is required
**Output:** research_report.json (schemas/research_report.schema.json)

## Purpose
Gather, validate, synthesize, and structure research to support a writing task. Produces a structured research report that can be consumed by the brief writer and section drafters without requiring them to re-examine raw sources.

## Inputs
| Input | Type | Required | Source |
|-------|------|----------|--------|
| research_brief or topic_description | string | Yes | User or discovery workflow |
| source_list | array of strings | No | If provided, validate rather than discover |
| guide_query_terms | array of strings | No | Inferred from task description |
| domain_context | object | No | Discovery report |

## Steps
1. **discovery-agent:** Read task brief and decompose into discrete research questions that must be answered before writing
2. **discovery-agent:** Query guide-server for relevant existing knowledge — check canon guides, example guides, and domain guides before seeking external sources
3. **discovery-agent:** Identify source gaps — map each research question to available sources; flag questions with no source as gaps
4. **discovery-agent:** Gather or synthesize available sources; if source_list is provided, validate each source against research questions rather than discovering anew
5. **canon-checker:** Validate all claims against existing canon guides; flag any finding that contradicts or is absent from established canon
6. **discovery-agent:** Structure output as research_report conforming to schemas/research_report.schema.json — every finding includes source reference and confidence level
7. **discovery-agent:** Flag all unresolved source gaps, canon conflicts, and unverifiable claims in dedicated report fields

## Decision Points
- **Source conflicts with existing canon:** Flag as B8 (canon conflict); do not include conflicting claim without noting conflict and pending resolution
- **Required source unavailable:** Flag as B4 (missing source material); document what was sought and why it is needed; provide best available alternative if one exists
- **Research scope exceeds task needs:** Compress to relevant findings only; document what was found but scoped out to avoid context bloat in downstream workflows
- **All research questions answered with high confidence:** Mark ready_for_brief = true and advance

## Outputs
| Output | Type | Schema | Destination |
|--------|------|--------|-------------|
| research_report.json | JSON object | schemas/research_report.schema.json | Brief workflow, section drafters |
| source_gap_report | array of strings | Inline in research_report.source_gaps | Lead-editor, user if gaps are blocking |
| canon_conflict_report | array of objects | Inline in research_report.canon_conflicts | Canon-checker, lead-editor |

## Quality Gate
All research questions are answered or explicitly documented as open. Every finding cites a source. Canon conflicts are flagged — none are silently included. Source gaps are listed with enough context for the user to supply what is missing. The report is complete enough for a brief writer to proceed without re-reading raw sources.

## Related Commands
- /research
- /validate-research
- /synthesize-research
- /source-gap-check
- /evidence-map

## Related Agents
- lead-editor (owner)
- discovery-agent (primary executor)
- canon-checker (validation step)

## Cross-References
- schemas/research_report.schema.json — output format
- workflows/discovery.md — provides domain context input
- workflows/brief.md — consumes research_report as optional input
- doctrine/AUTONOMOUS_EXECUTION.md — blocker taxonomy (B4, B8)
