# Phase 11 Specification — Core Writing Pipeline

**Status:** IMPLEMENTED (verification pending)  
**Priority:** CRITICAL (blocks all writing functionality)  
**Timeline:** 4-6 weeks  
**Effort:** 60-80 hours

---

## Objective

Make the end-to-end writing pipeline operational from brief to merged draft. Transform specifications into executable commands that agents can use to produce structured, review-ready documents.

---

## Success Criteria

**Minimum Viable Product:**
1. Can execute `/write-brief` and receive valid `brief.json`
2. Can execute `/write-outline` from brief and receive valid `outline.json`
3. Can execute `/draft-section` and receive markdown section
4. Can execute `/draft-document` and receive complete draft
5. Brief Gate blocks invalid briefs
6. Outline Gate blocks invalid outlines
7. All outputs saved to cache-server
8. Can resume from failure

**Validation:**
- Test with `evals/cases/case-01-technical-docs.md`
- Artifact quality score ≥ 35/40
- Process reliability score ≥ 35/40
- All 3 injected blockers detected
- Resume capability functional

---

## Deliverables

### 1. Command Implementations (8 commands)

#### `/write-brief`
**Purpose:** Generate brief from discovery report and user requirements

**Inputs:**
- `discovery_report_id` (optional, from cache-server)
- `user_requirements` (string or structured)
- `domain` (optional: technical, dnd, research, card-game)

**Process:**
1. Load discovery report from cache-server (if provided)
2. Query guide-server for applicable templates
3. Invoke `brief-writer` agent
4. Validate output against `brief.schema.json`
5. Run Brief Gate validation (via `pre-phase-advance` hook)
6. Save to cache-server
7. Return `brief.json`

**Outputs:**
- `brief.json` (validated against schema)
- `run_step` logged to cache-server

**Error handling:**
- If Brief Gate fails: return gate failure report, create resume point
- If schema validation fails: return validation errors
- If guide-server unavailable: continue with defaults, log warning

**Implementation file:** `.claude/commands/write-brief.md`

**Example usage:**
```
/write-brief
User requirements: Write an API reference guide for a REST API that manages tasks
Domain: technical
```

---

#### `/write-outline`
**Purpose:** Generate outline from brief

**Inputs:**
- `brief_id` (from cache-server)
- `template_override` (optional)

**Process:**
1. Load brief from cache-server
2. Query guide-server for applicable templates
3. Invoke `outline-architect` agent
4. Validate output against `outline.schema.json`
5. Run Outline Gate validation
6. Save to cache-server
7. Return `outline.json`

**Outputs:**
- `outline.json` (validated against schema)
- `run_step` logged to cache-server

**Error handling:**
- If Outline Gate fails: return gate failure report, create resume point
- If brief not found: return error, suggest running `/write-brief`

**Implementation file:** `.claude/commands/write-outline.md`

---

#### `/draft-section`
**Purpose:** Draft a single section from outline

**Inputs:**
- `outline_id` (from cache-server)
- `section_id` (from outline)
- `style_pack` (optional override)

**Process:**
1. Load outline from cache-server
2. Extract section spec by `section_id`
3. Load brief from cache-server (for context)
4. Query guide-server for style pack, rubrics, canon
5. Invoke `section-drafter` agent
6. Save draft to cache-server
7. Return markdown section

**Outputs:**
- Markdown section content
- `run_step` logged to cache-server

**Error handling:**
- If section_id not found: return error with available section_ids
- If style pack not found: use default, log warning

**Implementation file:** `.claude/commands/draft-section.md`

---

#### `/draft-document`
**Purpose:** Orchestrate full document draft by calling `/draft-section` for each section

**Inputs:**
- `outline_id` (from cache-server)
- `parallel` (boolean, default: false)

**Process:**
1. Load outline from cache-server
2. For each section in outline:
   - Call `/draft-section` with section_id
   - Save section draft to cache-server
   - Log progress
3. Return list of drafted section_ids

**Outputs:**
- List of `section_id` → `draft_id` mappings
- `run_step` logged to cache-server

**Error handling:**
- If section draft fails: log error, continue with remaining sections
- Create resume point after each section (partial completion)

**Implementation file:** `.claude/commands/draft-document.md`

---

#### `/merge-draft`
**Purpose:** Merge section drafts into coherent document, run normalization

**Inputs:**
- `outline_id` (from cache-server)
- `section_draft_ids` (list of draft_ids from cache-server)

**Process:**
1. Load all section drafts from cache-server
2. Load outline for structure
3. Invoke `merge-normalizer` agent
4. Run normalization pass:
   - Consistent heading levels
   - Smooth transitions between sections
   - Remove duplicate content
   - Normalize voice/style
