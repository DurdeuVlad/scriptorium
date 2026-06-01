# QA Workflow

**Status:** Phase 6 — Executable
**Owner:** lead-editor
**Trigger:** Invoked by review.md workflow; individual perspectives invoked via /qa-* commands
**Output:** Per-perspective issue lists (saved to cache-server); aggregated into review_report.json
**Cache Integration:** Each perspective saves qa-output artifact independently
**Key Principle:** Multi-perspective QA — each perspective is independent, specialized, and produces actionable issues

## Purpose
Define the QA model, perspectives, and structured output format for quality assurance. This workflow is a reference document, not a sequential process. It defines how each QA agent operates, what it checks, and what it produces. The review workflow orchestrates these perspectives; this file is the authority on what each perspective means.

## Inputs
| Input | Type | Required | Source |
|-------|------|----------|--------|
| draft_document | Markdown file | Yes | Drafting workflow |
| brief.json | JSON object | Yes | Brief workflow |
| style_pack | string (identifier) | Yes | From brief.json |
| review_report.json (partial) | object | No | Accumulated as perspectives run |

---

## QA Perspectives

### Perspective 1: Reader QA

**Question:** Does this make sense to the intended reader?
**Agent:** qa-reader
**Invoked by:** review workflow Step 3
**Cache artifact:** artifact_type='qa-output', metadata.perspective='reader'

**Execution:**
1. Read full_draft.md and brief.json (audience definition)
2. Read draft from reader's perspective at their knowledge level
3. Check each section for reader clarity
4. Produce issue list with severity classification
5. Save to cache-server as reader_issues.json

**Checks:**
- **Clarity:** Is every sentence clear on first read at the audience's knowledge level?
- **Logical flow:** Does each paragraph follow logically from the one before it?
- **Assumed knowledge:** Does the document assume knowledge the reader is not expected to have per the brief?
- **Reader-first structure:** Is each section structured around what the reader needs, not around what the writer knows?
- **Definitions:** Are necessary terms defined where the reader first encounters them?
- **Jargon:** Is domain jargon used appropriately for the audience level?

**Severity Assignment:**
- **Block:** Reader cannot understand core concepts, critical terms undefined
- **Revise:** Reader may struggle, flow issues, minor assumed knowledge gaps
- **Note:** Optional improvements, alternative phrasings

**Output Format:**
```json
{
  "perspective": "reader",
  "issues": [
    {
      "location": "Section 2, paragraph 3",
      "issue_type": "assumed_knowledge",
      "description": "Assumes reader knows what 'OAuth 2.0' is, but brief specifies beginner audience",
      "severity": "revise",
      "suggested_fix": "Add one-sentence definition: 'OAuth 2.0 is an authorization framework that...'"
    }
  ]
}
```

---

### Perspective 2: Skeptic QA

**Question:** What feels weak, fake, padded, or unsupported?
**Agent:** qa-skeptic
**Invoked by:** review workflow Step 3
**Cache artifact:** artifact_type='qa-output', metadata.perspective='skeptic'

**Execution:**
1. Read full_draft.md with skeptical eye
2. Flag every claim, assertion, and statement
3. Check each for evidence, grounding, necessity
4. Quote exact weak passages
5. Save to cache-server as skeptic_issues.json

**Checks:**
- **Claims without evidence:** Any factual assertion not grounded in source or canon reference
- **Padding sentences:** Sentences that restate what was just said or add no new information
- **Hedged statements:** "It could be argued that..." / "Some might say..." when direct claim warranted
- **Wasted words:** Throat-clearing openers, redundant qualifiers, excessive transitions
- **Hollow superlatives:** "Incredibly powerful", "truly unique", "deeply meaningful" without grounding
- **Structural filler:** Sections that exist but contribute nothing to document's purpose
- **Vague statements:** Claims that sound meaningful but say nothing specific

**Severity Assignment:**
- **Block:** Unsupported claims presented as fact, entire sections are filler
- **Revise:** Padding sentences, hedged statements, hollow superlatives
- **Note:** Minor word waste, optional cuts

**Output Format:**
```json
{
  "perspective": "skeptic",
  "issues": [
    {
      "location": "Section 3, paragraph 2",
      "issue_type": "padding",
      "exact_text": "As we have already discussed in the previous section, Docker containers provide isolation.",
      "description": "Restates prior section without adding new information",
      "severity": "revise",
      "suggested_fix": "Cut entire sentence. Previous section already covered this."
    }
  ]
}
```

---

