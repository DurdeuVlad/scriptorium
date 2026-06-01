# Blockage Workflow

**Status:** Phase 5 — Executable
**Owner:** blockage-handler
**Trigger:** Any B1-B9 blocker detected during workflow execution
**Output:** blocker_report.json (saved to cache-server) + partial outputs + resume plan
**Cache Integration:** Uses cache-server for blocker persistence and partial artifact tracking

## Purpose

Handle workflow blockers by classifying them, documenting impact, continuing all unblocked work in parallel, and producing a structured resume plan. Ensures blocked runs never halt entirely when partial progress is possible.

## Inputs

| Input | Type | Required | Source |
|-------|------|----------|--------|
| blocker_description | string | Yes | Triggering agent |
| run_id | string | Yes | cache-server (current run) |
| current_run_context | object | Yes | cache-server via fetch_run_context |
| outline.json | file | No | cache-server artifacts (if applicable) |
| brief.json | file | No | cache-server artifacts (if applicable) |

## Execution Steps

### Step 1: Receive Blocker (blockage-handler)
- Receive blocker_description from triggering agent
- Receive run_id for current run
- Call `fetch_run_context` on cache-server to get full run state
- Call `save_step` on cache-server: step_name='blocker-received', agent='blockage-handler', status='completed'

### Step 2: Classify Blocker (blockage-handler)
- Classify blocker using B1-B9 taxonomy:
  - **B1: missing-user-decision** — Ambiguous intent, contradictory instructions, Type 3 decision needed
  - **B2: missing-repo-context** — No style pack, no doctrine files, missing project configuration
  - **B3: missing-guide** — No rubric for domain, no canon for worldbuilding, missing required guide
  - **B4: missing-source-material** — Research content, reference documents, external data not available
  - **B5: failed-toolchain** — guide-server unavailable, cache-server unavailable, MCP failure
  - **B6: artifact-export-failure** — Cannot generate docx, PDF export failed, LaTeX compile error
  - **B7: schema-conflict** — Output doesn't validate against schema, incompatible schema versions
  - **B8: canon-conflict** — Draft contradicts established canon, lore inconsistency detected
  - **B9: validation-failure** — Quality gate failed, output incomplete, required fields missing
- Assign severity: 'blocking' (halts affected work) or 'degraded' (reduces quality but can continue)
- Call `save_step` on cache-server: step_name='blocker-classification', agent='blockage-handler', status='completed'

### Step 3: Scope Impact Analysis (blockage-handler)
- Determine exact impacted_scope:
  - If blocker affects brief: all downstream work blocked
  - If blocker affects outline: section drafting blocked, but brief/research can continue
  - If blocker affects specific sections: only those sections blocked
  - If blocker affects export: drafting can continue, only final artifact blocked
- Determine unimpacted_scope:
  - List all sections/phases/outputs that can proceed
  - Identify parallel work branches that are independent of blocker
- Call `save_step` on cache-server: step_name='scope-analysis', agent='blockage-handler', status='completed'

### Step 4: Execute Unblocked Work (blockage-handler)
- For each item in unimpacted_scope:
  - Invoke appropriate agent (section-drafter, qa-reader, etc.)
  - Call `save_step` for each agent invocation
  - Call `save_artifact` for each output produced
  - Label each output with status: 'complete' (fully done) or 'partial' (depends on blocked work)
- Do NOT halt execution — maximize partial progress
- Call `save_step` on cache-server: step_name='unblocked-execution', agent='blockage-handler', status='completed'

### Step 5: Create Placeholder Entries (blockage-handler)
- For each item in impacted_scope:
  - Create placeholder entry clearly labeled with blocker type
  - Include specific description of what is needed to unblock
  - Format: `[BLOCKED: B{N}] {description of what would go here} — Needs: {specific requirement}`
- Save placeholders as artifacts with artifact_type='intermediate-draft' and metadata indicating blocked status
- Call `save_step` on cache-server: step_name='placeholder-creation', agent='blockage-handler', status='completed'

### Step 6: Generate Resume Plan (blockage-handler)
- Write RESUME section specifying:
  - **blocked_on:** Exact description of what must be provided/resolved
  - **to_resume:** Specific command to run when unblocked (e.g., `/draft-section section_id=S3 run_id={run_id}`)
  - **when_unblocked:** Description of what will be produced after resolution
  - **already_complete:** List of all completed work (with artifact IDs)
- Estimate remaining work based on impacted_scope
- Call `save_step` on cache-server: step_name='resume-plan', agent='blockage-handler', status='completed'

### Step 7: Persist Blocker Report (blockage-handler)
- Format blocker_report.json per schema
- Include: blocker classification, impacted/unimpacted scope, partial outputs, resume plan
- Call `save_blocker` on cache-server with:
  - blocker_type from classification
  - description from analysis
  - severity from classification
  - resolution_required from resume plan
- Call `save_artifact` on cache-server: artifact_type='structured-data', content=blocker_report.json
- Call `save_step` on cache-server: step_name='blocker-persist', agent='blockage-handler', status='completed'

### Step 8: Return to Orchestrator (blockage-handler)
- Return blocker_report.json to lead-orchestrator
- Return list of partial_outputs (artifact IDs)
- Return resume_command for when blocker is resolved
- If severity='blocking': run status already set to 'paused' by save_blocker
- If severity='degraded': run continues with degraded quality noted

## Blocker Severity Rules

