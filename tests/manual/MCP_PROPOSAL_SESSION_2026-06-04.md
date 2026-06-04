# MCP manual QA session — intent-router proposals (2026-06-04)

**Tester:** Cursor agent (subagents + Playwright headless)  
**Scope:** MT-096–MT-101 (proposal cards), regression scripts updated for chat-first layout  
**Stack:** API `http://127.0.0.1:8001`, Vite `http://127.0.0.1:5173` (proxy to 8001)

## Port 8001 re-verification (2026-06-04, post-merge fix)

| Script | Exit | Summary |
|--------|------|---------|
| `npm run ui-proposal-qa` | **0** | **12 PASS, 0 FAIL, 0 WARN** (MT-096–MT-101 all green) |
| `npm run ui-consult-qa` | **0** | **28 PASS, 1 WARN, 0 FAIL** |
| `npm run ui-smoke` | **0** | PASS |

**Runtime logs (session `6ea8e4`):** After cancel/confirm, `conversation_sync` preserves proposal cards (`prevProposals` → `nextProposals` unchanged at lines 8–9, 14–15). Vite **must be restarted** after changing `VITE_PROXY_API_TARGET` in `.env.development`.

## Automated results (initial session)

| Script | Exit | Summary |
|--------|------|---------|
| `npm run ui-proposal-qa` | **0** | **10 PASS, 0 FAIL, 2 WARN, 0 SKIP** |
| `npm run ui-smoke` | **0** | PASS (chat-first selectors) |
| `npm run ui-consult-qa` | **0** | **28 PASS, 1 WARN, 0 FAIL** (proposal confirm on Draft outline) |

## MT-096–MT-101 (proposal flow)

| ID | Result | Notes |
|----|--------|-------|
| MT-096 | **PASS** | `set chapter count to 10` → `.action-proposal-card.pending` with diff + Confirm/Edit/Cancel |
| MT-097 | **PASS** | Confirm applied `target_chapter_count=10` via API |
| MT-098 | **PASS** | Cancel shows **Cancelled** on card |
| MT-099 | **PASS** | Confirmed card has no Confirm button (stale UI guard) |
| MT-100 | **WARN** | App-help reply received but `.chat-bubble.consult` selector missed (timing/class) |
| MT-101 | **PASS** / **WARN** | Draft outline chip → proposal card **PASS**; cancel-after-chip **WARN** (resolved class timeout) |

## Bugs found & fixed during QA

1. **`onClick={onSendChat}` passed click event as message** — Send button never sent chat text (React event treated as string). Fixed: `onClick={() => onSendChat()}` + guard `typeof text === "string"` in `App.jsx`.
2. **Playwright scripts used `.assistant-drawer`** — Updated `ui-smoke.mjs` / `ui-consult-qa.mjs` for `#main-agent-chat` chat-first layout.
3. **Draft outline QA** — `ui-consult-qa.mjs` now confirms proposal card before expecting outline sections.
4. **`parse_structure_from_text`** — Added `chapter count to N` pattern for MT-096 phrasing.
5. **`ui-proposal-qa.mjs`** — New script + `scripts/seed_proposal_qa_phase.py` for phase seeding on Windows.

## Recommendations

- Re-run `ui-consult-qa` after API restart; confirm outline step should pass with proposal confirm.
- MT-100: assert on assistant text content rather than `.chat-bubble.consult` only.
- Consider `data-testid` on proposal card for stable Playwright selectors.

## Verdict

**Proposal intent-router frontend: PASS on port 8001** — MT-096–MT-101 automated **12/12**; consult regression **28/28 pass** (1 warn on intake hint). Debug instrumentation active in `usePipeline.js` for manual pass.
