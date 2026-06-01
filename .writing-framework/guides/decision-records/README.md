# guides/decision-records/ — Decision Record Guide Records

## What This Directory Contains

This directory stores **decision records** — structured documentation of significant choices made during a project or during framework development. A decision record captures what was decided, why, what alternatives were considered, what the tradeoffs were, and what the consequences are expected to be.

Decision records are the institutional memory of the system. They answer the question that always comes six months later: "Why did we do it this way?" Without decision records, organizational context lives in the heads of the people who were in the room. When those people are unavailable — or have forgotten — the reasoning behind a decision becomes unrecoverable.

This directory holds two classes of decision record:
1. **Framework decisions** — choices made about the framework itself (how the guide-server backend works, how sync is structured, how canon conflicts are resolved)
2. **Project decisions** — significant choices made within a project (why a story went in a particular direction, why a particular faction was restructured, why a technical approach was changed)

Project decision records carry a `project` field. Framework decision records use `project: framework`.

---

## What Qualifies as a Decision Record

A decision should be recorded when:
- The decision is not obvious in retrospect (a future reader would not know why this was chosen over alternatives)
- The decision was contentious or had meaningful tradeoffs
- The decision reversed a prior direction or resolved a conflict
- The decision constrains future choices (choosing X makes Y harder or impossible)
- The decision resolves a canon conflict in a project world

Not every choice needs a record. Routine decisions — applying a standard template, following an established pattern, choosing the default option — do not require documentation. A decision record should add information that is not recoverable from the output alone.

---

## Record Structure

```yaml
---
type: decision-record
id: dr-[project]-[slug]
title: "[Short description of the decision]"
project: [project identifier | framework]
date: YYYY-MM-DD
decision_makers: [names or roles]
status: active | superseded | draft
superseded_by: [id, if applicable]
tags: [architecture, canon, workflow, style, ...]
---
```

The body contains:

**Decision**
State the decision clearly and completely, in one sentence if possible. Do not bury it.

**Context**
The situation that made this decision necessary. Minimum necessary context — what a future reader needs to understand why this was a decision at all.

**Alternatives considered**
Each alternative that was seriously evaluated. For each: what it is, why it was considered, and why it was rejected.

**Rationale**
Why the chosen option was selected over the alternatives. Be specific. "It seemed like the best approach" is not rationale.

**Tradeoffs and risks**
What is lost or risked by this decision. No decision is without cost; documenting the cost makes future revision easier because the original reasoning is clear.

**Consequences**
What this decision constrains, enables, or requires going forward. If this decision makes certain future choices harder or impossible, say so.

**Review trigger**
Under what circumstances should this decision be revisited? "If X happens, this decision should be re-evaluated." Not all decisions need a review trigger, but many do.

---

## Framework Decision Records vs. Project Decision Records

**Framework decision records** (`project: framework`) document choices about how the framework itself is built and operated. Examples:
- Why SQLite with FTS5 was chosen over a vector database for guide-server
- Why the canon conflict resolution process requires human review rather than automated resolution
- Why sync is manifest-driven rather than differential
- Why style packs are separate from rubrics rather than combined

**Project decision records** (`project: [project-id]`) document choices within a specific creative or documentation project. Examples:
- Why Velrath was destroyed rather than besieged (and the narrative consequences)
- Why the Compact's true motivation was changed from economic to political
- Why a section of the documentation was restructured to target a different reader

Both types use the same record structure. They are distinguished only by the `project` field and by the tags applied.

---

## Decision Records and Canon Conflict Resolution

When a canon conflict is identified in `guides/canon/` and resolved, the resolution must be documented as a decision record. The record should:
- Identify both conflicting canon records by ID
- State which version was determined to be correct
- Explain why (source authority, narrative coherence, human author preference)
- Reference the updated canon records

Canon conflict resolutions are among the most important decisions to record. Without documentation, the same conflict may be re-litigated or re-introduced by future content generation.

---

## Supersession

When a decision is reversed or significantly updated, the old record is marked `status: superseded` with a `superseded_by` reference to the new decision record. Do not delete old decision records. The history of how the system's thinking evolved is valuable.

The new record should reference the old one in its Context section: "This decision supersedes [DR-ID], which had established [prior approach], because [reason for change]."

---

## Querying Decision Records

Via guide-server MCP (Phase 2 and later):

```
search_guides(type="decision-record", project="velrath-campaign")
search_guides(type="decision-record", project="framework", tags=["architecture"])
get_guide(id="dr-framework-guide-server-backend")
related_guides(id="dr-framework-canon-conflict-process")
```

---

## Adding Decision Records

Decision records should be created at the time of the decision, not retrospectively. Retrospective records are better than none, but they lose the precision of reasoning that was present at the time.

When creating:
1. Use the naming convention `dr-[project]-[slug].md`
2. Fill in all required sections. A decision record missing the Alternatives Considered section is not complete.
3. Register with guide-server using `add_guide`.
4. If the decision resolves a canon conflict, update the affected canon records.
5. If the decision changes a framework behavior, update the affected doctrine, style pack, or workflow documentation.

---

## Related

- `guides/canon/` — canon records, whose conflicts are resolved via decision records
- `doctrine/` — framework doctrine updated when framework decisions are made
- `workflows/` — workflows updated when process decisions are made
- `mcp/guide-server/README.md` — guide-server operations
- `sync/README.md` — sync system whose behavior is governed by framework decisions
