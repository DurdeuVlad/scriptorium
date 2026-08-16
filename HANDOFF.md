# HANDOFF.md — Agent Continuity Document

**Purpose:** Enable a new agent, with no prior conversation context, to understand this repository, what has been built, how it was built, and how to continue.

**Last updated:** 2026-03-31
**Phases complete:** 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 — Phases 11 (Core Writing
Pipeline) and 12 (QA & Review System) are implemented, verification pending
(see `ROADMAP.md` and `PRODUCTION_READINESS_PLAN.md` for current status)
**Next phase:** none pending implementation — remaining work is verifying
Phases 11-12 end-to-end against `evals/cases/case-01-technical-docs.md` and
`case-02-portability.md`

**Quick help:** Run `/help` for framework overview and status, or read `QUICK_START.md`

---

## What This Repository Is

This is the **Editorial Orchestrator** — an agent-first editorial framework for orchestration-driven document production. It is not a prompt collection or a writing assistant. It is a production system.

The framework supports autonomous agents producing high-quality documents through a structured pipeline: discovery → brief → outline → draft → review → QA → artifact → export. Each phase produces validated structured outputs. Quality gates block phase advancement.

**Supported domains:** general writing, internal documentation, technical-adjacent explanations, D&D and worldbuilding, card game writing, structured creative design docs.

**Four tool adapters are maintained in parallel:**
- `.writing-framework/` — canonical, tool-agnostic specs (source of truth for everything)
- `.claude/` — Claude Code adapter (slash commands, sub-agent files, hooks)
- `.codex/` — OpenAI Codex adapter
- `.windsurf/` — Windsurf adapter
- `.copilot/` — GitHub Copilot adapter

**Rule:** All canonical content lives in `.writing-framework/`. Tool adapter directories are thin wrappers. Never put canonical logic in `.claude/` or other adapters.

---

## Repository Layout

```
scriptorium/
  README.md                        System overview
  ROADMAP.md                       Phase status tracker (update when phases complete)
  ARCHITECTURE.md                  Full layer/agent/command/schema specification (629 lines)
  CLAUDE.md                        Claude Code operating manual — loaded before every task
  DECISIONS.md                     Design decision journal — D-001 through D-022

  .writing-framework/
    doctrine/                      9 files — non-negotiable operating rules
    commands/                      COMMAND_REGISTRY.md — 67 commands catalogued
    agents/                        27 agent specs + HANDOFF_CONTRACTS.md, ESCALATION_RULES.md,
                                   ROLE_CONTRACT_TEMPLATE.md, OUTPUT_CONTRACT_TEMPLATE.md, AGENT_REGISTRY.md
    guides/                        Filesystem mirror of guide-server content (8 subdirs)
    styles/                        6 style pack definition files
    workflows/                     9 workflow definition files
    schemas/                       10 JSON Schema files
    hooks/                         Hook definitions (scaffolded, empty)
    examples/                      Worked examples (scaffolded, empty)
    templates/                     Document templates (scaffolded, empty)

  .claude/
    commands/                      67 slash command stub files
    agents/                        27 sub-agent adapter files (thin wrappers with description: frontmatter)
    hooks/                         Claude Code hooks (scaffolded, empty)

  .codex/                          OpenAI Codex adapter
  .windsurf/                       Windsurf adapter
  .copilot/                        GitHub Copilot adapter

  mcp/
    guide-server/                  COMPLETE — SQLite+FTS5 MCP server (Phase 3)
    cache-server/                  COMPLETE — SQLite run/step/artifact/blocker cache (Phase 4)
    artifact-server/               SCAFFOLDED — artifact generation/export (Phase 7)

  sync/                            Scaffolded: export-packs/, import-packs/, migration-rules/, sync-manifests/
  artifacts/                       Generated outputs (empty)
  logs/                            Run logs, blocker reports (empty)
  evals/                           Evaluation sets (empty)
  scripts/                         Utility scripts (empty)
```

---

## Phase Completion Status

