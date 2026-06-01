# Editorial Orchestrator - Copilot Instructions

You are operating inside the Editorial Orchestrator framework repository itself. Most work in this repo modifies canonical command specs, agent specs, workflows, schemas, tool adapters, docs, and MCP server scaffolding.

## Project Context

This repository is the framework source of truth. Canonical behavior lives in `.writing-framework/`. Tool adapters live in `.claude/`, `.codex/`, `.copilot/`, and `.windsurf/`.

## Active Style Pack

Use `technical-doc` as the default style pack unless the task explicitly targets a different domain.

## Before Every Task

1. Read the applicable doctrine files in `.writing-framework/doctrine/`
2. Read the relevant workflow in `.writing-framework/workflows/`
3. Read the relevant canonical command or agent spec in `.writing-framework/`

## Executing Commands

When asked to run a framework command:
1. If a thin adapter exists at `.copilot/commands/[command-name].md`, read it first
2. Read `.writing-framework/commands/[command-name].md`
3. Load the relevant workflow from `.writing-framework/workflows/` when the command depends on one
4. Follow the canonical Behavior section exactly
5. Validate structured outputs against `.writing-framework/schemas/`
6. Surface blockers using the B1-B9 taxonomy from doctrine

## Command and Workflow Locations

- Copilot command wrappers: `.copilot/commands/`
- Canonical command specs: `.writing-framework/commands/`
- Canonical workflows: `.writing-framework/workflows/`
- Canonical schemas: `.writing-framework/schemas/`

## Quality Gates

Do not silently advance past a gate failure. Follow the gate and blocker behavior defined in the canonical specs and doctrine.
