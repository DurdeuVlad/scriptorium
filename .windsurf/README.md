# Windsurf Adapter

This directory contains the Windsurf adapter for the Editorial Orchestrator framework.

## What Is This

The `.windsurf/` directory is a thin adapter. All canonical framework content lives in `.writing-framework/`. This directory contains Windsurf-specific wiring plus thin command wrappers for discoverability.

## How It Works

Windsurf reads persistent instructions from `.windsurf/rules/.windsurfrules`. The rules file instructs the Windsurf AI to load framework doctrine, resolve commands through `.windsurf/commands/` when available, execute the canonical specs, and follow the quality gate model.

## Setup

The `.windsurf/rules/.windsurfrules` file is already present. Windsurf will automatically load it when the workspace is opened. Use `.windsurf/commands/` as the discoverable command surface.

## Invoking Commands

In the Windsurf AI panel, invoke commands by name:

```
/session-start
/discovery
/write-brief goal="..."
/orchestrate-draft brief_path="artifacts/brief.json"
```

Windsurf will resolve the adapter in `.windsurf/commands/[name].md`, then load the canonical command spec from `.writing-framework/commands/[name].md` and any relevant workflow from `.writing-framework/workflows/`.

## Where Workflows Live

- Discoverable Windsurf command wrappers: `.windsurf/commands/`
- Active Windsurf rules: `.windsurf/rules/.windsurfrules`
- Canonical command logic: `.writing-framework/commands/`
- Canonical workflows: `.writing-framework/workflows/`
- Canonical schemas: `.writing-framework/schemas/`

## Design Rule

This adapter is intentionally thin. Do not add command logic to `.windsurfrules`. All command logic lives in `.writing-framework/commands/`. The rules file only bootstraps doctrine loading and command routing.

## Related

- `.writing-framework/` - canonical framework content
- `.claude/` - Claude Code adapter
- `.codex/` - OpenAI Codex adapter
- `.copilot/` - GitHub Copilot adapter