| Phase | Title | Status | Key Output |
|-------|-------|--------|------------|
| 1 | Foundation and Doctrine | **COMPLETE** | Repo structure, 9 doctrine files, 10 schemas, 9 workflows, 6 style packs, 67 command stubs, 27 agent stubs |
| 2 | Agent and Command Contracts | **COMPLETE** | 67-command registry, 27 full agent specs, handoff contracts, 4-level escalation chain, 27 Claude sub-agent adapters |
| 3 | Guide Server and Guide Workflows | **COMPLETE** | guide-server MCP operational (SQLite+FTS5, 11 tools, 55 seed records), COMMAND_INTEGRATION.md |
| 4 | Cache Server and Run Memory | **COMPLETE** | cache-server MCP operational (SQLite, 11 tools, run/step/artifact/blocker tracking, resume points), RUN_MODEL.md, BLOCKER_MODEL.md, RESUME_PROTOCOL.md |
| 5 | Discovery, Blockage, Autonomy | **COMPLETE** | discovery.md, blockage.md workflows; discovery-agent, blockage-handler agents; BLOCKER_CLASSIFICATION, PARTIAL_COMPLETION, AUTONOMY_INTEGRATION doctrine; findings_report, discovery_report schemas |
| 6 | Editorial Workflows and QA System | **COMPLETE** | brief.md, outline.md, drafting.md, review.md, qa.md workflows (all upgraded to Phase 6 executable); merge-normalizer agent (upgraded to Phase 6); EVALUATION_RUBRICS doctrine |
| 7 | Artifact Infrastructure | **COMPLETE** | artifact-server MCP (11 operations); artifacts.md workflow (upgraded to Phase 7); ARTIFACT_MODEL, COMMAND_INTEGRATION docs |
| 8 | Sync, Import, Export, Portability | **COMPLETE** | sync.md workflow (upgraded to Phase 8); export_pack, import_pack, conflict_report schemas; PORTABILITY_MODEL, COMMAND_INTEGRATION docs | Phase 8 implements framework portability with conflict detection, selective packs, never-silent-overwrite guarantee |
| 9 | Hooks, Enforcement, Guardrails | **COMPLETE** | OPERATIONAL_GUARDRAILS doctrine; 4 hook specs (pre-workflow-start, pre-phase-advance, pre-artifact-finalize, on-failure); hooks README | Phase 9 implements hook-based enforcement, quality gate checks, failure handling, resumability |
| 10 | Evaluations and Comparative Testing | **COMPLETE** | 4 scoring rubrics, 2 evaluation cases, baseline comparison methodology | Phase 10 implements evaluation framework to validate orchestrated approach against simpler baselines |
| 11 | Core Writing Pipeline | PLANNED | Brief, outline, draft, merge commands and agents |

---

## Key Architectural Patterns

### 1. Adapter Pattern

Every command and agent has two representations:
- **Canonical spec** in `.writing-framework/commands/` or `.writing-framework/agents/` — tool-agnostic, full definition
- **Adapter file** in `.claude/commands/` or `.claude/agents/` — thin wrapper for Claude Code

Claude Code slash command format (`.claude/commands/command-name.md`):
```markdown
---
description: One-line description for Claude Code tool picker
---

[brief role/mission statement]

See canonical spec: `.writing-framework/commands/command-name.md`

[key behavioral rules only — no full re-spec]
```

Claude Code sub-agent format (`.claude/agents/agent-name.md`):
```markdown
---
description: Routing description for Claude Code agent picker
---

**Role:** [one sentence]
**Scope Ceiling:** [one hard limit sentence]
**Final Prose Ownership:** [owns/does not own]
**Canonical Spec:** `.writing-framework/agents/agent-name.md`

**Key behaviors:**
- [3-5 bullet points only]
```

### 2. Agent Spec Required Sections

Every agent spec in `.writing-framework/agents/` must have:
- Mission
- Allowed Inputs / Required Outputs
- Forbidden Behaviors
- Adjacent Agent Boundaries (3-5 explicit cases of what neighboring agents handle)
- Scope Ceiling (one hard-limit sentence)
- Final Prose Ownership declaration
- Escalation Triggers (table with: trigger, level 1-4, continues-while-pending)
- Handoff Format

Escalation levels: L1=self-resolve, L2=blockage-handler, L3=lead-orchestrator, L4=human gate.

### 3. Multi-Tool Adapter Pattern

When adding new commands or agents:
1. Write the canonical spec in `.writing-framework/`
2. Write the Claude Code adapter in `.claude/`
3. Update `.codex/`, `.windsurf/`, `.copilot/` adapters if they need the change

Never put canonical logic only in `.claude/`. The framework must be usable by all four tools.

### 4. Guide Server MCP Pattern

The guide-server (`mcp/guide-server/`) is a SQLite+FTS5 server exposing 11 MCP tools over stdio transport. It is the runtime knowledge index agents query instead of navigating the filesystem.

**To initialize:**
```bash
cd mcp/guide-server
npm install
npm run setup    # initialize schema
npm run seed     # load 55 seed records
npm start        # start MCP server on stdio
```

**Claude Code config** (`~/.claude/settings.json`):
```json
{
  "mcpServers": {
    "guide-server": {
      "command": "node",
      "args": ["mcp/guide-server/src/server.js"],
      "env": { "GUIDE_DB_PATH": "mcp/guide-server/guides.db" }
    }
  }
}
```

