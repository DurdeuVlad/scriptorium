# GitHub Copilot Adapter

This directory contains the GitHub Copilot adapter for the Editorial Orchestrator framework.

## What Is This

The `.copilot/` directory is a thin adapter. All canonical framework content lives in `.writing-framework/`. This directory contains Copilot-specific wiring plus thin command wrappers for discoverability.

## How It Works

GitHub Copilot reads repository-level instructions from `.github/copilot-instructions.md`. This repo now ships that active file, and `copilot-instructions-template.md` remains the source template.

The instructions tell Copilot to:
1. Load doctrine from `.writing-framework/doctrine/` before every writing task
2. Resolve commands through `.copilot/commands/[name].md` when available
3. Execute the canonical command spec in `.writing-framework/commands/[name].md`
4. Load the relevant workflow from `.writing-framework/workflows/` when the command depends on one
5. Validate all structured outputs against schemas in `.writing-framework/schemas/`
6. Surface blockers using the B1-B9 taxonomy

## Setup

1. The active Copilot instructions file is `.github/copilot-instructions.md`
2. Use `copilot-instructions-template.md` when regenerating or exporting the adapter
3. Use `.copilot/commands/` as the discoverable command surface

## Invoking Commands

In Copilot Chat:

```
@workspace /session-start
@workspace Run the /write-brief command with goal="..."
@workspace Execute /orchestrate-draft using brief at artifacts/brief.json
```

## Where Workflows Live

- Discoverable Copilot command wrappers: `.copilot/commands/`
- Active Copilot instructions: `.github/copilot-instructions.md`
- Canonical command logic: `.writing-framework/commands/`
- Canonical workflows: `.writing-framework/workflows/`
- Canonical schemas: `.writing-framework/schemas/`

## Design Rule

This adapter is intentionally thin. Do not add command logic to the Copilot instructions file. All command logic lives in `.writing-framework/commands/`. The instructions file only bootstraps doctrine loading and command routing.

## Related

- `.writing-framework/` - canonical framework content
- `.claude/` - Claude Code adapter
- `.codex/` - OpenAI Codex adapter
- `.windsurf/` - Windsurf adapter
