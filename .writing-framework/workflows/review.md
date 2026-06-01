# Review Workflow

**Status:** Phase 6 — Executable
**Owner:** lead-editor
**Trigger:** /orchestrate-review or after draft gate passes
**Output:** review_report.json + rewrite_plan.json if revisions required (saved to cache-server)
**Cache Integration:** Uses cache-server for run tracking and review output storage
**Key Principle:** Multi-perspective QA — each perspective examines draft independently, lead-editor aggregates and applies QA Gate

## Purpose
Apply multiple QA perspectives to a completed draft and produce a structured review report. Each perspective examines the draft independently; the lead-editor aggregates findings, applies the QA Gate, and either advances the draft or returns it with a structured rewrite plan.

## Inputs
| Input | Type | Required | Source |
|-------|------|----------|--------|
| draft_document | Markdown file | Yes | Drafting workflow |
| brief.json | JSON object | Yes | Brief workflow — defines success criteria and constraints |
| style_pack | string (identifier) | Yes | From brief.json |
| merge_report.json | object | No | Drafting workflow — context for reviewers |
| domain_canon_guides | array of guide objects | No | Queried from guide-server per document type |

## Execution Steps

### Step 1: Initialize Review Phase (lead-editor)
- Receive run_id with draft and merge_report from prior phase
- Call `fetch_run_context(run_id)` to get full_draft.md, merge_report.json, brief.json
- Call `save_step`: step_name='review-init', agent='lead-editor', status='completed'

### Step 2: Assign QA Perspectives (lead-editor)
- **Default perspectives (always run):** qa-reader, qa-skeptic, qa-domain, qa-style, qa-coherence, qa-ai-stink, qa-final
- **Optional perspectives:** adversarial-reviewer (high-stakes documents), canon-checker (worldbuilding)
- Assign based on: document_type, domain, risk_level from brief
- Create QA plan: list of perspectives to run
- Call `save_step`: step_name='qa-assignment', agent='lead-editor', status='completed'

### Step 3: Run QA Perspectives (parallel)

**qa-reader:**
- Review for reader clarity at audience knowledge level
- Check: clarity, logical flow, assumed knowledge, reader-first structure, definitions
- Produce issue list: location, description, severity (block/revise/note), suggested fix
- Call `save_artifact`: artifact_type='qa-output', content=reader_issues.json, metadata includes perspective='reader'
- Call `save_step`: step_name='qa-reader', agent='qa-reader', status='completed'

**qa-skeptic:**
- Review for weak claims, padding, unsupported assertions
- Check: claims without evidence, padding sentences, hedged statements, wasted words, hollow superlatives, structural filler
- Produce issue list: exact text quoted, severity, suggested fix or cut
- Call `save_artifact`: artifact_type='qa-output', content=skeptic_issues.json, metadata includes perspective='skeptic'
- Call `save_step`: step_name='qa-skeptic', agent='qa-skeptic', status='completed'

**qa-domain:**
- Review for domain accuracy and canon compliance
- Check: factual accuracy, canon compliance, domain terminology, missing context, anachronisms
- Query guide-server for canon guides, cross-reference claims
- Produce issue list: factual issues with sources, canon violations with guide refs, terminology errors
- Call `save_artifact`: artifact_type='qa-output', content=domain_issues.json, metadata includes perspective='domain'
- Call `save_step`: step_name='qa-domain', agent='qa-domain', status='completed'

**qa-style:**
- Review for style pack compliance
- Check: tone match, vocabulary consistency, sentence structure patterns, formatting, style pack rules
- Load style pack from brief.style_pack_identifier
- Produce issue list: style violations with citation of specific rule violated
- Call `save_artifact`: artifact_type='qa-output', content=style_issues.json, metadata includes perspective='style'
- Call `save_step`: step_name='qa-style', agent='qa-style', status='completed'

**qa-coherence:**
- Review for structural logic and internal consistency
- Check: transitions, section order logic, argument structure, internal contradictions, scope creep, completeness
- Produce issue list: structural issues with location, logic failure description, proposed fix
- Call `save_artifact`: artifact_type='qa-output', content=coherence_issues.json, metadata includes perspective='coherence'
- Call `save_step`: step_name='qa-coherence', agent='qa-coherence', status='completed'