### Perspective 3: Domain QA

**Question:** Does this fit the actual domain, canon, or technical context?
**Agent:** qa-domain
**Invoked by:** review workflow Step 3
**Cache artifact:** artifact_type='qa-output', metadata.perspective='domain'

**Execution:**
1. Read full_draft.md and brief.json (domain, sources)
2. Query guide-server for canon guides relevant to domain
3. Cross-reference every factual claim against sources and canon
4. Check domain terminology for correctness
5. Save to cache-server as domain_issues.json

**Checks:**
- **Factual accuracy:** Every verifiable claim cross-referenced against available sources
- **Canon compliance:** Every domain-specific statement checked against canon guides from guide-server
- **Domain-appropriate terminology:** Is vocabulary correct for domain? Any terms used incorrectly or anachronistically?
- **Missing domain context:** Is any domain-specific framing absent that reader will need?
- **Anachronisms and inconsistencies:** Does anything contradict established lore, history, or technical specifications?
- **Technical accuracy:** For technical domains, are code examples, commands, APIs correct?

**Severity Assignment:**
- **Block:** Canon violations, factual errors presented as truth, technical inaccuracies that would break code
- **Revise:** Terminology errors, missing domain context, minor anachronisms
- **Note:** Optional domain enhancements, additional context

**Output Format:**
```json
{
  "perspective": "domain",
  "issues": [
    {
      "location": "Section 4, code example",
      "issue_type": "canon_violation",
      "description": "States 'Character X is a wizard' but canon guide G-CANON-001 specifies 'Character X is a warrior'",
      "severity": "block",
      "canon_reference": "G-CANON-001, line 45",
      "suggested_fix": "Change to 'warrior' or escalate to canon-checker if intentional retcon"
    }
  ]
}
```

---

### Perspective 4: Style QA

**Question:** Does this match the intended style pack and voice model?
**Agent:** qa-style
**Invoked by:** review workflow Step 3
**Cache artifact:** artifact_type='qa-output', metadata.perspective='style'

**Execution:**
1. Read full_draft.md and brief.json (style_pack_identifier)
2. Load style pack from `.writing-framework/styles/[style_pack].md`
3. Check draft against all style pack rules
4. Flag violations with specific rule citations
5. Save to cache-server as style_issues.json

**Checks:**
- **Tone match:** Does overall tone match style pack's tone definition?
- **Vocabulary consistency:** Are vocabulary choices aligned with style pack's word list and restrictions?
- **Sentence structure patterns:** Do sentence lengths and structures match style pack's rhythm model?
- **Formatting:** Do headers, lists, emphasis match style pack rules?
- **Style pack explicit rules:** Are any style pack prohibitions violated (e.g., forbidden phrases, required structures)?
- **Voice consistency:** Does voice match style pack's voice model throughout?

**Severity Assignment:**
- **Block:** Violates explicit style pack prohibition, tone completely wrong for audience
- **Revise:** Vocabulary inconsistencies, sentence structure deviations, formatting errors
- **Note:** Minor style improvements, optional enhancements

**Output Format:**
```json
{
  "perspective": "style",
  "issues": [
    {
      "location": "Section 2, paragraph 5",
      "issue_type": "tone_violation",
      "description": "Uses informal tone ('gonna', 'kinda') but style pack specifies formal tone",
      "severity": "revise",
      "style_pack_rule": "technical-writing.md, line 23: 'Use formal tone, avoid contractions'",
      "suggested_fix": "Replace 'gonna' with 'going to', 'kinda' with 'somewhat'"
    }
  ]
}
```

---

### Perspective 5: Coherence QA

**Question:** Does the structure, flow, and internal logic hold together?
**Agent:** qa-coherence
**Invoked by:** review workflow Step 3
**Cache artifact:** artifact_type='qa-output', metadata.perspective='coherence'

**Execution:**
1. Read full_draft.md, outline.json, brief.json
2. Check structural logic and flow
3. Verify all outline sections covered
4. Check for internal contradictions
5. Save to cache-server as coherence_issues.json

**Checks:**
- **Transitions:** Do transitions between paragraphs and sections earn their connection?
- **Section order logic:** Is section order the best possible order for this reader and purpose?
- **Argument structure:** If document makes argument, does evidence precede conclusion?
- **Internal contradictions:** Does document contradict itself anywhere?
- **Scope creep:** Does any section drift outside its stated purpose?
- **Completeness:** Are all promised topics from outline or intro actually covered?
- **Forward references:** Does document reference concepts before introducing them?

