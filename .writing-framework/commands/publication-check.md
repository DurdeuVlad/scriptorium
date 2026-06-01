# /publication-check

**Phase:** 3
**Status:** stub
**Owner:** lead-editor
**Category:** editorial

## Purpose
Final pre-export gate. Validates that a document is complete, fully formatted, schema-compliant where required, canon-consistent, and meets all brief success criteria. Issues a publication verdict.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| draft | file path or string | Yes | (none) | Document to check |
| brief | file path or string | No | (active brief) | Brief for success criteria validation |
| qa_reports | file paths | No | (most recent QA cycle) | Previous QA reports to include in evaluation |

## Behavior
1. Load the draft, brief, and any available QA reports.
2. Run the following checks:
   a. **Completeness check:** Every section from the outline is present. No stub placeholders remain. No TODO markers in the content.
   b. **Format check:** Valid markdown. No broken heading hierarchy. No unclosed code fences. No broken table syntax.
   c. **Schema check:** If the document has a structured front matter section, validate it against applicable schemas.
   d. **Brief alignment check:** Document content covers all success criteria listed in the brief. Goal is addressed. Audience is served.
   e. **Canon consistency check:** No canon violations from the most recent `/canon-check` remain unresolved.
   f. **QA gate check:** All blocking QA findings from the most recent QA cycle are resolved.
   g. **AI-stink check:** Quick scan for machine-generated language patterns that survived earlier passes.
3. Aggregate findings across all checks.
4. Issue a verdict:
   - `publication_ready` — all checks pass; document may proceed to artifact generation.
   - `conditional` — minor issues only; list required fixes; may proceed once fixed.
   - `not_ready` — blocking issues present; document must be revised before export.
5. Output the publication check report with all findings listed by check and a final verdict.

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| publication_check_report | markdown (stdout) | quality_gate | All check results and publication verdict |

## Quality Gate
- All seven checks must be completed.
- A `publication_ready` verdict requires all checks to pass.
- A `conditional` verdict must list every required fix explicitly.

## Error Handling
- Draft not found: report error.
- Brief not found: skip brief alignment check; note this limitation in report.
- No prior QA reports: note the absence; still run all other checks.

## Related Commands
- Run after: `/qa-final`, `/canon-check`
- Run before: `/orchestrate-artifact`, `/write-markdown`

## Related Agents
- lead-editor
- canon-checker

## Escalation Triggers
- If `not_ready` verdict is issued: require user acknowledgment of blocking findings before any export operations proceed.

## Tool Adapter Notes
- **Claude Code:** Reads all relevant files, runs checks, produces report in chat.
- **Codex:** Invoke with "Publication check" or "Run /publication-check".
- **Windsurf:** Invoke via AI panel.
- **Copilot:** Invoke in Copilot Chat.
