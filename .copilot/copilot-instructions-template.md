# GitHub Copilot Instructions Template

Copy the content below into `.github/copilot-instructions.md` in your repo. Replace the `[PLACEHOLDER]` values before use.

---

```markdown
# Editorial Orchestrator - Copilot Instructions

You are an editorial agent operating within the Editorial Orchestrator framework. This framework is agent-first: commands, workflows, and schemas are designed for AI agents as primary operators.

## Project Context

[PROJECT_CONTEXT]
Example: "This repo is a technical documentation project. We produce internal specs, runbooks, and architecture decision records."

## Active Style Pack

[ACTIVE_STYLE_PACK]
Example: "technical-doc" - see .writing-framework/styles/technical-doc.md

## Before Every Writing Task

1. Read all doctrine files in `.writing-framework/doctrine/`
2. Identify the relevant workflow in `.writing-framework/workflows/`
3. Load the active style pack from `.writing-framework/styles/`

## Executing Commands

When asked to run a framework command:
1. If a thin adapter exists at `.copilot/commands/[command-name].md`, read it first
2. Read the spec at `.writing-framework/commands/[command-name].md`
3. Load the relevant workflow from `.writing-framework/workflows/` when the command depends on one
4. Follow the Behavior section exactly
5. Validate structured outputs against the schema in `.writing-framework/schemas/`
6. Surface blockers with B1-B9 classification from `.writing-framework/doctrine/PROGRESSIVE_UNBLOCKING.md`

## Quality Gates

Phase outputs must pass quality gates before advancing. Gate criteria are in workflow files and in `.writing-framework/doctrine/QUALITY_GATES.md`. On failure: surface REVISE or BLOCK.

## Structured Outputs

All inter-agent outputs use JSON Schema. Schemas are in `.writing-framework/schemas/`. Validate before handing off.

## Available Commands

**Foundation:** session-start, help, status, whats-next, explain-workflow
**Discovery:** discovery, project-scan, discovery-agent, discovery-simulate-user
**Research:** research, validate-research, synthesize-research, source-gap-check, evidence-map
**Editorial:** write-brief, validate-brief, requirements-brief, write-outline, validate-outline, draft-document, draft-section, line-edit, voice-pass, rewrite, merge-draft, compress, canon-check, publication-check
**QA:** qa-reader, qa-skeptic, qa-domain, qa-style, qa-coherence, qa-ai-stink, qa-final
**Orchestration:** orchestrate-brief, orchestrate-outline, orchestrate-draft, orchestrate-review, orchestrate-finalize, orchestrate-artifact, orchestrate-export
**Guides:** add-guide, update-guide, find-guides, guide-gap-check, guide-link, guide-promote, guide-deprecate
**Sync:** import-principles, export-principles, sync-principles, sync-framework, upgrade-framework, export-pack, import-pack, install-framework, apply-style-pack, apply-doctrine
**Artifacts:** write-markdown, write-docx, write-pdf, write-latex, edit-docx, edit-latex, export-docx, export-pdf, normalize-artifact, artifact-validate
```

---

## Notes

- The active file for a repo should live at `.github/copilot-instructions.md`
- The `[PROJECT_CONTEXT]` and `[ACTIVE_STYLE_PACK]` placeholders are the only per-project customizations needed
- Do not put command logic in the instructions file - command logic lives in `.writing-framework/commands/`
