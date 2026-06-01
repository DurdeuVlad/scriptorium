# Sync README

The sync surface is now intentionally simple:

- Use `/import-framework` to pull framework updates into the current repo.
- Use `/export-framework` to publish the current repo's framework to another repo or to a portable bundle.

The older commands such as `/sync-framework`, `/import-pack`, `/export-pack`, `/import-principles`, `/export-principles`, and `/sync-principles` still exist as compatibility surfaces, but they are not the preferred entry points anymore.

## Directory Layout

```text
sync/
  export-packs/      portable framework bundles created by `/export-framework` in bundle mode
  import-packs/      legacy staging area for compatibility flows
  migration-rules/   upgrade-time migration rules for `/upgrade-framework`
  sync-manifests/    sync history and drift tracking
  backups/           pre-sync backups created before writes
```

## Recommended Flows

### Pull updates into this repo

Run:

```text
/import-framework source_path=/path/to/source-repo
```

or, for a portable bundle:

```text
/import-framework source_path=sync/export-packs/framework-export-20260331
```

### Publish updates from this repo

Write directly into another repo:

```text
/export-framework destination_type=repo destination_path=/path/to/target-repo
```

Create a portable bundle:

```text
/export-framework destination_type=bundle destination_path=sync/export-packs/
```

## Protected Paths

These paths must never be overwritten silently during sync:

- `.writing-framework/guides/canon/`
- `.writing-framework/guides/decision-records/`
- `artifacts/`
- `logs/`

## Legacy Compatibility Mapping

- `/sync-framework` -> `/import-framework` from repo source
- `/import-pack` -> `/import-framework` from bundle source
- `/export-pack` -> `/export-framework` in bundle mode
- `/import-principles` -> `/import-framework` with doctrine/style scope
- `/export-principles` -> `/export-framework` with doctrine/style scope
- `/sync-principles` -> `/import-framework` plus `/export-framework`
- `/upgrade-framework` -> `/import-framework` plus migration rules
