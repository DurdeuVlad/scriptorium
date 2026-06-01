# docs/ — Project Documentation

**Purpose:** Contains project-wide documentation including phase reports, architecture docs, and design decisions.

---

## What Belongs Here

**Project documentation:**
- Phase implementation reports (QA reports, self-QA)
- Architecture documentation
- Design decision records (if not in root DECISIONS.md)
- Implementation notes
- Migration guides

**NEVER place here:**
- Framework definitions (those go in `.writing-framework/`)
- Tool adapters (those go in `.claude/`, etc.)
- Evaluation cases (those go in `evals/`)
- Generated artifacts (those go in `artifacts/`)

---

## Directory Structure

```
docs/
├── phases/                  # Phase implementation reports
│   ├── QA_REPORT_PHASE4.md
│   ├── QA_REPORT_PHASE5.md
│   ├── PHASE5_SELF_QA.md
│   └── ...
├── architecture/            # Architecture documentation
└── decisions/               # Design decision records (if separated from root)
```

---

## File Placement Rules

### phases/
**Purpose:** Phase implementation reports and QA documentation

**Naming:**
- QA reports: `QA_REPORT_PHASE{N}.md`
- Self-QA: `PHASE{N}_SELF_QA.md`
- Implementation notes: `PHASE{N}_NOTES.md`

**Examples:**
- `QA_REPORT_PHASE10.md` — Phase 10 QA report
- `PHASE5_SELF_QA.md` — Phase 5 self-QA report

**Current files to migrate here:**
From root directory:
- QA_REPORT_PHASE4.md
- QA_REPORT_PHASE5.md
- QA_REPORT_PHASE6.md
- QA_REPORT_PHASE7.md
- QA_REPORT_PHASE8.md
- QA_REPORT_PHASE9.md
- QA_REPORT_PHASE10.md
- PHASE5_SELF_QA.md

---

### architecture/
**Purpose:** Detailed architecture documentation

**Naming:** `{topic}.md`

**Examples:**
- `mcp-architecture.md` — MCP server architecture
- `workflow-execution.md` — Workflow execution model
- `agent-coordination.md` — Agent coordination patterns

**Note:** High-level architecture stays in root `ARCHITECTURE.md`

---

### decisions/
**Purpose:** Design decision records (if separated from root DECISIONS.md)

**Naming:** `D-{NNN}-{title}.md`

**Note:** Currently all decisions are in root `DECISIONS.md`. This directory is for future use if decisions are split into separate files.

---

## Cross-References

- `DIRECTORY_STRUCTURE.md` — Repository-wide file placement rules
- `ARCHITECTURE.md` — System architecture overview
- `DECISIONS.md` — Design decision log
