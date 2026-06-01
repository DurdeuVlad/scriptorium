# /guide-gap-check

**Phase:** 2
**Status:** stub
**Owner:** discovery-agent
**Category:** guides

## Purpose
Identifies which guide types are missing or underpopulated for a given task or domain by querying guide-server and comparing results against the expected guide coverage model, then produces a structured gap report with recommended content and ready-to-run `/add-guide` commands.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| task_description | string | No | (none) | Freetext description of the task or document being produced; used to infer what guides would be relevant |
| domain | string | No | (none) | Domain to check guide coverage for; can be used alone or combined with task_description |
| guide_types_to_check | array of strings | No | [doctrine, style_pack, canon, rubric, anti_pattern] | Override the set of guide types to check; defaults to the core five types |
| include_examples | boolean | No | false | Whether to also check for example and template guide gaps |

## Behavior
1. Validate that at least one of `task_description` or `domain` is provided. If neither is given, surface a validation error and halt.
2. **Infer relevant guide categories:** Analyze the `task_description` (if provided) to identify: the likely writing domain, required tone/voice considerations, subject matter areas, audience type, and any specialized format requirements. Combine inferred domain with any explicitly provided `domain`.
3. **Per-type gap queries:** For each guide type in `guide_types_to_check`, call `/find-guides` with:
   - `query`: the domain + key topic terms derived from step 2
   - `type`: the current guide type being checked
   - `status`: active
   - `limit`: 5
4. Evaluate each per-type result set:
   - If 0 results: classify as a **critical gap** — no active guide of this type exists for the domain.
   - If 1–2 results: classify as a **thin coverage** gap — some coverage exists but may be insufficient.
   - If 3+ results: classify as **covered** — note the top result for reference.
5. If `include_examples` is true: run additional queries for `type: example` and `type: template` using the same domain/task terms.
6. **Generate gap report:** Produce a structured JSON gap report containing:
   - task_description (as supplied)
   - domain (inferred + explicit)
   - checked_at timestamp
   - gaps: array of objects, each with: guide_type, gap_severity (critical/thin/covered), existing_records (count and top titles), recommended_content (1–2 sentence description of what a guide in this slot should cover)
   - summary: overall coverage rating (full/partial/minimal)
7. For each critical or thin gap, generate a ready-to-run `/add-guide` command stub with pre-filled `type`, `domain`, `title` suggestion, and `summary` suggestion. Include these stubs in the report output so the user can run them directly.
8. Present the gap report to the user as a formatted markdown table (gap_severity, guide_type, existing count, recommended content) followed by the list of suggested `/add-guide` commands.

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| gap_report | JSON | — | Structured gap analysis with per-type severity ratings and recommendations |
| add_guide_stubs | markdown (stdout) | — | Ready-to-run /add-guide command suggestions for each critical or thin gap |
| gap_summary | markdown (stdout) | — | Formatted table of gap results with overall coverage rating |

## Quality Gate
- All types in `guide_types_to_check` must appear in the gap report — no type may be silently skipped.
- Each gap entry must have a `gap_severity` value and a `recommended_content` description.
- The generated `/add-guide` stubs must include at minimum `type`, `domain`, and a suggested `title` and `summary`.

## Error Handling
- `/find-guides` returns an error for a specific type query: record the type as `gap_severity: unknown` in the report, note the error, and continue checking other types.
- guide-server is fully unavailable: switch all queries to the filesystem fallback mode (via `/find-guides`). Note the fallback in the report.
- Neither `task_description` nor `domain` is specific enough to infer a domain: surface a "too vague" warning, attempt the check against the general/unscoped guide corpus, and ask the user to provide a more specific task description.

## Related Commands
- Run after: `/discovery` (when setting up a new project) or on demand when guides seem insufficient
- Run before: `/add-guide` (using the generated stubs)
- Related: `/find-guides`, `/add-guide`, `/apply-doctrine`

## Related Agents
- discovery-agent
- lead-editor
- guide-server (MCP tool)

## Escalation Triggers
- All checked guide types return critical gaps (zero active guides for any type in the domain): escalate to lead-editor. This typically means the framework has not been set up for this domain and a guided onboarding run is needed before production work proceeds.

## Tool Adapter Notes
- **Claude Code:** Calls `/find-guides` for each type via sequential tool calls. Constructs the gap report in session context. Outputs `/add-guide` stubs as formatted code blocks that can be copy-run directly.
- **Codex:** Invoke with "Check guide gaps for [domain]" or "Run /guide-gap-check domain=[domain]".
- **Windsurf:** Invoke via AI panel. The gap report appears inline; suggested /add-guide stubs can be run from the panel.
- **Copilot:** Invoke in Copilot Chat. Copilot presents the gap report and suggests next steps.
