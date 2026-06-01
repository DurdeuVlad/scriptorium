# Phase 12 Specification — QA and Review System

**Status:** IMPLEMENTED (verification pending)  
**Priority:** HIGH (needed for quality assurance)  
**Timeline:** 3-4 weeks  
**Effort:** 40-50 hours  
**Depends on:** Phase 11 (Core Writing Pipeline)

---

## Objective

Make quality gating operational. No document should advance to artifact generation without passing all applicable QA perspectives. Implement multi-perspective adversarial review that catches real issues without excessive false positives.

---

## Success Criteria

**Minimum Viable Product:**
1. Can execute `/qa-reader` and receive structured findings
2. Can execute `/qa-final` and receive aggregated verdict
3. QA Gate blocks drafts with critical findings
4. False positive rate < 15%
5. All 6 injected issues in case-01 detected
6. Severity accuracy ≥ 85%
7. Actionability ≥ 85%

**Validation:**
- Test with `evals/cases/case-01-technical-docs.md` (6 injected quality issues)
- QA utility score ≥ 35/40
- Issue detection rate ≥ 85%
- False positive rate < 15%

---

## Deliverables

### 1. QA Perspective Commands (7 commands)

#### `/qa-reader`
**Purpose:** Review from reader perspective (assumed knowledge, clarity)

**Inputs:**
- `draft_id` (from cache-server) OR
- `draft_markdown` (inline)
- `brief_id` (for audience context)

**Process:**
1. Load draft and brief
2. Extract audience from brief (knowledge level, needs)
3. Invoke `adversarial-reviewer` agent with reader perspective
4. Check for:
   - **Assumed knowledge:** Terms/concepts used without explanation
   - **Unclear explanations:** Vague or confusing phrasing
   - **Missing context:** References to things not introduced
   - **Jargon overload:** Technical terms without definitions
   - **Logical gaps:** Jumps in reasoning
5. Generate `review_report.json`
6. Assign severity (critical, major, minor)
7. Provide actionable findings with locations

**Outputs:**
- `review_report.json` (perspective: qa-reader, findings, verdict)

**Severity guidelines:**
- **Critical:** Assumed knowledge that blocks understanding
- **Major:** Unclear explanation that confuses reader
- **Minor:** Awkward phrasing that could be clearer

**Implementation file:** `.claude/commands/qa-reader.md`

**Example finding:**
```json
{
  "perspective": "qa-reader",
  "severity": "critical",
  "location": "Section 3, paragraph 2, line 45",
  "issue": "Assumed knowledge - 'Docker containers' used without explanation",
  "suggested_fix": "Add brief explanation: 'Docker containers (isolated application environments)'",
  "example": "Docker containers, which are isolated application environments that package code and dependencies, allow..."
}
```

---

#### `/qa-skeptic`
**Purpose:** Review from skeptic perspective (claim grounding, evidence)

**Inputs:**
- `draft_id` OR `draft_markdown`
- `brief_id` (for source materials)

**Process:**
1. Load draft and brief
2. Extract source materials from brief
3. Invoke `adversarial-reviewer` agent with skeptic perspective
4. Check for:
   - **Unsupported claims:** Assertions without evidence
   - **Weak evidence:** Claims supported by weak sources
   - **Overgeneralizations:** "Always", "never", "all" without qualification
   - **Missing citations:** Facts that need sources (research domain)
   - **Logical fallacies:** Faulty reasoning
5. Generate `review_report.json`

**Outputs:**
- `review_report.json` (perspective: qa-skeptic, findings, verdict)

**Severity guidelines:**
- **Critical:** Factual claim with no evidence
- **Major:** Claim with weak or questionable evidence
- **Minor:** Overgeneralization that should be qualified

**Implementation file:** `.claude/commands/qa-skeptic.md`

---

#### `/qa-domain`
**Purpose:** Review from domain expert perspective (technical accuracy)

**Inputs:**
- `draft_id` OR `draft_markdown`
- `domain` (technical, dnd, research, card-game)
- `canon_ids` (optional, for D&D domain)

