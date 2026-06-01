# Evaluation Case 02: Framework Portability

**Domain:** Framework sync and portability  
**Task:** Export and import framework components across projects  
**Complexity:** Medium  
**Expected Duration:** 1-2 hours (orchestrated), N/A (baselines don't support)

---

## Case Description

Test the framework's ability to export doctrine, style packs, and workflows from a source project and import them into a target project. Verify conflict detection, resolution, and that imported components are usable.

---

## Requirements

### Objective
Validate that framework components can move across projects safely without data loss, corruption, or silent overwrites.

### Scope

**In scope:**
- Export doctrine pack (3 doctrine files)
- Export style pack (1 style guide + rubric + anti-patterns)
- Export workflow pack (1 workflow + agent spec + schema)
- Import all packs to new project
- Detect and resolve conflicts
- Verify imported components usable

**Out of scope:**
- Full framework export (selective packs only)
- Cross-version compatibility (same version only)
- Remote sync (local filesystem only)

### Success Criteria
1. All export packs created with correct manifests
2. All items in export packs have content hashes
3. Import detects all injected conflicts
4. Conflict resolution modes work correctly
5. Imported components usable in target project
6. No silent overwrites (all changes documented)

### Constraints
- Source and target projects on same machine
- Same framework version (Phase 10)
- Selective packs (not full framework)

---

## Injected Conflicts

To test conflict detection and resolution:

1. **content-diverged:** `doctrine/EDITORIAL_DOCTRINE.md` modified in both source and target
2. **local-override-exists:** Target has `style-packs/technical.md` with local override marker
3. **version-mismatch:** Source workflow v1.2, target has v1.1
4. **dependency-conflict:** Source workflow requires schema not present in target

---

## Test Scenarios

### Scenario 1: Clean Import (No Conflicts)
**Setup:** Target project empty (no existing files)  
**Expected:** All packs import successfully, no conflicts

**Steps:**
1. Export doctrine pack from source
2. Export style pack from source
3. Export workflow pack from source
4. Import all packs to empty target
5. Verify all files present and usable

**Success criteria:**
- All export packs created
- All imports succeed
- No conflicts detected
- Imported files identical to source (hash match)

### Scenario 2: Conflict Detection
**Setup:** Target project has conflicting files  
**Expected:** All conflicts detected and reported

**Steps:**
1. Export doctrine pack from source
2. Modify `EDITORIAL_DOCTRINE.md` in target (create content-diverged conflict)
3. Add override marker to `technical.md` in target
4. Import doctrine pack with conflict_resolution_mode='ask'
5. Verify conflicts detected

**Success criteria:**
- content-diverged conflict detected
- local-override-exists conflict detected
- Conflict report generated
- Import paused for user resolution

### Scenario 3: Conflict Resolution (prefer-local)
**Setup:** Target has conflicts, mode='prefer-local'  
**Expected:** Local versions preserved, source skipped

**Steps:**
1. Export doctrine pack from source
2. Create conflicts in target
3. Import with conflict_resolution_mode='prefer-local'
4. Verify local files unchanged

**Success criteria:**
- Import completes
- Local files unchanged (hash match before/after)
- Skipped items logged in manifest
- No silent overwrites

### Scenario 4: Conflict Resolution (prefer-source)
**Setup:** Target has conflicts, mode='prefer-source'  
**Expected:** Source versions applied, local overwritten (with warning)

**Steps:**
1. Export doctrine pack from source
2. Create conflicts in target
3. Import with conflict_resolution_mode='prefer-source'
4. Verify source files applied

**Success criteria:**
- Import completes
- Source files applied (hash match source)
- Overwrites logged with warnings
- Backup created before overwrite

### Scenario 5: Selective Import
**Setup:** Export pack has 5 items, import only 2  
**Expected:** Only selected items imported, dependencies auto-included

**Steps:**
1. Export workflow pack (workflow + agent + schema + 2 doctrine files)
2. Import only workflow (selective)
3. Verify dependencies auto-included

**Success criteria:**
- Only selected item imported
- Dependencies auto-included (agent, schema)
- Dependency inclusion flagged in manifest
- No broken references

---

## Expected Baseline Outcomes

### Baseline A: Single-Prompt
**Prediction:**
- Artifact quality: N/A (no artifact)
- Process reliability: N/A (no process)
- Portability: 0/40 (no portability features)
- QA utility: N/A (no QA)

**Behavior:**
- Cannot export/import (no portability infrastructure)
- Manual copy-paste only
- No conflict detection
- No manifest generation

### Baseline B: Simple Chain
**Prediction:**
- Artifact quality: N/A (no artifact)
- Process reliability: N/A (no process)
- Portability: 0/40 (no portability features)
- QA utility: N/A (no QA)

**Behavior:**
- Cannot export/import (no portability infrastructure)
- Manual copy-paste only
- No conflict detection
- No manifest generation

### Baseline C: Orchestrated
**Prediction:**
- Artifact quality: N/A (no artifact, but portability works)
- Process reliability: 35-40/40 (sync workflow reliable)
- Portability: 38-40/40 (all scenarios pass)
- QA utility: N/A (no QA for sync)

**Expected behavior:**
- Scenario 1: All packs import successfully
- Scenario 2: All 4 conflicts detected
- Scenario 3: Local files preserved, no overwrites
- Scenario 4: Source files applied, backups created
- Scenario 5: Dependencies auto-included

---

## Evaluation Metrics

### Portability (Primary Focus)
- **Doctrine portability:** 3 doctrine files exported and imported?
- **Style pack portability:** Style guide + rubric + anti-patterns transferred?
- **Workflow portability:** Workflow + agent + schema transferred?
- **Conflict handling:** 4 conflicts detected? Resolution modes work?

### Process Reliability (Secondary Focus)
- **Blocker detection:** Dependency conflicts detected?
- **Gate effectiveness:** Sync Gate catches issues?
- **Resume success:** Can resume after conflict resolution?

---

## Source Materials

### Source Project Structure
```
.writing-framework/
  doctrine/
    EDITORIAL_DOCTRINE.md (v1.0, hash: abc123)
    QUALITY_GATES.md (v1.0, hash: def456)
    EVALUATION_RUBRICS.md (v1.0, hash: ghi789)
  style-packs/
    technical.md (v1.0, hash: jkl012)
    rubrics/technical-rubric.md (v1.0, hash: mno345)
    anti-patterns/technical-anti.md (v1.0, hash: pqr678)
  workflows/
    qa.md (v1.2, hash: stu901)
  agents/
    adversarial-reviewer.md (v1.0, hash: vwx234)
  schemas/
    review_report.schema.json (v1.0, hash: yz567)
```

### Target Project Structure (Scenario 2)
```
.writing-framework/
  doctrine/
    EDITORIAL_DOCTRINE.md (v1.0, hash: DIFFERENT - content-diverged)
  style-packs/
    technical.md (v1.0, hash: jkl012, has override marker - local-override-exists)
  workflows/
    qa.md (v1.1, hash: DIFFERENT - version-mismatch)
```

---

## Success Indicators

**Baseline A/B succeed if:**
- N/A (no portability support)

**Baseline C succeeds if:**
- All 5 scenarios pass
- All conflicts detected (4/4)
- All resolution modes work correctly
- No silent overwrites
- Imported components usable
- Portability score: 38-40/40

---

## Cross-References

- `evals/rubrics/portability.md` — Scoring rubric
- `workflows/sync.md` — Sync workflow
- `sync/PORTABILITY_MODEL.md` — Portability model
- `schemas/export_pack.schema.json` — Export pack manifest
- `schemas/import_pack.schema.json` — Import pack manifest
- `schemas/conflict_report.schema.json` — Conflict report
