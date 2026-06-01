# Baseline Comparison Methodology

**Purpose:** Define fair comparison methodology for evaluating orchestrated approach against simpler baselines.

---

## Baseline Definitions

### Baseline A: Single-Prompt Approach

**Description:** Single comprehensive prompt to LLM requesting final output.

**Method:**
1. Craft single prompt with all requirements
2. Send to LLM (e.g., Claude, GPT-4)
3. Receive output
4. No iteration, no gates, no QA

**Example prompt:**
```
Write an API reference guide for a task tracking REST API. Include:
- All endpoints (auth, tasks CRUD)
- Request/response formats
- Error codes
- Authentication flow
- Example requests and responses

Audience: Software developers
Format: Markdown
Length: 2000-3000 words
```

**Characteristics:**
- **Simplest approach:** Minimal overhead
- **No structure:** No discovery, brief, outline phases
- **No gates:** No quality checks before output
- **No QA:** No multi-perspective review
- **No blocker handling:** Assumes all info available
- **No portability:** Output is standalone artifact

**Strengths:**
- Fast (single request)
- Simple (no framework needed)
- Low overhead

**Weaknesses:**
- No blocker detection
- No quality gates
- No structured QA
- Generic output
- No resume capability
- No portability

---

### Baseline B: Simple Chain Approach

**Description:** Sequential brief → outline → draft flow without gates or QA.

**Method:**
1. Generate brief from requirements
2. Generate outline from brief
3. Generate draft from outline
4. No gates between phases
5. No QA review
6. No blocker handling

**Example flow:**
```
Step 1: Generate brief
  Input: User requirements
  Output: brief.json
  No gate check

Step 2: Generate outline
  Input: brief.json
  Output: outline.json
  No gate check

Step 3: Generate draft
  Input: outline.json
  Output: draft.md
  No validation
```

**Characteristics:**
- **Basic structure:** Brief → Outline → Draft
- **No gates:** Phases advance without quality checks
- **No QA:** No adversarial review
- **No blocker handling:** Assumes all info available
- **No portability:** Output is standalone artifact

**Strengths:**
- Some structure (better than single-prompt)
- Separates planning from execution
- Moderate overhead

**Weaknesses:**
- No gate enforcement (bad brief → bad outline → bad draft)
- No blocker detection
- No QA review
- No resume capability
- No portability

---

### Baseline C: Orchestrated Approach (Full Framework)

**Description:** Full Editorial Orchestrator pipeline with all features.

**Method:**
1. Discovery phase (detect blockers, classify)
2. Brief phase (with Brief Gate)
3. Outline phase (with Outline Gate)
4. Draft phase (with Draft Gate)
5. Review phase (multi-perspective QA, with QA Gate)
6. Artifact phase (validation, with Artifact Gate)
7. Sync/portability (export, import, conflict handling)

**Example flow:**
```
Step 1: Discovery
  - Scan requirements
  - Detect blockers (B1-B9)
  - Classify and route
  - Pass Discovery Gate

Step 2: Brief
  - Generate brief from discovery
  - Validate against Brief Gate
  - Block if gate fails

Step 3: Outline
  - Generate outline from brief
  - Validate against Outline Gate
  - Block if gate fails

Step 4: Draft
  - Generate draft from outline
  - Validate against Draft Gate
  - Block if gate fails

Step 5: Review
  - Run all QA perspectives
  - Aggregate findings
  - Validate against QA Gate
  - Block if critical findings

Step 6: Artifact
  - Generate final artifact
  - Validate format
  - Pass Artifact Gate

Step 7: Sync (if applicable)
  - Export pack
  - Import to target
  - Detect conflicts
  - Resolve conflicts
```

**Characteristics:**
- **Full structure:** Discovery → Brief → Outline → Draft → Review → Artifact
- **Gate enforcement:** Quality gates block phase advancement
- **Multi-perspective QA:** 7 QA perspectives
- **Blocker handling:** B1-B9 taxonomy, partial completion
- **Resume capability:** Resume points, partial work preserved
- **Portability:** Export/import packs, conflict handling

**Strengths:**
- Comprehensive blocker detection
- Quality gates prevent bad work from advancing
- Multi-perspective QA catches issues
- Resume capability (failures recoverable)
- Portability (components reusable)

**Weaknesses:**
- Higher overhead (more steps)
- More complex (requires framework)
- Slower (more phases)

---

## Comparison Methodology

### 1. Select Evaluation Case

Choose case from `evals/cases/` that tests desired dimensions.

**Example:** `case-01-technical-docs.md` tests artifact quality and process reliability.

### 2. Run All Three Baselines

Execute each baseline on the same case with same inputs.

**Baseline A execution:**
1. Craft single prompt with all requirements
2. Send to LLM
3. Record output
4. Record time taken

**Baseline B execution:**
1. Generate brief from requirements
2. Generate outline from brief (no gate)
3. Generate draft from outline (no validation)
4. Record outputs
5. Record time taken

**Baseline C execution:**
1. Run full discovery phase
2. Generate brief (with Brief Gate)
3. Generate outline (with Outline Gate)
4. Generate draft (with Draft Gate)
5. Run QA review (with QA Gate)
6. Generate artifact (with Artifact Gate)
7. Record all outputs
8. Record time taken

