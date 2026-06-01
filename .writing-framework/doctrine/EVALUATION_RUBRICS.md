# EVALUATION RUBRICS

**Status:** Canonical. Defines evaluation criteria for each workflow phase and QA perspective.
**Phase:** 6
**Related:** QUALITY_GATES.md, workflows/qa.md

---

## Purpose

Provide specific, measurable evaluation criteria for each phase of the editorial pipeline. These rubrics translate abstract quality goals into concrete checkable statements.

---

## Brief Evaluation Rubric

**Gate:** Brief Gate  
**Reviewer:** lead-editor  
**Schema:** brief.schema.json

### Required Elements

| Element | Criterion | Pass/Fail |
|---------|-----------|-----------|
| **Audience** | Primary reader defined with knowledge level | Binary |
| **Audience** | Reader needs explicitly stated | Binary |
| **Purpose** | Document purpose stated as what it accomplishes (not what it covers) | Binary |
| **Scope** | in_scope list has ≥3 specific items | Binary |
| **Scope** | out_of_scope list has ≥2 specific items | Binary |
| **Success Criteria** | ≥3 checkable success criteria (pass/fail, not subjective) | Binary |
| **Constraints** | Word count range specified (min and max) | Binary |
| **Constraints** | Format requirements specified | Binary |
| **Source Material** | Available sources listed with file paths or URLs | Binary |
| **Open Questions** | Only Type 3 decisions listed (not Type 1/2) | Binary |

### Quality Checks

- **Audience clarity:** Can outline-architect determine appropriate structure without asking questions?
- **Scope boundedness:** Is it clear what is excluded as well as what is included?
- **Success criteria measurability:** Can qa-final evaluate each criterion objectively?
- **Constraint completeness:** Are all hard limits documented?

### Common Failures

- ❌ Audience: "general audience" (too vague)
- ❌ Purpose: "cover Docker basics" (what it covers, not what it accomplishes)
- ❌ Scope: in_scope list but no out_of_scope list
- ❌ Success criteria: "high quality", "engaging" (subjective, not checkable)
- ❌ Open questions: "Should we use formal tone?" (Type 2, not Type 3)

---

## Outline Evaluation Rubric

**Gate:** Outline Gate  
**Reviewer:** lead-editor  
**Schema:** outline.schema.json

### Required Elements

| Element | Criterion | Pass/Fail |
|---------|-----------|-----------|
| **Sections** | Every section has section_id, title, level, purpose, required_content, estimated_words | Binary |
| **Section Purposes** | No two sections have overlapping purposes | Binary |
| **Section Order** | Order justified in structure_justification field | Binary |
| **Word Count** | Total estimated_words within brief constraints (±10%) | Binary |
| **Template** | Template selection documented in template_used field | Binary |
| **Completeness** | All brief requirements mapped to sections | Binary |

### Quality Checks

- **Section distinctness:** Each section does something unique for the reader
- **Order logic:** Section N+1 can be understood after reading section N (no forward references)
- **Purpose clarity:** Can section-drafter draft any section without asking questions?
- **Scope coverage:** All in_scope items from brief are addressed in outline

### Common Failures

- ❌ Section purpose: "Cover authentication" (what it covers, not what it does for reader)
- ❌ Overlapping purposes: Section 2 "Explain Docker basics" and Section 3 "Introduce Docker fundamentals"
- ❌ Unjustified order: Sections in production order rather than reader-logical order
- ❌ Word count: Total 8,000 words when brief specifies 3,000-5,000 range

---

## Draft Evaluation Rubric

**Gate:** Draft Gate  
**Reviewer:** lead-editor  
**Schema:** merge_report.schema.json

### Required Elements

| Element | Criterion | Pass/Fail |
|---------|-----------|-----------|
| **Completeness** | All sections from outline present (or documented as blocked) | Binary |
| **Placeholders** | No undocumented placeholders | Binary |
| **Voice Consistency** | Voice consistent across sections OR inconsistencies documented in merge_report | Binary |
| **Merge Report** | merge_report.json complete with all section statuses | Binary |
| **Word Count** | Total word count within ±30% of outline estimate | Binary |
| **Flagged Issues** | All section-drafter flagged issues documented in merge_report | Binary |

### Quality Checks

- **Section completeness:** Each section fulfills its purpose from outline
- **Voice normalization:** Voice changes documented, not silent
- **Placeholder quality:** Blocked sections have descriptive placeholders with resume notes
- **Scope adherence:** Sections stay within their assigned scope

### Common Failures

- ❌ Missing section without documentation
- ❌ Placeholder without resume note: "Content pending"
- ❌ Severe voice inconsistency not escalated to voice-editor
- ❌ merge_report missing or incomplete
- ❌ Word count 12,000 when outline estimated 5,000 (>50% deviation)

---

## Review Evaluation Rubric (QA Gate)

