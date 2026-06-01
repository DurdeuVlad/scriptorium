# Discovery Workflow

**Status:** Phase 5 — Executable
**Owner:** discovery-orchestrator
**Trigger:** /discovery command, /session-start, or beginning of any orchestrate-* command
**Output:** discovery_report.json (saved to cache-server) + immediate next actions list
**Cache Integration:** Uses cache-server for run tracking and artifact storage

## Purpose
Scan the existing repo context, load doctrine, identify gaps, and produce a structured discovery report before any writing begins. Ensures every downstream workflow operates from confirmed context rather than assumptions.

## Inputs
| Input | Type | Required | Source |
|-------|------|----------|--------|
| project_directory_path | string (path) | Yes | User or session context |
| task_description | string | Yes | User |
| prior_run_context | object | No | cache-server |
| guide_query_terms | array of strings | No | Inferred from task description |

## Execution Steps

### Step 1: Initialize Run (discovery-orchestrator)
- Call `start_run` on cache-server with workflow='discovery' and input_params from user request
- Receive run_id for tracking all subsequent operations
- Log run initialization

### Step 2: Context Scan (discovery-agent)
- Read CLAUDE.md at project root — extract project identity, active style packs, doctrine overrides
- Read all files in `.writing-framework/doctrine/` — note which are present, extract project-specific rules
- Scan `.writing-framework/styles/` for available style pack files
- Scan `.writing-framework/guides/` for available guide records
- Scan `artifacts/` for prior work products
- Scan `logs/` for prior run records
- Read relevant workflow files in `.writing-framework/workflows/`
- Check `.writing-framework/templates/` for available document templates
- Call `save_step` on cache-server: step_name='context-scan', agent='discovery-agent', status='completed'

### Step 3: Guide Query (discovery-agent)
- Query guide-server using `find_guides` with task-relevant terms
- Filter results by domain and type (prioritize: doctrine, style-pack, canon, rubric)
- Record all guide IDs found
- Call `save_step` on cache-server: step_name='guide-query', agent='discovery-agent', status='completed'

### Step 4: Prior Run Check (discovery-orchestrator)
- Query cache-server using `fetch_run_context` for any prior runs with same project
- If prior run exists with status='paused': flag as Type 3 decision (Must Ask user: resume or start fresh)
- If prior run exists with status='completed': load as reference context
- Call `save_step` on cache-server: step_name='prior-run-check', agent='discovery-orchestrator', status='completed'

### Step 5: Style Pack Detection (discovery-agent)
- Classify task domain from task_description (technical, creative, worldbuilding, general)
- Match domain to available style packs in `.writing-framework/styles/`
- If multiple matches: select most specific
- If no match: flag as B2 blocker (missing-repo-context)
- Call `save_step` on cache-server: step_name='style-pack-detection', agent='discovery-agent', status='completed'

### Step 6: Gap Classification (discovery-orchestrator)
- Review all findings from discovery-agent
- Classify each gap using blocker taxonomy:
  - B1: Missing user decision (ambiguous intent, contradictory instructions)
  - B2: Missing repo context (no style pack, no doctrine files)
  - B3: Missing guide (no rubric for domain, no canon for worldbuilding)
  - B4: Missing source material (research, reference content)
  - B5: Failed toolchain (guide-server unavailable, cache-server unavailable)
  - B6: Artifact export failure (not applicable in discovery)
  - B7: Schema conflict (not applicable in discovery)
  - B8: Canon conflict (not applicable in discovery)
  - B9: Validation failure (discovery report incomplete)
- For each blocker: determine impacted_scope and unimpacted_scope
- Call `save_blocker` on cache-server for each B-type blocker with severity='blocking' or 'degraded'
- Call `save_step` on cache-server: step_name='gap-classification', agent='discovery-orchestrator', status='completed'

### Step 7: Discovery Report Assembly (discovery-orchestrator)
- Compile findings_report from discovery-agent
- Add blocker classifications
- Add immediate next actions based on findings:
  - If no blockers: recommend `/write-brief`
  - If B1 blockers: list specific user decisions needed
  - If B2/B3 blockers: recommend creating missing files
  - If B4 blockers: recommend research phase
- Format as discovery_report.json per schema
- Call `save_artifact` on cache-server: artifact_type='structured-data', content=discovery_report.json
- Call `save_step` on cache-server: step_name='report-assembly', agent='discovery-orchestrator', status='completed'

### Step 8: Checkpoint Creation (discovery-orchestrator)
- Call `save_resume_point` on cache-server:
  - checkpoint_name='post-discovery'
  - state_snapshot includes: domain, style_pack, blockers, findings
  - artifact_ids includes: discovery_report artifact_id
- Call `close_run` on cache-server with status='completed' (if no blocking blockers) or status='paused' (if blocking blockers exist)

## Decision Points and Autonomy Rules

