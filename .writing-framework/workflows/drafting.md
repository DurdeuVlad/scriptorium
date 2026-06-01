# Drafting Workflow

**Status:** Phase 6 — Executable
**Owner:** lead-orchestrator
**Trigger:** /draft-document or /orchestrate-draft, after outline gate passes
**Output:** full_draft.md + merge_report.json (saved to cache-server)
**Cache Integration:** Uses cache-server for run tracking, parallel section drafting, and merge normalization
**Key Principle:** Drafting and editing are separate — section-drafter produces content, merge-normalizer assembles and normalizes voice

## Purpose
Produce the full document draft from an approved outline, using parallel section drafting and merge normalization. Each section is drafted independently to maximize throughput; the merge-normalizer assembles sections and resolves voice inconsistencies before the draft advances to QA.

## Inputs
| Input | Type | Required | Source |
|-------|------|----------|--------|
| outline.json | JSON object | Yes | Outline workflow — must pass Outline Gate |
| brief.json | JSON object | Yes | Brief workflow — context and constraints for all drafters |
| style_pack | string (identifier) | Yes | From brief.json |
| research_report | object | No | Research workflow — source material for section drafters |
| canon_guides | array of guide objects | No | Queried per section from guide-server |

## Execution Steps

### Step 1: Initialize Drafting Phase (lead-orchestrator)
- Receive run_id with outline and brief artifacts from prior phases
- Call `fetch_run_context(run_id)` to get outline.json and brief.json
- Call `save_step`: step_name='drafting-init', agent='lead-orchestrator', status='completed'

### Step 2: Plan Section Drafting (lead-orchestrator)
- Read outline.json: extract all sections with section_id, title, purpose, required_content
- Identify top-level sections (level=1) for parallel drafting
- Identify complex subsections (level=2+) that warrant independent drafting
- Create drafting plan: list of section_ids to draft in parallel
- Call `save_step`: step_name='drafting-plan', agent='lead-orchestrator', status='completed'

### Step 3: Parallel Section Drafting (section-drafter × N)
- **For each section in parallel:**
  - Read assigned section spec from outline.json
  - Read full brief.json for context (audience, purpose, constraints, success_criteria)
  - Load style pack from brief.style_pack_identifier
  - Query guide-server for canon guides relevant to section
  - **Draft to spec:** Write section content fulfilling section.purpose and section.required_content
  - **Structure before style:** Focus on completeness and accuracy, not polish
  - **Note voice decisions:** Record any style choices made (tone, vocabulary, structure)
  - **Flag issues:** Document blockers (B4 missing sources), scope deviations, uncertainties
  - Call `save_artifact`: artifact_type='intermediate-draft', content=section markdown, metadata includes section_id
  - Call `save_step`: step_name='section-draft', agent='section-drafter', output_summary includes section_id and status

### Step 4: Collect Section Outputs (lead-orchestrator)
- Query cache-server: `list_run_artifacts(run_id, artifact_type='intermediate-draft')`
- Verify all planned sections are present
- **If sections missing:** Check for blockers via `fetch_run_context`
- **If blocked sections:** Document in merge_report, create placeholders
- **If all present:** Proceed to merge
- Call `save_step`: step_name='section-collection', agent='lead-orchestrator', status='completed'

### Step 5: Assemble Draft (merge-normalizer)
- Read outline.json for section order
- Retrieve all section artifacts in outline order
- Assemble sections into single markdown document
- Insert section breaks and formatting per style pack
- **No content changes yet** — assembly only
- Call `save_step`: step_name='draft-assembly', agent='merge-normalizer', status='completed'

### Step 6: Voice Analysis (merge-normalizer)
- Read all voice_notes from section drafters
- Analyze assembled draft for voice inconsistencies:
  - Tone shifts (formal → informal or vice versa)
  - Vocabulary inconsistencies (technical terms used inconsistently)
  - Sentence structure patterns (varied rhythm vs. uniform)
  - Formatting inconsistencies (headers, lists, emphasis)
