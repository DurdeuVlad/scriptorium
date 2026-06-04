# New project modal

## MT-030 — Modal open and focus

**Preconditions:** MT-002 or MT-020.

**Steps:**
1. Verify `#new-project-modal` visible; `#new-project-prompt` focusable.

**Expected result:** Modal centered; prompt field accepts input; title `#new-project-title` reads "New project".

**Playwright check:** `waitForSelector("#new-project-modal")`

**Failure signals:** Background scroll not locked; modal behind other layers.

---

## MT-031 — Close via × button

**Preconditions:** Modal open.

**Steps:**
1. Click close `button` (aria Close) in modal header.

**Expected result:** Modal unmounts; no project created.

**Playwright check:** `#new-project-modal` detached

**Failure signals:** Partial state left in App.

---

## MT-032 — Close via backdrop

**Preconditions:** Modal open.

**Steps:**
1. Click `.modal-backdrop` outside card.

**Expected result:** Modal closes (same as MT-031).

**Playwright check:** Optional click backdrop selector

**Failure signals:** Backdrop click passes through to welcome button.

---

## MT-033 — Cancel button

**Preconditions:** Modal open with text entered.

**Steps:**
1. Click Cancel in `.modal-footer`.

**Expected result:** Modal closes; fields discarded.

**Playwright check:** Footer `.btn-secondary` click

**Failure signals:** Project created on cancel.

---

## MT-034 — Commissioning prompt required

**Preconditions:** Modal open.

**Steps:**
1. Clear `#new-project-prompt`; attempt `#btn-commission-project`.

**Expected result:** Button disabled or submit blocked until prompt non-empty.

**Playwright check:** `isDisabled()` on commission button when prompt empty

**Failure signals:** Empty project created.

---

## MT-035 — Domain selection

**Preconditions:** Modal open.

**Steps:**
1. Select each `input[name="domain"]` radio in turn before submit.

**Expected result:** Selected domain sent in `POST /projects` body; technical-docs may later surface blocker tickets.

**Playwright check:** Check radio `checked` before click commission

**Failure signals:** Domain always default; wrong domain in API.

---

## MT-036 — Optional project name

**Preconditions:** Modal open.

**Steps:**
1. Fill prompt only; leave `#new-project-name` empty; commission.

**Expected result:** API assigns generated name; switcher shows name after load.

**Playwright check:** Fill prompt only; commission succeeds

**Failure signals:** Commission fails without name if name optional in API.

---

## MT-037 — Commission project (happy path)

**Preconditions:** Valid prompt; API + WS up.

**Steps:**
1. Fill `#new-project-prompt` (e.g. "Manual test API guide").
2. Click `#btn-commission-project`.
3. Wait for `#plan-editor` and consult UI.

**Expected result:** Modal closes; `start_consult` runs; phase `intake`; first chat bubble within LLM/mock timeout; assistant drawer open.

**Playwright check:** `ui-smoke.mjs` full flow; maps MT-037

**Failure signals:** Stuck on modal spinner; no plan editor; WS error in console.

---

## MT-038 — Commission disabled while submitting

**Preconditions:** Slow API optional.

**Steps:**
1. Click commission once; observe button during request.

**Expected result:** Button shows spinner/disabled (`.btn-with-spinner`); prevents double submit.

**Playwright check:** `locator("#btn-commission-project").isDisabled()` during submit

**Failure signals:** Duplicate projects from double click.

---
