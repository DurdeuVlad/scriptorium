# Document navigation

## MT-040 — Empty artifact nav (no project)

**Preconditions:** MT-001.

**Steps:**
1. Inspect `#artifact-nav`.

**Expected result:** `.document-nav-empty` or placeholder; no chapter links.

**Playwright check:** `#artifact-nav.document-nav-empty` or no `[data-artifact]` children

**Failure signals:** Phantom chapter links without project.

---

## MT-041 — Select Plan in sidebar

**Preconditions:** Project loaded after commission.

**Steps:**
1. Click `[data-artifact="plan"]`.

**Expected result:** Center shows `#plan-editor`; plan fields visible.

**Playwright check:** `ui-smoke` verifies plan nav exists

**Failure signals:** Center stays on welcome; wrong artifact highlighted.

---

## MT-042 — Select chapter in sidebar

**Preconditions:** Phase `drafting` or later with `manuscript` keys populated.

**Steps:**
1. Click a chapter `[data-artifact]` (not plan/preview/final).

**Expected result:** Center shows draft editor for that chapter; nav item active.

**Playwright check:** `page.click('[data-artifact="chapter_1"]')` (key varies)

**Failure signals:** Empty editor; 404 on artifact fetch.

---

## MT-043 — Select Preview

**Preconditions:** At least one chapter drafted or preview artifact exists.

**Steps:**
1. Click `[data-artifact="preview"]`.

**Expected result:** `#preview-panel` visible with assembled preview content.

**Playwright check:** `waitForSelector("#preview-panel")`

**Failure signals:** Blank preview; wrong markdown.

---

## MT-044 — Select Final manuscript

**Preconditions:** Phase `finished` or `publishing` with `final_manuscript`.

**Steps:**
1. Click `[data-artifact="final_manuscript"]` if shown.

**Expected result:** Read-only merged manuscript in center view.

**Playwright check:** Nav item visible when `isFinishedPhase`

**Failure signals:** Nav hidden when manuscript exists; empty content.

---

## MT-045 — Center workspace identity

**Preconditions:** Any project view.

**Steps:**
1. Confirm `#center-workspace` wraps active editor/preview.

**Expected result:** Single main region; scroll contained in workspace.

**Playwright check:** `#center-workspace` attached

**Failure signals:** Duplicate main landmarks; layout overflow hidden incorrectly.

---

## MT-046 — Preview panel content

**Preconditions:** MT-043.

**Steps:**
1. Read preview headings and body.

**Expected result:** Reflects on-disk manuscript files; updates after pipeline progress.

**Playwright check:** `#preview-panel` innerText length > 0

**Failure signals:** Stale preview after `file_update` WS.

---
