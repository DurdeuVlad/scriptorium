# COMMAND_REGISTRY.md

**Editorial Orchestrator â€” Canonical Command Registry**

## Purpose

This document is the single-source reference for all 71 commands in the Editorial Orchestrator framework. It describes what every command does, who owns it, when to use it, and how commands relate to each other across the full production pipeline.

**Note on taxonomy table row count:** The taxonomy table (Section 2) contains 73 rows. Two commands — `/project-scan` and `/requirements-brief` — appear in two categories each, with a cross-reference marker (`*(see X)*`) for the secondary listing. Unique command count is 71.

**How to use this registry:**
- Use the taxonomy table (Section 2) for a fast lookup of any command's category, purpose, and phase.
- Use the per-category sections (Section 3) for full context on a command's behavior, typical invocation, and dependencies.
- Use the dependency map (Section 4) to understand the sequence for a full production run.
- Use the orchestration breakdown (Section 5) to understand which primitive commands each `/orchestrate-*` command coordinates.
- Use the ownership matrix (Section 6) to identify which agent is responsible for a given command.

**Canonical source:** Command specs live in `.writing-framework/commands/`. Tool-specific command wrappers live in `.claude/commands/`, `.codex/commands/`, `.windsurf/commands/`, and `.copilot/commands/`. Canonical workflows live in `.writing-framework/workflows/`. This registry is synthesized from the canonical spec files. When a spec file and this registry conflict, the spec file is authoritative.

---

## Section 2: Command Taxonomy Table

| Command | Category | One-Line Purpose | Primary Input | Primary Output | Owning Agent | Phase |
|---------|----------|-----------------|---------------|----------------|--------------|-------|
| `/help` | Foundation | Display all available commands grouped by category with one-line descriptions and status | Optional: command_name | Formatted command listing | lead-orchestrator | 1 |
| `/session-start` | Foundation | Initialize a working session by loading doctrine, scanning for active runs, and surfacing the recommended next action | Optional: run_id, project | Session context summary | lead-orchestrator | 2 |
| `/project-scan` | Foundation | Scan the project directory for editorial context â€” artifacts, guides, runs, styles â€” and produce a structured snapshot | Optional: scope, path | Project scan report | discovery-agent | 2 |
| `/status` | Foundation | Show the status of the current or most recent run â€” phase, completed steps, pending steps, and blockers | Optional: run_id | Run status report | lead-orchestrator | 2 |
| `/whats-next` | Foundation | Given current project state, recommend the single most valuable next action | Optional: run_id, context | Single recommended command + justification | lead-orchestrator | 2 |
| `/explain-workflow` | Foundation | Explain a workflow or command step-by-step with agent assignments, inputs, outputs, and quality gates | Required: workflow_name | Human-readable workflow explanation | lead-orchestrator | 1 |
| `/discovery` | Discovery | Run a full discovery pass: read all repo context, infer defaults, surface blockers, produce a discovery report | Optional: scope, domain | discovery_report + blocker list | discovery-orchestrator | 2 |
| `/project-scan` | Discovery | *(see Foundation)* | â€” | â€” | discovery-agent | 2 |
| `/discovery-agent` | Discovery | Run a targeted discovery pass against a specific scope â€” a file, directory, or topic â€” without a full project scan | Required: scope; Optional: question | Targeted discovery note (4-section format) | discovery-agent | 2 |
| `/discovery-simulate-user` | Discovery | Run discovery without user interaction by simulating user answers from repo context and doctrine defaults | Optional: domain, confidence_threshold | Discovery report with Simulated Answers section | discovery-orchestrator | 2 |
| `/requirements-brief` | Discovery | Produce a structured requirements brief from a completed discovery report and confirmed user inputs | Optional: discovery_report, overrides | Requirements brief with field provenance labels | brief-writer | 2 |
| `/research` | Research | Conduct a research pass on a topic, producing a validated research_report with sources, summaries, and gaps | Required: topic; Optional: brief, depth | research_report (schema-validated) | discovery-agent | 3 |
| `/validate-research` | Research | Validate a completed research_report for source quality, currency, relevance, and coverage completeness | Required: research_report; Optional: brief | Validation summary with accept/block verdict | discovery-agent | 3 |
| `/synthesize-research` | Research | Merge multiple research_report objects into a single unified evidence summary | Required: reports; Optional: brief | Unified research_report (deduplicated, merged) | discovery-agent | 3 |
| `/source-gap-check` | Research | Scan a draft for claims that lack supporting research and report each gap's location, type, and severity | Required: draft; Optional: research_report | Gap report with severity ratings and recommendations | adversarial-reviewer | 3 |
| `/evidence-map` | Research | Produce a complete evidence map linking every claim in a document to its supporting source or flagging it as unsupported | Required: draft; Optional: research_report | Evidence map with summary table and recommendations | adversarial-reviewer | 3 |
| `/write-brief` | Editorial | Produce a validated brief schema output from discovery and requirements context | Optional: requirements_brief, discovery_report, overrides | brief (schema-validated) | brief-writer | 3 |
| `/requirements-brief` | Editorial | *(see Discovery)* | â€” | â€” | brief-writer | 2 |
| `/write-outline` | Editorial | Produce a validated outline schema output from an active brief | Optional: brief, template | outline (schema-validated) | outline-architect | 3 |
| `/validate-brief` | Editorial | Validate a brief against `brief.schema.json` and the Brief Gate without modifying it | Optional: brief_id, brief_json | validation_report | lead-editor | 3 |
| `/validate-outline` | Editorial | Validate an outline against `outline.schema.json` and the Outline Gate without modifying it | Optional: outline_id, outline_json | validation_report | lead-editor | 3 |
| `/draft-document` | Editorial | Orchestrate drafting of a complete document from an outline by calling /draft-section per section then /merge-draft | Optional: outline, brief, research_report | merged_draft + merge_report | lead-orchestrator | 3 |
| `/draft-section` | Editorial | Draft a single document section given its outline spec, brief, style pack, and guide records | Required: section_id; Optional: outline, brief, research_report | section_draft (markdown) | section-drafter | 3 |
| `/line-edit` | Editorial | Apply a line-level editing pass targeting word choice, sentence rhythm, redundancy, and transitions | Required: draft; Optional: scope, intensity | edited_draft | line-editor | 3 |
| `/voice-pass` | Editorial | Apply a voice and style consistency pass using the active style pack, correcting prohibited terms, tone, and formatting | Required: draft; Optional: style_pack | styled_draft + style_correction_log | voice-editor | 3 |
| `/rewrite` | Editorial | Apply a structured rewrite pass guided by a rewrite_plan to implement QA findings or revision requests | Required: rewrite_plan; Optional: draft | revised_draft + changes_summary | section-drafter | 3 |
| `/merge-draft` | Editorial | Merge multiple section drafts into a single document with normalized voice, headings, transitions, and formatting | Required: sections; Optional: brief | merged_draft + merge_report | merge-normalizer | 3 |
| `/compress` | Editorial | Reduce word count while preserving informational content by removing padding, redundancy, and over-explained points | Required: draft; Optional: target_word_count, scope | compressed_draft + compression_report | compression-editor | 3 |
| `/canon-check` | Editorial | Validate a document against all applicable canon guide records for the domain and report violations | Required: draft; Optional: domain | canon_check_report with verdict | canon-checker | 3 |
| `/publication-check` | Editorial | Final pre-export gate: validate completeness, formatting, schema compliance, brief alignment, and QA gate status | Required: draft; Optional: brief, qa_reports | publication_check_report with publication verdict | lead-editor | 3 |
| `/qa-reader` | QA | Evaluate whether the document makes sense to the intended reader â€” assumed knowledge, unfulfilled promises, clarity | Required: draft; Optional: brief | review_report (reader perspective) | qa-reader | 4 |
| `/qa-skeptic` | QA | Evaluate what feels weak, padded, or unsupported â€” thin arguments, ungrounded claims, hedging, weak conclusions | Required: draft; Optional: brief | review_report (skeptic perspective) | qa-skeptic | 4 |
| `/qa-domain` | QA | Evaluate domain convention adherence â€” terminology accuracy, canon compliance, knowledge representation | Required: draft; Optional: domain | review_report (domain perspective) | qa-domain | 4 |
| `/qa-style` | QA | Evaluate adherence to the active style pack â€” voice, tone, formatting, sentence structure, prohibited terms | Required: draft; Optional: style_pack | review_report (style perspective) | qa-style | 4 |
| `/qa-coherence` | QA | Evaluate internal structural logic â€” gaps, broken transitions, contradictions, orphaned points, argument flow | Required: draft; Optional: brief | review_report (coherence perspective) | qa-coherence | 4 |
| `/qa-ai-stink` | QA | Identify machine-generated language patterns â€” hollow affirmations, oversmooth transitions, filler phrases | Required: draft | review_report (ai-stink perspective) with verbatim findings | qa-ai-stink | 4 |
| `/qa-final` | QA | Aggregate all perspective reports and issue the formal QA gate result: PASS, FAIL, or OVERRIDE | Required: draft; Optional: perspective_reports, run_id | quality_gate (schema-validated) | qa-final | 4 |
| `/orchestrate-brief` | Orchestration | Orchestrate full brief production: session start, discovery, requirements extraction, brief writing, and brief QA | Optional: context, domain | brief (validated) + orchestration_summary | lead-orchestrator | 3 |
| `/orchestrate-outline` | Orchestration | Orchestrate full outline production: guide retrieval, outline writing, and outline QA gate | Optional: brief | outline (validated) + orchestration_summary | lead-orchestrator | 3 |
| `/orchestrate-draft` | Orchestration | Orchestrate full draft production: research check, section drafting, merging, normalization, and draft QA | Optional: outline, research_report | draft (file) + draft_qa_reports + orchestration_summary | lead-orchestrator | 3 |
| `/orchestrate-review` | Orchestration | Run all seven QA perspectives in parallel then aggregate with /qa-final; returns approved draft or rewrite plan | Required: draft, brief; Optional: run_id, perspective_set | quality_gate + approved_draft or rewrite_plan | lead-orchestrator | 4 |
| `/orchestrate-finalize` | Orchestration | Run the finalization sequence after QA: voice pass, compress, publication check, final gate verdict | Required: draft, brief; Optional: run_id, skip flags | final_document + quality_gate | lead-orchestrator | 4 |
| `/orchestrate-artifact` | Orchestration | Generate all requested artifact formats from a finalized document and produce a consolidated artifact_manifest | Required: source_document, target_formats; Optional: output_directory, run_id, template_path | artifact_manifest + generated_files | artifact-orchestrator | 5 |
| `/orchestrate-export` | Orchestration | Package a completed production run into a versioned export pack with sync_manifest | Required: run_id; Optional: export_scope, output_path, pack_name | export_pack directory + sync_manifest | import-export-orchestrator | 6 |
| `/add-guide` | Guides | Add a new guide record to guide-server and write its filesystem mirror | Required: content, type, title, summary; Optional: tags, domain, status | guide_record + mirror_path | lead-editor | 2 |
| `/update-guide` | Guides | Update an existing guide record by ID and refresh its filesystem mirror | Required: guide_id; Optional: content, title, summary, tags, domain | updated_guide_record + mirror_path | lead-editor | 2 |
| `/find-guides` | Guides | Search guide-server using FTS5 full-text search with optional filtering by type, domain, tags, and status | Required: query; Optional: type, domain, tags, status, limit | Ranked results table | any agent | 2 |
| `/guide-gap-check` | Guides | Identify missing or underpopulated guide types for a given task or domain and produce ready-to-run /add-guide stubs | Optional: task_description, domain, guide_types_to_check | gap_report + add_guide_stubs | discovery-agent | 2 |
| `/guide-link` | Guides | Create a typed directional link relationship between two guide records in guide-server | Required: guide_id_1, guide_id_2, link_type; Optional: link_note | link_record + confirmation | lead-editor | 2 |
| `/guide-promote` | Guides | Promote a guide record from draft to active status after checking promotion criteria | Required: guide_id; Optional: override_criteria | promoted_guide_record + promotion_report | lead-editor | 2 |
| `/guide-deprecate` | Guides | Mark a guide record as deprecated, preserving the record but excluding it from default searches | Required: guide_id, deprecation_reason; Optional: replaced_by | deprecated_guide_record + deprecation_confirmation | lead-editor | 2 |
| `/import-framework` | Sync | Primary inbound sync command: import framework updates from another repo or an exported bundle into this repo | Required: source_path; Optional: conflict_resolution_mode, components, dry_run, backup | sync_manifest + import_summary | framework-sync-agent | 6 |
| `/export-framework` | Sync | Primary outbound sync command: export this repo's framework to another repo or to a portable bundle | Optional: destination_path, destination_type, components, pack_name, conflict_resolution_mode | sync_manifest + export_summary | import-export-orchestrator | 6 |
| `/import-principles` | Sync | Legacy compatibility surface for doctrine/style-only imports; prefer `/import-framework` | Required: source_path, conflict_resolution_mode; Optional: scope, dry_run | sync_manifest + import_summary | framework-sync-agent | 6 |
| `/export-principles` | Sync | Legacy compatibility surface for doctrine/style-only exports; prefer `/export-framework` | Optional: output_path, pack_name, scope, include_guide_records | export_pack directory + pack_manifest | import-export-orchestrator | 6 |
| `/sync-principles` | Sync | Legacy compatibility surface for doctrine/style bidirectional sync; prefer `/import-framework` plus `/export-framework` | Required: source_framework_path, conflict_resolution_mode; Optional: scope, dry_run | sync_manifest + sync_summary | framework-sync-agent | 6 |
| `/sync-framework` | Sync | Legacy compatibility surface for full-framework imports; prefer `/import-framework` | Required: source_framework_path, conflict_resolution_mode; Optional: components, dry_run, backup | sync_manifest + backup directory | framework-sync-agent | 6 |
| `/upgrade-framework` | Sync | Advanced compatibility surface for migration-aware upgrades; prefer `/import-framework` for normal updates | Required: framework_path; Optional: framework_version, components, dry_run, backup | sync_manifest + migration_report | framework-sync-agent | 6 |
| `/export-pack` | Sync | Legacy compatibility surface for bundle exports; prefer `/export-framework` | Required: scope; Optional: output_path, pack_name, tag | export_pack directory + pack_manifest | import-export-orchestrator | 6 |
| `/import-pack` | Sync | Legacy compatibility surface for bundle imports; prefer `/import-framework` | Required: pack_path, conflict_resolution_mode; Optional: components, dry_run, backup | sync_manifest + import_summary | import-export-orchestrator | 6 |
| `/install-framework` | Sync | Install the editorial framework into a new target repository with tool-specific adapter files | Required: target_repo_path; Optional: tools, overwrite_existing, dry_run | installed_framework + tool_adapter_files | import-export-orchestrator | 6 |
| `/apply-style-pack` | Sync | Activate a style pack for the current session by loading, registering, and summarizing its voice traits and rules | Required: style_pack_name or style_pack_path; Optional: run_id, override_existing | active_style_pack record + style_pack_summary | lead-editor | 2 |
| `/apply-doctrine` | Sync | Load and apply doctrine files for the current session, registering them in run context and surfacing conflicts | Required: doctrine_names; Optional: run_id, conflict_check | active_doctrine_record + doctrine_summary | lead-orchestrator | 2 |
| `/write-markdown` | Artifacts | Render the production artifact as a formatted Markdown file applying style pack conventions | Required: source; Optional: output_path, style_pack, include_metadata | .md file + artifact_manifest entry | artifact-server | 5 |
| `/write-docx` | Artifacts | Render the production artifact as a .docx file via artifact-server with optional template styles | Required: source; Optional: output_path, style_pack, template_docx | .docx file + artifact_manifest entry | artifact-server | 5 |
| `/write-pdf` | Artifacts | Render the production artifact as a .pdf file via artifact-server Markdown-to-PDF pipeline | Required: source; Optional: output_path, style_pack, page_size | .pdf file + artifact_manifest entry | artifact-server | 5 |
| `/write-latex` | Artifacts | Render the production artifact as a .tex (LaTeX) file for academic or high-typographic-quality output | Required: source; Optional: output_path, document_class, style_pack | .tex file + artifact_manifest entry | artifact-server | 5 |
| `/edit-docx` | Artifacts | Apply targeted edits to an existing .docx artifact without re-running the full render pipeline | Required: artifact_path, edits; Optional: track_changes | Updated .docx + manifest edit event | artifact-server | 5 |
| `/edit-latex` | Artifacts | Apply targeted edits to an existing .tex artifact without re-running the full conversion pipeline | Required: artifact_path, edits; Optional: validate_after | Updated .tex + manifest edit event | artifact-server | 5 |
| `/export-docx` | Artifacts | Export a .docx artifact to an external destination after validation, logging the export event | Required: artifact_path, destination; Optional: validate_before | Exported .docx at destination + manifest export event | artifact-server | 5 |
| `/export-pdf` | Artifacts | Export a .pdf artifact to an external destination after validation, logging the export event | Required: artifact_path, destination; Optional: validate_before | Exported .pdf at destination + manifest export event | artifact-server | 5 |
| `/normalize-artifact` | Artifacts | Normalize a draft against the active style and voice packs before export for consistent formatting and register | Required: source; Optional: output_path, style_pack, voice_pack, dry_run | Normalized document + normalization report | artifact-server | 5 |
| `/artifact-validate` | Artifacts | Validate an artifact against its manifest entry and schema, checking file existence, checksum, and manifest well-formedness | Required: artifact_path; Optional: manifest_path, check_schema, check_checksum | PASS/FAIL result + blocker_report on failure | artifact-server | 5 |

