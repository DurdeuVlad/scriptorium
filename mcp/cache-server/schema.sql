-- cache-server schema
-- SQLite database for run state, steps, artifacts, blockers, and resume points
-- Phase 4 implementation

-- Runs table: top-level run records
CREATE TABLE IF NOT EXISTS runs (
    run_id TEXT PRIMARY KEY,
    workflow TEXT NOT NULL,
    project TEXT,
    status TEXT NOT NULL CHECK(status IN ('running', 'completed', 'failed', 'cancelled', 'paused')),
    input_params TEXT,  -- JSON blob
    started_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    closed_at TEXT,
    summary TEXT
);

CREATE INDEX idx_runs_status ON runs(status);
CREATE INDEX idx_runs_workflow ON runs(workflow);
CREATE INDEX idx_runs_started_at ON runs(started_at);

-- Steps table: individual step execution records within a run
CREATE TABLE IF NOT EXISTS steps (
    step_id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL,
    step_name TEXT NOT NULL,
    agent TEXT NOT NULL,
    input_summary TEXT,
    output_summary TEXT,
    status TEXT NOT NULL CHECK(status IN ('completed', 'failed', 'skipped')),
    duration_ms INTEGER,
    created_at TEXT NOT NULL,
    FOREIGN KEY (run_id) REFERENCES runs(run_id) ON DELETE CASCADE
);

CREATE INDEX idx_steps_run_id ON steps(run_id);
CREATE INDEX idx_steps_status ON steps(status);
CREATE INDEX idx_steps_agent ON steps(agent);
CREATE INDEX idx_steps_created_at ON steps(created_at);

-- Artifacts table: outputs produced during runs
CREATE TABLE IF NOT EXISTS artifacts (
    artifact_id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL,
    step_id TEXT NOT NULL,
    artifact_type TEXT NOT NULL,
    content TEXT,  -- inline for small artifacts
    stored_path TEXT,  -- filesystem path for large artifacts
    metadata TEXT,  -- JSON blob
    size_bytes INTEGER,
    created_at TEXT NOT NULL,
    FOREIGN KEY (run_id) REFERENCES runs(run_id) ON DELETE CASCADE,
    FOREIGN KEY (step_id) REFERENCES steps(step_id) ON DELETE CASCADE
);

CREATE INDEX idx_artifacts_run_id ON artifacts(run_id);
CREATE INDEX idx_artifacts_step_id ON artifacts(step_id);
CREATE INDEX idx_artifacts_type ON artifacts(artifact_type);
CREATE INDEX idx_artifacts_created_at ON artifacts(created_at);

-- Blockers table: blocker reports that halt or degrade execution
CREATE TABLE IF NOT EXISTS blockers (
    blocker_id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL,
    step_id TEXT NOT NULL,
    blocker_type TEXT NOT NULL,
    description TEXT NOT NULL,
    resolution_required TEXT NOT NULL,
    severity TEXT NOT NULL CHECK(severity IN ('blocking', 'degraded')),
    resolved BOOLEAN DEFAULT 0,
    resolution_note TEXT,
    created_at TEXT NOT NULL,
    resolved_at TEXT,
    FOREIGN KEY (run_id) REFERENCES runs(run_id) ON DELETE CASCADE,
    FOREIGN KEY (step_id) REFERENCES steps(step_id) ON DELETE CASCADE
);

CREATE INDEX idx_blockers_run_id ON blockers(run_id);
CREATE INDEX idx_blockers_step_id ON blockers(step_id);
CREATE INDEX idx_blockers_severity ON blockers(severity);
CREATE INDEX idx_blockers_resolved ON blockers(resolved);
CREATE INDEX idx_blockers_created_at ON blockers(created_at);

-- Resume points table: checkpoints for resuming interrupted runs
CREATE TABLE IF NOT EXISTS resume_points (
    resume_point_id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL,
    step_index INTEGER NOT NULL,
    checkpoint_name TEXT,
    state_snapshot TEXT NOT NULL,  -- JSON blob with all state needed to resume
    artifact_ids TEXT,  -- JSON array of artifact IDs completed up to this point
    created_at TEXT NOT NULL,
    FOREIGN KEY (run_id) REFERENCES runs(run_id) ON DELETE CASCADE
);

CREATE INDEX idx_resume_points_run_id ON resume_points(run_id);
CREATE INDEX idx_resume_points_created_at ON resume_points(created_at);

-- Review outputs table: QA review results
CREATE TABLE IF NOT EXISTS review_outputs (
    review_id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL,
    step_id TEXT NOT NULL,
    artifact_id TEXT NOT NULL,
    reviewer_agent TEXT NOT NULL,
    rubric_id TEXT,
    verdict TEXT NOT NULL CHECK(verdict IN ('pass', 'conditional-pass', 'fail')),
    findings TEXT NOT NULL,  -- JSON array of finding objects
    created_at TEXT NOT NULL,
    FOREIGN KEY (run_id) REFERENCES runs(run_id) ON DELETE CASCADE,
    FOREIGN KEY (step_id) REFERENCES steps(step_id) ON DELETE CASCADE,
    FOREIGN KEY (artifact_id) REFERENCES artifacts(artifact_id) ON DELETE CASCADE
);

CREATE INDEX idx_review_outputs_run_id ON review_outputs(run_id);
CREATE INDEX idx_review_outputs_artifact_id ON review_outputs(artifact_id);
CREATE INDEX idx_review_outputs_verdict ON review_outputs(verdict);
CREATE INDEX idx_review_outputs_created_at ON review_outputs(created_at);

-- Merge reports table: outputs from merge operations
CREATE TABLE IF NOT EXISTS merge_reports (
    merge_id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL,
    step_id TEXT NOT NULL,
    source_artifact_ids TEXT NOT NULL,  -- JSON array
    output_artifact_id TEXT NOT NULL,
    merge_strategy TEXT NOT NULL,
    conflicts_detected INTEGER DEFAULT 0,
    conflict_resolutions TEXT,  -- JSON array
    created_at TEXT NOT NULL,
    FOREIGN KEY (run_id) REFERENCES runs(run_id) ON DELETE CASCADE,
    FOREIGN KEY (step_id) REFERENCES steps(step_id) ON DELETE CASCADE,
    FOREIGN KEY (output_artifact_id) REFERENCES artifacts(artifact_id) ON DELETE CASCADE
);

CREATE INDEX idx_merge_reports_run_id ON merge_reports(run_id);
CREATE INDEX idx_merge_reports_output_artifact_id ON merge_reports(output_artifact_id);
CREATE INDEX idx_merge_reports_created_at ON merge_reports(created_at);
