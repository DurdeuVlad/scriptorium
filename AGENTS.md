# AGENTS.md — Codex Operating Manual

This is the operating manual for Codex agents working in this repository. It is loaded automatically before every task. It takes precedence over inferred behavior and general training.

**Multi-tool note:** This framework supports Codex, OpenAI Codex, Windsurf, and GitHub Copilot. Canonical command and agent specs live in `.writing-framework/commands/` and `.writing-framework/agents/`. This file and `.Codex/` are the Codex adapter. Other tools use `.codex/`, `.windsurf/`, and `.copilot/`. When this file conflicts with a general pattern, follow this file.

---

## Section 1: System Identity

### What This Repository Is

This repository is the **Editorial Orchestrator** — an agent-first editorial framework for orchestration-driven document production. It is not a prompt library. It is not a writing assistant. It is a production system.

The framework operates through a structured pipeline: discovery → brief → outline → draft → review → QA → artifact → export. Each phase produces validated structured outputs. Quality gates block phase advancement when required standards are not met. Doctrine governs agent behavior at every stage.

### Mission

Produce high-quality, publication-ready documents across all supported domains by applying consistent orchestration, structured knowledge, rigorous QA, and artifact-capable output — with minimal human intervention and maximum agent autonomy.

### Operating Model

The system is organized into six functional layers: the Public Layer (commands the user or orchestrator invokes), the Orchestration Layer (meta-commands that coordinate multi-agent work and enforce gates), the Agent Layer (specialized agents for each production function), the Knowledge Layer (doctrine, guides, style packs, canon, rubrics, templates, examples, anti-patterns, decision records), the Infrastructure Layer (MCP servers for guide storage, run caching, and artifact management), and the Artifact Layer (structured generation of markdown, docx, pdf, and latex output). Agents operate in the Agent Layer, consume from the Knowledge Layer, write to the Infrastructure Layer, and surface results through the Public Layer. See [ARCHITECTURE.md](ARCHITECTURE.md) for full layer specifications.

### Supported Domains

General writing, internal documentation, technical-adjacent explanations, D&D and worldbuilding, card game writing, structured creative design docs.

### Runtime app UI (Scriptorium workspace)

When changing the React workspace (`frontend/`), follow [docs/design/TOKENS.md](docs/design/TOKENS.md), then verify with [docs/UI_REVIEW.md](docs/UI_REVIEW.md) and the procedure index in [tests/manual/README.md](tests/manual/README.md). Run `cd frontend && npm run ui-smoke` and `npm run ui-consult-qa` when API + Vite are up; walk high-risk flows from [tests/manual/coverage-matrix.md](tests/manual/coverage-matrix.md) and persona docs ([PERSONAS.md](tests/manual/PERSONAS.md), [14-persona-journeys.md](tests/manual/14-persona-journeys.md), [15-adversarial-stress.md](tests/manual/15-adversarial-stress.md)) before claiming UX is done.

---

## Section 2: Before Every Task

Every agent must run this checklist before beginning any task. No exceptions.

**Pre-Task Checklist:**

1. **Read AGENTS.md (this file).** It is always loaded first. If AGENTS.md has been updated since your last read, re-read it before proceeding.

2. **Check `.writing-framework/doctrine/` for relevant constraints.** Identify which doctrine files apply to the current task. Load their content. Doctrine constraints are non-negotiable and override any conflicting instruction or inference.

3. **Check `.writing-framework/guides/` for relevant knowledge.** If the guide-server MCP is available, run a targeted search for: style packs matching the active domain, canon records for the domain, rubrics relevant to the current phase, anti-patterns for the task type. If the guide-server is unavailable, read the filesystem `.writing-framework/guides/` subdirectories directly.

4. **Run `/discovery` or equivalent discovery pass if working on writing tasks.** Do not begin drafting without a discovery pass. The discovery pass is the mechanism that prevents wasted work from wrong assumptions.

5. **Check `.writing-framework/workflows/` for the applicable workflow.** Identify which workflow governs the current production stage. Load the workflow definition. Follow it unless a specific instruction overrides a specific step.

6. **Check `.writing-framework/schemas/` for required output formats.** Every major output must validate against its schema. Identify the applicable schema before producing output so the output structure is correct from the start.

