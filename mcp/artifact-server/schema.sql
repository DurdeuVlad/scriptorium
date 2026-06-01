-- artifact-server schema
-- SQLite database for artifact metadata and version history
-- Phase 7 implementation

-- Artifacts table: metadata for all generated artifacts
CREATE TABLE IF NOT EXISTS artifacts (
    artifact_id TEXT PRIMARY KEY,
    path TEXT NOT NULL UNIQUE,
    format TEXT NOT NULL CHECK(format IN ('markdown', 'docx', 'pdf', 'latex')),
    title TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    size_bytes INTEGER,
    word_count INTEGER,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    producing_run_id TEXT,
    producing_step_id TEXT,
    validation_status TEXT CHECK(validation_status IN ('valid', 'invalid', 'not-validated')) DEFAULT 'not-validated',
    metadata TEXT  -- JSON blob for format-specific metadata
);

CREATE INDEX idx_artifacts_path ON artifacts(path);
CREATE INDEX idx_artifacts_format ON artifacts(format);
CREATE INDEX idx_artifacts_run_id ON artifacts(producing_run_id);
CREATE INDEX idx_artifacts_created_at ON artifacts(created_at);

-- Artifact versions table: version history for artifacts
CREATE TABLE IF NOT EXISTS artifact_versions (
    version_id TEXT PRIMARY KEY,
    artifact_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    content_hash TEXT,
    size_bytes INTEGER,
    created_at TEXT NOT NULL,
    created_by TEXT,
    change_description TEXT,
    FOREIGN KEY (artifact_id) REFERENCES artifacts(artifact_id) ON DELETE CASCADE,
    UNIQUE(artifact_id, version_number)
);

CREATE INDEX idx_versions_artifact_id ON artifact_versions(artifact_id);
CREATE INDEX idx_versions_created_at ON artifact_versions(created_at);

-- Artifact relationships table: tracks conversions and derivations
CREATE TABLE IF NOT EXISTS artifact_relationships (
    relationship_id TEXT PRIMARY KEY,
    source_artifact_id TEXT NOT NULL,
    target_artifact_id TEXT NOT NULL,
    relationship_type TEXT NOT NULL CHECK(relationship_type IN ('export', 'compile', 'normalize', 'update')),
    created_at TEXT NOT NULL,
    FOREIGN KEY (source_artifact_id) REFERENCES artifacts(artifact_id) ON DELETE CASCADE,
    FOREIGN KEY (target_artifact_id) REFERENCES artifacts(artifact_id) ON DELETE CASCADE
);

CREATE INDEX idx_relationships_source ON artifact_relationships(source_artifact_id);
CREATE INDEX idx_relationships_target ON artifact_relationships(target_artifact_id);
CREATE INDEX idx_relationships_type ON artifact_relationships(relationship_type);

-- Validation results table: detailed validation findings
CREATE TABLE IF NOT EXISTS validation_results (
    validation_id TEXT PRIMARY KEY,
    artifact_id TEXT NOT NULL,
    check_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('pass', 'fail', 'warning')),
    detail TEXT,
    location TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (artifact_id) REFERENCES artifacts(artifact_id) ON DELETE CASCADE
);

CREATE INDEX idx_validation_artifact_id ON validation_results(artifact_id);
CREATE INDEX idx_validation_status ON validation_results(status);
CREATE INDEX idx_validation_created_at ON validation_results(created_at);

-- Export operations table: tracks export attempts and results
CREATE TABLE IF NOT EXISTS export_operations (
    export_id TEXT PRIMARY KEY,
    source_artifact_id TEXT NOT NULL,
    target_format TEXT NOT NULL,
    target_path TEXT NOT NULL,
    target_artifact_id TEXT,
    status TEXT NOT NULL CHECK(status IN ('pending', 'success', 'failed')),
    error_message TEXT,
    dependencies_used TEXT,  -- JSON array
    created_at TEXT NOT NULL,
    completed_at TEXT,
    FOREIGN KEY (source_artifact_id) REFERENCES artifacts(artifact_id) ON DELETE CASCADE,
    FOREIGN KEY (target_artifact_id) REFERENCES artifacts(artifact_id) ON DELETE SET NULL
);

CREATE INDEX idx_exports_source ON export_operations(source_artifact_id);
CREATE INDEX idx_exports_status ON export_operations(status);
CREATE INDEX idx_exports_created_at ON export_operations(created_at);
