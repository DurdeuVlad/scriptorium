# Sync Workflow

**Status:** Phase 8 — Executable
**Owner:** import-export-orchestrator
**Primary Triggers:** /import-framework, /export-framework
**Legacy Compatibility Triggers:** /sync-framework, /import-pack, /export-pack, /import-principles, /export-principles, /sync-principles, /upgrade-framework, /install-framework
**Output:** sync_manifest.json, pack_manifest.json (bundle mode), conflict summary (when needed)
**Key Principle:** Present one inbound command and one outbound command. Legacy sync commands are compatibility wrappers over those two primary flows.

## Purpose
Define the import and export workflow for moving the framework between repositories. The user-facing model is intentionally simple:

- `/import-framework` pulls framework updates into the current repo from another repo or from an exported bundle.
- `/export-framework` publishes the current repo's framework to another repo or into an exported bundle.

Portable bundles remain supported, but "pack" is an internal transport detail rather than the primary user mental model.

## Inputs
| Input | Type | Required | Source |
|-------|------|----------|--------|
| operation | string (`import` or `export`) | Yes | Command entry point |
| path | string | Yes | Source repo/bundle for import, destination repo/directory for export |
| components | array of strings | No | User or orchestrator |
| conflict_resolution_mode | string (`ask`, `prefer-local`, `prefer-source`) | No | User or orchestrator |
| destination_type | string (`repo`, `bundle`, `auto`) | No | User or orchestrator (export only) |
| dry_run | boolean | No | User or orchestrator |
| backup | boolean | No | User or orchestrator |

## Execution Steps

### Step 1: Normalize the Request
- Identify whether the command is `/import-framework` or `/export-framework`.
- If a legacy compatibility command was used, translate it into the equivalent primary command:
  - `/sync-framework` -> `/import-framework` from repo source
  - `/import-pack` -> `/import-framework` from bundle source
  - `/import-principles` -> `/import-framework` with `components=[doctrine, styles]`
  - `/export-pack` -> `/export-framework` with `destination_type=bundle`
  - `/export-principles` -> `/export-framework` with `components=[doctrine, styles]`
  - `/sync-principles` -> `/import-framework` plus `/export-framework` with doctrine/style scope
  - `/upgrade-framework` -> `/import-framework` plus migration rules
  - `/install-framework` -> `/export-framework` to repo mode with first-install semantics

### Step 2: Detect the Transport Shape
- **Import path**
  - If the source contains `.writing-framework/`, treat it as a repo source.
  - If the source contains `pack_manifest.json`, treat it as a bundle source.
- **Export path**
  - If `destination_type=repo`, export directly into the receiving repo.
  - If `destination_type=bundle`, create a portable bundle with `pack_manifest.json`.
  - If `destination_type=auto`, infer repo vs bundle from the provided path.

### Step 3: Inventory the Requested Components
- Framework core components are read from `.writing-framework/`.
- Adapter components include:
  - `.claude/`
  - `.codex/`
  - `.copilot/`
  - `.windsurf/`
  - `.github/copilot-instructions.md`
- Protected local content is always excluded from overwrite:
  - `.writing-framework/guides/canon/`
  - `.writing-framework/guides/decision-records/`
  - `artifacts/`
  - `logs/`

### Step 4: Create Backup When Required
- For any non-dry-run import or repo export with `backup=true`, create a timestamped backup in `sync/backups/` before writing.
- If backup creation fails, halt before applying any changes.

### Step 5: Diff and Classify Items
- Compare source items against destination items.
- Classify each item as:
  - `identical`
  - `new`
  - `conflict`
  - `local-only`
- Record every evaluated item, even if skipped.

### Step 6: Apply Conflict Resolution
- `ask`: present conflicts for explicit user choice
- `prefer-local`: preserve current destination files on conflicts
- `prefer-source`: overwrite destination files except protected paths
- Never overwrite protected paths regardless of mode.

### Step 7: Execute the Transfer
- **Import**
  - Apply approved updates into the current repo.
- **Export to repo**
  - Apply approved updates into the receiving repo.
- **Export to bundle**
  - Copy approved items into a portable bundle and write `pack_manifest.json`.

### Step 8: Validate Post-Transfer State
- Verify written files exist where expected.
- Verify checksums for bundle exports.
- Verify the sync manifest records every evaluated item.
- For schema-bearing framework files, record validation warnings in the manifest if they do not parse cleanly.

### Step 9: Write the Sync Manifest
- Write `sync/sync_manifest.json` with:
  - operation
  - source or destination path
  - transport type (`repo` or `bundle`)
  - components
  - backup path (if any)
  - per-item status
  - counts for applied, skipped, conflicted, and protected items

### Step 10: Return the Result
- Return a concise summary:
  - what moved
  - what was skipped
  - whether any conflicts remain
  - recommended next step
- For meaningful framework updates, recommend `/session-start` in the updated repo.

## Decision Points and Autonomy Rules

### Type 1 Decisions (Infer and Proceed)
- Identical items are skipped.
- New items are applied by default unless they target a protected path.
- Export bundle mode is safe to proceed automatically once the destination directory is valid.

### Type 2 Decisions (Infer and Flag)
- Prefer-local or prefer-source resolutions are applied automatically when the user or orchestrator selected them.
- Missing optional adapter surfaces are skipped and noted in the manifest.
- Validation warnings are recorded but do not block unless integrity fails.

### Type 3 Decisions (Must Ask)
- Conflict resolution mode is `ask` and conflicts exist.
- A protected-path collision is detected.
- A bundle integrity check fails and the command is not dry-run.
- A repo export would overwrite a large number of destination files.

## Outputs
| Output | Type | Schema | Destination |
|--------|------|--------|-------------|
| sync_manifest.json | JSON object | sync_manifest | `sync/sync_manifest.json` |
| pack_manifest.json | JSON object | none | Bundle root (bundle exports only) |
| conflict summary | markdown | none | User-facing response when conflicts remain |

## Quality Gate

**Pass Criteria**
- `sync_manifest.json` exists and records every evaluated item
- Protected paths were preserved
- Bundle exports include `pack_manifest.json` with checksums
- Any requested backup exists before writes started

**Fail Criteria**
- A protected path was overwritten
- A write occurred before a requested backup was created
- Bundle integrity failed and the command still proceeded without approval
- Evaluated items are missing from the manifest

## Related Commands
- Primary commands: `/import-framework`, `/export-framework`
- Legacy compatibility commands: `/sync-framework`, `/import-pack`, `/export-pack`, `/import-principles`, `/export-principles`, `/sync-principles`, `/upgrade-framework`, `/install-framework`
- Adjacent commands: `/apply-style-pack`, `/apply-doctrine`, `/orchestrate-export`

## Related Agents
- import-export-orchestrator
- framework-sync-agent

## Cross-References
- `.writing-framework/commands/import-framework.md`
- `.writing-framework/commands/export-framework.md`
- `sync/sync-manifests/`
- `sync/export-packs/`
- `sync/backups/`
