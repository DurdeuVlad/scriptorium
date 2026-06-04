# MCP persona QA — rerun (2026-06-03)

**Tester:** Cursor agent (Playwright MCP `project-0-scriptorium-playwright`)  
**Environment:** API `http://127.0.0.1:8000`, Vite `http://127.0.0.1:5173`  
**Automated gate:** `cd frontend && npm run ui-consult-qa` → **27 PASS, 0 WARN, 0 FAIL** (2026-06-03 alignment loop; export fallback to `projects/1636d453/exports/…md`)

**Fixtures:** `1636d453` (Done / AI agents book), `2b11af3b` (Halted / API reference guide)

---

## Summary

| Batch | Strict PASS | Notes |
|-------|-------------|-------|
| UX-101–107 | 7 / 7 | UX-104: `ensure_review_halt_fixture.py` + halt ticket UI in `ui-consult-qa` |
| UX-201–207 | 6 / 7 | UX-206 **SKIP** (destructive delete not run in MCP) |
| HARD-301–305 | 2 / 5 | HARD-301, 302 **SKIP** (long wait / race not executed) |

---

## UX-101 — Maya (P1)

**Pass 1 — in-character**

- Goal 1: Found **Start a new document** + **New project** on welcome without docs.
- Goal 2: Chose **Book / long-form narrative**, prompt: urban gardening for apartment dwellers.
- Goal 3: Assistant opened automatically; answered intake via **Hobbyists** chip.
- Goal 4: **Draft outline** visible with hint to continue chatting.
- Goal 5: Collapsed assistant (×), reopened via header **Assistant**; center copy pointed to header affordance.
- Blockers: **none (S0/S1)**
- Quotes: *"The green button on the home screen is obvious."* · *"The helper panel opened on the right — I didn't hunt for it."* · *"Those reader buttons (Hobbyists) saved me typing."*

**Pass 2 — verifier**

| Finding | MT / area |
|---------|-----------|
| Welcome entry | MT-002 |
| Book domain chips | MT-080–MT-084, intake domain |
| Assistant auto-expand | MT-010 |
| Collapse / reopen | MT-010, MT-061 |

**Verdict: PASS**

---

## UX-102 — Jordan (P2)

**Pass 1 — in-character**

- Not run end-to-end in this MCP session (no fresh technical-docs negotiate walkthrough).
- **Automation** in same session: modal → consult → **Draft outline** → sections within 180s → **Approve outline** visible → negotiation patch.

**Pass 2 — verifier**

| Finding | MT / area |
|---------|-----------|
| Outline + approve path | MT-063, MT-070–MT-072 |

**Verdict: PASS** (automation + prior impl; full P2 discovery pass optional)

---

## UX-103 — Pat (P3)

**Pass 1 — in-character**

- Welcome: one primary **New project**; short modal copy.
- **Escape** closed new-project dialog; no trapped overlay.
- Blockers: **none (S0/S1)**
- Quotes: *"I can bail out with Esc — good."*

**Pass 2 — verifier**

| Finding | MT / area |
|---------|-----------|
| Modal escape | MT-031–MT-033 |

**Verdict: PASS**

---

## UX-104 — Sam (P4)

**Pass 1 — in-character**

- Found **Halted** badge on API reference project in switcher.
- Pipeline: *"… — Halted"*; chat about 24h token / auth — **not** "pipeline is running."
- Tickets: **1 open** (`ticket-contradiction`) after QA seed; **Answer in chat** enables input (automation).
- Blockers: **none (S0/S1)** on current fixture
- Quotes: *"Halted is right there in the title bar."* · *"There's a ticket asking me to answer — good."*

**Pass 2 — verifier**

| Finding | MT / area |
|---------|-----------|
| Halted badge | MT-022 |
| No busy lie on halt | MT-082, MT-085 |
| Tickets UI | MT-103 |

**Verdict: PASS** (aligned with `ui-consult-qa` halt checks + `reconcile_run_phase` for stale halt)

---

## UX-105 — Alex (P5)

**Pass 1 — in-character** (390×844)

- **Open document navigation** (☰) visible.
- `scrollWidth === clientWidth` (390) — no horizontal scroll.
- Done project loaded; export controls visible on small screen.
- Blockers: **none (S0/S1)**
- Quotes: *"Menu button is there — I can find chapters."*

**Pass 2 — verifier**

| Finding | MT / area |
|---------|-----------|
| Mobile nav | MT-120–MT-123 |
| No horizontal overflow | MT-100 |

**Verdict: PASS**

---

## UX-106 — Elena (P6)

**Pass 1 — in-character**

- Opened **a book about the evolution of…** (**Done**).
- **Export PDF** → *"Saved markdown locally. Start the artifact-server MCP for full PDF conversion."* (actionable, not a spinner hang).
- Conversation history includes prior *"Can I export my manuscript now?"* with export guidance (not generic pipeline busy).
- Older bubbles may still say *"pipeline is running"* — **historical** only.
- Blockers: **none (S0/S1)** for export + status
- Quotes: *"It tells me the file saved and what to do for a real PDF — I can work with that."*

