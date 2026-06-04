# Assistant — consult and chat

## MT-060 — Editorial desk open

**Preconditions:** Project loaded.

**Steps:**
1. Verify `.assistant-drawer.open` and heading "Editorial desk".

**Expected result:** Pipeline monitor + chat panel visible; not collapsed strip.

**Playwright check:** `waitForSelector(".assistant-drawer.open")`

**Failure signals:** Strip only after load (regression if expand on load broken).

---

## MT-061 — Collapse assistant

**Preconditions:** Drawer open.

**Steps:**
1. Click collapse (×) in drawer header.

**Expected result:** Collapses to `.assistant-strip`; MT-010 layout.

**Playwright check:** `.assistant-strip` visible; `.assistant-drawer.open` count 0

**Failure signals:** Drawer stays open; layout gutter returns.

---

## MT-062 — Pipeline status message

**Preconditions:** Project in intake or busy phase.

**Steps:**
1. Read `.status-message` in drawer.

**Expected result:** Human-readable phase/status; `.is-busy` when `isPipelineBusy(phase)`.

**Playwright check:** `.status-message` non-empty

**Failure signals:** Empty status; wrong busy indicator when `finished`.

---

## MT-063 — Draft outline button

**Preconditions:** Phase `intake`; `intakeStatus !== "not_started"`.

**Steps:**
1. Complete at least one consult exchange (or mock).
2. Click `#btn-draft-outline`.

**Expected result:** Inline `.action-proposal-card` appears; after **Confirm**, phase moves toward `planning`/`negotiation`; outline sections appear or waiting panel.

**Playwright check:** `#btn-draft-outline` → `.action-proposal-card`; confirm → outline flow

**Failure signals:** Button always disabled; no outline after 180s.

---

## MT-064 — Draft outline disabled when busy

**Preconditions:** `pipelineBusy` true.

**Steps:**
1. During active pipeline step, observe `#btn-draft-outline`.

**Expected result:** `disabled` attribute set.

**Playwright check:** `isDisabled()` during busy

**Failure signals:** Double outline generation.

---

## MT-080 — Chat input and send

**Preconditions:** Consult phase; drawer open.

**Steps:**
1. Type in `#chat-input`; click `#btn-send-chat`.

**Expected result:** User bubble appears; consultant reply follows (WS/API); input clears or ready for next.

**Playwright check:** `.chat-bubble` count increases

**Failure signals:** No WS `consult_message`; 500 in network.

---

## MT-081 — Send via Enter key

**Preconditions:** MT-080.

**Steps:**
1. Type message; press Enter in `#chat-input`.

**Expected result:** Same as send button (not Shift+Enter newline only if implemented).

**Playwright check:** `keyboard.press("Enter")` after fill

**Failure signals:** Enter inserts newline only with no send.

---

## MT-082 — Chat disabled when pipeline busy

**Preconditions:** Phase in `isPipelineBusy` during automated run (not intake consult).

**Steps:**
1. Attempt send during drafting without halt.

**Expected result:** Input disabled or send rejected; consult agent not misleading on finished projects (see MT-095).

**Playwright check:** `#chat-input` disabled or `pipelineBusy`

**Failure signals:** "Pipeline is running" when phase is `finished`.

---

## MT-083 — Consult choice chips

**Preconditions:** Intake with `pendingPrompt` choices in UI.

**Steps:**
1. Click `.consult-choice-btn` for an option.

**Expected result:** Choice sent as consult action; next question or completion.

**Playwright check:** Click first `.consult-choice-btn`

**Failure signals:** Chips visible but no `onConsultAction`.

---

## MT-084 — Skip consult question

**Preconditions:** Skip button visible (`.consult-skip-btn`).

**Steps:**
1. Click Skip.

**Expected result:** Advances intake; no duplicate question.

**Playwright check:** `.consult-skip-btn` click

**Failure signals:** Skip hidden when required question.