### Blocking Severity (Halts Affected Work)
- B1 when ambiguity affects fundamental document direction
- B2 when missing context prevents any reasonable inference
- B3 when missing guide is required by doctrine (e.g., canon for worldbuilding)
- B4 when source material is explicitly required and no substitute exists
- B8 when canon conflict cannot be resolved without user decision
- B9 when validation failure affects document integrity

### Degraded Severity (Continues with Reduced Quality)
- B1 when ambiguity is minor and reasonable default exists
- B2 when missing context can be inferred with flagged assumption
- B3 when missing guide is optional or has reasonable default
- B4 when source material can be approximated or placeholder used
- B5 when toolchain failure has filesystem fallback
- B6 when export failure doesn't block drafting
- B7 when schema conflict can be resolved by schema migration
- B9 when validation failure is non-critical

## Partial Completion Protocol

**Maximize Useful Output:**
- Complete all sections that don't depend on blocked information
- Produce real content, not stubs or "TBD" placeholders
- Label partial outputs clearly with completion status
- Document exactly what is missing and why

**Labeling Format:**
```markdown
## PARTIAL OUTPUT — RESUME REQUIRED

**Completed:** Section 1 (Introduction), Section 2 (Background), Section 4 (Methodology)
**Blocked:** Section 3 (Literature Review) — B4: missing source material
**Missing:** 5 academic papers on topic X (see blocker_report.json for details)
**To Resume:** Provide papers, then run `/draft-section section_id=S3 run_id={run_id}`
```

**Quality Standards for Partial Output:**
- Completed sections are production-quality (not drafts of drafts)
- Blocked sections have descriptive placeholders (not empty)
- All outputs validate against applicable schemas
- Resume instructions are executable commands (not vague guidance)

## Outputs

| Output | Type | Schema | Destination |
|--------|------|--------|-------------|
| blocker_report.json | JSON object | schemas/blocker_report.schema.json | Cache-server (via save_blocker, save_artifact) |
| partial_outputs | array of artifacts | varies by type | Cache-server (via save_artifact) |
| placeholder_entries | array of artifacts | varies by type | Cache-server (via save_artifact) |
| resume_command | string | — | Returned to orchestrator |
| step records | step execution trace | cache-server steps table | Cache-server (via save_step) |

## Quality Gate

**Pass Criteria:**
- ✅ Blocker classified with B1-B9 code
- ✅ Severity assigned (blocking or degraded)
- ✅ Impacted scope specifically enumerated
- ✅ Unimpacted scope identified and executed
- ✅ Partial outputs produced for all unblocked work
- ✅ Placeholders created for all blocked work
- ✅ Resume plan includes specific command and requirements
- ✅ blocker_report.json validates against schema
- ✅ All steps recorded in cache-server

**Fail Criteria:**
- ❌ Blocker not classified (vague "something is wrong")
- ❌ All work halted when partial progress possible
- ❌ Partial outputs unlabeled or status unclear
- ❌ Resume plan vague ("get more information")
- ❌ Unblocked work not executed

**On Failure:**
- Escalate to lead-orchestrator (Level 3)
- Document which quality criteria failed
- Produce best-effort blocker report with available information

## Autonomy Rules for Blockage Handling

### Type 1 Actions (Proceed Without Asking)
- Execute all unblocked work in parallel
- Create descriptive placeholders for blocked sections
- Classify blocker using B1-B9 taxonomy
- Assign severity based on impact analysis
- Generate resume plan with specific commands

### Type 2 Actions (Proceed and Flag)
- Choose between multiple unblocking strategies (flag choice)
- Infer blocker severity when impact is ambiguous (flag assumption)
- Select which unblocked work to prioritize (flag order)

### Type 3 Actions (Must Ask)
- Resolve B1 blocker requiring user decision
- Resolve B8 canon conflict requiring user choice
- Determine whether to abandon run when >80% scope blocked

## Related Commands
- /handle-blocker
- /resume-run
- /orchestrate-* (all orchestration commands invoke blockage-handler on blocker detection)

## Related Agents
- lead-orchestrator (invokes blockage-handler)
- discovery-orchestrator (may invoke blockage-handler for critical discovery blockers)
- section-drafter (invoked by blockage-handler for unblocked sections)

## Cache-Server Integration

**Tools Used:**
- `fetch_run_context` — Get current run state
- `save_step` — Record each execution step (8 steps total)
- `save_blocker` — Persist blocker with classification and severity
- `save_artifact` — Store blocker_report.json and partial outputs
- `list_run_artifacts` — Enumerate already-complete work

**Fallback (if cache-server unavailable):**
- Write blocker_report.json to `logs/[run_id]-blocker-[timestamp].json`
- Write partial outputs to `artifacts/[run_id]/partial/`
- Log warning: cache-server unavailable, using filesystem fallback
- Continue execution (cache unavailability is B5 blocker with degraded severity)

## Cross-References
- `doctrine/AUTONOMOUS_EXECUTION.md` — Type 1/2/3 decision classification, partial completion protocol
- `doctrine/PROGRESSIVE_UNBLOCKING.md` — Blocker taxonomy and continuation rules
- `doctrine/HUMAN_IN_THE_LOOP_GATES.md` — Type 3 decision triggers
- `schemas/blocker_report.schema.json` — Blocker report format
- `mcp/cache-server/BLOCKER_MODEL.md` — Blocker types, severity, resolution patterns
- `mcp/cache-server/RESUME_PROTOCOL.md` — Resume strategies and validation
- `.writing-framework/agents/blockage-handler.md` — Agent role specification
