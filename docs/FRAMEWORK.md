# Editorial orchestrator framework

Portable **agent-first document production**: discovery → brief → outline → draft → review → QA → artifact → export. This is not a prompt pack—it is orchestration with schemas, gates, and MCP infrastructure.

---

## Layers

| Layer | Location | Role |
|-------|----------|------|
| Commands | `.writing-framework/commands/` | User- and orchestrator-invoked workflows |
| Agents | `.writing-framework/agents/` | Specialized roles and handoffs |
| Doctrine | `.writing-framework/doctrine/` | Non-negotiable behavior |
| Schemas | `.writing-framework/schemas/` | JSON Schema for structured outputs |
| Workflows | `.writing-framework/workflows/` | Stage definitions |
| Styles | `.writing-framework/styles/` | Style packs per domain |
| MCP | `mcp/` | guide-server, cache-server, artifact-server |

Full architecture: [ARCHITECTURE.md](../ARCHITECTURE.md). Command index: [COMMAND_REGISTRY.md](../.writing-framework/commands/COMMAND_REGISTRY.md).

---

## MCP servers

| Server | Purpose |
|--------|---------|
| **guide-server** | Guides, canon, rubrics, FTS search |
| **cache-server** | Run memory, blockers, resume points |
| **artifact-server** | Markdown/docx/pdf/latex artifacts |

Installation and Cursor/Codex config: [MCP_INSTALLATION.md](../MCP_INSTALLATION.md).

---

## IDE adapters

| Folder | Tool |
|--------|------|
| `.claude/` | Claude Code / Cursor (Claude) |
| `.codex/` | OpenAI Codex |
| `.windsurf/` | Windsurf |
| `.copilot/` | GitHub Copilot |

**Canonical source:** `.writing-framework/`. Adapters mirror commands and agents for each tool. When changing behavior, edit `.writing-framework/` first, then update adapters or run your sync workflow.

Agent manual (Codex-oriented): [AGENTS.md](../AGENTS.md).

---

## Typical workflow

1. **`/discovery`** — Repo scan + structured discovery report
2. **`/write-brief`** or **`/orchestrate-brief`** — Brief JSON against schema
3. **`/write-outline`** — Outline JSON
4. **`/draft-section`** or **`/orchestrate-draft`** — Section drafts
5. **QA commands** — `/qa-reader`, `/qa-skeptic`, … → `/qa-final`
6. **Artifacts** — `/write-markdown`, `/export-docx`, etc. (via artifact-server)

Quality gates block advancement when blocking findings exist. See [OPERATIONAL_GUARDRAILS.md](../.writing-framework/doctrine/OPERATIONAL_GUARDRAILS.md).

---

## Install into another repo

- **`/install-framework`** — Bootstrap structure in a target repo
- **`/import-framework`** / **`/export-framework`** — Sync with another copy

See command specs in `.writing-framework/commands/` and [sync/](../sync/) for portability manifests.

---

## Evaluation

Prove framework changes against:

- [evals/cases/case-01-technical-docs.md](../evals/cases/case-01-technical-docs.md)
- Rubrics under [evals/rubrics/](../evals/rubrics/)

Baseline tracking: [evals/BASELINE_COMPARISON.md](../evals/BASELINE_COMPARISON.md).

---

## Relationship to the Scriptorium app

The **app** runs a LangGraph newsroom pipeline in `orchestrator.py` with a React shell. The **framework** can be used standalone inside any repo with an AI coding tool. Long-term, guide-server integration in live app prompts is on the [roadmap](../README.md#roadmap-high-level).
