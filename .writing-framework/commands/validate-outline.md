# /validate-outline

**Phase:** 3
**Status:** active
**Owner:** lead-editor
**Category:** editorial

## Purpose
Validate an outline against the current outline schema and the Outline Gate. This command is read-only and exists to make the gate check explicit before drafting begins.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| outline_id | string | No | (active outline artifact) | Cache-server artifact identifier |
| outline_json | file path or object | No | (active outline) | Inline or file-based outline payload |
| run_id | string | No | (active run) | Cache-server run identifier |

## Behavior
1. Load the target outline from cache-server or the supplied payload.
2. Validate it against `.writing-framework/schemas/outline.schema.json`.
3. Evaluate the Outline Gate:
   - required fields per section
   - distinct section purposes
   - justified structure
   - brief scope coverage
4. Return a structured validation report with pass/fail, errors, and warnings.
5. Log the validation step to cache-server when available.

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| validation_report | JSON or markdown | none | Includes schema result, Outline Gate result, and remediation guidance |

## Quality Gate
- The command must distinguish schema failures from gate failures.
- Section-specific failures must identify the affected `section_id` whenever possible.

## Error Handling
- No outline provided or found: return a missing-input error.
- Invalid JSON: return parse or schema errors.

## Related Commands
- Run after: `/write-outline`
- Run before: `/draft-section`, `/draft-document`

## Related Agents
- lead-editor

## Escalation Triggers
- None. Validation reports findings; it does not modify artifacts.
