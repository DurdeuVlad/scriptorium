# Pipeline — draft, review, halt

## MT-100 — Draft editor chapter view

**Preconditions:** Phase `drafting`+; chapter selected in nav.

**Steps:**
1. Open a chapter from `[data-artifact]`.
2. Edit body in `.draft-editor` (or textarea within).

**Expected result:** Content loads from artifact; debounced save / `file_update` via WS.

**Playwright check:** `.draft-editor` visible with text

**Failure signals:** Empty chapter; save loops; wrong chapter on switch.

---

## MT-101 — Chapter nav population after approve

**Preconditions:** MT-071 completed.

**Steps:**
1. Count chapter items in `#artifact-nav` (excluding plan/preview/final).

**Expected result:** Matches plan section count (or orchestrator mapping).

**Playwright check:** `document.querySelectorAll('[data-artifact^="chapter"]')` or section keys

**Failure signals:** Only plan link visible during drafting.

---

## MT-102 — Pipeline phases drafting → reviewing

**Preconditions:** Full pipeline run or fixture project.

**Steps:**
1. Observe phase badge through scrubbing, copyediting, reviewing.

**Expected result:** Stepper stays on Draft/Review appropriately; status messages update via WS.

**Playwright check:** Phase label in `.phase-badge` changes

**Failure signals:** Phase stuck in `drafting`; no WS events in console.

---

## MT-103 — Review halt with tickets

**Preconditions:** Project in `review_halt` (e.g. technical-docs blockers).

**Steps:**
1. Open assistant; read ticket cards in editorial memo.
2. Resolve via MT-085.

**Expected result:** Open tickets listed; resolved tickets dimmed/removed; resume when all resolved.

**Playwright check:** `ui-consult-qa` halt fixture

**Failure signals:** Halt without tickets; pipeline resumes with open tickets.

---

## MT-104 — run_complete / finished transition

**Preconditions:** Pipeline completes sign-off.

**Steps:**
1. Wait for phase `finished` (not stuck in `publishing` only).
2. Check `canShowExport` conditions.

**Expected result:** Phase label "Done"; export controls appear when manuscript has content; `publishing` normalized to `finished` in UI.

**Playwright check:** Phase meta tone `success`; export buttons visible

**Failure signals:** Stuck publishing; export hidden with chapters on disk.

---

## MT-105 — file_update refreshes editor

**Preconditions:** Active chapter open during pipeline.

**Steps:**
1. Let orchestrator push `file_update` for current chapter.

**Expected result:** Editor content updates without full page reload.

**Playwright check:** Observe WS in DevTools; content changes

**Failure signals:** Stale editor until manual nav away/back.

---