5. Validate against Draft Gate
6. Generate `merge_report.json`
7. Save merged draft to cache-server
8. Return merged markdown

**Outputs:**
- Merged markdown document
- `merge_report.json` (changes made, issues found)
- `run_step` logged to cache-server

**Error handling:**
- If Draft Gate fails: return gate failure report
- If normalization finds issues: include in merge_report, don't block

**Implementation file:** `.claude/commands/merge-draft.md`

---

#### `/rewrite`
**Purpose:** Revise draft based on rewrite plan (from QA or user)

**Inputs:**
- `draft_id` (from cache-server)
- `rewrite_plan` (structured changes to make)

**Process:**
1. Load draft from cache-server
2. Parse rewrite plan
3. Apply changes section-by-section
4. Validate changes don't break structure
5. Save revised draft to cache-server
6. Return revised markdown

**Outputs:**
- Revised markdown
- `run_step` logged to cache-server

**Error handling:**
- If rewrite plan invalid: return validation errors
- If changes break structure: revert, return error

**Implementation file:** `.claude/commands/rewrite.md`

---

#### `/validate-brief`
**Purpose:** Validate brief against schema and Brief Gate

**Inputs:**
- `brief_id` (from cache-server) OR
- `brief_json` (inline JSON)

**Process:**
1. Load or parse brief
2. Validate against `brief.schema.json`
3. Run Brief Gate checks
4. Return validation report

**Outputs:**
- Validation report (pass/fail, errors, warnings)

**Implementation file:** `.claude/commands/validate-brief.md`

---

#### `/validate-outline`
**Purpose:** Validate outline against schema and Outline Gate

**Inputs:**
- `outline_id` (from cache-server) OR
- `outline_json` (inline JSON)

**Process:**
1. Load or parse outline
2. Validate against `outline.schema.json`
3. Run Outline Gate checks
4. Return validation report

**Outputs:**
- Validation report (pass/fail, errors, warnings)

**Implementation file:** `.claude/commands/validate-outline.md`

---

### 2. Agent Implementations (4 agents)

#### `brief-writer`
**Purpose:** Generate briefs from discovery reports and user requirements

**Canonical spec:** `.writing-framework/agents/brief-writer.md`  
**Implementation:** `.claude/agents/brief-writer.md`

**Behavior:**
1. **Analyze inputs:**
   - Parse user requirements
   - Extract audience, purpose, scope from discovery report (if provided)
   - Identify domain (technical, dnd, research, card-game)

2. **Query guide-server:**
   - Get brief template for domain
   - Get relevant style packs
   - Get rubrics for brief evaluation

3. **Generate brief:**
   - Define audience (who, knowledge level, needs)
   - Define purpose (what document accomplishes, not what it covers)
   - Define scope (in_scope ≥3 items, out_of_scope ≥2 items)
   - Define success criteria (≥3 checkable criteria, not subjective)
   - Define constraints (word count range, format, style)
   - List source materials (files, URLs)
   - List open questions (Type 3 decisions only)

4. **Validate:**
   - Check against `brief.schema.json`
   - Self-check against Brief Gate criteria
   - Fix any issues before returning

5. **Return:**
   - `brief.json` (validated)

**Decision making:**
- **Type 1 decisions:** Infer from context (e.g., format = markdown if not specified)
- **Type 2 decisions:** Use reasonable defaults, flag in open_questions
- **Type 3 decisions:** Flag in open_questions, block until user decides

**Escalation:**
- If user requirements too vague: escalate to user for clarification
- If conflicting requirements: escalate to user for resolution

---

#### `outline-architect`
**Purpose:** Generate outlines from briefs

**Canonical spec:** `.writing-framework/agents/outline-architect.md`  
**Implementation:** `.claude/agents/outline-architect.md`

**Behavior:**
1. **Analyze brief:**
   - Extract in_scope items
   - Extract success criteria
   - Extract constraints (word count, format)
   - Identify domain

2. **Query guide-server:**
   - Get outline template for domain
   - Get structural patterns
   - Get rubrics for outline evaluation

3. **Generate outline:**
   - Create section hierarchy (H1 → H2 → H3)
   - Assign section_id to each section
   - Define section purpose (what it does for reader, not what it covers)
   - Define required_content for each section
   - Estimate word count per section
   - Justify structure in structure_justification field
   - Ensure total estimated_words within brief constraints (±10%)

4. **Validate:**
   - Check against `outline.schema.json`
   - Self-check against Outline Gate criteria:
     - No overlapping section purposes
     - Order justified
     - All brief requirements mapped to sections
   - Fix any issues before returning

