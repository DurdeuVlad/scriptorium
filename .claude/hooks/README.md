# Hooks — Enforcement and Guardrails

**Purpose:** Define hook-based enforcement for workflow operations, quality gates, and operational safety.

---

## Overview

Hooks are enforcement points that run at specific workflow integration points to validate preconditions, enforce quality gates, and handle failures. They prevent unsafe operations, ensure work quality, and make failures visible and resumable.

---

## Hook Types

### 1. Precondition Hooks

Run before operations to validate required conditions are met.

**Hooks:**
- `pre-workflow-start` — Check inputs and dependencies before workflow begins
- `pre-phase-advance` — Check quality gates before advancing to next phase
- `pre-artifact-finalize` — Check validation before finalizing artifact
- `pre-file-overwrite` — Check confirmation before overwriting files
- `pre-cache-delete` — Check resume points before deleting cache

### 2. Validation Hooks

Run during operations to validate intermediate state.

**Hooks:**
- `on-gate-check` — Validate gate criteria during phase transition
- `on-validation-check` — Validate artifact/schema during validation
- `on-conflict-check` — Validate conflict resolution during sync

### 3. Completion Hooks

Run after operations to log results and update state.

**Hooks:**
- `post-operation-complete` — Log completion, update cache
- `post-gate-pass` — Log gate pass, advance phase
- `post-artifact-create` — Log artifact creation, update manifest

### 4. Error Hooks

Run when operations fail to handle errors gracefully.

**Hooks:**
- `on-failure` — Handle failures, create resume points, log errors
- `on-gate-failure` — Handle gate failures, suggest remediation
- `on-validation-failure` — Handle validation failures, preserve work

---

## Hook Execution Model

**Execution flow:**
```
1. Operation requested (e.g., /write-outline)
2. Pre-operation hook runs (e.g., pre-workflow-start)
   ├─ If hook passes → proceed to step 3
   └─ If hook fails → block operation, return error
3. Operation executes (workflow steps)
4. Validation hooks run during operation (e.g., on-gate-check)
   ├─ If validation passes → continue operation
   └─ If validation fails → trigger on-failure hook
5. Post-operation hook runs (e.g., post-operation-complete)
6. Operation complete
```

**Hook failure behavior:**
- Pre-operation hooks: Block operation, return error immediately
- Validation hooks: Trigger error hook, create resume point
- Post-operation hooks: Log warning, operation considered complete
- Error hooks: Always run, cannot fail (best-effort)

---

## Hook Specifications

### pre-workflow-start

**Trigger:** Before workflow begins
**Checks:**
1. Required inputs present and valid
2. Required MCPs available
3. No blocking conflicts exist

**On failure:** Block workflow start, return error with missing items

**See:** `.claude/hooks/pre-workflow-start.md`

---

### pre-phase-advance

**Trigger:** Before advancing to next workflow phase
**Checks:**
1. Previous phase quality gate passed
2. No unresolved blockers for current phase

**Gates enforced:**
- Discovery → Brief: Discovery Gate
- Brief → Outline: Brief Gate
- Outline → Draft: Outline Gate
- Draft → Review: Draft Gate
- Review → Artifact: QA Gate
- Artifact → Finalize: Artifact Gate

**On failure:** Block phase advance, return gate failure report

**See:** `.claude/hooks/pre-phase-advance.md`

---

### pre-artifact-finalize

**Trigger:** Before finalizing artifact
**Checks:**
1. Artifact validation status acceptable
2. Source content complete (no placeholders)
3. File integrity verified
4. Dependencies available (if export operation)

**On failure:** Block finalization, return validation errors

**See:** `.claude/hooks/pre-artifact-finalize.md`

---

### on-failure

**Trigger:** When any operation fails
**Actions:**
1. Classify failure type
2. Create resume point (preserve partial work)
3. Log failure details
4. Generate failure report
5. Suggest remediation steps

**Always runs:** Cannot be skipped or disabled

**See:** `.claude/hooks/on-failure.md`

---

## Hook Integration

### Claude Code Integration

Hooks integrated into Claude Code workflow commands:

```javascript
// Example: /write-outline command
async function writeOutline(brief_path) {
  // Pre-workflow hook
  const preCheck = await runHook('pre-workflow-start', {
    workflow: 'write-outline',
    required_inputs: { brief: brief_path },
    required_mcps: ['guide-server', 'cache-server']
  });
  
  if (!preCheck.proceed) {
    return error(preCheck.error, preCheck.remediation);
  }
  
  // Pre-phase-advance hook (Brief Gate)
  const gateCheck = await runHook('pre-phase-advance', {
    from_phase: 'brief',
    to_phase: 'outline',
    gate: 'Brief Gate'
  });
  
  if (!gateCheck.proceed) {
    return error(gateCheck.error, gateCheck.failed_criteria);
  }
  
  // Execute workflow
  try {
    const outline = await outlineArchitect.generate(brief);
    
    // Post-operation hook
    await runHook('post-operation-complete', {
      operation: 'write-outline',
      outputs: { outline }
    });
    
    return success(outline);
  } catch (error) {
    // Error hook
    await runHook('on-failure', {
      operation: 'write-outline',
      error: error
    });
    
    return error(error.message, error.remediation);
  }
}
```

