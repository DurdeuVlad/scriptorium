# /install-framework

**Phase:** 6
**Status:** stub
**Owner:** import-export-orchestrator
**Category:** sync

## Purpose
Installs this editorial framework into a new target repository by copying the `.writing-framework/` directory, creating tool-specific adapter files and wrapper directories for each requested tool integration, and confirming a successful installation.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| target_repo_path | string | Yes | (none) | Absolute path to the target repository root |
| tools | array of strings | No | [claude, codex, windsurf, copilot] | Tool integrations to set up; one or more of: claude, codex, windsurf, copilot |
| overwrite_existing | boolean | No | false | If true, overwrite .writing-framework/ if it already exists in target; default is to halt if framework is already present |
| dry_run | boolean | No | false | If true, report all actions without writing anything |

## Behavior
1. Validate that `target_repo_path` exists and is a directory. If not, surface a B1 blocker and halt.
2. Check whether `.writing-framework/` already exists in the target repo. If it does and `overwrite_existing` is false: surface an error noting the framework is already installed and halt. If `overwrite_existing` is true: warn the user that existing framework files will be overwritten and proceed.
3. Validate that `tools` contains only recognized values: claude, codex, windsurf, copilot. Surface a validation error for any unrecognized tool name.
4. **Copy framework core:** Copy the local `.writing-framework/` directory in its entirety to `{target_repo_path}/.writing-framework/`. Preserve directory structure. Exclude: `sync/`, `artifacts/`, any run-specific cache files, and `.writing-framework/sessions/`.
5. **Create tool adapter files and directories** for each tool in `tools`:
   - `claude`: Create `{target_repo_path}/CLAUDE.md` from the template at `.writing-framework/templates/adapters/CLAUDE.md.template`. This file is the Claude Code system prompt entry point for the installed framework.
   - `codex`: Create `{target_repo_path}/.codex/` directory. Write `{target_repo_path}/.codex/system-prompt-template.md` from `.writing-framework/templates/adapters/codex-system-prompt.template`.
   - `windsurf`: Create or update `{target_repo_path}/.windsurfrules` from `.writing-framework/templates/adapters/windsurfrules.template`.
   - `copilot`: Create `{target_repo_path}/.github/copilot-instructions.md` from `.writing-framework/templates/adapters/copilot-instructions.template`. Create `.github/` if it does not exist.
6. Write a `{target_repo_path}/.writing-framework/VERSION` file mirroring the current local VERSION.
7. Initialize a `{target_repo_path}/sync/` directory with an empty `sync_manifest.json` stub.
8. Initialize a `{target_repo_path}/artifacts/` directory with a `.gitkeep` file.
9. Report the full list of files written, tool adapters created, and confirm the installation path. Include instructions for the user to run `/session-start` in the new repo to verify the installation.

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| installed_framework | directory | — | .writing-framework/ at target_repo_path |
| tool_adapter_files | list of file paths | — | All adapter files created for each requested tool |
| installation_report | markdown (stdout) | — | Files written, adapter configurations, and post-install steps |

## Quality Gate
- `.writing-framework/` must exist at `target_repo_path` after the command completes.
- At least one tool adapter file must be created if `tools` is non-empty.
- `VERSION` file must be present at `{target_repo_path}/.writing-framework/VERSION`.
- If `dry_run` is true, no files are written and the installation report describes all planned actions only.

## Error Handling
- Target repo does not exist: halt immediately with a descriptive error. Do not create the target directory — only install into pre-existing repos.
- An adapter template file is missing from the local `.writing-framework/templates/adapters/` directory: log a warning for the specific tool, skip its adapter creation, and continue with other tools. Note the missing template in the installation report.
- File copy fails for a framework subdirectory: log the error, note the specific directory as `status: copy_failed`, and continue. Surface all copy failures in the installation report.

## Related Commands
- Run after: (standalone — used to set up a new repo)
- Run before: `/session-start` (in the new target repo, to verify the installation)
- Related: `/upgrade-framework`, `/export-framework`, `/import-framework`

## Related Agents
- import-export-orchestrator

## Escalation Triggers
- `.writing-framework/` already exists in the target and `overwrite_existing: false`: always halt and require explicit user confirmation before proceeding. Never auto-overwrite an existing framework installation.

## Tool Adapter Notes
- **Claude Code:** Copies files using Read + Write tools. Creates directories via Bash mkdir. Reads templates from the local framework using the Read tool.
- **Codex:** Invoke with "Install framework into [path]" or "Run /install-framework target_repo_path=[path]".
- **Windsurf:** Invoke via AI panel. Provide target_repo_path; optionally specify which tools to configure.
- **Copilot:** Invoke in Copilot Chat. Copilot will request target_repo_path if not provided.