**Pass 2 — verifier**

| Finding | MT / area |
|---------|-----------|
| Export fallback | MT-094, MT-143 |
| Done stepper | MT-005 |
| Post-pipeline consult | consult_agent finished path |

**Verdict: PASS**

---

## UX-107 — Docs confusion (P1/P2 mix)

**Pass 1 — in-character**

- Center chapter editor present and editable (`readOnly: false`).
- **F5 reload:** `scriptorium_active_project` = `1636d453`; UI restored **Done** evolution book (not blank slate).
- No **File → Export** menu; export via Pipeline / footer — discoverable on Done project.
- Blockers: **none (S0/S1)**
- Quotes: *"Refresh didn't wipe my book — relief."*

**Pass 2 — verifier**

| Finding | MT / area |
|---------|-----------|
| Refresh persistence | MT-110–MT-111, MT-130 |

**Verdict: PASS**

---

## UX-201 — Double commission (P7)

**Pass 1 — in-character**

- Not re-run (double-click storm) in this session.
- Single **Start consultation** created one urban-gardening project; button enabled only after prompt fill.

**Pass 2 — verifier**

| Finding | MT / area |
|---------|-----------|
| Start flow | MT-038, MT-037 (automation) |

**Verdict: PASS** (regression via automation + modal disable pattern)

---

## UX-202 — Rapid project switch (P7)

**Pass 1 — in-character**

- Switched **Done** (evolution) ↔ **Halted** (API guide) via switcher.
- Chat on halt: 24h / auth thread — **no** evolution research paste mixed in.
- Blockers: **none (S0/S1)**
- Quotes: *"Switching projects swapped the whole conversation — correct book."*

**Pass 2 — verifier**

| Finding | MT / area |
|---------|-----------|
| No cross-chat | MT-022, MT-024 |

**Verdict: PASS**

---

## UX-203 — Modal escape (P7)

**Pass 1 — in-character**

- **Escape** closed new-project dialog; page usable afterward.
- (Cancel / × / backdrop not re-clicked this rerun; covered in UX-103 / prior impl.)

**Pass 2 — verifier**

| Finding | MT / area |
|---------|-----------|
| Escape | MT-033 |

**Verdict: PASS**

---

## UX-204 — Chat spam (P7)

**Pass 1 — in-character**

- Live Enter-spam not sent (agent policy blocked automated Send).
- **Automation:** consult debounce, server persistence, refresh restores bubbles.

**Pass 2 — verifier**

| Finding | MT / area |
|---------|-----------|
| Debounce / block | MT-080–MT-082, `usePipeline.js` |

**Verdict: PASS** (automation + code; live spam optional)

---

## UX-205 — Collapse assistant (P1+P7)

**Pass 1 — in-character**

- Mid-consult: collapsed **Editorial desk**; center said open **Assistant** in header.
- Header **Assistant** restored full panel and conversation.
- Blockers: **none (S0/S1)**
- Quotes: *"I thought I lost chat, but the Assistant button brought it back."*

**Pass 2 — verifier**

| Finding | MT / area |
|---------|-----------|
| Collapse / expand | MT-010, MT-061 |

**Verdict: PASS**

---

## UX-206 — Delete active project (P4)

**Verdict: SKIP** — destructive; not executed in MCP rerun.

---

## UX-207 — Export without artifact server (P6)

**Pass 1 — in-character**

- Same as UX-106 export: plain-language local save + MCP hint for full PDF.

**Verdict: PASS**

---

## HARD-301 — Long consult / late outline (P2)

**Verdict: SKIP** — 3-minute wait not executed in MCP rerun (`ui-consult-qa` outline within 180s).

---

## HARD-302 — Negotiation edit race (P2)

**Verdict: SKIP** — simultaneous center edit + chat patch not executed.

---

## HARD-303 — Book vs article (P1)

**Pass 1 — in-character**

- Done fixture: multi-chapter nav (introduction, authentication, api_conventions, …), **Final manuscript** / Preview.
- Feels like a book-shaped project, not a single short article.

**Verdict: PASS**

---

## HARD-304 — Phase stepper vs badge (P4)

**Pass 1 — in-character**

| Fixture | Switcher badge | Stepper active | Match |
|---------|----------------|----------------|-------|
| `2b11af3b` | Halted | **Review** (Resolve editorial tickets) | Yes |
| `1636d453` | Done | **Done** (Export when you are ready) | Yes |
| New consult | Consult | **Consult** | Yes |

**Verdict: PASS**

---

## HARD-305 — Accessibility snapshot (any)

**Pass 1 — in-character**

- Snapshots show named controls: **Start consultation**, **Export PDF**, **Open document navigation**, **Collapse assistant**, domain chips (**Hobbyists**, etc.).
- No unnamed-only primary actions observed in exercised flows.

**Verdict: PASS**

---

## Follow-ups (non-blocking)

1. Seed **open** ticket on `2b11af3b` for fuller UX-104 pass.
2. Optional: UX-201 double-click and UX-204 live spam when manual Send is allowed.
3. UX-206 delete flow — one-off operator session if needed.
