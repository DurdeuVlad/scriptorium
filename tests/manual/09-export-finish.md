# Export and finished phase

## MT-090 — Export DOCX from drawer

**Preconditions:** `canShowExport(phase, manuscript)` true; artifact MCP configured.

**Steps:**
1. Open assistant drawer on finished project.
2. Click DOCX export button in drawer (`.btn-secondary` with DOCX label).

**Expected result:** Status shows exporting then path or success; `POST /export` with format docx.

**Playwright check:** `ui-consult-qa` export section if present

**Failure signals:** Button missing when chapters exist; silent failure.

---

## MT-091 — Export PDF from drawer

**Preconditions:** MT-090 preconditions.

**Steps:**
1. Click PDF in drawer.

**Expected result:** Same as MT-090 with format pdf.

**Playwright check:** Network `POST /export` body format pdf

**Failure signals:** PDF requires extra deps; error not shown in UI.

---

## MT-092 — Export DOCX from workspace

**Preconditions:** Finished project; workspace export bar visible.

**Steps:**
1. Click DOCX in `#center-workspace` export area.

**Expected result:** Same export flow as drawer.

**Playwright check:** Workspace footer export button

**Failure signals:** Only drawer works; workspace buttons hidden.

---

## MT-093 — Export PDF from workspace

**Preconditions:** MT-092.

**Steps:**
1. Click PDF in workspace.

**Expected result:** PDF export triggered.

**Playwright check:** Same as MT-091

**Failure signals:** Duplicate download dialogs.

---

## MT-094 — Export status and errors

**Preconditions:** Export attempted.

**Steps:**
1. Read `.export-status` or status message during/after export.
2. Optional: stop artifact-server to force error.

**Expected result:** User-visible error when MCP fails; not stuck "Exporting…" forever.

**Playwright check:** `isExportingStatus` clears

**Failure signals:** Empty manuscript export with no message.

---

## MT-096 — Export hidden before finish

**Preconditions:** Phase `negotiation` or `drafting`.

**Steps:**
1. Inspect drawer and workspace for export buttons.

**Expected result:** `showExport` false; no export CTAs.

**Playwright check:** Export buttons count === 0

**Failure signals:** Export offered mid-draft.

---

## MT-097 — Final manuscript after sign-off

**Preconditions:** MT-104.

**Steps:**
1. Select `[data-artifact="final_manuscript"]` if present.

**Expected result:** Merged long-form output (book-scale when requested in brief), not only short article stub.

**Playwright check:** Content length >> short blog default (manual judgment)

**Failure signals:** Single short section only when user asked for book.

---
