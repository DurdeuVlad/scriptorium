# Mobile responsive (≤900px)

## MT-120 — Mobile viewport layout

**Preconditions:** Project loaded.

**Steps:**
1. Set viewport to 390×844 (or 375×667).
2. Load app.

**Expected result:** Single-column feel; workspace full width; assistant not reserving desktop 3fr gutter.

**Playwright check:** `page.setViewportSize({ width: 390, height: 844 })`

**Failure signals:** Horizontal scroll; clipped header.

---

## MT-121 — Nav drawer and backdrop

**Preconditions:** MT-120.

**Steps:**
1. Open nav via `.header-menu-btn`.
2. Tap `.nav-backdrop`.

**Expected result:** Drawer overlays workspace; closes on backdrop.

**Playwright check:** `#document-nav-drawer` visible then hidden

**Failure signals:** Nav permanently open; cannot select artifacts.

---

## MT-122 — Assistant fixed overlay on mobile

**Preconditions:** MT-120; expand assistant.

**Steps:**
1. Open assistant via toggle or strip.

**Expected result:** Per `App.css` media block: assistant overlays (fixed), not desktop grid third column.

**Playwright check:** `.assistant-drawer.open` with mobile positioning

**Failure signals:** Drawer off-screen; strip only with no expand.

---

## MT-123 — Project switcher on mobile

**Preconditions:** MT-120.

**Steps:**
1. Open switcher; select project.

**Expected result:** Menu usable; touch targets adequate.

**Playwright check:** Click trigger + menu item

**Failure signals:** Menu clipped under header.

---
