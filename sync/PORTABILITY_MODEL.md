# Portability Model — Sync System

**Status:** Canonical. Defines portability model, pack structure, and conflict handling for framework sync operations.
**Phase:** 8
**Related:** workflows/sync.md, schemas/export_pack.schema.json, schemas/import_pack.schema.json

---

## Purpose

Define the portability model for Editorial Orchestrator framework content. This document specifies how doctrine, style packs, workflows, commands, and guides can be safely exported, imported, and synchronized across repositories while preserving local customizations and preventing silent overwrites.

---

## Core Principles

### 1. Filesystem is Source of Truth

The filesystem (`.writing-framework/` directory structure) is the authoritative source for all framework content. Derived artifacts (guide-server database, export packs, sync manifests) are rebuilt from filesystem content.

**Implications:**
- Guide-server can be completely rebuilt from `guides/` at any time
- Export packs are snapshots, not live sources
- Imported content becomes part of filesystem and subject to framework consistency rules
- Agents write to filesystem first, then sync to derived layers

### 2. Never Silently Overwrite

No file is overwritten without explicit user approval or clear conflict resolution mode. Every change is documented in sync manifest.

**Implications:**
- Conflicts always flagged, never auto-resolved in 'ask' mode
- Local overrides preserved unless user explicitly chooses to overwrite
- Both local and source versions preserved during conflict resolution
- Sync manifest records every decision (applied, skipped, conflict)

### 3. Preserve Provenance

Every imported item retains metadata about its source, version, and import date. Export packs include provenance information.

**Implications:**
- Import manifests record source pack ID, import date, transformations applied
- Export manifests record framework version, source repo, creation date
- Sync manifests record local and source version hashes for every item
- Provenance enables tracing content back to original source

---

## Pack Structure

### Export Pack Directory Structure

```
sync/export-packs/[pack-name]/
  pack-manifest.json          ← Export pack manifest (schemas/export_pack.schema.json)
  doctrine/                   ← Doctrine files (if included in pack)
    EDITORIAL_DOCTRINE.md
    AUTONOMOUS_EXECUTION.md
  styles/                     ← Style packs (if included)
    technical-writing.md
  workflows/                  ← Workflows (if included)
    brief.md
    outline.md
  agents/                     ← Agent specs (if included)
    brief-writer.md
  commands/                   ← Command specs (if included)
    write-brief.md
  schemas/                    ← Schemas (if included)
    brief.schema.json
  README.md                   ← Pack description and usage instructions
```

### Import Pack Directory Structure

```
sync/import-packs/[pack-name]/
  pack-manifest.json          ← Original export pack manifest
  import-manifest.json        ← Import operation manifest (schemas/import_pack.schema.json)
  [same directory structure as export pack]
```

### Pack Manifest Fields

**Export Pack Manifest:**
- `pack_id`: Unique identifier (format: `pack_[type]_[timestamp]`)
- `pack_type`: style-pack, doctrine-pack, workflow-pack, command-pack, full-framework
- `pack_version`: Semantic version (e.g., 1.0.0)
- `framework_version`: Framework version pack was exported from (e.g., Phase 8)
- `items`: Array of all included items with content_hash, source_path, last_modified
- `dependencies`: Required packs or framework components
- `selective_import_supported`: Whether pack supports selective import (true/false)
- `checksum`: Overall pack checksum for integrity verification

**Import Pack Manifest:**
- `import_id`: Unique identifier for import operation
- `pack_id`: ID of pack being imported
- `import_status`: pending, in-progress, completed, completed-with-conflicts, failed
- `import_mode`: full, selective, merge
- `items`: Per-item import status (imported, skipped, conflict, transformed, failed)
- `conflicts`: Unresolved conflicts requiring manual resolution
- `compatibility_check`: Framework version compatibility, dependencies satisfied, schema compatible

---

## Pack Types

### Style Pack

**Contents:**
- Style guide markdown files (`styles/`)
- Related rubrics (`guides/rubrics/`)
- Anti-pattern records (`guides/anti-patterns/`)
- Example records (`guides/examples/`)

