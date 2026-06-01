# HANDOFF CONTRACTS

**Status:** Canonical. This document defines all inter-agent handoffs in the Editorial Orchestrator framework.

**Authority:** This document governs. When a per-agent spec and this document disagree on what a receiver must accept, this document takes precedence. Per-agent specs may specify internal behavior; this document specifies interface behavior.

---

## How Agents Use This Document

Before receiving output from another agent, the receiving agent reads the contract for that handoff. The contract defines exactly what the receiving agent must find in the delivered artifact. If required fields are absent, the receiver rejects the handoff and returns it with a schema_conflict report — it does not silently proceed on incomplete inputs.

Before producing output for another agent, the sending agent reads the contract for that handoff. The contract defines exactly what the receiving agent needs. The sending agent must produce all required fields before delivering.

Every handoff in the system appears in the Full Handoff Table (Section 2) and in a detailed contract block (Section 3). The table provides a fast lookup. The contract blocks provide the complete specification.

---

## Section 1: Handoff Contract Format

A handoff contract is a binding interface specification between two agents. It defines the precise terms under which output produced by the sender is accepted by the receiver.

Each handoff contract specifies:

| Field | Definition |
|-------|-----------|
| Sender | The agent producing the output |
| Receiver | The agent consuming the output |
| Trigger Condition | What causes this handoff to occur — the event or gate that initiates transfer |
| Artifact | The file or structured object transferred (name, format) |
| Schema | The JSON schema file the artifact must validate against, if applicable |
| Required Fields | Fields or sections that must be present and non-empty for the handoff to be valid |
| Optional Fields | Fields that improve the handoff but whose absence does not constitute rejection |
| Validation | How the receiver confirms the handoff is valid before proceeding |
| On Validation Failure | What the receiver does when the artifact is incomplete or invalid |
| Notes | Edge cases, phase-specific behaviors, partial output handling |

Handoff format is one of three types:
- **JSON file** — a structured artifact written to disk, validated against a schema
- **Markdown file** — prose content written to disk, validated by structural inspection
- **Inline JSON** — a structured object returned in-band from the sending agent, without a separate file write

Schema references point to files in `.writing-framework/schemas/`. All schema validation is performed by the receiving agent before the receiver begins work.

---

## Section 2: Full Handoff Table

