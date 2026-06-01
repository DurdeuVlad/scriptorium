# Design Decisions Journal

This file records significant architectural and design decisions made during the development of the Editorial Orchestrator framework. Each entry documents what was decided, why, what alternatives were considered, and the consequences.

Entries are ordered chronologically. Do not delete entries — mark superseded decisions as SUPERSEDED and add a new entry for the replacement.

---

## D-001 — Agent-First Architecture
**Date:** 2026-03-28
**Status:** Active

**Decision:** Build the framework for AI agents as primary operators, not humans as typists. All commands, schemas, and workflows are designed to be executed autonomously.

**Why:** Human-first writing tools exist in abundance. The gap is in orchestrated, quality-gated, multi-phase document production that agents can drive end-to-end. Designing for agents first means every interface is explicit, structured, and inspectable — which also makes it better for humans when they do intervene.

**Alternatives considered:** Human-in-the-loop tool with AI assistance. Rejected because it constrains the autonomy model and produces different architectural choices (UI over CLI, interactive over batch, single-pass over multi-phase).

**Consequences:** Every command must have structured inputs and outputs. Vague "just do your best" commands are not allowed. All handoffs between agents must use defined schemas.

---

## D-002 — Phase-Gated Implementation
**Date:** 2026-03-28
**Status:** Active

**Decision:** Build in six phases, each with explicit completion gates. Phase 1 = foundation and doctrine. No phase implements logic before its infrastructure dependencies are established in prior phases.

**Why:** Building MCP servers, command implementations, and agent behaviors all at once guarantees that early decisions about one component contaminate others before the design is stable. Phasing ensures each layer is solid before the next is built on it.

**Alternatives considered:** Build everything in one pass. Rejected: produces unmaintainable scope and forces premature implementation decisions.

**Consequences:** Phase 1 files are stubs. Phase 2 implements guide-server and cache-server. Phase 3 adds the writing pipeline. This means Phase 1 is not "working" in the functional sense — it is the architecture contract that all subsequent phases implement against.

---

## D-003 — `.writing-framework/` as Central Portable Folder
**Date:** 2026-03-28
**Status:** Active

**Decision:** All canonical framework content lives in `.writing-framework/` — doctrine, commands, agents, styles, workflows, schemas, guides, templates, examples. This folder is the unit of export and import between repos.

**Why:** The framework must be portable. When installing this framework in a new repo, you copy `.writing-framework/`. When syncing a framework update, you compare `.writing-framework/` against the source. Having a single well-named root folder makes the portability boundary explicit and unambiguous.

**Original design:** `core/` was used initially. Renamed to `.writing-framework/` to use the hidden-folder convention (like `.git/`, `.github/`, `.claude/`) and give it a meaningful name.

**Alternatives considered:**
- Keep content at repo root (doctrine/, styles/, etc.). Rejected: no clear portability boundary, tool adapters can't reference a single folder.
- Name it `framework/`. Rejected: not hidden, could conflict with project content.
- Name it `.editorial/`. Considered valid, `.writing-framework/` chosen for specificity.

**Consequences:** All tool adapters reference `.writing-framework/` as the canonical source. Sync operations target `.writing-framework/`. Paths in CLAUDE.md, ARCHITECTURE.md, and README.md all use `.writing-framework/` prefix.

---

## D-004 — Multi-Tool Wrapper Architecture
**Date:** 2026-03-28
**Status:** Active

**Decision:** Support Claude Code, OpenAI Codex, Windsurf, and GitHub Copilot via thin per-tool wrapper directories (`.claude/`, `.codex/`, `.windsurf/`, `.copilot/`). Each wrapper adapts `.writing-framework/` content to the tool's native format.

**Why:** Locking the framework to one AI tool defeats the portability goal. Each tool has a different convention for loading persistent instructions and invoking commands — Claude Code uses `.claude/commands/*.md`, Windsurf uses `.windsurfrules`, Copilot uses `.github/copilot-instructions.md`. The wrapper design lets each tool use its native mechanism while sharing the same canonical content.

**Design rule:** Wrappers are thin. They reference `.writing-framework/commands/[name].md` — they do not redefine the command. All substantive content lives in `.writing-framework/`.

**Alternatives considered:** One universal format that all tools read. Rejected: no such format exists and requiring a specific tool to adapt would reduce adoption.

**Consequences:** Changes to a command spec in `.writing-framework/commands/` propagate to all tools without changing the wrapper files. Wrappers only need updating when a tool's native format changes.

---

## D-005 — SQLite + FTS5 for Guide Server
**Date:** 2026-03-28
**Status:** Active

**Decision:** Guide server backend is SQLite with FTS5 full-text search. No vector database.

**Why:** SQLite is local, inspectable with standard tooling, requires no external service, and has no startup cost. FTS5 provides full-text search sufficient for v1 knowledge retrieval. Vector search adds complexity (embeddings, approximate search, external dependencies) that is not justified by a concrete v1 need.

**Doctrine reference:** Infrastructure Constraint #3: "Avoid premature vector database infrastructure."

**Alternatives considered:** PostgreSQL (too heavy for local use), ChromaDB/Pinecone (external dependency, vector search overkill for v1), filesystem grep (no indexing, no metadata).

**Consequences:** Guide retrieval is keyword-based in v1. If retrieval quality is insufficient in a later phase, vector search can be added to guide-server without changing the command interface — the `search_guides` operation signature stays the same.

---

## D-006 — JSON Schema for All Structured Outputs
**Date:** 2026-03-28
**Status:** Active

**Decision:** Every inter-agent handoff uses a defined JSON Schema (stored in `.writing-framework/schemas/`). Agents validate outputs before delivering. Schema conflict is a defined blocker type (B7).

**Why:** Without schema contracts, agents produce outputs in whatever format is convenient, and the next agent must guess the structure. This makes orchestration fragile. Schema contracts make handoffs inspectable, testable, and stable across phases.

**Schemas defined (Phase 1):** brief, outline, research_report, review_report, rewrite_plan, merge_report, blocker_report, artifact_manifest, sync_manifest, quality_gate.

**Alternatives considered:** Informal conventions documented in agent specs. Rejected: informal conventions drift and cannot be validated.

**Consequences:** Implementing an agent requires understanding its input and output schemas. Schema changes require a migration note. Schema validation is part of the quality gate in each phase.

---