7. **Identify the active style pack from `.writing-framework/styles/`.** If no style pack is explicitly set, check the discovery report or brief for domain information and load the default style pack for that domain. If no domain-specific style pack exists, use the baseline style pack.

---

## Section 3: Core Behavior Rules

### Discovery Behavior

Discovery is mandatory before all writing tasks. Discovery is the process of inspecting existing repo context so that agents ask only necessary questions and proceed with maximum autonomy.

**Discovery process:**

1. Read all relevant files already present in the repository: existing briefs, outlines, drafts, prior discovery reports, doctrine files, guide records, style packs, examples, canon records, and any active artifact manifests
2. Identify what is already known, what can be reasonably inferred, and what is genuinely missing
3. Infer defaults for missing information wherever a reasonable default exists and the choice does not materially affect direction
4. Produce a discovery report with four sections: **Confirmed Context** (facts read from the repo), **Inferred Context** (reasonable defaults applied), **Assumptions** (inferences made that carry uncertainty), **Blockers** (information or decisions that cannot be inferred and are required to proceed)
5. Include an **Immediate Actions** section listing the first three things that can be done without resolving any blocker

**What to ask about:**
Ask the user only for information that (a) cannot be reasonably inferred and (b) materially changes the direction of the work. Do not ask about formatting preferences when a style pack governs them. Do not ask about tone when a style pack defines it. Do not ask about structure when a template exists for the document type.

**What not to ask about:**
Do not ask for confirmation of facts that are readable from the repo. Do not ask for preferences that doctrine or a guide record already specifies. Do not ask multiple questions at once — if you must ask, ask one question and continue all unblocked work.

### Blockage Behavior

When blocked, do not stop. Classify, scope, continue, produce, store, and plan.

**Blockage protocol:**

1. **Classify the blocker.** Use the defined blocker types from the `blocker_report` schema:
   - `missing_user_decision` — a choice that requires user input and cannot be inferred
   - `missing_repo_context` — a required file or artifact is absent from the repo
   - `missing_guide` — a required guide record does not exist in the guide-server
   - `missing_source_material` — required research or source documents are not available
   - `failed_toolchain` — an MCP server or tool invocation has failed
   - `artifact_export_failure` — artifact generation or export has failed
   - `schema_conflict` — produced output does not validate against its required schema
   - `canon_conflict` — document content contradicts an applicable canon guide record
   - `validation_failure` — a quality gate has explicitly blocked phase advancement

2. **Identify impacted scope.** Determine which downstream steps are blocked by this blocker and which are not. Scope the impact precisely — do not treat a narrow blocker as a full work stoppage.

3. **Continue all unaffected work.** A blocker in one branch does not pause other branches. If section 3 is blocked due to missing source material, complete sections 1, 2, 4, and 5. Produce all outputs that do not depend on the blocked information.

4. **Produce partial outputs.** Always produce the best partial output achievable given available information. A partial output is more valuable than no output. Mark partial outputs clearly as partial.

5. **Store blocker metadata as a structured report.** Produce a `blocker_report` schema-compliant object. If the cache-server MCP is available, save it as a run artifact. If not, write it to `logs/`.

6. **Create a resume plan with the exact next step.** The resume plan specifies: what information is needed to unblock, what step to run when the blocker is resolved, and what outputs are already available. The resume plan must be actionable without re-reading context.

### QA Behavior

No phase is complete without self-QA. Every major artifact must be reviewed against all applicable QA perspectives before phase advancement.

**The seven QA perspectives:**

| Perspective | Core Question | What It Catches |
|-------------|--------------|----------------|
| Reader | Does this make sense to the intended reader? | Assumed knowledge, unclear references, unfulfilled promises from the intro, sections that don't serve the reader's need |
| Skeptic | What feels weak, padded, or unsupported? | Thin arguments, ungrounded claims, padding, hedging that obscures the point, conclusions that don't follow from the evidence |
| Domain | Does this fit actual domain conventions or canon? | Terminology errors, canon violations, domain convention violations, misrepresented domain knowledge |
| Style | Does this match the active style pack? | Voice deviations, tone inconsistencies, formatting violations, prohibited terms, sentence structure deviations |
| Coherence | Does the structure and internal logic hold? | Structural gaps, transitions that don't connect, sections that contradict each other, argument flow failures, orphaned points |
| AI-stink | What sounds machine-generated or too smooth? | Hollow affirmations, oversmooth transitions, unearned gravitas, corporate cadence, imprecise hedging, filler phrases, suspiciously balanced conclusions |
| Final gate | Accept, conditional accept, or block? | Aggregates all perspectives. Issues overall verdict. A conditional accept specifies required revisions. A block specifies blocking findings. |

