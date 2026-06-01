# guides/style-packs/ — Style Pack Guide Records

## What This Directory Contains

This directory stores **guide-server copies of style packs**, formatted for full-text search and cross-referencing. The canonical source for style packs is `styles/`. Records here are derived from that source and must be kept in sync with it.

Style pack guide records exist because agents need to search across style packs by tag, domain, trait, or application — and they need to link style packs to other guide types (rubrics, examples, anti-patterns) in the guide-server graph. The flat files in `styles/` are excellent for reading; the records here are structured for retrieval.

---

## Relationship to Canonical Style Packs

```
styles/general-writing.md          ← canonical source (read this)
guides/style-packs/sp-general-writing.md  ← guide record (search this)
```

When an agent is assigned a writing task:
1. The agent (or orchestrator) queries guide-server for applicable style packs.
2. Guide-server returns the record from `guides/style-packs/`.
3. The agent reads the full canonical style pack from `styles/` using the `canonical_source` link in the record.
4. The agent applies the style pack via `/apply-style-pack`.

The guide record is the discovery mechanism. The canonical file is the working document. Both matter; neither replaces the other.

---

## Record Structure

Each style pack guide record contains the following YAML frontmatter:

```yaml
---
type: style-pack
id: sp-[slug]
title: "[Style Pack Name]"
canonical_source: styles/[filename].md
domain: [general-writing | technical-doc | internal-memo | lore-player-facing | lore-dm | card-flavor | ...]
tags: [voice, compression, structure, world-building, lore, documentation, memo, ...]
applies_to_workflows: [draft, qa, revision, ...]
version: 1.0
last_synced: YYYY-MM-DD
status: active | deprecated | draft
---
```

The body contains:
- **Domain summary** — 2-3 sentences describing the writing domain
- **Key voice traits** — the 3-5 voice traits in brief form
- **Core constraints** — critical dos and don'ts for quick reference
- **Forbidden vocabulary** — terms banned in this domain
- **Cross-references** — related rubrics, anti-patterns, examples

The body is intentionally shorter than the canonical style pack. Its purpose is orientation and search, not complete instruction.

---

## Current Style Pack Inventory

| ID | Domain | Canonical Source |
|---|---|---|
| `sp-general-writing` | General non-fiction | `styles/general-writing.md` |
| `sp-technical-doc` | Technical documentation | `styles/technical-doc.md` |
| `sp-internal-memo` | Internal organizational communication | `styles/internal-memo.md` |
| `sp-lore-player-facing` | Player-facing lore and world description | `styles/lore-player-facing.md` |
| `sp-lore-dm` | DM-facing lore and operational worldbuilding | `styles/lore-dm.md` |
| `sp-card-flavor` | Card game flavor text | `styles/card-flavor.md` |

This table should be updated when new style packs are added. Adding a style pack to `styles/` without adding a corresponding guide record and updating this table is incomplete.

---

## How to Add a Style Pack Guide Record

1. Write the canonical style pack in `styles/` first.
2. Create `guides/style-packs/sp-[slug].md` using the structure above.
3. Set `status: draft` until the canonical style pack has been reviewed and marked active.
4. Register with guide-server using `add_guide` (Phase 2).
5. Run `/sync-framework` to verify consistency.
6. Update the inventory table in this README.

---

## How to Search Style Pack Records

Via guide-server MCP (Phase 2 and later):

```
search_guides(type="style-pack", query="imperative voice technical documentation")
search_guides(type="style-pack", domain="lore-player-facing")
search_guides(type="style-pack", tags=["compression"])
related_guides(id="sp-card-flavor")
```

Until guide-server is implemented, search this directory directly and reference `styles/` for the full pack.

---

## Sync and Freshness

Style pack guide records must stay in sync with their canonical sources in `styles/`. When a style pack is updated, run `/sync-framework` to propagate changes to the guide record.

Key sync triggers:
- A voice trait is added or changed in the canonical style pack
- Vocabulary guidance changes (new forbidden terms, new preferred terms)
- Domain scope changes (the style pack now covers additional document types)
- The style pack is deprecated in favor of a new one

Records with `last_synced` more than 60 days behind the canonical source's modification date should be flagged. An agent applying a stale style pack record may apply outdated guidance.

---

## Related

- `styles/` — canonical style pack source files
- `mcp/guide-server/README.md` — guide-server operations
- `sync/README.md` — sync system
- `guides/rubrics/` — QA rubrics that pair with style packs
- `guides/anti-patterns/` — anti-pattern records cross-referenced by style packs
- `guides/examples/` — example records demonstrating style pack application