**Gate:** QA Gate  
**Reviewer:** lead-editor  
**Schema:** review_report.schema.json

### Required Elements

| Element | Criterion | Pass/Fail |
|---------|-----------|-----------|
| **Perspectives** | All 7 standard QA perspectives applied (reader, skeptic, domain, style, coherence, AI-stink, final) | Binary |
| **Perspective Outputs** | All perspective outputs present in review_report | Binary |
| **Issue Quality** | Every issue has location, description, severity, suggested fix | Binary |
| **Gate Decision** | Gate decision (ACCEPT/REVISE/BLOCK) recorded with justification | Binary |
| **Success Criteria** | All success criteria from brief checked against document | Binary |
| **Blocking Issues** | Blocking issues resolved or escalated with documented path | Binary |

### Quality Checks

- **Issue specificity:** No vague issues ("this section feels weak" without detail)
- **Issue actionability:** Every issue has specific suggested fix (not "improve the tone")
- **Severity consistency:** Severity assigned per standard (block/revise/note)
- **Gate justification:** Decision justified with reference to specific issues or criteria

### Common Failures

- ❌ Perspective missing: qa-domain not run for technical document
- ❌ Vague issue: "Section 2 needs work" without specifics
- ❌ Unactionable fix: "Make this better"
- ❌ Gate decision unjustified: "ACCEPT" without checking success criteria
- ❌ Blocking issue not addressed: Canon violation noted but not escalated

---

## QA Perspective Rubrics

### Reader QA Rubric

**Focus:** Reader clarity and intelligibility

**Checks:**
- ✅ Every sentence clear on first read at audience knowledge level
- ✅ Paragraphs follow logically from prior paragraphs
- ✅ No assumed knowledge beyond audience level
- ✅ Sections structured around reader needs, not writer knowledge
- ✅ Necessary terms defined where first encountered
- ✅ Jargon appropriate for audience level

**Issue Severity:**
- **Block:** Reader cannot understand core concepts, critical terms undefined
- **Revise:** Reader may struggle, flow issues, minor assumed knowledge gaps
- **Note:** Optional improvements, alternative phrasings

**Example Good Issue:**
> Location: Section 2, paragraph 3  
> Issue: Assumes reader knows "OAuth 2.0" but brief specifies beginner audience  
> Severity: revise  
> Fix: Add definition: "OAuth 2.0 is an authorization framework that..."

---

### Skeptic QA Rubric

**Focus:** Weak claims, padding, unsupported assertions

**Checks:**
- ✅ Every factual claim grounded in source or canon reference
- ✅ No padding sentences (restatements, no new information)
- ✅ Direct claims instead of hedged statements where warranted
- ✅ No wasted words (throat-clearing, redundant qualifiers)
- ✅ No hollow superlatives without grounding
- ✅ No structural filler (sections that contribute nothing)

**Issue Severity:**
- **Block:** Unsupported claims presented as fact, entire sections are filler
- **Revise:** Padding sentences, hedged statements, hollow superlatives
- **Note:** Minor word waste, optional cuts

**Example Good Issue:**
> Location: Section 3, paragraph 2  
> Exact text: "As we have already discussed in the previous section, Docker containers provide isolation."  
> Issue: Restates prior section without adding new information  
> Severity: revise  
> Fix: Cut entire sentence. Previous section already covered this.

---

### Domain QA Rubric

**Focus:** Domain accuracy and canon compliance

**Checks:**
- ✅ Every verifiable claim cross-referenced against available sources
- ✅ Every domain-specific statement checked against canon guides
- ✅ Vocabulary correct for domain (no incorrect or anachronistic terms)
- ✅ Domain-specific framing present where reader needs it
- ✅ No contradictions of established lore, history, or technical specs
- ✅ Code examples, commands, APIs correct (for technical domains)

**Issue Severity:**
- **Block:** Canon violations, factual errors presented as truth, technical inaccuracies that would break code
- **Revise:** Terminology errors, missing domain context, minor anachronisms
- **Note:** Optional domain enhancements, additional context

**Example Good Issue:**
> Location: Section 4, code example  
> Issue: States "Character X is a wizard" but canon guide G-CANON-001 specifies "Character X is a warrior"  
> Canon reference: G-CANON-001, line 45  
> Severity: block  
> Fix: Change to "warrior" or escalate to canon-checker if intentional retcon

---

### Style QA Rubric

**Focus:** Style pack compliance

**Checks:**
- ✅ Overall tone matches style pack tone definition
- ✅ Vocabulary aligned with style pack word list and restrictions
- ✅ Sentence lengths and structures match style pack rhythm model
- ✅ Headers, lists, emphasis match style pack formatting rules
- ✅ No style pack prohibitions violated
- ✅ Voice matches style pack voice model throughout

**Issue Severity:**
- **Block:** Violates explicit style pack prohibition, tone completely wrong for audience
- **Revise:** Vocabulary inconsistencies, sentence structure deviations, formatting errors
- **Note:** Minor style improvements, optional enhancements