**QA verdicts:**
- `accept` — artifact meets required standards, phase may advance
- `conditional_accept` — artifact has required revisions that must be completed before export, but may advance to the revision step
- `block` — artifact has blocking findings that prevent phase advancement; a new draft pass is required

**Self-QA protocol:**
When producing a major artifact without invoking a dedicated QA command, apply the reader, skeptic, and AI-stink perspectives at minimum as a self-check. Note any findings. If findings are serious enough to warrant revision, revise before delivering. Do not deliver an artifact you have identified as failing.

### Artifact Behavior

- Once Phase 5 is implemented, use the artifact-server MCP for all file generation and management. Do not write files directly outside of artifact-server operations.
- Before Phase 5, use `/write-markdown` or the Write tool directly for file creation.
- Always validate output paths before writing: confirm the target directory exists, the filename is correct, and no existing file will be silently overwritten without intent.
- Every generated artifact must be registered: in the artifact manifest (Phase 5) or in a log entry (Phase 1–4).
- Format correctness is required: markdown must be valid markdown, docx must be valid docx, LaTeX must compile without errors before the artifact is marked complete.
- Use the `normalize_artifact` operation before marking any artifact as export-ready.

### Portability Behavior

- This framework repository is the canonical source of doctrine, commands, guide record schemas, style packs, and workflow definitions.
- Other repositories may extend the framework locally by adding domain-specific guides, canon records, and style pack extensions. Local extensions are valid and expected.
- Local extensions must not silently drift from the canonical framework. Drift is tracked in the sync manifest.
- Use `/sync-framework` and `/import-pack` for propagating framework updates to dependent repositories.
- Use `/export-pack` to create versioned bundles of framework components for distribution.
- Never overwrite active local canon, decision records, or run state during sync operations.

---

## Section 4: Autonomy Rules

Agents in this system operate with high autonomy. The goal is to advance work as far as possible without user involvement, surfacing only genuinely blocking decisions.

**Rule 1: Proceed as far as possible without waiting for the user.**
Default behavior is to work forward. Do not pause to ask for approval of decisions that are within the scope of the current task, governed by doctrine or guides, or inferable from existing context.

**Rule 2: Only ask when ambiguity materially affects direction.**
Before asking a question, ask yourself: if I assume the most reasonable default, how wrong could I be and how hard is it to correct? If the answer is "not very wrong" or "easy to correct," proceed with the assumption and note it. If the answer is "significantly wrong" and "hard to reverse," ask.

**Rule 3: If blocked in one branch, continue all unblocked branches.**
Blockers are local. They do not stop the whole production. Map the dependency graph. Work everything that is not downstream of the blocker.

**Rule 4: Always leave a clean resume point.**
Before ending any session or stopping on a blocker, write a resume point. The resume point specifies: current phase, completed steps, pending steps, open blockers, available artifacts, and the exact next command to run.

**Rule 5: Always produce partial useful output.**
If full completion is not possible, deliver the best partial output achievable. A partial brief, a partial outline, or a partial draft is more useful than nothing. Mark it partial. Explain what's missing and why.

**Rule 6: Use the three decision types correctly.**

| Type | When to Use | Action |
|------|-------------|--------|
| Infer and proceed | Clear default exists, choice is reversible, doctrine or guides specify the answer | Apply the default, continue work |
| Infer and note assumption | Reasonable default exists, some uncertainty, choice affects output quality but is correctable | Apply the default, note the assumption explicitly in output |
| Must ask | No reasonable default, choice materially affects direction, error is costly or hard to reverse | Ask one specific question, continue all unblocked work while waiting |

Type 3 decisions should be rare. If you find yourself making more than one type 3 decision per task, the discovery pass was insufficient.

---

## Section 5: Quality Gate Requirements

A phase is NOT complete if any of the following conditions are true. These are blocking conditions. Phase advancement requires all conditions to be false.

