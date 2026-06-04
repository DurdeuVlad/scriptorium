# Directory Structure and File Placement Rules

**Purpose:** Define clear organizational rules for where files belong in the Editorial Orchestrator repository.

---

## Organizational Principles

### 1. Separation of Concerns
- **Framework core** (`.writing-framework/`) — Tool-agnostic framework definitions
- **Tool adapters** (`.claude/`, `.copilot/`, etc.) — Tool-specific implementations
- **Infrastructure** (`mcp/`) — MCP servers and databases
- **Documentation** (root level) — Project-wide documentation
- **Outputs** (`artifacts/`, `logs/`, `sync/`) — Generated content and operational data
- **Testing** (`evals/`) — Evaluation framework and test cases

### 2. Canonical vs. Adapter Pattern
- **Canonical specs** live in `.writing-framework/` (commands, agents, workflows, doctrine, schemas)
- **Adapters** live in tool-specific directories (`.claude/`, `.copilot/`)
- Never duplicate canonical content in adapter directories

### 3. Phase-Based Organization
- Phase implementation artifacts (QA reports) in `docs/phases/`
- Not scattered in root directory

---

## Directory Map

```
scriptorium/
├── .writing-framework/          # Framework core (canonical definitions)
│   ├── agents/                  # Agent specifications
│   ├── commands/                # Command specifications
│   ├── doctrine/                # Framework principles and rules
│   ├── examples/                # Usage examples
│   ├── guides/                  # Editorial guides (style, rubrics, canon)
│   ├── hooks/                   # Hook specifications (canonical)
│   ├── schemas/                 # JSON schemas for all data structures
│   ├── styles/                  # Style packs
│   ├── templates/               # Document templates
│   └── workflows/               # Workflow specifications
│
├── .claude/                     # Claude Code adapter
│   ├── agents/                  # Claude agent adapters
│   ├── commands/                # Claude command adapters
│   └── hooks/                   # Claude hook implementations
│
├── mcp/                         # MCP servers
│   ├── artifact-server/         # Artifact management MCP
│   ├── cache-server/            # Run state and memory MCP
│   └── guide-server/            # Editorial guide MCP
│
├── docs/                        # Project documentation
│   ├── phases/                  # Phase implementation reports
│   ├── architecture/            # Architecture documentation
│   └── decisions/               # Design decision records
│
├── evals/                       # Evaluation framework
│   ├── cases/                   # Evaluation test cases
│   ├── rubrics/                 # Scoring rubrics
│   └── comparisons/             # Baseline comparison reports
│
├── sync/                        # Sync and portability
│   ├── export-packs/            # Portable framework bundles from /export-framework
│   ├── import-packs/            # Legacy staging area for imported bundles
│   └── sync-manifests/          # Sync operation manifests
│
├── artifacts/                   # Generated artifacts (output)
├── logs/                        # Operation logs (output)
├── scripts/                     # Utility scripts
│
└── [Root Documentation Files]   # Project-level docs only
    ├── README.md
    ├── ARCHITECTURE.md
    ├── ROADMAP.md
    ├── DECISIONS.md
    ├── HANDOFF.md
    └── CLAUDE.md
```

---

## File Placement Rules by Type

### Framework Definitions
**Location:** `.writing-framework/`

| File Type | Subdirectory | Naming Convention | Example |
|-----------|--------------|-------------------|---------|
| Agent specs | `agents/` | `{agent-name}.md` | `brief-writer.md` |
| Command specs | `commands/` | `{command-name}.md` | `write-brief.md` |
| Doctrine files | `doctrine/` | `{DOCTRINE_NAME}.md` | `EDITORIAL_DOCTRINE.md` |
| Workflows | `workflows/` | `{workflow-name}.md` | `discovery.md` |
| Schemas | `schemas/` | `{schema_name}.schema.json` | `brief.schema.json` |
| Style packs | `guides/style-packs/` | `{style-name}.md` | `technical.md` |
| Rubrics | `guides/rubrics/` | `{rubric-name}.md` | `technical-rubric.md` |
| Templates | `templates/` | `{template-name}.md` | `api-reference.md` |
| Hook specs | `hooks/` | `{hook-name}.md` | `pre-workflow-start.md` |

### Tool Adapters
**Location:** `.{tool-name}/`

| File Type | Subdirectory | Naming Convention | Example |
|-----------|--------------|-------------------|---------|
| Agent adapters | `agents/` | `{agent-name}.md` | `brief-writer.md` |
| Command adapters | `commands/` | `{command-name}.md` | `write-brief.md` |
| Hook implementations | `hooks/` | `{hook-name}.md` | `pre-workflow-start.md` |

### MCP Servers
**Location:** `mcp/{server-name}/`

