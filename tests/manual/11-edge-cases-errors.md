# Edge cases and errors

## MT-140 — API unreachable on load

**Preconditions:** Stop uvicorn.

**Steps:**
1. Open frontend; attempt commission or load.

**Expected result:** Graceful error in console/UI; no white screen; retry possible after API up.

**Playwright check:** Optional — expect failed fetch

**Failure signals:** Uncaught exception crash; infinite spinner.

---

## MT-141 — WebSocket disconnect/reconnect

**Preconditions:** Project loaded; WS connected.

**Steps:**
1. Briefly stop API or throttle network; restore.

**Expected result:** Reconnect or `bind_project` on reload; pipeline state eventually consistent.

**Playwright check:** Manual DevTools Network WS tab

**Failure signals:** Stale phase forever; duplicate handlers.

---

## MT-142 — Plan PATCH 409 wrong phase

**Preconditions:** Phase `drafting`.

**Steps:**
1. Force edit plan title (if UI allows) or PATCH via API.

**Expected result:** 409 from API; UI shows error save state.

**Playwright check:** Network response 409

**Failure signals:** Silent discard; corrupt plan.

---

## MT-143 — Export without manuscript

**Preconditions:** `finished` but empty `manuscript` object.

**Steps:**
1. Attempt export.

**Expected result:** Clear error message in export status.

**Playwright check:** Error text in `.export-status`

**Failure signals:** Hang or success with empty file.

---

## MT-144 — Console free of error spam

**Preconditions:** Smoke path MT-037.

**Steps:**
1. Run `ui-smoke`; check console for uncaught errors.

**Expected result:** No repeating React warnings/errors during happy path.

**Playwright check:** `page.on("console", msg => msg.type() === "error")`

**Failure signals:** WS parse errors; key warnings on every render.

---

## MT-131 — WS start_run (N/A)

**Preconditions:** None.

**Steps:**
1. Search UI for control that sends `start_run`.

**Expected result:** **N/A** — not wired in `usePipeline.js`; internal/legacy only.

**Playwright check:** Not applicable

**Failure signals:** N/A.

---