**qa-ai-stink:**
- Review for generated-text patterns and voice flatness
- Check all patterns from doctrine/VOICE_MODEL.md: symmetric construction, transitional stacking, abstract noun chains, hollow enthusiasm, emdash overuse, passive constructions, cadence uniformity, absence of specific detail, averaged voice
- Produce issue list: flagged phrases with exact text, pattern type, specific revision (not vague)
- Call `save_artifact`: artifact_type='qa-output', content=ai_stink_issues.json, metadata includes perspective='ai-stink'
- Call `save_step`: step_name='qa-ai-stink', agent='qa-ai-stink', status='completed'

**qa-final:**
- Review all prior QA outputs
- Apply gate criteria from doctrine/QUALITY_GATES.md
- Review success criteria from brief.json against actual document
- Determine: Does document do what brief said it needed to do?
- Produce gate decision: ACCEPT / REVISE / BLOCK with justification
- Call `save_artifact`: artifact_type='qa-output', content=final_decision.json, metadata includes perspective='final'
- Call `save_step`: step_name='qa-final', agent='qa-final', status='completed'

### Step 4: Aggregate QA Outputs (lead-editor)
- Query cache-server: `list_run_artifacts(run_id, artifact_type='qa-output')`
- Collect all perspective issue lists
- Aggregate into review_report.json per schemas/review_report.schema.json
- Include: per_perspective_issues, total_issue_count, blocking_issue_count, gate_decision
- Call `save_step`: step_name='qa-aggregation', agent='lead-editor', status='completed'

### Step 5: Apply QA Gate (lead-editor)
- Review aggregated issues
- **If any blocking issues:** Gate decision is BLOCK or REVISE
- **If no blocking issues AND document meets success criteria:** Gate decision is ACCEPT
- **If only revise/note issues:** Gate decision is REVISE (optional) or ACCEPT
- Document gate decision with justification
- Call `save_step`: step_name='qa-gate', agent='lead-editor', status='completed', output_summary includes gate decision

### Step 6: Generate Rewrite Plan (if needed) (lead-editor)
- **If gate decision is REVISE or BLOCK:**
  - Create rewrite_plan.json per schemas/rewrite_plan.schema.json
  - List blocking issues first, then revise issues
  - For each issue: section_id, issue_description, required_action, priority
  - Specify which sections need revision
  - Call `save_artifact`: artifact_type='structured-data', content=rewrite_plan.json
- **If gate decision is ACCEPT:**
  - No rewrite plan needed
- Call `save_step`: step_name='rewrite-plan', agent='lead-editor', status='completed'

### Step 7: Save Review Report (lead-editor)
- Call `save_artifact`: artifact_type='structured-data', content=review_report.json
- Call `save_step`: step_name='review-save', agent='lead-editor', status='completed'

### Step 8: Review Gate Decision (lead-editor)
- **If ACCEPT:** Call `save_resume_point`: checkpoint_name='post-review', advance to artifact workflow
- **If REVISE:** Return to drafting workflow with rewrite_plan.json
- **If BLOCK:** Call `save_blocker` with classification, run status set to 'paused'
- Call `save_step`: step_name='review-gate-decision', agent='lead-editor', status='completed'

## Decision Points and Autonomy Rules

### Type 1 Decisions (Infer and Proceed)
- **No blocking issues, document meets success criteria:** Gate decision is ACCEPT, advance
- **Minor style/formatting issues:** Auto-fix if trivial, document in review_report
- **All perspectives complete:** Aggregate and apply gate

### Type 2 Decisions (Infer and Flag)
- **Mix of revise and note issues only:** Gate decision is REVISE (optional) or ACCEPT, flag for user decision
- **Moderate AI-stink (<30% paragraphs):** Include in rewrite_plan with specific fixes, flag pattern
- **Canon conflicts resolvable:** Resolve and flag resolution in review_report

### Type 3 Decisions (Must Ask)
- **Blocking issues found:** Gate decision is BLOCK or REVISE, create rewrite_plan, escalate
- **Canon conflict unresolvable:** Escalate to canon-checker before creating rewrite plan
- **Pervasive AI-stink (>30% paragraphs):** Escalate to voice-editor for holistic revision
- **Document fails to meet brief purpose:** B9 blocker, escalate to lead-orchestrator

### Blocker Scenarios
- **B8 (canon-conflict):** Draft contradicts established canon, unresolvable without user decision
- **B9 (validation-failure):** Document doesn't meet success criteria from brief, quality gate failed