| From Agent | To Agent | Artifact | Schema | Required Fields | Trigger Condition |
|-----------|---------|----------|--------|----------------|------------------|
| intake-router | lead-orchestrator | routing_decision.json | intake_routing.schema.json | task_type, recommended_command, confidence_level, routing_justification | Task description received; routing classification complete |
| discovery-agent | discovery-orchestrator | findings_report.json | findings_report.schema.json | found_context_items, inferred_context, gaps, style_pack_detected, guides_available, artifacts_present | Single-pass project directory scan complete |
| discovery-orchestrator | lead-orchestrator | discovery_report.json | discovery_report.schema.json | confirmed_context, inferred_context, assumptions, blockers, immediate_next_actions | Discovery pass complete; all findings aggregated |
| brief-writer | lead-editor | brief.json | brief.schema.json | audience, purpose, scope, tone, success_criteria, constraints | Brief production complete; ready for Brief Gate |
| lead-editor (gate: ACCEPT) | outline-architect | brief.json | brief.schema.json | All required brief fields; gate_decision=ACCEPT in review_report | Brief Gate passes |
| outline-architect | lead-editor | outline.json | outline.schema.json | sections (each with section_id, title, purpose, required_content, estimated_word_count), coverage_check | Outline production complete; ready for Outline Gate |
| lead-editor (gate: ACCEPT) | lead-orchestrator | outline.json + gate_decision | outline.schema.json | All sections; gate_decision=ACCEPT | Outline Gate passes |
| lead-orchestrator | section-drafter (×N) | section_entry (from outline.json) + brief.json | outline.schema.json (section entry) | section_id, title, purpose, required_content, estimated_word_count | Outline Gate passes; one invocation per section |
| section-drafter | merge-normalizer | section_draft.json | section_draft.schema.json | section_id, title, content, word_count, voice_notes, issues | Section draft complete; one handoff per section |
| merge-normalizer | lead-editor | draft.md + merge_report.json | merge_report.schema.json | draft.md (all sections assembled); merge_report with sections_assembled, placeholder_sections, scope_deviations | All section drafts collected; assembly and voice normalization complete |
| lead-editor | qa-reader, qa-skeptic, qa-domain, qa-style, qa-coherence, qa-ai-stink | draft.md + brief.json | — | draft.md (non-empty); brief.json with success_criteria | Draft Gate passes; parallel QA dispatch |
| qa-reader | qa-final | review_report.json (reader perspective) | review_report.schema.json | perspective="reader", issues (each with location, type, description, severity), gate_implication | Reader QA pass complete |
| qa-skeptic | qa-final | review_report.json (skeptic perspective) | review_report.schema.json | perspective="skeptic", issues, gate_implication | Skeptic QA pass complete |
| qa-domain | qa-final | review_report.json (domain perspective) | review_report.schema.json | perspective="domain", issues, gate_implication | Domain QA pass complete |
| qa-style | qa-final | review_report.json (style perspective) | review_report.schema.json | perspective="style", issues, gate_implication | Style QA pass complete |
| qa-coherence | qa-final | review_report.json (coherence perspective) | review_report.schema.json | perspective="coherence", issues, gate_implication | Coherence QA pass complete |
| qa-ai-stink | qa-final | review_report.json (ai-stink perspective) | review_report.schema.json | perspective="ai-stink", issues, gate_implication | AI-stink QA pass complete |
| adversarial-reviewer | qa-final | adversarial_review.json | review_report.schema.json | reviewer_perspective="adversarial", issues (each with location, type, objection, severity) | Adversarial review complete (optional; included when run) |
| qa-final | lead-orchestrator | quality_gate.json | quality_gate.schema.json | gate_decision, issue_register, blocking_issue_count, success_criteria_evaluation, next_recommended_action | All QA perspectives received; gate decision rendered |
| lead-orchestrator | lead-editor | quality_gate.json + draft.md | quality_gate.schema.json | gate_decision, revision_priority_list (if REVISE or BLOCK) | QA gate complete; routing for editorial action or advancement |
| lead-editor | clarity-editor / line-editor / compression-editor / voice-editor / section-drafter | rewrite_plan.json | rewrite_plan.schema.json | source_document, operations (each with type, location, instruction, rationale, priority) | Gate decision is REVISE or BLOCK; revision routing required |
| clarity-editor / line-editor / compression-editor / voice-editor | lead-editor | edited_draft.md + edit_notes | — | edited file non-empty; edit_notes documenting all changes | Edit pass complete |
| section-drafter (revision pass) | merge-normalizer | section_draft.json (revised) | section_draft.schema.json | section_id, content, word_count, voice_notes, issues | Section revision complete; re-merge required |
| lead-orchestrator | artifact-orchestrator | finalized draft.md + run_summary.json | run_summary.schema.json | draft path, target_format, output_path, run_id | QA gate is ACCEPT; ready for artifact generation |
| artifact-orchestrator | lead-orchestrator | artifact_manifest.json | artifact_manifest.schema.json | artifact_id, source_file, output_path, validation (all four checks), status | Artifact generation complete |
| any agent | blockage-handler | blocker_report.json (partial) | blocker_report.schema.json | classification, description, impacted_scope | Blocker detected that cannot be self-resolved |
| blockage-handler | lead-orchestrator | blocker_report.json | blocker_report.schema.json | blocker_id, classification, description, impacted_scope, unimpacted_scope, partial_outputs, resume | Blocker classified; partial work complete; resume plan ready |
| canon-checker | lead-editor | canon_check_report.json | canon_check_report.schema.json | document, domain, claims (each with claim_id, status, canon_record), summary | Canon check pass complete |
| framework-sync-agent | import-export-orchestrator | sync_manifest.json | sync_manifest.schema.json | sync_timestamp, items (each with item_path, classification, action_taken), summary | Sync operation complete |
| import-export-orchestrator | lead-orchestrator | sync_manifest.json | sync_manifest.schema.json | operation, sync_timestamp, items, summary | Pack export or import complete |
| principles-sync-agent | lead-orchestrator | sync_manifest.json | sync_manifest.schema.json | sync_timestamp, items, summary | Principles sync operation complete |

