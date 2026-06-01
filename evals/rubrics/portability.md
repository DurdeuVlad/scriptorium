# Portability Rubric

**Purpose:** Evaluate framework portability across doctrine, style packs, workflows, and conflict handling.

---

## Scoring Dimensions

### 1. Doctrine Portability (0-10 points)

**Definition:** Can doctrine files be exported and imported to a new project without loss or corruption?

**Scoring:**
- **10 points:** All doctrine files transfer perfectly, no issues
- **8 points:** All doctrine files transfer, minor formatting issues
- **6 points:** Most doctrine files transfer, some issues
- **4 points:** Many doctrine files transfer with issues
- **2 points:** Few doctrine files transfer successfully
- **0 points:** Doctrine transfer fails or corrupts files

**Evaluation criteria:**
- ✅ Export pack created with all doctrine files
- ✅ Export pack manifest lists all doctrine files with hashes
- ✅ Import succeeds without errors
- ✅ Imported doctrine files identical to source (hash match)
- ✅ Imported doctrine files usable in target project

**Common failures:**
- ❌ Export pack missing doctrine files
- ❌ Manifest missing file hashes
- ❌ Import fails with errors
- ❌ Imported files corrupted (hash mismatch)
- ❌ Imported files not usable (broken references)

**Measurement method:**
- Export doctrine pack from source project
- Import doctrine pack to new project
- Verify all files present and usable
- Calculate success rate: (successful transfers / total files) × 100%

---

### 2. Style Pack Portability (0-10 points)

**Definition:** Can style packs be exported and imported to a new project without loss or corruption?

**Scoring:**
- **10 points:** All style packs transfer perfectly, no issues
- **8 points:** All style packs transfer, minor issues
- **6 points:** Most style packs transfer, some issues
- **4 points:** Many style packs transfer with issues
- **2 points:** Few style packs transfer successfully
- **0 points:** Style pack transfer fails or corrupts files

**Evaluation criteria:**
- ✅ Export pack created with style pack + rubrics + anti-patterns
- ✅ Export pack manifest lists all related files
- ✅ Import succeeds without errors
- ✅ Imported style pack usable in target project
- ✅ Dependencies satisfied (or flagged if missing)

**Common failures:**
- ❌ Export pack missing rubrics or anti-patterns
- ❌ Manifest incomplete
- ❌ Import fails due to missing dependencies
- ❌ Imported style pack not usable
- ❌ Dependencies not flagged

**Measurement method:**
- Export style pack from source project
- Import to new project (with and without dependencies)
- Verify usability and dependency handling
- Calculate success rate

---

### 3. Workflow Portability (0-10 points)

**Definition:** Can workflows be exported and imported to a new project without loss or corruption?

**Scoring:**
- **10 points:** All workflows transfer perfectly, no issues
- **8 points:** All workflows transfer, minor issues
- **6 points:** Most workflows transfer, some issues
- **4 points:** Many workflows transfer with issues
- **2 points:** Few workflows transfer successfully
- **0 points:** Workflow transfer fails or corrupts files

**Evaluation criteria:**
- ✅ Export pack created with workflow + agent specs + schemas
- ✅ Export pack manifest lists all dependencies
- ✅ Import succeeds without errors
- ✅ Imported workflow usable in target project
- ✅ Agent specs and schemas transferred correctly

**Common failures:**
- ❌ Export pack missing agent specs or schemas
- ❌ Manifest missing dependencies
- ❌ Import fails due to broken references
- ❌ Imported workflow not executable
- ❌ Agent specs or schemas corrupted

**Measurement method:**
- Export workflow pack from source project
- Import to new project
- Verify workflow executable
- Calculate success rate

---

### 4. Conflict Handling (0-10 points)

**Definition:** Are conflicts detected and resolved correctly during import?

**Scoring:**
- **10 points:** All conflicts detected and resolved correctly
- **8 points:** All conflicts detected, minor resolution issues
- **6 points:** Most conflicts detected and resolved
- **4 points:** Many conflicts missed or mishandled
- **2 points:** Few conflicts detected or resolved
- **0 points:** Conflict handling fails entirely

**Evaluation criteria:**
- ✅ Content-diverged conflicts detected
- ✅ Local-override-exists conflicts detected
- ✅ Schema-incompatible conflicts detected
- ✅ Conflict report generated with resolution options
- ✅ User can choose resolution (prefer-local, prefer-source, merge)
- ✅ No silent overwrites (all changes documented)

**Common failures:**
- ❌ Conflict not detected (silent overwrite)
- ❌ Conflict detected but not reported
- ❌ Conflict report missing resolution options
- ❌ User cannot choose resolution
- ❌ Changes not documented in manifest

**Measurement method:**
- Inject known conflicts (content-diverged, local-override, schema-incompatible)
- Attempt import
- Verify conflicts detected and reported
- Calculate detection rate: (detected / total conflicts) × 100%

---

## Total Score

**Maximum:** 40 points

**Interpretation:**
- **36-40:** Excellent portability, production-ready
- **30-35:** Good portability, minor issues
- **24-29:** Acceptable portability, some limitations
- **18-23:** Weak portability, significant issues
- **12-17:** Poor portability, major rework needed
- **0-11:** Portability broken, not usable

---

## Scoring Worksheet

**Sync Operation:** _______________  
**Evaluator:** _______________  
**Date:** _______________

| Dimension | Score (0-10) | Success Rate | Notes |
|-----------|--------------|--------------|-------|
| Doctrine Portability | | ___% transferred | |
| Style Pack Portability | | ___% transferred | |
| Workflow Portability | | ___% transferred | |
| Conflict Handling | | ___% detected | |
| **Total** | **/40** | | |

**Overall Assessment:**

**Recommended Action:**
- [ ] Portability ready for production
- [ ] Portability acceptable with monitoring
- [ ] Improve portability before deployment
- [ ] Major portability rework required

---

## Cross-References

- `workflows/sync.md` — Sync workflow
- `sync/PORTABILITY_MODEL.md` — Portability model
- `schemas/export_pack.schema.json` — Export pack manifest
- `schemas/import_pack.schema.json` — Import pack manifest
- `schemas/conflict_report.schema.json` — Conflict report