## D-007 — Decompose by Function, Not by Chunk Size
**Date:** 2026-03-28
**Status:** Active

**Decision:** Work decomposition assigns bounded functional roles to agents, not arbitrary word-count chunks to parallel workers.

**Why:** Chunk-based decomposition produces voice inconsistency, requires complex merge logic, and produces outputs that are harder to quality-gate. Function-based decomposition (brief-writer, outline-architect, section-drafter, merge-normalizer) produces agents with clear scope, inspectable outputs, and composable pipelines.

**Key rule:** Parallel section drafting is allowed, but voice normalization via merge-normalizer is always required after it. The merge-normalizer normalizes to the project voice pack, not to generic neutral.

**Consequences:** A document production run involves more steps than a single-pass tool, but each step is auditable, resumable, and testable independently.

---

## D-008 — Seven QA Perspectives
**Date:** 2026-03-28
**Status:** Active

**Decision:** Quality assurance uses seven distinct evaluative perspectives: reader, skeptic, domain, style, coherence, ai-stink, and final (aggregator). Each perspective is a separate agent. The final agent issues ACCEPT / REVISE / BLOCK.

**Why:** Single-perspective QA misses systematic failure modes. A document can be clear to the reader but factually wrong (domain), stylistically correct but structurally incoherent (coherence), or convincing but full of AI-stink patterns. Separating perspectives prevents the common failure where a positive impression on one axis masks failures on another.

**AI-stink as a first-class perspective:** Including ai-stink detection as a required QA step — not an optional pass — reflects the doctrine that "final text must feel written, not generated." This is a hard quality requirement, not a preference.

**Consequences:** Running a full QA cycle is heavier than a single review pass. The orchestrate-review command parallelizes the first six perspectives and runs qa-final on aggregated results, making the overhead manageable.

---

## D-009 — Blocker Classification Taxonomy (B1-B9)
**Date:** 2026-03-28
**Status:** Active

**Decision:** Blockers are classified into nine types (B1-B9): missing user decision, missing repo context, missing guide, missing source material, failed toolchain, artifact export failure, schema conflict, canon conflict, validation failure.

**Why:** "Blocked" is not actionable. "B4 — missing source material, impacting section 3 only, sections 1-2 and 4-5 can proceed" is actionable. The taxonomy enables the blockage-handler agent to automatically determine the resolution path and continuation strategy for each blocker type.

**Consequences:** Every agent that encounters a blocker must produce a blocker_report.json using the B1-B9 classification. The blockage-handler consumes this report and orchestrates continuation.

---

## D-010 — Source-of-Truth Discipline
**Date:** 2026-03-28
**Status:** Active

**Decision:** The framework repo (this repo) is the canonical source of doctrine, commands, agents, style packs, workflows, and schemas. Other repos may extend locally but must not silently drift. Sync mechanisms are core features, not optional extras.

**Why:** Without source-of-truth discipline, the framework fragments. Each repo ends up with a different version of doctrine, incompatible schemas, or conflicting style pack definitions. The sync system (Phase 6) exists specifically to prevent and detect this drift.

**Key rule from doctrine:** "Import/export and sync mechanisms are core features, not optional extras." This was declared non-negotiable in the architecture spec.

**Consequences:** The sync/ directory, sync_manifest schema, and /sync-framework command are all first-class deliverables, not afterthoughts. Phase 6 is devoted to portability.

---

## D-011 — CLAUDE.md as Claude Code Adapter, Not Universal Manual
**Date:** 2026-03-28
**Status:** Active

**Decision:** CLAUDE.md (at repo root, loaded automatically by Claude Code) is the Claude Code-specific operating manual. It is not the universal manual for all tools. Codex, Windsurf, and Copilot have their own adapter files in their respective wrapper directories.

**Original design:** CLAUDE.md was written as the universal agent operating manual. Revised when multi-tool support was added.

**Why:** Each tool has different mechanisms for loading persistent instructions. Making CLAUDE.md the Claude-only file and having parallel files for other tools respects each tool's conventions and avoids a single file that tries to address all tools at once.

**Consequences:** CLAUDE.md references `.writing-framework/` as the canonical source. If a developer switches from Claude to Windsurf, they use `.windsurf/rules/.windsurfrules` instead. The `.writing-framework/` content is identical — only the loading mechanism differs.

---

## D-012 — Doctrine Files Are Non-Overridable
**Date:** 2026-03-28
**Status:** Active

**Decision:** Doctrine files in `.writing-framework/doctrine/` cannot be overridden by user instructions, style packs, or guide records. When doctrine conflicts with a user request, the conflict is surfaced (not silently resolved in favor of the user request).

**Why:** Doctrine defines the quality floor. Allowing user instructions to silently override doctrine means quality gates become optional, voice rules become suggestions, and the framework degrades into a prompt collection. The point of doctrine is that it cannot be talked out of.

**Gate 3 in HUMAN_IN_THE_LOOP_GATES.md** explicitly handles doctrine conflicts: surface the conflict, explain why it conflicts, ask if the user wants to override for this task. If yes, proceed and log. If no response, default to doctrine compliance.

**Consequences:** Users occasionally get pushback on requests that violate doctrine. This is a feature. The pushback is a quality signal, not a bug.

---

## D-013 — Artifacts/ and Logs/ Stay at Repo Root
**Date:** 2026-03-28
**Status:** Active

**Decision:** `artifacts/`, `logs/`, `evals/`, `mcp/`, `sync/`, and `scripts/` stay at the repo root and are NOT included in `.writing-framework/`.

**Why:** These directories contain repo-specific content (generated outputs, run logs, evaluation data) or repo-specific infrastructure (MCP server implementations, sync tooling). They are not part of the portable framework content. Exporting `.writing-framework/` to a new repo should not include artifacts from the source repo or its specific MCP configuration.

**Distinction:** `.writing-framework/` = what you want in every repo that uses this framework. Root directories = what is specific to this repo instance.

**Consequences:** `/install-framework` copies `.writing-framework/` and generates tool wrappers, but does not copy `mcp/`, `sync/`, `artifacts/`, or `logs/`. The target repo provisions its own infrastructure.

---

## D-014 — Design Decisions Journal (This File)
**Date:** 2026-03-28
**Status:** Active

**Decision:** Maintain a `DECISIONS.md` file at repo root recording all significant architectural decisions with rationale, alternatives considered, and consequences.