| File Type | Location | Naming Convention | Example |
|-----------|----------|-------------------|---------|
| Server code | `src/` | `server.js` | `mcp/guide-server/src/server.js` |
| Database schema | root | `schema.sql` | `mcp/guide-server/schema.sql` |
| Seed data | `seed/` | `{data-type}.json` | `seed/style-packs.json` |
| Documentation | root | `{DOC_NAME}.md` | `COMMAND_INTEGRATION.md` |

### Documentation
**Location:** `docs/`

| File Type | Subdirectory | Naming Convention | Example |
|-----------|--------------|-------------------|---------|
| Phase QA reports | `phases/` | `QA_REPORT_PHASE{N}.md` | `QA_REPORT_PHASE10.md` |
| Architecture docs | `architecture/` | `{topic}.md` | `mcp-architecture.md` |
| Decision records | `decisions/` | Embedded in `DECISIONS.md` | N/A |

### Evaluation Framework
**Location:** `evals/`

| File Type | Subdirectory | Naming Convention | Example |
|-----------|--------------|-------------------|---------|
| Evaluation cases | `cases/` | `case-{NN}-{name}.md` | `case-01-technical-docs.md` |
| Scoring rubrics | `rubrics/` | `{dimension}.md` | `artifact-quality.md` |
| Comparison reports | `comparisons/` | `case-{NN}-comparison.md` | `case-01-comparison.md` |

### Sync and Portability
**Location:** `sync/`

| File Type | Subdirectory | Naming Convention | Example |
|-----------|--------------|-------------------|---------|
| Export bundles | `export-packs/` | `framework-export-{timestamp}/` | `framework-export-20260329/` |
| Import bundle staging | `import-packs/` | `framework-export-{timestamp}/` | `framework-export-20260329/` |
| Sync manifests | `sync-manifests/` | `sync_{timestamp}.json` | `sync_20260329.json` |

### Generated Outputs
**Location:** Root-level output directories

| File Type | Directory | Naming Convention | Example |
|-----------|-----------|-------------------|---------|
| Artifacts | `artifacts/` | `run_{id}/` | `artifacts/run_123/` |
| Logs | `logs/` | `{date}/` | `logs/2026-03-29/` |

---

## Root-Level Files (Strict Rules)

**ONLY these files belong in root:**

### Project Documentation (Required)
- `README.md` — Project overview and quick start
- `ARCHITECTURE.md` — System architecture
- `ROADMAP.md` — Development roadmap
- `DECISIONS.md` — Design decision log
- `HANDOFF.md` — Agent continuity document
- `CLAUDE.md` — Claude-specific operating rules
- `DIRECTORY_STRUCTURE.md` — This file

### Configuration Files (Allowed)
- `.gitignore`
- `package.json` (if needed)
- `.env.example` (if needed)

### Everything Else (FORBIDDEN)
- ❌ Phase QA reports → Move to `docs/phases/`
- ❌ Temporary files → Delete or move to appropriate directory
- ❌ Test files → Move to `evals/` or appropriate directory
- ❌ Implementation files → Move to appropriate subdirectory

---

## Migration Plan

### Files to Move

**Phase QA Reports (7 files):**
```
QA_REPORT_PHASE4.md  → docs/phases/QA_REPORT_PHASE4.md
QA_REPORT_PHASE5.md  → docs/phases/QA_REPORT_PHASE5.md
QA_REPORT_PHASE6.md  → docs/phases/QA_REPORT_PHASE6.md
QA_REPORT_PHASE7.md  → docs/phases/QA_REPORT_PHASE7.md
QA_REPORT_PHASE8.md  → docs/phases/QA_REPORT_PHASE8.md
QA_REPORT_PHASE9.md  → docs/phases/QA_REPORT_PHASE9.md
QA_REPORT_PHASE10.md → docs/phases/QA_REPORT_PHASE10.md
```

**Phase Self-QA:**
```
PHASE5_SELF_QA.md → docs/phases/PHASE5_SELF_QA.md
```

---

## Subdirectory README Requirements

Each major directory must have a `README.md` explaining:
1. **Purpose** — What belongs in this directory
2. **File placement rules** — Where specific file types go
3. **Naming conventions** — How to name files
4. **Subdirectory structure** — What subdirectories exist and their purpose
5. **Examples** — Concrete examples of correct file placement

**Required READMEs:**
- `.writing-framework/README.md`
- `.claude/README.md`
- `mcp/README.md`
- `docs/README.md`
- `evals/README.md`
- `sync/README.md`

---

## Cross-References

- Individual directory READMEs (see each directory)
- `ARCHITECTURE.md` — System architecture
- `HANDOFF.md` — Repository overview
