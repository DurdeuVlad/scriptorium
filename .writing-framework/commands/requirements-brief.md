# /requirements-brief

**Phase:** 2
**Status:** stub
**Owner:** brief-writer
**Category:** discovery

## Purpose
Produce a structured requirements brief from a completed discovery report and any user-confirmed inputs. The requirements brief is a pre-brief artifact that consolidates everything known about the project into a single structured document, enabling `/write-brief` to produce a validated brief without additional questions.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| discovery_report | file path or string | No | (most recent discovery report) | Discovery report to use as source |
| overrides | string | No | (none) | Freetext user-provided inputs that override inferred context |

## Behavior
1. Locate the discovery report: use the `discovery_report` argument if provided; otherwise use the most recent discovery report in `logs/` or cache-server.
2. Extract all confirmed and inferred context from the discovery report.
3. Apply any `overrides` provided by the user, replacing inferred values with explicitly stated ones.
4. Produce a requirements brief in structured form:
   - **Goal** — the primary objective of the document
   - **Audience** — intended reader(s) with enough specificity to guide voice and assumed knowledge
   - **Domain** — the content domain (general-writing, technical-doc, lore-dm, etc.)
   - **Tone** — voice and register appropriate for audience and domain
   - **Scope** — what is and is not included in the document
   - **Constraints** — any hard limits: word count, format restrictions, canon rules, deadlines
   - **Deliverables** — the format(s) of final output required
   - **Inputs** — source materials, prior documents, or research reports to be used
   - **Success Criteria** — how the output will be evaluated as successful
   - **Open Questions** — any items that remain unresolved and must be answered before proceeding
5. Flag each field as: confirmed (from discovery), inferred (default applied), or user-specified (from overrides).
6. Output the requirements brief as a structured markdown document.

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| requirements_brief | markdown (stdout) | none | Structured pre-brief document with field provenance labels |

## Quality Gate
- All nine required fields must be present and populated (even if flagged as inferred defaults).
- Open Questions section must be present; may be empty if no questions remain.
- Provenance labels must be present on every field value.

## Error Handling
- No discovery report found: warn user and offer to run `/discovery` first.
- Discovery report is incomplete: use available sections, note which are missing, apply defaults for missing sections.
- `overrides` conflict with confirmed context: surface the conflict explicitly and ask user to clarify.

## Related Commands
- Run after: `/discovery`
- Run before: `/write-brief`
- `/write-brief` — consumes this output to produce a schema-validated brief

## Related Agents
- brief-writer
- discovery-agent

## Escalation Triggers
- If the domain cannot be inferred from any available source: ask the user to specify before producing the brief.

## Tool Adapter Notes
- **Claude Code:** Reads discovery report from filesystem or session context. Renders requirements brief in chat.
- **Codex:** Invoke with "Run /requirements-brief" or "Build a requirements brief from discovery".
- **Windsurf:** Invoke via AI panel after discovery has been run.
- **Copilot:** Invoke in Copilot Chat. Copilot reads the discovery report and produces the requirements brief.
