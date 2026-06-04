# Scriptorium manual test procedures

Step-by-step manual QA for the React workspace (`frontend/src`). Each procedure has an **ID** (`MT-###`), observable **expected results**, and optional **Playwright** selectors for automation or scripted checks.

## Prerequisites

1. API on port **8001**: `uvicorn app:app --host 127.0.0.1 --port 8001` (restart after backend changes).
2. Frontend on port **5173**: `cd frontend && npm run dev`.
3. Optional: LLM keys in `.env` for full pipeline (mock paths exist when LLM is offline).

See [00-prerequisites.md](00-prerequisites.md) for detail.

## How to run manual QA

1. Start API and frontend (see above).
2. Run automated guardrails:

```bash
cd frontend && npm run ui-smoke && npm run ui-consult-qa
```

3. Walk procedures from [coverage-matrix.md](coverage-matrix.md) or the index below — use a browser at ≥901px width unless testing mobile ([12-mobile-responsive.md](12-mobile-responsive.md)).
4. For release-quality UX, run persona journeys ([PERSONAS.md](PERSONAS.md), [14-persona-journeys.md](14-persona-journeys.md)) and stress cases ([15-adversarial-stress.md](15-adversarial-stress.md)). Record PASS/FAIL per `MT-###` / `UX-###` in your PR or issue.

Checklist summary: [docs/UI_REVIEW.md](../../docs/UI_REVIEW.md).

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
- **Playwright check** — selector or assertion (used by `ui-smoke` / `ui-consult-qa` where applicable)
- **Failure signals**