### Escalation Triggers
- **Canon conflict:** Escalate to canon-checker (Level 2)
- **Pervasive AI-stink:** Escalate to voice-editor (Level 2)
- **Document fails brief purpose:** Escalate to lead-orchestrator (Level 3)
- **Contradictory QA findings:** Escalate to lead-editor for resolution (Level 2)

## Outputs
| Output | Type | Schema | Destination |
|--------|------|--------|-------------|
| review_report.json | JSON object | schemas/review_report.schema.json | Lead-editor, cache-server |
| per_perspective_issue_lists | arrays of issue objects | Inline in review_report.issues | Lead-editor |
| rewrite_plan.json | JSON object | schemas/rewrite_plan.schema.json | Section-drafter(s), voice-editor if applicable |

## Quality Gate (QA Gate)

**Pass Criteria:**
- ✅ All 7 standard QA perspectives applied (reader, skeptic, domain, style, coherence, AI-stink, final)
- ✅ All perspective outputs present in review_report
- ✅ Every issue has: severity, location, description, suggested fix
- ✅ No vague or unactionable items
- ✅ Blocking issues resolved or escalated with documented path
- ✅ Gate decision (ACCEPT/REVISE/BLOCK) recorded with justification
- ✅ If ACCEPT: document meets all success criteria from brief

**Fail Criteria:**
- ❌ Perspectives missing or incomplete
- ❌ Issues vague ("this section feels weak" without detail)
- ❌ Blocking issues not addressed
- ❌ Gate decision unjustified
- ❌ Success criteria not checked

**Gate Decisions:**
- **ACCEPT:** No blocking issues, document meets success criteria → advance to artifact workflow
- **REVISE:** Blocking or revise issues found → return to drafting with rewrite_plan.json
- **BLOCK:** Critical blocker (canon conflict, fails brief purpose) → cannot proceed until resolved

**On BLOCK:**
- Call `save_blocker` with classification (B8 or B9)
- Run status set to 'paused' if severity='blocking'
- Document specific resolution required
- Create detailed rewrite plan or escalation path

## Related Commands
- /qa-reader
- /qa-skeptic
- /qa-domain
- /qa-style
- /qa-coherence
- /qa-ai-stink
- /qa-final
- /orchestrate-review

## Related Agents
- lead-editor (owner, aggregator, gate reviewer)
- qa-reader
- qa-skeptic
- qa-domain
- qa-style
- qa-coherence
- qa-ai-stink
- qa-final
- adversarial-reviewer (optional, for high-stakes documents)
- canon-checker (escalation for canon conflicts)
- voice-editor (escalation for pervasive AI-stink)

## Cache-Server Integration

**Tools Used:**
- `fetch_run_context` — Get full_draft.md, merge_report.json, brief.json from prior phases
- `save_step` — Record each execution step (8 steps total)
- `save_artifact` — Store QA outputs (7 perspectives), review_report.json, rewrite_plan.json
- `list_run_artifacts` — Collect all QA perspective outputs
- `save_blocker` — Record blockers (B8/B9)
- `save_resume_point` — Create post-review checkpoint if ACCEPT

**Artifacts Produced:**
- 7 × QA outputs (artifact_type='qa-output', one per perspective)
- review_report.json (artifact_type='structured-data')
- rewrite_plan.json (artifact_type='structured-data', if REVISE or BLOCK)

**Fallback (if cache-server unavailable):**
- Write QA outputs to `artifacts/review/qa/[perspective]-issues.json`
- Write review_report.json to `artifacts/review/[timestamp]-review-report.json`
- Write rewrite_plan.json to `artifacts/review/[timestamp]-rewrite-plan.json`
- Continue execution (B5 degraded blocker)

## Cross-References
- `schemas/review_report.schema.json` — primary output format
- `schemas/rewrite_plan.schema.json` — revision output format
- `workflows/drafting.md` — produces the draft input
- `workflows/qa.md` — defines QA perspectives in detail
- `doctrine/QUALITY_GATES.md` — QA Gate criteria
- `doctrine/VOICE_MODEL.md` — AI-stink detection checklist
- `doctrine/AUTONOMOUS_EXECUTION.md` — Type 1/2/3 decision rules
- `agents/lead-editor.md` — Lead-editor specification
- `agents/qa-*.md` — QA agent specifications
