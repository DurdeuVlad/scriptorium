# mcp/ — MCP Servers

**Purpose:** Contains all Model Context Protocol (MCP) servers that provide infrastructure services to the framework.

---

## What Belongs Here

**MCP server implementations:**
- Server source code
- Database schemas
- Seed data
- Server documentation
- Command integration guides

**NEVER place here:**
- Framework definitions (those go in `.writing-framework/`)
- Tool adapters (those go in `.claude/`, etc.)
- Generated artifacts (those go in `artifacts/`)
- Project documentation (those go in `docs/`)

---

## Directory Structure

```
mcp/
├── artifact-server/         # Artifact management MCP
│   ├── src/                 # Server source code
│   ├── seed/                # Seed data
│   ├── schema.sql           # Database schema
│   ├── ARTIFACT_MODEL.md    # Artifact model documentation
│   └── COMMAND_INTEGRATION.md
│
├── cache-server/            # Run state and memory MCP
│   ├── src/                 # Server source code
│   ├── seed/                # Seed data
│   ├── schema.sql           # Database schema
│   ├── RUN_MODEL.md         # Run model documentation
│   ├── BLOCKER_MODEL.md     # Blocker model documentation
│   ├── RESUME_PROTOCOL.md   # Resume protocol documentation
│   └── COMMAND_INTEGRATION.md
│
└── guide-server/            # Editorial guide MCP
    ├── src/                 # Server source code
    ├── seed/                # Seed data (style packs, rubrics, canon)
    ├── schema.sql           # Database schema
    └── COMMAND_INTEGRATION.md
```

---

## File Placement Rules by Server

### artifact-server/
**Purpose:** Artifact management and export operations

**Files:**
- `src/server.js` — Server implementation
- `schema.sql` — SQLite schema for artifact metadata
- `ARTIFACT_MODEL.md` — Artifact lifecycle and metadata model
- `COMMAND_INTEGRATION.md` — Tool usage patterns

**Seed data:** None (artifacts created at runtime)

---

### cache-server/
**Purpose:** Run state, memory, and resume point management

**Files:**
- `src/server.js` — Server implementation
- `schema.sql` — SQLite schema for runs, steps, artifacts, blockers
- `RUN_MODEL.md` — Run lifecycle and state model
- `BLOCKER_MODEL.md` — Blocker tracking and classification
- `RESUME_PROTOCOL.md` — Resume point creation and restoration
- `COMMAND_INTEGRATION.md` — Tool usage patterns

**Seed data:** None (state created at runtime)

---

### guide-server/
**Purpose:** Editorial guide storage and retrieval (FTS5-powered)

**Files:**
- `src/server.js` — Server implementation
- `schema.sql` — SQLite schema with FTS5 for full-text search
- `COMMAND_INTEGRATION.md` — Tool usage patterns

**Seed data:**
- `seed/style-packs.json` — Style guide records
- `seed/rubrics.json` — Evaluation rubric records
- `seed/canon.json` — Canon reference records
- `seed/anti-patterns.json` — Anti-pattern records
- `seed/templates.json` — Document template records

---

## Server Documentation Standards

Each server directory must include:

1. **`src/server.js`** — Server implementation
   - Tool definitions
   - Database operations
   - Error handling

2. **`schema.sql`** — Database schema
   - Table definitions
   - Indexes
   - Constraints

3. **`COMMAND_INTEGRATION.md`** — Integration guide
   - Tool usage patterns
   - Workflow integration
   - Error handling
   - Best practices

4. **Model documentation** (if applicable)
   - Data model
   - Lifecycle
   - State transitions
   - Examples

---

## Seed Data Format

Seed data files are JSON arrays of records:

```json
[
  {
    "guide_id": "G-STYLE-001",
    "guide_type": "style-pack",
    "title": "Technical Writing Style",
    "content": "...",
    "status": "active",
    "applies_to": ["brief-writer", "section-drafter"]
  }
]
```

**Naming convention:** `{data-type}.json`

---

## Cross-References

- `DIRECTORY_STRUCTURE.md` — Repository-wide file placement rules
- `.writing-framework/README.md` — Framework core directory
- Individual server `COMMAND_INTEGRATION.md` files
