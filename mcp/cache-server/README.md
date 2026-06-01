# mcp/cache-server/ — Cache Server MCP

## Overview

The cache-server MCP provides persistent storage for run state, intermediate artifacts, blocker reports, review outputs, and resume points. It is the working memory of the orchestration system: everything that happens during a run that needs to survive between agent calls or be recoverable after interruption is stored here.

The cache-server solves a fundamental problem in multi-agent orchestration: agent calls are stateless. Each call starts fresh. Without an external persistence layer, the system cannot resume an interrupted run, cannot pass structured context between agents, and cannot reconstruct what happened in a run that produced unexpected output. The cache-server is that external persistence layer.

**Implementation status:** Phase 4 complete. Cache-server is fully implemented with SQLite backend, 11 MCP tools, and comprehensive run state management. See documentation below for usage.

---

## Backend

- **Database:** SQLite
- **Why SQLite:** Embedded, zero-dependency, reliable for single-process multi-table storage. The access pattern is single-writer (the orchestrator) with occasional reads from individual agents — SQLite is optimal for this pattern.
- **Storage model:** Two-layer. Structured metadata (run state, step records, blocker metadata) is stored in SQLite tables. Large blobs (full artifact text, review outputs, intermediate drafts) are stored as files in `artifacts/` with paths recorded in SQLite.
- **No vector index:** Cache-server does not do similarity search. It is key-based and queryable by run ID, step ID, artifact type, and timestamp.

**Dependencies needed for implementation:**
- SQLite 3.x (standard in Python 3.8+)
- Python 3.9+ or Node.js 18+ for the MCP server process
- MCP SDK (Anthropic) for tool registration and protocol compliance

---

## What Cache-Server Stores

**Runs**
A run is one complete execution of a workflow. Cache-server records the run ID, the workflow name, the start time, the current status (running / completed / failed / paused), and the input parameters.

**Steps**
Each step within a run is recorded: which agent executed it, the step name, the input, the output summary, the status, and the timestamp. Steps are the fine-grained execution trace.

**Artifacts**
Artifacts are the substantive outputs of steps: draft documents, revised documents, QA reports, merge outputs, structured data generated during a run. Artifacts are stored as files in `artifacts/` with metadata (type, producing step, run ID, creation time) in SQLite.

**Blocker reports**
When a step fails, cannot proceed, or requires human input, the agent writes a blocker report. Blocker reports include: what was blocked, why, what information or action is needed to unblock, and which step was executing when the block occurred.

**Review outputs**
QA review results: the review agent ID, the reviewed artifact ID, the rubric applied, the overall verdict (pass / conditional pass / fail), and the structured list of findings.

**Intermediate drafts**
Draft versions of documents during multi-step revision workflows. Each revision cycle produces a new intermediate draft, stored with a version number and a diff summary from the previous version.

**Merge reports**
Outputs from merge operations: which drafts were merged, the merge strategy used, any conflicts detected and how they were resolved.

**Resume points**
Snapshots of run state at checkpoints, sufficient to restart a run from that point if the original execution was interrupted. Resume points store: the current step index, all artifacts produced to that point, and any state that the remaining steps depend on.

---

## Operations

### `start_run`
Initialize a new run record.

```
start_run(
  workflow: string,         # name of the workflow being executed
  input_params: object,     # parameters passed to the workflow
  project?: string          # project identifier, if applicable
)
→ { run_id: string, started_at: string }
```

Run IDs are UUIDs. The run starts in `status: running`.

---

### `save_step`
Record a completed step within a run.

```
save_step(
  run_id: string,
  step_name: string,
  agent: string,            # which agent executed this step
  input_summary: string,    # brief description of step input
  output_summary: string,   # brief description of what was produced
  status: "completed" | "failed" | "skipped",
  duration_ms?: number
)
→ { step_id: string }
```

Failed steps should be followed by a `save_blocker` call with the failure detail.

---

### `save_artifact`
Store an artifact produced during a run.

```
save_artifact(
  run_id: string,
  step_id: string,          # which step produced this artifact
  artifact_type: string,    # "draft" | "revision" | "qa-report" | "merge-output"
                            # | "intermediate-draft" | "final-output" | "structured-data"
  content: string,          # full artifact content (stored to filesystem)
  metadata?: object         # type-specific metadata
)
→ { artifact_id: string, stored_path: string }
```

Large artifacts (over ~10KB) are stored as files in `artifacts/[run_id]/`. Small artifacts may be stored inline in SQLite.

---

### `save_blocker`
Record a blocker that has halted or degraded a step.