---

## Section 3: Per-Handoff Contracts

---

### intake-router → lead-orchestrator

**Trigger:** A raw task description has been received by the system. intake-router has classified the task type and identified the entry command.

**Artifact:** routing_decision.json (inline JSON returned to lead-orchestrator)

**Schema:** intake_routing.schema.json

**Required fields:**
- `task_type` — one of: writing, editing, qa, guide_management, sync, artifact_generation, orchestration
- `recommended_command` — must reference a real command from `.writing-framework/commands/`
- `confidence_level` — high, medium, or low
- `routing_justification` — one to two sentences explaining the classification

**Optional fields:**
- `domain` — project or domain identifier if determinable from task description
- `initial_context` — summary of immediately available context
- `open_questions` — only questions that materially block routing; must include `impact` field

**Validation:** lead-orchestrator checks that `task_type` is from the recognized taxonomy and `recommended_command` references a real command. If `confidence_level` is "low", at least one open question must be present.

**On validation failure:** lead-orchestrator returns the routing decision to intake-router with a specific note on which field is missing or invalid. Does not proceed to discovery until a valid routing decision is received.

**Notes:** intake-router does not perform discovery. `initial_context` is based on the task description alone, not on file inspection. If the task type is genuinely ambiguous, `confidence_level` must be "low" and `open_questions` must enumerate the ambiguous interpretations.

---

### discovery-agent → discovery-orchestrator

**Trigger:** discovery-orchestrator has spawned discovery-agent with a project directory path and task description. discovery-agent has completed its single-pass scan.

**Artifact:** findings_report.json

**Schema:** findings_report.schema.json

**Required fields:**
- `project_root` — absolute path scanned
- `scan_timestamp` — ISO 8601
- `found_context_items` — list of found files with type and summary; may be empty but must be present
- `inferred_context` — list of inferences with basis citations; may be empty but must be present
- `gaps` — list of expected items not found; must specify `expected` and `location_checked`
- `style_pack_detected` — name of style pack found, or explicitly null
- `guides_available` — list of guide identifiers found; may be empty array
- `artifacts_present` — list of artifact file paths found; may be empty array

**Optional fields:**
- `templates_available` — list of available document templates

**Validation:** discovery-orchestrator checks that all seven required sections are present (none null or absent). Inferred items must have a `basis` field. Gaps must have both `expected` and `location_checked` fields.

**On validation failure:** discovery-orchestrator re-invokes discovery-agent with a note on which section is absent or malformed. Does not proceed to discovery_report aggregation on an incomplete findings_report.

**Notes:** discovery-agent is read-only and single-pass. It does not classify blockers — that is discovery-orchestrator's job. Inferred items must be explicitly labeled as inferred and must not appear in `found_context_items`.

---

### discovery-orchestrator → lead-orchestrator

**Trigger:** discovery-orchestrator has aggregated findings_report.json, guide-server results (Phase 2+), and cache-server results (Phase 2+) into a complete discovery report.

**Artifact:** discovery_report.json

**Schema:** discovery_report.schema.json

**Required fields:**
- `run_id`
- `task_description`
- `confirmed_context` — items with `item` and `source` fields
- `inferred_context` — items with `item` and `basis` fields
- `assumptions` — items with `assumption` and `confidence` fields; may be empty array
- `blockers` — items classified with B-type codes; may be empty array
- `immediate_next_actions` — at minimum three actions, each with `action`, `command`, and `priority`

**Optional fields:**
- `guides_available`
- `style_packs_available`
- `prior_artifacts`

**Validation:** lead-orchestrator checks all required sections are present. Verifies that every item in `blockers` has a B-type classification. Verifies that `immediate_next_actions` references real commands.

**On validation failure:** lead-orchestrator returns to discovery-orchestrator with specific section deficiencies noted. Does not advance to brief production on an incomplete discovery report.

**Notes:** In Phase 1, `guides_available` and prior cache lookups will be empty or absent. This is expected and not a validation failure.

---

### brief-writer → lead-editor (Brief Gate)

**Trigger:** brief-writer has produced a complete brief.json and the Brief Gate review is required before outline-architect can proceed.

**Artifact:** brief.json

**Schema:** brief.schema.json