| Condition | Gate Failure Reason |
|-----------|-------------------|
| Required output files are missing | Phase output cannot be evaluated without its required artifacts |
| Command behavior is ambiguous | Agents cannot reliably invoke commands with undefined behavior |
| Schemas are undefined where needed | Agents cannot validate outputs without schema definitions |
| Doctrine is contradicted | Any output or behavior that contradicts loaded doctrine invalidates the phase |
| Orchestration paths are under-specified | Agents cannot complete multi-step work without defined coordination paths |
| Artifact flows are unstable | Artifacts that fail validation or cannot be exported block the artifact phase |
| Sync behavior is unsafe | Sync operations that could overwrite protected content block the sync phase |

These conditions apply at the end of each phase. The `quality_gate` schema captures the gate evaluation result.

---

## Section 6: Directory Reference

Every directory in the repository, its purpose, the agents and commands that own it, and its current implementation status.

| Directory | Purpose | Owner | Status |
|-----------|---------|-------|--------|
| `.writing-framework/doctrine/` | Non-negotiable operating rules. Every agent reads applicable doctrine files before every task. Content here cannot be overridden by user instruction or guide records. | `lead-orchestrator` | Phase 1: scaffold |
| `.writing-framework/guides/` | Curated knowledge store root. Contains all guide record subdirectories and mirrors the guide-server MCP content. | guide-server MCP | Phase 1: scaffold |
| `.writing-framework/guides/doctrine/` | Doctrine-type guide records stored as searchable records. Mirrors `.writing-framework/doctrine/` in searchable form. | guide-server MCP | Phase 2: implemented |
| `.writing-framework/guides/style-packs/` | Style pack guide records. One record per style pack definition. | guide-server MCP | Phase 2: implemented |
| `.writing-framework/guides/canon/` | Canon guide records. Domain-specific facts and constraints that documents must not contradict. | guide-server MCP, `canon-checker` | Phase 2: implemented |
| `.writing-framework/guides/templates/` | Template guide records. Document structure templates for each supported document type. | guide-server MCP | Phase 2: implemented |
| `.writing-framework/guides/rubrics/` | Rubric guide records. QA evaluation criteria, weights, and thresholds. | guide-server MCP, QA agents | Phase 2: implemented |
| `.writing-framework/guides/examples/` | Example guide records. Worked examples of correct production output for each domain and document type. | guide-server MCP | Phase 2: implemented |
| `.writing-framework/guides/anti-patterns/` | Anti-pattern guide records. What not to do, why, and how to detect and correct violations. | guide-server MCP | Phase 2: implemented |
| `.writing-framework/guides/decision-records/` | Decision record guide records. Resolved architectural and editorial choices with rationale. | guide-server MCP | Phase 2: implemented |
| `.writing-framework/styles/` | Style pack definition files by domain. Applied to the production context via `/apply-style-pack`. Each style pack specifies voice, tone, sentence structure, formatting, terminology, and prohibited patterns. | `voice-editor`, `/apply-style-pack` | Phase 1: scaffold |
| `.writing-framework/workflows/` | Workflow definition files for each production stage. Referenced by agents during execution. Each workflow specifies steps, inputs, outputs, agent assignments, and gate conditions. | All agents | Phase 1: scaffold |
| `.writing-framework/schemas/` | JSON Schema definitions for all structured outputs. Agents validate their outputs against these schemas before delivering. | All agents | Phase 1: scaffold |
| `.writing-framework/commands/` | **Canonical command specs** — tool-agnostic, one file per command. Read this directory to understand what a command does. | All commands | Phase 1: scaffold |
| `.writing-framework/agents/` | **Canonical agent specs** — tool-agnostic, one file per agent. All agent behavior is defined here. | All agents | Phase 1: scaffold |
| `.writing-framework/hooks/` | Tool-agnostic hook definitions used as source for tool-specific hook implementations. | `lead-orchestrator` | Phase 1: scaffold |
| `.Codex/commands/` | **Codex adapter** — slash command files that wrap `.writing-framework/commands/` specs in Codex format. | Codex | Phase 1: scaffold |
| `.Codex/hooks/` | Codex hook definitions adapted from `.writing-framework/hooks/`. | `lead-orchestrator` | Phase 1: scaffold |
| `.codex/` | **OpenAI Codex adapter** — system prompt template and usage guide for operating the framework with Codex. | Codex users | Phase 1: scaffold |
| `.windsurf/` | **Windsurf adapter** — `.windsurfrules` file and usage guide for Windsurf. | Windsurf users | Phase 1: scaffold |
| `.copilot/` | **GitHub Copilot adapter** — `copilot-instructions-template.md` and usage guide for Copilot. | Copilot users | Phase 1: scaffold |
| `mcp/` | MCP server source code root. Contains all three server implementations. | Infrastructure | Phase 1: scaffold |
| `mcp/guide-server/` | Guide server: SQLite + FTS5. Provides guide record CRUD, full-text search, and linking operations. | guide-server MCP | Phase 2: implemented |
| `mcp/cache-server/` | Cache server: SQLite. Provides run lifecycle management, step recording, artifact registration, and blocker storage. | cache-server MCP | Phase 2: implemented |
| `mcp/artifact-server/` | Artifact server: filesystem + tool wrappers. Provides artifact creation, editing, validation, and export operations. | artifact-server MCP | Phase 5: implemented |
| `sync/` | Sync and portability tooling root. Contains all sync operation support directories. | `framework-sync-agent`, `import-export-orchestrator` | Phase 1: scaffold |
| `sync/export-packs/` | Staged export packs ready for distribution. Each pack is a versioned bundle with a sync manifest. | `/export-pack` | Phase 6: implemented |
| `sync/import-packs/` | Staged import packs awaiting application. Packs here have been received but not yet applied. | `/import-pack` | Phase 6: implemented |
| `sync/migration-rules/` | Migration rule files for cross-version sync. Applied during `/upgrade-framework` to handle schema changes. | `/upgrade-framework` | Phase 6: implemented |
| `sync/sync-manifests/` | Generated sync manifests tracking applied packs, component hashes, and drift state. | `framework-sync-agent` | Phase 6: implemented |
| `artifacts/` | Generated output files. Managed by artifact-server once Phase 5 is active. Pre-Phase 5, files are written here directly. | artifact-server MCP | Phase 1: scaffold |
| `.writing-framework/templates/` | Reusable document templates for each supported domain. Physical copies of template documents used by `/write-docx`, `/write-latex`, and the section-drafter agent. | `outline-architect`, `section-drafter` | Phase 1: scaffold |
| `.writing-framework/examples/` | Worked examples for each domain. Complete production runs or representative excerpts showing correct output at each phase. | All agents (read) | Phase 1: scaffold |
| `evals/` | Quality evaluation sets. Test cases for validating agent and command behavior. Used for regression testing across framework upgrades. | All agents (test target) | Phase 1: scaffold |
| `logs/` | Run logs, blocker reports, and resume points. Written by agents when cache-server is unavailable. Always available as fallback. | All agents | Phase 1: scaffold |
| `scripts/` | Utility scripts for setup, maintenance, diagnostics, and MCP server management. | Human operators | Phase 1: scaffold |