```
save_blocker(
  run_id: string,
  step_id: string,
  blocker_type: string,     # "missing-input" | "canon-conflict" | "qa-fail"
                            # | "ambiguous-instruction" | "external-dependency"
  description: string,      # what is blocking, specifically
  resolution_required: string,  # what must happen to unblock
  severity: "blocking" | "degraded"
)
→ { blocker_id: string }
```

`blocking` severity halts the run. `degraded` severity allows the run to continue with reduced quality or scope.

---

### `fetch_run_context`
Retrieve structured context about a run for use by a resuming or reviewing agent.

```
fetch_run_context(
  run_id: string,
  include_artifacts?: boolean   # default: false (returns metadata, not content)
)
→ {
    run: RunRecord,
    steps: StepRecord[],
    artifacts: ArtifactMetadata[],
    blockers: BlockerRecord[],
    current_status: string
  }
```

This is the primary operation for resuming an interrupted run. A fresh agent call uses `fetch_run_context` to reconstruct what has happened before taking the next step.

---

### `fetch_resume_point`
Retrieve the most recent resume point for a run.

```
fetch_resume_point(
  run_id: string
)
→ ResumePoint | null
```

Returns null if no resume point exists (the run has not reached a checkpoint or has not checkpointed). If a resume point exists, it includes everything needed to continue: the step index to resume from, the artifact IDs to treat as completed inputs, and any accumulated state variables.

---

### `list_run_artifacts`
List artifacts produced by a run, with optional type filter.

```
list_run_artifacts(
  run_id: string,
  artifact_type?: string,   # filter to a specific type
  step_id?: string          # filter to a specific step's output
)
→ { artifacts: ArtifactMetadata[] }
```

Returns metadata only. Use `get_guide` on the artifact ID (or read the stored file) for content.

---

### `close_run`
Mark a run as completed or failed.

```
close_run(
  run_id: string,
  status: "completed" | "failed" | "cancelled",
  summary?: string          # brief summary of run outcome
)
→ { success: bool, closed_at: string }
```

Closed runs remain queryable. They are not deleted. Run history is the basis for system improvement and retrospective analysis.

---

## Resume Protocol

When an agent is called to resume an interrupted run:

1. Call `fetch_resume_point(run_id)` to get the checkpoint state.
2. If no resume point, call `fetch_run_context(run_id)` and reconstruct from the step list.
3. Identify the first incomplete step.
4. Retrieve input artifacts using `list_run_artifacts` and reading the stored files.
5. Continue execution from the incomplete step.
6. Call `save_step` for each step completed during the resumed execution.

The resume protocol should not re-execute completed steps. Check the step list from `fetch_run_context` before taking any action to avoid duplication.

---

## Setup

### Installation

```bash
cd mcp/cache-server
npm install
```

### Initialize Database

```bash
npm run setup    # Create schema and tables
npm run seed     # Load test data (optional)
npm run test     # Validate installation
```

### Start Server

```bash
npm start        # Start MCP server on stdio
```

### Configuration

Environment variables:

- `CACHE_DB_PATH` — Database file path (default: `mcp/cache-server/cache.db`)
- `ARTIFACTS_DIR` — Artifact storage directory (default: `artifacts/`)

### MCP Client Configuration

Add to your MCP client config (e.g., Claude Code `~/.claude/settings.json`):

```json
{
  "mcpServers": {
    "cache-server": {
      "command": "node",
      "args": ["mcp/cache-server/src/server.js"],
      "env": {
        "CACHE_DB_PATH": "mcp/cache-server/cache.db",
        "ARTIFACTS_DIR": "artifacts"
      }
    }
  }
}
```

---

## MCP Tools

The cache-server exposes 11 MCP tools:

1. **start_run** — Initialize new run
2. **save_step** — Record step execution
3. **save_artifact** — Store artifact
4. **save_blocker** — Record blocker
5. **fetch_run_context** — Retrieve run state
6. **fetch_resume_point** — Get resume checkpoint
7. **list_run_artifacts** — List run artifacts
8. **close_run** — Mark run complete/failed
9. **save_resume_point** — Create checkpoint
10. **save_review_output** — Store QA review
11. **save_merge_report** — Record merge operation

See tool descriptions in server.js for full schemas.

---

## Documentation

- `RUN_MODEL.md` — Run lifecycle and state model
- `BLOCKER_MODEL.md` — Blocker tracking and resolution
- `RESUME_PROTOCOL.md` — Resume strategies and validation
- `COMMAND_INTEGRATION.md` — Command integration patterns
- `schema.sql` — Complete database schema

---

## Related

- `artifacts/` — filesystem storage for artifact blobs
- `mcp/guide-server/README.md` — guide record retrieval (separate MCP)
- `mcp/artifact-server/README.md` — artifact format operations (separate MCP)
- `workflows/` — workflow definitions that generate runs
- `logs/` — raw execution logs (unstructured, complementary to cache-server's structured records)