- Identify sections with voice divergence from style pack
- **Critique before rewrite** — document issues before fixing
- Call `save_step`: step_name='voice-analysis', agent='merge-normalizer', status='completed'

### Step 7: Voice Normalization (merge-normalizer)
- **Type 1 (Auto-normalize):** Minor inconsistencies (capitalization, formatting) → fix automatically
- **Type 2 (Normalize and flag):** Moderate inconsistencies (tone shifts) → normalize and flag in merge_report
- **Type 3 (Escalate):** Severe inconsistencies (>30% of content) → escalate to voice-editor, do not auto-normalize
- Apply normalization to match style pack voice model
- **Preserve meaning:** Voice changes only, no content changes
- Document all normalizations in merge_report
- Call `save_step`: step_name='voice-normalization', agent='merge-normalizer', status='completed'

### Step 8: Produce Merge Report (merge-normalizer)
- Format merge_report.json per schemas/merge_report.schema.json
- Include: section_status (complete/partial/blocked), voice_issues (found and resolved), normalizations_applied, flagged_issues
- For each section: status, word_count, voice_notes, issues
- Overall: total_word_count, voice_consistency_score, escalations
- Call `save_artifact`: artifact_type='structured-data', content=merge_report.json
- Call `save_step`: step_name='merge-report', agent='merge-normalizer', status='completed'

### Step 9: Save Assembled Draft (merge-normalizer)
- Save normalized draft as full_draft.md
- Call `save_artifact`: artifact_type='draft', content=full_draft.md
- Call `save_step`: step_name='draft-save', agent='merge-normalizer', status='completed'

### Step 10: Draft Gate Review (lead-editor)
- Read full_draft.md and merge_report.json
- Verify all sections from outline present (or documented as blocked)
- Verify voice consistency or inconsistencies documented
- Verify no placeholders unless documented with resume notes
- **Gate Decision:**
  - **ACCEPT:** All sections present, voice consistent → advance to review workflow
  - **REVISE:** Specific sections need revision → return with revision plan
  - **BLOCK:** Critical blocker (>50% sections blocked) → cannot proceed
- Call `save_step`: step_name='draft-gate', agent='lead-editor', status='completed', output_summary includes gate decision
- If ACCEPT: Call `save_resume_point`: checkpoint_name='post-draft', state includes draft and merge_report artifact_ids
- If BLOCK: Call `save_blocker` with specific blocker classification

## Decision Points and Autonomy Rules

### Type 1 Decisions (Infer and Proceed)
- **Section spec clear from outline:** Draft to spec, log approach
- **Minor voice inconsistencies:** Auto-normalize, log changes
- **Section within estimated word count:** Proceed
- **All sections complete:** Advance to review workflow

### Type 2 Decisions (Infer and Flag)
- **Section scope interpretation:** Choose conservative, flag interpretation
- **Moderate voice inconsistencies:** Normalize and flag in merge_report
- **Section word count deviation <20%:** Accept and flag deviation
- **Missing optional sources:** Proceed without, flag gap

### Type 3 Decisions (Must Ask)
- **Section blocked by missing critical source:** B4 blocker, create placeholder, ask for source
- **Severe voice inconsistency (>30% content):** Escalate to voice-editor
- **Section scope fundamentally unclear:** B1 blocker, ask for clarification
- **Multiple sections blocked (>50% scope):** Escalate to lead-orchestrator

### Blocker Scenarios
- **B1 (missing-user-decision):** Section scope unclear, contradictory requirements
- **B4 (missing-source-material):** Critical sources missing for section
- **B7 (schema-conflict):** Section output doesn't match expected format
- **B9 (validation-failure):** Draft incomplete, required sections missing

