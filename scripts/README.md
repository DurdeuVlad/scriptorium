# scripts/ — Utility Scripts

## Overview

This directory contains utility scripts for setup, validation, migration, and maintenance of the framework. Scripts here are **human-operated** — they are not invoked by agents as part of normal workflow execution. They are run by framework maintainers and developers who need to perform operations outside the normal orchestration path.

Scripts complement the MCP layer but do not replace it. Where an MCP operation exists for a task (e.g., syncing guide-server), use the MCP. Scripts handle tasks that fall outside the MCP surface: initial setup, bulk migration, diagnostic checks, and maintenance operations that are too destructive or too infrastructure-level to expose to agent workflows.

---

## Current Status

**Phase 1: Empty.**

No scripts are present yet. Scripts are added in later phases as the infrastructure they operate on is built. The directory is created now to establish the conventions below before they are needed.

Scripts will be added in the following phases:

**Phase 2 (guide-server and cache-server implementation):**
- `setup-guide-server.sh` / `setup-guide-server.py` — initialize the SQLite database, create tables, and run the initial population sync from `guides/`
- `setup-cache-server.sh` — initialize the cache-server database
- `validate-guides.py` — validate all guide records in `guides/` for schema compliance, broken cross-references, and stale `last_synced` dates without running a full sync
- `rebuild-guide-index.py` — drop and rebuild the FTS5 index from current `guides/` content (for use after bulk edits or schema changes)

**Phase 3 (workflow infrastructure):**
- `validate-workflows.py` — check all workflow YAML files for schema compliance and referenced agent/guide existence

**Phase 4 (canon and project tooling):**
- `import-world-bible.py` — batch import a project world bible into `guides/canon/` with automatic record generation
- `check-canon-conflicts.py` — scan all canon records for conflict status and produce a human-readable conflict report

**Phase 5 (artifact-server implementation):**
- `setup-artifact-server.py` — initialize the artifact metadata database
- `migrate-artifacts.py` — migrate existing files in `artifacts/` into artifact-server tracking (for artifacts created before Phase 5)

**Phase 6 (evals and quality infrastructure):**
- `run-evals.py` — execute the evaluation suite against a set of agent outputs
- `generate-rubric-report.py` — aggregate QA findings across all runs into a rubric performance report

---

## Conventions

Scripts placed in this directory must follow these conventions:

**Language:** Python 3.9+ preferred. Shell scripts (bash) acceptable for setup and environment operations. No Node.js scripts unless there is a specific dependency reason.

**Naming:** `[verb]-[noun].py` or `[verb]-[noun].sh`. Verbs: `setup`, `validate`, `migrate`, `rebuild`, `check`, `generate`, `import`, `export`. Examples: `setup-guide-server.py`, `validate-guides.py`, `migrate-artifacts.py`.

**Documentation:** Every script must have a docstring or header comment that describes:
- What it does
- What it requires (dependencies, environment variables, filesystem preconditions)
- What it changes (what is modified, created, or deleted)
- Usage example

**Idempotency:** Scripts should be safe to run multiple times. If a setup script is run on an already-initialized database, it should detect the existing state and either skip or report, not fail or corrupt.

**Destructive operations:** Scripts that delete data, drop tables, or overwrite files must require an explicit `--confirm` flag. They must print a summary of what will be changed and wait for user confirmation before proceeding, unless `--yes` is explicitly passed.

**No agent invocation:** Scripts in this directory do not call the Claude API or invoke agents. They operate directly on the filesystem and database. Agent-facing operations belong in workflows.

**Environment:** Scripts read configuration from environment variables or from a config file, not from hardcoded paths. The framework root directory must be configurable.

---

## Environment Variables

When scripts are implemented, they will use the following standard environment variables:

```
FRAMEWORK_ROOT      # absolute path to the framework repository root
GUIDE_SERVER_DB     # path to guide-server SQLite database (default: mcp/guide-server/db.sqlite)
CACHE_SERVER_DB     # path to cache-server SQLite database (default: mcp/cache-server/db.sqlite)
ARTIFACT_SERVER_DB  # path to artifact-server metadata database (default: mcp/artifact-server/db.sqlite)
```

---

## Related

- `mcp/` — MCP servers that scripts set up and maintain
- `sync/README.md` — sync system that some scripts support
- `guides/` — guide records that validation scripts check
- `workflows/` — workflow definitions that validation scripts verify