---

## Section 7: Schema Reference

All schemas are defined in `.writing-framework/schemas/`. Every agent that produces structured output must validate its output against the applicable schema before delivering. If output fails schema validation, the blocker type is `schema_conflict`.

| Schema | File | What It Validates | Implementing Phase |
|--------|------|-------------------|--------------------|
| `brief` | `.writing-framework/schemas/brief.json` | Project brief: goal, audience, domain, tone, scope, constraints, deliverables, inputs, success criteria | Phase 3 |
| `outline` | `.writing-framework/schemas/outline.json` | Document outline: title, document type, sections (each with id, title, purpose, scope notes, estimated word count, subsections) | Phase 3 |
| `research_report` | `.writing-framework/schemas/research_report.json` | Research output: topic, sources (citation, summary, relevance score, reliability), synthesis, identified gaps | Phase 3 |
| `review_report` | `.writing-framework/schemas/review_report.json` | QA review: perspective label, verdict (accept/conditional_accept/block), findings (severity, location, description, recommendation), summary, reviewer identity | Phase 4 |
| `rewrite_plan` | `.writing-framework/schemas/rewrite_plan.json` | Rewrite instructions: source document reference, target sections, operations (type, location, instruction, rationale, priority) | Phase 3 |
| `merge_report` | `.writing-framework/schemas/merge_report.json` | Merge operation record: source sections, merge sequence, normalization actions applied, conflicts detected and resolved, output path, word count delta | Phase 3 |
| `blocker_report` | `.writing-framework/schemas/blocker_report.json` | Blocker record: blocker_type (from enum), description, impacted_steps, unblocked_work, partial_outputs_produced, resume_plan (next_command, required_inputs, available_artifacts) | Phase 2 |
| `artifact_manifest` | `.writing-framework/schemas/artifact_manifest.json` | Artifact registry: run_id, artifacts (id, type, format, source_document, path, status, created_at, validated_at, exported_at, export_paths) | Phase 5 |
| `sync_manifest` | `.writing-framework/schemas/sync_manifest.json` | Sync state: source_framework_version, target_repo, applied_packs (id, type, version, applied_at, component_hashes), drift_records, last_sync_at | Phase 6 |
| `quality_gate` | `.writing-framework/schemas/quality_gate.json` | Gate evaluation: gate_id, phase, run_id, perspectives_evaluated (label, verdict, summary), blocking_findings, required_revisions, overall_verdict, evaluated_at | Phase 4 |

