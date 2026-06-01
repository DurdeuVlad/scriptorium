# Run Model

## Overview

The run model defines how the cache-server tracks execution state across the lifecycle of a production workflow. A run is the top-level container for all work performed during one execution of a workflow (brief production, draft production, review cycle, etc.).

## Run Lifecycle

```
[start_run] → running → [steps execute] → [blocker?] → paused
                                       ↓
                                    [close_run] → completed/failed/cancelled
```

### States

| State | Description | Transitions |
|-------|-------------|-------------|
| `running` | Run is actively executing | → `paused` (blocker), → `completed` (success), → `failed` (error), → `cancelled` (user abort) |
| `paused` | Run halted by blocking blocker | → `running` (blocker resolved, resume) |
| `completed` | Run finished successfully | Terminal state |
| `failed` | Run finished with failure | Terminal state |
| `cancelled` | Run aborted by user | Terminal state |

### Run Record Fields

```typescript
interface RunRecord {
  run_id: string;           // UUID
  workflow: string;         // Workflow name (e.g., "brief-production")
  project: string | null;   // Project identifier
  status: RunStatus;        // Current state
  input_params: object;     // Workflow input parameters (JSON)
  started_at: string;       // ISO 8601 timestamp
  updated_at: string;       // ISO 8601 timestamp
  closed_at: string | null; // ISO 8601 timestamp (null if not closed)
  summary: string | null;   // Brief outcome summary
}
```

## Step Model

Steps are the fine-grained execution trace within a run. Each step represents one agent invocation or command execution.

### Step Record Fields

```typescript
interface StepRecord {
  step_id: string;          // UUID
  run_id: string;           // Parent run ID
  step_name: string;        // Step name (e.g., "discovery", "write-brief")
  agent: string;            // Agent that executed this step
  input_summary: string;    // Brief description of inputs
  output_summary: string;   // Brief description of outputs
  status: StepStatus;       // completed | failed | skipped
  duration_ms: number;      // Execution duration in milliseconds
  created_at: string;       // ISO 8601 timestamp
}
```

### Step Status

- **completed**: Step executed successfully
- **failed**: Step failed (should be followed by `save_blocker`)
- **skipped**: Step was skipped due to conditional logic or blocker in prior step

## Artifact Model

Artifacts are substantive outputs produced during steps. They are the actual work products: drafts, reports, structured data.

### Artifact Record Fields

```typescript
interface ArtifactRecord {
  artifact_id: string;      // UUID
  run_id: string;           // Parent run ID
  step_id: string;          // Step that produced this artifact
  artifact_type: string;    // Type of artifact
  content: string | null;   // Inline content (for small artifacts)
  stored_path: string | null; // Filesystem path (for large artifacts)
  metadata: object;         // Type-specific metadata (JSON)
  size_bytes: number;       // Content size in bytes
  created_at: string;       // ISO 8601 timestamp
}
```

### Artifact Types

| Type | Description | Typical Size |
|------|-------------|--------------|
| `draft` | Complete draft document | Large (>10KB) |
| `revision` | Revised version of a draft | Large (>10KB) |
| `qa-report` | QA review report | Medium (1-10KB) |
| `merge-output` | Merged document from multiple sources | Large (>10KB) |
| `intermediate-draft` | Section draft or partial document | Medium-Large |
| `final-output` | Publication-ready output | Large (>10KB) |
| `structured-data` | JSON/structured output (discovery reports, etc.) | Small (<1KB) |

### Storage Strategy

- **Small artifacts** (<10KB): Stored inline in `content` field
- **Large artifacts** (≥10KB): Stored as files in `artifacts/[run_id]/[artifact_id].txt`, path recorded in `stored_path`

This hybrid approach optimizes database size while supporting efficient retrieval of small structured data.

## Run Context

The `fetch_run_context` operation returns a complete snapshot of a run's state:

```typescript
interface RunContext {
  run: RunRecord;
  steps: StepRecord[];
  artifacts: ArtifactMetadata[];  // or full content if include_artifacts=true
  blockers: BlockerRecord[];
  current_status: string;
}
```

This is the primary operation for:
- Resuming an interrupted run
- Reviewing what happened in a completed run
- Debugging a failed run
- Generating run reports

## Run Metadata and Input Parameters

The `input_params` field stores the original workflow parameters as JSON. This enables:
- Exact reproduction of a run
- Parameter validation during resume
- Run comparison and analysis

Example input parameters:

```json
{
  "topic": "AI Writing Systems",
  "domain": "technical",
  "style_pack": "technical-explanation",
  "target_length": 3000,
  "sections": ["introduction", "architecture", "implementation", "evaluation"]
}
```

## Run Queries

Common queries supported by the cache-server:

### List all runs for a project
```sql
SELECT * FROM runs WHERE project = ? ORDER BY started_at DESC
```

### Find active runs
```sql
SELECT * FROM runs WHERE status = 'running' ORDER BY started_at ASC
```

### Find paused runs (need resume)
```sql
SELECT * FROM runs WHERE status = 'paused' ORDER BY started_at ASC
```

### Get run statistics
```sql
SELECT 
  COUNT(*) as total_steps,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_steps,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_steps,
  AVG(duration_ms) as avg_duration_ms
FROM steps
WHERE run_id = ?
```

## Related

- `BLOCKER_MODEL.md` — blocker tracking and resolution
- `RESUME_PROTOCOL.md` — resuming interrupted runs
- `schema.sql` — complete database schema
