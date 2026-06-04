# Persona journeys (harder, discovery-first)

Procedure prefix: **UX-###** (user experience).  
**In-character pass:** persona only — no selectors, no source code.  
**Verifier pass:** map findings to **MT-###** / file:line if needed.

---

## UX-101 — First-time book author (P1: Maya)

**Persona:** P1 Maya Chen  
**Briefing (only this):** "You want a full book about urban gardening for beginners. A friend sent you http://127.0.0.1:5173. You have never used Scriptorium."

### In-character goals (in order)

1. Figure out how to start a new document without help docs.  
2. Describe your book in your own words when prompted.  
3. Find where the "AI helper" lives and answer **at least one** question (chip, skip, or type).  
4. Discover how to get from "just talking" to "something that looks like a plan or outline" — without being told button names.  
5. Try to make the helper panel bigger or find it again if you close it.

### Expected (user-visible)

- Obvious entry: welcome or equivalent invites new project.  
- After starting, assistant is discoverable within 60s without reading source code.  
- User can articulate next step ("I should keep chatting" OR "I should click the obvious primary action").  
- No large empty dark column on the right (layout trust).

### Failure signals (UX)

- S0: No path to start project.  
- S1: Assistant hidden with no affordance to reopen.  
- S1: User believes app froze (no feedback during wait).  
- S2: Jargon-only labels with no plain explanation.

### Verifier mapping

| User goal | Likely MT |
|-----------|-----------|
| Start project | MT-002, MT-037 |
| Chat | MT-080–MT-084 |
| Outline CTA | MT-063 |
| Layout | MT-010, MT-011 |

---

## UX-102 — Technical writer under time pressure (P2: Jordan)

**Persona:** P2 Jordan Okonkwo  
**Briefing:** "You need an API integration guide for your company's Tasks API. Deadline Friday. First visit."

### In-character goals

1. Create project choosing the mode that sounds like **documentation**, not fiction.  
2. Complete consult quickly (chips OK) and trigger outline generation.  
3. When sections appear, change **one** outline item via chat (e.g. add Security section) — discover how without docs.  
4. Find how to "lock" or approve the outline to start drafting.  
5. If approve works, confirm chapters appear in the side list.

### Expected

- Domain choice affects tone/questions (technical-docs).  
- Approve control discoverable in center or assistant (not only one hidden corner).  
- Phase stepper matches user mental model (not stuck on Consult forever).

### Failure signals

- S0: Cannot reach negotiation with outline sections.  
- S1: Approve not found though outline exists.  
- S1: Chat disabled with no explanation while status still says consult.

### Verifier mapping

MT-035, MT-063, MT-070–MT-072, MT-101

---

## UX-103 — Executive two-minute attempt (P3: Pat)

**Persona:** P3 Pat Morrison  
**Briefing:** "Board wants a short thought-leadership piece on AI regulation. You have 2 minutes before another meeting."

### In-character goals

1. Open site cold; do **not** read all copy — scan and click.  
2. Start *something* with minimal typing (short prompt OK).  
3. Note every extra click that feels "enterprise software" vs "get me started."  
4. Try to leave (close modal / back out) and re-enter without breaking state.

### Expected

- Commissioning ≤3 fields visible without scroll on 1280×720.  
- One clear primary CTA per screen.  
- Cancel/close recovers to welcome without ghost overlays.

### Failure signals

- S1: >5 required fields before any progress.  
- S0: Modal trap (cannot exit).  
- S2: Duplicate competing primary buttons.

### Verifier mapping

MT-030–MT-033, MT-031

---

## UX-104 — Return user: fix halted project (P4: Sam)

**Persona:** P4 Sam Rivera  
**Briefing:** "Last week you started an API guide here. Email says 'review halted — action needed.' You don't remember ticket IDs."

### In-character goals

1. Open app; find project list without documentation.  
2. Identify which project is **stopped** (badge/word: Halted or similar).  
3. Open it; find why it stopped in **plain language**.  
4. Resolve **one** open issue via chat (discover Answer flow yourself).  
5. State whether you believe drafting will resume.

### Expected

- Halted status visible in switcher.  
- Ticket list explains what's wrong in non-developer terms.  
- Chat usable for resolution; not "pipeline is running" on halt.

### Failure signals

- S0: Cannot find halted project among 10+ entries.  
- S1: Tickets show but no actionable path.  
- S1: Misleading busy message on halt.

### Verifier mapping

MT-022, MT-103, MT-085, MT-082

---

## UX-105 — Mobile progress check (P5: Alex)

**Persona:** P5 Alex Kim  
**Viewport:** 390×844 **only** for entire scenario.

**Briefing:** "Check how your developer guide looks on your phone during commute."

### In-character goals

1. Load site on phone; find menu for chapters/documents.  
2. Open any chapter and read first screen without pinching zoom.  
3. Open assistant; send one short message.  
4. Collapse/close assistant; get back to document.

### Expected

- Hamburger or obvious nav affordance.  
- No unreadable 8px text; touch targets feel tappable.  
- Assistant overlay dismissible.

### Failure signals

- S0: Cannot reach chapter list on mobile.  
- S1: Assistant traps viewport.  
- S2: Horizontal scroll on main content.

### Verifier mapping

MT-120–MT-123, MT-100

---

## UX-106 — Done but needs PDF (P6: Elena)

**Persona:** P6 Dr. Elena Vasquez  
**Briefing:** "Colleague said your AI agents book is finished in Scriptorium. You need a PDF for a committee tonight."

### In-character goals

1. Find the **done** / complete project (name mentions book or AI).  
2. Locate export without reading README.  
3. Click PDF (or only export offered); read result message aloud as the persona.  
4. Ask assistant "Is my book ready to download?" — judge reply helpfulness.

### Expected

- Export visible when manuscript exists.  
- Status says Done (not ambiguous Publishing).  
- Consultant helps with export steps, not false "pipeline running."

### Failure signals

- S0: No export on finished project with chapters.  
- S1: Consultant blocks with pipeline message when Done.  
- S1: Error text mentions MCP/artifact-server jargon only.

### Verifier mapping

MT-090–MT-094, MT-095, MT-097

---

## UX-107 — Wrong assumptions stress (P2 + P1 mix)

**Persona:** Start as P1, mid-scenario switch mindset to "I thought this was Google Docs"

### In-character goals

1. Try to edit center page like a word processor without selecting nav items.  
2. Try browser Refresh expecting autosave (F5).  
3. Try to find File → Export (doesn't exist).  
4. Document what the app **should** have said to prevent confusion.

### Expected

- Plan fields editable when appropriate; clear read-only when not.  
- Refresh restores project (localStorage), not blank slate.  
- No fake menu habits rewarded with silent failure.

### Failure signals

- S1: Data loss on refresh.  
- S1: Edits appear saved but lost on switch project.  
- S2: No read-only hint when PATCH would 409.

### Verifier mapping

MT-110–MT-111, MT-067, MT-130
