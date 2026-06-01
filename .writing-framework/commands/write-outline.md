# /write-outline

**Phase:** 3
**Status:** active
**Owner:** outline-architect
**Category:** editorial

## Purpose
Produce a schema-valid `outline.json` from an approved brief. The outline is the structural contract for drafting: each section must be specific enough that a section drafter can execute it without clarifying questions.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| brief | file path or object | No | (active brief) | Valid `brief.json` from the brief workflow |
| template_override | string | No | (best matching template) | Optional template identifier if the default should be overridden |
| research_report | file path or object | No | (most recent) | Optional structural context for research-heavy documents |
| run_id | string | No | (active run) | Cache-server run identifier |

## Behavior
1. Load the active `brief.json` and confirm it is schema-valid.
2. Load the active style pack and any applicable templates or structure guides.
3. Invoke `outline-architect` to create:
   - `outline_id`
   - `brief_id`
   - `title`
   - `template_used`
   - ordered `sections`
   - `total_estimated_words`
   - `structure_justification`
   - `created_by`
   - `created_at`
   - `run_id`
4. For every section, populate the current schema fields:
   - `section_id`
   - `title`
   - `level`
   - `purpose`
   - `required_content`
   - `source_refs`
   - `estimated_words`
   - `subsections`
   - `notes`
5. Validate the outline against `.writing-framework/schemas/outline.schema.json`.
6. Run the Outline Gate before returning:
   - every section has a distinct purpose
   - section order is justified for reader comprehension
   - estimated word count is compatible with brief constraints
   - required scope from the brief is fully mapped
7. Save outline and workflow steps to cache-server when available.
8. Fall back to `artifacts/outline/` and `logs/` if cache-server is unavailable.

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| outline.json | JSON object | outline.schema.json | Primary structured outline artifact |
| outline.md | markdown summary | none | Optional human-readable outline render |

## Quality Gate
- `outline.json` validates against `outline.schema.json`.
- Every section includes `section_id`, `title`, `purpose`, and `estimated_words`.
- `structure_justification` explains the reader-facing sequence.
- No two sections have overlapping purposes.

## Error Handling
- Missing or invalid brief: stop and return the brief validation or gate error.
- No matching template: proceed with a generic outline structure and log the fallback.
- Outline Gate failure: return specific section-level failures and create a resume point.

## Related Commands
- Run after: `/write-brief`, `/validate-brief`
- Run before: `/validate-outline`, `/draft-section`, `/draft-document`
- `/orchestrate-outline` coordinates this command in the full outline workflow

## Related Agents
- outline-architect
- lead-editor

## Escalation Triggers
- The brief requires more than one document and cannot be outlined as a single artifact.
- Required sections conflict with hard word-count limits or other non-negotiable constraints.

## Tool Adapter Notes
- **Claude Code:** Reads the brief, applies structure rules, validates, and writes `outline.json`.
- **Codex:** Invoke with "Run /write-outline" using the active brief.
- **Windsurf:** Invoke through the command adapter.
- **Copilot:** Invoke in chat using the current brief and template context.
