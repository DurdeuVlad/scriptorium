# /validate-brief

**Phase:** 3
**Status:** active
**Owner:** lead-editor
**Category:** editorial

## Purpose
Validate a brief against both the current brief schema and the Brief Gate. This command is read-only: it reports pass/fail, required fixes, and warnings without rewriting the brief.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| brief_id | string | No | (active brief artifact) | Cache-server artifact identifier for the brief |
| brief_json | file path or object | No | (active brief) | Inline or file-based brief payload when no artifact ID is provided |
| run_id | string | No | (active run) | Cache-server run identifier |

## Behavior
1. Load the target brief from cache-server or the supplied payload.
2. Validate it against `.writing-framework/schemas/brief.schema.json`.
3. Evaluate the Brief Gate:
   - audience specificity
   - bounded scope
   - checkable success criteria
   - concrete constraints
4. Return a structured validation report with pass/fail, errors, and warnings.
5. Log the validation step to cache-server when available.

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| validation_report | JSON or markdown | none | Includes schema result, Brief Gate result, and remediation guidance |

## Quality Gate
- The command must distinguish schema failures from gate failures.
- Every failed criterion must identify the specific field or rule that failed.

## Error Handling
- No brief provided or found: return a missing-input error.
- Invalid JSON: return parse or schema errors.

## Related Commands
- Run after: `/write-brief`
- Run before: `/write-outline`

## Related Agents
- lead-editor

## Escalation Triggers
- None. Validation reports findings; it does not modify artifacts.
