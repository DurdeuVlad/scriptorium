# QA Utility Rubric

**Purpose:** Evaluate QA system utility across issue detection, false positives, severity accuracy, and actionability.

---

## Scoring Dimensions

### 1. Issue Detection (0-10 points)

**Definition:** Percentage of real quality issues detected by QA perspectives.

**Scoring:**
- **10 points:** 95-100% of real issues detected
- **8 points:** 85-94% of real issues detected
- **6 points:** 75-84% of real issues detected
- **4 points:** 65-74% of real issues detected
- **2 points:** 50-64% of real issues detected
- **0 points:** <50% of real issues detected

**Evaluation criteria:**
- ✅ Reader perspective catches assumed knowledge issues
- ✅ Skeptic perspective catches unsupported claims
- ✅ Domain perspective catches technical errors
- ✅ Style perspective catches style violations
- ✅ Coherence perspective catches logical gaps
- ✅ AI-stink perspective catches generic phrasing

**Common failures:**
- ❌ Assumed knowledge not flagged by reader perspective
- ❌ Unsupported claim not flagged by skeptic perspective
- ❌ Technical error not flagged by domain perspective
- ❌ Style violation not flagged by style perspective
- ❌ Logical gap not flagged by coherence perspective
- ❌ Generic phrasing not flagged by AI-stink perspective

**Measurement method:**
- Inject known quality issues into draft
- Run all QA perspectives
- Count how many issues are detected
- Calculate detection rate: (detected / total issues) × 100%

---

### 2. False Positive Rate (0-10 points)

**Definition:** Inverse of percentage of flagged issues that aren't real issues.

**Scoring:**
- **10 points:** 0-5% false positive rate (95-100% precision)
- **8 points:** 6-15% false positive rate (85-94% precision)
- **6 points:** 16-25% false positive rate (75-84% precision)
- **4 points:** 26-35% false positive rate (65-74% precision)
- **2 points:** 36-50% false positive rate (50-64% precision)
- **0 points:** >50% false positive rate (<50% precision)

**Evaluation criteria:**
- ✅ Flagged issues are real issues (not false alarms)
- ✅ Severity matches actual severity (critical is critical)
- ✅ Location is accurate (not vague)
- ✅ Issue description is specific (not generic)

**Common failures:**
- ❌ Issue flagged that isn't actually an issue
- ❌ Minor issue flagged as critical
- ❌ Location vague or incorrect
- ❌ Issue description too generic to understand

**Measurement method:**
- Review all flagged issues
- Classify as real issue or false positive
- Calculate false positive rate: (false positives / total flagged) × 100%
- Score = 10 × (1 - false_positive_rate)

---

### 3. Severity Accuracy (0-10 points)

**Definition:** Percentage of issues assigned correct severity (critical, major, minor).

**Scoring:**
- **10 points:** 95-100% of severities correct
- **8 points:** 85-94% of severities correct
- **6 points:** 75-84% of severities correct
- **4 points:** 65-74% of severities correct
- **2 points:** 50-64% of severities correct
- **0 points:** <50% of severities correct

**Evaluation criteria:**
- ✅ Critical issues marked critical (blocks publication)
- ✅ Major issues marked major (should fix before publication)
- ✅ Minor issues marked minor (nice to fix)
- ✅ Severity consistent across perspectives

**Severity definitions:**
- **Critical:** Factual error, logical contradiction, missing required content
- **Major:** Unclear explanation, weak support, style violation
- **Minor:** Typo, awkward phrasing, minor formatting issue

**Common failures:**
- ❌ Factual error marked as minor
- ❌ Typo marked as critical
- ❌ Same issue marked critical by one perspective, minor by another
- ❌ Severity not specified

**Measurement method:**
- Review all flagged issues
- Determine correct severity
- Count how many match assigned severity
- Calculate accuracy: (correct / total issues) × 100%

---

### 4. Actionability (0-10 points)

**Definition:** Percentage of findings specific enough to fix without guessing.

**Scoring:**
- **10 points:** 95-100% of findings actionable
- **8 points:** 85-94% of findings actionable
- **6 points:** 75-84% of findings actionable
- **4 points:** 65-74% of findings actionable
- **2 points:** 50-64% of findings actionable
- **0 points:** <50% of findings actionable

**Evaluation criteria:**
- ✅ Location specified (line number, section, paragraph)
- ✅ Issue clearly described (what's wrong)
- ✅ Suggested fix provided (how to fix)
- ✅ Example provided (if applicable)

**Actionable finding example:**
```
Perspective: qa-reader
Severity: critical
Location: Section 3, paragraph 2, line 45
Issue: Assumed knowledge - "Docker containers" used without explanation
Suggested fix: Add brief explanation: "Docker containers (isolated application environments)"
```

**Non-actionable finding example:**
```
Perspective: qa-reader
Severity: major
Location: Section 3
Issue: Some concepts unclear
Suggested fix: Improve clarity
```

**Common failures:**
- ❌ Location vague ("somewhere in section 3")
- ❌ Issue description generic ("unclear")
- ❌ No suggested fix
- ❌ No example when needed

**Measurement method:**
- Review all findings
- Classify as actionable or non-actionable
- Calculate actionability: (actionable / total findings) × 100%

---

## Total Score

**Maximum:** 40 points

**Interpretation:**
- **36-40:** Excellent QA utility, highly valuable
- **30-35:** Good QA utility, useful
- **24-29:** Acceptable QA utility, some value
- **18-23:** Weak QA utility, limited value
- **12-17:** Poor QA utility, not very useful
- **0-11:** QA system not useful, needs rework

---

## Scoring Worksheet

**QA Run:** _______________  
**Evaluator:** _______________  
**Date:** _______________

| Dimension | Score (0-10) | Rate | Notes |
|-----------|--------------|------|-------|
| Issue Detection | | ___% detected | |
| False Positive Rate | | ___% false positives | |
| Severity Accuracy | | ___% correct | |
| Actionability | | ___% actionable | |
| **Total** | **/40** | | |

**Overall Assessment:**

**Recommended Action:**
- [ ] QA system ready for production
- [ ] QA system acceptable with tuning
- [ ] Improve QA system before deployment
- [ ] Major QA system rework required

---

## Cross-References

- `workflows/qa.md` — QA workflow
- `doctrine/EVALUATION_RUBRICS.md` — Phase-specific rubrics
- `agents/adversarial-reviewer.md` — Adversarial reviewer agent
