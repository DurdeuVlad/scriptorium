# Scriptorium app

The runnable **newsroom workspace**: React UI, FastAPI API, LangGraph orchestration, and on-disk artifacts.

---

## Stack

- **UI:** React 19 + Vite (`frontend/`)
- **API:** FastAPI (`app.py`)
- **Orchestration:** LangGraph (`orchestrator.py`)
- **Storage:** `projects/<id>/artifacts/*.md` + SQLite `projects.db`

---

## Local development

```bash
pip install -r requirements.txt
cp .env.example .env

cd frontend && npm ci
```

```bash
python -m uvicorn app:app --reload --port 8000
cd frontend && npm run dev
```

- UI: http://localhost:5173 (proxies `/api` and `/ws` to port 8000)
- Health: http://localhost:8000/health

---

## Docker

Copy `.env.example` to `.env` and set an LLM API key.

**Dev (hot reload):**

```bash
docker compose --profile dev up --build
```

- UI: http://localhost:5173

**Prod (nginx + built UI):**

```bash
docker compose --profile prod up --build
```

- App: http://localhost:8080

Data persists in `./projects` and `./projects.db` (mounted into the API container).

---

## REST API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness |
| GET | `/projects` | List projects |
| POST | `/projects` | Create project |
| GET | `/projects/{id}` | Project + state snapshot |
| DELETE | `/projects/{id}` | Delete project |
| GET | `/projects/{id}/artifacts` | List chapter/export `.md` files |
| GET | `/projects/{id}/artifacts/{artifact_id}` | Read artifact body |
| PUT | `/projects/{id}/artifacts/{artifact_id}` | Save editor changes |
| POST | `/export` | Merge + export (docx/pdf via artifact-server when configured) |

---

## WebSocket

Endpoint: `/ws`

Common message types:

- `start_run` — begin or resume pipeline for a project
- `approve_outline` — user approval after Plan review
- `chat_message` — assistant / consult turns

The server broadcasts artifact and state updates to connected clients.

---

## Environment variables

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini (recommended) |
| `GEMINI_PLANNER_MODEL` / `GEMINI_EXECUTOR_MODEL` | Planner vs executor tiers |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | Alternatives |
| `SEMANTIC_DB_PATH` / `COMPLIANCE_DB_PATH` | RDF stores (optional paths) |
| `ARTIFACTS_DIR` | Override artifacts root |
| `VITE_API_BASE` | Frontend API prefix (default `/api`) |
| `VITE_WS_URL` | WebSocket URL (optional) |

See `.env.example` for defaults.

---

## UI review

Checklist: [UI_REVIEW.md](UI_REVIEW.md). Procedure index: [../tests/manual/README.md](../tests/manual/README.md).

Optional IDE Playwright MCP: [.cursor/mcp.json.example](../.cursor/mcp.json.example). Never commit local MCP secrets.

```bash
cd frontend
npx playwright install chromium
npm run ui-smoke
npm run ui-consult-qa
# Docker prod: SCRIPTORIUM_BASE_URL=http://localhost:8080 npm run ui-smoke
```

Design tokens: [design/TOKENS.md](design/TOKENS.md) → `frontend/src/index.css`.
