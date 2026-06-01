# TEMPLATE SOURCE OF TRUTH

**Status:** Canonical. Defines template authority, inheritance, override rules, and sync behavior.

---

## Mission

Templates create consistency across runs, agents, and projects. But templates can become stale, diverge silently from their source, or be overridden without documentation — creating a state where multiple versions of "the truth" exist and agents cannot determine which one to trust.

This doctrine establishes a single, unambiguous authority hierarchy for templates, defines how local overrides must be documented, and specifies how conflicts are detected and resolved.

---

## Template Authority Hierarchy

Templates are governed by a three-tier authority hierarchy. Lower tiers can extend or override higher tiers, but only with documentation. Silent divergence is a violation at any tier.

**Tier 1 — Framework Repo (Canonical)**
This repository holds the canonical templates. These are the defaults for all runs unless a local override exists. When no other information is available, use the framework template. Framework templates are versioned.

**Tier 2 — Project Repo (Local Override)**
A specific project may override framework templates to accommodate project-specific structure, audience conventions, or tooling requirements. Local overrides must be stored in the project's `templates/` directory. Every local override must include an override header (format below) that declares which framework template it overrides and what changed.

**Tier 3 — Run-Time Generated (Ephemeral)**
Agents may generate template-like structures during a run (e.g., a dynamically constructed brief format for an unusual document type). These are not templates. They are working artifacts. They do not replace canonical or local templates unless explicitly promoted through the promotion process.

**Authority resolution rule:** When an agent needs a template, look first in the project's `templates/` directory for a local override. If none exists, use the framework template. If neither exists, use the closest available template and document the deviation as a run-time gap. Never invent a template silently.

---

## Source-of-Truth Rules

**The framework template is always the default.** An agent that uses a framework template without checking for a local override is not wrong — it is operating correctly at Tier 1.

**Local overrides must be explicit.** A file in the project `templates/` directory that does not include the override header is not a valid local override. It is an undocumented deviation. Treat it as a potential conflict and flag it.

**Silent drift is a violation.** A local template that has diverged from its framework source over time — without updating the override header — is in violation of this doctrine. Drift is detected during sync. When detected, it must be resolved before the template is used.

**Run-time templates do not persist.** An agent that generates a working template during a run must not save it as a canonical or local template without going through the promotion process. Writing a generated template to `templates/` without a promotion record is a violation.

---

## Override Header Format

Every local override template must begin with a YAML front matter block containing the following fields:

```yaml
---
overrides: [framework-template-name]
framework-version: [version string or date of the framework template being overridden]
override-date: [date this local override was created or last updated]
changes:
  - [specific change 1 — describe what was changed and why]
  - [specific change 2]
  - [additional changes as needed]
---
```

**Field rules:**

- `overrides`: must match the exact filename (without path) of the framework template being overridden. If this field is absent, the file is not a valid override.
- `framework-version`: must identify the specific version or date of the framework template. This is how sync detects whether the framework template has been updated since the override was created.
- `override-date`: when the override was last updated. This is the override's own version marker.
- `changes`: must be specific. "Modified for project X" is not valid. "Removed `related_guides` field — not applicable to this project type" is valid. "Added `regulatory_context` field required for compliance documentation" is valid.

An override header with any field missing or vague is invalid. An agent that encounters an invalid override header must flag it before using the template.

---

## Template Promotion Protocol

A run-time generated template may be promoted to canonical status through the following process:

**Promotion eligibility criteria:**
- Has been used successfully in at least two separate runs
- Has been reviewed for compliance with current doctrine (EDITORIAL_DOCTRINE.md and DECOMPOSITION_RULES.md)
- Does not duplicate an existing template in the framework or project repo
- Has a complete schema definition if it is a structured data template

**Promotion process:**
1. Run `/guide-promote` on the template record, or manually stage the promotion
2. Add the template to `templates/` with correct metadata (title, description, version, date, status)
3. If promoting to Tier 1 (framework), create a pull request or change record — framework templates require review before adoption
4. If promoting to Tier 2 (project local), the override header must be completed as described above

**After promotion:** the template is no longer a run-time artifact. It is a governed document subject to sync rules.

---

## Template Sync Behavior

When `/sync-framework` is executed, the sync process compares local override templates against the current framework templates and generates a sync manifest.

**Sync manifest contents:**
- Templates in framework with no local override (no action needed)
- Templates with local overrides that are current (no action needed)
- Templates with local overrides where the framework version has been updated since the override was created (`framework-version` in the override header does not match current framework version) — **conflict flag**
- Templates in local `templates/` with no `overrides` field — **undocumented deviation flag**
- Framework templates with no corresponding local file that are referenced in a project brief or agent definition — **missing template flag**

**Conflict resolution rules:**
- A conflict (framework updated since local override was created) must be manually reviewed and resolved. The sync process never automatically overwrites a local override.
- Resolution options: update the local override to incorporate framework changes, lock the local override at its current state with documented justification, or delete the local override and revert to the framework template.
- The resolution must update the `framework-version` and `override-date` fields in the override header.

**What sync never does:**
- Never silently overwrites a local override with a framework template
- Never silently ignores a detected conflict
- Never promotes run-time templates to canonical status — that requires the explicit promotion process

**Sync manifest location:** `sync/sync-manifests/` — each run generates a timestamped manifest file.

---

## Template Versioning

Framework templates carry a version marker in their front matter. The version format is `YYYY-MM-DD` or a semantic version string (e.g., `1.2.0`), consistent within the project.

When a framework template is updated:
- Update the version marker
- Add an entry to the template's changelog section (if present)
- The sync process will detect all local overrides referencing the prior version and flag them for review

Local override templates carry both the `framework-version` they were based on and their own `override-date`. Both must be updated when the override is revised.

---

## Cross-References

- `templates/` — canonical framework template files
- `sync/` — sync process configuration and behavior
- `sync/sync-manifests/` — generated sync reports
- `doctrine/DECOMPOSITION_RULES.md` — how templates relate to agent decomposition and handoff schemas
- `schemas/` — schema definitions that templates must conform to
- `doctrine/QUALITY_GATES.md` — gate checks that verify template conformance
