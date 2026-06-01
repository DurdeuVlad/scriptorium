# guides/examples/ — Example Guide Records

## What This Directory Contains

This directory stores **example guide records** — worked examples of high-quality output for specific domains, document types, and tasks. Examples are drawn from two sources: strong outputs produced by this system that have been reviewed and confirmed as representative of the quality bar, and human-authored originals that serve as calibration anchors.

Examples serve two operational functions in the framework:

**1. QA calibration.** When a QA agent assesses output quality, rubric criteria alone are abstract. The rubric says "compression: no unnecessary sentences." The example shows what that means in practice at the specific length and domain of the output being reviewed. Examples are the concrete reference that makes abstract rubric criteria assessable.

**2. Agent training and orientation.** When a new agent spec is introduced, or when an existing agent is being calibrated to a new domain, examples demonstrate the quality bar more effectively than instructions alone. An agent that has read three strong examples of card flavor text has a more accurate quality target than an agent that has only read the style pack.

---

## What Makes a Valid Example Record

Not every good piece of writing qualifies as an example record. Records must meet the following criteria:

- **Domain-specific** — the example must clearly belong to a specific domain covered by a style pack
- **Representative** — the example demonstrates quality on multiple dimensions simultaneously, not just one
- **Annotatable** — it must be possible to point to specific features of the example and explain why they work
- **Reviewed** — a human author or a QA agent must have confirmed that the example represents the target quality bar
- **Not a lucky exception** — the quality must be reproducible, not an outlier that cannot be explained

Do not add examples that you cannot annotate. An example without explanation has no training value — it just shows the output. The annotation shows why the output works, which is what agents and calibration reviewers need.

---

## Record Structure

```yaml
---
type: example
id: ex-[domain-slug]-[slug]
title: "[Short description of what this is an example of]"
domain: [general-writing | technical-doc | internal-memo | lore-player-facing | lore-dm | card-flavor | ...]
document_type: [optional — e.g., runbook, npc-entry, status-update]
applies_to_style_pack: sp-[slug]
applies_to_rubric: rubric-[slug]
source: [system-generated | human-authored]
reviewed_by: [name or "QA agent"]
reviewed_date: YYYY-MM-DD
tags: [compression, voice, structure, ...]
quality_dimensions_demonstrated: [list of rubric dimensions this example is strong on]
status: active | deprecated | draft
---
```

The body contains:
- **The example** — the actual text, in a code block or quoted section
- **Annotation** — analysis of what makes the example work, keyed to specific rubric dimensions
- **What to notice** — 3-5 specific features an agent should register and internalize
- **What to avoid (contrast)** — optionally, a weaker version of the same content with analysis of what makes it weaker

---

## Annotation Format

Good annotations are specific. They point to individual words, sentences, or structural choices and explain the effect.

Example annotation structure:

```
### What makes this work

1. **Opening sentence carries full weight.** The first sentence states the complete claim without setup.
   No background context is provided because none is needed.

2. **Compression throughout.** "The problem was solved. The solution was worse." Two sentences,
   no wasted words, a before/after structure in eight words.

3. **No forbidden vocabulary.** No instances of "robust", "holistic", "leverage", or similar.
   The verbs are specific and active.
```

Do not annotate in vague terms ("the writing flows well", "good use of voice"). Every annotation must name a specific feature and explain its effect.

---

## Negative Examples

Some records may include **negative examples** — output that fails the quality bar, with annotation explaining the failure. Negative examples are valuable for calibrating QA agents to catch specific failure modes.

Negative example records should be stored separately in `guides/anti-patterns/` unless the contrast between a strong and weak version of the same content is itself the training value. In that case, the negative example may appear within the positive example record as a contrast section.

Negative example records use the same structure with an additional field:
```yaml
polarity: negative
failure_mode: [name of the anti-pattern or rubric dimension failed]
```

---

## Adding New Examples

To add a new example:

1. Identify an output that has been reviewed and confirmed as representative of the quality bar.
2. Create `guides/examples/ex-[domain]-[slug].md` with the full record structure.
3. Write the annotation before marking the record active. An unannotated example record is not complete.
4. Register with guide-server using `add_guide` and link to the applicable style pack and rubric.
5. Update the inventory below.

Do not add draft or unreviewed output as examples. The example inventory is a quality signal — diluting it with mediocre examples undermines the calibration value for every agent that queries it.

---

## Current Example Inventory

| ID | Domain | Document Type | Source | Status |
|---|---|---|---|---|
| *(empty — populate as reviewed examples are confirmed)* | | | | |

---

## Querying Examples

Via guide-server MCP (Phase 2 and later):

```
search_guides(type="example", domain="card-flavor")
search_guides(type="example", applies_to_rubric="rubric-lore-player")
search_guides(type="example", tags=["compression"])
related_guides(id="sp-general-writing")
```

---

## Related

- `guides/rubrics/` — rubrics that examples calibrate
- `guides/style-packs/` — style packs that examples demonstrate
- `guides/anti-patterns/` — anti-patterns that negative examples illustrate
- `evals/` — formal evaluation data for agent performance
- `mcp/guide-server/README.md` — guide-server operations