---

### Cache-Server Integration

Hook results logged to cache-server:

```javascript
// Hook execution logged
await cache_server.save_step({
  run_id: current_run_id,
  step_name: 'hook-execution',
  agent: 'hook-system',
  status: hook.status,
  output_summary: {
    hook_name: hook.name,
    hook_result: hook.result,
    checks_passed: hook.checks_passed,
    checks_failed: hook.checks_failed
  }
});

// Hook failures logged as blockers
if (hook.status === 'blocked') {
  await cache_server.save_blocker({
    run_id: current_run_id,
    blocker_type: hook.blocker_type,
    description: hook.error,
    resolution_options: hook.remediation
  });
}
```

---

## Hook Configuration

### Enabling/Disabling Hooks

**Default:** All hooks enabled

**To disable specific hook (not recommended):**
```json
// .claude/settings.local.json
{
  "hooks": {
    "pre-workflow-start": { "enabled": true },
    "pre-phase-advance": { "enabled": true },
    "pre-artifact-finalize": { "enabled": true },
    "on-failure": { "enabled": true }
  }
}
```

**Warning:** Disabling hooks removes safety guarantees. Only disable for testing or debugging.

---

### Hook Severity Levels

Hooks can be configured with severity levels:

**strict (default):** Block operation on any failure
**warn:** Log warning, allow operation to proceed
**disabled:** Skip hook entirely

```json
{
  "hooks": {
    "pre-workflow-start": { "severity": "strict" },
    "pre-phase-advance": { "severity": "strict" },
    "pre-artifact-finalize": { "severity": "warn" }
  }
}
```

**Recommendation:** Keep all hooks at "strict" severity for production use.

---

## Testing Hooks

### Manual Hook Testing

Test hooks independently:

```bash
# Test pre-workflow-start hook
/test-hook pre-workflow-start --workflow write-outline --inputs brief=runs/run_123/brief.json

# Test pre-phase-advance hook
/test-hook pre-phase-advance --from brief --to outline

# Test pre-artifact-finalize hook
/test-hook pre-artifact-finalize --artifact art_123
```

### Hook Test Suite

Run full hook test suite:

```bash
# Test all hooks
/test-hooks --all

# Test specific hook category
/test-hooks --category precondition
/test-hooks --category validation
/test-hooks --category error
```

---

## Troubleshooting

### Hook Blocking Operation Incorrectly

**Symptom:** Hook blocks operation that should proceed

**Diagnosis:**
1. Check hook execution log in cache-server
2. Review failed checks
3. Verify inputs/state are correct

**Resolution:**
1. Fix failed check (e.g., provide missing input)
2. Retry operation
3. If hook is incorrect, report issue

### Hook Not Running

**Symptom:** Operation proceeds without hook check

**Diagnosis:**
1. Check hook configuration (enabled?)
2. Check hook integration in command
3. Review operation logs

**Resolution:**
1. Enable hook in configuration
2. Verify command integrates hook
3. Update command if hook missing

### Hook Failure Not Resumable

**Symptom:** Cannot resume after hook failure

**Diagnosis:**
1. Check resume point created (on-failure hook ran?)
2. Review resume point details
3. Verify partial work preserved

**Resolution:**
1. Check cache-server for resume point
2. Use /resume-operation command
3. If resume point missing, re-run operation

---

## Best Practices

### 1. Always Run Pre-Operation Hooks

**Do:**
- Run pre-workflow-start before every workflow
- Run pre-phase-advance before every phase transition
- Run pre-artifact-finalize before every finalization

**Don't:**
- Skip hooks to "save time"
- Disable hooks in production
- Bypass hooks with direct file operations

### 2. Handle Hook Failures Gracefully

**Do:**
- Read hook failure messages carefully
- Follow remediation steps
- Fix root cause (not just symptoms)

**Don't:**
- Ignore hook failures
- Retry without fixing issue
- Disable hook to bypass failure

### 3. Preserve Partial Work on Failure

**Do:**
- Let on-failure hook run (creates resume point)
- Review partial outputs before retrying
- Resume from resume point when possible

**Don't:**
- Delete partial work on failure
- Re-run entire operation from scratch
- Skip resume point creation

### 4. Log Hook Executions

**Do:**
- Review hook logs regularly
- Monitor hook failure patterns
- Track gate pass/fail rates

**Don't:**
- Ignore hook logs
- Assume hooks always work correctly
- Skip log review after failures

---

## Cross-References

- `doctrine/OPERATIONAL_GUARDRAILS.md` — Guardrail definitions and enforcement rules
- `doctrine/QUALITY_GATES.md` — Gate definitions and pass criteria
- `doctrine/HUMAN_IN_THE_LOOP_GATES.md` — When to ask user vs proceed
- `mcp/cache-server/RESUME_PROTOCOL.md` — Resume point creation and usage
- `.claude/hooks/pre-workflow-start.md` — Pre-workflow hook specification
- `.claude/hooks/pre-phase-advance.md` — Phase advance hook specification
- `.claude/hooks/pre-artifact-finalize.md` — Artifact finalize hook specification
- `.claude/hooks/on-failure.md` — Failure handler hook specification
