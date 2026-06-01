# mcp/guide-server/ — Guide Server MCP

## Overview

The guide-server MCP provides structured storage and retrieval for all guide records in the framework. It is the runtime memory layer that agents query to find applicable style packs, doctrine, rubrics, anti-patterns, examples, canon, templates, and decision records.

Without guide-server, agents must navigate the filesystem directly — which is slow, error-prone, and requires knowing the directory layout. With guide-server, agents issue a search query and receive ranked, tagged, linkable records. The difference is the difference between a filing cabinet and an index.

**Implementation status:** Phase 3 — Implemented. The server is operational. Run `npm install && npm run setup && npm run seed` to initialize.

Agents operating without guide-server should query the filesystem directly at `.writing-framework/guides/` as fallback. See `COMMAND_INTEGRATION.md` for the full fallback protocol.

---

## Backend

- **Database:** SQLite with FTS5 (full-text search extension)
- **Why SQLite:** Embedded, zero-dependency, fast for single-writer multi-reader patterns, appropriate for local and single-server deployments. No separate database service to operate.
- **Why FTS5:** Native full-text search with tokenization, stemming, and relevance ranking. Sufficient for the record corpus size. Avoids the operational overhead of a vector search infrastructure while providing fast keyword and phrase retrieval.
- **Schema:** Single `guides` table with `type` column — simpler than per-type tables and equally queryable. FTS5 virtual table `guides_fts` mirrors it. `guide_links` table for the typed relationship graph.
- **FTS index:** Built over `title`, `body`, `tags`, and `applies_to` fields using Porter stemming.
- **Language:** Node.js 18+ with ES modules
- **Key dependencies:** `@modelcontextprotocol/sdk`, `better-sqlite3`

## Quick Start

```bash
cd mcp/guide-server
npm install
npm run setup    # initialize database schema
npm run seed     # load initial guide records
npm start        # start MCP server on stdio
```

## MCP Configuration

Add to your Claude Code settings (`~/.claude/settings.json`):

```json
{
  "mcpServers": {
    "guide-server": {
      "command": "node",
      "args": ["mcp/guide-server/src/server.js"],
      "env": {
        "GUIDE_DB_PATH": "mcp/guide-server/guides.db"
      }
    }
  }
}
```

---

## Record Types

guide-server stores records of the following types. Each type maps to a subdirectory in `guides/`:

| Type | Source Directory | Description |
|---|---|---|
| `doctrine` | `guides/doctrine/` | Searchable excerpts of framework doctrine |
| `style-pack` | `guides/style-packs/` | Style pack discovery records |
| `canon` | `guides/canon/` | Authoritative facts for project worlds |
| `template` | `guides/templates/` | Document template records |
| `rubric` | `guides/rubrics/` | QA evaluation criteria |
| `example` | `guides/examples/` | Worked examples for calibration |
| `anti-pattern` | `guides/anti-patterns/` | Named failure mode records |
| `decision-record` | `guides/decision-records/` | Significant decision documentation |

All record types share a common set of base fields (id, type, title, tags, status, created, updated) and have type-specific fields defined in the schema.

---

## Tools (11 MCP Tools)

| Tool | Purpose |
|------|---------|
| `add_guide` | Add a new guide record (starts as draft) |
| `get_guide` | Retrieve a guide by ID |
| `update_guide` | Partial update of an existing guide |
| `find_guides` | FTS5 search — ranked results, filter by type/domain/status |
| `list_guides` | Browse guides by type/domain without search ranking |
| `promote_guide` | Move a guide from draft → active |
| `deprecate_guide` | Mark a guide deprecated with reason; optionally link superseding guide |
| `link_guides` | Create a typed directed link between two guides |
| `get_links` | Get incoming/outgoing links for a guide |
| `guide_gap_check` | Check what guide types are missing for a domain |
| `get_stats` | Return store-wide counts by type and status |

### Link Types

`implements` · `extends` · `references` · `supersedes` · `exemplifies` · `contradicts` · `requires`

### FTS Query Syntax

`find_guides` accepts SQLite FTS5 syntax:
- `voice style register` — all terms
- `"voice register"` — exact phrase
- `voice*` — prefix match
- `voice NOT filler` — exclusion
- `voice OR tone` — OR

---

## Seed Data

Initial guide records are in `seeds/` organized by type:

```
seeds/
  doctrine/         9 records — one per doctrine file
  style-packs/      6 records — one per supported domain
  rubrics/          7 records — one per QA perspective
  templates/        6 records — brief, outline, and domain-specific templates
  examples/         6 records — worked production examples
  anti-patterns/    6 records — named failure modes
  canon/            5 records — domain-specific canonical facts
  decision-records/ 10 records — architectural decisions D-001 through D-010
```

Run `npm run seed` to load all seeds. Run `npm run seed -- --reset` to wipe and reload.

## File Structure

```
mcp/guide-server/
  src/
    server.js         MCP entry point (stdio transport)
    db.js             SQLite database layer
    tools.js          MCP tool definitions and handlers
    schema.sql        SQLite schema with FTS5 and triggers
    seed.js           Seed loader script
    setup.js          Schema initializer
  seeds/              JSON seed files by type
  guides.db           SQLite database (created at runtime — gitignored)
  package.json
  COMMAND_INTEGRATION.md   How each framework command uses guide-server
  README.md           This file
```

## Related

- `COMMAND_INTEGRATION.md` — per-command tool mapping and fallback protocol
- `.writing-framework/guides/` — filesystem mirror of guide records
- `mcp/cache-server/README.md` — run and artifact cache (separate MCP)
- `mcp/artifact-server/README.md` — artifact I/O (separate MCP)
