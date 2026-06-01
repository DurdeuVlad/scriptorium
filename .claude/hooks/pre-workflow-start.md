# Pre-Workflow-Start Hook

**Hook Type:** Precondition Check
**Trigger:** Before any workflow begins execution
**Purpose:** Validate required inputs and dependencies before workflow starts

---

## Hook Execution

**When triggered:**
- User invokes workflow command (e.g., `/write-brief`, `/write-outline`, `/draft-section`)
- Orchestrator begins workflow execution
- **Before** any workflow steps execute

**Hook runs:**
1. Check required inputs present
2. Check required MCPs available
3. Check no blocking conflicts exist
4. If all checks pass → proceed with workflow
5. If any check fails → block workflow, return error

---

## Check 1: Required Inputs Present

**Validation:**
```javascript
for (const input of workflow.required_inputs) {
  if (!inputs[input.name]) {
    return {
      status: 'blocked',
      error: `Required input missing: ${input.name}`,
      remediation: `Provide ${input.name} parameter`
    };
  }
  
  if (inputs[input.name] === null || inputs[input.name] === '' || inputs[input.name] === 'TBD') {
    return {
      status: 'blocked',
      error: `Required input is empty or placeholder: ${input.name}`,
      remediation: `Provide valid value for ${input.name}`
    };
  }
}
```

**Example workflows and required inputs:**
- `/write-brief`: discovery_report (from /discover)
- `/write-outline`: brief (from /write-brief)
- `/draft-section`: outline, section_id
- `/review`: draft
- `/export-artifact`: artifact_path, target_format

**On failure:**
- Block workflow start
- Return error with missing input names
- Suggest command to generate missing input

---

## Check 2: Required MCPs Available

**Validation:**
```javascript
for (const mcp of workflow.required_mcps) {
  const available = await checkMCPAvailable(mcp.name);
  
  if (!available && mcp.required) {
    return {
      status: 'blocked',
      error: `Required MCP not available: ${mcp.name}`,
      remediation: `Start ${mcp.name} MCP server`
    };
  }
  
  if (!available && !mcp.required) {
    warnings.push(`Optional MCP not available: ${mcp.name}. Workflow will proceed with degraded functionality.`);
  }
}
```

**MCP requirements by workflow:**
- Discovery: guide-server (required), cache-server (required)
- Brief: guide-server (required), cache-server (required)
- Outline: guide-server (required), cache-server (required)
- Drafting: guide-server (required), cache-server (required)
- Review: cache-server (required)
- Artifact: artifact-server (required), cache-server (required)
- Sync: cache-server (optional)

**On failure:**
- If required MCP missing: block workflow, return error
- If optional MCP missing: warn, proceed with degraded functionality

---

## Check 3: No Blocking Conflicts

**Validation:**
```javascript
const conflicts = await cache_server.query_blockers({
  run_id: current_run_id,
  status: 'unresolved',
  severity: 'blocking'
});

if (conflicts.length > 0) {
  return {
    status: 'blocked',
    error: `${conflicts.length} unresolved blocking conflicts`,
    conflicts: conflicts,
    remediation: 'Resolve blocking conflicts before starting workflow'
  };
}
```

**Blocking conflict types:**
- B1-missing-user-decision (unresolved)
- B5-failed-toolchain (required dependency missing)
- B6-artifact-export-failure (blocking export operation)
- B7-schema-conflict (blocking sync conflict)

**On failure:**
- Block workflow start
- Return conflict list
- Suggest conflict resolution command

---

## Hook Response Format

**Success:**
```json
{
  "hook": "pre-workflow-start",
  "status": "pass",
  "warnings": ["Optional MCP guide-server not available"],
  "proceed": true
}
```

**Failure:**
```json
{
  "hook": "pre-workflow-start",
  "status": "blocked",
  "error": "Required input missing: discovery_report",
  "failed_checks": [
    {
      "check": "required_inputs",
      "missing": ["discovery_report"]
    }
  ],
  "remediation": "Run /discover to generate discovery report",
  "proceed": false
}
```

---

## Integration

**Claude Code integration:**
- Hook runs automatically before workflow command execution
- If hook fails, command execution blocked
- Error message displayed to user
- Remediation steps suggested

**Cache-server integration:**
- Hook execution logged via save_step
- Failures logged as blockers
- Resume point created if workflow partially started

---

## Examples

**Example 1: Missing discovery report**
```
User: /write-brief
Hook: pre-workflow-start
Check: Required input "discovery_report" missing
Result: BLOCKED

Error message:
[PRE-WORKFLOW CHECK FAILED]
Required input missing: discovery_report
Remediation: Run /discover to generate discovery report
Workflow: write-brief (blocked)
```

**Example 2: MCP not available**
```
User: /write-outline
Hook: pre-workflow-start
Check: Required MCP "guide-server" not available
Result: BLOCKED

Error message:
[PRE-WORKFLOW CHECK FAILED]
Required MCP not available: guide-server
Remediation: Start guide-server MCP or check MCP configuration
Workflow: write-outline (blocked)
```

**Example 3: All checks pass**
```
User: /write-brief discovery_report=runs/run_123/discovery.json
Hook: pre-workflow-start
Checks: All passed
Result: PROCEED

Workflow: write-brief (starting)
```
