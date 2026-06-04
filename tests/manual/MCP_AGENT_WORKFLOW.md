# Manual QA via Playwright MCP (agent-driven)

**Canonical process:** A Cursor agent (or human with MCP) executes procedures in `tests/manual/*.md` using the **Playwright MCP server** (`project-0-scriptorium-playwright` in `.cursor/mcp.json`). This is intentional, judgment-based testing — not the headless `npm run ui-smoke` scripts.

## Two-pass testing (required for UX / persona scenarios)

| Pass | What you read | What you do |
|------|----------------|-------------|
| **1 — In-character** | [PERSONAS.md](PERSONAS.md) + one scenario in [14-persona-journeys.md](14-persona-journeys.md) or [15-adversarial-stress.md](15-adversarial-stress.md) | Adopt persona; use **only** snapshot labels; log confusion in user voice; severity S0–S3 |
| **2 — Verifier** | Scenario **Verifier** section + `MT-###` procedures | Map UX failures to controls; optional `browser_evaluate` / selectors |

**Forbidden during pass 1:** `coverage-matrix.md` selector column, `frontend/src`, `phases.js`, prior `MCP_SESSION_*.md`, implementation plans.

**Allowed during pass 1:** `00-prerequisites.md` (ports only), persona briefing text in the scenario file.

## Prerequisites

1. API `http://127.0.0.1:8000` — `GET /health` → `{"status":"ok"}`
2. Frontend `http://127.0.0.1:5173` — `cd frontend && npm run dev`
3. Playwright MCP enabled in Cursor (reload MCP after config changes)

## Agent workflow (each procedure)

1. Read the procedure **ID** (`MT-###`) from the relevant `tests/manual/0N-*.md` file.
2. **`browser_navigate`** to `http://127.0.0.1:5173` (or reload if already there).
3. **`browser_snapshot`** — read accessibility tree; note element `ref`s for clicks.
4. Perform **steps** with **`browser_click`**, **`browser_type`**, **`browser_resize`** as needed.
5. Compare UI to **Expected result**; use **`browser_evaluate`** for layout metrics (grid columns, strip width).
6. **`browser_take_screenshot`** for regressions → `docs/screenshots/manual/`.
7. Record **PASS / FAIL / SKIP** with procedure ID in session notes (see `MCP_SESSION_*.md` template below).

## Recommended tool sequence

| Goal | MCP tools |
|------|-----------|
| Load app | `browser_navigate` |
| Find controls | `browser_snapshot` (refs like `e22`) |
| Interact | `browser_click`, `browser_type` |
| Desktop 2:5:3 / strip | `browser_resize` 1600×900, `browser_evaluate` on `.app-body` / `.assistant-strip` |
| Mobile | `browser_resize` 390×844, hamburger `Open document navigation` |
| Evidence | `browser_take_screenshot` |

## Layout checks (MT-010, MT-011)

After loading a project (assistant should auto-expand):

```javascript
// Expanded — expect ~3fr column filling viewport right edge
() => {
  const d = document.querySelector('.assistant-drawer.open')?.getBoundingClientRect();
  return { width: d?.width, right: d?.right, vw: innerWidth };
}

// Collapsed — expect stripWidth ≈ 48, gapAfterStrip ≈ 0
() => {
  const s = document.querySelector('.assistant-strip')?.getBoundingClientRect();
  return { width: s?.width, gap: innerWidth - (s?.right ?? 0) };
}
```

## Fixture projects (phase spot-checks)

Use **`browser_click`** on project switcher items labeled **Halted** or **Done**, or seed via API:

| Phase | Example in DB |
|-------|----------------|
| `review_halt` | `2b11af3b` — API reference guide |
| `publishing` / Done | `1636d453` — evolution of AI agents book |

## What is *not* the canonical path

- `npm run ui-smoke` / `npm run ui-consult-qa` — optional **regression helpers** only; they do not replace agent judgment or full matrix coverage.

## Session report templates

### Control walk (`MCP_SESSION_<date>.md`)

```markdown
# MCP manual QA session — YYYY-MM-DD
Tester: Agent / name
Environment: API :8000, Vite :5173

| ID | Result | Notes |
|----|--------|-------|
| MT-001 | PASS | #welcome-empty visible |
...
```

### Persona session (`MCP_PERSONA_SESSION_<date>.md`)

```markdown
# MCP persona QA — YYYY-MM-DD
Environment: API :8000, Vite :5173

## UX-101 — Maya (P1)
**Pass 1 — in-character**
- Goal 1: …
- Blockers: S0 none | S1 …
- Quotes (user voice): "I can't find…"

**Pass 2 — verifier**
| UX finding | MT / area |
|------------|-----------|
| … | MT-010 |

## UX-201 — …
...
```

## Recommended session mix

1. **Smoke:** MT-001–MT-005 from [01-app-shell-header.md](01-app-shell-header.md).  
2. **Persona block:** at least **two** from `14-persona-journeys.md` + **one** from `15-adversarial-stress.md`.  
3. **Hard:** one `HARD-3xx` if time allows.  
4. **Matrix gap-fill:** any uncovered rows in [coverage-matrix.md](coverage-matrix.md).
