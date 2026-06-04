# Roadmap

Six implementation phases from foundational scaffolding to a fully operational, portable editorial orchestration system.

**Documentation note (2026-06):** Phases 1–6 and 11–12 are implemented per [PRODUCTION_READINESS_PLAN.md](PRODUCTION_READINESS_PLAN.md). Phases 7–8 below list the **full command surface**; `mcp/artifact-server` and sync/import commands exist as infrastructure—end-to-end `/orchestrate-artifact` and hosted production paths are still maturing. Public status: **alpha** (see [README.md](README.md#project-status-alpha)).

---

## Phase 1 — Foundation and Doctrine

**Status:** COMPLETE

**Objective:** Establish the structural and doctrinal foundation for the entire system. Every subsequent phase depends on the correctness and completeness of these outputs.

**Key Deliverables:**

- Repository directory structure created with all required directories
- `README.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `CLAUDE.md` written in full
- `.writing-framework/doctrine/` populated with core operating doctrine files covering: agent behavior, QA requirements, blockage handling, autonomy rules, discovery protocol, quality gate requirements, portability rules, artifact behavior
- `.writing-framework/schemas/` populated with placeholder JSON Schema files for all required schema types: `brief`, `outline`, `research_report`, `review_report`, `rewrite_plan`, `merge_report`, `blocker_report`, `artifact_manifest`, `sync_manifest`, `quality_gate`
- `.writing-framework/workflows/` populated with placeholder workflow definitions for each production stage: discovery, brief, outline, draft, merge, review, QA, artifact, export
- `.claude/commands/` directory scaffolded with stub files for all planned commands
- `.claude/agents/` directory scaffolded with stub spec files for all planned agents
- `.claude/hooks/` directory scaffolded
- `mcp/` directory scaffolded with subdirectories for all three servers
- `.writing-framework/styles/` seeded with at least one baseline style pack definition
- `sync/` directory scaffolded with all subdirectories

---

## Phase 2 — Agent and Command Contracts

**Status:** COMPLETE

**Objective:** Define complete agent and command contracts with handoff protocols and escalation rules.

**Key Deliverables:**

- ✅ `mcp/guide-server/` implemented: SQLite database with FTS5 full-text search, 8 guide types, 11 MCP tools, 55 seed records, complete CRUD and search operations, guide linking, deprecation, gap-check, and stats
- ✅ Full command taxonomy defined in `.writing-framework/commands/COMMAND_REGISTRY.md` (67 commands)
- ✅ All 27 agent specs upgraded to Phase 2 active with Adjacent Agent Boundaries, Scope Ceiling, Final Prose Ownership, and Escalation Triggers
- ✅ `.writing-framework/agents/HANDOFF_CONTRACTS.md` — 16 per-handoff contracts with schemas and validation rules
- ✅ `.writing-framework/doctrine/ESCALATION_RULES.md` — 4-level escalation chain with per-agent trigger tables
- ✅ `.claude/agents/` — 27 sub-agent adapter files for Claude Code routing

---

## Phase 3 — Guide Server and Guide Workflows

**Status:** COMPLETE

**Objective:** Make the knowledge layer operational with guide-server MCP and guide management workflows.

**Key Deliverables:**

- ✅ `mcp/guide-server/` fully operational with SQLite+FTS5 backend
- ✅ 11 MCP tools for guide management
- ✅ 55 seed records across 8 guide types
- ✅ Guide linking, deprecation, gap-check, and statistics
- ✅ `COMMAND_INTEGRATION.md` documenting guide-server usage patterns

---

## Phase 4 — Cache Server and Run Memory

**Status:** COMPLETE

**Objective:** Implement run-scoped memory, checkpoints, blocker tracking, and resume support.

**Key Deliverables:**

- ✅ `mcp/cache-server/` implemented: SQLite database storing runs, steps, artifacts, blocker reports, review outputs, intermediate drafts, merge reports, and resume points with full run lifecycle management
- ✅ 11 MCP tools: start_run, save_step, save_artifact, save_blocker, fetch_run_context, fetch_resume_point, list_run_artifacts, close_run, save_resume_point, save_review_output, save_merge_report
- ✅ Resume point support with state snapshots and artifact tracking
- ✅ Blocker persistence with severity levels (blocking/degraded) and resolution tracking
- ✅ Intermediate artifact tracking with hybrid storage (inline <10KB, filesystem ≥10KB)
- ✅ Setup, seed, and test scripts
- ✅ Complete documentation: RUN_MODEL.md, BLOCKER_MODEL.md, RESUME_PROTOCOL.md, COMMAND_INTEGRATION.md
- ✅ Self-QA validation: run lifecycle, blocker flow, partial progress persistence

---

## Phase 5 — Discovery, Blockage Handling, and Autonomous Progress

**Status:** COMPLETE

**Objective:** Implement discovery workflows, blockage handling rules, blocker classification, and partial-completion behavior with autonomy policies.

**Key Deliverables:**

- ✅ `workflows/discovery.md` upgraded to Phase 5 executable with 8-step execution, cache-server integration, Type 1/2/3 decision points
- ✅ `workflows/blockage.md` created as Phase 5 executable with blocker handling protocol, partial completion, resume planning
- ✅ `agents/discovery-agent.md` upgraded to Phase 5 executable with detailed scan behavior, autonomy rules, quality self-check
- ✅ `agents/blockage-handler.md` upgraded to Phase 5 executable with 8-step execution, scope analysis, unblocked work continuation
- ✅ `doctrine/BLOCKER_CLASSIFICATION.md` — B1-B9 taxonomy, severity rules, classification decision tree, lifecycle, integration examples
- ✅ `doctrine/PARTIAL_COMPLETION.md` — Protocol, labeling format, quality standards, resume section format, 4 scenarios
- ✅ `doctrine/AUTONOMY_INTEGRATION.md` — Type 1/2/3 integration with discovery/blockage, decision matrix, boundary examples
- ✅ `schemas/findings_report.schema.json` — Discovery-agent output format with found/inferred/gaps structure
- ✅ `schemas/discovery_report.schema.json` — Discovery-orchestrator output format with blockers and next actions
- ✅ Self-QA validation: discovery overreach review, blocker classification review, autonomy boundary review

---

## Phase 6 — Editorial Workflows and QA System

**Status:** COMPLETE

**Objective:** Implement writing workflow surfaces, review passes, QA commands, and merge-normalization model. Ensure structure before style, critique before rewrite, separate drafting from editing, support multi-perspective QA.

**Key Deliverables:**

- ✅ `workflows/brief.md` upgraded to Phase 6 executable with 10-step execution, cache-server integration, Type 1/2/3 decision points, Brief Gate
- ✅ `workflows/outline.md` upgraded to Phase 6 executable with 9-step execution, template selection, section distinctness verification, Outline Gate
- ✅ `workflows/drafting.md` upgraded to Phase 6 executable with 10-step execution, parallel section drafting, merge-normalizer integration (Steps 5-9), Draft Gate
- ✅ `workflows/review.md` upgraded to Phase 6 executable with 8-step execution, 7 QA perspectives (parallel), aggregation, QA Gate
- ✅ `workflows/qa.md` upgraded to Phase 6 executable with 7 fully-specified perspectives: qa-reader, qa-skeptic, qa-domain, qa-style, qa-coherence, qa-ai-stink, qa-final
- ✅ `agents/merge-normalizer.md` upgraded to Phase 6 executable with 10-step execution, voice analysis, normalization rules, autonomy rules
- ✅ `doctrine/EVALUATION_RUBRICS.md` — Evaluation criteria for Brief/Outline/Draft/Review gates, rubrics for all 7 QA perspectives with examples
- ✅ Self-QA validation: workflow coherence review (pipeline flow, cache integration, gate sequence), QA coverage review (7 perspectives, independence, severity), role separation review (drafting vs editing vs normalization)

---

## Phase 7 — Artifact Infrastructure

**Status:** COMPLETE

**Objective:** Implement artifact system and structured authoring interfaces for markdown, docx, latex, and pdf flows. Support create, update, conversion, export, normalization, inspection, and validation operations with deterministic paths and practical local tooling.

**Key Deliverables:**

- ✅ `mcp/artifact-server/` — MCP server scaffold with SQLite backend, Node.js implementation
- ✅ `mcp/artifact-server/schema.sql` — Database schema with 5 tables (artifacts, artifact_versions, artifact_relationships, validation_results, export_operations)
- ✅ `mcp/artifact-server/src/server.js` — Complete MCP server with 11 operations implemented
- ✅ `mcp/artifact-server/ARTIFACT_MODEL.md` — Artifact metadata model, lifecycle, and operational semantics
- ✅ `mcp/artifact-server/COMMAND_INTEGRATION.md` — Command-to-tool mapping and workflow integration
- ✅ `workflows/artifacts.md` upgraded to Phase 7 executable with 8-step execution, artifact-server integration, Type 1/2/3 decision points, Artifact Gate
- ✅ 11 artifact operations: create_markdown, update_markdown, create_latex, export_markdown_to_docx, export_markdown_to_pdf, compile_latex_to_pdf, inspect_artifact, validate_artifact, normalize_artifact, list_artifacts
- ✅ Format-specific validation: markdown (YAML frontmatter, heading hierarchy, empty sections), docx/pdf (file integrity), latex (compilability)
- ✅ Export operations with dependency checking: pandoc for docx/pdf from markdown, LaTeX toolchain for pdf from latex
- ✅ Self-QA validation: artifact operations review, format validation review, export flow review, dependency stability review

---

## Phase 8 — Sync, Import, Export, and Framework Portability

**Status:** COMPLETE

**Objective:** Implement framework portability layer so doctrine, principles, style packs, workflows, and command bundles can move across repos safely. Support selective imports/exports, conflict detection, and never silently overwrite local divergence.

**Key Deliverables:**

- ✅ `workflows/sync.md` upgraded to Phase 8 executable with 10-step execution, conflict detection, resolution modes, Sync Gate
- ✅ `schemas/export_pack.schema.json` — Export pack manifest with pack types, items, dependencies, checksum
- ✅ `schemas/import_pack.schema.json` — Import pack manifest with import status, conflicts, compatibility check
- ✅ `schemas/conflict_report.schema.json` — Conflict report with conflict types, severity, resolution options
- ✅ `sync/PORTABILITY_MODEL.md` — Portability model, pack structure, conflict handling, safety guarantees
- ✅ `sync/COMMAND_INTEGRATION.md` — Command-to-workflow mapping, conflict patterns, error handling, best practices
- ✅ Conflict detection: 5 conflict types (content-diverged, local-override-exists, schema-incompatible, dependency-conflict, version-mismatch)
- ✅ Conflict resolution modes: ask (default), prefer-local, prefer-source, merge
- ✅ Selective pack support: selective import/export with dependency handling
- ✅ Compatibility notes format: framework version, breaking changes, manual steps, dependencies
- ✅ Safety guarantees: no silent overwrites, atomic operations, rollback capability, provenance preservation
- ✅ Self-QA validation: portability safety review, conflict handling review, manifest validity review, selective pack review

---

## Phase 9 — Hooks, Enforcement, and Operational Guardrails

**Status:** COMPLETE

**Objective:** Implement hook-based enforcement, required gate checks, and workflow guardrails to prevent unsafe operations, enforce quality gates, and ensure failures are visible and resumable.

**Key Deliverables:**

- ✅ `doctrine/OPERATIONAL_GUARDRAILS.md` — Enforcement rules, preconditions, failure handling, resumability guarantees
- ✅ `.claude/hooks/pre-workflow-start.md` — Precondition checks (inputs, MCPs, conflicts)
- ✅ `.claude/hooks/pre-phase-advance.md` — Gate checks for all 6 phase transitions
- ✅ `.claude/hooks/pre-artifact-finalize.md` — Validation checks before finalization
- ✅ `.claude/hooks/on-failure.md` — Error handling, resume point creation, failure logging
- ✅ `.claude/hooks/README.md` — Hook system overview, integration, testing, best practices
- ✅ 9 precondition enforcement rules (required inputs, MCPs, conflicts, gates, validation, overwrites, cache)
- ✅ 6 quality gate checks enforced (Discovery, Brief, Outline, Draft, QA, Artifact)
- ✅ 4 failure response rules (gate, validation, dependency, conflict)
- ✅ Logging behaviors (operation, gate, failure logging to cache-server)
- ✅ Resumability guarantees (resume points, partial work preservation, resume protocol)
- ✅ Self-QA validation: hook safety review, false positive review, enforcement completeness review

---

## Phase 10 — Evaluations and Comparative Testing

**Status:** COMPLETE

**Objective:** Create evaluation framework to validate that orchestrated workflows outperform simpler baseline approaches across realistic writing tasks.

**Key Deliverables:**

- ✅ `evals/README.md` — Evaluation framework overview, dimensions, cases, baselines, expected outcomes
- ✅ `evals/rubrics/artifact-quality.md` — Scoring rubric for completeness, correctness, clarity, constraint adherence (0-40 points)
- ✅ `evals/rubrics/process-reliability.md` — Scoring rubric for blocker detection, resolution, gate effectiveness, resume success (0-40 points)
- ✅ `evals/rubrics/portability.md` — Scoring rubric for doctrine, style pack, workflow portability, conflict handling (0-40 points)
- ✅ `evals/rubrics/qa-utility.md` — Scoring rubric for issue detection, false positives, severity accuracy, actionability (0-40 points)
- ✅ `evals/cases/case-01-technical-docs.md` — Technical documentation evaluation case with injected blockers and quality issues
- ✅ `evals/cases/case-02-portability.md` — Framework portability evaluation case with conflict scenarios
- ✅ `evals/BASELINE_COMPARISON.md` — Baseline comparison methodology, fairness criteria, reporting standards
- ✅ 3 baseline definitions (Single-Prompt, Simple Chain, Orchestrated)
- ✅ 4 evaluation dimensions (artifact quality, process reliability, portability, QA utility)
- ✅ Fairness criteria (same inputs, LLM, evaluation, no cherry-picking, realistic cases, transparency, honesty)
- ✅ Self-QA validation: evaluation realism review, rubric clarity review, baseline fairness review

---

## Phase 11 — Core Writing Pipeline

**Status:** IMPLEMENTED (verification pending)  
**Priority:** CRITICAL (blocks all writing functionality)  
**Timeline:** 4-6 weeks  
**Effort:** 60-80 hours  
**Detailed Spec:** `docs/PHASE11_SPECIFICATION.md`

**Objective:** Make the end-to-end writing pipeline operational from brief to merged draft. Agents must be able to produce structured, review-ready documents.

**Key Deliverables:**

**Commands (8):**
- `/write-brief` — Generate brief from discovery report and user requirements
- `/write-outline` — Generate outline from brief
- `/draft-section` — Draft single section from outline
- `/draft-document` — Orchestrate full document draft
- `/merge-draft` — Merge section drafts into coherent document
- `/rewrite` — Revise draft based on rewrite plan
- `/validate-brief` — Validate brief against schema and Brief Gate
- `/validate-outline` — Validate outline against schema and Outline Gate

**Agents (4):**
- `brief-writer` — Generates briefs from discovery reports
- `outline-architect` — Generates outlines from briefs
- `section-drafter` — Drafts individual sections
- `merge-normalizer` — Merges and normalizes section drafts

**Schemas (2 new):**
- `merge_report.schema.json` — Merge operation report
- `rewrite_plan.schema.json` — Rewrite instructions

**Integration:**
- MCP integration (guide-server, cache-server, artifact-server)
- Hook integration (pre-phase-advance, on-failure)
- Gate enforcement (Brief Gate, Outline Gate, Draft Gate)

**Implementation Status:**
- Command specs and adapters are present for all 8 Phase 11 commands
- Writing-agent adapters are present for all 4 Phase 11 agents
- Brief and outline validation surfaces exist as standalone commands
- Hook and schema references are aligned to the current brief and outline schemas

**Success Criteria:**
- Can write complete documents end-to-end (brief → outline → draft → merge)
- Artifact quality score ≥ 35/40
- Process reliability score ≥ 35/40
- All 3 blockers in case-01 detected
- Resume capability functional

---

## Phase 12 — QA and Review System

**Status:** IMPLEMENTED (verification pending)  
**Priority:** HIGH (needed for quality assurance)  
**Timeline:** 3-4 weeks  
**Effort:** 40-50 hours  
**Depends on:** Phase 11  
**Detailed Spec:** `docs/PHASE12_SPECIFICATION.md`

**Objective:** Make quality gating operational. No document should advance to artifact generation without passing all applicable QA perspectives.

**Implementation Status:**
- Canonical QA command specs are aligned for all 7 Phase 12 commands
- Claude QA agent adapters are aligned to current `review_report` and `quality_gate` schemas
- QA Gate hook checks target the current `quality_gate` contract
- The QA layer is documented as implemented, with evaluation still pending

**Key Deliverables:**

**QA Commands (7):**
- `/qa-reader` — Reader perspective (assumed knowledge, clarity)
- `/qa-skeptic` — Skeptic perspective (claim grounding, evidence)
- `/qa-domain` — Domain expert perspective (technical accuracy)
- `/qa-style` — Style adherence review
- `/qa-coherence` — Logical coherence and flow
- `/qa-ai-stink` — Generic AI phrasing detection
- `/qa-final` — Aggregate all perspectives, issue verdict

**Agent:**
- `adversarial-reviewer` — Finds weakest points without softening criticism

**Integration:**
- QA Gate enforcement (blocks drafts with critical findings)
- Guide-server integration (perspective rubrics, anti-patterns)
- Cache-server integration (save review reports)

**Success Criteria:**
- QA utility score ≥ 35/40
- Issue detection rate ≥ 85%
- False positive rate < 15%
- Severity accuracy ≥ 85%
- Actionability ≥ 85%
- All 6 issues in case-01 detected

**After Phase 12:** Framework is **PRODUCTION-READY** for all writing domains.

---

## Extending the Framework

**Status:** Documentation complete  
**Guide:** `docs/EXTENDING_THE_FRAMEWORK.md`

The core framework (Phases 11-12) works for **any writing domain** out of the box. Domain-specific behavior is controlled by:
- **Style packs** (how to write)
- **Templates** (what structure to use)
- **Canon guides** (what facts/lore to follow)
- **Rubrics** (how to evaluate)

**Supported domains without modification:**
- Technical documentation
- D&D campaigns (style packs and templates already seeded)
- Research papers
- Card game design (style packs and templates already seeded)
- Legal documents
- Marketing content
- Fiction
- Business reports
- Poetry

**Custom commands (optional):**
Users can create domain-specific commands in `.claude/commands/` for specialized tasks (e.g., `/generate-npc`, `/validate-citations`).

See `docs/EXTENDING_THE_FRAMEWORK.md` for complete customization guide.

---

## Phase 7 — Artifact System and MCP

**Status:** INFRASTRUCTURE COMPLETE — orchestration and export paths still maturing

**Objective:** Make artifact generation and export operational. The system must be able to produce publication-ready files in all supported formats from the same production pipeline.

**Key Deliverables:**

- `mcp/artifact-server/` implemented: filesystem management, format-specific creation and editing operations, validation layer, manifest tracking
- `/write-markdown` command implemented: creates validated markdown artifact from document draft
- `/write-docx` command implemented: creates formatted Word document from document draft using docx tooling
- `/write-pdf` command implemented: creates PDF from document draft, supporting both export-from-docx and compile-from-latex paths
- `/write-latex` command implemented: creates LaTeX source from document draft
- `/edit-docx` command implemented: applies targeted edits to an existing docx artifact
- `/edit-latex` command implemented: applies targeted edits to an existing LaTeX artifact
- `/export-docx` command implemented: exports finalized docx to delivery location
- `/export-pdf` command implemented: exports finalized PDF to delivery location
- `/normalize-artifact` command implemented: normalizes formatting, whitespace, heading hierarchy, and style compliance in an existing artifact
- `/artifact-validate` command implemented: validates artifact against format spec and schema requirements
- `/orchestrate-artifact` command implemented: full orchestration pass from document draft to all requested output formats
- `artifact_manifest` schema finalized and implemented
- `artifact-orchestrator` agent spec implemented and functional

---

## Phase 8 — Sync and Portability

**Status:** INFRASTRUCTURE COMPLETE — migration and upgrade flows still maturing

**Objective:** Make the framework portable. Doctrine, style packs, guide records, and commands must be exportable from this repo and importable into any compatible repository.

**Key Deliverables:**

- `/import-framework` command implemented: primary inbound sync surface for pulling framework updates from another repo or from a portable bundle
- `/export-framework` command implemented: primary outbound sync surface for publishing framework updates to another repo or to a portable bundle
- `/export-pack` command retained as a legacy compatibility surface for bundle export
- `/import-pack` command retained as a legacy compatibility surface for bundle import
- `/sync-framework` command retained as a legacy compatibility surface for repo-based imports
- `/upgrade-framework` command retained as an advanced migration-aware upgrade flow
- `/export-principles` command retained as a legacy compatibility surface for doctrine/style export
- `/import-principles` command retained as a legacy compatibility surface for doctrine/style import
- `/sync-principles` command retained as a legacy compatibility surface for doctrine/style bidirectional sync
- `/apply-style-pack` command implemented: applies a style pack definition to the current production context
- `/apply-doctrine` command implemented: applies a doctrine set to the current repo, with conflict detection
- `/install-framework` command implemented: bootstraps a new repo with the full framework structure
- `sync-manifest` schema finalized and implemented
- `framework-sync-agent` agent spec implemented and functional
- `import-export-orchestrator` agent spec implemented and functional
- `sync/migration-rules/` populated with v1 migration rules
- Full sync behavior doctrine finalized: what drifts safely, what requires explicit resolution, what is never overwritten

---

## Session Log

- 2026-03-31: Implemented and structurally validated the Phase 11 writing path and Phase 12 QA/review path, including validation commands, QA gate alignment, orchestration contract updates, and status documentation refresh.
