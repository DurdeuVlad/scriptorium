# OpenAI Codex Adapter

This directory contains the OpenAI Codex adapter for the Editorial Orchestrator framework.

## What Is This

The `.codex/` directory is a thin adapter. All canonical framework content lives in `.writing-framework/`. This directory contains Codex-specific wiring plus thin command wrappers for discoverability.

## How It Works

OpenAI Codex reads its persistent instructions from a system prompt. The file `system-prompt-template.md` in this directory contains the system prompt to use when invoking Codex against this framework.

The system prompt instructs Codex to:
1. Read `.writing-framework/doctrine/` before every task
2. Resolve commands through `.codex/commands/[name].md` when available
3. Execute the canonical command spec in `.writing-framework/commands/[name].md`
4. Load the relevant workflow from `.writing-framework/workflows/` when the command depends on one
5. Use the schemas in `.writing-framework/schemas/` for all structured outputs
6. Log blockers per the B1-B9 taxonomy defined in doctrine

## Setup

1. Copy the contents of `system-prompt-template.md` into your Codex system prompt configuration
2. Replace `[PROJECT_CONTEXT]` with a brief description of your project
3. Replace `[ACTIVE_STYLE_PACK]` with the style pack filename from `.writing-framework/styles/` appropriate for your domain
4. Use `.codex/commands/` as the discoverable command surface

## Invoking Commands

Call framework commands by name in natural language:

```
Run /discovery
Run /write-brief goal="..."
Run /orchestrate-draft brief_path="artifacts/brief.json"
```

Or use the full invocation format:

```
Execute the command defined in .codex/commands/write-brief.md
```

## Where Workflows Live

- Discoverable Codex command wrappers: `.codex/commands/`
- Canonical command logic: `.writing-framework/commands/`
- Canonical workflows: `.writing-framework/workflows/`
- Canonical schemas: `.writing-framework/schemas/`

## Design Rule

This adapter is intentionally thin. Do not add command logic here. All command logic lives in `.writing-framework/commands/`. If you need to change how a command works, edit the canonical spec there, not this adapter.

## Related

- `.writing-framework/` - canonical framework content
- `.claude/` - Claude Code adapter
- `.windsurf/` - Windsurf adapter
- `.copilot/` - GitHub Copilot adapter
