# Outline Workflow

**Status:** Phase 6 — Executable
**Owner:** outline-architect
**Trigger:** /write-outline or /orchestrate-outline, after brief gate passes
**Output:** outline.json (saved to cache-server)
**Cache Integration:** Uses cache-server for run tracking and artifact storage

## Purpose
Translate an approved brief into a structured document outline that defines all sections, their individual purposes, and their scope. The outline is the contract between the brief and the draft — every section drafter reads it and knows exactly what to write.

## Inputs
| Input | Type | Required | Source |
|-------|------|----------|--------|
| brief.json | JSON object | Yes | Brief workflow — must pass Brief Gate |
| style_pack | string (identifier) | Yes | From brief.json |
| research_report | object | No | Research workflow — informs section structure if available |
| existing_doc_structure | object | No | If extending an existing document |

## Execution Steps

### Step 1: Initialize Outline Phase (outline-architect)
- Receive run_id with brief artifact from prior phase
- Call `fetch_run_context(run_id)` to get brief.json artifact
- Call `save_step`: step_name='outline-init', agent='outline-architect', status='completed'

### Step 2: Load Brief and Context (outline-architect)
- Read brief.json from cache-server artifacts
- Extract: document_type, scope, audience, constraints, success_criteria
- Load style pack from brief.style_pack_identifier
- Query guide-server for domain-specific templates and rubrics
- Call `save_step`: step_name='context-load', agent='outline-architect', status='completed'

### Step 3: Select Template (outline-architect)
- **Type 1:** If template exists for document_type in `.writing-framework/templates/`, use it and log
- **Type 2:** If multiple templates match, choose most specific and flag alternatives
- **Type 3:** If no template exists, use generic structure (flag as B2 blocker with degraded severity)
- Record template selection in outline.template_used
- Call `save_step`: step_name='template-selection', agent='outline-architect', status='completed'

### Step 4: Define Sections (outline-architect)
- For each section from template or inferred from brief:
  - Assign section_id (S1, S2, S3, etc.)
  - Define title (reader-facing)
  - Define level (1=top-level, 2=subsection, etc.)
  - Define purpose: what this section does for the reader (not what it covers)
  - Define required_content: specific items that must appear
  - Map source_refs: which sources apply to this section
  - Estimate word count based on purpose and required_content
- **Structure before style:** Focus on logical organization, not prose
- Call `save_step`: step_name='section-definition', agent='outline-architect', status='completed'

### Step 5: Verify Section Distinctness (outline-architect)
- Check each pair of sections for overlapping purposes
- If overlap found: merge sections or clarify distinct purposes
- Each section must do something unique for the reader
- Document any merged or split sections
- Call `save_step`: step_name='distinctness-check', agent='outline-architect', status='completed'

