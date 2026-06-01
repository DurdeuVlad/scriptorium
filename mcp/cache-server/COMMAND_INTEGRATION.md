# Command Integration Guide

## Overview

This document specifies which commands should use cache-server tools and how they integrate with run state management.

## Cache-Server Tool Usage by Command

### Foundation Commands

| Command | Cache Tools Used | When |
|---------|-----------------|------|
| `/session-start` | `start_run` | Initialize new production run |
| `/status` | `fetch_run_context`, `list_run_artifacts` | Query current run state |
| `/whats-next` | `fetch_run_context`, `fetch_resume_point` | Determine next step in workflow |
| `/resume` | `fetch_resume_point`, `fetch_run_context` | Resume interrupted run |

### Discovery Commands

| Command | Cache Tools Used | When |
|---------|-----------------|------|
| `/discovery` | `save_step`, `save_artifact` | Record discovery results |
| `/requirements-brief` | `save_step`, `save_artifact` | Record requirements analysis |

### Editorial Commands

| Command | Cache Tools Used | When |
|---------|-----------------|------|
| `/write-brief` | `save_step`, `save_artifact`, `save_resume_point` | Record brief, create checkpoint |
| `/write-outline` | `save_step`, `save_artifact`, `save_resume_point` | Record outline, create checkpoint |
| `/draft-section` | `save_step`, `save_artifact` | Record section draft |
| `/merge-sections` | `save_step`, `save_artifact`, `save_merge_report` | Record merge operation |
| `/normalize-draft` | `save_step`, `save_artifact` | Record normalized draft |
| `/revise-draft` | `save_step`, `save_artifact` | Record revision |

### QA Commands

| Command | Cache Tools Used | When |
|---------|-----------------|------|
| `/qa-reader` | `save_step`, `save_review_output` | Record readability review |
| `/qa-skeptic` | `save_step`, `save_review_output` | Record skeptical review |
| `/qa-domain` | `save_step`, `save_review_output` | Record domain review |
| `/qa-style` | `save_step`, `save_review_output` | Record style review |
| `/qa-coherence` | `save_step`, `save_review_output` | Record coherence review |
| `/qa-ai-stink` | `save_step`, `save_review_output` | Record AI detection review |
| `/qa-final` | `save_step`, `save_review_output`, `save_blocker` | Record final QA, blockers if fail |

### Orchestration Commands

| Command | Cache Tools Used | When |
|---------|-----------------|------|
| `/orchestrate-brief` | `start_run`, `save_step`, `save_artifact`, `save_resume_point`, `close_run` | Full brief workflow |
| `/orchestrate-outline` | `start_run`, `save_step`, `save_artifact`, `save_resume_point`, `close_run` | Full outline workflow |
| `/orchestrate-draft` | `start_run`, `save_step`, `save_artifact`, `save_merge_report`, `save_resume_point`, `close_run` | Full draft workflow |
| `/orchestrate-review` | `fetch_run_context`, `save_step`, `save_review_output`, `save_blocker` | Full review workflow |
| `/orchestrate-finalize` | `fetch_run_context`, `save_step`, `save_artifact`, `close_run` | Full finalization workflow |

## Integration Patterns

### Pattern 1: Simple Step Recording

**Use for:** Individual agent invocations that produce one artifact

```javascript
async function executeCommand(commandName, agent, input) {
  const stepId = await save_step({
    run_id: currentRunId,
    step_name: commandName,
    agent: agent,
    input_summary: summarizeInput(input),
    output_summary: '', // Will update after execution
    status: 'completed'
  });
  
  const output = await agent.execute(input);
  
  const artifactId = await save_artifact({
    run_id: currentRunId,
    step_id: stepId,
    artifact_type: determineArtifactType(output),
    content: output.content,
    metadata: output.metadata
  });
  
  return { stepId, artifactId, output };
}
```

### Pattern 2: Checkpoint Creation

**Use for:** Workflow boundaries where resume is likely

```javascript
async function createWorkflowCheckpoint(runId, phaseName, state, artifactIds) {
  await save_resume_point({
    run_id: runId,
    step_index: state.currentStepIndex,
    checkpoint_name: `post-${phaseName}`,
    state_snapshot: state,
    artifact_ids: artifactIds
  });
}

// Example: After brief completion
const briefArtifactId = await writeBrief(runId, discoveryResult);
await createWorkflowCheckpoint(runId, 'brief', {
  current_phase: 'outline',
  brief_approved: true,
  requirements: extractRequirements(briefArtifactId)
}, [discoveryArtifactId, briefArtifactId]);
```

### Pattern 3: Blocker Handling

