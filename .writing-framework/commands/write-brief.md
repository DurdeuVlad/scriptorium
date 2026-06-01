# /write-brief

**Phase:** 3
**Status:** active
**Owner:** brief-writer
**Category:** editorial

## Purpose
Produce a schema-valid `brief.json` from discovery context and user requirements. This is the authoritative contract for the writing run: downstream outline, drafting, QA, and artifact steps all inherit their constraints from it.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| user_requirements | string or object | No | (derived from requirements_brief or discovery_report) | Explicit task statement, goals, constraints, or overrides |
| requirements_brief | file path or object | No | (most recent) | Preferred upstream source when `/requirements-brief` has already run |
| discovery_report | file path or object | No | (active discovery report) | Fallback upstream source if no requirements brief exists |
| run_id | string | No | (active run) | Cache-server run identifier for artifact and step logging |
| style_pack_override | string | No | (none) | Explicit style-pack identifier to use instead of discovery default |

## Behavior
1. Load source context, preferring `requirements_brief`, then `discovery_report`, then inline `user_requirements`.
2. Resolve the active run and load prior context from cache-server when available.
3. Determine `task_type`, audience, purpose, scope, and style pack from the loaded context:
   - infer when safe under the autonomy rules
   - document Type 2 assumptions in `open_questions`
   - escalate only Type 3 decisions
4. Query guide sources for any applicable templates, rubrics, canon references, and style-pack defaults.
5. Invoke `brief-writer` to produce `brief.json` with the current schema fields:
   - `brief_id`
   - `title`
   - `task_type`
   - `audience`
   - `purpose`
   - `scope`
   - `style_pack`
   - `tone` when needed
   - `success_criteria`
   - `constraints`
   - `source_material`
   - `canon_references`
   - `open_questions`
   - `created_by`
   - `created_at`
   - `run_id`
6. Validate the result against `.writing-framework/schemas/brief.schema.json`.
7. Run the Brief Gate before returning:
   - audience is specific enough to drive vocabulary and depth
   - scope is bounded with explicit `in_scope` and `out_of_scope`
   - success criteria are testable
   - constraints are concrete
8. Save the brief and step log to cache-server when available.
9. If cache-server is unavailable, write the brief to `artifacts/brief/` and log degraded execution in `logs/`.

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| brief.json | JSON object | brief.schema.json | Primary structured brief artifact |
| brief.md | markdown summary | none | Optional human-readable render of the same brief |

## Quality Gate
- `brief.json` validates against `brief.schema.json`.
- `audience.primary` is specific and `audience.knowledge_level` is populated.
- `scope.in_scope` and `scope.out_of_scope` are both explicit.
- `success_criteria` are checkable statements rather than aspirations.
- Blocking open questions are escalated rather than hidden in the brief.

## Error Handling
- No discovery or requirements context: require `/discovery` or `/requirements-brief` before proceeding.
- Schema validation failure: return field-level validation errors and do not mark the brief complete.
- Brief Gate failure: create a resume point and return the failed criteria.
- Missing guide or style-pack inputs: continue with defaults, log the degraded state, and surface the assumption.

## Related Commands
- Run after: `/discovery`, `/requirements-brief`
- Run before: `/validate-brief`, `/write-outline`
- `/orchestrate-brief` coordinates this command inside the full brief workflow

## Related Agents
- brief-writer
- lead-editor

## Escalation Triggers
- Audience cannot be inferred and materially changes document direction.
- Scope is contradictory or fundamentally ambiguous.
- The task type cannot be resolved strongly enough to select a style pack or template family.

## Tool Adapter Notes
- **Claude Code:** Loads the canonical spec, writes `brief.json`, and logs to cache-server.
- **Codex:** Invoke with "Run /write-brief" and provide requirements or an active discovery report.
- **Windsurf:** Invoke through the command adapter.
- **Copilot:** Invoke in chat using the active run context and this spec.