5. **Return:**
   - `outline.json` (validated)

**Decision making:**
- **Type 1:** Infer section order from logical flow
- **Type 2:** Choose template if multiple applicable, flag choice
- **Type 3:** Flag structural ambiguities in open_questions

---

#### `section-drafter`
**Purpose:** Draft individual sections from outline specs

**Canonical spec:** `.writing-framework/agents/section-drafter.md`  
**Implementation:** `.claude/agents/section-drafter.md`

**Behavior:**
1. **Load context:**
   - Section spec from outline (purpose, required_content, estimated_words)
   - Brief (audience, purpose, constraints)
   - Previous sections (for continuity)

2. **Query guide-server:**
   - Get style pack for domain
   - Get rubrics for section evaluation
   - Get canon (if applicable)
   - Get anti-patterns to avoid

3. **Draft section:**
   - Follow section purpose
   - Include all required_content
   - Target estimated_words (±20%)
   - Apply style pack rules
   - Avoid anti-patterns
   - Ground claims in sources (if research domain)
   - Check canon consistency (if D&D domain)

4. **Self-review:**
   - Check completeness (all required_content present)
   - Check clarity (appropriate for audience)
   - Check style adherence
   - Fix issues before returning

5. **Return:**
   - Markdown section content

**Decision making:**
- **Type 1:** Choose examples, phrasing, structure
- **Type 2:** Choose level of detail, flag if uncertain
- **Type 3:** Flag content gaps, missing sources

---

#### `merge-normalizer`
**Purpose:** Merge section drafts into coherent document

**Canonical spec:** `.writing-framework/agents/merge-normalizer.md`  
**Implementation:** `.claude/agents/merge-normalizer.md`

**Behavior:**
1. **Load all sections:**
   - Section drafts in outline order
   - Outline structure
   - Brief constraints

2. **Merge sections:**
   - Concatenate in outline order
   - Preserve heading hierarchy

3. **Normalize:**
   - **Heading levels:** Ensure H1 → H2 → H3 (no skips)
   - **Transitions:** Add/improve transitions between sections
   - **Duplicates:** Remove duplicate content across sections
   - **Voice:** Normalize voice/style across sections
   - **References:** Ensure consistent citation format (if research)
   - **Terminology:** Ensure consistent terminology

4. **Generate merge_report:**
   - List changes made
   - List issues found (but not blocking)
   - List warnings (e.g., word count over/under)

5. **Return:**
   - Merged markdown document
   - `merge_report.json`

**Decision making:**
- **Type 1:** Choose transition phrasing, fix duplicates
- **Type 2:** Choose normalization approach, flag if uncertain
- **Type 3:** Flag structural issues that need user decision

---

### 3. Schema Finalization

#### `merge_report.schema.json`
**Location:** `.writing-framework/schemas/merge_report.schema.json`

**Structure:**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Merge Report",
  "type": "object",
  "required": ["merge_id", "outline_id", "section_draft_ids", "changes_made", "issues_found", "warnings", "final_word_count"],
  "properties": {
    "merge_id": {"type": "string"},
    "outline_id": {"type": "string"},
    "section_draft_ids": {"type": "array", "items": {"type": "string"}},
    "changes_made": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["change_type", "description", "location"],
        "properties": {
          "change_type": {"enum": ["heading_level", "transition", "duplicate_removal", "voice_normalization", "terminology"]},
          "description": {"type": "string"},
          "location": {"type": "string"}
        }
      }
    },
    "issues_found": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["issue_type", "severity", "description", "location"],
        "properties": {
          "issue_type": {"type": "string"},
          "severity": {"enum": ["critical", "major", "minor"]},
          "description": {"type": "string"},
          "location": {"type": "string"}
        }
      }
    },
    "warnings": {"type": "array", "items": {"type": "string"}},
    "final_word_count": {"type": "integer"}
  }
}
```

---

#### `rewrite_plan.schema.json`
**Location:** `.writing-framework/schemas/rewrite_plan.schema.json`

**Structure:**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Rewrite Plan",
  "type": "object",
  "required": ["plan_id", "draft_id", "changes"],
  "properties": {
    "plan_id": {"type": "string"},
    "draft_id": {"type": "string"},
    "changes": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["change_type", "location", "action"],
        "properties": {
          "change_type": {"enum": ["add", "remove", "replace", "reorder", "rephrase"]},
          "location": {"type": "string"},
          "action": {"type": "string"},
          "rationale": {"type": "string"}
        }
      }
    }
  }
}
```

---

### 4. Hook Integration

