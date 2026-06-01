# Operational Guardrails

**Status:** Canonical. Defines enforcement rules, preconditions, and failure handling for workflow operations.
**Phase:** 9
**Related:** QUALITY_GATES.md, HUMAN_IN_THE_LOOP_GATES.md, BLOCKER_CLASSIFICATION.md

---

## Purpose

Define operational guardrails that prevent unsafe workflow execution, enforce required quality gates, and ensure failures are visible and resumable. Guardrails protect against incomplete work advancing, risky operations proceeding without validation, and silent failures.

---

## Core Principles

### 1. Fail Visibly, Resume Cleanly

Failures must be immediately visible with clear error messages. Every failure state must be resumable without data loss.

**Implications:**
- No silent failures (all errors logged and surfaced)
- Failure messages include: what failed, why, what to fix, how to resume
- Resume points created before risky operations
- Partial work preserved (not discarded on failure)

### 2. Enforce Required Gates for Risky Operations

Operations that can cause data loss, silent corruption, or workflow deadlock require gate checks before proceeding.

**Risky operations:**
- Finalizing artifacts (cannot undo export)
- Overwriting existing files (data loss risk)
- Advancing workflow phase without gate pass (incomplete work propagates)
- Deleting cached state (lose resume capability)

**Implications:**
- Gate checks run before risky operations
- Operations blocked if gate fails
- User notified of gate failure with remediation steps
- No automatic bypass of failed gates

### 3. Do Not Over-Automate Into Fragility

Guardrails prevent errors but do not create brittle workflows that break on minor issues.

**Implications:**
- Warnings for non-critical issues (do not block)
- Errors only for critical issues (block operation)
- Clear distinction between must-fix and should-fix
- Graceful degradation when optional dependencies missing

---

## Precondition Enforcement Rules

### Workflow Preconditions

**Before starting any workflow:**

✅ **Check 1: Required inputs present**
- Workflow inputs defined in workflow spec must be provided
- No required input is null, empty, or placeholder
- **If fails:** Block workflow start, return error with missing inputs list

✅ **Check 2: Required MCPs available**
- Workflows requiring guide-server, cache-server, or artifact-server check MCP availability
- **If fails:** Block workflow start if MCP is required, warn if optional

✅ **Check 3: No blocking conflicts**
- Check for unresolved blocking conflicts from previous operations
- **If fails:** Block workflow start, present conflict report for resolution

**Before advancing workflow phase:**

✅ **Check 4: Previous phase gate passed**
- Discovery → Brief: Discovery Gate passed
- Brief → Outline: Brief Gate passed
- Outline → Draft: Outline Gate passed
- Draft → Review: Draft Gate passed
- Review → Artifact: QA Gate passed
- **If fails:** Block phase advancement, return gate failure report

✅ **Check 5: No unresolved blockers**
- All blockers affecting current phase are resolved or escalated
- **If fails:** Block phase advancement, return blocker list

### Operation Preconditions

**Before artifact finalization:**

✅ **Check 6: Artifact validation passed**
- Artifact validation_status = 'valid' or 'not-validated'
- If 'invalid', validation errors must be resolved
- **If fails:** Block finalization, return validation errors

✅ **Check 7: Source content complete**
- No unresolved placeholders (e.g., `[BLOCKED: B4-missing-source]`)
- No TODO markers in final content
- **If fails:** Block finalization, return placeholder locations

**Before file overwrite:**

✅ **Check 8: Overwrite confirmation**
- If file exists and conflict_resolution_mode='ask', require user confirmation
- If file exists and has local modifications, warn before overwrite
- **If fails:** Block overwrite, request user decision

**Before cache deletion:**

✅ **Check 9: Resume point exists**
- If deleting run cache, ensure run is complete or explicitly abandoned
- If run has resume points, warn before deletion
- **If fails:** Block deletion, request user confirmation

---

## Required Gate Checks

### Discovery Gate (Required before Brief)

**Enforced by:** brief-writer agent, /write-brief command

**Checks:**
1. Discovery report exists and conforms to discovery_report.schema.json
2. `context.confirmed` section populated
3. `context.inferred` section populated (or explicitly empty if no inferences)
4. `blockers` section: all blockers classified (B1-B9), documented
5. `next_actions` section: specific, actionable items (not vague)

**On failure:**
- Block brief creation
- Return gate failure report with missing/invalid items
- Suggest: "Run /discover to generate discovery report"

### Brief Gate (Required before Outline)

**Enforced by:** outline-architect agent, /write-outline command

**Checks:**
1. Brief exists and conforms to brief.schema.json
2. `audience` field: specific (not "general readers")
3. `scope` field: explicit boundaries (in-scope and out-of-scope)
4. `constraints` field: populated (or explicitly empty)
5. `success_criteria` field: testable criteria (not vague)

