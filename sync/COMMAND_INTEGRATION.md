# Sync Command Integration

This document describes the active sync command model for the framework.

## Primary Commands

### `/import-framework`

Use `/import-framework` when you want to bring framework updates into the current repo.

Supported source shapes:
- another framework repo
- a portable bundle created by `/export-framework`

Typical repo import:

```text
/import-framework source_path=/path/to/canonical-framework conflict_resolution_mode=ask
```

Typical bundle import:

```text
/import-framework source_path=sync/export-packs/framework-export-20260331 conflict_resolution_mode=prefer-local
```

### `/export-framework`

Use `/export-framework` when you want to publish this repo's framework elsewhere.

Supported destination shapes:
- another repo
- a portable bundle

Typical repo export:

```text
/export-framework destination_type=repo destination_path=/path/to/target-repo conflict_resolution_mode=ask
```

Typical bundle export:

```text
/export-framework destination_type=bundle destination_path=sync/export-packs/ pack_name=framework-export-20260331
```

## Component Scope

Both primary commands accept component selection. The default scope is the full framework plus adapters:

- doctrine
- styles
- commands
- agents
- workflows
- schemas
- templates
- guides
- adapters

## Bundle Structure

Portable bundles created by `/export-framework` in bundle mode live under `sync/export-packs/[pack-name]/`.

Expected contents:

```text
sync/export-packs/[pack-name]/
  pack_manifest.json
  .writing-framework/
  .claude/
  .codex/
  .copilot/
  .windsurf/
  .github/
```

## Compatibility Commands

These older commands still work, but they translate to the new primary model:

- `/sync-framework` -> `/import-framework`
- `/import-pack` -> `/import-framework`
- `/export-pack` -> `/export-framework`
- `/import-principles` -> `/import-framework`
- `/export-principles` -> `/export-framework`
- `/sync-principles` -> `/import-framework` plus `/export-framework`
- `/upgrade-framework` -> `/import-framework` plus migration rules

## Conflict Rules

- `ask`: require user review for conflicts
- `prefer-local`: keep the destination version on conflict
- `prefer-source`: apply the incoming version on conflict

These paths are always protected:

- `.writing-framework/guides/canon/`
- `.writing-framework/guides/decision-records/`
- `artifacts/`
- `logs/`

## Output Contracts

Every sync run writes `sync/sync_manifest.json`.

Bundle exports also write `pack_manifest.json`.

Each manifest must record:
- source or destination path
- transport type (`repo` or `bundle`)
- components in scope
- every evaluated item
- applied, skipped, conflicted, and protected counts