> Note: `/project-scan` and `/requirements-brief` each appear in two categories in the taxonomy. `/project-scan` belongs to both Foundation and the discovery workflow. `/requirements-brief` bridges Discovery and Editorial. Both are listed in their primary categories below.

---

## Section 3: Per-Category Sections

---

### 3.1 Foundation

The Foundation category contains the framework's entry points, navigation aids, and session management commands. These commands do not produce editorial artifacts â€” they establish the operating context, help users understand the system state, and guide agents and users toward the right next action. Foundation commands are the first commands run in any session and the commands to return to when orientation is lost.

#### `/help`

- **Purpose:** Reads all command spec files from `.writing-framework/commands/`, extracts name, purpose, phase, and status, and renders a grouped table organized by category. When called with a `command_name` argument, renders the full spec for that single command.
- **Key inputs:** Optional `command_name` string to scope output to a single command.
- **Key outputs:** Markdown table of all commands (or full spec for one command) rendered to chat.
- **Owning agent:** lead-orchestrator
- **Typical invocation:** Called at the start of any session when a user needs to discover available commands, or when an agent needs to verify a command's spec before invoking it.
- **Dependencies:** None â€” `/help` is a framework entry point. It precedes all other commands.

#### `/session-start`

- **Purpose:** Loads doctrine from `doctrine/`, reads `CLAUDE.md`, scans `logs/` and cache-server for active run state, confirms the active style pack is readable, and outputs a session context summary with the recommended next step.
- **Key inputs:** Optional `run_id` to resume a specific run; optional `project` identifier.
- **Key outputs:** Session context summary including doctrine files loaded, active run ID and phase, active style pack, and recommended next command.
- **Owning agent:** lead-orchestrator
- **Typical invocation:** The first command in every production session. Invoked before any editorial work begins. Also invoked after `/upgrade-framework` or `/install-framework` to reload updated definitions.
- **Dependencies:** Precedes all other commands. Reads `CLAUDE.md`, `doctrine/`, `logs/`, and (Phase 2+) cache-server.

#### `/project-scan`

- **Purpose:** Scans `styles/`, `guides/`, `doctrine/`, `artifacts/`, `logs/`, `schemas/`, `workflows/`, and `templates/` directories and produces a structured snapshot of all project content. Flags anomalies: missing directories, orphaned artifacts, schema files without matching commands.
- **Key inputs:** Optional `scope` (full, artifacts, guides, runs, styles) and `path` (root directory to scan).
- **Key outputs:** Scan report with inventory of artifacts, guides, runs, and schemas.
- **Owning agent:** discovery-agent
- **Typical invocation:** After `/session-start` when deeper project context is needed before running discovery. Also useful for troubleshooting missing artifacts or guide coverage.
- **Dependencies:** Run after `/session-start`. Run before `/discovery`.

#### `/status`

- **Purpose:** Reports the current or most recent run's phase, completed steps, pending steps, open blockers, artifacts produced, elapsed time, and recommended next action. In Phase 1, infers state from the filesystem; in Phase 2+ queries cache-server.
- **Key inputs:** Optional `run_id`; defaults to active run or most recent run from logs.
- **Key outputs:** Run status report rendered to chat.
- **Owning agent:** lead-orchestrator
- **Typical invocation:** Any time a user or agent needs to understand the current state of a production run â€” after a blockage, when resuming a session, or when /whats-next is needed with full context.
- **Dependencies:** Run after `/session-start`. Uses cache-server (Phase 2+) or `logs/` (Phase 1).

#### `/whats-next`

- **Purpose:** Inspects current project state and outputs a single recommended command with a 2â€“3 sentence justification. Follows a defined recommendation ladder: no run â†’ `/discovery`; no brief â†’ `/write-brief`; no outline â†’ `/write-outline`; no draft â†’ `/draft-document`; no QA â†’ `/qa-final`; blockers present â†’ address blocker.
- **Key inputs:** Optional `run_id`; optional `context` freetext.
- **Key outputs:** One recommended command name plus justification grounded in current project state.
- **Owning agent:** lead-orchestrator
- **Typical invocation:** When a user is uncertain what to do next, or at the start of a new session when run state is unclear. Also called at the end of orchestrate commands when outputting a recommended next step.
- **Dependencies:** Run after `/status`. Output always names a specific subsequent command.