**Why:** Without a decisions journal, the reasoning behind architectural choices is lost. Future agents and developers see the outcome but not the reasoning, making it hard to evaluate whether a decision should be changed, what would break if it were, and what constraints drove it.

**Format:** Each entry has a unique ID (D-NNN), date, status (Active/Superseded), the decision itself, why, alternatives considered, and consequences. Superseded entries are not deleted — they are marked superseded with a reference to the superseding entry.

**Who writes here:** Any agent or human that makes a significant design decision should add an entry. "Significant" means: it affects the directory structure, a core schema, the operating model, a doctrine principle, or the portability design.

---

## D-015 — Adjacent Agent Boundaries as Required Spec Section
**Date:** 2026-03-28
**Status:** Active

**Decision:** Every agent spec must include an "Adjacent Agent Boundaries" section listing 3–5 explicit boundary cases — what adjacent agents handle that this agent does NOT.

**Why:** Agent overlap is the most common source of production errors in multi-agent systems. Without explicit boundary documentation, agents either duplicate work (both try to fix a problem) or leave gaps (both assume the other will handle it). Naming the boundary forces the spec author to think through the edge cases.

**Alternatives considered:** Relying on Forbidden Behaviors alone. Rejected — Forbidden Behaviors lists what the agent must not do, but does not tell it *who should do it instead*, which is the operationally useful information.

**Consequences:** All 27 agent specs now include this section. New agents added in future phases must include it. ROLE_CONTRACT_TEMPLATE.md enforces it as a required section.

---

## D-016 — Final Prose Ownership Rule
**Date:** 2026-03-28
**Status:** Active

**Decision:** Final prose ownership over assembled documents is held exclusively by merge-normalizer (during assembly) and lead-orchestrator (for output routing). All other agents produce bounded outputs only and must declare this explicitly in their specs.

**Why:** Without a clear ownership rule, multiple agents may modify assembled document text in conflicting ways, producing a document with incoherent voice or contradictory edits. Ownership clarity prevents simultaneous uncoordinated prose modification.

**Alternatives considered:** Shared ownership with conflict resolution. Rejected — conflict resolution adds coordination overhead and creates ambiguous accountability. A single owner per phase is simpler and more reliable.

**Consequences:** All 27 agent specs declare their prose ownership status. Editing agents (line-editor, voice-editor, clarity-editor, compression-editor) are scoped as pass-level producers — their output feeds back to the owning agent rather than directly modifying the assembled document.

---

## D-017 — Escalation Levels (1–4) with Continues-While-Pending
**Date:** 2026-03-28
**Status:** Active

**Decision:** All agent escalation triggers are defined with a level (1=self-resolve, 2=blockage-handler, 3=lead-orchestrator, 4=human gate) and a "continues while pending" field specifying what work proceeds while the escalation is resolved.

**Why:** Without explicit levels, agents either escalate everything to the user (too much interruption) or resolve everything locally (hides problems). Without continues-while-pending, agents treat every blocker as a full work stoppage, which violates the progressive unblocking principle.

**Alternatives considered:** Binary escalate/don't-escalate with no level structure. Rejected — the four-level chain allows blockage-handler and lead-orchestrator to handle most blockers autonomously, reserving human escalation for genuinely irresolvable decisions.

**Consequences:** ESCALATION_RULES.md defines all triggers per agent with levels. All 27 agent specs now include level + continues-while-pending in their escalation trigger tables.

---

## D-018 — .claude/agents/ as Thin Sub-Agent Wrappers
**Date:** 2026-03-28
**Status:** Active

**Decision:** `.claude/agents/*.md` files are thin wrappers, not full agent definitions. Each contains: a `description:` frontmatter field for routing, a one-paragraph bounded role statement, a scope ceiling, prose ownership status, a reference to the canonical spec, and key behavioral rules. Full agent logic lives in `.writing-framework/agents/`.

**Why:** Consistent with the adapter pattern established for `.claude/commands/`. Claude Code needs agent files to invoke sub-agents, but the canonical behavior must remain in the tool-agnostic `.writing-framework/` directory so that Codex, Windsurf, and Copilot can also use the same agent definitions.

**Consequences:** 27 `.claude/agents/` files created. The `description:` field is designed to be specific enough for Claude Code's tool picker to correctly route to the right agent. Full specs in `.writing-framework/agents/` are the source of truth.

---

---

## D-019 — Single guides Table Over Per-Type Tables
**Date:** 2026-03-28
**Status:** Active

**Decision:** The guide-server uses a single `guides` table with a `type` column rather than separate tables per guide type (doctrine_guides, rubric_guides, etc.).

**Why:** Eight guide types with the same base fields (id, title, type, domain, status, body, tags, applies_to, version, timestamps) share too much structure to warrant separate tables. A single table is simpler to query, index, and maintain. FTS5 covers all types uniformly. Type-specific fields are handled via a flexible `body` (markdown) and `applies_to` (JSON array) rather than rigid columns.

**Alternatives considered:** Per-type tables with type-specific columns. Rejected — adds JOIN complexity, schema migration burden, and partial FTS coverage without meaningful query performance benefit at the record corpus size this system operates on.

**Consequences:** All 11 MCP tools operate against the same table. The `type` CHECK constraint enforces valid types. Adding new guide types requires only a schema migration to add a new CHECK value.

---

## D-020 — FTS5 with Porter Stemming Over Vector Search
**Date:** 2026-03-28
**Status:** Active

**Decision:** Full-text search is implemented with SQLite FTS5 using Porter stemming tokenization, not vector/embedding search.

**Why:** The guide record corpus is small (55 seed records, expected growth to low hundreds). FTS5 provides fast keyword, phrase, and prefix search with BM25 relevance ranking — sufficient for agent query patterns. Vector search adds operational complexity (embedding model, index management, external service or large native library) with no meaningful retrieval quality advantage at this corpus size.

**Alternatives considered:** pgvector on PostgreSQL, in-process embedding with sqlite-vss. Both rejected — no separate database service to run, and corpus size does not justify the complexity.

**Consequences:** `find_guides` uses FTS5 with prefix matching on the last query token (enabling type-ahead patterns). Agents must use keyword-based queries rather than semantic/embedding queries. If the corpus grows significantly, a migration to hybrid FTS5+vector is the upgrade path.

