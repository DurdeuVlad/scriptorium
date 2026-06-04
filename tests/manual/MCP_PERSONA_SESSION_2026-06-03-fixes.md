# MCP persona session — post-fix verification (2026-06-03)

Implementation per plan `persona_qa_fixes_248e67e5` (plan file not edited).

**Automated gate:** `cd frontend && npm run ui-consult-qa` (API :8000, Vite :5173). **Restart the API** after pulling these changes so export fallback and WS hydrate are active.

## Automated results (ui-consult-qa)

**Latest:** **27 PASS, 0 WARN, 0 FAIL** (`npm run ui-smoke` also PASS).

| Check | Result | Notes |
|-------|--------|-------|
| Phase reconcile + halt fixture | PASS | `reconcile_all_phases.py` + `ensure_review_halt_fixture.py` |
| Review halt ticket UI | PASS | `2b11af3b`, Answer in chat |
| Consult + bind + refresh | PASS | Server conversation persisted |
| MT-011 layout | PASS | Expanded / collapsed strip |
| Mobile 390px scroll | PASS | `scrollWidth <= clientWidth` |
| Export API | PASS | Fallback local `.md` under `projects/1636d453/exports/` |

## Scenario matrix

**Full MCP two-pass rerun:** [MCP_PERSONA_SESSION_2026-06-03-rerun.md](MCP_PERSONA_SESSION_2026-06-03-rerun.md) (strict PASS rows; UX-206 / HARD-301–302 skipped as noted).

| ID | Verdict | Evidence |
|----|---------|----------|
| UX-101–107 | PASS | MCP rerun + `ui-consult-qa` (halt fixture + reconciliation) |
| UX-201–207 | PASS / SKIP | MCP rerun; **UX-206 SKIP** (destructive) |
| HARD-301–305 | PASS / SKIP | MCP: 304–305 PASS; 301–302 SKIP (time/race) |

## Root fixes shipped

1. **Phase truth:** `reconcile_run_phase()` — `review_halt` only with open blockers; `publishing` → `finished`; GET `/projects/{id}` persists; `scripts/reconcile_all_phases.py` + halt QA seed.
2. **P0 WS:** `_resolve_ws_project_state`, `conversation_sync` + `editorial_memo_sync` with `project_id`; `publishing` → `finished`.
3. **P0 UI:** `usePipeline.js` bind pending, stale sync ignore, `chatBlocked`, memo handler; `loadProject` clears chat (no cross-project localStorage primary).
4. **P1:** Mobile header constraints; export fallback + MCP error detection; nav backdrop z-index.
5. **P2:** `STEPPER_HINTS`, `intake_choices_for_domain`, PlanEditor assistant copy.
6. **P4:** Consult send debounce 300ms + disable while in-flight/bind; modal Escape.

## Manual MCP batch (when ready)

1. Restart API: `uvicorn app:app --host 127.0.0.1 --port 8000`
2. Batch A: UX-101–107
3. Batch B: UX-201–207
4. Batch C: HARD-301–305
5. Replace FAIL* rows above with strict PASS (no S0/S1) per [MCP_AGENT_WORKFLOW.md](MCP_AGENT_WORKFLOW.md)