---

## MT-085 — Answer blocker ticket in chat

**Preconditions:** Project in `review_halt` with open ticket.

**Steps:**
1. Click `.ticket-answer-btn` on a ticket card.
2. Send answer in chat.

**Expected result:** Ticket marked resolved when criteria met; pipeline can resume.

**Playwright check:** `ui-consult-qa` review_halt section

**Failure signals:** Ticket stays open after valid answer.

---

## MT-095 — Post-finish consult (no false busy)

**Preconditions:** Phase `finished` or `publishing`.

**Steps:**
1. Ask consultant for export help or "book length" in chat.

**Expected result:** Helpful reply; **not** generic "pipeline is running" unless actually busy.

**Playwright check:** `ui-consult-qa` finished-phase message check

**Failure signals:** Busy message when export available.

---

## MT-096 — Action proposal card appears

**Preconditions:** Project loaded; intake complete or in negotiation.

**Steps:**
1. In chat, type a mutation request, e.g. `set chapter count to 10` or `switch to technical-doc voice`.
2. Wait for assistant reply.

**Expected result:** Inline `.action-proposal-card` appears in the message thread with summary, before/after diff rows, and right-aligned **Confirm**, **Edit in plan**, **Cancel** buttons. Composer stays focused (no keyboard shortcuts on the card).

**Playwright check:** `waitForSelector(".action-proposal-card.pending")`

**Failure signals:** Mutation applied immediately with no card; duplicate assistant bubbles for the same turn.

---

## MT-097 — Confirm proposal applies change

**Preconditions:** MT-096; pending proposal card visible.

**Steps:**
1. Click **Confirm** on the proposal card.
2. Observe plan panel and chat.

**Expected result:** Card shows **Confirmed** (buttons hidden); `plan_patch` or pipeline starts as appropriate; system message “Applied: …” or drafting status; `pending_proposal` cleared on refresh.

**Playwright check:** Click `.action-proposal-card .btn-primary`; card gets `.resolved`

**Failure signals:** Confirm with no state change; error toast for valid pending id.

---

## MT-098 — Cancel proposal dismisses change

**Preconditions:** Pending proposal card (MT-096).

**Steps:**
1. Click **Cancel** on the card.

**Expected result:** Card shows **Cancelled**; no plan/pipeline change; chat system ack “Change cancelled.”

**Playwright check:** Click `.action-proposal-card .btn-ghost`

**Failure signals:** State still changes after cancel.

---

## MT-099 — Stale proposal id rejected

**Preconditions:** Two proposals in sequence OR refresh after confirm.

**Steps:**
1. Confirm or cancel the active proposal.
2. If possible, trigger confirm again on the old card (e.g. via devtools replay or second tab).

**Expected result:** Server returns error “That proposal is no longer active…”; no double-apply.

**Failure signals:** Second confirm runs pipeline twice.

---

## MT-100 — App help routing (no mutation card)

**Preconditions:** Project loaded.

**Steps:**
1. Ask `where do I export?` or `what does negotiation mean?`

**Expected result:** Short helpful assistant reply; **no** `.action-proposal-card` unless user explicitly requests an export/mutation.

**Playwright check:** `.chat-bubble.consult` without `.action-proposal-card`

**Failure signals:** Export help triggers export proposal without user asking to export.

---

## MT-101 — Draft outline / Start drafting via proposal

**Preconditions:** Intake complete with brief filled.

**Steps:**
1. Click **Draft outline** chip OR type `draft outline`.
2. Confirm the proposal card.
3. After outline appears, click **Start drafting** OR type `approve outline`.
4. Confirm second card.

**Expected result:** Each pipeline step shows a confirm card first; drafting starts only after second confirm.

**Playwright check:** `#btn-draft-outline` then `.action-proposal-card`; `#btn-approve-outline` then card

**Failure signals:** Pipeline starts without confirm card (regression to immediate approve).

---