---

## D-021 — Deferred Link Creation in Seed Loader
**Date:** 2026-03-28
**Status:** Active

**Decision:** Seed records with `_links` fields are processed in two passes: first all guide records are inserted, then all links are created from a deferred queue.

**Why:** Guide links reference two guide IDs — both must exist before the link can be inserted. Seed files within a type may reference guides in other type directories. A single-pass loader would fail whenever a link's target guide hadn't been loaded yet.

**Alternatives considered:** Topological sort of seed files, ordered loading. Rejected — adds complexity and is fragile when new seed files cross type boundaries. Two-pass deferred queue is simpler and always correct regardless of load order.

**Consequences:** `seed.js` collects `_links` arrays from all records into a `linkQueue`, then processes the queue after all guides are loaded. Link creation failures emit warnings but don't abort seeding. The `_links` field is stripped before inserting the guide record so it doesn't reach the schema.

---

## D-022 — guide_gap_check Required Types by Domain
**Date:** 2026-03-28
**Status:** Active

**Decision:** `guide_gap_check` defines required guide types per domain rather than requiring all eight types for every domain.

**Why:** Domain-specific domains (D&D, card game) require canon and style-pack guides; general domains require doctrine and rubrics. Requiring all types universally would produce false-positive gaps for domains that don't have use for every type. The gap check should surface meaningful absences, not trivial ones.

**Alternatives considered:** Require all 8 types universally. Rejected — would force creation of meaningless placeholder records for type/domain combinations that don't apply.

**Consequences:** `guideGapCheck()` in db.js defines a `REQUIRED_BY_DOMAIN` map. Domains not in the map fall back to the "general" required set (doctrine + style-pack + rubric). Gap reports include `gapCount`, `present`, and `missing` arrays. Per `COMMAND_INTEGRATION.md`, only missing `doctrine` or `style-pack` are hard blockers; other gaps are informational.

---

## D-023 — Hybrid Artifact Storage Strategy
**Date:** 2026-03-29
**Status:** Active

**Decision:** Store small artifacts (<10KB) inline in SQLite `content` field, large artifacts (≥10KB) as files in `artifacts/[run_id]/` with path in `stored_path` field.

**Why:** Artifacts range from small structured data (discovery reports, QA findings) to large documents (full drafts, merged outputs). Storing everything in SQLite bloats the database and slows queries. Storing everything as files adds filesystem overhead for tiny records. Hybrid approach optimizes both cases.

**Alternatives considered:**
- All inline: Rejected — database bloat for large documents
- All filesystem: Rejected — excessive file I/O for small structured data
- Configurable threshold: Considered but 10KB is a reasonable universal threshold

**Consequences:** `save_artifact` in cache-server checks `Buffer.byteLength(content)` and stores accordingly. `fetch_run_context` with `include_artifacts=true` reads filesystem paths when `stored_path` is set. Artifact cleanup requires both database and filesystem operations.

---

## D-024 — Blocking Blocker Auto-Pauses Run
**Date:** 2026-03-29
**Status:** Active

**Decision:** When `save_blocker` is called with `severity: 'blocking'`, the cache-server automatically updates the run status to `paused`.

**Why:** Blocking blockers halt execution by definition. Requiring the orchestrator to manually pause the run after saving a blocker creates a two-step operation that can be forgotten or inconsistently applied. Auto-pause ensures run state always reflects blocker severity.

**Alternatives considered:**
- Manual pause: Rejected — error-prone, inconsistent
- Pause on fetch: Rejected — run state should reflect reality immediately, not lazily

**Consequences:** Orchestrators calling `save_blocker` with `severity: 'blocking'` do not need to call `close_run` or update run status. Resume protocol must check for unresolved blocking blockers before allowing resume. `degraded` severity does not auto-pause.

---

## D-025 — Resume Points Store State Snapshots, Not Diffs
**Date:** 2026-03-29
**Status:** Active

**Decision:** Resume points store complete state snapshots in `state_snapshot` field, not diffs from prior state.

**Why:** Resume must be self-contained. If resume points stored diffs, resuming would require replaying all prior checkpoints to reconstruct state. Complete snapshots enable direct resume from any checkpoint without dependency on prior checkpoints.

**Alternatives considered:**
- Diff-based checkpoints: Rejected — complex reconstruction, fragile to checkpoint deletion
- Incremental state updates: Rejected — same reconstruction problem

**Consequences:** State snapshots may duplicate data across multiple resume points for the same run. This is acceptable — storage is cheap, resume reliability is critical. Orchestrators must include all necessary state in snapshots (current phase, section index, accumulated variables, etc.).

---

## D-026 — Separate MCP Servers for Guide and Cache
**Date:** 2026-03-29
**Status:** Active

**Decision:** Maintain guide-server and cache-server as separate MCP servers with separate databases, not a unified knowledge+cache server.

**Why:** Guide-server is curated, persistent knowledge (doctrine, style packs, canon). Cache-server is ephemeral working memory (runs, steps, blockers). They have different lifecycles, different query patterns, and different consumers. Guides are shared across runs; cache is run-scoped. Separation enables independent evolution and clear responsibility boundaries.

**Alternatives considered:**
- Unified server: Rejected — conflates persistent knowledge with ephemeral state
- Shared database, separate tables: Rejected — still couples lifecycle and backup strategies

**Consequences:** Two MCP server processes, two databases, two sets of tools. Commands must connect to both servers. Fallback to direct database access must handle both databases. Documentation must clearly distinguish guide operations from cache operations. See `COMMAND_INTEGRATION.md` in both servers for usage patterns.

---

## D-027 — B1-B9 Blocker Taxonomy
**Date:** 2026-03-29
**Status:** Active

**Decision:** Standardize all blocker classification using a 9-type taxonomy (B1-B9) with specific definitions, severity rules, and resolution patterns.

**Why:** Consistent blocker classification enables predictable handling, severity assignment, and resume planning. Without taxonomy, blockers are reported inconsistently ("something is wrong", "need more info") making them impossible to handle systematically. B1-B9 covers all blocker types encountered in editorial workflows.

**Alternatives considered:**
- Free-form blocker descriptions: Rejected — inconsistent, not machine-processable
- Severity-only classification: Rejected — doesn't capture blocker type, limits handling strategies
- Expanded taxonomy (B1-B15): Rejected — 9 types cover all cases, more creates confusion