#### `/explain-workflow`

- **Purpose:** Locates a workflow file in `workflows/` or a command spec in `.writing-framework/commands/` and renders it as a step-by-step human-readable explanation including agent assignments, inputs, outputs, quality gates, and related commands.
- **Key inputs:** Required `workflow_name` (workflow filename or command name).
- **Key outputs:** Workflow explanation rendered to chat with all steps, gates, and agent assignments.
- **Owning agent:** lead-orchestrator
- **Typical invocation:** When a user wants to understand a specific workflow before running it, or when an agent needs to understand a workflow's full behavior to coordinate execution.
- **Dependencies:** Read-only. No dependencies; can be run at any time.

---

### 3.2 Discovery

The Discovery category contains the commands that establish project context before any writing work begins. Discovery is mandatory â€” no draft, brief, or outline should be produced without a prior discovery pass. These commands read the repository, infer defaults, identify genuine blockers, and produce structured reports that downstream editorial commands consume. The goal is to minimize questions to the user by maximizing what can be read or inferred from the repo.

#### `/discovery`

- **Purpose:** Runs the full discovery sequence via the `discovery-orchestrator` agent: reads all existing project files (briefs, outlines, drafts, logs, guide records, style packs), identifies confirmed facts, infers reasonable defaults, surfaces assumptions, and classifies genuine blockers. Produces a discovery report with five sections: Confirmed Context, Inferred Context, Assumptions, Blockers, Immediate Actions.
- **Key inputs:** Optional `scope` (full, context-only, blockers-only); optional `domain` override.
- **Key outputs:** `discovery_report` markdown + `blocker_report[]` array + `immediate_actions` list.
- **Owning agent:** discovery-orchestrator
- **Typical invocation:** The first editorial command in any production run, immediately after `/session-start`. Required before `/write-brief` or `/requirements-brief`. Also invoked by `/orchestrate-brief` as its first step.
- **Dependencies:** Run after `/session-start`. Feeds into `/requirements-brief` and `/write-brief`.

#### `/discovery-agent`

- **Purpose:** Runs a targeted discovery pass against a specific scope â€” a file path, directory, artifact type, or topic keyword â€” without executing a full project discovery. Returns a shorter targeted discovery note using the same four-section structure (Confirmed Context, Inferred Context, Assumptions, Blockers).
- **Key inputs:** Required `scope` (file path, directory, artifact type, or topic keyword); optional `question` to focus the pass.
- **Key outputs:** Targeted discovery note (four-section format) returned to the calling command or agent.
- **Owning agent:** discovery-agent
- **Typical invocation:** Called mid-task when additional context is needed for a specific file or topic without restarting the full discovery workflow. Used by agents when they encounter a scope-limited knowledge gap.
- **Dependencies:** Can be called at any point. Supplements, does not replace, `/discovery`.

#### `/discovery-simulate-user`

- **Purpose:** Runs the full discovery sequence with all escalation triggers suppressed. Instead of pausing to ask the user about genuine blockers, it applies domain-appropriate defaults with explicit confidence levels (high/medium/low). Adds a Simulated Answers section to the discovery report documenting every simulated decision.
- **Key inputs:** Optional `domain`; optional `confidence_threshold` (high, medium, low â€” controls how aggressively defaults are applied).
- **Key outputs:** `discovery_report` with Simulated Answers section + `simulated_answers[]` array.
- **Owning agent:** discovery-orchestrator
- **Typical invocation:** For automated pipeline runs where no human is available to answer discovery questions. All simulated answers are marked as assumptions requiring user review before high-stakes work proceeds.
- **Dependencies:** Same as `/discovery`. Precedes `/write-brief` in unattended pipeline runs.

#### `/requirements-brief`

- **Purpose:** Consolidates everything known about a project â€” from a completed discovery report and any user-confirmed overrides â€” into a structured pre-brief document. All nine brief fields are populated with provenance labels (confirmed/inferred/user-specified). This is the bridge from discovery to brief writing.
- **Key inputs:** Optional `discovery_report` path (defaults to most recent); optional `overrides` freetext.
- **Key outputs:** Requirements brief markdown with all nine fields populated and labeled by provenance.
- **Owning agent:** brief-writer
- **Typical invocation:** After `/discovery` completes, before `/write-brief`. Creates a clean, reviewable intermediate document that separates what is known from what is inferred.
- **Dependencies:** Run after `/discovery`. Feeds directly into `/write-brief`.

---

### 3.3 Research

The Research category contains commands for gathering, validating, and organizing evidence that informs document drafting. These commands operate on the knowledge base available to agents (guide records, canon, source materials) and produce structured `research_report` objects that section drafters and QA agents consume. Research is not required for all document types â€” short general-writing tasks may skip directly to drafting â€” but is mandatory for any document making factual, evaluative, or causal claims.

#### `/research`

- **Purpose:** Conducts a research pass on a specified topic by searching available knowledge sources (guide-server canon records, style packs, project files, attached source materials), scoring sources for relevance and reliability, synthesizing findings, and identifying gaps. Produces a schema-validated `research_report`.
- **Key inputs:** Required `topic`; optional `brief` for relevance scoring context; optional `depth` (quick/standard/deep).
- **Key outputs:** `research_report` with sources (citation, summary, relevance score, reliability), synthesis narrative, and gaps section.
- **Owning agent:** discovery-agent
- **Typical invocation:** After `/write-brief`, before drafting begins. Called by `/orchestrate-draft` when the brief requires research-backed claims. May be called multiple times for different topic areas.
- **Dependencies:** Run after `/write-brief`. Feeds into `/validate-research`, `/synthesize-research`, and `/draft-document`.

#### `/validate-research`

- **Purpose:** Reviews a completed `research_report` for source quality (relevance, reliability, currency), synthesis coherence and grounding, and gaps completeness. Issues an accept, conditional accept, or block verdict.
- **Key inputs:** Required `research_report`; optional `brief` for relevance context.
- **Key outputs:** Validation summary conforming to `review_report` schema with per-source evaluations and overall verdict.
- **Owning agent:** discovery-agent (with adversarial-reviewer)
- **Typical invocation:** After `/research` completes, before `/synthesize-research` or `/draft-document`. A block verdict requires additional research before drafting proceeds.
- **Dependencies:** Run after `/research`. Feeds into `/synthesize-research` or directly into `/draft-document`.

#### `/synthesize-research`

- **Purpose:** Merges two or more `research_report` objects into a single unified report. Deduplicates sources, identifies and documents conflicting findings, groups sources by topic cluster, and produces a single coherent synthesis narrative.
- **Key inputs:** Required `reports` (two or more research report paths or inline content); optional `brief` for relevance-guided clustering.
- **Key outputs:** Unified `research_report` with all sources, merged synthesis, and deduplicated gaps section.
- **Owning agent:** discovery-agent
- **Typical invocation:** When multiple research passes have been run on different topics and must be combined before drafting. Called before `/draft-document` in research-heavy production runs.
- **Dependencies:** Run after `/research` (and optionally `/validate-research`). Feeds into `/draft-document`.

#### `/source-gap-check`

- **Purpose:** Scans a document draft for claim types (factual, evaluative, causal, statistical) and checks each against the research report, canon records, and domain knowledge. Reports unsupported claims with location, type, severity (critical/major/minor), and recommended action.
- **Key inputs:** Required `draft`; optional `research_report`.
- **Key outputs:** Gap report listing every unsupported claim, prioritized by severity.
- **Owning agent:** adversarial-reviewer
- **Typical invocation:** After a draft is produced, before QA review. Used to identify claims that need sourcing before the skeptic QA perspective will be satisfied. Five or more critical gaps triggers a recommendation for an additional research pass.
- **Dependencies:** Run after `/draft-document` or `/merge-draft`. Paired with `/evidence-map` for full audit coverage.

#### `/evidence-map`

- **Purpose:** Produces a comprehensive claim-to-source audit trail for an entire document. Every sentence containing a claim is mapped to its supporting source or marked as unsupported, domain-standard, partially supported, or supported. Includes a summary table with counts and a recommendations section.
- **Key inputs:** Required `draft`; optional `research_report`.
- **Key outputs:** Evidence map (claim-source mapping per section) + summary table + recommendations.
- **Owning agent:** adversarial-reviewer
- **Typical invocation:** When the publication requires rigorous evidentiary accountability, or when the source-gap-check found problems and a full audit is needed. Used before final publication sign-off on research-intensive documents.
- **Dependencies:** Run after `/source-gap-check` or `/draft-document`. Complements `/validate-research`.

---

### 3.4 Editorial

The Editorial category contains the core writing and editing commands that transform a validated brief and outline into a complete, polished document. These commands form the heart of the production pipeline. They include the brief and outline generation commands, explicit phase validators for brief and outline gates, the multi-level drafting commands (full document and individual sections), and the editing passes (line edit, voice, compression, rewrite) that bring a draft to publication quality. Validation commands now span both pre-draft structure checks (`/validate-brief`, `/validate-outline`) and late-stage editorial checks (`/canon-check`, `/publication-check`).

#### `/write-brief`

- **Purpose:** Produces a schema-validated `brief.json` from discovery and requirements context. Populates the current brief schema fields such as `brief_id`, `title`, `task_type`, `audience`, `purpose`, `scope`, `style_pack`, `success_criteria`, `constraints`, and run metadata. The brief is the authoritative project specification consulted by every downstream agent.
- **Key inputs:** Optional `requirements_brief`, `discovery_report`, or inline `user_requirements`; optional `style_pack_override`.
- **Key outputs:** `brief.json` (schema-validated) plus an optional markdown summary.
- **Owning agent:** brief-writer
- **Typical invocation:** After `/requirements-brief` or `/discovery` completes. Before `/validate-brief` and `/write-outline`. Also invoked by `/orchestrate-brief` as its core step.
- **Dependencies:** Run after `/requirements-brief`. Feeds into `/validate-brief`, `/write-outline`, and all subsequent agents.

#### `/write-outline`

- **Purpose:** Produces a schema-validated `outline.json` from an active brief. Defines every section with `section_id`, `title`, `level`, `purpose`, `required_content`, `estimated_words`, and optional subsection details. Checks templates and structure guides for reader-facing sequence.
- **Key inputs:** Optional `brief`; optional `template_override`.
- **Key outputs:** `outline.json` (schema-validated) plus an optional markdown summary.
- **Owning agent:** outline-architect
- **Typical invocation:** After `/write-brief` and usually after `/validate-brief`. Before `/validate-outline`, `/draft-document`, or `/draft-section`. Also invoked by `/orchestrate-outline`.
- **Dependencies:** Run after `/write-brief`. Feeds into `/validate-outline`, `/draft-section`, and `/draft-document`.

#### `/validate-brief`

