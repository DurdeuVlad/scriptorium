# Scriptorium manual test procedures

Step-by-step manual QA for the React workspace (`frontend/src`). Each procedure has an **ID** (`MT-###`), observable **expected results**, and optional **Playwright** selectors for automation or agent verification.

## Prerequisites

1. API on port **8001**: `uvicorn app:app --host 127.0.0.1 --port 8001` (restart after backend changes).
2. Frontend on port **5173**: `cd frontend && npm run dev`.
3. Optional: LLM keys in `.env` for full pipeline (mock paths exist when LLM is offline).

See [00-prerequisites.md](00-prerequisites.md) for detail.

## How to run manual QA (canonical: Playwright MCP + agent)

**Use an AI agent in Cursor with the Playwright MCP server** — not headless npm scripts as the primary process.

1. Read [MCP_AGENT_WORKFLOW.md](MCP_AGENT_WORKFLOW.md).
2. Ensure API `:8000` and Vite `:5173` are running.
3. **Control procedures** (`01`–`13`) or [coverage-matrix.md](coverage-matrix.md): navigate → snapshot → interact → verify.
4. **Persona / harder tests** ([PERSONAS.md](PERSONAS.md), [14-persona-journeys.md](14-persona-journeys.md), [15-adversarial-stress.md](15-adversarial-stress.md)): **two-pass** — in-character discovery first, verifier second (see [MCP_AGENT_WORKFLOW.md](MCP_AGENT_WORKFLOW.md)).
5. Log results in `MCP_SESSION_<date>.md` and/or `MCP_PERSONA_SESSION_<date>.md`.

Agent browser checklist: [docs/UI_REVIEW.md](../../docs/UI_REVIEW.md).

## Optional regression scripts (not a substitute for MCP manual QA)

```bash
cd frontend && npm run ui-smoke && npm run ui-consult-qa
```

These only exercise a subset of procedures; agents should still walk the matrix via MCP.

Baseline screenshots (after layout fix): `docs/screenshots/manual/` — welcome, consult-expanded, negotiation, review_halt, finished.

## Procedure index

| File | Area |
|------|------|
| [00-prerequisites.md](00-prerequisites.md) | Environment and limitations |
| [coverage-matrix.md](coverage-matrix.md) | Every control → procedure ID |
| [01-app-shell-header.md](01-app-shell-header.md) | Welcome, header, layout, stepper |
| [02-projects.md](02-projects.md) | Project switcher, delete, load |
| [03-new-project-modal.md](03-new-project-modal.md) | New project modal |
| [04-document-navigation.md](04-document-navigation.md) | Sidebar nav, center views |
| [05-plan-editor.md](05-plan-editor.md) | Brief, outline, save |
| [06-assistant-consult.md](06-assistant-consult.md) | Editorial desk, chat |
| [07-pipeline-negotiation-approve.md](07-pipeline-negotiation-approve.md) | Draft outline, approve |
| [08-pipeline-draft-review.md](08-pipeline-draft-review.md) | Drafting, review, halt |
| [09-export-finish.md](09-export-finish.md) | Done phase, export |
| [10-persistence-refresh.md](10-persistence-refresh.md) | Reload, localStorage, WS sync |
| [11-edge-cases-errors.md](11-edge-cases-errors.md) | Failures, reconnect |
| [12-mobile-responsive.md](12-mobile-responsive.md) | Viewport ≤900px |
| [13-phase-state-matrix.md](13-phase-state-matrix.md) | Phase × control matrix |
| [PERSONAS.md](PERSONAS.md) | Target-user personas (P1–P7) |
| [14-persona-journeys.md](14-persona-journeys.md) | UX-101–107 discovery-first journeys |
| [15-adversarial-stress.md](15-adversarial-stress.md) | UX-2xx misuse + HARD-3xx stress |

## Coverage definition

**In scope:** Every user-clickable control and phase-gated visibility rule in `frontend/src`.

**Documented N/A:**

- Browser **Back/Forward** — no client-side routes; URL does not change per project or nav item.
- WebSocket `start_run` — not sent from UI (legacy/internal).

## Procedure template

Each case uses:

- **ID** — `MT-###` (controls) or `UX-###` / `HARD-###` (persona / stress)
- **Preconditions**
- **Steps**
- **Expected result**
- **Playwright check** — selector or assertion
- **Failure signals**
