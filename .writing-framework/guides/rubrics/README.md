# guides/rubrics/ — Rubric Guide Records

## What This Directory Contains

This directory stores **rubric guide records** — evaluation criteria for specific domains and document types. Rubrics define what quality means in a specific context, broken down into assessable dimensions with explicit pass/fail or graded criteria.

Rubrics are the primary tool used by QA agents. When a QA agent reviews a piece of writing, it retrieves the applicable rubric from guide-server and applies each criterion to the output. The rubric tells the agent what to look for, how to assess it, and how to weight different kinds of failures.

General doctrine (in `doctrine/`) establishes universal writing standards. Rubrics translate those standards into domain-specific, actionable criteria. A rubric for card flavor text asks different questions than a rubric for a technical runbook — the rubric formalizes those differences.

---

## Relationship to Other Guide Types

Rubrics synthesize criteria from multiple sources:

- **Style packs** (`guides/style-packs/`, `styles/`) — voice, tone, vocabulary, and structure requirements
- **Doctrine** (`guides/doctrine/`, `doctrine/`) — universal standards for compression, clarity, precision
- **Anti-patterns** (`guides/anti-patterns/`) — specific failure modes to check for
- **Examples** (`guides/examples/`) — calibration references for quality thresholds

A rubric for a domain should not introduce criteria that are not grounded in the applicable style pack, doctrine, or anti-pattern catalog. If a QA criterion exists in the rubric but not in the supporting guides, either add the criterion to the appropriate guide or remove it from the rubric.

---

## Record Structure

```yaml
---
type: rubric
id: rubric-[domain-slug]
title: "[Domain] Quality Rubric"
domain: [general-writing | technical-doc | internal-memo | lore-player-facing | lore-dm | card-flavor | ...]
applies_to_style_pack: sp-[slug]
tags: [qa, evaluation, voice, structure, ...]
version: 1.0
last_reviewed: YYYY-MM-DD
status: active | draft | deprecated
---
```

The body contains a set of **evaluation dimensions**. Each dimension has:
- **Dimension name** — what is being assessed
- **Weight** — how heavily this dimension is weighted in overall assessment (critical / major / minor)
- **Pass criteria** — what the output must do to pass on this dimension
- **Fail criteria** — what constitutes a failure, with specific examples where possible
- **Grading note** — any context for borderline cases

---

## Standard Evaluation Dimensions

Most rubrics address some combination of the following dimensions. The specific criteria within each dimension are domain-specific.

**Voice and tone** (weight varies by domain)
Does the output use the correct voice for the domain? Are forbidden vocabulary items present? Does the tone match the style pack profile?

**Structure** (weight varies by domain)
Is the document organized correctly for the type? Does it lead with the right information? Are the correct structural elements present?

**Compression and economy** (typically major)
Is every sentence necessary? Are there padding phrases, redundant transitions, or empty qualifiers?

**Completeness** (weight varies by domain)
Does the output cover what is required? For technical docs: are all steps, prerequisites, and error cases present? For DM-facing lore: are motivation and limits stated?

**Accuracy** (critical for technical-doc and canon-dependent lore)
Is the content factually correct? Does it contradict established canon or documented technical facts?

**Readability** (typically minor)
Can the target reader follow this document in a single pass? Are there structural or clarity barriers?

**Anti-pattern check** (always present)
Does the output contain any of the domain-specific anti-patterns documented in the corresponding anti-pattern guide?

---

## How QA Agents Use Rubrics

When a QA agent receives an output to review:

1. Determine the domain and document type.
2. Query guide-server: `search_guides(type="rubric", domain="[domain]")`.
3. Retrieve the rubric record; follow `canonical_source` if the full rubric is needed.
4. Assess the output against each dimension in sequence.
5. Flag failures with:
   - The dimension name
   - The specific criterion failed
   - A quoted excerpt from the output demonstrating the failure
   - A suggested fix (for major/minor issues) or an escalation note (for critical failures)
6. Report the overall assessment: Pass / Conditional Pass (minor issues only) / Fail.

A Conditional Pass requires the issuing agent to address flagged issues before the output proceeds to the next stage. A Fail blocks the output and returns it to the drafting agent.

---

## Current Rubric Inventory

| ID | Domain | Style Pack | Status |
|---|---|---|---|
| `rubric-general-writing` | General non-fiction | `sp-general-writing` | active |
| `rubric-technical-doc` | Technical documentation | `sp-technical-doc` | active |
| `rubric-internal-memo` | Internal communication | `sp-internal-memo` | active |
| `rubric-lore-player` | Player-facing lore | `sp-lore-player-facing` | active |
| `rubric-lore-dm` | DM-facing lore | `sp-lore-dm` | active |
| `rubric-card-flavor` | Card flavor text | `sp-card-flavor` | active |

---

## Adding or Updating Rubrics

Add a new rubric when:
- A new style pack is created (every style pack should have a corresponding rubric)
- A QA review identifies failure modes not covered by any existing rubric
- A domain is significantly expanded (new document types, new audience context)

Update an existing rubric when:
- The corresponding style pack changes
- New anti-patterns are documented
- QA feedback reveals that rubric criteria are being applied inconsistently
- A criterion is producing too many false positives or false negatives

Rubric changes require review before the rubric is returned to `status: active`. A rubric under review should be marked `status: draft`. QA agents should not apply draft rubrics to production outputs.

---

## Related

- `guides/style-packs/` — style packs that rubrics translate into evaluation criteria
- `guides/anti-patterns/` — anti-pattern records checked in the rubric's anti-pattern dimension
- `guides/examples/` — worked examples used to calibrate rubric thresholds
- `doctrine/` — universal writing standards that inform rubric criteria
- `mcp/guide-server/README.md` — guide-server operations for retrieving rubrics