- **Purpose:** Validates a brief against `brief.schema.json` and the Brief Gate without modifying the artifact. Distinguishes schema errors from gate failures and returns remediation guidance.
- **Key inputs:** Optional `brief_id`; optional `brief_json`.
- **Key outputs:** `validation_report` with schema status, gate status, failed criteria, and warnings.
- **Owning agent:** lead-editor
- **Typical invocation:** After `/write-brief` when the brief must be checked explicitly before outline work begins. Also useful during debugging or manual runs.
- **Dependencies:** Run after `/write-brief`. Precedes `/write-outline`.

#### `/validate-outline`

- **Purpose:** Validates an outline against `outline.schema.json` and the Outline Gate without modifying the artifact. Reports section-level structural failures before drafting begins.
- **Key inputs:** Optional `outline_id`; optional `outline_json`.
- **Key outputs:** `validation_report` with schema status, gate status, failed criteria, and warnings.
- **Owning agent:** lead-editor
- **Typical invocation:** After `/write-outline` when the outline must be checked explicitly before drafting begins. Also useful during debugging or manual runs.
- **Dependencies:** Run after `/write-outline`. Precedes `/draft-section` and `/draft-document`.

#### `/draft-section`

- **Purpose:** Drafts a single document section using its outline spec (title, purpose, scope, word count), the active brief, the active style pack, applicable guide records (canon, examples, anti-patterns), and any research report. Applies a self-QA pass (reader, skeptic, domain, style, coherence, AI-stink) before delivering.
- **Key inputs:** Required `section_id`; optional `outline`, `brief`, `research_report`.
- **Key outputs:** Complete prose section as markdown with appropriate heading level.
- **Owning agent:** section-drafter
- **Typical invocation:** Called per-section by `/draft-document`. May also be called directly when only one section needs to be drafted or re-drafted.
- **Dependencies:** Run after `/write-outline`. Called by `/draft-document`. Output feeds into `/merge-draft`.

#### `/draft-document`

- **Purpose:** Orchestrates the full document drafting sequence: calls `/draft-section` for each outline section in order, then calls `/merge-draft` on the results. Runs a self-QA pass on the merged document (reader, skeptic, AI-stink) and applies one revision pass if findings are serious.
- **Key inputs:** Optional `outline`, `brief`, `research_report`.
- **Key outputs:** `merged_draft` (markdown file) + `merge_report` (JSON).
- **Owning agent:** lead-orchestrator
- **Typical invocation:** After `/write-outline` and optionally `/research`. The primary single-command path to a complete first draft. Called by `/orchestrate-draft` as its core drafting step.
- **Dependencies:** Run after `/write-outline` and usually after `/validate-outline`. Calls `/draft-section` and `/merge-draft`. Feeds into QA commands or `/orchestrate-review`.

#### `/merge-draft`

- **Purpose:** Merges an ordered list of section drafts into a single document by normalizing heading hierarchy, voice deviations at section boundaries, awkward transitions, duplicate content, and formatting inconsistencies. Every normalization action is recorded in a `merge_report`.
- **Key inputs:** Required `sections` (ordered list); optional `brief`.
- **Key outputs:** `merged_draft` (markdown file) + `merge_report` (JSON) recording all operations.
- **Owning agent:** merge-normalizer
- **Typical invocation:** Called automatically by `/draft-document`. May be called directly when section drafts have been produced independently and need to be combined.
- **Dependencies:** Run after all `/draft-section` calls complete. Feeds into editing passes (`/line-edit`, `/voice-pass`) or QA commands.

#### `/rewrite`

- **Purpose:** Applies a structured set of operations to a document as specified by a `rewrite_plan` schema object. Operation types include: cut, rewrite, expand, restructure, voice-fix, fact-check, and canon-fix. Applies operations in priority order, preserving all non-targeted content. Runs self-checks on rewritten sections.
- **Key inputs:** Required `rewrite_plan`; optional `draft`.
- **Key outputs:** `revised_draft` (markdown file) + `changes_summary` listing every operation applied.
- **Owning agent:** section-drafter
- **Typical invocation:** After `/qa-final` or `/orchestrate-review` returns a failed QA gate or a rewrite path. The `rewrite_plan` is typically generated from QA findings or the review workflow. Precedes another QA pass or `/line-edit`.
- **Dependencies:** Run after QA commands. A `rewrite_plan` must exist (generated from QA reports or user instruction). Followed by `/line-edit` or `/voice-pass`.

#### `/line-edit`

- **Purpose:** Applies a line-level editing pass targeting word choice, sentence rhythm, redundancy, transition quality, and clarity. Three intensity levels: light (errors only), standard (errors + improvements), heavy (comprehensive). Does not restructure content or reorder paragraphs. Applies AI-stink check as a final pass.
- **Key inputs:** Required `draft`; optional `scope` (full or section_id); optional `intensity`.
- **Key outputs:** `edited_draft` with all line edits applied.
- **Owning agent:** line-editor
- **Typical invocation:** After `/merge-draft` or `/rewrite`. Before `/compress` or `/voice-pass`. Called by `/orchestrate-draft` as a normalization step after merging.
- **Dependencies:** Run after merge or rewrite. Feeds into `/compress` and `/voice-pass`.

#### `/compress`

- **Purpose:** Reduces word count while preserving all substantive claims, evidence, and structural transitions. Targets padding, throat-clearing, redundant examples, and over-explained simple points. Targets 80% of current word count by default unless the brief specifies a target. Reports original and final word counts.
- **Key inputs:** Required `draft`; optional `target_word_count`; optional `scope`.
- **Key outputs:** `compressed_draft` + `compression_report` with word count delta and edit types.
- **Owning agent:** compression-editor
- **Typical invocation:** After `/line-edit`. Before `/voice-pass` and `/qa-final`. Called by `/orchestrate-finalize` as its second step (after voice pass). Listed in Foundation category in CLAUDE.md â€” it is used both mid-pipeline and as a standalone editing utility.
- **Dependencies:** Run after `/line-edit`. Feeds into `/voice-pass`.

#### `/voice-pass`

- **Purpose:** Systematically applies style pack rules across the full document: replaces prohibited terms, corrects tone deviations, fixes sentence structure violations, and normalizes formatting (headings, lists, emphasis, tables). Flags meaning-changing passages for user review rather than auto-correcting them.
- **Key inputs:** Required `draft`; optional `style_pack` name.
- **Key outputs:** `styled_draft` + `style_correction_log` listing all corrections with type and location.
- **Owning agent:** voice-editor
- **Typical invocation:** After `/line-edit` and `/compress`. Before `/qa-style` and `/canon-check`. Called by `/orchestrate-finalize` as its first step. Also called by `/orchestrate-draft` as a normalization step.
- **Dependencies:** Requires an active style pack (loaded via `/apply-style-pack`). Run after compression. Feeds into `/qa-style` and `/canon-check`.

#### `/canon-check`

- **Purpose:** Validates a document against all active canon guide records for the domain. For each canon record, scans the document for statements that contradict or misrepresent it. Reports violations (blocking, major, minor) and near-misses (warnings) with location and recommended fix.
- **Key inputs:** Required `draft`; optional `domain`.
- **Key outputs:** `canon_check_report` with violations list, warnings list, and verdict (pass/conditional/fail).
- **Owning agent:** canon-checker
- **Typical invocation:** After `/voice-pass`. Before `/publication-check` and `/qa-domain`. A fail verdict requires the document to be revised before export.
- **Dependencies:** Requires active canon records in guide-server or `guides/canon/`. Feeds into `/publication-check`.

#### `/publication-check`

- **Purpose:** The final editorial gate before artifact generation. Runs seven checks: completeness (all outline sections present, no TODOs), format validity (markdown, heading hierarchy), schema compliance (front matter), brief alignment (success criteria met), canon consistency (no unresolved violations), QA gate status (all blocking findings resolved), and AI-stink scan.
- **Key inputs:** Required `draft`; optional `brief`; optional `qa_reports`.
- **Key outputs:** `publication_check_report` conforming to `quality_gate` schema with all check results and a publication verdict (publication_ready / conditional / not_ready).
- **Owning agent:** lead-editor
- **Typical invocation:** After `/qa-final` and `/canon-check`. Before `/orchestrate-artifact` or `/write-markdown`. Called by `/orchestrate-finalize` as its third step.
- **Dependencies:** Requires completed QA cycle. Feeds into artifact generation commands.

---

### 3.5 QA

The QA category contains the seven quality assurance commands that implement the framework's structured review system. Six commands each apply one perspective to a document and produce a single-perspective `review_report`; the seventh aggregates all reports into a `quality_gate` verdict. Each perspective targets a distinct failure mode that the others may miss. QA commands are read-only â€” they never modify documents. A failing gate result routes the draft back to revision work rather than allowing it to advance.

#### `/qa-reader`

- **Purpose:** Evaluates the document from the intended reader's perspective across five dimensions: assumed knowledge, promise fulfillment, clarity, section relevance, and overall flow. Produces a single-perspective `review_report` with issue severities and a perspective-level gate decision.
- **Key inputs:** Required `draft`; optional `brief` for audience definition.
- **Key outputs:** `review_report` with perspective label `reader`, findings, and verdict.
- **Owning agent:** qa-reader
- **Typical invocation:** Run in parallel with the other five QA perspective commands as part of `/orchestrate-review`. May be run standalone for targeted reader feedback on a specific section.
- **Dependencies:** Run after drafting is complete. Run before `/qa-final`. All six perspectives feed into `/qa-final`.

#### `/qa-skeptic`

- **Purpose:** Evaluates the document from a hostile critical reader's perspective across six dimensions: argument strength, grounding of assertions, padding, hedging, conclusion validity, and the three strongest hostile pushback points. Produces a single-perspective `review_report` with issue severities and a perspective-level gate decision.
- **Key inputs:** Required `draft`; optional `brief` for goal and success criteria context.
- **Key outputs:** `review_report` with perspective label `skeptic`, including explicit statement of the three strongest objections.
- **Owning agent:** qa-skeptic
- **Typical invocation:** Run in parallel with other QA perspectives in `/orchestrate-review`. Especially important for persuasive documents, arguments, and recommendations.
- **Dependencies:** Same as `/qa-reader`.

#### `/qa-domain`

- **Purpose:** Evaluates domain convention adherence across five dimensions: terminology correctness, canon compliance, convention adherence (structure, tone, treatment), knowledge representation accuracy, and example/reference appropriateness. Canon violations are always rated blocking.
- **Key inputs:** Required `draft`; optional `domain` override.
- **Key outputs:** `review_report` with perspective label `domain`.
- **Owning agent:** qa-domain
- **Typical invocation:** Run in parallel with other QA perspectives. Especially important for D&D/worldbuilding, card game, and technical-adjacent documents where domain accuracy is a hard requirement.
- **Dependencies:** Requires active canon records and domain guides. Feeds into `/qa-final`.

#### `/qa-style`

- **Purpose:** Evaluates style pack adherence across five dimensions: voice consistency, tone appropriateness, prohibited term presence, sentence structure compliance, and formatting consistency. Prohibited term violations are always rated blocking.
- **Key inputs:** Required `draft`; optional `style_pack` name.
- **Key outputs:** `review_report` with perspective label `style`, listing every prohibited term violation individually.
- **Owning agent:** qa-style
- **Typical invocation:** Run in parallel with other QA perspectives. Typically run after `/voice-pass` has applied corrections, so this serves as a final confirmation pass.
- **Dependencies:** Requires an active style pack. Feeds into `/qa-final`.