**Schema validation requirement:** Validate schema compliance before delivering any structured output. Do not deliver outputs that fail required fields. If a required field cannot be populated (blocker), classify it as `schema_conflict` and follow blockage protocol.

---

## Section 8: Implementation Status

Phase 1 is the current phase. All framework structure is being established. No commands, agents, or MCP servers are fully implemented yet — they are scaffolded with stub definitions.

### Command Implementation Status

Core specs live in `.writing-framework/commands/`. Codex adapters live in `.Codex/commands/`. Other tool adapters are in `.codex/`, `.windsurf/`, `.copilot/`.

| Command Group | Commands | Core Spec | Codex Adapter | Implemented In |
|---------------|----------|-----------|----------------|----------------|
| Foundation | `/help`, `/session-start`, `/project-scan`, `/status`, `/whats-next`, `/explain-workflow` | Stub | Stub | Phase 2 |
| Discovery | `/discovery`, `/discovery-agent`, `/discovery-simulate-user`, `/requirements-brief` | Stub | Stub | Phase 2 |
| Research | `/research`, `/validate-research`, `/synthesize-research`, `/source-gap-check`, `/evidence-map` | Stub | Stub | Phase 3 |
| Editorial | `/write-brief`, `/write-outline`, `/draft-section`, `/draft-document`, `/merge-draft`, `/rewrite`, `/line-edit`, `/compress`, `/voice-pass`, `/canon-check`, `/publication-check` | Stub | Stub | Phase 3 |
| QA | `/qa-reader`, `/qa-skeptic`, `/qa-domain`, `/qa-style`, `/qa-coherence`, `/qa-ai-stink`, `/qa-final` | Stub | Stub | Phase 4 |
| Orchestration | `/orchestrate-brief`, `/orchestrate-outline`, `/orchestrate-draft`, `/orchestrate-review`, `/orchestrate-finalize`, `/orchestrate-artifact`, `/orchestrate-export` | Stub | Stub | Phases 3–5 |
| Guides | `/add-guide`, `/update-guide`, `/find-guides`, `/guide-gap-check`, `/guide-link`, `/guide-promote`, `/guide-deprecate` | Stub | Stub | Phase 2 |
| Sync | `/import-principles`, `/export-principles`, `/sync-principles`, `/sync-framework`, `/upgrade-framework`, `/export-pack`, `/import-pack`, `/install-framework`, `/apply-style-pack`, `/apply-doctrine` | Stub | Stub | Phase 6 |
| Artifacts | `/write-markdown`, `/write-docx`, `/write-pdf`, `/write-latex`, `/edit-docx`, `/edit-latex`, `/export-docx`, `/export-pdf`, `/normalize-artifact`, `/artifact-validate` | Stub | Stub | Phase 5 |

### Agent Implementation Status

Canonical agent specs live in `.writing-framework/agents/` (tool-agnostic). These specs are the authoritative definition of each agent's mission, inputs, outputs, forbidden behaviors, and handoff format.

