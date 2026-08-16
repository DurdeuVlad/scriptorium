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
| `API_AUTH_TOKEN` | Optional bearer token gating the whole API + WebSocket (unset by default — see Security below) |
| `RATE_LIMIT_PROJECT_CREATE_PER_HOUR` / `RATE_LIMIT_PIPELINE_RUNS_PER_HOUR` / `MAX_CONCURRENT_WS_CONNECTIONS` | Rate limits, on by default (set to `0` to disable a given one) |

See `.env.example` for defaults.

---

## Security

Local development runs with **no authentication** by default — anyone who
can reach the port can use the API. Set `API_AUTH_TOKEN` (generate one
with `python3 -c "import secrets; print(secrets.token_urlsafe(32))"`)
before running the `docker-compose` `prod` profile anywhere reachable
beyond your own machine; every HTTP and WebSocket request then needs
`Authorization: Bearer <token>` except `GET /health`. Project creation,
pipeline runs, and concurrent WebSocket connections are rate-limited
in-memory regardless of whether auth is configured — see the env vars
above to tune or disable. Both are new, minimal, self-hosted-single-
process protections, not a substitute for your own review before
exposing this beyond localhost.

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
