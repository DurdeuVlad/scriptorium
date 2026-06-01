# guides/templates/ — Template Guide Records

## What This Directory Contains

This directory stores **template guide records** — guide-server entries representing known-good document templates. Each record describes a template, its intended use, its structure, and its relationship to the canonical template file in `templates/`.

Template guide records serve discovery: an agent or orchestrator searching for a template to apply to a task queries guide-server, finds the record here, and follows the `canonical_source` link to the actual template in `templates/`. Records here are not the templates themselves.

---

## Relationship to Canonical Templates

```
templates/runbook-template.md           ← canonical template (use this to generate a doc)
guides/templates/tmpl-runbook.md        ← guide record (search/discover this)
```

The guide record describes the template — what it is for, when to use it, what it requires, and what it produces. The canonical template is the actual document structure with placeholder sections.

Templates stored in `guides/templates/` are also **candidates for promotion** to canonical templates in `templates/`. A record with `status: candidate` means the template has been used successfully but has not yet been formally reviewed and promoted to `templates/`. A record with `status: active` means the canonical template exists and is maintained.

---

## Record Structure

```yaml
---
type: template
id: tmpl-[slug]
title: "[Template name]"
canonical_source: templates/[filename].md
domain: [technical-doc | internal-memo | lore | general-writing | ...]
document_type: [runbook | decision-memo | npc-entry | status-update | ...]
tags: [procedure, engineering, memo, lore, ...]
produces: [description of what the template generates]
requires_style_pack: [sp-slug, if applicable]
version: 1.0
last_reviewed: YYYY-MM-DD
status: active | candidate | deprecated | draft
---
```

The body contains:
- **Purpose** — what this template is for and when to use it
- **Structure overview** — the sections the template contains and what each contains
- **Required fields** — what must be filled in for the output to be valid
- **Optional sections** — what can be omitted without breaking the template
- **Usage notes** — common mistakes or important customization points
- **Cross-references** — related templates, style packs, rubrics

---

## Template Promotion Process

Templates progress through three states:

**Draft** (`status: draft`)
A template exists in `templates/` but has not been reviewed or used in production. The guide record may exist as a placeholder. Do not rely on draft templates without reviewing them first.

**Candidate** (`status: candidate`)
A template has been used in at least one production output, the result was reviewed as successful, but the template has not yet been formally reviewed for general use. Agents may use candidate templates but should flag any issues encountered.

**Active** (`status: active`)
The template has been reviewed, the canonical file is maintained, and it is the recommended structure for its document type. Use active templates without reservation.

To promote a candidate to active:
1. Use the template in a production context and review the output.
2. Verify the canonical file in `templates/` is complete and correct.
3. Update the guide record to `status: active`.
4. Update the last_reviewed date.
5. Announce the promotion in a decision record if the template was created to solve a known structural problem.

---

## When to Create a Template

Create a new template when:
- A document type recurs across multiple projects and the structure is stable
- A document type has structural requirements that agents regularly get wrong (the template enforces the requirements)
- A QA review identifies consistent structural failures that a template would prevent
- A style pack specifies document structures that should be templated (e.g., `styles/technical-doc.md` specifies runbook structure)

Do not create templates for one-off document types or for structures that vary substantially by project. Templates impose consistency; they should only be used where consistency is valuable.

---

## Current Template Inventory

| ID | Document Type | Domain | Status |
|---|---|---|---|
| `tmpl-runbook` | Runbook | Technical documentation | active |
| `tmpl-api-reference` | API reference | Technical documentation | active |
| `tmpl-decision-memo` | Decision memo | Internal communication | active |
| `tmpl-status-update` | Status update | Internal communication | active |
| `tmpl-meeting-summary` | Meeting summary | Internal communication | active |
| `tmpl-npc-entry` | NPC entry | Lore — DM-facing | active |
| `tmpl-faction-entry` | Faction entry | Lore — DM-facing | active |
| `tmpl-encounter-design` | Encounter design | Lore — DM-facing | active |

Update this table when templates are added, promoted, or deprecated.

---

## Querying Templates

Via guide-server MCP (Phase 2 and later):

```
search_guides(type="template", domain="internal-memo")
search_guides(type="template", document_type="runbook")
get_guide(id="tmpl-decision-memo")
related_guides(id="tmpl-decision-memo")
```

---

## Related

- `templates/` — canonical template files
- `styles/` — style packs referenced by templates
- `guides/rubrics/` — QA rubrics for validating template-generated documents
- `mcp/guide-server/README.md` — guide-server operations
- `sync/README.md` — sync system for keeping guide records current