**Severity Assignment:**
- **Block:** Internal contradictions, missing promised sections, broken argument structure
- **Revise:** Weak transitions, section order issues, scope creep
- **Note:** Optional structural improvements, alternative orderings

**Output Format:**
```json
{
  "perspective": "coherence",
  "issues": [
    {
      "location": "Section 3 → Section 4 transition",
      "issue_type": "weak_transition",
      "description": "Section 3 ends discussing authentication, Section 4 starts with deployment. No transition explaining the connection.",
      "severity": "revise",
      "suggested_fix": "Add transition sentence: 'Once authentication is configured, the application is ready for deployment.'"
    }
  ]
}
```

---

### Perspective 6: AI-Stink QA

**Question:** What sounds machine-generated or too smooth?
**Agent:** qa-ai-stink
**Invoked by:** review workflow Step 3
**Cache artifact:** artifact_type='qa-output', metadata.perspective='ai-stink'

**Execution:**
1. Read full_draft.md
2. Load doctrine/VOICE_MODEL.md AI-stink detection checklist
3. Check draft against all AI-stink patterns
4. Quote exact flagged phrases
5. Provide specific revisions (not vague "make it better")
6. Save to cache-server as ai_stink_issues.json

**Checks (from doctrine/VOICE_MODEL.md):**
- **Symmetric sentence construction:** "Not only X, but also Y"
- **Excessive transitional stacking:** "Furthermore, additionally, moreover..."
- **Abstract noun chains:** "The implementation of the facilitation of..."
- **Hollow enthusiasm openers:** "This is an exciting development..."
- **Emdash overuse:** Using — as stylistic crutch
- **Passive constructions:** Used to avoid agency
- **Summary sentences:** Sentences that summarize what was just said
- **Cadence uniformity:** Every sentence approximately same length and structure
- **Absence of concrete detail:** No specific, unexpected detail
- **Averaged voice:** No strong perspective, no specific point of view
- **Generic transitions:** "In conclusion", "As mentioned above", "It is important to note"
- **Hedging clusters:** "It seems that", "It appears", "One might argue"

**Severity Assignment:**
- **Block:** Pervasive AI-stink (>30% of paragraphs flagged) — escalate to voice-editor
- **Revise:** Moderate AI-stink patterns, multiple instances
- **Note:** Isolated instances, minor patterns

**Output Format:**
```json
{
  "perspective": "ai-stink",
  "issues": [
    {
      "location": "Section 1, paragraph 2",
      "issue_type": "symmetric_construction",
      "exact_text": "Not only does Docker provide isolation, but it also enables portability.",
      "description": "Symmetric 'not only...but also' construction is AI-stink pattern",
      "severity": "revise",
      "suggested_fix": "Docker provides isolation and enables portability." OR "Docker isolates applications. It also makes them portable."
    }
  ]
}
```

---

### Perspective 7: Final QA

**Question:** Should this be accepted, revised, or blocked?
**Agent:** qa-final
**Invoked by:** review workflow Step 3 (last perspective)
**Cache artifact:** artifact_type='qa-output', metadata.perspective='final'

**Execution:**
1. Wait for all other perspectives to complete
2. Query cache-server for all qa-output artifacts
3. Review all prior QA outputs
4. Apply gate criteria from doctrine/QUALITY_GATES.md
5. Check success criteria from brief.json against actual document
6. Produce gate decision with justification
7. Save to cache-server as final_decision.json

**Checks:**
- **All prior QA outputs reviewed:** Every perspective's issues accounted for
- **Gate criteria applied:** From doctrine/QUALITY_GATES.md for current phase
- **Success criteria checked:** From brief.json reviewed against actual document
- **Document purpose:** Does document do what brief said it needed to do?
- **Blocking issue count:** How many blocking issues exist?
- **Issue distribution:** Are issues concentrated in specific sections or pervasive?

**Gate Decision Logic:**
- **ACCEPT:** No blocking issues AND document meets all success criteria from brief
- **REVISE:** Blocking or revise issues found, but document is salvageable with targeted fixes
- **BLOCK:** Critical blockers (canon conflicts, fails brief purpose, pervasive quality issues)