**11 MCP tools:** `add_guide`, `get_guide`, `update_guide`, `find_guides`, `list_guides`, `promote_guide`, `deprecate_guide`, `link_guides`, `get_links`, `guide_gap_check`, `get_stats`

**8 guide types:** `doctrine`, `style-pack`, `canon`, `template`, `rubric`, `example`, `anti-pattern`, `decision-record`

**7 link types:** `implements`, `extends`, `references`, `supersedes`, `exemplifies`, `contradicts`, `requires`

**Fallback:** If guide-server is unavailable, read filesystem at `.writing-framework/guides/[type]/[slug].md`

### 5. Seed Record Format

Seed files live in `mcp/guide-server/seeds/[type]/[slug].json`. Format:
```json
{
  "id": "G-TYPE-NNN",
  "type": "doctrine",
  "title": "Title Here",
  "domain": "general",
  "status": "active",
  "body": "Full markdown content here...",
  "tags": ["tag1", "tag2"],
  "applies_to": ["agent-name", "command-name"],
  "_links": [
    { "targetId": "G-OTHER-001", "linkType": "implements", "note": "optional" }
  ]
}
```
`_links` is stripped before DB insert; links are created in a second pass after all records load. Records with `status: "active"` are auto-promoted by the seed script.

### 6. Design Decision Journal

`DECISIONS.md` at repo root tracks all architectural choices. Current entries: D-001 through D-046. When making a significant architectural decision, add an entry:
```markdown
## D-NNN — Decision Title
**Date:** YYYY-MM-DD
**Status:** Active

**Decision:** [what was decided]
**Why:** [the reason]
**Alternatives considered:** [what was rejected and why]
**Consequences:** [what this means for the system]
```

### 7. Quality Gate Pattern

Before marking any phase complete:
1. Run a self-QA audit against the phase spec deliverables
2. Check for: missing files, ambiguous behavior, undefined schemas, doctrine contradictions, orchestration gaps
3. Update ROADMAP.md phase status
4. Add architectural decisions to DECISIONS.md

---

## 27 Agents (All Phase 2 Complete)

**Orchestration:** lead-orchestrator, lead-editor, intake-router, discovery-orchestrator, discovery-agent, blockage-handler, framework-sync-agent, principles-sync-agent, import-export-orchestrator, artifact-orchestrator

**Writing/Editing:** brief-writer, outline-architect, section-drafter, merge-normalizer, clarity-editor, line-editor, compression-editor, voice-editor, canon-checker, adversarial-reviewer

**QA:** qa-reader, qa-skeptic, qa-domain, qa-style, qa-coherence, qa-ai-stink, qa-final

**Final Prose Ownership rule:** Only `merge-normalizer` (during assembly) and `lead-orchestrator` (output routing) hold final prose ownership over assembled documents. All other agents produce bounded outputs only.

---

## 67 Commands (All Phase 2 Specced)

Groups: Foundation (6), Discovery (4), Research (5), Editorial (11), QA (7), Orchestration (7), Guides (7), Sync/Portability (10), Artifacts (10)

Full catalogue: `.writing-framework/commands/COMMAND_REGISTRY.md`

---

## What Phase 11 Will Build On

Phase 10 work will extend a stable base:
- guide-server is running and seeded — agents can query it for rubrics, style packs, canon, templates
- cache-server is running — agents can persist run state, steps, artifacts, blockers, and resume points
- Discovery workflow is executable — agents can scan context, classify blockers, produce discovery reports
- Blockage handling is operational — agents continue unblocked work, produce partial outputs, create resume plans
- B1-B9 blocker taxonomy standardized — all agents classify blockers consistently
- Type 1/2/3 decision classification defined — agents minimize interruption without hallucinating
- Partial completion protocol established — agents produce useful output even when blocked
- All 67 command specs exist — they need implementation logic added, not redesign
- All 27 agent specs exist — they need wiring to commands, not redesign
- HANDOFF_CONTRACTS.md defines the handoff format between agents
- ESCALATION_RULES.md defines how agents escalate blockers

When implementing Phase 11, check:
- `mcp/guide-server/COMMAND_INTEGRATION.md` for guide-server tool usage patterns
- `mcp/cache-server/COMMAND_INTEGRATION.md` for cache-server tool usage patterns
- `mcp/cache-server/RUN_MODEL.md` for run lifecycle management
- `mcp/cache-server/BLOCKER_MODEL.md` for blocker handling
- `mcp/cache-server/RESUME_PROTOCOL.md` for resume strategies
- `workflows/discovery.md` for discovery execution steps
- `workflows/blockage.md` for blockage handling protocol
- `doctrine/BLOCKER_CLASSIFICATION.md` for B1-B9 taxonomy
- `doctrine/PARTIAL_COMPLETION.md` for partial output standards
- `doctrine/AUTONOMY_INTEGRATION.md` for Type 1/2/3 decision rules