### Type 1 Decisions (Infer and Proceed)
- **Single style pack matches domain:** Select it, log assumption
- **Multiple non-conflicting guides found:** Use all, log which were selected
- **Task domain is clear from description:** Classify domain, log basis
- **Prior run completed successfully:** Load as reference, proceed
- **Template exists for task type:** Note availability, proceed

### Type 2 Decisions (Infer and Flag)
- **Multiple style packs could apply:** Choose most specific, flag decision with override instructions
- **Task scope could be interpreted narrowly or broadly:** Choose narrow, flag with expansion option
- **Audience not specified but inferable from project context:** Infer, flag assumption
- **No prior runs but similar artifacts exist:** Note similarity, flag as potential reference

### Type 3 Decisions (Must Ask)
- **No style pack found AND domain unclear:** Cannot proceed to brief — B2 blocker, ask user for domain or style pack
- **Prior run exists with status='paused':** Must ask: resume or start fresh (affects all downstream work)
- **Task description contradicts existing project constraints:** B1 blocker, ask user to resolve contradiction
- **No doctrine files found:** B2 blocker, cannot establish baseline — ask user to run `/install-framework` or provide doctrine

### Blocker Severity Assignment
- **Blocking severity:** No style pack + unclear domain, no doctrine files, contradictory instructions
- **Degraded severity:** Missing optional guides, missing templates (can proceed with defaults), missing examples

## Outputs

| Output | Type | Schema | Destination |
|--------|------|--------|-------------|
| discovery_report.json | JSON object | schemas/discovery_report.schema.json | Cache-server (via save_artifact) |
| immediate_next_actions | array of strings | — | Returned to orchestrator in discovery_report |
| blocker_reports | array of blocker objects | schemas/blocker_report.schema.json | Cache-server (via save_blocker) |
| run record | run metadata | cache-server runs table | Cache-server (via start_run, close_run) |
| step records | step execution trace | cache-server steps table | Cache-server (via save_step) |
| resume_point | checkpoint state | cache-server resume_points table | Cache-server (via save_resume_point) |

## Quality Gate

**Pass Criteria:**
- ✅ All seven scan targets visited (CLAUDE.md, doctrine/, styles/, guides/, artifacts/, logs/, workflows/, templates/)
- ✅ All confirmed context documented with file paths and summaries
- ✅ All assumptions explicitly labeled with basis for inference
- ✅ All gaps classified using B1-B9 taxonomy with severity assignment
- ✅ Immediate next actions are specific commands or user decisions (not vague)
- ✅ discovery_report.json validates against schema
- ✅ All steps recorded in cache-server
- ✅ Resume point created with complete state snapshot

**Fail Criteria (triggers B9 validation-failure blocker):**
- ❌ Scan targets skipped without documentation
- ❌ Assumptions presented as facts (not labeled)
- ❌ Gaps listed without blocker classification
- ❌ Next actions are vague ("continue", "proceed", "do more work")
- ❌ discovery_report.json missing required fields

**On Failure:**
- Call `save_blocker` with classification='B9-validation-failure'
- Document which quality criteria failed
- Produce partial discovery_report with completed sections
- Flag for human review before proceeding

## Related Commands
- /discovery
- /discovery-agent
- /project-scan
- /session-start
- /orchestrate-draft (invokes discovery as first step)
- /orchestrate-brief (invokes discovery as first step)

## Related Agents
- discovery-orchestrator (owner)
- discovery-agent (executor)

## Cache-Server Integration

**Tools Used:**
- `start_run` — Initialize discovery run
- `save_step` — Record each execution step (8 steps total)
- `save_artifact` — Store discovery_report.json
- `save_blocker` — Record each B-type blocker
- `save_resume_point` — Create post-discovery checkpoint
- `close_run` — Mark discovery complete or paused
- `fetch_run_context` — Check for prior runs

**Fallback (if cache-server unavailable):**
- Write discovery_report.json to `artifacts/discovery/[timestamp]-discovery-report.json`
- Write blocker reports to `logs/[timestamp]-blockers.json`
- Log warning: cache-server unavailable, using filesystem fallback
- Continue execution (cache unavailability is B5 blocker with degraded severity)

## Cross-References
- `doctrine/AUTONOMOUS_EXECUTION.md` — Type 1/2/3 decision classification
- `doctrine/PROGRESSIVE_UNBLOCKING.md` — Partial completion protocol
- `doctrine/HUMAN_IN_THE_LOOP_GATES.md` — Type 3 decision triggers
- `schemas/blocker_report.schema.json` — Blocker format
- `schemas/discovery_report.schema.json` — Discovery report format
- `mcp/cache-server/COMMAND_INTEGRATION.md` — Cache-server tool usage
- `mcp/cache-server/RUN_MODEL.md` — Run lifecycle management
- `mcp/cache-server/BLOCKER_MODEL.md` — Blocker classification details
