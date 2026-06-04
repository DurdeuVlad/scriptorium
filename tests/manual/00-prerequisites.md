# MT-000 — Prerequisites and test data

## Environment

| Service | URL | Start command |
|---------|-----|---------------|
| API | http://127.0.0.1:8001 | `uvicorn app:app --host 127.0.0.1 --port 8001` from repo root |
| Frontend (dev) | http://127.0.0.1:5173 | `cd frontend && npm run dev` |
| Health | GET `/health` | Returns `{"status":"ok"}` |

Vite proxies `/api` and `/ws` to the API when using dev mode.

## Browser

- **Desktop manual QA:** viewport width ≥ **901px** (2:5:3 grid applies).
- **Mobile manual QA:** width ≤ **900px** (drawer overlays) — see [12-mobile-responsive.md](12-mobile-responsive.md).

## LLM behavior

| Mode | Effect on tests |
|------|-----------------|
| LLM configured | Real brief/outline/draft; longer waits (outline up to 180s in `ui-consult-qa`) |
| LLM offline | Mock brief (2 sections) in `orchestrator.py`; faster but not “book-scale” |

## Seed projects (optional)

For phase-specific tests without running the full pipeline:

- Create projects via UI or `POST /projects` + WS `start_consult`.
- Keep a project in **review_halt** with open blocker tickets for MT-080.
- Keep a **finished** project with chapter `.md` files under `projects/{id}/artifacts/` for MT-090.

List projects: `GET /projects` or project switcher dropdown.

## Known limitations (do not file as app bugs)

1. No React Router — refresh restores state via REST + `bind_project`, not browser history.
2. **Export:** tries MCP `artifact-server` first (`scripts/start_penpot_mcp.ps1` is unrelated). If MCP is down, the API saves merged markdown under `projects/{id}/exports/` with `fallback: true` and a friendly message — sufficient for persona QA (UX-106). For production PDF/DOCX, start the artifact MCP server documented in [docs/PENPOT_MCP.md](../docs/PENPOT_MCP.md) or your local artifact-server setup.
3. `technical-docs` domain may inject commissioning blocker tickets (B1, B4) until resolved in chat.
4. Plan PATCH returns **409** when phase is not in `negotiation`, `planning`, `idle`, `intake`, `review_halt`.

## Playwright one-time setup

```bash
cd frontend && npx playwright install chromium
```