| Agent Group | Agents | `.writing-framework/agents/` Status | Implemented In |
|-------------|--------|----------------------|----------------|
| Meta/Orchestration | `lead-orchestrator`, `lead-editor`, `intake-router`, `discovery-orchestrator`, `discovery-agent`, `blockage-handler`, `framework-sync-agent`, `principles-sync-agent`, `import-export-orchestrator`, `artifact-orchestrator` | Stub specs created | Phases 2–6 |
| Writing/Editing | `brief-writer`, `outline-architect`, `section-drafter`, `merge-normalizer`, `clarity-editor`, `line-editor`, `compression-editor`, `voice-editor`, `canon-checker`, `adversarial-reviewer` | Stub specs created | Phases 3–4 |
| QA | `qa-reader`, `qa-skeptic`, `qa-domain`, `qa-style`, `qa-coherence`, `qa-ai-stink`, `qa-final` | Stub specs created | Phase 4 |

### MCP Server Implementation Status

| Server | Phase 1 Status | Implemented In |
|--------|----------------|----------------|
| guide-server | Directory scaffolded, README stub created | Phase 2 |
| cache-server | Directory scaffolded, README stub created | Phase 2 |
| artifact-server | Directory scaffolded, README stub created | Phase 5 |

---

## Section 9: Editorial Doctrine Summary

The full doctrine is in `.writing-framework/doctrine/`. This section is a compressed summary for agent-accessible reference. When in doubt, read the doctrine files directly.

**Rule 1: Serve the reader, not the brief.**
The brief defines the goal. The reader defines the standard. A document that fulfills every brief requirement but leaves the reader confused or unpersuaded has failed. Every editorial decision must be evaluated against reader impact. See `.writing-framework/doctrine/EDITORIAL_DOCTRINE.md`.

**Rule 2: Say it once, say it well.**
Repetition is a quality defect. Every idea, claim, and example must appear once, in the location where it has the most impact. Do not summarize what was just said. Do not preview what is about to be said unless the document structure genuinely requires it. See `.writing-framework/doctrine/EDITORIAL_DOCTRINE.md` (Compression rule).

**Rule 3: All claims must be grounded.**
Assertions without grounding are a quality defect. Every factual claim must be sourced, every evaluative claim must be grounded in explicit criteria, and every recommendation must follow from stated reasoning. Vague hedging ("it is important to note," "many experts believe") is not grounding. See `.writing-framework/doctrine/QUALITY_GATES.md`.

**Rule 4: Structure is an argument.**
The sequence of sections, the hierarchy of headings, and the placement of examples are not administrative choices — they are editorial arguments. Structure that does not serve the reader's comprehension or the document's purpose is wrong structure. See `.writing-framework/doctrine/DECOMPOSITION_RULES.md`.

**Rule 5: Voice must be intentional.**
Every document is written for an audience with a specific relationship to the content. That relationship defines the appropriate voice. Voice is not decoration — it is a communication tool. A mismatch between voice and audience is an editorial failure. Apply the active style pack rigorously. See `.writing-framework/doctrine/VOICE_MODEL.md`.

---

## Section 10: Getting Help

When you are uncertain how to proceed, use these resources in order.

| Resource | How to Use | What It Answers |
|----------|------------|----------------|
| `.writing-framework/doctrine/` | Read the applicable doctrine file directly | Non-negotiable operating rules, behavioral constraints, quality standards |
| `.writing-framework/guides/` | Run `/find-guides` with relevant query terms | Domain knowledge, style rules, canon constraints, worked examples, anti-patterns |
| `.writing-framework/workflows/` | Read the workflow file for the current production stage | Step-by-step process for each phase, agent assignments, gate conditions |
| `/discovery` | Run the command with applicable scope | What context exists, what is missing, what can be inferred, what is blocked |
| `/status` | Run the command against the current run | Current phase, completed steps, open blockers, available artifacts |
| `/whats-next` | Run the command | Recommended next action given current run state |
| `ARCHITECTURE.md` | Read the relevant section | System design, agent taxonomy, command taxonomy, schema definitions, MCP operations |
| `ROADMAP.md` | Read the relevant phase | What is built, what is planned, what phase a given capability belongs to |

If none of these resources resolve the uncertainty, classify it as a `missing_user_decision` blocker, continue all unblocked work, and produce a structured blocker report with a specific question for the user.
