# App shell, header, layout

## MT-001 — Welcome empty state

**Preconditions:** No project selected; API reachable.

**Steps:**
1. Open http://127.0.0.1:5173 with a fresh session (or clear active project via switching away / new browser profile).

**Expected result:** `#welcome-empty` visible with commissioning CTA; center workspace shows welcome, not plan editor.

**Playwright check:** `await page.waitForSelector("#welcome-empty")`

**Failure signals:** Plan editor visible without a project; blank center with no welcome.

---

## MT-002 — Welcome new project button

**Preconditions:** MT-001.

**Steps:**
1. Click `#btn-welcome-new`.

**Expected result:** `#new-project-modal` opens (see MT-030).

**Playwright check:** `page.click("#btn-welcome-new")` → `#new-project-modal` visible

**Failure signals:** Modal does not open; nothing happens.

---

## MT-003 — Header bar with project

**Preconditions:** Project loaded.

**Steps:**
1. Observe header: project name in switcher, phase stepper, assistant toggle.

**Expected result:** `.project-switcher-name` shows project title; stepper reflects `getPhaseMeta(phase).step`; no console errors.

**Playwright check:** `.project-switcher-name` not empty; `.phase-stepper` visible

**Failure signals:** "Select project" while workspace shows content.

---

## MT-004 — Mobile document nav menu

**Preconditions:** Viewport width ≤900px; project loaded.

**Steps:**
1. Click `.header-menu-btn`.
2. Confirm `#document-nav-drawer` opens; click `.nav-backdrop` to close.

**Expected result:** Nav slides in/out; artifact links clickable when open.

**Playwright check:** `page.setViewportSize({ width: 390, height: 844 })`; menu opens drawer

**Failure signals:** Nav unreachable on mobile; drawer stuck open.

---

## MT-005 — Phase stepper (read-only)

**Preconditions:** Project in various phases.

**Steps:**
1. Note stepper labels: Consult → Plan → Draft → Review → Done.
2. Advance project phase via pipeline; reload UI state.

**Expected result:** Active step highlights per `PHASES[phase].step`; stepper is not clickable navigation.

**Playwright check:** `.phase-stepper .is-active` count === 1

**Failure signals:** Wrong step for known phase; stepper acts as navigation.

---

## MT-010 — Assistant collapsed strip

**Preconditions:** Desktop ≥901px; project loaded; collapse assistant (× or toggle).

**Steps:**
1. Collapse editorial desk.
2. Observe right edge of viewport.

**Expected result:** Only ~48px strip (`.assistant-strip`); **no wide empty black/primary gutter**; grid `2fr 1fr 48px`.

**Playwright check:** `page.locator(".assistant-strip").boundingBox()` width ≈ 48; no large empty third column in screenshot

**Failure signals:** Empty column wider than strip; strip not clickable.

---

## MT-011 — Assistant expanded (2:5:3 layout)

**Preconditions:** Desktop ≥901px; project loaded (auto-expands on load per `loadProject`).

**Steps:**
1. Ensure `.assistant-drawer.open` visible.
2. Take screenshot at 1600×900.

**Expected result:** Three columns: nav ~2 parts, workspace ~5, consultant ~3; drawer background fills third column (`--bg-secondary`).

**Playwright check:** `await page.waitForSelector(".assistant-drawer.open")`; optional screenshot to `docs/screenshots/manual/consult-expanded.png`

**Failure signals:** Black void in third column; chat panel clipped to 48px width.

---