#### `/qa-coherence`

- **Purpose:** Evaluates internal structural logic and argument flow across six dimensions: structural gaps, transition quality, internal contradictions, argument progression, orphaned points, and opening/closing alignment. Contradictions are always rated blocking or major.
- **Key inputs:** Required `draft`; optional `brief` for goal and structure intent.
- **Key outputs:** `review_report` with perspective label `coherence`.
- **Owning agent:** qa-coherence
- **Typical invocation:** Run in parallel with other QA perspectives. Especially critical for long documents and multi-section arguments where local coherence may mask global incoherence.
- **Dependencies:** Same as `/qa-reader`. Feeds into `/qa-final`.

#### `/qa-ai-stink`

- **Purpose:** Scans the document for seven specific machine-generated language pattern categories: hollow affirmations, oversmooth transitions, unearned gravitas, corporate cadence, imprecise hedging, filler phrases, and suspiciously balanced conclusions. For each finding, provides the verbatim passage and a suggested rewrite or removal.
- **Key inputs:** Required `draft`.
- **Key outputs:** `review_report` with perspective label `ai-stink`, including verbatim quotes and suggested rewrites for every finding.
- **Owning agent:** qa-ai-stink
- **Typical invocation:** Run in parallel with other QA perspectives. Typically run after `/line-edit` has addressed obvious patterns. Findings from this perspective are most actionable for the `/rewrite` command.
- **Dependencies:** Same as `/qa-reader`. Feeds into `/qa-final`.

#### `/qa-final`

- **Purpose:** Aggregates all available perspective reports from the current run, checks required QA coverage, and issues a formal `quality_gate` result conforming to the `quality_gate` schema. The gate result decides whether the draft may advance.
- **Key inputs:** Required `draft`; optional `perspective_reports`; optional `run_id`.
- **Key outputs:** `quality_gate` (schema-validated JSON + markdown) with criteria results, unmet criteria, and next action.
- **Owning agent:** qa-final
- **Typical invocation:** After all six perspective commands have run. Called by `/orchestrate-review` as its aggregation step. A `FAIL` result routes the draft back to revision work.
- **Dependencies:** Run after all six perspective commands. Feeds into `/orchestrate-finalize` on `PASS` or `/rewrite` / review rework on `FAIL`.

---

### 3.6 Orchestration

The Orchestration category contains seven commands that coordinate multiple primitive commands in sequence with gate-based advancement logic. Each orchestration command manages a complete phase of the production pipeline, handling research checks, agent handoffs, QA loops, and revision passes automatically. Orchestration commands are the recommended path for fully automated production runs â€” they reduce the number of individual commands a user must invoke and enforce quality gates between phases.

#### `/orchestrate-brief`

- **Purpose:** Manages the full brief production sequence: `/session-start` â†’ `/discovery` â†’ blocker resolution â†’ `/requirements-brief` â†’ `/write-brief` â†’ abbreviated QA (reader + skeptic perspectives). Returns a validated brief and an orchestration summary.
- **Key inputs:** Optional `context` freetext; optional `domain`.
- **Key outputs:** `brief` (schema-validated) + `orchestration_summary`.
- **Owning agent:** lead-orchestrator
- **Typical invocation:** The recommended entry point for any new production run. Replaces manually running the first four pipeline commands in sequence.
- **Dependencies:** Invokes: `/session-start`, `/discovery`, `/requirements-brief`, `/write-brief`. Run before `/orchestrate-outline`.

#### `/orchestrate-outline`

- **Purpose:** Manages the outline production sequence: validate active brief â†’ guide retrieval â†’ `/write-outline` â†’ outline QA (structure, scope, word count, section distinctness). Applies one revision pass if issues are found.
- **Key inputs:** Optional `brief`.
- **Key outputs:** `outline` (schema-validated) + `orchestration_summary`.
- **Owning agent:** lead-orchestrator
- **Typical invocation:** After `/orchestrate-brief` produces a validated brief. Before `/orchestrate-draft`.
- **Dependencies:** Requires a valid brief. Invokes: `/write-outline`. Run before `/orchestrate-draft`.

#### `/orchestrate-draft`

- **Purpose:** Manages the full draft production sequence: research check â†’ `/draft-document` â†’ `/line-edit` + `/voice-pass` normalization â†’ `/qa-reader` + `/qa-coherence` + `/qa-ai-stink` draft QA â†’ gate evaluation with rewrite loop. Returns a complete normalized draft-QA-passed document.
- **Key inputs:** Optional `outline`; optional `research_report`.
- **Key outputs:** `draft` (markdown file) + `draft_qa_reports[]` + `orchestration_summary`.
- **Owning agent:** lead-orchestrator
- **Typical invocation:** After `/orchestrate-outline`. Before `/orchestrate-review`.
- **Dependencies:** Requires valid outline. Invokes: `/research` (if needed), `/draft-document`, `/line-edit`, `/voice-pass`, `/qa-reader`, `/qa-coherence`, `/qa-ai-stink`, `/rewrite` (if draft QA fails). Run before `/orchestrate-review`.

#### `/orchestrate-review`

- **Purpose:** Dispatches all six QA perspective commands in parallel (or sequentially if parallel dispatch is unsupported), collects their `review_report` outputs, passes them to `/qa-final` for aggregation, and returns either an approved draft (PASS), a `rewrite_plan` (REVISE), or a block escalation (BLOCK). BLOCK verdicts require explicit user authorization before proceeding.
- **Key inputs:** Required `draft`, `brief`; optional `run_id`, `perspective_set`.
- **Key outputs:** `quality_gate` JSON + `approved_draft` path (on PASS) or `rewrite_plan` (on REVISE) + `orchestration_summary`.
- **Owning agent:** lead-orchestrator
- **Typical invocation:** After `/orchestrate-draft`. Before `/orchestrate-finalize`. The primary full-review entry point.
- **Dependencies:** Invokes: `/qa-reader`, `/qa-skeptic`, `/qa-domain`, `/qa-style`, `/qa-coherence`, `/qa-ai-stink`, `/qa-final`. Requires passing gate before `/orchestrate-finalize` can run.

#### `/orchestrate-finalize`

- **Purpose:** Runs the finalization sequence after a passing QA gate: `/voice-pass` â†’ `/compress` â†’ `/publication-check` â†’ Final Gate evaluation. Returns the final approved document and a `quality_gate.json` with a FINAL_PASS or FINAL_BLOCK verdict.
- **Key inputs:** Required `draft`, `brief`; optional `run_id`, `skip_voice_pass`, `skip_compress`.
- **Key outputs:** `final_document` (markdown file in `artifacts/final/`) + `quality_gate` JSON + `orchestration_summary`.
- **Owning agent:** lead-orchestrator
- **Typical invocation:** After `/orchestrate-review` returns a PASS verdict. Before `/orchestrate-artifact`.
- **Dependencies:** Requires a PASS gate from `/orchestrate-review`. Invokes: `/voice-pass`, `/compress`, `/publication-check`. Run before `/orchestrate-artifact`.

#### `/orchestrate-artifact`

- **Purpose:** Generates all requested artifact formats from the final approved document. For each format in `target_formats`, calls the corresponding write command (`/write-markdown`, `/write-docx`, `/write-pdf`, `/write-latex`), immediately validates each artifact with `/artifact-validate`, and produces a consolidated `artifact_manifest.json` with checksum and validation status for every format.
- **Key inputs:** Required `source_document`, `target_formats`; optional `output_directory`, `run_id`, `template_path`.
- **Key outputs:** `artifact_manifest` JSON + `generated_files` list + `orchestration_summary`.
- **Owning agent:** artifact-orchestrator
- **Typical invocation:** After `/orchestrate-finalize` returns FINAL_PASS. Before `/orchestrate-export`.
- **Dependencies:** Requires a FINAL_PASS gate. Invokes: `/write-markdown`, `/write-docx`, `/write-pdf`, `/write-latex`, `/artifact-validate`. Run before `/orchestrate-export`.

#### `/orchestrate-export`

- **Purpose:** Packages a completed production run for delivery or sync by collecting all artifacts, briefs, outlines, QA reports, and the final document into a versioned export pack, computing SHA-256 checksums, and writing a `sync_manifest.json`.
- **Key inputs:** Required `run_id`; optional `export_scope`, `output_path`, `pack_name`, `include_logs`.
- **Key outputs:** `export_pack` directory + `sync_manifest` JSON + `run_summary` JSON + `export_summary`.
- **Owning agent:** import-export-orchestrator
- **Typical invocation:** After `/orchestrate-artifact`. The final step in a complete production run. Produces a deliverable package.
- **Dependencies:** Requires validated artifacts from `/orchestrate-artifact`. Invokes: `/export-framework`, `/export-docx`, `/export-pdf`. Feeds into `/import-framework` (if delivering to another repo).

---

### 3.7 Guides

The Guides category contains the commands for managing the guide-server knowledge base. Guide records are the persistent, structured knowledge store that agents consult at every phase: doctrine records establish non-negotiable rules, canon records establish domain facts, style pack records define voice and terminology, rubrics define QA criteria, templates provide document structure, examples provide worked production output, anti-patterns document what not to do, and decision records capture resolved architectural choices. The guide commands create, update, search, link, promote, and deprecate these records, keeping the knowledge base accurate and well-maintained.

#### `/add-guide`

- **Purpose:** Creates a new guide record in guide-server and writes its filesystem mirror to `.writing-framework/guides/{type}/`. Checks for duplicate titles and types before creating. Returns the assigned `guide_id` and mirror path.
- **Key inputs:** Required `content`, `type`, `title`, `summary`; optional `tags`, `domain`, `status`, `linked_guides`.
- **Key outputs:** `guide_record` (JSON with assigned guide_id) + `mirror_path` + confirmation.
- **Owning agent:** lead-editor
- **Typical invocation:** When a new guide record needs to be created â€” typically after `/guide-gap-check` identifies a coverage gap and generates an `/add-guide` stub. New records start in `draft` status and must be promoted via `/guide-promote`.
- **Dependencies:** Typically follows `/guide-gap-check` stub generation. May call `/guide-link` if `linked_guides` are specified. Leads into `/guide-promote`.

#### `/update-guide`

- **Purpose:** Updates an existing guide record by ID in guide-server and refreshes the filesystem mirror. Supports updating content, title, summary, tags, domain, and status. Appends a revision history entry to the mirror frontmatter.
- **Key inputs:** Required `guide_id`; optional updated fields; optional `update_reason`.
- **Key outputs:** `updated_guide_record` (confirmed by guide-server) + `mirror_path`.
- **Owning agent:** lead-editor
- **Typical invocation:** When a guide record's content needs revision â€” after new information is available, after QA findings identify a guide gap, or after a doctrine decision changes an existing rule.
- **Dependencies:** Requires an existing guide record. Doctrine and canon record updates should include an `update_reason`. Type changes require deprecating and recreating via `/guide-deprecate` + `/add-guide`.