**Consequences:** All agents must classify blockers using B1-B9. blockage-handler uses taxonomy for impact analysis and resume planning. cache-server stores blocker_type as enum. Documentation provides decision tree and examples for each type. See `doctrine/BLOCKER_CLASSIFICATION.md` for full taxonomy.

---

## D-028 — Type 1/2/3 Decision Classification
**Date:** 2026-03-29
**Status:** Active

**Decision:** Classify every agent decision as Type 1 (infer and proceed), Type 2 (infer and flag), or Type 3 (must ask) based on inferrability and impact.

**Why:** Minimizes unnecessary user interruption while preventing hallucination of user intent. Type 1 decisions proceed without asking (obvious from context). Type 2 decisions proceed with flag for review (reasonable default, user may prefer different). Type 3 decisions ask specific question (material impact, cannot infer). This balances autonomy with safety.

**Alternatives considered:**
- Always ask: Rejected — wastes user time on obvious decisions
- Always infer: Rejected — hallucination risk, produces wrong output
- Confidence-based (0-100%): Rejected — subjective, hard to apply consistently

**Consequences:** All agents document Type 1 assumptions, flag Type 2 decisions, and ask Type 3 questions. discovery-orchestrator uses classification for blocker severity. Autonomy decision matrix provided in `doctrine/AUTONOMY_INTEGRATION.md`. Type 3 should be rare — if >1 Type 3 per task, brief/discovery was insufficient.

---

## D-029 — Partial Completion Over Silence
**Date:** 2026-03-29
**Status:** Active

**Decision:** When full completion is not possible, produce partial output that is clearly labeled and useful. Silence is not an acceptable response to blockers.

**Why:** Partial output documents what was completed, what is missing, and how to resume. This is more valuable than no output. Enables incremental progress and reduces wasted work. User can see progress even when blocked. Resume plan enables continuation without re-reading context.

**Alternatives considered:**
- Halt and report blocker only: Rejected — wastes completed work, provides no value
- Produce stubs for blocked sections: Rejected — stubs are not useful, look incomplete
- Continue with guesses: Rejected — hallucination risk, wrong output

**Consequences:** blockage-handler executes all unblocked work before reporting blocker. Partial outputs labeled with PARTIAL OUTPUT header and RESUME section. Completed sections are production-quality. Blocked sections have descriptive placeholders. Resume commands are executable (not vague). See `doctrine/PARTIAL_COMPLETION.md` for protocol.

---

## D-030 — Discovery-Agent Read-Only Constraint
**Date:** 2026-03-29
**Status:** Active

**Decision:** discovery-agent is strictly read-only and single-pass. It reports findings without classification, escalation, or modification.

**Why:** Clear separation of concerns. discovery-agent scans and reports. discovery-orchestrator classifies and decides. This prevents discovery-agent from overreaching (making decisions beyond its scope) or modifying files during scan. Single-pass constraint ensures predictable execution time.

**Alternatives considered:**
- Allow discovery-agent to classify blockers: Rejected — conflates scanning with decision-making
- Allow discovery-agent to query guide-server: Rejected — orchestrator handles all external queries
- Allow multi-pass scanning: Rejected — unpredictable execution time, complexity

**Consequences:** discovery-agent cannot write files, query servers, classify blockers, or escalate. All findings reported to discovery-orchestrator for classification. discovery-agent documents gaps with expected location and reason. Orchestrator uses findings to classify B-type blockers and assign severity.

---

## D-031 — Seven QA Perspectives Model
**Date:** 2026-03-29
**Status:** Active

**Decision:** Review workflow uses 7 independent QA perspectives: qa-reader (reader clarity), qa-skeptic (weak claims), qa-domain (factual accuracy), qa-style (style pack compliance), qa-coherence (structural logic), qa-ai-stink (AI patterns), qa-final (gate decision). Each perspective operates independently in parallel, produces issue list with severity (block/revise/note), and saves qa-output artifact to cache-server.

**Why:** Multi-perspective QA provides comprehensive coverage without gaps or overlaps. Each perspective is specialized and independent. Parallel execution maximizes throughput. Standardized severity classification (block/revise/note) enables consistent gate decisions. qa-final aggregates all perspectives and produces gate decision (ACCEPT/REVISE/BLOCK).

**Alternatives considered:**
- Single QA agent: Rejected — cannot provide specialized depth across all quality dimensions
- Sequential QA: Rejected — slower than parallel, no benefit to ordering
- Subjective severity: Rejected — need objective criteria for gate decisions

**Consequences:** All 7 perspectives must run for complete QA. Each perspective saves independent qa-output artifact. lead-editor aggregates outputs into review_report.json. Gate decision based on blocking issue count and success criteria from brief. Pervasive issues (>30% content) escalate to specialized editors (voice-editor for AI-stink, canon-checker for canon conflicts).

---

## D-032 — Structure Before Style, Critique Before Rewrite
**Date:** 2026-03-29
**Status:** Active

**Decision:** Editorial pipeline enforces "structure before style" and "critique before rewrite" principles. outline-architect defines structure before section-drafter produces content. merge-normalizer documents voice issues before applying normalization. QA perspectives document all issues before suggesting fixes. lead-editor reviews all issues before making gate decision.