**Required fields:**
- `run_id`
- `document_title`
- `audience` — with `primary`, `knowledge_level`, and `needs` fields
- `purpose` — one sentence: what the document achieves, not what it covers
- `scope` — with `in_scope` and `out_of_scope` arrays
- `tone`
- `success_criteria` — array of specific, verifiable conditions; minimum one
- `constraints` — with `word_count_range` and `format` fields

**Optional fields:**
- `source_material` — array of source references with type, path, and notes
- `open_questions` — Type 3 decisions only; each must have `question`, `impact`, and `type` fields
- `style_pack`

**Validation:** lead-editor reads brief.json against the required field list. Verifies that `success_criteria` entries are specific and verifiable — not aspirational ("engaging", "comprehensive"). Verifies that `scope` defines both what is in scope and what is explicitly excluded.

**On validation failure:** lead-editor returns brief.json to brief-writer with a structured issue list citing specific deficient fields. Gate decision is REVISE. outline-architect does not receive the brief until the gate passes.

**Notes:** brief.json is the authoritative intent document for the entire run. Every downstream agent reads it. Missing or vague fields in brief.json propagate failures into every downstream phase. lead-editor must hold the gate on a vague brief even when the deficiency seems minor.

---

### outline-architect → lead-editor (Outline Gate)

**Trigger:** outline-architect has produced outline.json and the Outline Gate review is required before section-drafter can be spawned.

**Artifact:** outline.json

**Schema:** outline.schema.json

**Required fields:**
- `run_id`
- `document_title`
- `brief_ref` — path to the brief.json this outline was produced from
- `sections` — array; each section must have: `section_id`, `title`, `purpose`, `required_content`, `estimated_word_count`, `order`
- `coverage_check` — explicit statement that all brief success criteria are mapped, or enumeration of any uncovered criteria

**Optional fields:**
- `template_used`
- `total_estimated_word_count`
- Per-section `source_refs`

**Validation:** lead-editor checks that no two sections share the same purpose statement. Verifies section order is reader-logical. Verifies all brief success criteria are addressed in the `coverage_check` field. Checks that `estimated_word_count` for all sections sums within brief `word_count_range`.

**On validation failure:** lead-editor returns outline.json to outline-architect with specific findings. Does not dispatch section-drafter until Outline Gate passes.

**Notes:** Section purposes must be specific. "Introduction" is not a purpose; "Establish the problem the reader needs to understand before the solution can be presented" is a purpose. lead-editor rejects outlines with generic purpose statements.

---

### lead-orchestrator → section-drafter (per section)

**Trigger:** Outline Gate has passed. lead-orchestrator spawns one section-drafter per top-level section in outline.json.

**Artifact:** section_entry (JSON object extracted from outline.json, sections array) + brief.json

**Schema:** outline.schema.json (section entry sub-object)

**Required fields (section entry):**
- `section_id`
- `title`
- `purpose`
- `required_content` — non-empty array
- `estimated_word_count` — object with `min` and `max`

**Optional fields (section entry):**
- `source_refs`
- `order`

**Validation:** section-drafter confirms that `section_id`, `title`, `purpose`, and `required_content` are all present and non-empty before beginning drafting. If any required field is absent, section-drafter raises a B2 blocker rather than drafting from incomplete input.

**On validation failure:** section-drafter produces a blocker_report.json classified as B2 (missing-repo-context) and returns it to lead-orchestrator. Does not draft.

**Notes:** lead-orchestrator passes the full brief.json alongside the section entry on every invocation — section-drafter needs audience, tone, and constraints even though its scope is one section. Section drafters run in parallel; each operates on its assigned section_id only.

---

### section-drafter → merge-normalizer

**Trigger:** A section draft is complete. section-drafter delivers to merge-normalizer. All section drafts must be collected before merge-normalizer begins assembly.

**Artifact:** section_draft.json

**Schema:** section_draft.schema.json

**Required fields:**
- `section_id` — must match a section_id from outline.json
- `title`
- `content` — markdown string; must be non-empty unless status is "blocked"
- `word_count` — integer
- `voice_notes` — array of voice characteristic descriptions; may be empty array but must be present
- `issues` — array; may be empty but must be present; each issue must have `type`, `description`