#### `/find-guides`

- **Purpose:** Executes an FTS5 full-text search against guide-server with optional filters for type, domain, tags, and status. Falls back to filesystem grep if guide-server is unavailable. Returns ranked results with relevance scores.
- **Key inputs:** Required `query`; optional `type`, `domain`, `tags`, `status`, `limit`, `include_content`.
- **Key outputs:** Ranked results table + raw JSON results array + search metadata.
- **Owning agent:** Any agent (callable by all agents)
- **Typical invocation:** Called by any agent during a production run whenever relevant guides need to be retrieved â€” before drafting, before QA, during discovery, before style or doctrine application. Also called manually when a user needs to search the knowledge base.
- **Dependencies:** None â€” callable at any time by any agent. Called by `/guide-gap-check` internally.

#### `/guide-gap-check`

- **Purpose:** Analyzes a task description or domain to identify which guide types are missing or underpopulated in guide-server. Queries `/find-guides` for each of the five core guide types (doctrine, style_pack, canon, rubric, anti_pattern) and generates ready-to-run `/add-guide` command stubs for every critical or thin gap.
- **Key inputs:** Optional `task_description` or `domain` (at least one required); optional `guide_types_to_check`; optional `include_examples`.
- **Key outputs:** `gap_report` JSON + formatted gap summary table + `/add-guide` command stubs.
- **Owning agent:** discovery-agent
- **Typical invocation:** After `/discovery` when setting up a new project or new domain. Also run on demand when guides seem insufficient for a production task.
- **Dependencies:** Calls `/find-guides` internally for each guide type. Generates stubs that feed directly into `/add-guide`.

#### `/guide-link`

- **Purpose:** Creates a typed directional relationship between two guide records in guide-server. Five link types: extends, contradicts, replaces, supports, requires. Validates both records exist and no duplicate link exists before creating.
- **Key inputs:** Required `guide_id_1`, `guide_id_2`, `link_type`; optional `link_note`.
- **Key outputs:** `link_record` (JSON with assigned link_id) + confirmation showing both guide titles.
- **Owning agent:** lead-editor
- **Typical invocation:** After `/add-guide` when the new record relates to existing records. After `/guide-deprecate` when a replacement record is being linked. A `contradicts` link between doctrine records always triggers a doctrine coherence escalation.
- **Dependencies:** Both guide records must exist. `replaces` links should be accompanied by `/guide-deprecate` on the replaced record.

#### `/guide-promote`

- **Purpose:** Moves a guide record from `draft` to `active` status after checking three promotion criteria: prior use in at least one completed run, no doctrine conflicts, and no active duplicates. Active records appear in default searches and are loaded by agents during production runs.
- **Key inputs:** Required `guide_id`; optional `override_criteria`, `override_reason`.
- **Key outputs:** `promoted_guide_record` (status: active) + `promotion_report` with criteria check results.
- **Owning agent:** lead-editor
- **Typical invocation:** After a new guide record created with `/add-guide` has been reviewed and confirmed ready for production use.
- **Dependencies:** Guide must be in `draft` status. Checks via `/find-guides` for duplicates and doctrine conflicts. Cannot promote a `deprecated` record.

#### `/guide-deprecate`

- **Purpose:** Marks a guide record as `deprecated`, preserving the record in guide-server but excluding it from default searches. Requires a documented deprecation reason. Optionally links to a replacement record. Checks for active run contexts that reference the deprecated record and warns about them.
- **Key inputs:** Required `guide_id`, `deprecation_reason`; optional `replaced_by`.
- **Key outputs:** `deprecated_guide_record` (status: deprecated) + deprecation confirmation + active run warnings.
- **Owning agent:** lead-editor
- **Typical invocation:** When a guide record has been superseded, is no longer accurate, or conflicts with a newer record. Always paired with a `replaced_by` reference if a replacement exists.
- **Dependencies:** Guide must not already be deprecated. If `replaced_by` is specified, calls `/guide-link` with `link_type: replaces`. Doctrine records without replacements require explicit lead-editor confirmation.

---

### 3.8 Sync

The Sync category now exposes two primary user-facing commands: `/import-framework` and `/export-framework`. The older sync surfaces remain available as compatibility wrappers, but they are no longer the preferred mental model. Portable bundles still exist, but bundle transport is an implementation detail of `/export-framework` and `/import-framework` rather than the primary entry point.

#### `/import-framework`

- **Purpose:** Primary inbound sync command. Imports framework updates into the current repository from either another framework repo or a portable bundle. Protects local canon, decision records, artifacts, and logs from overwrite.
- **Key inputs:** Required `source_path`; optional `conflict_resolution_mode`, `components`, `dry_run`, `backup`.
- **Key outputs:** `sync_manifest` JSON + `import_summary` + optional backup directory.
- **Owning agent:** framework-sync-agent
- **Typical invocation:** When pulling framework updates from another repo or applying an exported bundle into the current repo.
- **Dependencies:** Auto-detects repo source vs bundle source. Reads adapter surfaces in addition to `.writing-framework/` when adapters are in scope.

#### `/export-framework`

- **Purpose:** Primary outbound sync command. Exports this repository's framework either directly into another repo or into a portable bundle with `pack_manifest.json`.
- **Key inputs:** Optional `destination_path`, `destination_type`, `components`, `pack_name`, `conflict_resolution_mode`, `dry_run`, `backup`.
- **Key outputs:** `sync_manifest` JSON + `export_summary` + bundle directory or target repo updates.
- **Owning agent:** import-export-orchestrator
- **Typical invocation:** When publishing framework improvements to another repo or preparing a portable framework bundle.
- **Dependencies:** Collects `.writing-framework/` plus tool adapter surfaces when adapters are in scope.

#### `/import-principles`

- **Purpose:** Legacy compatibility surface for doctrine/style-only imports. Delegates to `/import-framework` with doctrine/style scope.
- **Key inputs:** Required `source_path`, `conflict_resolution_mode`; optional `scope`, `dry_run`.
- **Key outputs:** `sync_manifest` JSON + `import_summary`.
- **Owning agent:** framework-sync-agent
- **Typical invocation:** Only when an older workflow or adapter still references the principles-specific command name.
- **Dependencies:** Delegates to `/import-framework`.

#### `/export-principles`

- **Purpose:** Legacy compatibility surface for doctrine/style-only exports. Delegates to `/export-framework` with doctrine/style scope in bundle mode.
- **Key inputs:** Optional `output_path`, `pack_name`, `scope`, `include_local_extensions`, `include_guide_records`.
- **Key outputs:** `export_pack` directory + `pack_manifest` JSON + `sync_manifest` entry.
- **Owning agent:** import-export-orchestrator
- **Typical invocation:** Only when an older workflow or adapter still references the principles-specific command name.
- **Dependencies:** Delegates to `/export-framework`.

#### `/sync-principles`

- **Purpose:** Legacy compatibility surface for doctrine/style bidirectional sync. Delegates to `/import-framework` plus `/export-framework`.
- **Key inputs:** Required `source_framework_path`, `conflict_resolution_mode`; optional `scope`, `dry_run`, `export_output_path`.
- **Key outputs:** Combined `sync_manifest` JSON + `sync_summary`.
- **Owning agent:** framework-sync-agent
- **Typical invocation:** Only when an older workflow explicitly expects a two-phase principles sync command.
- **Dependencies:** Delegates to `/import-framework` and `/export-framework`.

#### `/sync-framework`

- **Purpose:** Legacy compatibility surface for full-framework imports from another repo. Delegates to `/import-framework`.
- **Key inputs:** Required `source_framework_path`, `conflict_resolution_mode`; optional `components`, `dry_run`, `backup`.
- **Key outputs:** `sync_manifest` JSON + `backup` directory (if enabled) + `sync_report`.
- **Owning agent:** framework-sync-agent
- **Typical invocation:** Only when an older workflow or operator habit still uses the previous command name.
- **Dependencies:** Delegates to `/import-framework`.

#### `/upgrade-framework`

- **Purpose:** Advanced compatibility surface for migration-aware upgrades. Uses `/import-framework` as its import mechanism, then applies migration rules.
- **Key inputs:** Required `framework_path`; optional `framework_version`, `components`, `dry_run`, `backup`.
- **Key outputs:** `sync_manifest` JSON + `upgrade_report` markdown + `backup` directory.
- **Owning agent:** framework-sync-agent
- **Typical invocation:** When a version jump requires explicit migration rules, not for routine framework updates.
- **Dependencies:** Delegates to `/import-framework`, then applies `sync/migration-rules/`.

#### `/export-pack`

- **Purpose:** Legacy compatibility surface for bundle exports. Delegates to `/export-framework` with `destination_type=bundle`.
- **Key inputs:** Required `scope`; optional `output_path`, `pack_name`, `tag`.
- **Key outputs:** `export_pack` directory + `pack_manifest` JSON + `sync_manifest` entry.
- **Owning agent:** import-export-orchestrator
- **Typical invocation:** Only when an older workflow still expects the pack terminology explicitly.
- **Dependencies:** Delegates to `/export-framework`.

#### `/import-pack`

- **Purpose:** Legacy compatibility surface for bundle imports. Delegates to `/import-framework` with bundle-source detection.
- **Key inputs:** Required `pack_path`, `conflict_resolution_mode`; optional `components`, `dry_run`, `backup`.
- **Key outputs:** `sync_manifest` JSON + `backup` directory (if enabled) + `import_summary`.
- **Owning agent:** import-export-orchestrator
- **Typical invocation:** Only when an older workflow still expects the pack terminology explicitly.
- **Dependencies:** Delegates to `/import-framework`.

#### `/install-framework`

- **Purpose:** Installs the editorial framework into a new target repository by copying `.writing-framework/` and generating tool-specific adapter files (CLAUDE.md for Claude Code, `.codex/system-prompt-template.md` for Codex, `.windsurfrules` for Windsurf, `.github/copilot-instructions.md` for Copilot).
- **Key inputs:** Required `target_repo_path`; optional `tools`, `overwrite_existing`, `dry_run`.
- **Key outputs:** `installed_framework` directory + `tool_adapter_files` list + `installation_report`.
- **Owning agent:** import-export-orchestrator
- **Typical invocation:** One-time setup when deploying the framework to a new repository. Run before `/session-start` in the new repo.
- **Dependencies:** Target repo must already exist. Adapter templates must exist in `.writing-framework/templates/adapters/`.

#### `/apply-style-pack`

- **Purpose:** Loads a style pack from `styles/` or guide-server, registers it as the active style pack for the current run context, and outputs a formatted summary of its voice traits, tone profile, vocabulary rules, and anti-patterns. A missing required style pack raises a B2 blocker.
- **Key inputs:** Required `style_pack_name` or `style_pack_path`; optional `run_id`, `override_existing`.
- **Key outputs:** `active_style_pack` record in run context + `style_pack_summary` markdown.
- **Owning agent:** lead-editor
- **Typical invocation:** After `/session-start` or `/write-brief` when the style pack is specified. Before `/voice-pass`, `/orchestrate-finalize`, or `/orchestrate-draft`.
- **Dependencies:** Style pack must exist in `styles/` or guide-server. Run before all voice-dependent editorial commands.

