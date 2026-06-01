# Artifact Model — artifact-server MCP

**Status:** Canonical. Defines artifact metadata model, operations, and lifecycle.
**Phase:** 7
**Related:** workflows/artifacts.md, schemas/artifact_manifest.schema.json

---

## Purpose

Define the artifact metadata model, lifecycle, and operational semantics for the artifact-server MCP. This document is the authoritative reference for how artifacts are created, versioned, validated, exported, and tracked.

---

## Artifact Metadata Model

Every artifact has metadata tracked in the artifact-server SQLite database:

```sql
CREATE TABLE artifacts (
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
    validation_status TEXT CHECK(validation_status IN ('valid', 'invalid', 'not-validated')),
    metadata TEXT  -- JSON blob for format-specific metadata
);
```

**Key Fields:**
- `artifact_id`: Unique identifier (format: `art_[timestamp]_[random]`)
- `path`: Absolute filesystem path to artifact file
- `format`: One of: markdown, docx, pdf, latex
- `version`: Increments on each update or normalization
- `validation_status`: Result of last validation check
- `producing_run_id`: Cache-server run that created this artifact
- `metadata`: Format-specific metadata (JSON blob)

---

## Artifact Lifecycle

### 1. Creation

**Markdown:**
```javascript
create_markdown(path, content, metadata, run_id, step_id)
→ { artifact_id, path, size_bytes, word_count }
```

**LaTeX:**
```javascript
create_latex(path, content, document_class, run_id, step_id)
→ { artifact_id, path, size_bytes }
```

**DOCX/PDF:**
Created via export operations from markdown or LaTeX source.

### 2. Versioning

Every update creates a new version record:

```sql
CREATE TABLE artifact_versions (
    version_id TEXT PRIMARY KEY,
    artifact_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    content_hash TEXT,
    size_bytes INTEGER,
    created_at TEXT NOT NULL,
    created_by TEXT,
    change_description TEXT
);
```

**Version increments on:**
- `update_markdown` (full replacement or append)
- `normalize_artifact` (formatting changes)
- Content hash changes (SHA-256 of content)

**Version history retained in database** (not on disk by default).

### 3. Validation

**Validation checks by format:**

**Markdown:**
- Valid YAML frontmatter (if present)
- Heading hierarchy (no skipped levels)
- No empty sections
- No broken internal links

**DOCX/PDF:**
- File integrity (size > 0)
- File opens without error

**LaTeX:**
- File exists
- Compilability (dry-run compile)

**Validation results stored:**
```sql
CREATE TABLE validation_results (
    validation_id TEXT PRIMARY KEY,
    artifact_id TEXT NOT NULL,
    check_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('pass', 'fail', 'warning')),
    detail TEXT,
    location TEXT,
    created_at TEXT NOT NULL
);
```

### 4. Export and Conversion

**Export operations tracked:**
```sql
CREATE TABLE export_operations (
    export_id TEXT PRIMARY KEY,
    source_artifact_id TEXT NOT NULL,
    target_format TEXT NOT NULL,
    target_path TEXT NOT NULL,
    target_artifact_id TEXT,
    status TEXT NOT NULL CHECK(status IN ('pending', 'success', 'failed')),
    error_message TEXT,
    dependencies_used TEXT,  -- JSON array
    created_at TEXT NOT NULL,
    completed_at TEXT
);
```

**Supported conversions:**
- Markdown → DOCX (via pandoc)
- Markdown → PDF (via pandoc)
- LaTeX → PDF (via pdflatex/xelatex/lualatex)

**Relationships tracked:**
```sql
CREATE TABLE artifact_relationships (
    relationship_id TEXT PRIMARY KEY,
    source_artifact_id TEXT NOT NULL,
    target_artifact_id TEXT NOT NULL,
    relationship_type TEXT NOT NULL CHECK(relationship_type IN ('export', 'compile', 'normalize', 'update')),
    created_at TEXT NOT NULL
);
```

### 5. Normalization

**Normalization rules applied:**
- Remove trailing whitespace
- Normalize line endings to `\n`
- Ensure single blank line between sections
- Ensure file ends with single newline

**Normalization is:**
- Non-destructive to content (formatting only)
- Versioned (increments version number)
- Logged (changes_made array returned)

---

## Artifact Path Conventions

**Deterministic path structure:**
```
artifacts/
  [run_id]/
    drafts/
      [step_name]-v[n].md
    revisions/
      [step_name]-v[n].md
    exports/
      [title].[ext]
  shared/
    templates/
    reference-docs/
```

**Path normalization:**
- Relative paths resolved relative to `artifacts/` directory
- Absolute paths used as-is
- Directories created automatically if missing

---

## Operation Semantics

### Create Operations

**Idempotency:** Create operations fail if file already exists. Use update operations for modifications.

**Atomicity:** File write and database record creation are not transactional. If file write succeeds but database insert fails, file exists without metadata.

**Error handling:** Errors return error message in tool response. No partial state committed.

### Update Operations

**Version increment:** Every update increments version number.

**Content replacement:** Full replacement only (no partial edits within file).

**Append:** Supported for markdown via `append` parameter.

### Export Operations

**Dependency checking:** Export operations check for required dependencies (pandoc, latex) before attempting export.

**Fallback:** If export fails, error recorded in export_operations table with status='failed'.

**Retry:** Export operations are not automatically retried. Caller must retry if desired.

### Validation Operations

**Validation timing:** Validation can run at any time, not just post-generation.

**Validation caching:** Validation results stored in database, not re-run unless explicitly requested.

**Validation status update:** Artifact validation_status field updated after validation completes.

---

## Dependencies

**Required:**
- Node.js 18+
- better-sqlite3 (SQLite driver)
- @modelcontextprotocol/sdk

**Optional (format-specific):**
- pandoc (for DOCX/PDF export from markdown)
- LaTeX toolchain (for PDF from LaTeX: pdflatex, xelatex, lualatex)

**Dependency detection:**
- artifact-server checks for dependencies at runtime
- Missing dependencies cause export operations to fail with clear error message
- Dependency availability recorded in export_operations.dependencies_used

---

## Error Handling

**Error categories:**

**B5 (failed-toolchain):**
- artifact-server MCP unavailable
- pandoc not found
- LaTeX toolchain not found

**B6 (artifact-export-failure):**
- File write failed
- Export operation failed
- Validation failed

**B9 (validation-failure):**
- Source content contains unresolved placeholders
- Source content malformed

**Error responses:**
All tool calls return error in response content:
```json
{
  "error": "Error message with details"
}
```

**Error persistence:**
Export failures recorded in export_operations table with status='failed' and error_message.

---

## Performance Considerations

**Database size:**
- Metadata only (no binary content in database)
- Version history grows with updates
- Validation results accumulate over time

**Cleanup:**
- No automatic cleanup of old versions
- No automatic cleanup of validation results
- Manual cleanup via SQL if needed

**File I/O:**
- All file operations synchronous (blocking)
- Large files (>10MB) may cause delays
- No streaming support

---

## Cross-References

- `mcp/artifact-server/README.md` — artifact-server overview
- `mcp/artifact-server/schema.sql` — database schema
- `workflows/artifacts.md` — artifact workflow
- `schemas/artifact_manifest.schema.json` — manifest format
- `doctrine/BLOCKER_CLASSIFICATION.md` — B5/B6/B9 definitions
