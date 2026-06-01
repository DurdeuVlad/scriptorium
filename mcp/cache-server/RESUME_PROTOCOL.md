# Resume Protocol

## Overview

The resume protocol defines how agents restart execution after interruption. Interruptions can be:
- **Blocking blocker**: Run paused due to unresolved issue
- **System failure**: Process crash, timeout, resource exhaustion
- **User abort**: User stopped execution mid-run
- **Checkpoint resume**: User wants to restart from a saved checkpoint

## Resume Point Model

Resume points are explicit checkpoints saved during execution. They capture everything needed to restart from that point.

```typescript
interface ResumePoint {
  resume_point_id: string;      // UUID
  run_id: string;               // Run this checkpoint belongs to
  step_index: number;           // Step index to resume from (0-based)
  checkpoint_name: string;      // Human-readable checkpoint name
  state_snapshot: object;       // All state needed to resume (JSON)
  artifact_ids: string[];       // Artifacts completed up to this point
  created_at: string;           // ISO 8601 timestamp
}
```

### When to Create Resume Points

Resume points should be created at natural workflow boundaries:

| Checkpoint Name | When | State Snapshot Includes |
|----------------|------|------------------------|
| `post-discovery` | After discovery phase | Discovery report, inferred defaults, domain |
| `post-brief` | After brief approved | Brief artifact ID, requirements, constraints |
| `post-outline` | After outline approved | Outline artifact ID, section list, dependencies |
| `post-draft` | After draft merge | Draft artifact ID, section artifact IDs, merge report |
| `post-review` | After QA passes | Review outputs, approved artifact ID |

### State Snapshot Contents

The `state_snapshot` field stores all variables needed to resume:

```json
{
  "current_phase": "drafting",
  "current_section": 3,
  "sections_total": 8,
  "sections_completed": [0, 1, 2],
  "outline_approved": true,
  "style_pack": "technical-explanation",
  "domain": "technical",
  "target_length": 3000,
  "accumulated_word_count": 1200
}
```

## Resume Strategies

### Strategy 1: Resume from Explicit Checkpoint

**Use when:** User wants to restart from a saved checkpoint (e.g., "resume from post-outline")

**Steps:**
1. Call `fetch_resume_point(run_id)`
2. Retrieve `state_snapshot` and `artifact_ids`
3. Load artifacts from `artifact_ids`
4. Restore state variables from `state_snapshot`
5. Continue execution from `step_index`

**Example:**
```javascript
const resumePoint = await fetch_resume_point(runId);
if (!resumePoint) {
  throw new Error('No resume point found');
}

const state = resumePoint.state_snapshot;
const artifacts = await Promise.all(
  resumePoint.artifact_ids.map(id => fetch_artifact(id))
);

// Resume from step_index
continueExecution(resumePoint.step_index, state, artifacts);
```

### Strategy 2: Resume from Run Context (No Checkpoint)

**Use when:** No explicit checkpoint exists, but run was interrupted

**Steps:**
1. Call `fetch_run_context(run_id)`
2. Analyze `steps` to find first incomplete step
3. Retrieve completed artifacts from `artifacts`
4. Reconstruct state from completed steps
5. Continue from first incomplete step

**Example:**
```javascript
const context = await fetch_run_context(runId);

// Find first incomplete step
const completedSteps = context.steps.filter(s => s.status === 'completed');
const nextStepIndex = completedSteps.length;

// Reconstruct state from completed steps
const state = reconstructStateFromSteps(completedSteps);
const artifacts = context.artifacts;

// Resume
continueExecution(nextStepIndex, state, artifacts);
```

### Strategy 3: Resume After Blocker Resolution

**Use when:** Run was paused due to blocking blocker, blocker now resolved

**Steps:**
1. Call `fetch_run_context(run_id, include_artifacts=false)`
2. Find the blocking blocker
3. Verify blocker is resolved
4. Retrieve blocker resolution note
5. Apply resolution to run state
6. Resume from blocked step (retry) or next step (skip)

