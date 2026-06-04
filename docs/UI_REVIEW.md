# UI review

Use this workflow after changing the Scriptorium frontend so you can verify the shell, plan editor, artifact navigation, and pipeline states in a real browser.

**Design tokens:** [design/TOKENS.md](design/TOKENS.md). Implement in `frontend/src/index.css` and components before large layout changes.

## Prerequisites

1. Backend on port **8001**: `uvicorn app:app --host 127.0.0.1 --port 8001` from repo root. Restart the API after WebSocket/consult changes.
2. Frontend on port **5173**: `cd frontend && npm run dev`, or Docker prod on port **8080**.
3. Playwright browsers (once): `cd frontend && npx playwright install chromium`

Optional: copy [.cursor/mcp.json.example](../.cursor/mcp.json.example) to `.cursor/mcp.json` if you use Playwright MCP in the IDE. Never commit real tokens or local MCP secrets.

## URLs

| Mode | URL |
|------|-----|
| Vite dev | http://localhost:5173 |
| Docker prod profile | http://localhost:8080 |

Dev uses `VITE_API_BASE=/api` and proxies `/api` and `/ws` to the API.

## Quick checklist (browser)

1. Open the app URL; header shows **Scriptorium**, project switcher, phase stepper when a project is active.
2. Welcome: `#welcome-empty` and **New project** when no project is selected.
3. **+ New project** → topic + domain → **Start consultation**.
4. Assistant expanded; consult messages; **Draft outline** during consult.
5. Center `#plan-editor`; outline sections after draft outline.
6. Sidebar `#artifact-nav`: Brief & Outline, chapters, **Preview**.
7. Chapter click loads draft editor; **Preview** shows merged text when present.
8. Refresh with active project: conversation and plan persist.
9. Negotiation: chat patches plan; **Approve outline** gates.
10. Review halt: tickets and **Answer in chat**; structured replies resolve blockers.
11. Finished: export actions in workspace and assistant.

## Manual test procedures (source of truth)

Full step-by-step coverage: **[tests/manual/README.md](../tests/manual/README.md)**.

- [coverage-matrix.md](../tests/manual/coverage-matrix.md) — control → procedure ID
- [13-phase-state-matrix.md](../tests/manual/13-phase-state-matrix.md) — phase × visibility

Persona and stress scenarios: [PERSONAS.md](../tests/manual/PERSONAS.md), [14-persona-journeys.md](../tests/manual/14-persona-journeys.md), [15-adversarial-stress.md](../tests/manual/15-adversarial-stress.md).

## Automated smoke (recommended)

```bash
cd frontend && npm install && npx playwright install chromium
npm run ui-smoke      # core selectors (subset of MT-*)
npm run ui-consult-qa # consult / negotiation / persistence
```

Set `SCRIPTORIUM_BASE_URL` (default `http://localhost:5173`) if not using the default port.

Reference screenshots (optional): `docs/screenshots/manual/`.

## When to run

- After edits to `frontend/src/App.jsx`, shell components, `PlanEditor.jsx`, or plan/artifact API routes.
- Before claiming outline editability, assistant collapse, or export behavior.
- After Docker/nginx proxy changes (use port 8080).