**Use for:** QA failures, missing inputs, canon conflicts

```javascript
async function handleQAFailure(runId, stepId, qaResult) {
  if (qaResult.verdict === 'fail') {
    await save_blocker({
      run_id: runId,
      step_id: stepId,
      blocker_type: 'qa-fail',
      description: `QA failed: ${qaResult.summary}`,
      resolution_required: qaResult.resolution_guidance,
      severity: qaResult.canContinue ? 'degraded' : 'blocking'
    });
    
    if (!qaResult.canContinue) {
      await close_run(runId, 'paused', 'QA gate failure');
    }
  }
}
```

### Pattern 4: Resume from Context

**Use for:** Resuming interrupted workflows

```javascript
async function resumeRun(runId) {
  // Try explicit resume point first
  const resumePoint = await fetch_resume_point(runId);
  
  if (resumePoint) {
    return resumeFromCheckpoint(resumePoint);
  }
  
  // Fall back to context reconstruction
  const context = await fetch_run_context(runId, false);
  
  // Validate run can be resumed
  if (context.run.status === 'completed') {
    throw new Error('Run already completed');
  }
  
  // Find blocking blocker if paused
  if (context.run.status === 'paused') {
    const blocker = context.blockers.find(
      b => b.severity === 'blocking' && !b.resolved
    );
    if (blocker) {
      throw new Error(`Unresolved blocker: ${blocker.description}`);
    }
  }
  
  // Find next step
  const completedSteps = context.steps.filter(s => s.status === 'completed');
  const nextStepIndex = completedSteps.length;
  
  return resumeFromStepIndex(context, nextStepIndex);
}
```

### Pattern 5: Merge Operation Recording

**Use for:** Section merging, draft assembly

```javascript
async function recordMergeOperation(runId, stepId, sourceArtifactIds, outputArtifactId, strategy, conflicts) {
  await save_merge_report({
    run_id: runId,
    step_id: stepId,
    source_artifact_ids: sourceArtifactIds,
    output_artifact_id: outputArtifactId,
    merge_strategy: strategy,
    conflicts_detected: conflicts.length,
    conflict_resolutions: conflicts.map(c => ({
      location: c.location,
      type: c.type,
      resolution: c.resolution
    }))
  });
}
```

## Run Lifecycle Integration

### Orchestration Command Template

```javascript
async function orchestrateWorkflow(workflowName, inputParams) {
  // 1. Start run
  const { run_id } = await start_run({
    workflow: workflowName,
    input_params: inputParams,
    project: inputParams.project
  });
  
  try {
    // 2. Execute phases with checkpoints
    const phase1Result = await executePhase1(run_id, inputParams);
    await save_resume_point({
      run_id,
      step_index: 1,
      checkpoint_name: 'post-phase1',
      state_snapshot: { phase1_complete: true },
      artifact_ids: [phase1Result.artifactId]
    });
    
    const phase2Result = await executePhase2(run_id, phase1Result);
    await save_resume_point({
      run_id,
      step_index: 2,
      checkpoint_name: 'post-phase2',
      state_snapshot: { phase2_complete: true },
      artifact_ids: [phase1Result.artifactId, phase2Result.artifactId]
    });
    
    // 3. Close run on success
    await close_run(run_id, 'completed', 'Workflow completed successfully');
    
    return { run_id, result: phase2Result };
    
  } catch (error) {
    // 4. Close run on failure
    await close_run(run_id, 'failed', error.message);
    throw error;
  }
}
```

## Cache-Server Availability

### Primary Path: MCP Tools

When cache-server MCP is available, use MCP tools directly:

```javascript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

const client = new Client({
  name: 'orchestrator',
  version: '1.0.0'
});

await client.connect(transport);

const result = await client.callTool('start_run', {
  workflow: 'brief-production',
  input_params: { topic: 'AI Systems' }
});
```

### Fallback Path: Direct Database Access

If MCP is unavailable, commands can access the database directly:

```javascript
import Database from 'better-sqlite3';

const db = new Database('mcp/cache-server/cache.db');

const runId = uuidv4();
db.prepare(`
  INSERT INTO runs (run_id, workflow, status, input_params, started_at, updated_at)
  VALUES (?, ?, 'running', ?, ?, ?)
`).run(runId, workflow, JSON.stringify(params), now, now);
```

**Note:** Direct database access should only be used when MCP is unavailable. MCP tools are the preferred interface.

## Related

- `RUN_MODEL.md` — run state model
- `BLOCKER_MODEL.md` — blocker handling
- `RESUME_PROTOCOL.md` — resume strategies
- `.writing-framework/commands/COMMAND_REGISTRY.md` — full command catalog
