# Brief Workflow

**Status:** Phase 6 — Executable
**Owner:** brief-writer
**Trigger:** /write-brief or /orchestrate-brief
**Output:** brief.json (saved to cache-server)
**Cache Integration:** Uses cache-server for run tracking and artifact storage

## Purpose
Translate a task description and research into a structured brief that fully specifies what is to be written. The brief is the authoritative specification document — every downstream workflow (outline, drafting, QA) derives its constraints from it.

## Inputs
| Input | Type | Required | Source |
|-------|------|----------|--------|
| task_description | string | Yes | User |
| discovery_report | object | Yes | Discovery workflow |
| research_report | object | No | Research workflow (include if available) |
| style_pack_identifier | string | Yes | Discovery report or explicit user input |
| audience_definition | string or object | Yes | Discovery report or explicit user input |

## Execution Steps

### Step 1: Initialize Brief Phase (brief-writer)
- Receive run_id from discovery workflow or start new run
- Call `fetch_run_context(run_id)` to get discovery_report artifact
- Call `save_step`: step_name='brief-init', agent='brief-writer', status='completed'

### Step 2: Load Context (brief-writer)
- Read discovery_report.json from cache-server artifacts
- Extract: confirmed context, inferred context, style_pack, domain, guides_available
- Load active style pack from `.writing-framework/styles/[style_pack].md`
- Query guide-server for domain-specific rubrics and templates
- Call `save_step`: step_name='context-load', agent='brief-writer', status='completed'

### Step 3: Define Audience (brief-writer)
- **Type 1 (Infer and Proceed):** If audience clear from discovery (e.g., CLAUDE.md specifies "developer audience"), use it and log
- **Type 2 (Infer and Flag):** If audience inferable but not explicit (e.g., technical domain → intermediate practitioners), infer and flag
- **Type 3 (Must Ask):** If audience unknown and materially affects content (beginner vs expert), create B1 blocker
- Define: primary_reader, secondary_reader (if applicable), knowledge_level, reader_needs
- Call `save_step`: step_name='audience-definition', agent='brief-writer', status='completed'

### Step 4: Define Purpose and Scope (brief-writer)
- Define purpose: what document accomplishes (not what it covers)
- Define in_scope: specific topics/questions document addresses
- Define out_of_scope: explicitly excluded topics to prevent scope creep
- **Type 1:** If scope clear from task_description, define and log
- **Type 2:** If scope could be narrow or broad, choose narrow and flag
- **Type 3:** If scope fundamentally ambiguous, create B1 blocker
- Call `save_step`: step_name='purpose-scope', agent='brief-writer', status='completed'

### Step 5: Define Success Criteria (brief-writer)
- Enumerate specific, verifiable conditions for success
- Convert to checkable statements (not vague quality descriptors)
- Map to QA perspectives (reader, skeptic, domain, style, coherence, AI-stink)
- Each criterion must be binary (pass/fail), not subjective
- Call `save_step`: step_name='success-criteria', agent='brief-writer', status='completed'

### Step 6: Define Constraints (brief-writer)
- Word count range (min/max)
- Format requirements (markdown, sections, structure)
- Required inclusions (must-have sections, must-cite sources)
- Forbidden content (topics to avoid, prohibited phrases)
- Timeline constraints (if applicable)
- Call `save_step`: step_name='constraints', agent='brief-writer', status='completed'

### Step 7: Map Source Material (brief-writer)
- List available sources from discovery_report
- Map sources to planned sections (where each will be used)
- Identify missing sources (flag as B4 blocker if critical)
- Reference canon guides from guide-server
- Call `save_step`: step_name='source-mapping', agent='brief-writer', status='completed'

### Step 8: Identify Open Questions (brief-writer)
- List only Type 3 decisions that require user input
- Each question must be specific with enumerable options
- Do not pad with hypotheticals or Type 1/2 decisions
- Mark each question as blocking or non-blocking
- Call `save_step`: step_name='open-questions', agent='brief-writer', status='completed'

### Step 9: Produce Brief (brief-writer)
- Format brief.json per schemas/brief.schema.json
- Validate all required fields populated
- Self-check: Can outline-architect produce outline without asking questions?
- Call `save_artifact`: artifact_type='structured-data', content=brief.json
- Call `save_step`: step_name='brief-production', agent='brief-writer', status='completed'

### Step 10: Brief Gate Review (lead-editor)
- Verify all required fields populated
- Verify audience defined with knowledge level
- Verify scope has explicit in_scope and out_of_scope
- Verify success criteria are enumerable and checkable
- **Gate Decision:**
  - **ACCEPT:** All criteria met, advance to outline workflow
  - **REVISE:** Specific issues identified, return to brief-writer with revision list
  - **BLOCK:** Critical blocker (B1/B2/B3), cannot proceed until resolved