#### `/apply-doctrine`

- **Purpose:** Loads one or more (or all) doctrine files from `.writing-framework/doctrine/`, registers them in the run context via cache-server, checks for inter-doctrine conflicts and conflicts with user instructions, and outputs a doctrine summary with key rules highlighted.
- **Key inputs:** Required `doctrine_names` (array or "all"); optional `run_id`, `conflict_check`.
- **Key outputs:** `active_doctrine_record` in run context + `doctrine_summary` markdown.
- **Owning agent:** lead-orchestrator
- **Typical invocation:** After `/session-start`. Before `/orchestrate-brief` and `/orchestrate-draft`. Doctrine is also loaded automatically by `/session-start`, but this command provides explicit loading with conflict checking.
- **Dependencies:** Doctrine files must exist in `.writing-framework/doctrine/`. Conflicts with user instructions require user resolution before the run proceeds.

---

### 3.9 Artifacts

The Artifacts category contains commands for generating, editing, validating, and exporting production artifact files in all supported output formats. The four write commands (markdown, docx, pdf, latex) each render the finalized source document into a specific format using the artifact-server MCP. Two edit commands (edit-docx, edit-latex) apply targeted post-render corrections. Two export commands (export-docx, export-pdf) deliver artifacts to external destinations. Normalize-artifact applies style/voice normalization before rendering. Artifact-validate confirms an artifact's integrity before export. All artifact commands update the `artifact_manifest.json`.

#### `/write-markdown`

- **Purpose:** Renders the production artifact as a formatted Markdown file, applying style pack formatting rules, normalizing heading hierarchy (H1=title, H2=sections, H3=subsections), and optionally prepending YAML frontmatter.
- **Key inputs:** Required `source`; optional `output_path`, `style_pack`, `include_metadata`.
- **Key outputs:** `.md` file in `artifacts/` + `artifact_manifest.json` entry.
- **Owning agent:** artifact-server
- **Typical invocation:** After publication check passes. The simplest and most portable artifact format. Called by `/orchestrate-artifact` when markdown is in the target formats list.
- **Dependencies:** Requires a finalized source document. Follows `/publication-check` or `/orchestrate-finalize`. Precedes `/export-docx` or `/export-pdf` if further distribution is needed.

#### `/write-docx`

- **Purpose:** Renders the production artifact as a .docx file via artifact-server's `render_docx` operation. Applies heading and paragraph styles from an optional `.docx` template, or defaults to style pack rules.
- **Key inputs:** Required `source`; optional `output_path`, `style_pack`, `template_docx`.
- **Key outputs:** `.docx` file in `artifacts/` + `artifact_manifest.json` entry.
- **Owning agent:** artifact-server
- **Typical invocation:** When the deliverable format requires Word document compatibility. Called by `/orchestrate-artifact` when docx is in the target formats list.
- **Dependencies:** Requires artifact-server. Follows `/write-markdown` or `/publication-check`. Leads to `/edit-docx` (for corrections) or `/export-docx` (for delivery).

#### `/write-pdf`

- **Purpose:** Renders the production artifact as a .pdf file via artifact-server's Markdown-to-PDF pipeline. Applies page size, margin, and font rules from the active style pack.
- **Key inputs:** Required `source`; optional `output_path`, `style_pack`, `page_size` (A4/letter).
- **Key outputs:** `.pdf` file in `artifacts/` + `artifact_manifest.json` entry.
- **Owning agent:** artifact-server
- **Typical invocation:** When a print-ready or portable document format is required. Called by `/orchestrate-artifact` when pdf is in the target formats list.
- **Dependencies:** Requires artifact-server with a PDF renderer configured. Alternative to `/write-latex` for PDF output when typographic precision is less critical.

#### `/write-latex`

- **Purpose:** Renders the production artifact as a .tex (LaTeX) file via artifact-server's `render_latex` operation. For academic papers, formal publications, and structured technical documents where typographic quality exceeds what PDF-via-Markdown can produce.
- **Key inputs:** Required `source`; optional `output_path`, `document_class` (article/report/book), `style_pack`.
- **Key outputs:** `.tex` file in `artifacts/` + `artifact_manifest.json` entry.
- **Owning agent:** artifact-server
- **Typical invocation:** For high-typographic-quality output or academic publication requirements. Called by `/orchestrate-artifact` when latex is in the target formats list.
- **Dependencies:** Requires artifact-server. Leads to `/edit-latex` for post-render corrections or `/write-pdf` (compile to PDF) if a LaTeX installation is available.

#### `/edit-docx`

- **Purpose:** Applies targeted edit operations to an existing .docx artifact without re-running the full render pipeline. Supports replace, style correction, and comment insertion operations. Optionally enables Word's track-changes mode.
- **Key inputs:** Required `artifact_path`, `edits` (array of edit operation objects); optional `track_changes`.
- **Key outputs:** Updated `.docx` at the same or specified path + manifest edit event.
- **Owning agent:** artifact-server
- **Typical invocation:** After `/write-docx` when corrections are needed â€” heading style adjustments, specific text replacements, or comment additions â€” without regenerating the entire file.
- **Dependencies:** Requires an existing .docx artifact. Edit operations must conform to the operation schema (type: replace|style|comment, target, value). Leads to `/export-docx`.

#### `/edit-latex`

- **Purpose:** Applies targeted edit operations to an existing .tex artifact without re-running the full conversion pipeline. Supports replace, insert, and delete operations. Optionally validates LaTeX syntax after edits to catch unbalanced environments.
- **Key inputs:** Required `artifact_path`, `edits`; optional `validate_after`.
- **Key outputs:** Updated `.tex` at the same or specified path + manifest edit event.
- **Owning agent:** artifact-server
- **Typical invocation:** After `/write-latex` when post-render corrections are needed â€” macro adjustments, environment fixes, bibliography entries.
- **Dependencies:** Requires an existing .tex artifact. Leads to `/write-pdf` if compiled PDF is needed.

#### `/export-docx`

- **Purpose:** Exports a .docx artifact to an external destination by validating the artifact against its manifest entry (checking checksum and schema), then copying it to the destination via artifact-server. Logs the export event in the manifest.
- **Key inputs:** Required `artifact_path`, `destination`; optional `validate_before`.
- **Key outputs:** Copied `.docx` at destination + manifest export event.
- **Owning agent:** artifact-server
- **Typical invocation:** After `/write-docx` or `/edit-docx` when the artifact is ready for delivery. Called by `/orchestrate-export` when packaging a completed run.
- **Dependencies:** Requires a valid .docx artifact and a writable destination. Validates via `/artifact-validate` before copying.

#### `/export-pdf`

- **Purpose:** Exports a .pdf artifact to an external destination by validating it against its manifest entry and then copying it to the destination. Logs the export event in the manifest.
- **Key inputs:** Required `artifact_path`, `destination`; optional `validate_before`.
- **Key outputs:** Copied `.pdf` at destination + manifest export event.
- **Owning agent:** artifact-server
- **Typical invocation:** After `/write-pdf` when the artifact is ready for delivery. Called by `/orchestrate-export` when packaging a completed run.
- **Dependencies:** Requires a valid .pdf artifact and a writable destination. Validates via `/artifact-validate` before copying.

#### `/normalize-artifact`

- **Purpose:** Normalizes a draft document against the active style and voice packs before artifact export. Checks every section against voice pack forbidden constructions, applies heading hierarchy normalization, and applies paragraph-level style rules. Produces a normalization report listing all changes by section.
- **Key inputs:** Required `source`; optional `output_path`, `style_pack`, `voice_pack`, `dry_run`.
- **Key outputs:** Normalized document (at `source.normalized.md` by default) + normalization report.
- **Owning agent:** artifact-server
- **Typical invocation:** After `/merge-draft` when sections have been drafted in parallel and style consistency may have diverged. Before `/write-markdown` or other artifact write commands.
- **Dependencies:** Requires active style pack and voice pack. Complements `/voice-pass` (voice-only) with heading and paragraph normalization.

#### `/artifact-validate`

- **Purpose:** Validates an artifact against its `artifact_manifest.json` entry by confirming the file exists, computing and comparing its SHA-256 checksum against the manifest record, and validating the manifest entry schema. Returns PASS or FAIL with all failing checks listed. Produces a `blocker_report.json` (B6) on failure.
- **Key inputs:** Required `artifact_path`; optional `manifest_path`, `check_schema`, `check_checksum`.
- **Key outputs:** PASS or FAIL result with list of failing checks + `blocker_report.json` on failure.
- **Owning agent:** artifact-server
- **Typical invocation:** Called automatically by `/orchestrate-artifact` immediately after each artifact is generated. Also called by `/export-docx` and `/export-pdf` before delivery. Run before marking a production run complete.
- **Dependencies:** Requires an existing artifact file and a matching `artifact_manifest.json` entry. A FAIL result blocks export.

---

## Section 4: Command Dependency Map

This section shows the typical command execution sequence for a complete production run. Two paths are shown: the fully orchestrated path (recommended) and the primitive path (for manual control or partial runs).

### 4.1 Fully Orchestrated Path

```
Session Setup
â””â”€â”€ /session-start
    â””â”€â”€ /apply-doctrine [doctrine_names=all]
        â””â”€â”€ /apply-style-pack [style_pack_name=<domain-pack>]

Brief Phase
â””â”€â”€ /orchestrate-brief [context, domain]
    â”œâ”€â”€ /discovery
    â”œâ”€â”€ /requirements-brief
    â””â”€â”€ /write-brief

Outline Phase
â””â”€â”€ /orchestrate-outline [brief]
    â””â”€â”€ /write-outline

Draft Phase
â””â”€â”€ /orchestrate-draft [outline, research_report?]
    â”œâ”€â”€ /research [if required by domain]
    â”œâ”€â”€ /validate-research
    â”œâ”€â”€ /draft-document
    â”‚   â”œâ”€â”€ /draft-section [x N sections]
    â”‚   â””â”€â”€ /merge-draft
    â”œâ”€â”€ /line-edit
    â”œâ”€â”€ /voice-pass
    â””â”€â”€ /qa-reader + /qa-coherence + /qa-ai-stink [draft gate]
â””â”€â”€ /rewrite [if QA gate fails]

Review Phase
â””â”€â”€ /orchestrate-review [draft, brief]
    â”œâ”€â”€ /qa-reader
    â”œâ”€â”€ /qa-skeptic
    â”œâ”€â”€ /qa-domain
    â”œâ”€â”€ /qa-style
    â”œâ”€â”€ /qa-coherence
    â”œâ”€â”€ /qa-ai-stink
    â””â”€â”€ /qa-final
        â””â”€â”€ /rewrite [if REVISE verdict]

Finalization Phase
â””â”€â”€ /orchestrate-finalize [draft, brief]
    â”œâ”€â”€ /voice-pass
    â”œâ”€â”€ /compress
    â””â”€â”€ /publication-check

Artifact Phase
â””â”€â”€ /orchestrate-artifact [source_document, target_formats]
    â”œâ”€â”€ /write-markdown [if markdown in targets]
    â”œâ”€â”€ /write-docx [if docx in targets]
    â”œâ”€â”€ /write-pdf [if pdf in targets]
    â”œâ”€â”€ /write-latex [if latex in targets]
    â””â”€â”€ /artifact-validate [per format]

Export Phase
â””â”€â”€ /orchestrate-export [run_id]
    â”œâ”€â”€ /export-framework
    â”œâ”€â”€ /export-docx [if docx artifact exists]
    â””â”€â”€ /export-pdf [if pdf artifact exists]
```

