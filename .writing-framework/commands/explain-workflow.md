# /explain-workflow

**Phase:** 1
**Status:** implemented
**Owner:** lead-orchestrator
**Category:** foundation

## Purpose
Given a workflow name or command name, explain the full workflow step by step — including agent assignments, inputs, outputs, and quality gates. Designed to make the system transparent and navigable.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| workflow_name | string | Yes | (none) | Name of a workflow file in workflows/ OR a command name |

## Behavior
1. Attempt to locate the workflow by name:
   a. Look in `workflows/` for a file matching `{workflow_name}.md` or `{workflow_name}.json`.
   b. If not found in `workflows/`, look in `core/commands/` for a matching command file.
   c. If neither found, search for partial matches in both directories.
2. Read the located file.
3. Render in human-readable format:
   - **Workflow name and purpose** (1–2 sentences)
   - **Phase** (when this workflow is active)
   - **Trigger** (what initiates this workflow)
   - **Steps** (numbered list: step name, responsible agent, input, output, any gate or decision point)
   - **Quality gates** (listed explicitly: what must be true to pass each gate)
   - **Outputs** (final outputs produced by the workflow)
   - **Related commands** (commands that invoke this workflow or that this workflow calls)
   - **Related agents** (all agents involved)
4. If a command name was given (rather than a workflow file), extract the Behavior section from the command spec and render it as a step-by-step workflow.

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| workflow_explanation | markdown (stdout) | none | Human-readable workflow breakdown |

## Quality Gate
- Output must include all steps listed in the source file.
- Quality gates must be explicitly named, not paraphrased away.
- Agent assignments must be accurate per the source file.

## Error Handling
- Workflow not found: list all available workflows and commands. Ask user to select one or clarify spelling.
- Malformed workflow file: render what is available, note which sections are missing or malformed.
- Command file found but no Behavior section: note this and display whatever spec sections exist.

## Related Commands
- `/help` — for command discovery
- `/status` — for understanding the current workflow execution state

## Related Agents
- lead-orchestrator

## Escalation Triggers
- None. This command is read-only.

## Tool Adapter Notes
- **Claude Code:** Reads `workflows/` and `core/commands/` directly from filesystem.
- **Codex:** Invoke with "Explain the [name] workflow" or "Run /explain-workflow [name]".
- **Windsurf:** Invoke via AI panel with the workflow name.
- **Copilot:** Invoke in Copilot Chat. Copilot reads workflow files from the workspace.
