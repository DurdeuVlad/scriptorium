# Persistence and refresh

## MT-110 — Active project in localStorage

**Preconditions:** Project loaded.

**Steps:**
1. DevTools → Application → localStorage for origin.
2. Find active project id key (per `App.jsx` / `useProject`).

**Expected result:** Active project id stored.

**Playwright check:** `localStorage.getItem` after load

**Failure signals:** No persistence; wrong id after switch.

---

## MT-111 — Full page reload restores project

**Preconditions:** MT-110.

**Steps:**
1. Reload browser (F5).
2. Wait for load.

**Expected result:** Same project reloaded; plan + chat restored via REST + `bind_project`; assistant expanded.

**Playwright check:** `page.reload()` then `waitForSelector("#plan-editor")`

**Failure signals:** Welcome screen after reload; empty chat.

---

## MT-112 — Conversation sync after reload

**Preconditions:** MT-111; messages existed before reload.

**Steps:**
1. Compare chat bubbles to `GET /projects/{id}/conversation`.

**Expected result:** Messages match API order/content (fallback if WS slow).

**Playwright check:** `.chat-bubble` count ≥ prior count

**Failure signals:** Duplicate bubbles; lost history.

---

## MT-113 — Artifact sync from disk

**Preconditions:** Chapters written under `projects/{id}/artifacts/`.

**Steps:**
1. Reload; open chapter nav item.

**Expected result:** Editor shows on-disk markdown.

**Playwright check:** Chapter text matches file (spot check)

**Failure signals:** Empty until pipeline re-run.

---

## MT-130 — Browser Back/Forward (N/A)

**Preconditions:** None.

**Steps:**
1. Navigate within app; press browser Back.

**Expected result:** **N/A** — no React Router; URL unchanged. Only full reload tests apply.

**Playwright check:** Not automated

**Failure signals:** N/A (document only).

---
