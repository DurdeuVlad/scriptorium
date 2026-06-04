# Projects — switcher, load, delete

## MT-020 — Open new project from switcher

**Preconditions:** App loaded.

**Steps:**
1. Click `#project-switcher .project-switcher-trigger`.
2. Click `#btn-new-project`.

**Expected result:** Menu closes; `#new-project-modal` opens.

**Playwright check:** Same as `ui-smoke.mjs` lines 23–25

**Failure signals:** Menu does not open; duplicate modals.

---

## MT-021 — Open project switcher menu

**Preconditions:** At least one project exists (API `GET /projects`).

**Steps:**
1. Click project switcher trigger.

**Expected result:** `.project-switcher-menu` lists projects with `[data-project-id]`.

**Playwright check:** `page.waitForSelector(".project-switcher-menu")`

**Failure signals:** Empty menu when API has projects.

---

## MT-022 — Switch active project

**Preconditions:** Two or more projects.

**Steps:**
1. Open switcher; click a different `[data-project-id]`.
2. Wait for load overlay to finish.

**Expected result:** Welcome hidden; plan editor or last view restored; WS `bind_project`; chat and plan match selected project; assistant expands.

**Playwright check:** `ui-consult-qa` `switchToProject`; `waitForProjectLoaded`

**Failure signals:** Stale content from previous project; infinite loading overlay.

---

## MT-023 — Delete project

**Preconditions:** Deletable test project (not production data).

**Steps:**
1. Open switcher; click `.btn-delete-project` on a row.
2. Confirm browser `confirm()` dialog.

**Expected result:** Project removed from list; if it was active, UI returns to welcome or another project.

**Playwright check:** Manual (confirm dialog blocks automation unless `page.on('dialog')`)

**Failure signals:** Project still in API list; active UI references deleted id.

---

## MT-024 — Project load overlay

**Preconditions:** Slow network or large project optional.

**Steps:**
1. Switch project (MT-022).

**Expected result:** `.project-loading-overlay` appears briefly then detaches; no interaction with stale plan mid-load.

**Playwright check:** `waitForSelector(".project-loading-overlay", { state: "detached" })`

**Failure signals:** Overlay never clears; double-load race shows wrong phase.

---