**Optional fields:**
- `assumptions` — array of assumption records with `assumption` and `basis`
- `blocker_report` — null if no blocker; blocker_report.schema.json-compliant object if section is blocked

**Validation:** merge-normalizer checks that every `section_id` in the received drafts corresponds to a section in outline.json. Checks that `content` is non-empty for sections where `blocker_report` is null. Checks that `voice_notes` is present (even if empty) — absent voice_notes prevents normalization.

**On validation failure:** merge-normalizer returns the invalid section_draft to lead-orchestrator identifying which section and which field is deficient. Does not assemble until all sections pass validation or are documented as blocked.

**Notes:** A section may have `content` with a placeholder structure and `blocker_report` populated — this is a valid partial section. merge-normalizer assembles these as placeholders with documented blockers. A section with empty `content` and null `blocker_report` is always invalid and must be rejected.

---

### merge-normalizer → lead-editor (Draft Gate)

**Trigger:** All section drafts have been received and validated. Assembly and voice normalization are complete. The assembled draft is ready for the Draft Gate review.

**Artifacts:** draft.md (file) + merge_report.json (file)

**Schema:** merge_report.schema.json (for merge_report.json; draft.md has no schema)

**Required fields (merge_report.json):**
- `run_id`
- `draft_path` — path to draft.md
- `sections_assembled` — array; one entry per section with `section_id`, `status`, `word_count`
- `placeholder_sections` — array of documented placeholder sections; may be empty
- `total_word_count`

**Optional fields (merge_report.json):**
- `scope_deviations` — documented over/under word count deviations per section
- `voice_normalization_target`
- Per-section `voice_changes`

**Validation:** lead-editor checks that every section from outline.json appears in `sections_assembled` either as "complete", "partial", or "placeholder". Checks that `placeholder_sections` is populated for any section with status "placeholder". Verifies draft.md is non-empty and readable.

**On validation failure:** lead-editor returns to merge-normalizer with specific deficiencies. Does not dispatch QA agents until a valid Draft Gate package is received.

**Notes:** Placeholder sections are permitted and do not automatically fail the Draft Gate. The gate evaluates whether the assembled content — including documented placeholders — is sufficient to proceed to QA. A draft where placeholder sections constitute more than one-third of planned content triggers an automatic escalation flag to lead-orchestrator before gate decision.

---

### lead-editor → parallel QA agents (qa-reader, qa-skeptic, qa-domain, qa-style, qa-coherence, qa-ai-stink)

**Trigger:** Draft Gate passes. lead-editor dispatches all six QA agents in parallel.

**Artifacts:** draft.md (shared) + brief.json (shared)

**Schema:** None (input artifacts; QA agents read these, they do not validate them on receipt — they were already validated at the Draft Gate)

**Required fields:**
- draft.md — non-empty, readable
- brief.json — must contain `audience`, `purpose`, `success_criteria`

**Optional inputs (per agent):**
- qa-domain: canon_guides from guide-server or guides/
- qa-style: active style pack
- qa-ai-stink: AI-stink checklist from doctrine/VOICE_MODEL.md

**Validation:** Each QA agent confirms draft.md and brief.json are present and non-empty before beginning review. If either is absent, the QA agent raises a B2 blocker rather than reviewing.

**On validation failure:** The blocking QA agent notifies lead-orchestrator. The other five agents continue their passes regardless. qa-final cannot close the gate until all six reports are received.

**Notes:** QA agents run independently and in parallel. They do not share findings during their passes. Each agent produces a perspective-specific review_report.json. All six are delivered to qa-final after completion. Each agent's review_report.json must identify its perspective clearly so qa-final can attribute findings correctly.

---

### QA agents → qa-final (all six perspectives)

**Trigger:** A QA agent has completed its review pass. The agent delivers its review_report.json to qa-final. qa-final waits for all six required perspectives before issuing a gate decision.

**Artifact:** review_report.json (one per agent)

**Schema:** review_report.schema.json

**Required fields:**
- `run_id`
- `document` — path to the draft reviewed
- `perspective` — must match the agent's assigned perspective label (reader, skeptic, domain, style, coherence, ai-stink)
- `issues` — array; may be empty but must be present; each issue must have `location`, `type`, `description`, `severity`
- `gate_implication` — one of: accept-level, revise-level, block-level

