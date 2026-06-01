# On-Failure Hook

**Hook Type:** Error Handler
**Trigger:** When any operation fails
**Purpose:** Handle failures gracefully, create resume points, log errors

---

## Hook Execution

**When triggered:**
- Any workflow operation fails
- Gate check fails
- Validation fails
- Dependency check fails
- File operation fails

**Hook runs:**
1. Classify failure type
2. Create resume point (preserve partial work)
3. Log failure details
4. Generate failure report
5. Suggest remediation steps
6. Return to user

---

## Failure Classification

**Failure types:**

| Type | Description | Blocker | Resumable |
|------|-------------|---------|-----------|
| gate-failure | Quality gate check failed | B9-validation-failure | Yes |
| validation-failure | Artifact/schema validation failed | B9-validation-failure | Yes |
| dependency-failure | Required dependency missing | B5-failed-toolchain | Yes |
| conflict-failure | Sync/import conflict detected | B7-schema-conflict | Yes |
| input-failure | Required input missing/invalid | B1-missing-user-decision | Yes |
| file-failure | File read/write operation failed | B6-artifact-export-failure | Yes |
| mcp-failure | MCP server unavailable | B5-failed-toolchain | Yes |
| unknown-failure | Unexpected error | B9-validation-failure | Maybe |

---

## Resume Point Creation

**Resume point includes:**

```javascript
const resume_point = {
  resume_point_id: generate_id('rp'),
  operation_id: current_operation_id,
  operation_type: operation_type,
  failure_type: failure_type,
  failure_timestamp: new Date().toISOString(),
  
  // Current state
  completed_steps: steps_completed,
  current_step: failed_step,
  next_steps: remaining_steps,
  
  // Inputs (to restart)
  inputs: operation_inputs,
  context: operation_context,
  
  // Partial outputs (work completed)
  partial_outputs: {
    artifacts: created_artifacts,
    intermediate_results: intermediate_data
  },
  
  // Failure details
  error_message: error.message,
  error_stack: error.stack,
  failed_check: failed_check_name,
  
  // Remediation
  remediation_steps: suggested_fixes,
  resume_command: resume_command_string
};

await cache_server.save_resume_point(resume_point);
```

**Resume point saved to:** cache-server resume_points table

---

## Failure Logging

**Log entry format:**

```javascript
const failure_log = {
  log_id: generate_id('log'),
  timestamp: new Date().toISOString(),
  level: 'error',
  
  // Operation context
  run_id: current_run_id,
  step_id: current_step_id,
  operation_id: current_operation_id,
  agent: current_agent,
  
  // Failure details
  failure_type: failure_type,
  error_message: error.message,
  error_code: error.code,
  error_stack: error.stack,
  
  // Location
  file_path: error.file_path,
  line_number: error.line_number,
  function_name: error.function_name,
  
  // Context
  inputs: operation_inputs,
  state: operation_state,
  
  // Remediation
  suggested_fixes: remediation_steps,
  related_docs: documentation_links
};

await cache_server.save_log(failure_log);
```

**Log destination:** cache-server logs table

---

## Blocker Creation

**Blocker entry format:**

```javascript
const blocker = {
  blocker_id: generate_id('blk'),
  run_id: current_run_id,
  step_id: current_step_id,
  
  // Classification
  blocker_type: map_failure_to_blocker(failure_type),
  severity: determine_severity(failure_type),
  status: 'unresolved',
  
  // Description
  description: error.message,
  context: operation_context,
  
  // Resolution
  resolution_options: suggested_fixes,
  resolution_status: 'pending',
  
  // Metadata
  created_at: new Date().toISOString(),
  created_by: current_agent
};

await cache_server.save_blocker(blocker);
```

**Blocker saved to:** cache-server blockers table

---

## Failure Report Generation

**Report format:**

```markdown
[OPERATION FAILED: {operation_type}]

Error: {error_message}

Failure type: {failure_type}
Operation: {operation_id}
Step: {failed_step}
Agent: {current_agent}

Details:
{detailed_error_description}

Completed work:
{list_of_completed_steps}

Partial outputs preserved:
{list_of_partial_outputs}

Remediation steps:
1. {fix_step_1}
2. {fix_step_2}
3. {fix_step_3}

To resume:
{resume_command}

Blocker: {blocker_type} ({blocker_id})
Resume point: {resume_point_id}
```

---

## Remediation Suggestions

**By failure type:**

**gate-failure:**
```
Remediation:
1. Review gate failure report
2. Fix failed criteria (specific items listed)
3. Re-run workflow command to retry gate check

Example:
  Gate: Brief Gate
  Failed: audience field too vague
  Fix: Update brief.json audience field with specific description
  Retry: /write-outline
```