### Separation of Concerns
- **section-drafter:** Produces content, notes voice decisions, flags issues — does NOT edit other sections
- **merge-normalizer:** Assembles, analyzes voice, normalizes inconsistencies — does NOT create new content
- **lead-editor:** Reviews gates, makes gate decisions — does NOT draft or normalize
- **voice-editor:** Handles severe voice issues (escalation only) — does NOT participate in normal drafting

## Outputs
| Output | Type | Schema | Destination |
|--------|------|--------|-------------|
| full_draft.md | Markdown file | — | QA workflow, artifact workflow |
| merge_report.json | JSON object | schemas/merge_report.schema.json | Lead-editor, QA workflow |
| per_section_voice_notes | array of strings | Inline in merge_report | Merge-normalizer, lead-editor |
| flagged_issues | array of objects | Inline in merge_report | Lead-editor |

## Quality Gate (Draft Gate)

**Pass Criteria:**
- ✅ All sections from outline present (or documented as blocked with resume notes)
- ✅ No undocumented placeholders
- ✅ Voice consistent across sections (or inconsistencies documented in merge_report)
- ✅ merge_report.json complete with all section statuses
- ✅ Total word count within reasonable range of outline estimate (±30%)
- ✅ All flagged issues documented in merge_report
- ✅ Draft ready for QA (can be reviewed against brief and outline)

**Fail Criteria:**
- ❌ Sections missing without documentation
- ❌ Placeholders without resume notes
- ❌ Severe voice inconsistency not escalated
- ❌ merge_report incomplete or missing
- ❌ Word count deviation >50% undocumented

**Gate Decisions:**
- **ACCEPT:** All pass criteria met → advance to review workflow
- **REVISE:** Specific sections need revision → return with revision plan
- **BLOCK:** Critical blocker (>50% sections blocked, severe voice issues) → cannot proceed

**On BLOCK:**
- Call `save_blocker` with classification and description
- Run status set to 'paused' if severity='blocking'
- Document specific resolution required
- Create resume plan for blocked sections

## Related Commands
- /draft-section
- /draft-document
- /merge-draft
- /orchestrate-draft

## Related Agents
- lead-orchestrator (owner)
- section-drafter (parallel executor, one per section)
- merge-normalizer (assembly and voice normalization)
- lead-editor (gate reviewer)

## Cache-Server Integration

**Tools Used:**
- `fetch_run_context` — Get outline.json and brief.json from prior phases
- `save_step` — Record each execution step (10 steps total)
- `save_artifact` — Store section drafts (intermediate-draft), full_draft.md (draft), merge_report.json (structured-data)
- `list_run_artifacts` — Collect all section drafts
- `save_blocker` — Record blockers (B1/B4/B7/B9)
- `save_resume_point` — Create post-draft checkpoint

**Artifacts Produced:**
- N × section drafts (artifact_type='intermediate-draft', one per section)
- full_draft.md (artifact_type='draft')
- merge_report.json (artifact_type='structured-data')

**Fallback (if cache-server unavailable):**
- Write section drafts to `artifacts/drafts/sections/[section_id].md`
- Write full_draft.md to `artifacts/drafts/[timestamp]-full-draft.md`
- Write merge_report.json to `artifacts/drafts/[timestamp]-merge-report.json`
- Continue execution (B5 degraded blocker)

## Cross-References
- `schemas/outline.schema.json` — required input format
- `schemas/brief.schema.json` — required input format
- `schemas/merge_report.schema.json` — output format
- `workflows/outline.md` — produces outline.json input
- `workflows/review.md` — consumes full draft as input
- `doctrine/QUALITY_GATES.md` — Draft Gate criteria
- `doctrine/VOICE_MODEL.md` — voice normalization reference
- `doctrine/AUTONOMOUS_EXECUTION.md` — Type 1/2/3 decision rules
- `agents/section-drafter.md` — Section drafter specification
- `agents/merge-normalizer.md` — Merge-normalizer specification
