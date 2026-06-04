# MCP manual QA session — 2026-06-03

**Tester:** Cursor agent (Playwright MCP `project-0-scriptorium-playwright`)  
**Environment:** API http://127.0.0.1:8000, Vite http://127.0.0.1:5173  
**Viewport:** 1600×900 (desktop), 390×844 (mobile spot-check)

## Summary

| Result | Count |
|--------|-------|
| PASS | 18 |
| FAIL | 0 |
| Not run (full matrix) | Remaining MT-### in coverage-matrix |

## Results

| ID | Result | Notes |
|----|--------|-------|
| MT-001 | PASS | Welcome empty, assistant strip, no project |
| MT-002 | PASS | Welcome **New project** opened modal |
| MT-030 | PASS | Modal fields, Book domain selected |
| MT-034 | PASS | Start consultation enabled after prompt fill |
| MT-037 | PASS | Commission → plan editor, expanded assistant, consult bubbles, Draft outline |
| MT-005 | PASS | Stepper Consult active after commission |
| MT-041 | PASS | Brief & Outline in document nav |
| MT-083 | PASS | **General public** choice chip |
| MT-011 | PASS | Expanded drawer width **480px**, grid `320px 800px 480px`, right edge at viewport |
| MT-010 | PASS | Collapsed strip **48px**, gap after strip **~0** (no black gutter) |
| MT-022 | PASS | Switched to **Halted** API reference project |
| MT-103 | PASS | Tickets list, 1 open, chapter nav populated |
| MT-085 | PASS | **Answer in chat** enabled `#chat-input` |
| MT-090 | PASS | Done book project: **Export DOCX/PDF** in workspace + drawer |
| MT-043 / MT-044 | PASS | Preview + Final manuscript nav on done project |
| MT-120 | PASS | Mobile: **Open document navigation** (☰) visible at 390px width |

## Screenshots

- `docs/screenshots/manual/mcp-session-collapsed.png`
- `docs/screenshots/manual/consult-expanded.png` (from prior script run)

## Follow-up (agent or human)

Walk remaining rows in [coverage-matrix.md](coverage-matrix.md) via MCP — especially MT-070–MT-074 (negotiation), MT-100 (draft editor edits), MT-111 (reload), MT-140–MT-144 (errors).
