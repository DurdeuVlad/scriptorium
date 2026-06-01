# Architecture

Full system architecture for the Editorial Orchestrator. Written for AI agents as the primary audience. Cross-references between sections are noted inline.

---

## Table of Contents

1. [Operating Model](#operating-model)
2. [Agent Taxonomy](#agent-taxonomy)
3. [Command Taxonomy](#command-taxonomy)
4. [MCP Infrastructure](#mcp-infrastructure)
5. [Schema Registry](#schema-registry)
6. [Guide System Design](#guide-system-design)
7. [Artifact System Design](#artifact-system-design)
8. [Sync and Portability Design](#sync-and-portability-design)
9. [Data Flow](#data-flow)
10. [Infrastructure Constraints](#infrastructure-constraints)

---

## Operating Model

The system operates as six layers. Each layer has a defined scope of responsibility. Agents operate primarily in the Agent Layer but consume from the Knowledge Layer and write to the Infrastructure Layer. Commands in the Public Layer invoke agents. Orchestration commands in the Orchestration Layer decompose complex work into multiple agent invocations and manage gate transitions.

### Layer 1: Public Layer

**Scope:** Stable commands the user or an orchestrating agent invokes directly.

These commands form the public API of the system. They accept high-level instructions, validate inputs against schemas, invoke the appropriate agents or sub-commands, and return structured outputs. Public layer commands must remain stable across phases. Their signatures must not change without a migration rule.

Canonical command specs live in `.writing-framework/commands/`. Each spec file defines: purpose, inputs, outputs, invoked agents, applicable schemas, applicable guides, behavior on failure, and tool adapter notes. Tool-specific adapters in `.claude/commands/`, `.codex/commands/`, `.windsurf/commands/`, and `.copilot/commands/` wrap these core specs in the format each tool expects. Canonical workflows live in `.writing-framework/workflows/`.

### Layer 2: Orchestration Layer

**Scope:** Meta-commands that decompose complex multi-step work, enforce phase gates, and merge results across agent invocations.

Orchestration commands are distinguished from public commands by their scope: they coordinate multiple commands or agents in sequence, handle partial failures by continuing unblocked branches, and produce structured reports (merge reports, run summaries, blocker reports) that feed into downstream phases.

Orchestration commands invoke public commands — they do not bypass the public layer to call agents directly except where documented as an intentional shortcut.

Phase gates are enforced at the orchestration layer. A gate failure blocks phase advancement but does not roll back completed work. See [Schema Registry — quality_gate](#schema-registry) for gate schema definition.

### Layer 3: Agent Layer

**Scope:** Specialized agents for discovery, drafting, review, QA, canon validation, and normalization.

Agents are the execution units of the system. Each agent has a defined role, a set of permitted operations, a set of consumed inputs, and a set of produced outputs. Agents are specified in `.claude/agents/`. Each agent spec defines: identity, role, inputs, outputs, applicable guides, constraints, and failure behavior.

Agents do not communicate with each other directly. They receive inputs from commands and return structured outputs to commands. Orchestration of multiple agents is the responsibility of orchestration commands.

Canonical agent specs live in `.writing-framework/agents/`. Each spec is tool-agnostic — it defines behavior that any compatible AI agent can execute regardless of which tool is running the session.

Agent taxonomy is defined in [Agent Taxonomy](#agent-taxonomy).

### Layer 4: Knowledge Layer

**Scope:** Guides, doctrine, style packs, canon, examples, anti-patterns, templates, and decision records.

The knowledge layer is the persistent memory of the system. It is organized into two physical locations:

- `.writing-framework/doctrine/` — non-negotiable operating rules, loaded before every task, not stored as guide records
- `.writing-framework/guides/` — curated, searchable knowledge store organized by guide record type

Agents query the knowledge layer before and during execution. The guide-server MCP (see [MCP Infrastructure](#mcp-infrastructure)) provides full-text search, tag filtering, and record linking over guide records. Doctrine files are read directly from the filesystem.

Knowledge layer content governs agent behavior. When doctrine and a user instruction conflict, doctrine takes precedence. When a guide record and a user instruction conflict, the conflict is surfaced and the user is asked to resolve it.

### Layer 5: Infrastructure Layer

**Scope:** MCP servers and tool surfaces for guide management, run caching, artifact generation, and sync operations.

Three MCP servers provide the tool surfaces that agents and commands use for persistent state, knowledge retrieval, and artifact management. All three servers are local-only and require no external API keys. See [MCP Infrastructure](#mcp-infrastructure) for full server specifications.

### Layer 6: Artifact Layer

**Scope:** Structured generation and editing of markdown, docx, pdf, and latex output files.

The artifact layer is the output surface of the system. It is physically located at `artifacts/` and managed through the artifact-server MCP (Phase 5). Until Phase 5 is active, markdown artifacts are written directly via the Write tool or `/write-markdown` command.

Artifacts are tracked in an artifact manifest. The manifest records: artifact ID, type, format, source document, creation timestamp, status, and export paths. See [Artifact System Design](#artifact-system-design) for full design.

---

## Agent Taxonomy

Agents are grouped by function. All agent specs are in `.writing-framework/agents/` — the canonical, tool-agnostic source. Implementation status is tracked in [CLAUDE.md — Implementation Status](CLAUDE.md#section-8-implementation-status).

### Meta and Orchestration Agents

These agents coordinate other agents, manage run state, and handle cross-cutting concerns.

| Agent | Role |
|-------|------|
| `lead-orchestrator` | Top-level orchestration agent. Owns run lifecycle, enforces quality gates, manages phase transitions. Invoked by `/orchestrate-*` commands. |
| `lead-editor` | Editorial coordination agent. Manages draft-to-final progression. Coordinates writing and QA agents. Applies final editorial judgment before gate passage. |
| `intake-router` | Classifies incoming requests, identifies applicable workflow, selects relevant guides and style packs, routes to appropriate orchestration path. |
| `discovery-orchestrator` | Coordinates the discovery phase. Delegates to `discovery-agent` for context gathering, aggregates results, produces discovery report. |
| `discovery-agent` | Executes discovery: reads repo context, identifies inputs and prior state, infers defaults, surfaces blockers. Produces structured discovery report. |
| `blockage-handler` | Receives a blocker report, classifies the blocker type, identifies impacted scope, produces a resume plan. Invoked automatically when a blocker is detected. |
| `framework-sync-agent` | Manages sync operations between this repo and external framework sources. Compares manifests, detects drift, proposes resolution actions. |
| `principles-sync-agent` | Manages sync of doctrine and style packs specifically. Handles the narrower case of principles-only sync without full framework comparison. |
| `import-export-orchestrator` | Coordinates pack export and import operations. Builds manifests, validates pack contents, applies migration rules. |
| `artifact-orchestrator` | Coordinates artifact generation across all requested formats. Manages artifact-server operations, tracks manifest state, validates outputs. |

### Writing and Editing Agents

These agents produce, transform, and improve document content.

| Agent | Role |
|-------|------|
| `brief-writer` | Produces a validated `brief` schema output from discovery report and user-confirmed inputs. Ensures all required brief fields are populated. |
| `outline-architect` | Produces a validated `outline` schema output from a brief. Structures section hierarchy, assigns section purposes, estimates scope. |
| `section-drafter` | Produces a single section draft given an outline section spec, brief, and applicable guide records. Respects active style pack. |
| `merge-normalizer` | Merges multiple section drafts into a coherent document. Normalizes voice, heading hierarchy, internal references, and formatting. Produces a `merge_report`. |
| `clarity-editor` | Applies a clarity-focused editing pass to a draft. Targets: ambiguous references, overlong sentences, buried lede, passive constructions without purpose. |
| `line-editor` | Applies line-level editing: word choice, sentence rhythm, redundancy removal, transition quality. Does not restructure content. |
| `compression-editor` | Reduces document length while preserving informational content. Targets: padding, throat-clearing, over-explained obvious points, redundant examples. |
| `voice-editor` | Applies voice and style consistency pass against the active style pack. Flags deviations and applies corrections. |
| `canon-checker` | Validates document content against applicable canon guide records. Reports violations with location and severity. |
| `adversarial-reviewer` | Stress-tests documents by finding weak arguments, unsupported claims, structural gaps, and reader confusion points. Does not soften findings. |

### QA Agents

These agents implement the seven QA perspectives. Each perspective is a distinct evaluative lens.

| Agent | Perspective | Focus |
|-------|-------------|-------|
| `qa-reader` | Reader | Does this make sense to the intended reader? Are assumptions over-loaded? Does it answer what the brief promised? |
| `qa-skeptic` | Skeptic | What feels weak, padded, or unsupported? Where would a hostile reader push back? What claims lack grounding? |
| `qa-domain` | Domain | Does this fit actual domain conventions or canon? Are domain-specific terms used correctly? Are domain norms followed? |
| `qa-style` | Style | Does this match the active style pack? Voice, tone, formatting, sentence structure, terminology preferences. |
| `qa-coherence` | Coherence | Does the structure hold internally? Are transitions sound? Does the argument flow? Do sections relate to each other correctly? |
| `qa-ai-stink` | AI-stink | What reads as machine-generated? Oversmooth transitions, hollow affirmations, over-hedged claims, unearned gravitas, corporate cadence. |
| `qa-final` | Final gate | Aggregates all perspective reports. Issues overall verdict: accept, conditional accept (with required revisions), or block. |

---

## Command Taxonomy

Canonical command specs live in `.writing-framework/commands/`. Tool-specific adapters live in `.claude/commands/`, `.codex/commands/`, `.windsurf/commands/`, and `.copilot/commands/`. Commands are grouped by function below. Canonical workflows live in `.writing-framework/workflows/`. Implementation status tracked in [CLAUDE.md — Implementation Status](CLAUDE.md#section-8-implementation-status).

### Foundation Commands

| Command | Purpose |
|---------|---------|
| `/help` | Lists available commands with one-line descriptions. Accepts a command name for detailed help. |
| `/session-start` | Initializes run context, loads doctrine and applicable style packs, registers run in cache-server. |
| `/project-scan` | Scans repo structure and reports: existing artifacts, active guides, prior runs, applied style packs, unresolved blockers. |
| `/status` | Reports current run state: active phase, completed steps, pending steps, open blockers, artifacts produced. |
| `/whats-next` | Recommends the next action based on current run state. Considers blockers, completed phases, and pending gates. |
| `/explain-workflow` | Explains the workflow for a given production stage. Accepts a workflow name or command name. |

### Discovery Commands

| Command | Purpose |
|---------|---------|
| `/discovery` | Full discovery pass. Reads repo context, identifies inputs, infers defaults, surfaces blockers, produces discovery report. |
| `/discovery-agent` | Invokes `discovery-agent` for targeted context gathering. Accepts a scope parameter. |
| `/discovery-simulate-user` | Simulates user-facing discovery questions and populates discovery report with inferred answers. Used when user is unavailable. |
| `/requirements-brief` | Produces a structured requirements brief from discovery report and confirmed inputs. Pre-cursor to `/write-brief`. |

### Research Commands

| Command | Purpose |
|---------|---------|
| `/research` | Conducts research pass for a given topic or document section. Produces `research_report`. |
| `/validate-research` | Validates a `research_report` for source quality, currency, and relevance to the brief. |
| `/synthesize-research` | Synthesizes multiple research reports into a unified evidence summary. |
| `/source-gap-check` | Identifies claims in a draft that lack supporting research. Reports gaps by location and severity. |
| `/evidence-map` | Produces an evidence map: each claim in the document linked to its supporting source or flagged as unsupported. |

### Editorial Commands

| Command | Purpose |
|---------|---------|
| `/write-brief` | Produces a validated `brief` schema output. Invokes `brief-writer`. |
| `/write-outline` | Produces a validated `outline` schema output from a brief. Invokes `outline-architect`. |
| `/draft-section` | Drafts a single section given section spec, brief, and guides. Invokes `section-drafter`. |
| `/draft-document` | Orchestrates full document draft from outline. Calls `/draft-section` per section. |
| `/merge-draft` | Merges section drafts into a coherent document. Invokes `merge-normalizer`. Produces `merge_report`. |
| `/rewrite` | Applies a structured rewrite pass given a `rewrite_plan`. Invokes `section-drafter` or appropriate editor agent. |
| `/line-edit` | Applies line-level editing pass. Invokes `line-editor`. |
| `/compress` | Applies compression pass. Invokes `compression-editor`. |
| `/voice-pass` | Applies voice and style consistency pass. Invokes `voice-editor`. |
| `/canon-check` | Validates document against canon guide records. Invokes `canon-checker`. |
| `/publication-check` | Final pre-export gate. Validates completeness, format, schema compliance, canon consistency. |

### QA Commands

| Command | Purpose |
|---------|---------|
| `/qa-reader` | Runs reader QA perspective. Produces `review_report` with reader perspective label. |
| `/qa-skeptic` | Runs skeptic QA perspective. Produces `review_report` with skeptic perspective label. |
| `/qa-domain` | Runs domain QA perspective. Produces `review_report` with domain perspective label. |
| `/qa-style` | Runs style QA perspective. Produces `review_report` with style perspective label. |
| `/qa-coherence` | Runs coherence QA perspective. Produces `review_report` with coherence perspective label. |
| `/qa-ai-stink` | Runs AI-stink QA perspective. Produces `review_report` with ai-stink perspective label. |
| `/qa-final` | Runs full quality gate. Aggregates all perspective reports. Issues overall verdict. Invokes `qa-final` agent. |

### Orchestration Commands

| Command | Purpose |
|---------|---------|
| `/orchestrate-brief` | Full brief production orchestration: discovery → requirements → brief → brief QA. |
| `/orchestrate-outline` | Full outline production orchestration: brief → outline → outline QA. |
| `/orchestrate-draft` | Full draft production orchestration: outline → draft sections → merge → normalization → draft QA. |
| `/orchestrate-review` | Full review orchestration: all QA perspectives → adversarial review → canon check → quality gate. |
| `/orchestrate-finalize` | Full finalization orchestration: revision passes → final QA → publication check. |
| `/orchestrate-artifact` | Full artifact generation orchestration: document draft → all requested formats → validation → manifest update. |
| `/orchestrate-export` | Full export orchestration: artifact validation → export to delivery paths → export manifest. |

### Guide Commands

| Command | Purpose |
|---------|---------|
| `/add-guide` | Adds a new guide record to the guide-server. Accepts record type, content, tags, domain, and metadata. |
| `/update-guide` | Updates an existing guide record by ID. |
| `/find-guides` | Searches guide records via FTS5 full-text search, tag filtering, type filtering, and domain filtering. |
| `/guide-gap-check` | Identifies gaps in guide coverage for a given domain or production stage. |
| `/guide-link` | Creates a link between two guide records. Links are typed (e.g., `extends`, `contradicts`, `replaces`, `supports`). |
| `/guide-promote` | Promotes a guide record to a higher status (e.g., draft → active). |
| `/guide-deprecate` | Deprecates a guide record. Deprecated records are excluded from active search unless explicitly requested. |

### Sync Commands

| Command | Purpose |
|---------|---------|
| `/import-framework` | Primary inbound sync command. Imports framework updates from another repo or bundle into the current repo. |
| `/export-framework` | Primary outbound sync command. Exports framework updates to another repo or to a portable bundle. |
| `/import-principles` | Legacy compatibility import for doctrine + style scope. |
| `/export-principles` | Legacy compatibility export for doctrine + style scope. |
| `/sync-principles` | Legacy compatibility two-way doctrine/style sync. |
| `/sync-framework` | Legacy compatibility full-framework import surface. |
| `/upgrade-framework` | Advanced migration-aware upgrade flow built on `/import-framework`. |
| `/export-pack` | Legacy compatibility bundle export surface. |
| `/import-pack` | Legacy compatibility bundle import surface. |
| `/install-framework` | Bootstraps a new repo with the full framework structure. |
| `/apply-style-pack` | Applies a style pack definition to the current production context. |
| `/apply-doctrine` | Applies a doctrine set to the current repo with conflict detection. |

### Artifact Commands

| Command | Purpose |
|---------|---------|
| `/write-markdown` | Creates a validated markdown artifact from a document draft. |
| `/write-docx` | Creates a formatted Word document from a document draft. |
| `/write-pdf` | Creates a PDF from a document draft (via docx export or LaTeX compile path). |
| `/write-latex` | Creates LaTeX source from a document draft. |
| `/edit-docx` | Applies targeted edits to an existing docx artifact. |
| `/edit-latex` | Applies targeted edits to an existing LaTeX artifact. |
| `/export-docx` | Exports finalized docx to delivery location. |
| `/export-pdf` | Exports finalized PDF to delivery location. |
| `/normalize-artifact` | Normalizes formatting, heading hierarchy, and style compliance in an existing artifact. |
| `/artifact-validate` | Validates artifact against format spec and schema requirements. |

---

## MCP Infrastructure

Three MCP servers provide persistent state and tool surfaces. All servers are local-only. No external API keys required. Server source code lives in `mcp/`.

### guide-server

**Location:** `mcp/guide-server/`
**Backend:** SQLite with FTS5 full-text search extension
**Phase:** Implemented in Phase 2

**Purpose:** Stores and retrieves the knowledge layer. All guide records are stored here. Full-text search enables agents to find relevant guides by content, tag, type, and domain.

**Guide Record Types:**

| Type | Purpose |
|------|---------|
| `doctrine` | Non-negotiable operating rules stored as searchable records (mirrors `.writing-framework/doctrine/` files) |
| `style_pack` | Style pack definitions: voice, tone, formatting rules, terminology preferences |
| `canon` | Domain-specific facts, constraints, and established truths that documents must respect |
| `template` | Document templates: section structures, required fields, format specifications |
| `rubric` | Evaluation rubrics: criteria, weights, pass/fail thresholds for QA perspectives |
| `example` | Worked examples: complete production runs or document excerpts showing correct output |
| `anti_pattern` | Anti-pattern records: what not to do, why, and how to detect and correct it |
| `decision_record` | Decision records: resolved architectural or editorial choices with rationale |

**Operations:**

| Operation | Description |
|-----------|-------------|
| `add_guide` | Creates a new guide record. Returns record ID. |
| `update_guide` | Updates fields of an existing guide record by ID. |
| `search_guides` | Full-text search with optional type, tag, domain, and status filters. Returns ranked results. |
| `get_guide` | Retrieves a single guide record by ID with all fields. |
| `link_guides` | Creates a typed link between two guide records. |
| `deprecate_guide` | Sets record status to deprecated. Excluded from default search. |
| `related_guides` | Returns guide records linked to a given record ID, with link types. |

**Schema:** Each guide record contains: `id`, `type`, `title`, `content`, `tags` (array), `domain` (nullable), `status` (draft/active/deprecated), `linked_guides` (array of {id, link_type}), `created_at`, `updated_at`.

### cache-server

**Location:** `mcp/cache-server/`
**Backend:** SQLite
**Phase:** Implemented in Phase 4

**Purpose:** Provides persistent run state across the lifetime of a production run. Agents use the cache-server to save intermediate work, resume from blockers, and track artifact lineage.

**Stored Objects:**

| Object | Description |
|--------|-------------|
| `runs` | Run records: run ID, workflow, project, status, input_params, timestamps |
| `steps` | Step records: step ID, run ID, step_name, agent, input/output summaries, status, duration, timestamp |
| `artifacts` | Artifact records: artifact ID, run ID, step ID, type, content/path, metadata, size, timestamp |
| `blockers` | Blocker reports: blocker ID, run ID, step ID, type, description, resolution_required, severity, resolved status |
| `review_outputs` | QA review results: review ID, run ID, step ID, artifact ID, reviewer_agent, rubric ID, verdict, findings |
| `merge_reports` | Merge operation reports: merge ID, run ID, step ID, source artifact IDs, output artifact ID, strategy, conflicts |
| `resume_points` | Resume checkpoints: resume_point ID, run ID, step_index, checkpoint_name, state_snapshot, artifact IDs |

**Operations:**

| Operation | Description |
|-----------|-------------|
| `start_run` | Creates a new run record. Returns run ID and started_at timestamp. |
| `save_step` | Saves a step record with agent, summaries, status, and duration. Returns step ID. |
| `save_artifact` | Stores artifact with hybrid storage (inline <10KB, filesystem ≥10KB). Returns artifact ID and path. |
| `save_blocker` | Saves blocker report. Auto-pauses run if severity is 'blocking'. Returns blocker ID. |
| `fetch_run_context` | Returns full run context: run, steps, artifacts, blockers. Optional full artifact content. |
| `fetch_resume_point` | Returns most recent resume point for a run. Null if none exists. |
| `list_run_artifacts` | Lists artifacts with optional type and step filters. Returns metadata only. |
| `close_run` | Marks run as completed/failed/cancelled with optional summary. Returns success and closed_at. |
| `save_resume_point` | Creates checkpoint with state snapshot and artifact IDs. Returns resume_point ID. |
| `save_review_output` | Stores QA review with verdict and findings. Returns review ID. |
| `save_merge_report` | Records merge operation with sources, output, strategy, conflicts. Returns merge ID. |

### artifact-server

**Location:** `mcp/artifact-server/`
**Backend:** Local filesystem with format-specific tool wrappers
**Phase:** Implemented in Phase 5

**Purpose:** Manages the creation, editing, validation, and export of all artifact files. Maintains the artifact manifest. Provides a uniform interface across all supported formats.

**Supported Formats:**

| Format | Extension | Notes |
|--------|-----------|-------|
| Markdown | `.md` | Primary intermediate format. Used for all drafts. |
| DOCX | `.docx` | Word-compatible. Generated via docx tooling. |
| LaTeX | `.tex` | Source format for high-quality PDF output. |
| PDF | `.pdf` | Generated via DOCX export or LaTeX compile. Not directly edited. |

**Operations:**

| Operation | Description |
|-----------|-------------|
| `create_markdown` | Creates a new markdown file at the specified path. Registers in manifest. |
| `update_markdown` | Applies targeted updates to a markdown file. |
| `create_docx` | Creates a new DOCX file from document content or markdown source. |
| `update_docx` | Applies targeted edits to an existing DOCX file. |
| `create_latex` | Creates a new LaTeX file from document content. |
| `update_latex` | Applies targeted edits to an existing LaTeX file. |
| `compile_latex_to_pdf` | Compiles a LaTeX file to PDF. Returns compilation status and output path. |
| `export_markdown_to_docx` | Converts markdown source to DOCX. Applies active style pack formatting. |
| `export_markdown_to_pdf` | Converts markdown source to PDF via intermediate DOCX or direct renderer. |
| `inspect_artifact` | Returns metadata for an artifact: type, size, path, last modified, manifest status. |
| `validate_artifact` | Validates artifact against format spec. Reports format errors. |
| `normalize_artifact` | Normalizes formatting, heading hierarchy, and whitespace. Returns normalized content. |

---

## Schema Registry

All schemas are defined as JSON Schema files in `.writing-framework/schemas/`. Each schema defines the required structure for a category of structured output. Agents must produce outputs that validate against the applicable schema.

| Schema | File | Validates | Phase |
|--------|------|-----------|-------|
| `brief` | `.writing-framework/schemas/brief.json` | Project brief: goal, audience, domain, scope, constraints, tone, deliverables, inputs | Phase 3 |
| `outline` | `.writing-framework/schemas/outline.json` | Document outline: title, sections (each with id, title, purpose, scope, estimated length, subsections) | Phase 3 |
| `research_report` | `.writing-framework/schemas/research_report.json` | Research report: topic, sources (each with citation, summary, relevance), gaps, synthesis | Phase 3 |
| `review_report` | `.writing-framework/schemas/review_report.json` | QA review report: perspective, verdict (accept/conditional/block), findings (each with severity, location, description, recommendation), summary | Phase 4 |
| `rewrite_plan` | `.writing-framework/schemas/rewrite_plan.json` | Rewrite plan: source document, target sections, operations (each with type, location, instruction, rationale) | Phase 3 |
| `merge_report` | `.writing-framework/schemas/merge_report.json` | Merge report: source sections, merge operations performed, normalization actions, conflicts resolved, output path | Phase 3 |
| `blocker_report` | `.writing-framework/schemas/blocker_report.json` | Blocker report: blocker type, description, impacted scope, all unblocked work, partial outputs produced, resume plan | Phase 2 |
| `artifact_manifest` | `.writing-framework/schemas/artifact_manifest.json` | Artifact manifest: artifact records (each with id, type, format, source, path, status, created_at, exported_at) | Phase 5 |
| `sync_manifest` | `.writing-framework/schemas/sync_manifest.json` | Sync manifest: source framework version, applied packs (each with id, type, applied_at, hash), drift records, last_sync_at | Phase 6 |
| `quality_gate` | `.writing-framework/schemas/quality_gate.json` | Quality gate result: gate id, phase, perspectives evaluated (each with verdict and summary), overall verdict, blocking findings, required revisions | Phase 4 |

**Blocker classification values** (used in `blocker_report.blocker_type`):
- `missing_user_decision` — requires a user choice before proceeding
- `missing_repo_context` — required file or artifact not found in repo
- `missing_guide` — required guide record not found in guide-server
- `missing_source_material` — required research or source document not available
- `failed_toolchain` — MCP server or tool invocation failed
- `artifact_export_failure` — artifact generation or export operation failed
- `schema_conflict` — output does not validate against required schema
- `canon_conflict` — document content contradicts a canon guide record
- `validation_failure` — publication check or quality gate explicitly blocked advancement

---

## Guide System Design

The guide system is the long-term memory of the Editorial Orchestrator. It accumulates domain knowledge, editorial decisions, style definitions, and worked examples across production runs.

### Physical Organization

Guide records are stored in two places:
1. **guide-server MCP** — the authoritative store. All guide records are indexed here and searchable via FTS5.
2. **`.writing-framework/guides/` directory** — filesystem mirror organized by record type. Agents may read from the filesystem directly when the guide-server is unavailable, but should prefer MCP operations.

### How Agents Use Guides

Before beginning a production task, agents run a guide discovery pass:
1. Identify the active domain (from brief or discovery report)
2. Search guide-server for: active style packs for the domain, canon records for the domain, relevant rubrics, relevant templates, any anti-patterns for the task type
3. Load relevant guides into working context
4. Apply guide constraints throughout task execution

Guides are never applied silently. When a guide record influences agent behavior, the agent notes which record was applied and why.

### Guide Record Lifecycle

```
draft → active → deprecated
```

New guide records start as `draft`. They become `active` via `/guide-promote`. Outdated records become `deprecated` via `/guide-deprecate`. Deprecated records are excluded from default searches but remain accessible by ID.

### Guide Linking

Guide records can be linked to each other with typed links:

| Link Type | Meaning |
|-----------|---------|
| `extends` | This record adds to or elaborates on the linked record |
| `contradicts` | This record is in tension with the linked record (requires resolution) |
| `replaces` | This record supersedes the linked record |
| `supports` | This record provides evidence or examples for the linked record |
| `requires` | This record depends on the linked record being applied first |

---

## Artifact System Design

The artifact system handles the generation, editing, validation, and export of all output files. It is designed to support multiple output formats from a single document source.

### Artifact Lifecycle

```
document draft (markdown) → format-specific artifact → validated artifact → exported artifact
```

1. A document draft is produced by the writing pipeline as markdown
2. Format-specific artifacts are generated from the markdown source
3. Each artifact is validated against format spec
4. Validated artifacts are exported to delivery paths

### Artifact Formats and Use Cases

| Format | Primary Use Case | Generated By |
|--------|-----------------|--------------|
| Markdown | Internal drafts, documentation, web content | `/write-markdown` |
| DOCX | Deliverables requiring Word-compatible editing | `/write-docx` |
| PDF | Final read-only deliverables | `/write-pdf` (two paths: docx export or latex compile) |
| LaTeX | High-quality typeset documents, academic-style output | `/write-latex` |

### Artifact Manifest

Every artifact is registered in the artifact manifest (`artifacts/manifest.json`). The manifest tracks the full artifact lineage: which run produced it, which source document it was generated from, its current status, and all export paths.

### Format Paths

**Markdown → DOCX:** Converted via docx tooling with active style pack applied. Heading hierarchy, font styles, table formatting, and list styles are applied from style pack definitions.

**Markdown → PDF:** Two paths available:
- Via DOCX intermediate (faster, formatting governed by style pack)
- Direct markdown-to-PDF renderer (simpler, limited formatting control)

**LaTeX → PDF:** Compiled via LaTeX toolchain (pdflatex or equivalent). Compilation errors are captured and returned as structured error reports.

---

## Sync and Portability Design

The sync system allows doctrine, style packs, guide records, command stubs, schemas, and workflow definitions to be exported from this framework repo and imported into any compatible repository.

### Pack Structure

An export pack is a versioned bundle containing:
- A `sync_manifest.json` describing pack contents, source version, and component checksums
- Selected framework components organized by type
- Applicable migration rules for the target version range

### Sync Modes

| Mode | Command | Scope |
|------|---------|-------|
| Import framework updates | `/import-framework` | Repo source or portable bundle |
| Export framework updates | `/export-framework` | Another repo or portable bundle |
| Principles-only compatibility | `/sync-principles` | Doctrine and style packs only |
| Migration-aware upgrade | `/upgrade-framework` | Version-to-version upgrade with migration rules |

### Conflict Resolution

When an imported pack conflicts with existing local content:
1. Conflicts are detected by comparing component hashes
2. Each conflict is classified: safe-overwrite, requires-review, or blocked
3. A conflict report is produced before any changes are applied
4. Dry-run mode shows all actions without applying them
5. The user must explicitly approve conflict resolutions before application

### What Cannot Be Overwritten by Sync

- Local canon guide records (domain-specific facts that may not apply to the source repo)
- Local decision records (resolved choices that may differ between repos)
- Active run state (cache-server contents are never touched by sync operations)
- User-created style pack extensions (marked as local-only in the manifest)

---

## Data Flow

The following describes the primary data flow through the system for a standard document production run.

```
/session-start
    → cache-server: start_run → run_id
    → guide-server: load doctrine records
    → guide-server: load applicable style packs
    → session context established

/discovery
    → discovery-orchestrator → discovery-agent
    → reads: repo context, existing artifacts, prior runs, doctrine, guides
    → produces: discovery_report (confirmed context, inferred context, assumptions, blockers)
    → cache-server: save_step

/write-brief
    → brief-writer (consumes: discovery_report, user inputs, applicable guides)
    → produces: brief (validated against brief schema)
    → cache-server: save_artifact

/write-outline
    → outline-architect (consumes: brief, applicable guides, active style pack)
    → produces: outline (validated against outline schema)
    → cache-server: save_artifact

/draft-document
    → for each section in outline:
        → section-drafter (consumes: section spec, brief, guides, style pack)
        → produces: section draft
        → cache-server: save_artifact
    → merge-normalizer (consumes: all section drafts)
    → produces: merged draft + merge_report
    → cache-server: save_artifact

/orchestrate-review
    → qa-reader, qa-skeptic, qa-domain, qa-style, qa-coherence, qa-ai-stink
    → each produces: review_report
    → qa-final aggregates → quality_gate result
    → if gate passes → advance to finalization
    → if gate fails → blockage-handler produces resume plan

/orchestrate-artifact
    → artifact-orchestrator
    → artifact-server: create_markdown, create_docx, create_latex as needed
    → artifact-server: validate_artifact for each
    → artifact_manifest updated
    → /publication-check gate
    → /orchestrate-export
```

---

## Multi-Tool Adapter Architecture

The Editorial Orchestrator is designed to be operated by any AI coding agent, not only Claude Code. The design separates canonical content from tool-specific wiring.

### Directory Design

```
.writing-framework/                   ← canonical, tool-agnostic source of truth
  commands/             ← one spec file per command
  agents/               ← one spec file per agent
  hooks/                ← tool-agnostic hook definitions

.claude/                ← Claude Code adapter
  commands/             ← Claude Code slash command files (one per command)
  agents/               ← Claude Code agent files (if applicable)
  hooks/                ← Claude Code hook definitions
  CLAUDE.md             ← Claude Code operating manual (loaded automatically)

.codex/                 ← OpenAI Codex adapter
  commands/             ← Codex command wrappers (one per command)
  system-prompt-template.md  ← system prompt template loading framework doctrine
  README.md             ← how to use this framework with Codex

.windsurf/              ← Windsurf adapter
  commands/             ← Windsurf command wrappers (one per command)
  rules/
    .windsurfrules      ← persistent AI rules file for Windsurf
  README.md             ← how to use this framework with Windsurf

.copilot/               ← GitHub Copilot adapter
  commands/             ← Copilot command wrappers (one per command)
  copilot-instructions-template.md  ← template for .github/copilot-instructions.md
  README.md             ← how to use this framework with Copilot

.github/
  copilot-instructions.md ← active Copilot instructions for this repo
```

### Design Rules

**`.writing-framework/` is the source of truth.** Command specs and agent specs in `.writing-framework/` define behavior. Tool adapters may abbreviate or reformat, but must not contradict `.writing-framework/`.

**Tool adapters are thin wrappers.** The job of `.claude/commands/command-name.md`, `.codex/commands/command-name.md`, `.windsurf/commands/command-name.md`, and `.copilot/commands/command-name.md` is to load the core spec and execute it in the tool's format. They do not redefine the command.

**Each tool's operating manual lives in its own directory.** `CLAUDE.md` (at repo root, loaded by Claude Code) is the Claude-specific manual. Codex uses `.codex/system-prompt-template.md`. Windsurf uses `.windsurf/rules/.windsurfrules`. Copilot uses `.github/copilot-instructions.md`, with `.copilot/copilot-instructions-template.md` as the source template.

**Sync targets `.writing-framework/` plus the adapter surfaces.** When running `/import-framework` or `/export-framework`, the sync operation targets `.writing-framework/` first, then the thin tool adapters in `.claude/`, `.codex/`, `.copilot/`, `.windsurf/`, and `.github/copilot-instructions.md` when adapters are in scope.

---

## Infrastructure Constraints

These constraints govern all infrastructure decisions in the Editorial Orchestrator. They are not preferences — they are requirements.

1. **No external AI API keys required for core functionality.** The system must be operable without any third-party API credentials. External services may be integrated as optional enhancements but must not be required.

2. **Prefer local, inspectable, boring systems.** SQLite over distributed databases. Filesystem over object storage. Standard tooling over specialized dependencies. Every component must be understandable without specialized expertise.

3. **Avoid premature vector database infrastructure.** Full-text search via SQLite FTS5 is sufficient for v1. Vector search may be introduced in a later phase when evidence supports the need, not before.

4. **Keep v1 simple and reliable.** Complexity is added only when a concrete production need requires it. Speculative infrastructure is not built.

5. **All persistent state is inspectable without tooling.** SQLite databases can be read with sqlite3 CLI. Manifests are JSON files. Logs are plaintext. No binary-only storage except final artifact formats (docx, pdf).

6. **MCP servers are scoped to their domain.** guide-server handles knowledge only. cache-server handles run state only. artifact-server handles file operations only. No server grows outside its domain.