**Use case:** Sharing style guidance across projects or teams

**Selective import:** Supported (can import individual style guides)

### Doctrine Pack

**Contents:**
- Doctrine files (`doctrine/`)
- Principle files (`principles/`)
- Quality gate definitions

**Use case:** Establishing editorial standards in new project

**Selective import:** Not recommended (doctrine files interdependent)

### Workflow Pack

**Contents:**
- Workflow files (`workflows/`)
- Related agent specs (`agents/`)
- Schemas referenced by workflows (`schemas/`)

**Use case:** Sharing editorial pipeline across projects

**Selective import:** Supported with dependency warnings

### Command Pack

**Contents:**
- Command specs (`commands/`)
- Related agent specs (`agents/`)

**Use case:** Extending framework with custom commands

**Selective import:** Supported

### Full Framework

**Contents:**
- All doctrine, styles, workflows, agents, commands, schemas
- Complete `.writing-framework/` directory

**Use case:** Initializing new framework instance, backup, archival

**Selective import:** Not supported (import entire framework or use specific pack types)

---

## Conflict Detection

### Conflict Types

**content-diverged:**
- Both local and source versions exist
- Both have changed from common ancestor
- Content hashes differ
- Cannot determine which is newer based on timestamp alone

**local-override-exists:**
- Local file has explicit override marker (e.g., `# LOCAL_OVERRIDE: true` in frontmatter)
- Source has updates
- Local customization may need updating to remain valid

**schema-incompatible:**
- Source uses different schema version than local
- Structured data (JSON) cannot be directly imported
- Transformation or migration required

**dependency-conflict:**
- Source requires dependencies not available locally
- Example: workflow requires agent spec not present locally
- Blocking conflict (cannot import until dependency resolved)

**version-mismatch:**
- Source framework version incompatible with local framework version
- Example: Phase 6 pack imported into Phase 8 framework
- May require migration or transformation

### Conflict Severity

**blocking:**
- Must resolve before import can proceed
- Examples: dependency-conflict, schema-incompatible (no transformation available)
- Import operation pauses, presents conflict_report to user

**warning:**
- Should resolve but import can proceed
- Examples: version-mismatch (minor version), local-override-exists
- Import proceeds, flags in manifest for review

**info:**
- Informational only, no action required
- Examples: local-newer with prefer-local mode
- Logged in manifest, no user intervention needed

---

## Conflict Resolution Modes

### ask (default)

**Behavior:**
- Present every conflict to user for decision
- Generate pending_changes list with all conflicts
- Wait for user approval before applying any changes
- No auto-resolution

**Use when:**
- Importing into production environment
- Local customizations exist
- Unsure of source content quality

### prefer-local

**Behavior:**
- Keep local version for all conflicts
- Mark source version as skipped
- Log resolution in conflict_report
- Auto-resolve all conflicts in favor of local

**Use when:**
- Local customizations are authoritative
- Source is reference only
- Importing for comparison, not replacement

### prefer-source

**Behavior:**
- Accept source version for all conflicts
- Overwrite local version
- **Warning:** Log that local customization was overwritten
- Auto-resolve all conflicts in favor of source

**Use when:**
- Source is authoritative (e.g., framework update)
- Local has no customizations
- Fresh install or reset to canonical state

**Danger:** Can overwrite local work. Use with caution.

### merge

**Behavior:**
- Attempt three-way merge if common ancestor exists
- Use common ancestor to identify conflicting changes
- Auto-merge non-conflicting changes
- Escalate to 'ask' mode if merge fails

**Use when:**
- Both local and source have valuable changes
- Common ancestor available in sync history
- Willing to manually resolve merge conflicts

---

## Selective Pack Support

### Selective Import

**User specifies subset of items to import:**
```json
{
  "import_mode": "selective",
  "selected_items": [
    "doctrine/EDITORIAL_DOCTRINE.md",
    "styles/technical-writing.md",
    "workflows/brief.md"
  ]
}
```

