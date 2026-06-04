# Adversarial and stress scenarios (harder)

Procedure prefix: **UX-2xx** / **HARD-###**  
Persona **P7** (Robin) unless noted. Run in a browser with intentional misuse; map findings to `MT-###` where applicable.

---

## UX-201 — Double commission storm (P7)

**Goals**

1. Open new project modal; fill prompt.  
2. Click primary start button **twice quickly** (or click again while spinner visible).  
3. Count projects created in switcher list.

**Expected:** One project; button disabled while submitting.

**Failure:** S0 duplicate projects; S1 duplicate consult threads.

**Verifier:** MT-038, API `GET /projects` name dedup.

---

## UX-202 — Project switch during load (P7)

**Goals**

1. Start switching between two large projects rapidly (3+ switches in 10s).  
2. Observe overlay, wrong-phase badges, mixed chat.

**Expected:** Last selected project wins; no cross-contaminated chat/plan.

**Failure:** S0 chat from project A on project B; S1 infinite overlay.

**Verifier:** MT-022, MT-024

---

## UX-203 — Modal escape hatch (P7)

**Goals**

1. Open new project modal.  
2. Try: ×, Cancel, backdrop click, Escape key (if supported).  
3. Re-open modal; confirm fields reset or sane.

**Expected:** All escape paths close modal; no pointer-events trap.

**Failure:** S0 invisible blocking overlay remains.

**Verifier:** MT-031–MT-033

---

## UX-204 — Chat spam and Enter (P7)

**Goals**

1. On intake project, send 5 messages rapidly (Enter spam).  
2. Note ordering, duplicates, disabled input behavior.

**Expected:** Ordered bubbles; input debounced/disabled appropriately when busy.

**Failure:** S1 duplicate sends; S0 WS errors visible to user as silence.

**Verifier:** MT-080–MT-082, console via `browser_console_messages`

---

## UX-205 — Collapse assistant during consult (P1+P7)

**Goals**

1. Mid-consult, collapse assistant (× or strip).  
2. As Maya, try to find chat again using only header/strip affordances.  
3. Attempt draft outline while collapsed.

**Expected:** Strip or Assistant toggle restores chat; draft outline still reachable.

**Failure:** S1 user believes chat lost; S0 cannot reopen.

**Verifier:** MT-010, MT-061, MT-063

---

## UX-206 — Delete active project (P4 under stress)

**Goals**

1. Note active project name.  
2. Delete **active** project via switcher ×; confirm dialog Accept.  
3. Describe resulting screen.

**Expected:** Welcome or safe fallback; no JS crash; localStorage cleared.

**Failure:** S0 blank broken shell; S1 still shows deleted project content.

**Verifier:** MT-023

---

## UX-207 — Export without artifact server (P6 + operator knowledge)

**Precondition:** Stop artifact MCP / break export endpoint (operator action).

**Goals**

1. On finished project, click PDF export.  
2. Read error as Elena — is it actionable?

**Expected:** Plain-language failure; UI not stuck exporting forever.

**Failure:** S1 spinner forever; S2 stack trace in UI.

**Verifier:** MT-094, MT-143

---

## HARD-301 — Long consult, late outline (P2)

**Goals**

1. New technical-docs project; answer minimum consult.  
2. Draft outline; wait full timeout (up to 3 min) without refreshing.  
3. If outline >6 sections, verify scroll in plan + nav.

**Expected:** Outline completes; waiting state clears.

**Failure:** S0 timeout with no error message.

**Verifier:** MT-058, MT-063

---

## HARD-302 — Negotiation edit race (P2)

**Goals**

1. In negotiation, edit plan title in center **and** send chat patch within 5s.  
2. Reload page once.  
3. Verify single source of truth (no half-old title).

**Expected:** Convergent plan after reload.

**Failure:** S1 title reverts unexpectedly; S0 409 with no UI message.

**Verifier:** MT-051, MT-073, MT-111

---

## HARD-303 — Book vs article expectation (P1 Maya)

**Goals**

1. Commission **book** domain with "full book 12 chapters" prompt.  
2. Complete pipeline through approve (may use existing Done book as reference for export shape).  
3. Judge: does final output **feel** like a book vs one short article?

**Expected:** Multi-chapter nav; final manuscript substantial.

**Failure:** S1 user asked for book, got 1 short chapter only.

**Verifier:** MT-097, MT-035, orchestrator hints (verifier pass only)

---

## HARD-304 — Phase stepper lie detection (P4)

**Goals**

1. For each fixture phase (intake, negotiation, halted, done), record stepper step vs switcher badge.  
2. Flag mismatches where stepper says Done but user still sees negotiate controls.

**Expected:** Stepper matches `PHASES` mapping.

**Failure:** S1 misleading stepper active step.

**Verifier:** MT-005, [13-phase-state-matrix.md](13-phase-state-matrix.md)

---

## HARD-305 — Accessibility snapshot audit (any persona)

**Goals**

1. On welcome + project loaded, review snapshots for:  
   - Unlabeled icon-only buttons  
   - Duplicate "Approve outline" without context  
   - Focus order illogical (tab simulation if MCP supports)

**Expected:** Primary actions have accessible names (Playwright snapshot shows names).

**Failure:** S1 control only identified as "button" with no name.

**Verifier:** MT-003, MT-070
