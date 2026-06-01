# .codex/commands

Thin command wrappers for the OpenAI Codex adapter.

These files are pointers only.
- Canonical command specs live in .writing-framework/commands/
- Canonical workflows live in .writing-framework/workflows/
- Canonical schemas live in .writing-framework/schemas/

When a command is invoked through this adapter:
1. Read the matching file in this directory first
2. Load the canonical command spec from .writing-framework/commands/[command-name].md
3. Load the relevant workflow from .writing-framework/workflows/ when the command or gate depends on one
4. Keep all command logic in the canonical spec, not in this adapter
