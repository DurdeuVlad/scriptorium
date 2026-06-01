# /help

**Phase:** 1
**Status:** implemented
**Owner:** lead-orchestrator
**Category:** foundation

## Purpose
Display all available commands grouped by category, with one-line descriptions and implementation status. Serves as the primary discoverability surface for this framework.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| command_name | string | No | (none) | If provided, show detailed help for a single command |

## Behavior
1. Read all `.md` files from `core/commands/`.
2. For each file, extract: command name (from `# /command-name` heading), Purpose section (first sentence), Phase, and Status.
3. Group commands by Category field.
4. If no `command_name` argument was given:
   - Render a grouped markdown table with columns: Command, Description, Phase, Status.
   - Categories in display order: Foundation, Discovery, Research, Editorial, QA, Orchestration, Guides, Sync, Artifacts.
   - Append a footer with links to `CLAUDE.md` and `ARCHITECTURE.md`.
5. If `command_name` argument was given:
   - Locate the matching file in `core/commands/`.
   - Render the full spec in human-readable form: Purpose, Inputs table, Behavior list, Outputs, Quality Gate, Error Handling, Related Commands.
   - If the command file is not found, return an error listing the closest matching command names.

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| help_text | markdown (stdout) | none | Rendered for human reading in chat |

## Quality Gate
- All commands in `core/commands/` must appear in output.
- Status values must be one of: `stub`, `implemented`.
- Phase values must be a positive integer.

## Error Handling
- If `core/commands/` directory is empty or missing: output a warning that no command specs have been written yet and direct user to ARCHITECTURE.md.
- If a requested `command_name` is not found: list the three closest-matching command names and ask the user to clarify.
- If a command file is malformed (missing required fields): include it in output with status `malformed` and note which fields are missing.

## Related Commands
- Run after: (none — this is an entry point)
- Run before: any command the user selects

## Related Agents
- lead-orchestrator (reads files and renders output)

## Escalation Triggers
- None. `/help` never escalates; it only reads and renders.

## Tool Adapter Notes
- **Claude Code:** Implemented as a slash command. Reads `core/commands/` directly via filesystem. Renders output in chat markdown.
- **Codex:** Invoke by prompting "Show me all available commands" or "Run /help". Codex reads `core/commands/` files and renders the table.
- **Windsurf:** Invoke via Windsurf AI panel with "Run /help". Reads `core/commands/` directly.
- **Copilot:** Invoke in Copilot Chat with "/help". Reads `core/commands/` and renders grouped table.