### 3. Score All Baselines

Apply rubrics to all three baseline outputs.

**Rubrics to apply:**
- Artifact Quality (0-40): Completeness, correctness, clarity, constraints
- Process Reliability (0-40): Blocker detection, resolution, gates, resume
- Portability (0-40): Doctrine, style packs, workflows, conflicts
- QA Utility (0-40): Issue detection, false positives, severity, actionability

**Scoring process:**
1. Review final artifact against case requirements
2. Count injected blockers detected
3. Count injected quality issues detected
4. Test portability (if applicable)
5. Calculate scores for each dimension
6. Record scores in comparison report

### 4. Compare Results

Generate comparison report showing scores for all baselines.

**Comparison report format:**
```markdown
# Comparison Report: Case 01 - Technical Documentation

## Baseline A: Single-Prompt
- Artifact Quality: 18/40
- Process Reliability: 8/40
- Portability: 0/40
- QA Utility: 0/40
- **Total: 26/160**

## Baseline B: Simple Chain
- Artifact Quality: 28/40
- Process Reliability: 12/40
- Portability: 0/40
- QA Utility: 0/40
- **Total: 40/160**

## Baseline C: Orchestrated
- Artifact Quality: 38/40
- Process Reliability: 38/40
- Portability: N/A
- QA Utility: 36/40
- **Total: 112/120** (excluding portability)

## Analysis
[Detailed comparison and insights]
```

---

## Fairness Criteria

### 1. Same Inputs

All baselines receive identical inputs:
- Same requirements
- Same source materials
- Same injected blockers
- Same injected quality issues

### 2. Same LLM

All baselines use same LLM (e.g., Claude 3.5 Sonnet):
- Same model version
- Same temperature settings
- Same max tokens

### 3. Same Evaluation

All baselines evaluated with same rubrics:
- Same scoring criteria
- Same evaluator
- Same interpretation of rubric

### 4. Time Accounting

Record time for each baseline:
- Baseline A: Single request time
- Baseline B: Sum of all phase times
- Baseline C: Sum of all phase + gate + QA times

**Note:** Time is informational only, not part of score. Framework overhead expected.

### 5. No Cherry-Picking

Run each baseline once, no retries:
- No prompt engineering for Baseline A
- No manual fixes between phases for Baseline B
- No manual intervention for Baseline C (except required user decisions)

### 6. Realistic Cases

Evaluation cases must be realistic:
- Real-world writing tasks
- Realistic complexity
- Realistic blockers
- Realistic quality issues

**Avoid:**
- Toy examples
- Artificially simple cases
- Cases designed to favor orchestrated approach

---

## Interpretation Guidelines

### Expected Outcome Patterns

**Artifact Quality:**
- Baseline C > Baseline B > Baseline A
- Reason: Gates catch quality issues before advancing

**Process Reliability:**
- Baseline C >> Baseline B > Baseline A
- Reason: Only C has blocker detection and resume capability

**Portability:**
- Baseline C >> Baseline B = Baseline A = 0
- Reason: Only C has portability infrastructure

**QA Utility:**
- Baseline C >> Baseline B = Baseline A = 0
- Reason: Only C has multi-perspective QA system

### Unexpected Outcomes

**If Baseline A outperforms Baseline C on artifact quality:**
- Investigate: Was case too simple?
- Investigate: Did gates incorrectly block good work?
- Investigate: Was evaluation biased?

**If Baseline B outperforms Baseline C on artifact quality:**
- Investigate: Are gates too strict (false positives)?
- Investigate: Is QA adding noise instead of value?
- Investigate: Was case appropriate for framework?

**If Baseline C scores low on process reliability:**
- Investigate: Are blockers not being detected?
- Investigate: Are gates not catching issues?
- Investigate: Is resume capability broken?

---

## Reporting Standards

### Comparison Report Must Include

1. **Case summary:** What was tested
2. **Baseline A results:** Output, scores, time
3. **Baseline B results:** Output, scores, time
4. **Baseline C results:** Output, scores, time
5. **Comparative analysis:** What differed and why
6. **Conclusions:** Which baseline performed best and why
7. **Recommendations:** When to use each approach

### Transparency Requirements

- **Show all outputs:** Include actual artifacts from each baseline
- **Show all scores:** Include rubric worksheets
- **Show all issues:** List detected vs. missed blockers/issues
- **Show all conflicts:** List detected vs. missed conflicts (portability cases)

### Honesty Requirements

- **Report failures:** If Baseline C fails, report it
- **Report surprises:** If Baseline A outperforms C, report it
- **Report limitations:** If case wasn't realistic, report it
- **No cherry-picking:** Report first run, not best run

---

## Cross-References

- `evals/README.md` — Evaluation overview
- `evals/rubrics/artifact-quality.md` — Artifact quality rubric
- `evals/rubrics/process-reliability.md` — Process reliability rubric
- `evals/rubrics/portability.md` — Portability rubric
- `evals/rubrics/qa-utility.md` — QA utility rubric
- `evals/cases/` — Evaluation cases