**Process:**
1. Load draft
2. Query guide-server for domain canon (if applicable)
3. Invoke `adversarial-reviewer` agent with domain perspective
4. Check for:
   - **Technical errors:** Incorrect facts, procedures, syntax
   - **Canon violations:** Inconsistencies with established lore (D&D)
   - **Terminology errors:** Misused domain-specific terms
   - **Outdated information:** Facts that are no longer current
   - **Incomplete procedures:** Missing critical steps
5. Generate `review_report.json`

**Outputs:**
- `review_report.json` (perspective: qa-domain, findings, verdict)

**Severity guidelines:**
- **Critical:** Technical error that would cause failure
- **Major:** Canon violation or significant inaccuracy
- **Minor:** Terminology issue or outdated detail

**Implementation file:** `.claude/commands/qa-domain.md`

---

#### `/qa-style`
**Purpose:** Review for style adherence

**Inputs:**
- `draft_id` OR `draft_markdown`
- `style_pack_id` (from brief)

**Process:**
1. Load draft and style pack
2. Invoke `adversarial-reviewer` agent with style perspective
3. Check for:
   - **Voice violations:** Inconsistent voice (formal vs. casual)
   - **Tone violations:** Inappropriate tone for audience
   - **Structure violations:** Heading hierarchy, formatting
   - **Anti-patterns:** Known bad patterns for this style
   - **Consistency:** Terminology, formatting, voice throughout
5. Generate `review_report.json`

**Outputs:**
- `review_report.json` (perspective: qa-style, findings, verdict)

**Severity guidelines:**
- **Critical:** Style violation that confuses or offends audience
- **Major:** Inconsistent voice or structure
- **Minor:** Minor formatting or terminology inconsistency

**Implementation file:** `.claude/commands/qa-style.md`

---

#### `/qa-coherence`
**Purpose:** Review for logical coherence and flow

**Inputs:**
- `draft_id` OR `draft_markdown`
- `outline_id` (for structure context)

**Process:**
1. Load draft and outline
2. Invoke `adversarial-reviewer` agent with coherence perspective
3. Check for:
   - **Logical gaps:** Missing steps in reasoning
   - **Contradictions:** Conflicting statements
   - **Poor transitions:** Abrupt section changes
   - **Structural issues:** Sections out of order
   - **Repetition:** Duplicate content across sections
5. Generate `review_report.json`

**Outputs:**
- `review_report.json` (perspective: qa-coherence, findings, verdict)

**Severity guidelines:**
- **Critical:** Logical contradiction or major gap
- **Major:** Poor transition or structural issue
- **Minor:** Minor repetition or flow issue

**Implementation file:** `.claude/commands/qa-coherence.md`

---

#### `/qa-ai-stink`
**Purpose:** Detect generic AI-generated phrasing

**Inputs:**
- `draft_id` OR `draft_markdown`

**Process:**
1. Load draft
2. Query guide-server for AI anti-patterns
3. Invoke `adversarial-reviewer` agent with AI-stink perspective
4. Check for:
   - **Generic phrases:** "It's worth noting", "In today's world", "Delve into"
   - **Hedging:** Excessive "may", "might", "could", "potentially"
   - **Buzzwords:** Overuse of trendy terms
   - **Passive voice:** Excessive passive constructions
   - **Clichés:** Overused expressions
5. Generate `review_report.json`

**Outputs:**
- `review_report.json` (perspective: qa-ai-stink, findings, verdict)

**Severity guidelines:**
- **Critical:** Pervasive generic phrasing (>10 instances)
- **Major:** Multiple generic phrases (5-10 instances)
- **Minor:** Few generic phrases (1-4 instances)

**Implementation file:** `.claude/commands/qa-ai-stink.md`

---

#### `/qa-final`
**Purpose:** Aggregate all QA perspectives and issue final verdict

**Inputs:**
- `draft_id` (from cache-server)
- `perspectives` (optional, default: all active perspectives)

**Process:**
1. Load draft
2. For each perspective in `perspectives`:
   - Run perspective command
   - Collect `review_report.json`
3. Aggregate findings:
   - Group by severity (critical, major, minor)
   - Deduplicate similar findings
   - Prioritize by severity
4. Issue verdict:
   - **PASS:** No critical findings, ≤3 major findings
   - **CONDITIONAL:** No critical findings, >3 major findings
   - **FAIL:** ≥1 critical finding
5. Generate aggregated `review_report.json`
6. Run QA Gate validation
7. Save to cache-server