**Optional fields:**
- `summary` — prose summary of findings
- `adversarial_review` — only applicable if adversarial-reviewer was also run

**Validation:** qa-final checks that the `perspective` field matches the expected agent. Verifies that every issue has `location`, `type`, `description`, and `severity`. Checks that `gate_implication` is populated.

**On validation failure:** qa-final flags the incomplete perspective report to lead-orchestrator and does not issue a gate decision until a valid replacement is received. The gate does not close on incomplete QA.

**Notes:** adversarial-reviewer, if run, delivers its report to qa-final in the same format as a QA perspective report, with `perspective="adversarial"`. It is treated as a seventh perspective. qa-final explicitly notes when adversarial review was included or excluded from the gate evaluation.

---

### qa-final → lead-orchestrator

**Trigger:** All required QA perspective reports have been received and validated. qa-final has rendered the gate decision.

**Artifact:** quality_gate.json

**Schema:** quality_gate.schema.json

**Required fields:**
- `run_id`
- `document` — path to draft evaluated
- `gate_decision` — ACCEPT, REVISE, or BLOCK
- `justification`
- `qa_perspectives_applied` — array listing all perspectives evaluated
- `missing_perspectives` — empty array for a valid gate; populated if any perspective was absent
- `success_criteria_evaluation` — one entry per criterion from brief.json
- `issue_register` — all issues across all perspectives; each with `id`, `source_agent`, `location`, `type`, `description`, `severity`
- `blocking_issue_count` — integer
- `revise_issue_count` — integer
- `next_recommended_action`

**Optional fields:**
- `revision_priority_list` — required when gate_decision is REVISE or BLOCK; optional when ACCEPT
- `note_issue_count`

**Validation:** lead-orchestrator checks that `gate_decision` is consistent with `blocking_issue_count` (ACCEPT requires blocking_issue_count=0). Checks that `success_criteria_evaluation` covers every criterion from brief.json. Verifies `revision_priority_list` is present when gate_decision is REVISE or BLOCK.

**On validation failure:** lead-orchestrator returns quality_gate.json to qa-final with specific deficiencies. Does not route for editorial action or artifact generation until quality_gate.json is valid.

**Notes:** When gate_decision is ACCEPT, lead-orchestrator advances to artifact generation. When gate_decision is REVISE, lead-orchestrator routes `revision_priority_list` to lead-editor for targeted revision dispatch. When gate_decision is BLOCK, lead-orchestrator escalates to the human gate if the blocking issue cannot be resolved by revision.

---

### lead-editor → specialist editing agents (clarity-editor, line-editor, compression-editor, voice-editor)

**Trigger:** lead-editor has determined that a revision pass is required (gate decision is REVISE or BLOCK with resolvable issues). lead-editor routes specific issues to specialist agents via rewrite_plan.json.

**Artifact:** rewrite_plan.json

**Schema:** rewrite_plan.schema.json

**Required fields:**
- `source_document` — path to draft being revised
- `operations` — array; each operation must have: `type`, `location`, `instruction`, `rationale`, `priority`, `routed_to`
- `revision_pass_number` — integer; increments on each revision cycle to detect revision loops

**Optional fields:**
- `target_sections` — scopes the revision to specific sections if not all sections require revision

**Validation:** Each specialist agent confirms that `source_document` exists, that operations assigned to it are present in the list, and that `instruction` is specific enough to act on without follow-up questions. Vague instructions ("improve this") are not valid and must be returned for clarification.

**On validation failure:** The specialist agent returns the offending operation to lead-editor with a note that the instruction is insufficient. Does not attempt to execute an unactionable instruction.

**Notes:** Operations are routed by agent: voice-editor receives voice/ai-stink operations; clarity-editor receives clarity operations; line-editor receives grammar/line-level operations; compression-editor receives padding/compression operations; section-drafter receives structural rewrites. A single rewrite_plan.json may contain operations for multiple agents — each agent executes only its own operations.

---

### lead-orchestrator → artifact-orchestrator

**Trigger:** QA gate decision is ACCEPT and the run is ready for artifact generation.

**Artifacts:** finalized draft.md + run_summary.json

**Schema:** run_summary.schema.json (for run_summary.json)

