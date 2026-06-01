# /canon-check

**Phase:** 3
**Status:** stub
**Owner:** canon-checker
**Category:** editorial

## Purpose
Validate a document against all applicable canon guide records for the active domain. Reports violations with location, severity, and the specific canon rule being violated.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| draft | file path or string | Yes | (none) | Document to validate |
| domain | string | No | (from brief or style pack) | Domain to check canon against |

## Behavior
1. Load the draft.
2. Identify the active domain: from `domain` argument, or from the active brief, or from the active style pack.
3. (Phase 2+) Query guide-server for all active canon records for the domain. Load them.
4. (Phase 1) Read `guides/canon/` for canon files matching the domain.
5. Invoke `canon-checker` agent:
   a. For each canon record, extract the constraint or fact it establishes.
   b. Scan the draft for any statements that contradict, misrepresent, or inconsistently apply the canon constraint.
   c. For each violation found: record location (section, paragraph), the violated canon record (id or title), the violating text, and severity (blocking, major, minor).
   d. For each near-miss (ambiguous statement that could be read as a violation): note it separately as a warning, not a violation.
6. Produce a canon check report:
   - Summary: violations found (count by severity), warnings found (count)
   - Violations list: each with location, canon record, violating text, severity, recommended fix
   - Warnings list: each with location, canon record, ambiguous text, recommendation
   - Verdict: pass (no violations), conditional (warnings only), fail (blocking or major violations present)

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| canon_check_report | markdown (stdout) | review_report | Violations, warnings, and verdict |

## Quality Gate
- All active canon records for the domain must be checked.
- Violations must be distinguished from warnings in the output.
- A `fail` verdict must list every blocking violation explicitly.

## Error Handling
- Domain not determinable: ask user to specify domain before running.
- No canon records found for domain: note this; return a clean report with a caveat that no canon was available to check.
- guide-server unreachable (Phase 2+): fall back to `guides/canon/` filesystem reads; note degraded state.

## Related Commands
- Run after: `/voice-pass`
- Run before: `/publication-check`, `/qa-domain`
- `/publication-check` — uses canon check as one input to final gate

## Related Agents
- canon-checker

## Escalation Triggers
- If blocking violations are found: surface them and require user acknowledgment before continuing.

## Tool Adapter Notes
- **Claude Code:** Queries guide-server or reads guides/canon/. Produces report in chat.
- **Codex:** Invoke with "Check canon" or "Run /canon-check".
- **Windsurf:** Invoke via AI panel.
- **Copilot:** Invoke in Copilot Chat.