### 4.2 Primitive Path (Manual Control)

```
/session-start
â†’ /project-scan [optional: verify repo state]
â†’ /discovery [or /discovery-simulate-user for unattended runs]
â†’ /guide-gap-check [optional: verify knowledge base coverage]
â†’ /requirements-brief
â†’ /write-brief
â†’ /validate-brief
â†’ /write-outline
â†’ /validate-outline
â†’ /research [optional: topic-by-topic]
â†’ /validate-research [optional]
â†’ /synthesize-research [optional: if multiple research passes]
â†’ /draft-section [x N sections, iteratively]
â†’ /merge-draft
â†’ /line-edit
â†’ /compress [optional]
â†’ /voice-pass
â†’ /canon-check
â†’ /qa-reader + /qa-skeptic + /qa-domain + /qa-style + /qa-coherence + /qa-ai-stink
â†’ /qa-final
â†’ /rewrite [if QA gate fails]
â†’ /publication-check
â†’ /write-markdown [and/or /write-docx, /write-pdf, /write-latex]
â†’ /artifact-validate [per format]
â†’ /export-docx [and/or /export-pdf]
```

### 4.3 Quick Write Path (Short Documents, No Research Required)

```
/session-start
â†’ /discovery
â†’ /write-brief
â†’ /write-outline
â†’ /draft-document [calls /draft-section + /merge-draft internally]
â†’ /line-edit
â†’ /voice-pass
â†’ /qa-final [runs all six perspectives then aggregates]
â†’ /write-markdown
â†’ /artifact-validate
```

### 4.4 Framework Setup Path (New Repository)

```
[Source framework repo] â†’ /install-framework [target_repo_path=<new-repo>]
[New repo] â†’ /session-start
           â†’ /apply-doctrine [doctrine_names=all]
           â†’ /guide-gap-check [domain=<target-domain>]
           â†’ /add-guide [using generated stubs]
           â†’ /guide-promote [after review]
           â†’ /apply-style-pack [style_pack_name=<domain-pack>]
```

---

## Section 5: Orchestration Commands vs. Primitive Commands

Orchestration commands (`/orchestrate-*`) are pipeline coordinators. They do not implement new editorial logic â€” they sequence, gate, and coordinate the primitive commands that do. Understanding this distinction matters when debugging (check the primitive command that failed, not the orchestrator) and when choosing between full orchestration and manual control.

### Design principle

A primitive command does one specific editorial function and returns one specific output. An orchestration command manages the sequence of multiple primitives, evaluates the gate condition at each step, applies a revision loop if a conditional accept is returned, and surfaces blockers to the user if a block is returned.

### Primitive commands invoked by each orchestration command

| Orchestration Command | Primitive Commands Invoked |
|----------------------|---------------------------|
| `/orchestrate-brief` | `/session-start`, `/discovery`, `/requirements-brief`, `/write-brief` + abbreviated reader/skeptic QA |
| `/orchestrate-outline` | `/write-outline` + outline QA evaluation (inline, not a separate command) |
| `/orchestrate-draft` | `/research` (if needed), `/draft-document` â†’ `/draft-section` (x N) â†’ `/merge-draft`, `/line-edit`, `/voice-pass`, `/qa-reader`, `/qa-coherence`, `/qa-ai-stink`, `/rewrite` (if draft QA fails) |
| `/orchestrate-review` | `/qa-reader`, `/qa-skeptic`, `/qa-domain`, `/qa-style`, `/qa-coherence`, `/qa-ai-stink`, `/qa-final`, `/rewrite` (if REVISE verdict) |
| `/orchestrate-finalize` | `/voice-pass`, `/compress`, `/publication-check` |
| `/orchestrate-artifact` | `/write-markdown`, `/write-docx`, `/write-pdf`, `/write-latex` (per requested formats), `/artifact-validate` (per format) |
| `/orchestrate-export` | `/export-framework`, `/export-docx`, `/export-pdf` |

### When to use orchestration vs. primitives

| Use orchestration when... | Use primitives when... |
|--------------------------|----------------------|
| Running a standard production run from scratch | Repeating only one step (e.g., re-running `/qa-skeptic` after a rewrite) |
| You want quality gates enforced automatically | Debugging a single step failure |
| You want revision loops handled without manual intervention | Drafting only specific sections, not the full document |
| You want one command to advance an entire phase | Applying a voice pass without a full finalization cycle |
| Working in an automated/unattended pipeline | Working interactively with step-by-step control |

---

## Section 6: Command Ownership Matrix

This table maps each agent to the commands it owns. The owning agent is the agent invoked when the command runs â€” it is responsible for the command's behavior, output quality, and escalation decisions.

| Agent | Commands Owned |
|-------|---------------|
| **lead-orchestrator** | `/help`, `/session-start`, `/status`, `/whats-next`, `/explain-workflow`, `/orchestrate-brief`, `/orchestrate-outline`, `/orchestrate-draft`, `/orchestrate-review`, `/orchestrate-finalize`, `/apply-doctrine`, `/draft-document` |
| **lead-editor** | `/add-guide`, `/update-guide`, `/guide-link`, `/guide-promote`, `/guide-deprecate`, `/apply-style-pack`, `/publication-check`, `/validate-brief`, `/validate-outline` |
| **discovery-orchestrator** | `/discovery`, `/discovery-simulate-user` |
| **discovery-agent** | `/project-scan`, `/discovery-agent`, `/guide-gap-check`, `/research`, `/validate-research`, `/synthesize-research` |
| **brief-writer** | `/write-brief`, `/requirements-brief` |
| **outline-architect** | `/write-outline` |
| **section-drafter** | `/draft-section`, `/rewrite` |
| **merge-normalizer** | `/merge-draft` |
| **line-editor** | `/line-edit` |
| **compression-editor** | `/compress` |
| **voice-editor** | `/voice-pass` |
| **canon-checker** | `/canon-check` |
| **adversarial-reviewer** | `/source-gap-check`, `/evidence-map` |
| **qa-reader** | `/qa-reader` |
| **qa-skeptic** | `/qa-skeptic` |
| **qa-domain** | `/qa-domain` |
| **qa-style** | `/qa-style` |
| **qa-coherence** | `/qa-coherence` |
| **qa-ai-stink** | `/qa-ai-stink` |
| **qa-final** | `/qa-final` |
| **artifact-orchestrator** | `/orchestrate-artifact` |
| **import-export-orchestrator** | `/orchestrate-export`, `/export-framework`, `/export-pack`, `/export-principles`, `/import-pack`, `/install-framework` |
| **framework-sync-agent** | `/import-framework`, `/import-principles`, `/sync-principles`, `/sync-framework`, `/upgrade-framework` |
| **artifact-server** | `/write-markdown`, `/write-docx`, `/write-pdf`, `/write-latex`, `/edit-docx`, `/edit-latex`, `/export-docx`, `/export-pdf`, `/normalize-artifact`, `/artifact-validate` |
| **any agent** | `/find-guides` (callable by all agents) |

---

## Section 7: Missing Command Gaps (Phase 2 Analysis)

### 7.1 Commands referenced in specs that lack their own spec file

The following commands are referenced in the Related Commands sections of existing specs but do not have a dedicated spec file in `.writing-framework/commands/`:

| Referenced Command | Referenced In | Notes |
|-------------------|--------------|-------|
| (none identified) | â€” | All commands referenced in spec files have corresponding spec files in the commands directory. |

### 7.2 Agents referenced without commands

The following agents are defined in the agent layer but do not own a dedicated command with their own spec file:

| Agent | Status | Notes |
|-------|--------|-------|
| `blockage-handler` | No owned command | This agent is invoked internally by discovery-orchestrator during `/discovery`. It operates as a sub-agent, not a directly invokable command. |
| `clarity-editor` | No owned command | Referenced as a related agent in `/rewrite`. Its functionality is subsumed by `/line-edit` and `/rewrite` at the command level. A dedicated `/clarity-edit` command may be warranted in a future phase. |
| `adversarial-reviewer` | Owns `/source-gap-check` and `/evidence-map` but no `/adversarial-review` command | The adversarial-reviewer contributes to `/validate-research` and research QA but does not have a standalone adversarial review command. This may be a gap if pre-publication adversarial review is needed as a distinct step. |
| `intake-router` | No owned command | Routes incoming requests to the appropriate agent. Operates as a session-level dispatcher, not a user-invokable command. |

### 7.3 Potential command gaps in the taxonomy

The following command slots are not currently filled but may be warranted based on patterns in adjacent commands and framework doctrine:

| Gap | Description | Nearest Existing Alternative |
|-----|-------------|---------------------------|
| `/adversarial-review` | A standalone adversarial review command that runs the adversarial-reviewer agent against a full document, simulating a hostile expert critic | `/qa-skeptic` partially covers this; full adversarial review would go deeper |
| `/clarity-edit` | A dedicated clarity editing pass focused on structural comprehension improvements without full line-editing | `/line-edit` with `intensity: standard` partially covers this |
| `/draft-intro` | A specialized command for drafting document introductions, given that intros have distinct structural requirements | `/draft-section` with `section_id=intro` is the current workaround |
| `/draft-conclusions` | A specialized command for drafting conclusions with explicit argument-synthesis and no-new-claims enforcement | `/draft-section` with `section_id=conclusion` is the current workaround |
| `/check-word-count` | A lightweight command to compare the current document word count against the brief's scope constraint | Currently embedded in `/compression-editor` behavior, not a standalone command |
| `/session-end` | A command to cleanly close a session, write a resume point, and save run state | No equivalent exists; agents are expected to produce resume points as part of blockage protocol |
| `/outline-validate` | Explicit outline validation against the `outline` schema as a standalone command | Superseded by `/validate-outline` |

### 7.4 Note on compress category placement

`/compress` appears in the CLAUDE.md Foundation command list (Section 8, Foundation group) but its spec file assigns it to the Editorial category. The registry treats its spec file as authoritative: `/compress` is an Editorial command. Its inclusion in the Foundation group in CLAUDE.md appears to reflect its role as a general-purpose editing utility that can be used standalone outside the full production pipeline, not a category assignment.


