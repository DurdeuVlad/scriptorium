# Plan editor — brief and outline

## MT-050 — Plan editor visible

**Preconditions:** Project loaded; `[data-artifact="plan"]` selected.

**Steps:**
1. Confirm `#plan-editor` mounted.

**Expected result:** Brief fields + sections list (or waiting state).

**Playwright check:** `#plan-editor`

**Failure signals:** Missing editor after commission.

---

## MT-051 — Edit plan title

**Preconditions:** `isEditablePlanPhase(phase)` true (`intake`, `negotiation`, `planning`, `idle`, `review_halt`).

**Steps:**
1. Change `#plan-title`; wait ~1s for debounced save.

**Expected result:** Save badge shows saving then saved; `PATCH /projects/{id}/plan` succeeds.

**Playwright check:** `.save-status-badge` text matches `/saved/i`

**Failure signals:** 409 in network tab when phase is `drafting`; silent data loss.

---

## MT-052 — Edit plan goal

**Preconditions:** MT-051 preconditions.

**Steps:**
1. Edit `#plan-goal`; observe save status.

**Expected result:** Persisted on reload (MT-100).

**Playwright check:** Fill + reload project

**Failure signals:** Field read-only when should edit.

---

## MT-053 — Edit plan audience

**Preconditions:** Editable phase.

**Steps:**
1. Edit `#plan-audience`.

**Expected result:** Saved via same plan PATCH.

**Playwright check:** Same as MT-051

**Failure signals:** Reverts after WS `plan_update`.

---

## MT-054 — Edit plan tone

**Preconditions:** Editable phase.

**Steps:**
1. Edit `#plan-tone`.

**Expected result:** Saved and reflected in outline generation context.

**Playwright check:** Same as MT-051

**Failure signals:** Tone ignored in orchestrator output.

---

## MT-055 — Add section

**Preconditions:** Editable phase; not waiting-only UI.

**Steps:**
1. Click "Add section" (`.btn-secondary` in plan editor header area).

**Expected result:** New row in sections list; save triggered.

**Playwright check:** Section count increases

**Failure signals:** Button missing in negotiation; add disabled during `planning` busy incorrectly.

---

## MT-056 — Reorder sections

**Preconditions:** ≥2 sections; editable phase.

**Steps:**
1. Move section up/down via arrow buttons in row.

**Expected result:** Order changes; persisted after save.

**Playwright check:** First section title changes order in DOM

**Failure signals:** Buttons disabled incorrectly at index boundaries.

---

## MT-057 — Remove section

**Preconditions:** ≥1 section; editable phase.

**Steps:**
1. Click remove (`.danger`) on a section row; confirm if prompted.

**Expected result:** Section removed from plan and API.

**Playwright check:** Section count decreases

**Failure signals:** Remove breaks manuscript keys still referencing chapter.

---

## MT-058 — Waiting panel (outline generating)

**Preconditions:** Phase busy with zero sections (`isWaitingForOutline`).

**Steps:**
1. Trigger outline generation or observe post–Draft outline click during `planning`.

**Expected result:** `.waiting-panel` or waiting dots; fields read-only.

**Playwright check:** `.waiting-panel` visible when `sectionCount === 0` and busy

**Failure signals:** Editable fields during server generation; infinite wait without error.

---

## MT-059 — Save status badge

**Preconditions:** Any plan edit.

**Steps:**
1. Edit a field; watch `.save-status-badge`.

**Expected result:** States: saving → saved (or error on failure).

**Playwright check:** `parseSaveStatus` alignment in UI

**Failure signals:** Stuck on "Saving…"; no feedback on 409.

---

## MT-067 — Plan read-only in drafting

**Preconditions:** Phase `drafting` (or scrubbing/copyediting/reviewing).

**Steps:**
1. Open plan; attempt edit title.

**Expected result:** Inputs disabled or PATCH returns 409; UI shows read-only.

**Playwright check:** `#plan-title` disabled or save error

**Failure signals:** Edits allowed mid-draft without warning.

---