#### `pre-phase-advance` Hook
**Must enforce:**
- Brief Gate before advancing to outline
- Outline Gate before advancing to draft
- Draft Gate before advancing to review

**Implementation:** Already specified in `.claude/hooks/pre-phase-advance.md`

**Integration points:**
- `/write-brief` → calls hook before returning
- `/write-outline` → calls hook before returning
- `/merge-draft` → calls hook before returning

---

#### `on-failure` Hook
**Must handle:**
- Gate failures (create resume point, suggest fixes)
- Validation failures (return errors, suggest corrections)
- MCP failures (retry, fallback, log)

**Implementation:** Already specified in `.claude/hooks/on-failure.md`

**Integration points:**
- All commands call on-failure if error occurs
- Resume points saved to cache-server

---

### 5. MCP Integration

#### guide-server Integration
**Commands that query guide-server:**
- `/write-brief` → get brief templates
- `/write-outline` → get outline templates
- `/draft-section` → get style packs, rubrics, canon, anti-patterns

**Tools used:**
- `search_guides` — Full-text search for guides
- `get_guide` — Retrieve specific guide by ID
- `list_guides` — List guides by type

---

#### cache-server Integration
**Commands that use cache-server:**
- All commands save run_steps
- `/write-brief` → save brief
- `/write-outline` → save outline, load brief
- `/draft-section` → save section draft, load outline/brief
- `/draft-document` → orchestrate, save progress
- `/merge-draft` → load section drafts, save merged draft

**Tools used:**
- `create_run` — Start new run
- `log_step` — Log workflow step
- `save_artifact` — Save brief/outline/draft
- `load_artifact` — Load brief/outline/draft
- `create_resume_point` — Save resume state
- `load_resume_point` — Restore resume state

---

#### artifact-server Integration
**Commands that use artifact-server:**
- `/merge-draft` → optionally create artifact
- Future: `/export` command will use artifact-server

**Tools used:**
- `create_markdown` — Create artifact from draft
- `validate_artifact` — Validate artifact

---

## Implementation Order

### Week 1-2: Brief Generation
1. Implement `/write-brief` command
2. Implement `brief-writer` agent
3. Integrate with guide-server (templates)
4. Integrate with cache-server (save brief)
5. Test with simple requirements
6. Validate against Brief Gate

**Milestone:** Can generate valid briefs

---

### Week 3-4: Outline Generation & Section Drafting
1. Implement `/write-outline` command
2. Implement `outline-architect` agent
3. Implement `/draft-section` command
4. Implement `section-drafter` agent
5. Integrate with guide-server (style packs, rubrics)
6. Test with case-01 brief

**Milestone:** Can generate outlines and draft individual sections

---

### Week 5-6: Document Orchestration & Merging
1. Implement `/draft-document` orchestration
2. Implement `/merge-draft` command
3. Implement `merge-normalizer` agent
4. Create `merge_report.schema.json`
5. Create `rewrite_plan.schema.json`
6. Implement `/rewrite` command
7. Full end-to-end test with case-01

**Milestone:** Can generate complete documents end-to-end

---

## Testing Strategy

### Unit Tests
- Each command tested independently
- Mock MCP responses
- Validate outputs against schemas

### Integration Tests
- Commands call real MCPs
- Validate MCP integration
- Test error handling

### End-to-End Tests
- Full workflow: brief → outline → draft → merge
- Test with `evals/cases/case-01-technical-docs.md`
- Validate against evaluation rubrics

### Acceptance Tests
- Artifact quality score ≥ 35/40
- Process reliability score ≥ 35/40
- All 3 blockers detected
- Resume capability works

---

## Success Metrics

**Phase 11 complete when:**
- [x] All 8 commands implemented
- [x] All 4 agents implemented
- [x] All schemas finalized
- [x] MCP integration functional
- [x] Hook integration functional
- [ ] Case-01 passes end-to-end
- [ ] Artifact quality ≥ 35/40
- [ ] Process reliability ≥ 35/40
- [x] Documentation updated

---

## Next Steps

1. Run case-01 end-to-end against the implemented Phase 11 path
2. Score the output using the artifact-quality and process-reliability rubrics
3. Fix any validation or gate regressions surfaced by that run
4. Use the verified Phase 11 path as the dependency baseline for Phase 12

---

## Cross-References

- `ROADMAP.md` — Phase 11 overview
- `PRODUCTION_READINESS_PLAN.md` — Overall production plan
- `.writing-framework/commands/` — Canonical command specs
- `.writing-framework/agents/` — Canonical agent specs
- `.writing-framework/workflows/` — Workflow specs
- `evals/cases/case-01-technical-docs.md` — Test case