**Example Good Issue:**
> Location: Section 2, paragraph 5  
> Issue: Uses informal tone ("gonna", "kinda") but style pack specifies formal tone  
> Style pack rule: technical-writing.md, line 23: "Use formal tone, avoid contractions"  
> Severity: revise  
> Fix: Replace "gonna" with "going to", "kinda" with "somewhat"

---

### Coherence QA Rubric

**Focus:** Structural logic and internal consistency

**Checks:**
- ✅ Transitions between paragraphs and sections earn their connection
- ✅ Section order is best possible order for reader and purpose
- ✅ Evidence precedes conclusion (if document makes argument)
- ✅ No internal contradictions
- ✅ No scope creep (sections stay within stated purpose)
- ✅ All promised topics from outline or intro actually covered
- ✅ No forward references (concepts introduced before referenced)

**Issue Severity:**
- **Block:** Internal contradictions, missing promised sections, broken argument structure
- **Revise:** Weak transitions, section order issues, scope creep
- **Note:** Optional structural improvements, alternative orderings

**Example Good Issue:**
> Location: Section 3 → Section 4 transition  
> Issue: Section 3 ends discussing authentication, Section 4 starts with deployment. No transition explaining connection.  
> Severity: revise  
> Fix: Add transition sentence: "Once authentication is configured, the application is ready for deployment."

---

### AI-Stink QA Rubric

**Focus:** Machine-generated patterns and voice flatness

**Checks (from doctrine/VOICE_MODEL.md):**
- ✅ No symmetric sentence construction ("Not only X, but also Y")
- ✅ No excessive transitional stacking ("Furthermore, additionally, moreover...")
- ✅ No abstract noun chains ("The implementation of the facilitation of...")
- ✅ No hollow enthusiasm openers ("This is an exciting development...")
- ✅ No emdash overuse as stylistic crutch
- ✅ No passive constructions used to avoid agency
- ✅ No summary sentences (sentences that summarize what was just said)
- ✅ No cadence uniformity (varied sentence length and structure)
- ✅ Presence of concrete, specific, unexpected detail
- ✅ Strong perspective, specific point of view (not averaged voice)
- ✅ No generic transitions ("In conclusion", "As mentioned above")
- ✅ No hedging clusters ("It seems that", "It appears")

**Issue Severity:**
- **Block:** Pervasive AI-stink (>30% of paragraphs flagged) — escalate to voice-editor
- **Revise:** Moderate AI-stink patterns, multiple instances
- **Note:** Isolated instances, minor patterns

**Example Good Issue:**
> Location: Section 1, paragraph 2  
> Exact text: "Not only does Docker provide isolation, but it also enables portability."  
> Pattern: symmetric_construction  
> Issue: Symmetric "not only...but also" construction is AI-stink pattern  
> Severity: revise  
> Fix: "Docker provides isolation and enables portability." OR "Docker isolates applications. It also makes them portable."

---

### Final QA Rubric

**Focus:** Gate decision (ACCEPT/REVISE/BLOCK)

**Checks:**
- ✅ All prior QA outputs reviewed and issues accounted for
- ✅ Gate criteria from doctrine/QUALITY_GATES.md applied
- ✅ Success criteria from brief.json checked against actual document
- ✅ Document purpose: Does document do what brief said it needed to do?
- ✅ Blocking issue count tallied
- ✅ Issue distribution analyzed (concentrated or pervasive)

**Gate Decision Logic:**
- **ACCEPT:** No blocking issues AND document meets all success criteria from brief
- **REVISE:** Blocking or revise issues found, but document salvageable with targeted fixes
- **BLOCK:** Critical blockers (canon conflicts, fails brief purpose, pervasive quality issues)

**Example Good Output:**
```json
{
  "gate_decision": "REVISE",
  "justification": "2 blocking issues (1 canon violation, 1 factual error) and 7 revise issues. Document structure is sound, issues are fixable with targeted section revisions.",
  "blocking_issue_count": 2,
  "revise_issue_count": 7,
  "note_issue_count": 3,
  "required_actions": [
    "Fix canon violation in Section 4 (blocking)",
    "Correct factual error in Section 2 (blocking)",
    "Address 7 revise-level issues per rewrite_plan.json"
  ]
}
```

---

## Cross-References

- `doctrine/QUALITY_GATES.md` — Gate criteria for each phase
- `workflows/qa.md` — QA perspective definitions
- `workflows/brief.md` — Brief workflow and gate
- `workflows/outline.md` — Outline workflow and gate
- `workflows/drafting.md` — Drafting workflow and gate
- `workflows/review.md` — Review workflow and QA gate
- `doctrine/VOICE_MODEL.md` — AI-stink detection patterns
- `schemas/*.schema.json` — Output format specifications
