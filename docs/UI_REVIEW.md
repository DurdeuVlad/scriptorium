# UI review with Playwright MCP

Use this workflow after changing the Scriptorium frontend so agents (and humans) can verify the shell, plan editor, artifact navigation, and pipeline states in a real browser.

**Design-first:** For layout, tokens, and component structure, iterate in Penpot first — see [PENPOT_MCP.md](PENPOT_MCP.md) and [design/SCRIPTORIUM_PENPOT_BRIEF.md](design/SCRIPTORIUM_PENPOT_BRIEF.md). Token reference: [design/TOKENS.md](design/TOKENS.md). Run Playwright after Penpot sign-off and code implementation.

## Prerequisites

1. Backend running on port 8000 (`uvicorn app:app --reload` or Docker `api` service). After pulling consult-first changes, **restart the API** if WebSocket consult messages never appear (stale worker without `start_consult` is a common failure mode).
2. Frontend running on port 5173 (`cd frontend && npm run dev`) **or** prod profile on port 8080.
3. Playwright browsers installed once: `npx playwright install chromium`
4. Cursor MCP: [.cursor/mcp.json](../.cursor/mcp.json) enables the `playwright` server. Reload MCP after adding the file.

## URLs

| Mode | URL |
|------|-----|
| Vite dev | http://localhost:5173 |
| Docker prod profile | http://localhost:8080 |

Dev uses `VITE_API_BASE=/api` and proxies `/api` and `/ws` to the API container or local uvicorn.

## Agent checklist

1. `browser_navigate` to the app URL.
2. Confirm header shows **Scriptorium**, `#project-switcher`, and phase stepper when a project is active.
3. Welcome state shows `#welcome-empty` with **New project** when no project is selected.
4. Open project switcher → **+ New project** → minimal modal: topic + domain → **Start consultation** (`#new-project-modal`, `#btn-commission-project`).
5. Assistant opens expanded (`.assistant-drawer.open`); **Conversation** shows consultant messages; **Draft outline** (`#btn-draft-outline`) visible during consult.
6. Center shows `#plan-editor` with brief fields (intake consult hint); after **Draft outline**, outline sections appear for negotiation.
7. Sidebar `#artifact-nav`: **Brief & Outline**, chapter rows (`data-artifact`) when present, **Preview** under Output.
8. Click a chapter — draft editor loads with content.
9. **Preview** nav item shows merged text when chapters exist.
10. Refresh page with active project: conversation and plan persist (`bind_project` / `conversation_sync`).
11. Negotiation: chat can patch plan; `#btn-approve-outline` in center gate and assistant.
12. Review halt: open tickets show **Answer in chat**; structured replies resolve blockers (no keyword-only resume).
13. Finished phase: export actions available in workspace gate and assistant.

## Manual test procedures (source of truth)

Full step-by-step coverage lives in **[tests/manual/README.md](../tests/manual/README.md)**.

### Required: Playwright MCP (agent-driven QA)

**Do not rely on `npm run ui-smoke` as the manual test process.** Cursor agents should execute procedures using the **Playwright MCP server** (`project-0-scriptorium-playwright`):

1. Read [tests/manual/MCP_AGENT_WORKFLOW.md](../tests/manual/MCP_AGENT_WORKFLOW.md).
2. For each `MT-###`: `browser_navigate` → `browser_snapshot` → interact → judge against expected result.
3. Log PASS/FAIL in `tests/manual/MCP_SESSION_<date>.md`.

**Persona / harder QA (required for release-quality UX):**

1. Pick a persona from [tests/manual/PERSONAS.md](../tests/manual/PERSONAS.md) and a scenario from [14-persona-journeys.md](../tests/manual/14-persona-journeys.md) or [15-adversarial-stress.md](../tests/manual/15-adversarial-stress.md).
2. **Pass 1 — in-character:** no selectors, no `frontend/src`; discover UI from snapshots only; log S0–S3 in user voice.
3. **Pass 2 — verifier:** map findings to `MT-###`.
4. Log in `tests/manual/MCP_PERSONA_SESSION_<date>.md`.

Procedure IDs, traceability, and phase rules:

- [tests/manual/coverage-matrix.md](../tests/manual/coverage-matrix.md)
- [tests/manual/13-phase-state-matrix.md](../tests/manual/13-phase-state-matrix.md)

## Automated smoke (optional)

```bash
cd frontend && npm install && npx playwright install chromium
npm run ui-smoke      # MT-001, MT-020, MT-037, MT-041, MT-060, MT-063
npm run ui-consult-qa # MT-011, MT-010 layout + consult/negotiation/persistence
```

Set `SCRIPTORIUM_BASE_URL` (default `http://localhost:5173`) if not using the default port.

Layout screenshots (after `ui-consult-qa`): `docs/screenshots/manual/consult-expanded.png`, `assistant-collapsed.png`.

## When to run

- After edits to `frontend/src/App.jsx`, shell components, `PlanEditor.jsx`, or artifact/plan API routes.
- Before claiming “outline is editable” or “assistant collapses correctly”.
- After Docker/nginx proxy changes (use port 8080).
