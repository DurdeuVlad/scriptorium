# Contributor guidelines

Short, actionable rules for humans. Agents read [AGENTS.md](../AGENTS.md); this doc is for you.

---

## 1. Pick your lane

### Lane A — Run the newsroom (app)

1. Clone, `pip install -r requirements.txt`, `cp .env.example .env`
2. `cd frontend && npm ci` → `npm run dev` + `uvicorn app:app --reload`
3. Commission a project → **Plan** shows brief + outline → approve → **Draft** has at least one chapter

Details: [APP.md](APP.md) · [README](../README.md#quick-start--app)

### Lane B — Adopt the framework

1. Use `.writing-framework/` + register MCP per [MCP_INSTALLATION.md](../MCP_INSTALLATION.md)
2. Run `/discovery`, then `/write-brief`
3. Outputs validate against `.writing-framework/schemas/`

Details: [FRAMEWORK.md](FRAMEWORK.md) · [QUICK_START.md](../QUICK_START.md)

---

## 2. Doctrine beats prompts

Do not “fix” quality by lengthening system prompts. Change:

- **Schemas** — what valid brief/outline/QA JSON looks like
- **Gates** — when a phase may advance
- **Commands** — what agents run and in what order

Start here: [OPERATIONAL_GUARDRAILS.md](../.writing-framework/doctrine/OPERATIONAL_GUARDRAILS.md)

---

## 3. One source of truth for commands

Edit **`.writing-framework/commands/`** first.

Folders `.claude/`, `.codex/`, `.windsurf/`, `.copilot/` are IDE adapters. If you only change an adapter, the next sync will overwrite you.

---

## 4. Prove framework changes with evals

For pipeline, command, or agent changes:

- Run or document [case-01](../evals/cases/case-01-technical-docs.md)
- Note rubric scores from [evals/rubrics/](../evals/rubrics/) in the PR

If you skip evals, say why (e.g. docs-only).

---

## 5. UI changes: tokens → implement → verify

1. Tokens: [design/TOKENS.md](design/TOKENS.md)
2. Implement in `frontend/src/`
3. Smoke: `cd frontend && npm run ui-smoke && npm run ui-consult-qa`
4. Manual procedures: [tests/manual/README.md](../tests/manual/README.md) and [UI_REVIEW.md](UI_REVIEW.md)

---

## 6. Never commit

- `.env`, API keys, `.cursor/mcp.json` (local MCP config)
- `projects/`, `projects.db`, `mcp/*/data.db`
- `.playwright-mcp/` session YAML
- `.claude/settings.local.json` (or other `settings.local.json`)
- Personal flux/session build notes (see [CONTRIBUTING.md](../CONTRIBUTING.md))

---

## 7. Honest status claims

This repo is **alpha**. Do not mark README or issues as “production ready” until [PRODUCTION_READINESS_PLAN.md](../PRODUCTION_READINESS_PLAN.md) and case-01 baselines say so.

---

## Questions

- [FAQ.md](FAQ.md)
- [CONTRIBUTING.md](../CONTRIBUTING.md)
- Open a GitHub issue (app vs framework templates)