**On failure:**
- Block outline creation
- Return gate failure report with missing/invalid fields
- Suggest: "Run /write-brief or update existing brief"

### Outline Gate (Required before Drafting)

**Enforced by:** section-drafter agent, /draft-section command

**Checks:**
1. Outline exists and conforms to outline.schema.json
2. Every section has: title, purpose statement, estimated scope
3. Section order justified
4. No overlapping purpose statements
5. All brief scope areas accounted for

**On failure:**
- Block section drafting
- Return gate failure report with missing/invalid sections
- Suggest: "Run /write-outline or update existing outline"

### Draft Gate (Required before Review)

**Enforced by:** adversarial-reviewer agent, /review command

**Checks:**
1. Draft exists (full_draft.md or merged sections)
2. All sections from outline present in draft
3. No placeholder sections (e.g., `[Section to be written]`)
4. Word count within ±20% of outline estimates (warning if exceeded)

**On failure:**
- Block review start
- Return gate failure report with missing sections
- Suggest: "Complete drafting or mark sections as blocked"

### QA Gate (Required before Artifact)

**Enforced by:** artifact-orchestrator agent, /export-artifact command

**Checks:**
1. Review report exists and conforms to review_report.schema.json
2. QA perspectives applied (at minimum: qa-reader, qa-final)
3. Overall verdict: ACCEPT or ACCEPT (with warnings)
4. No blocking findings (severity=critical, status=unresolved)

**On failure:**
- Block artifact generation
- Return gate failure report with blocking findings
- Suggest: "Resolve critical QA findings or run /qa-final"

### Artifact Gate (Required before Finalize)

**Enforced by:** artifact-orchestrator agent, /finalize-artifact command

**Checks:**
1. Artifact exists at specified path
2. Artifact validation_status = 'valid' or 'not-validated' (not 'invalid')
3. No unresolved placeholders in artifact content
4. File size > 0 bytes
5. If export operation, dependencies available (pandoc, latex)

**On failure:**
- Block finalization
- Return gate failure report with validation errors
- Suggest: "Run /validate-artifact or resolve placeholders"

### Sync Gate (Required before Import/Export)

**Enforced by:** import-export-orchestrator agent, /import-pack, /export-pack commands

**Checks:**
1. Source exists (pack directory or repo path)
2. No unresolved blocking conflicts from previous sync
3. If import mode='ask', pending_changes list approved by user
4. If overwrite mode, user confirmation received

**On failure:**
- Block sync operation
- Return gate failure report with conflicts or missing approvals
- Suggest: "Resolve conflicts or approve pending changes"

---

## Logging Behaviors

### Operation Logging

**All workflow operations log:**
- Operation start: timestamp, operation_id, agent, inputs
- Operation progress: step completions, intermediate outputs
- Operation end: timestamp, status (completed/failed/blocked), outputs
- Errors: error type, error message, stack trace (if applicable)

**Log destination:** cache-server (save_step, save_artifact, save_blocker)

### Gate Check Logging

**All gate checks log:**
- Gate name (Discovery Gate, Brief Gate, etc.)
- Check timestamp
- Check result (pass/fail)
- Failed criteria (if fail)
- Remediation suggestions

**Log destination:** cache-server (save_step with gate_check_result)

### Failure Logging

**All failures log:**
- Failure type (gate failure, validation failure, dependency failure, etc.)
- Failure location (workflow step, file path, line number if applicable)
- Failure cause (what went wrong)
- Remediation steps (how to fix)
- Resume point (how to continue after fix)

**Log destination:** cache-server (save_blocker with failure details)

---

## Failure Response Rules

### Gate Failure Response