**Output Format:**
```json
{
  "perspective": "final",
  "gate_decision": "REVISE",
  "justification": "2 blocking issues (1 canon violation, 1 factual error) and 7 revise issues. Document structure is sound, issues are fixable with targeted section revisions.",
  "blocking_issue_count": 2,
  "revise_issue_count": 7,
  "note_issue_count": 3,
  "success_criteria_met": {
    "criterion_1": true,
    "criterion_2": false,
    "criterion_3": true
  },
  "required_actions": [
    "Fix canon violation in Section 4 (blocking)",
    "Correct factual error in Section 2 (blocking)",
    "Address 7 revise-level issues per rewrite_plan.json"
  ]
}
```

---

## Execution Model

This workflow is a **reference document**, not a sequential process. It defines how each QA perspective operates. The review workflow orchestrates these perspectives.

**Execution:**
1. lead-editor assigns perspectives (review.md Step 2)
2. All perspectives run in parallel (review.md Step 3)
3. Each perspective saves qa-output artifact independently
4. lead-editor aggregates outputs (review.md Step 4)
5. qa-final produces gate decision (review.md Step 3, last perspective)

**This document defines:** What each perspective checks, how it operates, what it produces

## Perspective Independence

**Each perspective operates independently:**
- Does NOT see other perspectives' outputs until aggregation
- Does NOT coordinate with other perspectives
- Focuses solely on its domain of expertise
- Produces complete issue list for its perspective only

**Aggregation happens at lead-editor level (review.md Step 4)**

## Severity Classification Standard

**All perspectives use same severity levels:**

**Block:**
- Issue prevents document from being acceptable
- Must be fixed before document can advance
- Examples: canon violations, factual errors, missing critical sections, pervasive quality issues

**Revise:**
- Issue should be fixed for quality
- Document could advance but would be improved by fixing
- Examples: weak claims, padding, minor terminology errors, style violations

**Note:**
- Optional improvement
- Document is acceptable as-is
- Examples: alternative phrasings, optional enhancements, minor optimizations

## Outputs
| Output | Type | Schema | Destination |
|--------|------|--------|-------------|
| per_perspective_issue_lists | arrays of issue objects | Defined above per perspective | Aggregated into review_report |
| gate_decision | string (ACCEPT/REVISE/BLOCK) | Inline in review_report.gate_decision | Lead-editor, orchestrator |

## Quality Standards for QA Outputs

**Every issue must include:**
- ✅ **Location:** Specific section, paragraph, or line
- ✅ **Issue type:** Classification of the problem
- ✅ **Description:** Clear explanation of what's wrong
- ✅ **Severity:** block / revise / note
- ✅ **Suggested fix:** Actionable revision (not vague)

**Forbidden:**
- ❌ Vague issues: "this section feels weak" without specifics
- ❌ Unactionable feedback: "improve the tone" without how
- ❌ Missing locations: "somewhere in the document"
- ❌ Subjective severity: "this bothers me" without criteria

**Example — Good Issue:**
```json
{
  "location": "Section 2, paragraph 3, sentence 2",
  "issue_type": "assumed_knowledge",
  "description": "Assumes reader knows 'OAuth 2.0' but brief specifies beginner audience",
  "severity": "revise",
  "suggested_fix": "Add definition: 'OAuth 2.0 is an authorization framework that...'"
}
```

**Example — Bad Issue:**
```json
{
  "location": "Section 2",
  "description": "This section feels confusing",
  "severity": "revise"
}
```

## Related Commands
- /qa-reader
- /qa-skeptic
- /qa-domain
- /qa-style
- /qa-coherence
- /qa-ai-stink
- /qa-final

## Related Agents
- lead-editor (owner)
- qa-reader
- qa-skeptic
- qa-domain
- qa-style
- qa-coherence
- qa-ai-stink
- qa-final
- adversarial-reviewer (optional)

## Cache-Server Integration

**Each perspective:**
- Calls `save_artifact`: artifact_type='qa-output', content=[perspective]_issues.json
- Metadata includes: perspective name, issue count, blocking count
- No coordination between perspectives (parallel execution)

**Aggregation (lead-editor):**
- Calls `list_run_artifacts(run_id, artifact_type='qa-output')`
- Collects all 7 perspective outputs
- Aggregates into review_report.json

## Cross-References
- `workflows/review.md` — orchestrates these perspectives
- `schemas/review_report.schema.json` — aggregated output format
- `doctrine/QUALITY_GATES.md` — gate criteria applied by qa-final
- `doctrine/VOICE_MODEL.md` — AI-stink detection checklist for qa-ai-stink
- `doctrine/AUTONOMOUS_EXECUTION.md` — Type 1/2/3 decision rules
- `agents/qa-reader.md` through `agents/qa-final.md` — Individual QA agent specifications