**Outputs:**
- Aggregated `review_report.json` (all perspectives, verdict)
- QA Gate result (pass/fail)

**QA Gate enforcement:**
- If verdict = FAIL: Block advancement, create resume point
- If verdict = CONDITIONAL: Allow advancement with warnings
- If verdict = PASS: Allow advancement

**Implementation file:** `.claude/commands/qa-final.md`

**Example aggregated report:**
```json
{
  "report_id": "qa-final-123",
  "draft_id": "draft-456",
  "perspectives_run": ["qa-reader", "qa-skeptic", "qa-domain", "qa-style", "qa-coherence", "qa-ai-stink"],
  "findings_summary": {
    "critical": 1,
    "major": 4,
    "minor": 8
  },
  "findings": [
    {
      "perspective": "qa-reader",
      "severity": "critical",
      "location": "Section 3, paragraph 2",
      "issue": "Assumed knowledge - 'Docker containers' used without explanation"
    }
  ],
  "verdict": "FAIL",
  "recommended_actions": [
    "Fix critical finding in Section 3",
    "Address major findings in Sections 2, 4, 5"
  ]
}
```

---

### 2. Adversarial Reviewer Agent

#### `adversarial-reviewer`
**Purpose:** Find weakest points in document without softening criticism

**Canonical spec:** `.writing-framework/agents/adversarial-reviewer.md`  
**Implementation:** `.claude/agents/adversarial-reviewer.md`

**Behavior:**
1. **Adopt perspective:**
   - Reader: "I don't understand this"
   - Skeptic: "Prove it"
   - Domain: "That's technically wrong"
   - Style: "This doesn't match the style"
   - Coherence: "This doesn't follow logically"
   - AI-stink: "This sounds like generic AI output"

2. **Challenge everything:**
   - Question every claim
   - Identify every assumption
   - Flag every gap
   - Detect every inconsistency

3. **Be specific:**
   - Provide exact location (section, paragraph, line)
   - Describe exact issue
   - Suggest specific fix
   - Provide example (if helpful)

4. **Assign severity accurately:**
   - Critical: Blocks understanding or causes failure
   - Major: Significant issue that should be fixed
   - Minor: Nice to fix but not blocking

5. **Avoid false positives:**
   - Don't flag stylistic preferences as issues
   - Don't flag correct usage as errors
   - Don't flag intentional choices as problems
   - Precision > recall (better to miss some issues than flag non-issues)

6. **Return findings:**
   - Structured `review_report.json`
   - Actionable, specific, accurate

**Decision making:**
- **Type 1:** Classify severity, determine if issue is real
- **Type 2:** Choose suggested fix, flag if multiple options
- **Type 3:** Escalate if issue requires user judgment

**Escalation:**
- If unsure whether something is an issue: err on side of not flagging
- If issue requires domain expertise beyond agent's knowledge: flag as "needs expert review"

---

### 3. Review Report Schema

#### `review_report.schema.json`
**Location:** `.writing-framework/schemas/review_report.schema.json`