**When gate check fails:**
1. Block operation immediately (do not proceed)
2. Generate gate failure report with:
   - Gate name
   - Failed criteria (specific items)
   - Current state (what exists, what's missing)
   - Remediation steps (how to pass gate)
3. Save blocker to cache-server (blocker_type based on gate)
4. Return gate failure report to user
5. Suggest next action (command to run or manual fix)

**Example gate failure response:**
```
[GATE FAILURE: Brief Gate]
Failed criteria:
  - audience field is vague: "general readers" (must be specific)
  - success_criteria field is not testable: "high quality writing"

Current state:
  - Brief exists at: runs/run_123/brief.json
  - 3/5 required fields valid

Remediation:
  1. Update audience field with specific description (e.g., "software engineers with 2+ years experience")
  2. Update success_criteria with testable criteria (e.g., "all code examples compile", "no assumed knowledge beyond Python basics")

Next action: Edit brief.json and re-run /write-outline
Blocker: B9-validation-failure (Brief Gate failed)
```

### Validation Failure Response

**When validation fails:**
1. Block operation if validation is required
2. Generate validation failure report with:
   - Validation type (schema, format, content)
   - Failed checks (specific validation rules)
   - Error locations (file, line, field)
   - Suggested fixes
3. Save blocker to cache-server (B9-validation-failure)
4. Return validation failure report to user
5. Preserve invalid artifact (do not delete)

**Example validation failure response:**
```
[VALIDATION FAILURE: Artifact]
Failed checks:
  - YAML frontmatter not properly closed (line 1)
  - Heading hierarchy skipped level: H1 → H3 (line 45)
  - Empty section: "Conclusion" has no content (line 120)

Artifact: artifacts/run_123/exports/final-draft.md
Status: invalid

Remediation:
  1. Add closing --- to YAML frontmatter
  2. Insert H2 heading before H3 at line 45
  3. Add content to Conclusion section or remove section

Next action: Fix validation errors and re-run /validate-artifact
Blocker: B9-validation-failure (Artifact validation failed)
```

### Dependency Failure Response

**When dependency missing:**
1. Classify as B5-failed-toolchain
2. Determine if dependency is required or optional
3. If required: block operation, return error
4. If optional: warn, offer fallback, proceed with degraded functionality
5. Save blocker to cache-server
6. Suggest installation steps

**Example dependency failure response:**
```
[DEPENDENCY FAILURE: pandoc not found]
Operation: export_markdown_to_docx
Required: yes
Status: blocked

Remediation:
  1. Install pandoc: https://pandoc.org/installing.html
  2. Verify installation: pandoc --version
  3. Re-run /export-artifact

Fallback: Export to markdown only (no DOCX conversion)
Blocker: B5-failed-toolchain (pandoc not available)
```

### Conflict Failure Response

**When conflict detected:**
1. Block operation if conflict is blocking severity
2. Generate conflict report with:
   - Conflict type (content-diverged, schema-incompatible, etc.)
   - Severity (blocking, warning, info)
   - Local version details
   - Source version details
   - Resolution options
3. Save blocker to cache-server (blocker_type based on conflict)
4. Return conflict report to user
5. Wait for user resolution

**Example conflict failure response:**
```
[CONFLICT: content-diverged]
Item: doctrine/EDITORIAL_DOCTRINE.md
Severity: blocking
Conflict type: Both local and source versions changed from common ancestor

Local version:
  - Last modified: 2026-03-28 10:00:00
  - Hash: abc123...

Source version:
  - Last modified: 2026-03-29 09:00:00
  - Hash: def456...

Resolution options:
  1. prefer-local: Keep local version, skip source update
  2. prefer-source: Accept source version, overwrite local
  3. merge: Attempt three-way merge (may require manual resolution)
  4. manual: Resolve conflict manually, then re-run sync

Next action: Choose resolution option and re-run /import-pack
Blocker: B7-schema-conflict (Sync conflict requires resolution)
```

---

## Resumability Guarantees

### Resume Point Creation

**Resume points created before:**
- Risky operations (file overwrite, cache deletion)
- Long-running operations (full document draft, multi-perspective QA)
- Operations with external dependencies (artifact export, sync)

**Resume point includes:**
- Operation ID
- Operation type
- Current state (what's been completed)
- Next steps (what remains)
- Inputs (to restart operation)
- Partial outputs (work completed so far)

### Resume Protocol

**To resume after failure:**
1. Identify resume point from cache-server (query by run_id or operation_id)
2. Load partial state (completed work, inputs, context)
3. Determine next step (from resume point next_steps)
4. Continue from next step (skip completed work)
5. Update resume point as progress continues

**Resume commands:**
- `/resume-run <run_id>` — Resume entire run from last resume point
- `/resume-step <step_id>` — Resume specific step from checkpoint
- `/resume-operation <operation_id>` — Resume specific operation

---

## Hook Integration Points

Hooks enforce guardrails at specific workflow integration points:

1. **pre-workflow-start** — Check preconditions before workflow begins
2. **pre-phase-advance** — Check gate before advancing to next phase
3. **pre-artifact-finalize** — Check validation before finalizing artifact
4. **pre-file-overwrite** — Check confirmation before overwriting file
5. **pre-cache-delete** — Check resume points before deleting cache
6. **post-operation-complete** — Log operation completion
7. **on-failure** — Handle failure, create resume point, log error

**Hook specifications defined in:** `.claude/hooks/` (Claude adapter), `.writing-framework/hooks/` (canonical)

---

## Cross-References

- `doctrine/QUALITY_GATES.md` — Gate definitions and pass criteria
- `doctrine/HUMAN_IN_THE_LOOP_GATES.md` — When to ask user vs proceed
- `doctrine/BLOCKER_CLASSIFICATION.md` — B1-B9 blocker taxonomy
- `mcp/cache-server/RESUME_PROTOCOL.md` — Resume point creation and usage
- `.claude/hooks/` — Hook specifications for Claude adapter
