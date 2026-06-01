# guides/anti-patterns/ — Anti-Pattern Guide Records

## What This Directory Contains

This directory stores **anti-pattern guide records** — documented recurring mistakes, failure modes, and quality degradations specific to a domain or workflow. Anti-patterns are the system's institutional memory of how things go wrong.

Anti-pattern records are distinct from rubric criteria. Rubrics describe what quality looks like. Anti-patterns describe what failure looks like — specifically enough that a QA agent can detect an instance of the failure in the wild.

Each anti-pattern record documents a failure mode with enough specificity that:
1. A QA agent can check for it explicitly during review
2. A drafting agent reading it can recognize the pattern before producing it
3. A human reviewer can understand exactly what is wrong with a flagged output

---

## Relationship to Other Guide Types

Anti-patterns are sourced from four places:

- **Style packs** — each style pack contains an anti-patterns section; those anti-patterns are the primary source for records in this directory. The records here expand and make them more specific.
- **QA review** — when QA agents repeatedly flag the same type of failure across multiple reviews, that failure mode should be documented as a named anti-pattern.
- **Human editorial review** — when a human reviewer identifies a recurring structural or voice problem, it should be captured here.
- **Retrospectives** — post-project reviews that identify patterns in what went wrong.

Every style pack anti-pattern section should have corresponding records in this directory. A style pack that says "avoid over-explaining transitions" is readable guidance. An anti-pattern record named `AP-general-transition-explaining` with specific examples, detection criteria, and fix guidance is an operational tool.

---

## Record Structure

```yaml
---
type: anti-pattern
id: ap-[domain-slug]-[short-name]
title: "[Short name of the anti-pattern]"
domain: [general-writing | technical-doc | internal-memo | lore-player-facing | lore-dm | card-flavor | all]
applies_to_style_pack: sp-[slug]
applies_to_rubric: rubric-[slug]
severity: critical | major | minor
tags: [voice, structure, vocabulary, compression, ...]
first_observed: YYYY-MM-DD
status: active | deprecated | draft
---
```

The body contains:
- **Pattern name** — the short identifier for this failure mode
- **Description** — what the anti-pattern is, in plain terms
- **Why it fails** — the specific quality dimension this anti-pattern violates and why
- **Detection criteria** — how to identify an instance. Specific, not vague.
- **Example of the anti-pattern** — a real or constructed example of the failure
- **Corrected version** — the same content, fixed
- **Related anti-patterns** — other patterns that co-occur or are easily confused

---

## Severity Levels

**Critical**
The output cannot proceed. Critical anti-patterns indicate fundamental domain violations that invalidate the document's purpose. For example: a technical runbook that omits error cases; a DM NPC entry without stated motivation; a decision memo that does not state the decision.

**Major**
The output requires revision before proceeding. Major anti-patterns significantly reduce quality or usefulness. For example: excessive hedging language in general writing; a flavor text line that could belong to any card; an internal memo that buries the action items.

**Minor**
The output can proceed but should be flagged for cleanup. Minor anti-patterns reduce polish without impairing function. For example: a transitional sentence that over-explains; a synonym substitution that reduces precision; a paragraph that ends on a weak sentence.

---

## How QA Agents Use Anti-Patterns

In the QA workflow:

1. After retrieving the applicable rubric, retrieve the applicable anti-pattern records.
2. Check the output explicitly for each anti-pattern at or above the severity threshold for the current stage.
   - Draft review: check Critical and Major only
   - Final review: check all three levels
3. For each detected instance: quote the failing text, name the anti-pattern, state the severity, and provide a fix.
4. Critical anti-patterns block output. Major anti-patterns create a Conditional Pass requiring revision. Minor anti-patterns are flagged as polish notes.

The anti-pattern check is not a soft suggestion — it is a named, documented failure mode that the output either has or does not have. Vague quality impressions ("this doesn't quite feel right") should be escalated to rubric criteria or documented as new anti-patterns if they recur.

---

## Naming Convention

Anti-pattern IDs follow the format: `ap-[domain]-[short-name]`

Examples:
- `ap-general-throat-clearing` — first-paragraph throat-clearing in general writing
- `ap-technical-simply-language` — use of "simply", "just", "easily" in technical docs
- `ap-memo-buried-decision` — burying the decision in paragraph 4+ of a memo
- `ap-lore-player-museum-placard` — neutral external description in player-facing lore
- `ap-lore-dm-unannotated-secret` — DM-only information not labeled `[SECRET]`
- `ap-flavor-generic-epic` — generic epic sentiment in card flavor text
- `ap-all-empty-modifiers` — empty modifier adjectives across all domains

The `all` domain applies to anti-patterns that recur across every domain (empty modifiers, passive-voice evasion, hedging without content).

---

## Adding New Anti-Pattern Records

Add a new record when:
- A QA agent flags the same type of failure in three or more separate reviews
- A human reviewer identifies a failure mode that is not already documented
- A style pack anti-pattern section describes a failure mode without a corresponding record

When adding:
1. Confirm the anti-pattern is not already captured under a different name.
2. Write a specific, checkable detection criterion. "The writing lacks energy" is not detectable. "The paragraph contains two or more of: 'it's worth noting', 'needless to say', 'as we've established', 'in other words'" is detectable.
3. Provide an example and correction.
4. Register with guide-server using `add_guide`.
5. Update the applicable rubric to reference the new anti-pattern in its anti-pattern dimension.

---

## Current Anti-Pattern Inventory

| ID | Domain | Severity | Status |
|---|---|---|---|
| *(populate as records are created)* | | | |

---

## Related

- `guides/rubrics/` — rubrics that include anti-pattern checks
- `guides/style-packs/` — style packs with anti-patterns sections that source these records
- `guides/examples/` — negative examples demonstrating specific anti-patterns
- `doctrine/` — universal standards that anti-patterns violate
- `mcp/guide-server/README.md` — guide-server operations