**Already exists, validate structure:**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Review Report",
  "type": "object",
  "required": ["report_id", "perspective", "draft_id", "findings", "verdict"],
  "properties": {
    "report_id": {"type": "string"},
    "perspective": {"enum": ["qa-reader", "qa-skeptic", "qa-domain", "qa-style", "qa-coherence", "qa-ai-stink", "qa-final"]},
    "draft_id": {"type": "string"},
    "findings": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["severity", "location", "issue"],
        "properties": {
          "severity": {"enum": ["critical", "major", "minor"]},
          "location": {"type": "string"},
          "issue": {"type": "string"},
          "suggested_fix": {"type": "string"},
          "example": {"type": "string"}
        }
      }
    },
    "verdict": {"enum": ["PASS", "CONDITIONAL", "FAIL"]},
    "recommended_actions": {"type": "array", "items": {"type": "string"}}
  }
}
```

---

### 4. QA Workflow Integration

#### QA Workflow Execution
**Workflow:** `.writing-framework/workflows/qa.md`

**Integration with commands:**
1. User runs `/qa-final` on draft
2. `/qa-final` orchestrates all perspective commands
3. Each perspective returns `review_report.json`
4. `/qa-final` aggregates findings
5. QA Gate validates (via `pre-phase-advance` hook)
6. If FAIL: block advancement, create resume point
7. If PASS/CONDITIONAL: allow advancement

**Hook integration:**
- `pre-phase-advance` hook enforces QA Gate
- `on-failure` hook handles QA Gate failures

---

### 5. Guide-Server Integration

#### QA-Specific Guides
**Already seeded in guide-server:**
- `qa-reader.json` — Reader perspective rubric
- `qa-skeptic.json` — Skeptic perspective rubric
- `qa-domain.json` — Domain perspective rubric
- `qa-style.json` — Style perspective rubric
- `qa-coherence.json` — Coherence perspective rubric
- `qa-ai-stink.json` — AI-stink anti-patterns

**Tools used:**
- `get_guide` — Retrieve perspective rubric
- `search_guides` — Search for anti-patterns

---

### 6. Cache-Server Integration

**QA commands use cache-server:**
- Load draft from cache
- Load brief/outline for context
- Save review reports to cache
- Log QA steps

**Tools used:**
- `load_artifact` — Load draft
- `save_artifact` — Save review report
- `log_step` — Log QA step

---

## Implementation Order

### Week 1: Reader & Skeptic Perspectives
1. Implement `/qa-reader` command
2. Implement `/qa-skeptic` command
3. Implement `adversarial-reviewer` agent (reader/skeptic modes)
4. Test with case-01 (assumed knowledge, unsupported claims)

**Milestone:** Can detect reader and skeptic issues

---

### Week 2: Domain, Style, Coherence Perspectives
1. Implement `/qa-domain` command
2. Implement `/qa-style` command
3. Implement `/qa-coherence` command
4. Extend `adversarial-reviewer` agent (domain/style/coherence modes)
5. Test with case-01 (technical errors, style violations, logical gaps)

**Milestone:** Can detect domain, style, and coherence issues

---

### Week 3: AI-Stink & Final Aggregation
1. Implement `/qa-ai-stink` command
2. Implement `/qa-final` aggregation
3. Extend `adversarial-reviewer` agent (AI-stink mode)
4. Integrate QA Gate enforcement
5. Test with case-01 (all 6 injected issues)

**Milestone:** Can run full QA workflow and enforce gate

---

### Week 4: Tuning & Validation
1. Tune severity thresholds
2. Reduce false positives (target <15%)
3. Improve actionability (target ≥85%)
4. Full end-to-end test with case-01
5. Validate against qa-utility rubric

**Milestone:** QA system production-ready

---

## Testing Strategy

### Unit Tests
- Each QA command tested independently
- Mock drafts with known issues
- Validate findings accuracy

### Integration Tests
- Run all perspectives on same draft
- Test `/qa-final` aggregation
- Validate QA Gate enforcement

### Accuracy Tests
- Test with case-01 (6 injected issues)
- Measure detection rate (target ≥85%)
- Measure false positive rate (target <15%)
- Measure severity accuracy (target ≥85%)
- Measure actionability (target ≥85%)

### Acceptance Tests
- QA utility score ≥ 35/40
- All 6 issues in case-01 detected
- False positive rate < 15%
- QA Gate blocks drafts with critical findings

---

## Success Metrics

**Phase 12 complete when:**
- [x] All 7 QA commands implemented
- [x] QA agent surface implemented
- [x] QA workflow integrated
- [x] QA Gate enforcement functional
- [ ] Case-01 passes QA tests
- [ ] QA utility score ≥ 35/40
- [ ] Issue detection ≥ 85%
- [ ] False positives < 15%
- [ ] Severity accuracy ≥ 85%
- [ ] Actionability ≥ 85%
- [x] Documentation updated

---

## Cross-References

- `ROADMAP.md` — Phase 12 overview
- `PRODUCTION_READINESS_PLAN.md` — Overall production plan
- `docs/PHASE11_SPECIFICATION.md` — Phase 11 spec (dependency)
- `.writing-framework/workflows/qa.md` — QA workflow
- `.writing-framework/agents/adversarial-reviewer.md` — Agent spec
- `evals/cases/case-01-technical-docs.md` — Test case (6 injected issues)
- `evals/rubrics/qa-utility.md` — QA utility rubric
