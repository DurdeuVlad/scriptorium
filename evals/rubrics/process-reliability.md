# Process Reliability Rubric

**Purpose:** Evaluate workflow reliability across blocker detection, resolution, gate effectiveness, and resume capability.

---

## Scoring Dimensions

### 1. Blocker Detection (0-10 points)

**Definition:** Percentage of actual blockers detected by the workflow.

**Scoring:**
- **10 points:** 95-100% of blockers detected
- **8 points:** 85-94% of blockers detected
- **6 points:** 75-84% of blockers detected
- **4 points:** 65-74% of blockers detected
- **2 points:** 50-64% of blockers detected
- **0 points:** <50% of blockers detected

**Evaluation criteria:**
- ✅ Missing source material detected (B4-missing-source)
- ✅ Ambiguous requirements detected (B1-missing-user-decision)
- ✅ Dependency failures detected (B5-failed-toolchain)
- ✅ Validation failures detected (B9-validation-failure)
- ✅ Blockers classified correctly (B1-B9 taxonomy)

**Common failures:**
- ❌ Missing source material not detected until drafting
- ❌ Ambiguous requirement not flagged in discovery
- ❌ Dependency failure not caught until export
- ❌ Validation issue not detected until finalization
- ❌ Blocker misclassified (e.g., B1 marked as B9)

**Measurement method:**
- Inject known blockers into evaluation case
- Count how many are detected by workflow
- Calculate detection rate: (detected / total) × 100%

---

### 2. Blocker Resolution (0-10 points)

**Definition:** Percentage of detected blockers successfully resolved without human intervention.

**Scoring:**
- **10 points:** 90-100% of blockers auto-resolved
- **8 points:** 75-89% of blockers auto-resolved
- **6 points:** 60-74% of blockers auto-resolved
- **4 points:** 45-59% of blockers auto-resolved
- **2 points:** 30-44% of blockers auto-resolved
- **0 points:** <30% of blockers auto-resolved

**Evaluation criteria:**
- ✅ Type 1 decisions inferred correctly (no user ask needed)
- ✅ Type 2 decisions flagged with reasonable default
- ✅ Partial completion enabled (work continues despite blocker)
- ✅ Resume points created for blocked work
- ✅ Fallback options offered (e.g., markdown instead of PDF)

**Common failures:**
- ❌ Type 1 decision escalated to user unnecessarily
- ❌ Type 2 decision not flagged, silent assumption made
- ❌ Workflow halts entirely on single blocker
- ❌ No resume point created, must restart from beginning
- ❌ No fallback offered when dependency missing

**Measurement method:**
- Count blockers that require human intervention
- Calculate auto-resolution rate: (auto-resolved / detected) × 100%

---

### 3. Gate Effectiveness (0-10 points)

**Definition:** Percentage of quality issues caught at quality gates before advancing.

**Scoring:**
- **10 points:** 95-100% of issues caught at gates
- **8 points:** 85-94% of issues caught at gates
- **6 points:** 75-84% of issues caught at gates
- **4 points:** 65-74% of issues caught at gates
- **2 points:** 50-64% of issues caught at gates
- **0 points:** <50% of issues caught at gates

**Evaluation criteria:**
- ✅ Discovery Gate catches incomplete discovery
- ✅ Brief Gate catches vague audience/scope
- ✅ Outline Gate catches overlapping sections
- ✅ Draft Gate catches placeholder content
- ✅ QA Gate catches critical findings
- ✅ Artifact Gate catches validation failures

**Common failures:**
- ❌ Incomplete discovery passes Discovery Gate
- ❌ Vague brief passes Brief Gate
- ❌ Overlapping sections pass Outline Gate
- ❌ Placeholder content passes Draft Gate
- ❌ Critical findings pass QA Gate
- ❌ Invalid artifact passes Artifact Gate

**Measurement method:**
- Inject known quality issues into evaluation case
- Count how many are caught at gates (vs. later)
- Calculate gate effectiveness: (caught at gate / total issues) × 100%

---

### 4. Resume Success (0-10 points)

**Definition:** Percentage of failed workflow runs successfully resumed from checkpoint.

**Scoring:**
- **10 points:** 95-100% of failures resumable
- **8 points:** 85-94% of failures resumable
- **6 points:** 75-84% of failures resumable
- **4 points:** 65-74% of failures resumable
- **2 points:** 50-64% of failures resumable
- **0 points:** <50% of failures resumable

**Evaluation criteria:**
- ✅ Resume point created before failure
- ✅ Partial work preserved (not discarded)
- ✅ Resume command successfully continues work
- ✅ No duplicate work (completed steps skipped)
- ✅ State correctly restored (inputs, context)

**Common failures:**
- ❌ No resume point created, cannot resume
- ❌ Partial work discarded on failure
- ❌ Resume command fails or restarts from beginning
- ❌ Completed work repeated on resume
- ❌ State not restored, resume fails

**Measurement method:**
- Inject failures at various workflow points
- Attempt resume from each failure
- Calculate resume success: (successful resumes / failures) × 100%

---

## Total Score

**Maximum:** 40 points

**Interpretation:**
- **36-40:** Excellent reliability, production-ready
- **30-35:** Good reliability, minor improvements needed
- **24-29:** Acceptable reliability, some issues
- **18-23:** Weak reliability, significant improvements needed
- **12-17:** Poor reliability, major rework required
- **0-11:** Unreliable, not production-ready

---

## Scoring Worksheet

**Workflow:** _______________  
**Evaluator:** _______________  
**Date:** _______________

| Dimension | Score (0-10) | Detection/Resolution Rate | Notes |
|-----------|--------------|---------------------------|-------|
| Blocker Detection | | ___% detected | |
| Blocker Resolution | | ___% auto-resolved | |
| Gate Effectiveness | | ___% caught at gates | |
| Resume Success | | ___% resumable | |
| **Total** | **/40** | | |

**Overall Assessment:**

**Recommended Action:**
- [ ] Deploy to production
- [ ] Deploy with monitoring
- [ ] Improve reliability before deployment
- [ ] Major rework required

---

## Cross-References

- `doctrine/BLOCKER_CLASSIFICATION.md` — B1-B9 blocker taxonomy
- `doctrine/QUALITY_GATES.md` — Gate definitions
- `doctrine/PARTIAL_COMPLETION.md` — Partial completion protocol
- `mcp/cache-server/RESUME_PROTOCOL.md` — Resume point creation