**Required fields:**
- `source_content` — path to finalized draft.md
- `target_format` — md, pdf, docx, html, or other supported format
- `output_path` — target path under artifacts/
- `run_id`

**Optional fields:**
- `artifact_manifest_template` — if appending to an existing manifest

**Validation:** artifact-orchestrator confirms draft.md exists at the source path, is non-empty, and is readable. Confirms output_path is under artifacts/. If target_format is not supported in the current phase, raises B6 blocker rather than attempting generation.

**On validation failure:** artifact-orchestrator produces a blocker_report.json classified as B5 (failed toolchain) or B6 (artifact export failure) and returns it to lead-orchestrator. Does not attempt artifact generation on an invalid source.

**Notes:** In Phase 1, only markdown format is supported. All other format requests are B6 blockers in Phase 1. In Phase 5+, all formats are routed through artifact-server MCP.

---

### any agent → blockage-handler

**Trigger:** An agent encounters a blocker it cannot self-resolve using the B1-B9 classification. The agent produces a preliminary blocker_report.json and routes it to blockage-handler along with current run context.

**Artifact:** blocker_report.json (preliminary — may be incomplete at this stage)

**Schema:** blocker_report.schema.json

**Required fields (preliminary — minimum valid for routing to blockage-handler):**
- `classification` — B-type code from the B1-B9 taxonomy
- `description` — specific description of what is blocked and why
- `created_by` — agent ID reporting the blocker
- `created_at` — ISO 8601 timestamp