**validation-failure:**
```
Remediation:
1. Review validation errors (locations provided)
2. Fix each validation error
3. Re-run validation to verify fixes

Example:
  Validation: Artifact validation
  Failed: YAML frontmatter not closed
  Fix: Add closing --- to frontmatter at line 1
  Retry: /validate-artifact {artifact_id}
```

**dependency-failure:**
```
Remediation:
1. Install missing dependency
2. Verify installation (run --version command)
3. Retry operation

Example:
  Dependency: pandoc
  Install: https://pandoc.org/installing.html
  Verify: pandoc --version
  Retry: /export-artifact {artifact_id} --format docx
```

**conflict-failure:**
```
Remediation:
1. Review conflict report
2. Choose resolution option (prefer-local, prefer-source, merge, manual)
3. Apply resolution
4. Retry sync operation

Example:
  Conflict: content-diverged
  Item: doctrine/EDITORIAL_DOCTRINE.md
  Options: prefer-local | prefer-source | merge | manual
  Retry: /import-pack {pack_path} --conflict-mode {chosen_mode}
```

---

## Partial Work Preservation

**Preserved artifacts:**
- Completed workflow steps (saved to cache-server)
- Intermediate outputs (drafts, reports, manifests)
- Created artifacts (even if validation failed)
- Partial section drafts (if multi-section operation)
- Validation results (to avoid re-running)

**Not preserved:**
- In-memory state (must be reconstructed on resume)
- Temporary files (cleaned up on failure)
- Uncommitted changes (if operation was transactional)

**Preservation location:** cache-server artifacts table, filesystem (for files)

---

## Resume Protocol

**To resume after failure:**

```bash
# Option 1: Resume entire run
/resume-run {run_id}

# Option 2: Resume specific operation
/resume-operation {operation_id}

# Option 3: Resume from specific step
/resume-step {step_id}
```

**Resume process:**
1. Load resume point from cache-server
2. Restore operation context (inputs, state)
3. Load partial outputs (completed work)
4. Determine next step (from resume point)
5. Continue from next step (skip completed work)
6. Update resume point as progress continues

---

## Hook Response Format

**Failure handled:**
```json
{
  "hook": "on-failure",
  "failure_type": "gate-failure",
  "operation_id": "op_123",
  "resume_point_id": "rp_456",
  "blocker_id": "blk_789",
  
  "error": "Brief Gate failed: audience field too vague",
  
  "completed_work": [
    "discovery-init",
    "discovery-scan",
    "discovery-classify"
  ],
  
  "partial_outputs": {
    "discovery_report": "runs/run_123/discovery.json"
  },
  
  "remediation": [
    "Update brief.json audience field with specific description",
    "Re-run /write-outline"
  ],
  
  "resume_command": "/resume-operation op_123"
}
```

---

## Integration

**Workflow integration:**
- Hook runs automatically on any operation failure
- Failure does not halt entire workflow (partial completion)
- Resume points enable continuation after fix
- Partial work preserved (not discarded)

**Cache-server integration:**
- Resume points saved to resume_points table
- Blockers saved to blockers table
- Logs saved to logs table
- Partial outputs saved to artifacts table

---

## Examples

**Example 1: Gate failure**
```
[OPERATION FAILED: write-outline]

Error: Brief Gate failed

Failure type: gate-failure
Operation: op_123
Step: pre-phase-advance
Agent: outline-architect

Details:
Brief Gate check failed with 2 criteria failures:
  1. audience field too vague: "general readers"
  2. success_criteria not testable: "high quality writing"

Completed work:
  ✓ Discovery completed
  ✓ Brief created (but failed gate check)

Partial outputs preserved:
  - discovery_report: runs/run_123/discovery.json
  - brief: runs/run_123/brief.json (needs fixes)

Remediation steps:
1. Edit brief.json:
   - Update audience: "software engineers with 2+ years experience"
   - Update success_criteria: "all code examples compile"
2. Re-run /write-outline

To resume:
/write-outline --brief runs/run_123/brief.json

Blocker: B9-validation-failure (blk_789)
Resume point: rp_456
```

**Example 2: Dependency failure**
```
[OPERATION FAILED: export-artifact]

Error: Required dependency missing: pandoc

Failure type: dependency-failure
Operation: op_456
Step: export-markdown-to-docx
Agent: artifact-orchestrator

Details:
Cannot export markdown to DOCX without pandoc.
Checked: pandoc --version (command not found)

Completed work:
  ✓ Artifact created (markdown)
  ✓ Artifact validated

Partial outputs preserved:
  - artifact: artifacts/run_123/exports/final-draft.md (valid)

Remediation steps:
1. Install pandoc: https://pandoc.org/installing.html
2. Verify installation: pandoc --version
3. Retry export: /export-artifact art_123 --format docx

Fallback option:
Export to markdown only (no conversion needed)

To resume:
/resume-operation op_456

Blocker: B5-failed-toolchain (blk_890)
Resume point: rp_567
```
