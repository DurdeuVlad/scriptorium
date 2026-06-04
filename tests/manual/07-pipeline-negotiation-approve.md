# Pipeline — negotiation and approve outline

## MT-070 — Negotiation phase UI

**Preconditions:** Outline generated; phase `negotiation`.

**Steps:**
1. Observe plan sections populated; `#negotiation-controls` and drawer negotiation block.

**Expected result:** `showNegotiation` true; Approve buttons visible; plan editable per MT-051.

**Playwright check:** `#btn-approve-outline` visible

**Failure signals:** Stuck in `planning` forever; approve hidden with sections present.

---

## MT-071 — Approve outline (workspace footer)

**Preconditions:** MT-070; pipeline not busy.

**Steps:**
1. Click `#btn-approve-outline` in workspace footer.

**Expected result:** WS `approve_outline`; phase advances to drafting; chapter nav populates; status updates.

**Playwright check:** `ui-consult-qa` approve step

**Failure signals:** No chapter files; approve no-op.

---

## MT-072 — Approve outline (drawer duplicate)

**Preconditions:** MT-070.

**Steps:**
1. Click `#btn-approve-outline-drawer`.

**Expected result:** Same outcome as MT-071 (single approval path).

**Playwright check:** Both buttons trigger same handler

**Failure signals:** Only one button works; double approval errors.

---

## MT-073 — Negotiation chat updates plan

**Preconditions:** `negotiation`; drawer open.

**Steps:**
1. Send chat asking to rename a section or change goal.

**Expected result:** Consultant may patch plan; UI reflects `plan_update` WS or refetch.

**Playwright check:** Plan section title changes after message (LLM-dependent)

**Failure signals:** Chat ignored in negotiation.

---

## MT-074 — Approve disabled while busy

**Preconditions:** `pipelineBusy` true during transition.

**Steps:**
1. Observe approve buttons during busy window.

**Expected result:** Both approve buttons `disabled`.

**Playwright check:** `isDisabled()` on `#btn-approve-outline`

**Failure signals:** Approve during active orchestrator step causes corrupt state.

---