**Why:** Separation of concerns prevents premature optimization and ensures quality at each level. Structure decisions (what sections, what order) precede style decisions (how to write). Critique (what's wrong) precedes rewrite (how to fix). This prevents agents from fixing symptoms without addressing root causes.

**Alternatives considered:**
- Interleaved structure and style: Rejected — leads to rework when structure changes
- Fix-as-you-go: Rejected — agents fix symptoms without documenting root causes
- Silent normalization: Rejected — hides decisions, prevents review

**Consequences:** outline-architect cannot draft content. section-drafter cannot edit other sections. merge-normalizer documents voice issues in merge_report before normalizing. QA perspectives produce issue lists before fixes. All normalization and fixes are documented, not silent. Gate reviewers see full context of what changed and why.

---

## D-033 — Separate Drafting from Editing
**Date:** 2026-03-29
**Status:** Active

**Decision:** Drafting and editing are separate responsibilities. section-drafter produces content for single section only, does NOT edit other sections. merge-normalizer assembles and normalizes voice, does NOT create new content. QA perspectives critique, do NOT rewrite. voice-editor handles severe voice issues (escalation only), does NOT participate in normal drafting.

**Why:** Clear role boundaries prevent agents from overreaching. section-drafter focuses on completeness and accuracy for assigned section. merge-normalizer focuses on voice consistency across sections. QA perspectives focus on identifying issues. Editing agents (voice-editor, line-editor) handle fixes. This separation enables parallel execution (multiple section-drafters, multiple QA perspectives) and clear accountability.

**Alternatives considered:**
- section-drafter edits all sections: Rejected — cannot parallelize, scope too large
- merge-normalizer creates content for gaps: Rejected — conflates assembly with drafting
- QA perspectives fix issues directly: Rejected — conflates critique with rewrite

**Consequences:** section-drafter scope limited to single section. merge-normalizer forbidden from creating new content (uses placeholders for blocked sections). QA perspectives produce issue lists with suggested fixes but do not apply fixes. Severe voice issues (>30% content) escalate to voice-editor. Parallel execution enabled for section drafting and QA perspectives.

---

## D-034 — Evaluation Rubrics for Objective Gate Decisions
**Date:** 2026-03-29
**Status:** Active

**Decision:** Each workflow gate (Brief Gate, Outline Gate, Draft Gate, QA Gate) has evaluation rubric with specific, measurable pass/fail criteria. Rubrics define required elements (binary checks), quality checks (specific criteria), and common failures (examples of what fails). Each QA perspective has rubric defining checks, severity assignment rules, and issue format with examples.

**Why:** Objective criteria enable consistent gate decisions across runs and agents. Binary checks (present/absent) prevent subjective interpretation. Specific examples (good issue vs bad issue) guide agents in producing actionable output. Rubrics translate abstract quality goals ("high quality", "clear") into concrete checkable statements ("every section has purpose", "no assumed knowledge beyond audience level").

**Alternatives considered:**
- Subjective gate criteria: Rejected — inconsistent decisions, agent confusion
- Vague quality standards: Rejected — "high quality" is not actionable
- No examples: Rejected — agents don't know what good looks like

**Consequences:** doctrine/EVALUATION_RUBRICS.md defines rubrics for all gates and QA perspectives. Each rubric includes required elements table, quality checks, common failures with examples. Gate reviewers apply rubrics objectively. QA perspectives use rubrics to assign severity consistently. Success criteria from brief.json must be checkable (pass/fail, not subjective). Vague criteria ("engaging", "high quality") fail Brief Gate.

---

## D-035 — Artifact-Server MCP for Format Operations
**Date:** 2026-03-29
**Status:** Active

**Decision:** All artifact I/O (create, update, export, validate, normalize) handled by artifact-server MCP. Agents do not write files directly. artifact-server abstracts filesystem and document toolchain behind consistent operation set. Metadata tracked in SQLite database (artifacts, versions, relationships, validation results, export operations). Binary content stored on filesystem, not in database.

**Why:** Centralized artifact management enables: (1) consistent path normalization and directory creation, (2) version history tracking, (3) validation and export operation logging, (4) dependency checking before operations, (5) relationship tracking between source and derived artifacts. Separating metadata (database) from content (filesystem) keeps database small and enables efficient queries.

**Alternatives considered:**
- Direct filesystem writes by agents: Rejected — no version tracking, no validation logging, inconsistent paths
- Store binary content in database: Rejected — database bloat, poor performance for large files
- Separate servers for each format: Rejected — unnecessary complexity, shared operations (validate, inspect)

**Consequences:** artifact-server is required dependency for artifact operations. Agents call artifact-server tools (create_markdown, export_markdown_to_docx, etc.) instead of writing files. artifact-server checks dependencies (pandoc, latex) at runtime and fails gracefully with clear errors. All artifact operations produce metadata records in SQLite. Version history retained in database. Export operations tracked with success/failure status.

---

## D-036 — Deterministic Artifact Paths and Normalization
**Date:** 2026-03-29
**Status:** Active

**Decision:** Artifact paths follow deterministic structure: `artifacts/[run_id]/[category]/[filename].[ext]`. Categories: drafts, revisions, exports. Paths normalized (relative resolved to artifacts/, absolute used as-is). Directories created automatically. No magical hidden behavior — path generation is explicit and predictable.

**Why:** Deterministic paths enable: (1) predictable artifact location for debugging, (2) run isolation (all artifacts for run_id in same directory), (3) category separation (drafts vs exports), (4) no path conflicts between runs. Explicit normalization prevents path confusion (relative vs absolute). Auto-directory creation reduces boilerplate.

**Alternatives considered:**
- Flat artifact directory: Rejected — run artifacts mixed together, hard to find
- Hash-based paths: Rejected — not human-readable, hard to debug
- User-specified paths only: Rejected — inconsistent structure, potential conflicts

**Consequences:** All artifact operations normalize paths via normalizeArtifactPath(). Relative paths resolved to artifacts/ directory. Absolute paths used as-is. Directories created if missing (mkdirSync recursive). Path structure documented in ARTIFACT_MODEL.md. Agents can rely on predictable artifact locations for run_id.

---

## D-037 — Validate After Generation, Not Before Export
**Date:** 2026-03-29
**Status:** Active

**Decision:** Artifacts validated immediately after generation (Step 4 in artifacts workflow), not deferred until export. Validation results stored in database. validation_status field updated (valid/invalid/not-validated). Export operations can check validation_status before proceeding. Re-validation can run at any time via validate_artifact tool.

**Why:** Early validation catches issues before export attempts. Validation results cached in database prevent redundant checks. Stored validation findings enable audit trail and debugging. Separating validation from export allows validation to run independently (e.g., validate draft before review, re-validate after edits).

**Alternatives considered:**
- Validate only at export time: Rejected — late error detection, wasted export attempts
- Validate on every read: Rejected — redundant checks, performance impact
- No validation storage: Rejected — no audit trail, must re-validate every time

**Consequences:** artifacts workflow Step 4 runs validate_artifact immediately after generation. Validation findings stored in validation_results table. Artifact validation_status updated. Export operations can skip validation if status='valid'. Validation can re-run at any time (sets status back to valid/invalid). Format-specific validation checks documented in ARTIFACT_MODEL.md (markdown: YAML frontmatter, heading hierarchy, empty sections; docx/pdf: file integrity; latex: compilability).

---

## D-038 — Never Silently Overwrite Local Divergence
**Date:** 2026-03-29
**Status:** Active

**Decision:** No file overwritten without explicit user approval or clear conflict resolution mode. Every change documented in sync manifest. Conflict detection classifies items as: identical, new, local-newer, source-newer, conflict (diverged). Default conflict_resolution_mode='ask' presents all conflicts to user. 'prefer-source' mode logs warning for every overwrite. Conflict report generated for all unresolved conflicts.

**Why:** Silent overwrites destroy local customizations without user awareness. Explicit conflict resolution prevents accidental data loss. Documented changes enable audit trail and rollback. User approval ensures intentional decisions. Warning logs for overwrites provide accountability.

**Alternatives considered:**
- Auto-resolve all conflicts: Rejected — destroys local work, no user control
- Timestamp-based resolution: Rejected — newer not always better, customizations lost
- No conflict detection: Rejected — silent overwrites, no audit trail

**Consequences:** sync workflow Step 3 detects conflicts for every item. Step 4 applies conflict_resolution_mode (ask/prefer-local/prefer-source/merge). Step 5 generates pending_changes list for user approval if mode='ask'. Sync manifest records every change (applied, skipped, conflict). Conflict report includes both local and source versions. Type 3 decision: "Item status='conflict'" always asks user. No auto-resolution in 'ask' mode.

---

## D-039 — Selective Pack Support with Dependency Tracking
**Date:** 2026-03-29
**Status:** Active

**Decision:** Packs support selective import/export of individual items. User specifies subset of items to import/export. Dependencies of selected items automatically included (with warning). Export pack manifest indicates selective_import_supported=true. Import manifest records selected_items array. Dependency scanning identifies references to other framework items.

**Why:** Full pack import unnecessary when only specific items needed. Selective import reduces conflicts (fewer items to reconcile). Dependency tracking prevents broken references (auto-include required items). Selective export enables targeted sharing (e.g., single style pack without entire framework).

**Alternatives considered:**
- Full pack import only: Rejected — forces unnecessary conflicts, bloated imports
- Manual dependency resolution: Rejected — error-prone, broken references
- No dependency tracking: Rejected — imported items reference missing components

**Consequences:** export_pack.schema.json includes selective_import_supported boolean. import_pack.schema.json includes import_mode enum (full/selective/merge) and selected_items array. Sync workflow Step 2 scans selected items for dependencies. If dependency not present locally, auto-include in import (flag as auto-included). If dependency present but version differs, flag as potential conflict. Selective export only includes selected items, lists dependencies in manifest for reference.

---

## D-040 — Conflict Severity and Resolution Options
**Date:** 2026-03-29
**Status:** Active

**Decision:** Conflicts assigned severity: blocking (must resolve before proceeding), warning (should resolve), info (informational only). Conflict report includes resolution options for each conflict: prefer-local, prefer-source, merge, manual, skip. Blocking conflicts pause operation, present conflict_report to user. Warning conflicts allow operation to proceed, flagged in manifest. Info conflicts logged only.

**Why:** Not all conflicts equally critical. Blocking conflicts (dependency-conflict, schema-incompatible) prevent successful import. Warning conflicts (version-mismatch minor, local-override-exists) should be reviewed but don't prevent operation. Info conflicts (local-newer with prefer-local) require no action. Severity enables appropriate handling. Resolution options guide user decisions.

**Alternatives considered:**
- All conflicts blocking: Rejected — overly restrictive, blocks safe operations
- No severity distinction: Rejected — user can't prioritize, unclear what requires action
- Auto-resolve by severity: Rejected — still risks silent overwrites

**Consequences:** conflict_report.schema.json includes severity enum (blocking/warning/info) and resolution_options array. Sync workflow Step 3 assigns severity when detecting conflicts. Blocking conflicts: dependency-conflict (source requires unavailable dependency), schema-incompatible (no transformation available). Warning conflicts: version-mismatch (minor version), local-override-exists (local has override marker). Info conflicts: local-newer with prefer-local mode. Step 4 pauses if blocking conflicts remain unresolved. conflict_report presented to user with resolution options and recommended choice.

---

## D-041 — Hook-Based Enforcement for Risky Operations
**Date:** 2026-03-29
**Status:** Active

**Decision:** Hooks enforce preconditions and gates at specific workflow integration points. Pre-operation hooks (pre-workflow-start, pre-phase-advance, pre-artifact-finalize) block operations if checks fail. Validation hooks run during operations. Post-operation hooks log results. Error hooks (on-failure) handle failures, create resume points, preserve partial work. Hooks cannot be bypassed.

**Why:** Risky operations (artifact finalization, file overwrite, phase advancement without gate pass) can cause data loss or silent corruption. Hooks prevent these by enforcing checks before operations proceed. Hook-based enforcement is declarative (checks defined separately from operation logic), consistent (same checks for all operations), and auditable (all hook executions logged).

**Alternatives considered:**
- Inline checks in operation code: Rejected — scattered logic, inconsistent enforcement, hard to audit
- Manual checks by agents: Rejected — error-prone, agents may skip checks
- No enforcement: Rejected — unsafe operations proceed, silent failures

**Consequences:** 4 hook types implemented: precondition (pre-workflow-start, pre-phase-advance, pre-artifact-finalize), validation (on-gate-check), completion (post-operation-complete), error (on-failure). Hooks run automatically at integration points. Failed hooks block operations, return error with remediation. Hook executions logged to cache-server. Hooks enforce 9 precondition checks, 6 quality gates, 4 failure responses.

---

## D-042 — Fail Visibly, Resume Cleanly
**Date:** 2026-03-29
**Status:** Active

**Decision:** All failures must be immediately visible with clear error messages. Every failure state must be resumable without data loss. Resume points created before risky operations. Partial work preserved (not discarded). Failure messages include: what failed, why, what to fix, how to resume. No silent failures.

**Why:** Silent failures are debugging nightmares (no indication what went wrong). Non-resumable failures waste work (must restart from beginning). Unclear error messages frustrate users (don't know how to fix). Visible failures with resume capability enable rapid iteration (fix issue, resume from checkpoint).

**Alternatives considered:**
- Silent failures with logs: Rejected — user unaware of failure until later
- Non-resumable failures: Rejected — wastes completed work
- Generic error messages: Rejected — user doesn't know how to fix

**Consequences:** on-failure hook creates resume points with: operation_id, completed_steps, next_steps, inputs, partial_outputs, error_message, remediation_steps, resume_command. Resume points saved to cache-server. Partial work preserved in artifacts table. Failure reports include specific error, location, cause, remediation. Resume commands: /resume-run, /resume-step, /resume-operation. All failures logged with blocker classification (B1-B9).

---

## D-043 — Quality Gates Enforced by Hooks, Not Agent Discipline
**Date:** 2026-03-29
**Status:** Active

**Decision:** Quality gates enforced by pre-phase-advance hook, not by agent discipline. Hook runs before every phase transition, validates gate criteria, blocks transition if gate fails. Agents cannot bypass gates. Gate failures return specific failed criteria and remediation steps. 6 gates enforced: Discovery Gate (before Brief), Brief Gate (before Outline), Outline Gate (before Draft), Draft Gate (before Review), QA Gate (before Artifact), Artifact Gate (before Finalize).

**Why:** Agent discipline unreliable (agents may forget to check gates, skip checks under time pressure). Hook enforcement is automatic (runs every time), consistent (same checks for all agents), auditable (all gate checks logged). Gate failures caught early (before incomplete work propagates to next phase).

**Alternatives considered:**
- Agent discipline only: Rejected — unreliable, agents may skip checks
- Manual gate checks: Rejected — error-prone, inconsistent
- Gates optional: Rejected — incomplete work advances, quality suffers

**Consequences:** pre-phase-advance hook enforces all 6 quality gates. Hook validates gate-specific criteria (e.g., Brief Gate checks audience specificity, scope boundaries, testable success criteria). Gate failures block phase advance, return gate failure report with failed criteria. Gate checks logged to cache-server. Agents cannot bypass gates (hook runs automatically before transition). Gate pass required for phase advancement.

---

## D-044 — Evaluation Framework with Realistic Cases
**Date:** 2026-03-29
**Status:** Active

**Decision:** Evaluation framework uses realistic cases (not toy examples) to compare orchestrated approach against simpler baselines. Cases include injected blockers and quality issues to test detection and handling. Evaluation dimensions: artifact quality, process reliability, portability, QA utility. Each dimension scored 0-40 points with clear rubrics.

**Why:** Toy examples or artificially simple cases don't validate real-world utility. Realistic cases with realistic blockers and quality issues test whether framework adds value in practice. Clear scoring rubrics enable objective comparison. Multiple dimensions capture different aspects of framework value (not just artifact quality).

**Alternatives considered:**
- Toy examples: Rejected — don't validate real-world utility
- Single dimension (artifact quality only): Rejected — misses process, portability, QA value
- Subjective evaluation: Rejected — not reproducible, biased

**Consequences:** 2 evaluation cases implemented: case-01-technical-docs (API reference guide with 3 blockers, 6 quality issues), case-02-portability (export/import with 4 conflict scenarios). 4 scoring rubrics implemented with 0-10 scales per dimension, clear criteria, measurement methods. Cases test realistic scenarios (software documentation, framework portability). Injected issues are realistic (missing source, ambiguity, validation errors, assumed knowledge, unsupported claims).

---

## D-045 — Fair Baseline Comparison Methodology
**Date:** 2026-03-29
**Status:** Active

**Decision:** Baseline comparisons must be fair: same inputs, same LLM, same evaluation, no cherry-picking, realistic cases, transparency, honesty. Three baselines: Single-Prompt (naive LLM usage), Simple Chain (brief→outline→draft, no gates/QA), Orchestrated (full framework). All baselines evaluated with same rubrics. Comparison reports show all outputs, scores, issues detected/missed.

**Why:** Unfair comparisons (different inputs, cherry-picked results, biased evaluation) don't validate framework value. Fair comparison requires identical conditions except for approach. Transparency (show all outputs/scores) enables verification. Honesty (report failures, surprises, limitations) builds trust.

**Alternatives considered:**
- Different inputs per baseline: Rejected — not comparable
- Cherry-pick best results: Rejected — dishonest, not reproducible
- Hide outputs/scores: Rejected — not verifiable
- Only report successes: Rejected — dishonest

**Consequences:** BASELINE_COMPARISON.md documents 7 fairness criteria: same inputs (all baselines get identical requirements, source materials, injected blockers/issues), same LLM (same model, temperature, max tokens), same evaluation (same rubrics, evaluator, interpretation), no cherry-picking (run once, no retries), realistic cases (real-world tasks, not toy examples), transparency (show all outputs, scores, issues), honesty (report failures, surprises, limitations). Comparison reports must include all baseline results, comparative analysis, conclusions.

---

## D-046 — Measurable Rubrics, Not Subjective Evaluation
**Date:** 2026-03-29
**Status:** Active

**Decision:** Scoring rubrics use measurable criteria (percentages, counts, binary checks), not subjective judgments. Artifact quality: count requirements met, errors, constraint violations. Process reliability: calculate detection rates, resolution rates. Portability: verify hash matches, count conflicts detected. QA utility: count issues detected, false positives, actionable findings. Each dimension scored 0-10 with clear thresholds.

**Why:** Subjective evaluation ("high quality", "engaging") is not reproducible or verifiable. Measurable criteria enable objective scoring. Percentages and counts are concrete. Binary checks (requirement met: yes/no) are unambiguous. Clear thresholds (95-100% = 10 points, 85-94% = 8 points) enable consistent scoring.

**Alternatives considered:**
- Subjective evaluation: Rejected — not reproducible, biased
- Single overall score: Rejected — doesn't show what's good/bad
- No clear thresholds: Rejected — inconsistent scoring

**Consequences:** 4 rubrics implemented with measurable criteria. Artifact quality: count completeness (requirements met), correctness (errors), clarity (vocabulary, structure checks), constraint adherence (word count, format). Process reliability: calculate blocker detection rate (detected/total × 100%), resolution rate (auto-resolved/detected × 100%), gate effectiveness (caught at gate/total issues × 100%), resume success (successful resumes/failures × 100%). Portability: verify file integrity (hash match), count conflicts detected (detected/total × 100%). QA utility: count issues detected (detected/total × 100%), false positives (false positives/total flagged × 100%), severity accuracy (correct/total × 100%), actionability (actionable/total × 100%). Each dimension has 6-tier interpretation (0-11 to 36-40 points).