**Behavior:**
- Only selected items classified and processed
- Unselected items marked as 'skipped' in import manifest
- Dependencies of selected items automatically included (with warning)
- Example: Importing `workflows/brief.md` auto-includes `agents/brief-writer.md` if referenced

**Dependency handling:**
- Scan selected items for references to other framework items
- If dependency not present locally, include in import (flag as auto-included)
- If dependency present locally but version differs, flag as potential conflict

### Selective Export

**User specifies subset of items to export:**
```json
{
  "export_scope": ["doctrine", "styles/technical-writing.md"]
}
```

**Behavior:**
- Only selected items included in export pack
- Pack manifest indicates `selective_import_supported: true`
- Dependencies listed in manifest for reference (not included in pack)
- README.md includes dependency requirements

---

## Compatibility Notes

### Framework Version Compatibility

**Compatibility note format:**
```
Framework version: Phase 8
Compatible with: Phase 7+
Breaking changes: None
Manual steps: Run /sync-guides to register imported style packs in guide-server
Dependencies: guide-server MCP (required), artifact-server MCP (optional)
```

**Version compatibility rules:**
- Same phase: Fully compatible
- One phase difference: Compatible with warnings
- Two+ phases difference: May require migration
- Breaking changes: Documented in compatibility notes

### Schema Compatibility

**Schema version tracking:**
- Each schema has version field (e.g., `"version": "1.0.0"`)
- Import checks schema version compatibility
- If incompatible, attempts transformation using migration rules
- If transformation unavailable, flags as blocking conflict

**Migration rules:**
- Stored in `sync/migration-rules/`
- Define field mappings and transformations
- Applied automatically during import if available
- Example: `brief-v1-to-v2.yaml` transforms brief schema from v1 to v2

---

## Sync Manifest Audit Trail

### Manifest Naming Convention

```
sync/sync-manifests/sync-manifest-[YYYY-MM-DD-HHMMSS].json
```

Example: `sync-manifest-2026-03-29-004100.json`

### Manifest Contents

**Every sync manifest records:**
- Operation ID and timestamp
- Sync direction (import/export/bidirectional)
- Source and target
- Scope (what was synced)
- Conflict resolution mode used
- Per-item status (applied, skipped, conflict, new, identical)
- Counts (applied, skipped, conflict)
- Compatibility notes
- Unresolved conflicts (if any)

**Audit trail enables:**
- Tracing when item was imported/exported
- Understanding why conflict occurred
- Rolling back to previous state
- Debugging sync issues

---

## Safety Guarantees

### 1. No Silent Overwrites

**Guarantee:** No file overwritten without user approval or explicit conflict resolution mode.

**Enforcement:**
- 'ask' mode (default) requires user approval for every conflict
- 'prefer-source' mode logs warning for every overwrite
- Sync manifest records every change (applied, skipped, conflict)
- Conflict report generated for all unresolved conflicts

### 2. Atomic Operations

**Guarantee:** Each item import/export is atomic (all or nothing).

**Enforcement:**
- Write to temporary file first
- Verify content hash matches expected
- Rename to final path only if validation passes
- If validation fails, rollback (delete temp file, restore backup if exists)

### 3. Rollback Capability

**Guarantee:** Failed imports can be rolled back to previous state.

**Enforcement:**
- Backup created before overwriting existing file
- Backup stored in `sync/.backups/[operation_id]/`
- If import fails, restore from backup
- Backups retained until next successful sync

### 4. Provenance Preservation

**Guarantee:** Every imported item retains source metadata.

**Enforcement:**
- Import manifest records pack_id, import_date, source_version_hash
- Imported files can include provenance comment (optional)
- Sync history enables tracing item back to source pack

---

## Cross-References

- `workflows/sync.md` — sync workflow execution steps
- `schemas/sync_manifest.schema.json` — sync manifest format
- `schemas/export_pack.schema.json` — export pack manifest format
- `schemas/import_pack.schema.json` — import pack manifest format
- `schemas/conflict_report.schema.json` — conflict report format
- `sync/README.md` — sync system overview
- `doctrine/AUTONOMOUS_EXECUTION.md` — Type 1/2/3 decision rules
