# MCP persona QA — 2026-06-03

**Orchestrator:** Parent agent (sequential subagents)  
**Environment:** API `http://127.0.0.1:8000`, Vite `http://127.0.0.1:5173`  
**Method:** Five `generalPurpose` subagents, one scenario each, two-pass (in-character → verifier)

| Order | Scenario | Persona | Subagent result |
|-------|----------|---------|-----------------|
| 1 | UX-101 | P1 Maya | PARTIAL |
| 2 | UX-104 | P4 Sam | PARTIAL |
| 3 | UX-105 | P5 Alex | PARTIAL (S2 layout) |
| 4 | UX-106 | P6 Elena | PARTIAL FAIL |
| 5 | UX-201 | P7 Robin | PASS |

---

## UX-101 — Maya (P1)

### Pass 1

| Goal | Result | Sev | User-voice note |
|------|--------|-----|-----------------|
| Start without help | PASS | — | Welcome card + *New project* obvious |
| Describe book | PASS | — | Book domain + gardening prompt |
| Find helper + answer | PASS | — | *General public* chip filled Audience |
| Path to plan/outline | PASS | S2 | *Draft outline* visible; stepper jargon |
| Collapse/reopen helper | PASS | — | × → strip; header *Assistant* restores |

**Verdict:** PARTIAL — succeeds; Consult/Plan/Draft labels and tech audience chips confuse novice.

### Pass 2

| Finding | MT |
|---------|-----|
| Welcome, commission, consult, draft outline CTA, layout 48px strip | MT-002, MT-037, MT-080, MT-063, MT-010/011 PASS |
| Phase stepper jargon | MT-005 S2 |
| Audience chips (*Developers* on gardening book) | MT-083 S2 |

**Screenshots:** `docs/screenshots/manual/ux-101-01-welcome.png` … `ux-101-05-plan-editor.png`

---

## UX-104 — Sam (P4)

### Pass 1

| Goal | Result | Sev | User-voice note |
|------|--------|-----|-----------------|
| Find project list | PASS | S3 | Switcher like last week |
| Identify Halted | PASS | S3 | Badge on API guide |
| Understand why stopped | PASS | S3 | Ticket cards plain language |
| Resolve one via chat | PASS | S3 | *Answer in chat* → token 24h |
| Believe drafting resumes | PASS | S3 | *Resuming pipeline…* banner |

**Verdict:** PARTIAL — task done; **stale gardening chat** after switch; ticket count vs list mismatch.

### Pass 2

| Finding | MT |
|---------|-----|
| Switcher + halted project load | MT-022 PASS (stale chat = partial) |
| Halt UX + resume coherence | **MT-103 FAIL** — other tickets still open UI while pipeline resumes |
| Answer in chat | MT-085 PASS |
| Chat enabled on halt; disabled when running | MT-082 PASS |

**Screenshots:** `docs/screenshots/manual/ux-104-01-switcher-halted.png` … `ux-104-04-pipeline-resuming.png`

---

## UX-105 — Alex (P5) — 390×844 only

### Pass 1

| Goal | Result | Sev |
|------|--------|-----|
| Nav on phone | PASS | — |
| Open chapter + read | PASS | — |
| One chat message | PASS | — |
| Dismiss assistant | PASS | — |
| No horizontal scroll | **FAIL** | **S2** — `scrollWidth` 566 vs 390 (header) |

**Verdict:** PARTIAL — core mobile journey works; header overflow.

### Pass 2

| Finding | MT |
|---------|-----|
| Mobile layout | MT-120 PARTIAL |
| Nav drawer / backdrop | MT-121 PARTIAL |
| Assistant overlay | MT-122 PASS |
| Switcher mobile | MT-123 PASS |
| Draft editor | MT-100 PASS |

**Screenshots:** `ux-105-mobile-chapter.png`, `ux-105-04-assistant-collapsed.png`

---

## UX-106 — Elena (P6)

### Pass 1

| Goal | Result | Sev |
|------|--------|-----|
| Find Done book | PASS | — |
| Locate export | PASS | — |
| Click PDF | PARTIAL | Export failed: Connection closed |
| Ask if ready to download | **FAIL** | **S1** — consultant says pipeline running on **Done** project |

**Verdict:** PARTIAL FAIL — export infra + **stale consult state** on WebSocket.

### Pass 2

| Finding | MT |
|---------|-----|
| Export visible | MT-090, MT-092 PASS |
| PDF export | MT-093 FAIL |
| Error surfaced | MT-094 PASS |
| Post-finish consult | **MT-095 FAIL** |
| Book-scale nav | MT-097 PASS |

**Screenshots:** `ux-106-01-done-export.png`

**Note:** Isolated `consult_turn` with correct phase returns good export guidance; live WS likely missing `bind_project` on switch.

---

## UX-201 — Robin (P7)

### Pass 1

| Goal | Result | Sev |
|------|--------|-----|
| Double-click Start consultation | PASS | S3 |
| One project in list | PASS | — |

**Verdict:** YES — button locks *Starting…*; no duplicate project.

### Pass 2

| Finding | MT |
|---------|-----|
| Disabled + spinner during submit | MT-038 PASS |
| Single project (API + switcher) | MT-038 PASS |

**Screenshots:** `ux-201-double-commission.png`

---

## Summary

| ID | Pass 1 | Top issue | Priority |
|----|--------|-----------|----------|
| UX-101 | PARTIAL | Phase jargon; audience chips | P2 |
| UX-104 | PARTIAL | Cross-project chat bleed; ticket UI on resume | **P0** |
| UX-105 | PARTIAL | Header horizontal scroll on 390px | P1 |
| UX-106 | PARTIAL FAIL | False “pipeline running” on Done; PDF MCP | **P0** |
| UX-201 | PASS | — | — |

## Recommended fixes

1. **P0** Clear or rebind assistant conversation on `loadProject` / WS `bind_project` before consult (UX-104 stale chat, UX-106 MT-095).
2. **P0** After ticket resolution, sync ticket list + open count with pipeline state (MT-103).
3. **P1** Mobile header: truncate/wrap project name so `scrollWidth` ≤ viewport (MT-120).
4. **P2** Novice copy: plain-language phase labels or tooltips (UX-101 / MT-005).

## Not run this session

UX-102, UX-103, UX-107, UX-202–207, HARD-301–305 — queue for next sequential subagent batch.