- Call `save_step`: step_name='brief-gate', agent='lead-editor', status='completed', output_summary includes gate decision
- If ACCEPT: Call `save_resume_point`: checkpoint_name='post-brief', state includes brief artifact_id
- If BLOCK: Call `save_blocker` with specific blocker classification

## Decision Points and Autonomy Rules

### Type 1 Decisions (Infer and Proceed)
- **Audience clear from discovery:** Use it, log assumption
- **Purpose clear from task description:** Define it, log basis
- **Scope clear from task description:** Define boundaries, log
- **Word count inferable from document type:** Use standard range for type, log
- **Format standard for domain:** Use domain default, log

### Type 2 Decisions (Infer and Flag)
- **Audience inferable but not explicit:** Infer from domain/context, flag with override path
- **Scope could be narrow or broad:** Choose narrow, flag expansion option
- **Success criteria partially specified:** Complete with reasonable additions, flag
- **Tone not specified:** Infer from style pack + audience, flag

### Type 3 Decisions (Must Ask)
- **Audience unknown AND materially affects content:** B1 blocker, ask specific question
- **Scope fundamentally ambiguous:** B1 blocker, ask for scope clarification
- **Contradictory requirements:** B1 blocker, ask to resolve contradiction
- **No style pack + unclear domain:** B2 blocker (should be resolved in discovery)

### Blocker Scenarios
- **B1 (missing-user-decision):** Audience unknown, scope ambiguous, contradictory requirements
- **B2 (missing-repo-context):** No style pack, no doctrine files (should not reach brief if discovery worked)
- **B3 (missing-guide):** Required rubric missing for domain
- **B4 (missing-source-material):** Critical sources missing, note in open_questions
- **B9 (validation-failure):** brief.json doesn't validate against schema

## Outputs
| Output | Type | Schema | Destination |
|--------|------|--------|-------------|
| brief.json | JSON object | schemas/brief.schema.json | Outline workflow, all downstream agents |
| open_questions | array of strings | Inline in brief.open_questions | User or lead-editor for resolution |

## Quality Gate (Brief Gate)

**Pass Criteria:**
- ✅ All required schema fields populated
- ✅ Audience defined: primary_reader, knowledge_level, reader_needs
- ✅ Scope bounded: in_scope and out_of_scope explicitly listed
- ✅ Success criteria enumerable: each criterion is checkable (pass/fail)
- ✅ Constraints specified: word count, format, required/forbidden content
- ✅ Source material mapped or gaps documented
- ✅ brief.json validates against schema
- ✅ Outline-architect can proceed without asking questions

**Fail Criteria:**
- ❌ Audience undefined or vague ("general audience")
- ❌ Scope unbounded (no out_of_scope list)
- ❌ Success criteria vague ("high quality", "engaging")
- ❌ Constraints missing (no word count range)
- ❌ Open questions are blocking but not escalated

**Gate Decisions:**
- **ACCEPT:** All pass criteria met, no blocking issues → advance to outline workflow
- **REVISE:** Pass criteria mostly met, specific issues identified → return with revision list
- **BLOCK:** Critical blocker (B1/B2/B3/B9) → cannot proceed until resolved

**On BLOCK:**
- Call `save_blocker` with classification and description
- Run status set to 'paused' if severity='blocking'
- Document specific resolution required
- Create resume plan for when blocker resolved

## Related Commands
- /write-brief
- /orchestrate-brief
- /requirements-brief

## Related Agents
- brief-writer (primary executor)
- lead-editor (gate reviewer)

## Cache-Server Integration

**Tools Used:**
- `fetch_run_context` — Get discovery_report from prior phase
- `save_step` — Record each execution step (10 steps total)
- `save_artifact` — Store brief.json
- `save_blocker` — Record blockers (B1/B2/B3/B4/B9)
- `save_resume_point` — Create post-brief checkpoint

**Artifacts Produced:**
- brief.json (artifact_type='structured-data')
- Revision list if gate decision is REVISE

**Fallback (if cache-server unavailable):**
- Write brief.json to `artifacts/brief/[timestamp]-brief.json`
- Write blockers to `logs/[run_id]-brief-blockers.json`
- Continue execution (B5 degraded blocker)

## Cross-References
- `schemas/brief.schema.json` — output format
- `workflows/discovery.md` — provides discovery_report input
- `workflows/outline.md` — consumes brief.json as required input
- `doctrine/QUALITY_GATES.md` — Brief Gate criteria
- `doctrine/AUTONOMOUS_EXECUTION.md` — Type 1/2/3 decision rules
- `doctrine/BLOCKER_CLASSIFICATION.md` — B1-B9 taxonomy
- `mcp/cache-server/RUN_MODEL.md` — Run lifecycle
- `agents/brief-writer.md` — Agent specification