**Optional fields at routing time (required in blockage-handler's completed output):**
- `impacted_scope`
- `unimpacted_scope`
- `partial_outputs`
- `resume`

**Validation:** blockage-handler confirms that `classification` is a valid B-type code and `description` is specific. Rejects any blocker report with a classification of "unknown" or a description of "something is missing."

**On validation failure:** blockage-handler returns the blocker report to the originating agent and requires a valid B-type classification before proceeding.

**Notes:** No agent may report a blocker without a B-type classification. "Use judgment" and "something seems off" are not valid blocker reports. The originating agent continues all work not impacted by the blocker while blockage-handler processes the report.

---

### blockage-handler → lead-orchestrator

**Trigger:** blockage-handler has classified the blocker, completed all unblocked work, produced partial outputs, and written a complete resume plan.

**Artifact:** blocker_report.json (complete)

**Schema:** blocker_report.schema.json

**Required fields:**
- `blocker_id` — unique identifier
- `run_id`
- `classification` — from B1-B9 taxonomy
- `description` — specific and actionable
- `impacted_scope` — array of blocked workflow stages or section IDs
- `unimpacted_scope` — array of work that proceeded
- `partial_outputs` — array with path and status for each partial output produced
- `resume` — object with `blocked_on`, `to_resume`, `when_unblocked`, `already_complete`
- `created_at` — ISO 8601

**Optional fields:**
- `created_by`

**Validation:** lead-orchestrator checks that `resume.blocked_on` is specific (not "awaiting input"), that `resume.to_resume` references a real command, and that `resume.already_complete` enumerates actual file paths. Verifies that `partial_outputs` items exist at their stated paths.

**On validation failure:** lead-orchestrator returns blocker_report.json to blockage-handler identifying which resume fields are insufficient.

**Notes:** A blocker_report.json where `resume.blocked_on` reads "more information needed" is invalid. The blocked_on field must name the exact decision or resource required. lead-orchestrator routes B1 and B5/B8 blockers that meet escalation thresholds to the human gate.

---

## Section 4: Final Prose Ownership

Final prose ownership means the right and responsibility to modify assembled document prose outside of a narrowly scoped, explicitly assigned editing role.

**Prose owners:** lead-orchestrator and merge-normalizer jointly hold final prose ownership. lead-orchestrator as the authority that controls workflow state and routing; merge-normalizer as the assembly point that produces the unified draft.md that all downstream agents read.

**What prose ownership means in practice:**
- Only merge-normalizer may assemble section drafts into a unified document
- Once a draft.md is produced by merge-normalizer, its structure and section boundaries are fixed unless lead-orchestrator explicitly routes a structural revision back to outline-architect or section-drafter
- No agent may silently modify draft.md outside of an explicitly assigned operation in rewrite_plan.json

**Agents prohibited from direct prose modification of assembled documents:**

| Agent | Prohibition |
|-------|------------|
| qa-reader, qa-skeptic, qa-domain, qa-style, qa-coherence, qa-ai-stink | Read-only access to draft.md. May produce issue reports. May not alter the draft. |
| qa-final | Aggregation and gate decision only. May not edit draft.md. |
| lead-editor | May not directly edit draft.md. Routes all edits through rewrite_plan.json to specialist agents. |
| outline-architect | May not modify draft.md. May only modify outline.json before section drafting begins. |
| brief-writer | May not modify draft.md. May only modify brief.json before outline production begins. |
| discovery-orchestrator, discovery-agent | Read-only. May not modify any content files. |
| intake-router | May not modify any content files. |
| blockage-handler | Writes to logs/ and produces partial outputs. May not modify assembled draft.md. |
| artifact-orchestrator | May not modify source content. Reads draft.md to generate artifacts; does not write back to draft.md. |
| canon-checker | Read-only. Produces reports; does not modify documents. |
| adversarial-reviewer | Read-only. Produces reports; does not modify documents. |
| framework-sync-agent, import-export-orchestrator, principles-sync-agent | Operate on framework files only. May not touch content files (draft.md, brief.json, outline.json) under any circumstances. |

**The specialist editors (clarity-editor, line-editor, compression-editor, voice-editor)** hold bounded prose modification rights. They may modify prose within the specific sections and with the specific operations assigned to them in rewrite_plan.json. They may not modify prose outside their assigned operations, modify document structure, or produce changes not documented in their edit_notes output.

**section-drafter** holds bounded prose creation rights. It creates new section content for its assigned section only. It may not modify content in other sections, modify the assembled draft.md, or create content outside its assigned section_id.

---

## Section 5: Partial Output Contracts

When an agent cannot complete its full output due to a blocker, it delivers a partial output. Partial outputs are valid handoffs when they meet the following contract.

### What a Partial Output Must Include

1. **Completion status marker** — the output header or a top-level field (`status`) must state: "partial", "blocked", or "complete". No output may silently appear complete when it is not.

2. **Completed content** — all content that was successfully produced must be present and usable. A partial draft with three complete sections is not a skeleton; it contains the actual draft text for those sections at publication quality.

3. **Enumerated gaps** — a specific list of what was not produced and why. "Section 4 was not drafted because the source document referenced in section_entry.source_refs ('research/market-analysis.pdf') was not present in the repository" is a valid gap description. "Some sections are missing" is not.

4. **Blocker classification** — the B-type code and specific description for each blocker causing the incompleteness.

5. **Resume section** — a RESUME block that passes the handoff test: a new agent reading only the RESUME section, without access to prior context, can continue correctly.

### Required Fields in Partial Handoff JSON

For any handoff JSON that is partial, the following fields must be present in addition to whatever required fields were completed:

```json
{
  "status": "partial",
  "completed_items": ["list of completed item IDs or section IDs"],
  "blocked_items": [
    {
      "item_id": "string",
      "blocker_type": "B1 | B2 | B3 | B4 | B5 | B6 | B7 | B8 | B9",
      "description": "specific description of what is missing and why"
    }
  ],
  "resume": {
    "blocked_on": "exact description of required input or decision",
    "to_resume": "command and parameters to run when unblocked",
    "when_unblocked": "what will be produced on resumption",
    "already_complete": ["file paths of completed outputs"]
  }
}
```

### Partial Output Acceptance Rules

A receiver accepts a partial output when:
- `status` is explicitly "partial" or "blocked" (not absent or "complete")
- All completed items are present at their stated paths
- Every blocked item has a B-type classification
- `resume.blocked_on` is specific enough to act on without re-reading prior context

A receiver rejects a partial output when:
- `status` is absent or "complete" but content is missing — this is a silent failure, not a partial output
- `blocked_items` is absent — incompleteness without documented blockers is not a partial output
- `resume` section is absent or contains vague descriptions ("more information needed")

A rejected partial output is returned to the sender with a specific note on which contract requirement was violated. The receiver logs the rejection as a B9 validation failure and notifies lead-orchestrator.