**Example:**
```javascript
const context = await fetch_run_context(runId);

const blocker = context.blockers.find(b => 
  b.severity === 'blocking' && !b.resolved
);

if (blocker) {
  throw new Error('Blocker still unresolved');
}

const resolvedBlocker = context.blockers.find(b => 
  b.severity === 'blocking' && b.resolved
);

// Apply resolution
applyBlockerResolution(resolvedBlocker);

// Resume from blocked step
const blockedStepIndex = context.steps.findIndex(
  s => s.step_id === resolvedBlocker.step_id
);

continueExecution(blockedStepIndex, state, artifacts);
```

## Resume Validation

Before resuming, validate:

### 1. Run State Consistency
```javascript
function validateRunState(context) {
  // Run must be paused or failed (not completed or cancelled)
  if (context.run.status === 'completed') {
    throw new Error('Cannot resume completed run');
  }
  if (context.run.status === 'cancelled') {
    throw new Error('Cannot resume cancelled run');
  }
  
  // If paused, must have blocking blocker
  if (context.run.status === 'paused') {
    const blockingBlocker = context.blockers.find(
      b => b.severity === 'blocking' && !b.resolved
    );
    if (blockingBlocker) {
      throw new Error('Blocking blocker must be resolved before resume');
    }
  }
}
```

### 2. Artifact Availability
```javascript
function validateArtifacts(resumePoint) {
  for (const artifactId of resumePoint.artifact_ids) {
    const artifact = fetchArtifact(artifactId);
    if (!artifact) {
      throw new Error(`Required artifact ${artifactId} not found`);
    }
  }
}
```

### 3. State Snapshot Completeness
```javascript
function validateStateSnapshot(snapshot, workflow) {
  const requiredFields = getRequiredFieldsForWorkflow(workflow);
  for (const field of requiredFields) {
    if (!(field in snapshot)) {
      throw new Error(`State snapshot missing required field: ${field}`);
    }
  }
}
```

## Resume Point Creation

Agents should create resume points at workflow boundaries:

```javascript
async function createCheckpoint(runId, stepIndex, checkpointName, state, artifactIds) {
  await save_resume_point({
    run_id: runId,
    step_index: stepIndex,
    checkpoint_name: checkpointName,
    state_snapshot: state,
    artifact_ids: artifactIds
  });
}

// Example usage in orchestration
async function orchestrateBriefProduction(params) {
  const runId = await startRun('brief-production', params);
  
  // Phase 1: Discovery
  const discoveryResult = await runDiscovery(runId);
  await createCheckpoint(runId, 1, 'post-discovery', {
    discovery_complete: true,
    domain: discoveryResult.domain,
    inferred_defaults: discoveryResult.defaults
  }, [discoveryResult.artifact_id]);
  
  // Phase 2: Brief
  const briefResult = await writeBrief(runId, discoveryResult);
  await createCheckpoint(runId, 2, 'post-brief', {
    brief_complete: true,
    brief_approved: true,
    requirements: briefResult.requirements
  }, [discoveryResult.artifact_id, briefResult.artifact_id]);
  
  // Continue...
}
```

## Partial Progress Persistence

The cache-server ensures no work is lost:

### Completed Steps
All completed steps are persisted immediately via `save_step`. Even if a run fails, completed work is preserved.

### Intermediate Artifacts
All artifacts are persisted immediately via `save_artifact`. Section drafts, QA reports, merge outputs are never lost.

### Incremental Resume
Resume can happen at any step boundary. The system does not re-execute completed steps.

## Resume Protocol Summary

| Scenario | Resume Strategy | Required Data |
|----------|----------------|---------------|
| Explicit checkpoint | `fetch_resume_point` | Resume point record |
| Interrupted run | `fetch_run_context` | Steps + artifacts |
| Blocker resolved | `fetch_run_context` + blocker check | Blocker resolution |
| System crash | `fetch_run_context` | Steps + artifacts |
| User abort | `fetch_run_context` or `fetch_resume_point` | Depends on abort point |

## Related

- `RUN_MODEL.md` — run lifecycle and state management
- `BLOCKER_MODEL.md` — blocker tracking and resolution
- `schema.sql` — resume_points table schema
- `.writing-framework/agents/lead-orchestrator.md` — orchestration and checkpointing
