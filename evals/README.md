# Evaluations — Framework Testing and Validation

**Purpose:** Validate that orchestrated workflows outperform simpler baseline approaches across realistic writing tasks.

---

## Overview

This directory contains evaluation cases, scoring rubrics, and baseline comparisons to test the Editorial Orchestrator framework. Evaluations measure whether the multi-agent, gate-enforced, workflow-driven approach produces better outcomes than simpler single-prompt or single-agent flows.

---

## Evaluation Dimensions

### 1. Artifact Quality
Does the orchestrated approach produce higher-quality final artifacts?

**Measured by:**
- Completeness (all requirements met)
- Correctness (no factual errors, logical consistency)
- Clarity (readable, well-structured)
- Adherence to constraints (format, length, style)

### 2. Process Reliability
Does the orchestrated approach handle edge cases and blockers better?

**Measured by:**
- Blocker detection rate (% of blockers caught)
- Blocker resolution success (% resolved without human intervention)
- Gate effectiveness (% of quality issues caught at gates)
- Resume success rate (% of failed runs successfully resumed)

### 3. Portability and Reuse
Can framework components be reused across projects?

**Measured by:**
- Doctrine portability (can doctrine transfer to new project?)
- Style pack portability (can style packs transfer?)
- Workflow portability (can workflows transfer?)
- Conflict handling (are conflicts detected and resolved?)

### 4. QA Utility
Does the QA system catch real issues?

**Measured by:**
- Issue detection rate (% of real issues caught)
- False positive rate (% of flagged issues that aren't real)
- Severity accuracy (are critical issues marked critical?)
- Actionability (are findings specific enough to fix?)

---

## Evaluation Cases

### Case 1: Technical Documentation
**Domain:** Software documentation  
**Task:** Write API reference guide  
**Complexity:** Medium  
**File:** `evals/cases/case-01-technical-docs.md`  
**Status:** ✅ Implemented

### Case 2: Framework Portability
**Domain:** Framework portability  
**Task:** Export and import framework components  
**Complexity:** Medium  
**File:** `evals/cases/case-02-portability.md`  
**Status:** ✅ Implemented

### Future Cases (Planned)

Additional evaluation cases can be added as needed:

- **D&D Campaign Setting** — Creative worldbuilding (High complexity)
- **Internal Process Documentation** — Business documentation (Low complexity)
- **Card Game Mechanics** — Game design (High complexity)

---

## Baseline Comparisons

### Baseline A: Single-Prompt Approach
**Method:** Single comprehensive prompt to LLM  
**No:** Discovery, gates, QA, structured workflows  
**Represents:** Naive LLM usage

### Baseline B: Simple Chain Approach
**Method:** Brief → Outline → Draft (no gates, no QA)  
**No:** Discovery, blocker handling, quality gates, multi-perspective QA  
**Represents:** Basic sequential workflow

### Baseline C: Orchestrated Approach (Full Framework)
**Method:** Full Editorial Orchestrator pipeline  
**Includes:** Discovery, gates, QA, blocker handling, artifact generation, portability  
**Represents:** This framework

---

## Scoring Rubrics

### Artifact Quality Rubric
**File:** `evals/rubrics/artifact-quality.md`

**Dimensions:**
- Completeness (0-10): All requirements met
- Correctness (0-10): No errors, logical consistency
- Clarity (0-10): Readable, well-structured
- Constraint adherence (0-10): Format, length, style compliance

**Total:** 0-40 points

### Process Reliability Rubric
**File:** `evals/rubrics/process-reliability.md`

**Dimensions:**
- Blocker detection (0-10): % of blockers caught
- Blocker resolution (0-10): % resolved successfully
- Gate effectiveness (0-10): % of issues caught at gates
- Resume success (0-10): % of failed runs resumed

**Total:** 0-40 points

### Portability Rubric
**File:** `evals/rubrics/portability.md`

**Dimensions:**
- Doctrine portability (0-10): Can doctrine transfer?
- Style pack portability (0-10): Can style packs transfer?
- Workflow portability (0-10): Can workflows transfer?
- Conflict handling (0-10): Are conflicts detected/resolved?

**Total:** 0-40 points

### QA Utility Rubric
**File:** `evals/rubrics/qa-utility.md`

**Dimensions:**
- Issue detection (0-10): % of real issues caught
- False positive rate (0-10): Inverse of false positive %
- Severity accuracy (0-10): Critical issues marked critical
- Actionability (0-10): Findings specific enough to fix

**Total:** 0-40 points

---

## Running Evaluations

### Step 1: Select Evaluation Case
Choose case from `evals/cases/`

### Step 2: Run Baseline A (Single-Prompt)
Execute single-prompt approach, record results

### Step 3: Run Baseline B (Simple Chain)
Execute simple chain approach, record results

### Step 4: Run Baseline C (Orchestrated)
Execute full framework, record results

### Step 5: Score All Approaches
Apply rubrics to all three approaches

### Step 6: Compare Results
Generate comparison report in `evals/comparisons/`

---

## Evaluation Reports

### Comparison Report Format
**File:** `evals/comparisons/case-XX-comparison.md`

**Sections:**
1. Case summary
2. Baseline A results and scores
3. Baseline B results and scores
4. Baseline C results and scores
5. Comparative analysis
6. Conclusions

---

## Expected Outcomes

### Hypothesis 1: Artifact Quality
**Prediction:** Baseline C > Baseline B > Baseline A  
**Rationale:** Gates and QA catch quality issues

### Hypothesis 2: Process Reliability
**Prediction:** Baseline C >> Baseline B > Baseline A  
**Rationale:** Blocker handling and resume capability unique to C

### Hypothesis 3: Portability
**Prediction:** Baseline C >> Baseline B = Baseline A  
**Rationale:** Only C has portability infrastructure

### Hypothesis 4: QA Utility
**Prediction:** Baseline C >> Baseline B = Baseline A  
**Rationale:** Only C has multi-perspective QA system

---

## Cross-References

- `doctrine/EVALUATION_RUBRICS.md` — Phase-specific evaluation criteria
- `doctrine/QUALITY_GATES.md` — Gate definitions
- `workflows/qa.md` — QA workflow
- `QA_REPORT_PHASE*.md` — Phase QA reports