### Step 6: Verify Section Order (outline-architect)
- **Type 1:** If order is reader-logical (each builds on prior), use it and log
- **Type 2:** If multiple valid orderings exist, choose reader-first and flag
- Justify section order in structure_justification field
- Verify no forward references (section N doesn't assume knowledge from section N+1)
- Call `save_step`: step_name='order-verification', agent='outline-architect', status='completed'

### Step 7: Verify Word Count (outline-architect)
- Sum estimated_words across all sections
- Compare to brief.constraints.word_count_range
- **If within range:** Proceed
- **If exceeds max:** Compress section scopes, re-estimate, document compression
- **If below min:** Expand section scopes or add sections, document expansion
- Call `save_step`: step_name='word-count-check', agent='outline-architect', status='completed'

### Step 8: Produce Outline (outline-architect)
- Format outline.json per schemas/outline.schema.json
- Validate all required fields populated
- Self-check: Can section-drafter draft any section without asking questions?
- Call `save_artifact`: artifact_type='structured-data', content=outline.json
- Call `save_step`: step_name='outline-production', agent='outline-architect', status='completed'

### Step 9: Outline Gate Review (lead-editor)
- Verify every section has title, purpose, estimated_words
- Verify no overlapping purposes
- Verify section order justified
- Verify total_estimated_words within brief constraints (or deviation documented)
- **Gate Decision:**
  - **ACCEPT:** All criteria met, advance to drafting workflow
  - **REVISE:** Specific issues identified, return to outline-architect
  - **BLOCK:** Critical blocker, cannot proceed
- Call `save_step`: step_name='outline-gate', agent='lead-editor', status='completed', output_summary includes gate decision
- If ACCEPT: Call `save_resume_point`: checkpoint_name='post-outline', state includes outline artifact_id
- If BLOCK: Call `save_blocker` with specific blocker classification

## Decision Points and Autonomy Rules

### Type 1 Decisions (Infer and Proceed)
- **Template exists for document type:** Use it, log selection
- **Section order reader-logical:** Use logical order, log justification
- **Section purposes distinct:** Proceed with structure
- **Word count within brief range:** Proceed to gate review

### Type 2 Decisions (Infer and Flag)
- **Multiple templates match:** Choose most specific, flag alternatives
- **Multiple valid section orders:** Choose reader-first, flag alternatives
- **Word count slightly outside range:** Adjust and flag deviation
- **Template partially matches:** Adapt template, flag adaptations

### Type 3 Decisions (Must Ask)
- **Brief scope too large for single document:** Ask to decompose or compress scope
- **Contradictory section requirements:** Ask to resolve contradiction
- **Required sections conflict with word count:** Ask to prioritize or expand range

### Blocker Scenarios
- **B1 (missing-user-decision):** Scope decomposition needed, contradictory requirements
- **B2 (missing-repo-context):** No template + no generic structure available (degraded)
- **B3 (missing-guide):** Required rubric for section structure missing (degraded)
- **B9 (validation-failure):** outline.json doesn't validate against schema

## Outputs
| Output | Type | Schema | Destination |
|--------|------|--------|-------------|
| outline.json | JSON object | schemas/outline.schema.json | Drafting workflow, all section drafters |
| template_selection_record | string | Inline in outline.template_used | Cache-server |

## Quality Gate (Outline Gate)

**Pass Criteria:**
- ✅ Every section has: section_id, title, level, purpose, required_content, estimated_words
- ✅ No two sections have overlapping purposes
- ✅ Section order justified in structure_justification
- ✅ Total estimated_words within brief constraints (or deviation documented)
- ✅ outline.json validates against schema
- ✅ Section-drafter can draft any section without asking questions
- ✅ Template selection documented

**Fail Criteria:**
- ❌ Sections missing required fields
- ❌ Overlapping section purposes
- ❌ Section order unjustified or illogical
- ❌ Word count deviation undocumented
- ❌ Vague section purposes ("cover topic X")

**Gate Decisions:**
- **ACCEPT:** All pass criteria met → advance to drafting workflow
- **REVISE:** Specific issues identified → return with revision list
- **BLOCK:** Critical blocker → cannot proceed until resolved

**On BLOCK:**
- Call `save_blocker` with classification and description
- Run status set to 'paused' if severity='blocking'
- Document specific resolution required

## Related Commands
- /write-outline
- /orchestrate-outline

## Related Agents
- outline-architect (primary executor)
- lead-editor (gate reviewer)

## Cache-Server Integration

**Tools Used:**
- `fetch_run_context` — Get brief.json from prior phase
- `save_step` — Record each execution step (9 steps total)
- `save_artifact` — Store outline.json
- `save_blocker` — Record blockers (B1/B2/B3/B9)
- `save_resume_point` — Create post-outline checkpoint

**Artifacts Produced:**
- outline.json (artifact_type='structured-data')
- Revision list if gate decision is REVISE

**Fallback (if cache-server unavailable):**
- Write outline.json to `artifacts/outline/[timestamp]-outline.json`
- Continue execution (B5 degraded blocker)

## Cross-References
- `schemas/outline.schema.json` — output format
- `schemas/brief.schema.json` — required input format
- `workflows/brief.md` — produces the brief.json input
- `workflows/drafting.md` — consumes outline.json as required input
- `doctrine/QUALITY_GATES.md` — Outline Gate criteria
- `doctrine/AUTONOMOUS_EXECUTION.md` — Type 1/2/3 decision rules
- `templates/` — outline templates directory
- `agents/outline-architect.md` — Agent specification
