# guides/doctrine/ — Doctrine Guide Records

## What This Directory Contains

This directory stores **guide-server records that reflect framework doctrine**. These are not the canonical doctrine files themselves — those live in `doctrine/`. These records are the guide-server's searchable, linkable copies of doctrine content, formatted for retrieval and cross-referencing.

Think of this directory as the index layer: agents query guide-server to find relevant doctrine, receive a record from here, and follow the canonical reference back to `doctrine/` when they need the full source. The guide records here are excerpts, summaries, and tagged applications of doctrine — not replacements for the source.

---

## How Doctrine Guide Records Differ from Doctrine Files

| | `doctrine/` | `guides/doctrine/` |
|---|---|---|
| **Purpose** | Canonical statement of a rule or principle | Searchable, linkable excerpt for agent retrieval |
| **Contents** | Full doctrine with rationale, examples, edge cases | Summary, key rules, application context, tags |
| **Authority** | Source of truth | Derived — must stay in sync with source |
| **Modified by** | Human author or framework maintainer | `/sync-framework` command or manual sync |
| **Queried by** | Agents reading full doctrine | Agents searching for applicable doctrine |

A doctrine file in `doctrine/compression.md` might be 600 words with multiple examples and edge cases. The corresponding guide record in `guides/doctrine/` might be 150 words: the core rule, two canonical examples, and the tags that make it discoverable.

---

## Record Structure

Each doctrine guide record contains the following fields in its YAML frontmatter:

```yaml
---
type: doctrine
id: doctrine-[slug]
title: "[Doctrine name]"
canonical_source: doctrine/[filename].md
tags: [compression, voice, structure, vocabulary, ...]
applies_to: [general-writing, technical-doc, lore-player-facing, ...]
version: 1.0
last_synced: YYYY-MM-DD
status: active | deprecated | draft
---
```

The body contains:
- **Core rule** — the essential claim of the doctrine, in 1-3 sentences
- **Key constraints** — specific dos and don'ts that follow from the rule
- **Application examples** — 2-4 brief examples showing the doctrine applied
- **Cross-references** — links to related doctrine and style packs

---

## How to Add a Doctrine Guide Record

1. Ensure the canonical doctrine file exists in `doctrine/`.
2. Create a new `.md` file in `guides/doctrine/` using the naming convention `doctrine-[slug].md`.
3. Fill in the YAML frontmatter fields above.
4. Write a summary body following the structure above.
5. Register the record in guide-server using `add_guide` (when guide-server is implemented in Phase 2).
6. Run `/sync-framework` to verify the record is consistent with its canonical source.

Do not create guide records for doctrine that does not yet have a canonical source. Draft doctrine belongs in `doctrine/` first; the guide record follows.

---

## How to Search Doctrine Records

Via guide-server MCP (Phase 2 and later):

```
search_guides(type="doctrine", query="compression active verbs")
search_guides(type="doctrine", tags=["voice"], applies_to=["general-writing"])
get_guide(id="doctrine-compression")
related_guides(id="doctrine-compression")
```

Until guide-server is implemented, search this directory directly using full-text search against the `.md` files.

---

## Sync and Freshness

Doctrine guide records must stay in sync with their canonical sources. When a doctrine file in `doctrine/` is updated, the corresponding guide record in `guides/doctrine/` must also be updated.

The `/sync-framework` command handles automated sync for records that have been registered in guide-server. For manually created records, update the `last_synced` field in the frontmatter and review the body for consistency with the canonical source.

Records with `last_synced` more than 90 days old should be flagged for review. Stale guide records are a liability — agents retrieving them may apply outdated doctrine.

---

## Related

- `doctrine/` — canonical doctrine source files
- `mcp/guide-server/README.md` — guide-server operations and backend
- `sync/README.md` — sync system for keeping records current
- `guides/style-packs/` — style pack guide records (same pattern, different type)