---

## Files to Read Before Starting Phase 11

In order of priority:
1. `ROADMAP.md` — Phase 11 objectives and deliverables
2. `DECISIONS.md` — All design decisions D-001 through D-046
3. `CLAUDE.md` — operating rules for all agents (always loaded first)
4. `ARCHITECTURE.md` — full system design reference
5. `.writing-framework/doctrine/EDITORIAL_DOCTRINE.md` — non-negotiable editorial rules
6. `.writing-framework/doctrine/AUTONOMOUS_EXECUTION.md` — how agents make decisions (Type 1/2/3)
7. `.writing-framework/doctrine/BLOCKER_CLASSIFICATION.md` — B1-B9 blocker taxonomy
8. `.writing-framework/doctrine/PARTIAL_COMPLETION.md` — partial output protocol
9. `.writing-framework/doctrine/AUTONOMY_INTEGRATION.md` — autonomy policy integration
10. `.writing-framework/doctrine/ESCALATION_RULES.md` — 4-level escalation chain
11. `.writing-framework/agents/HANDOFF_CONTRACTS.md` — agent-to-agent handoff format
12. `mcp/guide-server/COMMAND_INTEGRATION.md` — guide-server tool usage patterns
13. `mcp/cache-server/COMMAND_INTEGRATION.md` — cache-server tool usage patterns
14. `mcp/cache-server/RUN_MODEL.md` — run lifecycle and state management
15. `mcp/cache-server/BLOCKER_MODEL.md` — blocker tracking and resolution
16. `workflows/discovery.md` — discovery workflow execution
17. `workflows/blockage.md` — blockage handling workflow
18. `workflows/artifacts.md` — Phase 7 executable artifacts workflow (8 steps, artifact-server integration, Artifact Gate)
19. `workflows/sync.md` — Phase 8 executable sync workflow (10 steps, conflict detection, Sync Gate)
20. `agents/brief-writer.md` — Phase 2 agent spec
21. `agents/merge-normalizer.md` — Phase 6 executable agent spec (10 steps, voice normalization)
22. `mcp/artifact-server/COMMAND_INTEGRATION.md` — Artifact-server tool reference
23. `mcp/artifact-server/ARTIFACT_MODEL.md` — Artifact metadata model and lifecycle
24. `sync/PORTABILITY_MODEL.md` — Portability model, pack structure, conflict handling
25. `sync/COMMAND_INTEGRATION.md` — Sync command integration and best practices
26. `doctrine/OPERATIONAL_GUARDRAILS.md` — Enforcement rules, preconditions, failure handling
27. `.claude/hooks/README.md` — Hook system overview, integration, best practices
28. `.claude/hooks/pre-workflow-start.md` — Precondition checks before workflow start
29. `.claude/hooks/pre-phase-advance.md` — Gate checks before phase transitions
30. `.claude/hooks/pre-artifact-finalize.md` — Validation checks before finalization
31. `.claude/hooks/on-failure.md` — Error handling and resume point creation
32. `evals/README.md` — Evaluation framework overview
33. `evals/BASELINE_COMPARISON.md` — Baseline comparison methodology
34. `evals/rubrics/artifact-quality.md` — Artifact quality scoring rubric
35. `evals/rubrics/process-reliability.md` — Process reliability scoring rubric

---

## Conventions to Preserve

- **Directory names:** `.writing-framework/` not `core/` or `framework/`
- **File naming:** kebab-case for all files and directories
- **Guide IDs:** `G-TYPE-NNN` format (G-DOC-001, G-RUB-003, G-STYLE-002, etc.)
- **Agent IDs:** kebab-case matching filename (lead-orchestrator, qa-reader, etc.)
- **Command IDs:** slash-prefixed kebab-case (/write-brief, /qa-reader, /draft-section)
- **Decision IDs:** D-NNN, sequential from D-001
- **Status values in ROADMAP:** COMPLETE / IN PROGRESS / PLANNED
- **Phase labels in agent/command files:** `**Phase:** N`, `**Status:** active`
- **Schema filenames:** `[name].schema.json` in `.writing-framework/schemas/`
- **No vector search:** FTS5 only for guide-server
- **No external AI API dependencies in MCP servers**
- **Stderr for MCP server logging** (stdout is reserved for MCP protocol)
