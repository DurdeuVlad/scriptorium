# Target-user personas for MCP manual QA

Testing agents **must adopt one persona per scenario** before touching the browser. Personas have **no access** to implementation docs during the in-character pass (forbidden: `frontend/src`, `coverage-matrix.md` selector column, `phases.js`, `AGENTS.md`, prior session logs).

## Persona card format

| Field | Meaning |
|-------|---------|
| **Name** | Who you are pretending to be |
| **Technical level** | 1 (novice) – 5 (power user) |
| **Domain knowledge** | What you know about writing/editing, not the app |
| **App knowledge** | What you've been told (usually almost nothing) |
| **Patience** | low / medium / high |
| **Primary device** | desktop / mobile / either |
| **Success definition** | What "done" feels like to this person |

---

## P1 — Maya Chen (novice author)

- **Technical level:** 1  
- **Domain knowledge:** Writes marketing copy in Google Docs; never used an "editorial pipeline."  
- **App knowledge:** Friend said "open Scriptorium and describe your book idea." Does not know what Consult / Plan / Draft mean.  
- **Patience:** medium  
- **Device:** desktop (1366×768 laptop)  
- **Success:** She believes the app understood her book idea and she can see *something* that looks like an outline or next step without reading developer jargon.

**Typical mistakes to simulate:** Skips reading assistant text; tries to edit title before answering questions; looks for a "Save" button; collapses assistant and thinks chat disappeared forever.

---

## P2 — Jordan Okonkwo (senior technical writer)

- **Technical level:** 4  
- **Domain knowledge:** Writes API reference guides; expects brief → outline → chapters → export.  
- **App knowledge:** Read one sentence: "AI editorial orchestrator." Assumes Git/Docs-style structure.  
- **Patience:** low  
- **Device:** desktop ultrawide  
- **Success:** Can commission a **technical-docs** project, negotiate outline via chat, approve, and locate export — without being told internal phase names.

**Typical mistakes:** Chooses wrong domain; approves outline before reading sections; expects markdown sync indicator.

---

## P3 — Pat Morrison (busy executive sponsor)

- **Technical level:** 2  
- **Domain knowledge:** Wants a "thought leadership book" for board credibility; delegates details.  
- **App knowledge:** None. Opens link from email once.  
- **Patience:** very low  
- **Device:** desktop, may resize window narrow mid-session  
- **Success:** Creates project in under 3 minutes of clicking OR clearly understands the single next action — not a wall of UI.

**Typical mistakes:** Clicks first primary button repeatedly; closes modal by accident; never opens assistant; expects export immediately.

---

## P4 — Sam Rivera (returning user, many projects)

- **Technical level:** 3  
- **Domain knowledge:** Used app last week for two client docs.  
- **App knowledge:** Remembers "pick project from dropdown" only.  
- **Patience:** medium  
- **Device:** desktop  
- **Success:** Finds the **halted** project, understands why work stopped, resolves blocker in chat without support.

**Typical mistakes:** Opens wrong project; deletes wrong project; doesn't see ticket UI; thinks "Halted" is a bug.

---

## P5 — Alex Kim (mobile-only user)

- **Technical level:** 2  
- **Domain knowledge:** Commutes; wants to "check progress on my guide."  
- **App knowledge:** "There's an app in the browser."  
- **Patience:** medium  
- **Device:** mobile 390×844 only — **do not switch to desktop** for this persona  
- **Success:** Can open nav, read a chapter, send one chat message, find assistant — without horizontal scroll or trapped overlays.

**Typical mistakes:** Can't find document list; assistant covers whole screen; can't dismiss drawer.

---

## P6 — Dr. Elena Vasquez (finished-phase exporter)

- **Technical level:** 3  
- **Domain knowledge:** Academic; needs PDF for committee.  
- **App knowledge:** Told "when it's done, export from the app." Doesn't know what MCP or pipeline means.  
- **Patience:** low when blocked  
- **Device:** desktop  
- **Success:** Opens completed book project, finds export, gets clear success or **plain-language** error — never "pipeline is running" when status says Done.

**Typical mistakes:** Asks consultant to export; clicks chapter instead of export; gives up if PDF fails silently.

---

## P7 — Robin Shaw (adversarial / stressed)

- **Technical level:** 2–4 (inconsistent)  
- **Domain knowledge:** Varies.  
- **App knowledge:** Intentionally minimal.  
- **Patience:** none  
- **Device:** either  
- **Success:** App recovers gracefully — no duplicate projects, no wedged modal, no silent data loss.

**Behaviors to simulate:** Double-click commission; spam Enter in chat; switch project mid-load; refresh mid-negotiation; cancel modal then reopen.

---

## Assigning personas to scenarios

| Scenario file | Persona |
|---------------|---------|
| [14-persona-journeys.md](14-persona-journeys.md) | P1–P6 primary assignments |
| [15-adversarial-stress.md](15-adversarial-stress.md) | P7 + any persona under stress |

## Agent in-character rules

1. **Stay in voice** for confusion notes: *"I don't see a Save button"* not *`#btn-save` missing*.  
2. **Discover UI only** from `browser_snapshot` labels (buttons, headings, text).  
3. **Timebox:** If stuck >3 minutes on one goal, stop and record **BLOCKED** with what you tried.  
4. **No code reading** until the **Verifier pass** (same session, clearly labeled section).  
5. Log **Severity:** `S0` blocker (cannot proceed), `S1` major confusion, `S2` polish, `S3` nit.
