# /draft-section

**Phase:** 3
**Status:** active
**Owner:** section-drafter
**Category:** editorial

## Purpose
Draft one section from `outline.json` using the brief, active style pack, and any available source material. The output must satisfy the section purpose and required content without drifting into adjacent sections.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| section_id | string | Yes | (none) | Section identifier from `outline.json` |
| outline | file path or object | No | (active outline) | Outline containing the section spec |
| brief | file path or object | No | (active brief) | Brief for audience, constraints, and voice context |
| research_report | file path or object | No | (most recent) | Optional supporting research |
| run_id | string | No | (active run) | Cache-server run identifier |

## Behavior
1. Load `outline.json` and locate the target section by `section_id`.
2. Load `brief.json` and the active style pack.
3. Resolve section-specific source material:
   - `section.source_refs`
   - relevant research excerpts
   - canon or anti-pattern guides when applicable
4. Invoke `section-drafter` to draft a bounded markdown section that:
   - fulfills `section.purpose`
   - covers every item in `section.required_content`
   - stays near `section.estimated_words`
   - matches brief and style-pack constraints
5. Run self-checks before returning:
   - completeness against `required_content`
   - reader clarity for the brief audience
   - grounding for factual claims
   - obvious AI-stink and voice drift
6. Save the section draft as an intermediate artifact in cache-server.
7. If drafting is blocked by missing required context or source material, create a blocker, preserve the partial state, and return a resume path.

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| section_draft | markdown | none | Section markdown including the heading |
| section_metadata | JSON object | none | Optional metadata such as word count, source refs used, and drafting notes |

## Quality Gate
- The section fulfills its declared purpose.
- All `required_content` items are covered or explicitly flagged as blocked.
- Claims that require grounding are either supported or flagged as unresolved.
- The section remains within a reasonable range of `estimated_words` unless deviation is justified.

## Error Handling
- Unknown `section_id`: return the available section IDs from the outline.
- Missing outline or brief: stop and return the missing dependency.
- Missing style pack or guide records: continue with defaults, log the degraded state.
- Missing critical source material: create a blocker instead of fabricating unsupported content.

## Related Commands
- Run after: `/write-outline`, `/validate-outline`
- Run before: `/merge-draft`
- `/draft-document` coordinates repeated calls to this command

## Related Agents
- section-drafter
- merge-normalizer

## Escalation Triggers
- The section purpose or boundaries are unclear enough that drafting would create overlap or contradiction.
- Critical source material is missing and the section cannot be grounded.

## Tool Adapter Notes
- **Claude Code:** Loads the section spec, drafts the section, and stores the result as an intermediate artifact.
- **Codex:** Invoke with "Run /draft-section <section_id>" using the active brief and outline.
- **Windsurf:** Invoke through the command adapter.
- **Copilot:** Invoke in chat using the active run context.
