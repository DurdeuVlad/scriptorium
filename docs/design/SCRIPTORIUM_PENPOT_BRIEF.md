# Scriptorium — Penpot design brief

Use this document when iterating in Penpot **before** changing React/CSS. Aligns with the hosted UI plan (writing IDE: Projects → Plan → Manuscript → Publish) and UX rules from accessibility-first, editorial-density guidelines.

## Product mental model

| Zone | User question | Primary content |
|------|----------------|-----------------|
| Left rail | What am I working on? | Projects, artifact tree |
| Center | What is the plan / draft / preview? | Plan \| Draft \| Preview tabs |
| Right rail | What is the pipeline doing? | Phase, steps, chat, Approve |

Non-technical users must read the **full outline and brief** before Approve. Chapters must survive page refresh (disk-backed artifacts).

---

## Canvas and grid

- **Artboard:** Desktop `1440 × 900` (primary). Optional `390 × 844` mobile (post-MVP drawer).
- **Columns:** 12-column grid, `24px` margin, `16px` gutter.
- **Layout widths:**
  - Left rail: `240px` fixed
  - Center: fluid (`min 640px`)
  - Right assistant: `320px` fixed

---

## Design tokens (target — replace generic purple AI aesthetic)

Current dev CSS uses purple accent (`#a855f7`). Penpot should define the **target** system below; implementation follows Penpot export.

### Color

| Token | Hex | Use |
|-------|-----|-----|
| `bg/primary` | `#0d0e12` | App background |
| `bg/secondary` | `#161821` | Panels, sidebars |
| `bg/tertiary` | `#1f2230` | Cards, inputs |
| `border/default` | `#2a2d3d` | Dividers |
| `text/primary` | `#f3f4f6` | Headings, body |
| `text/secondary` | `#9ca3af` | Meta, labels |
| `text/muted` | `#6b7280` | Placeholders |
| `accent/default` | `#d4a574` | Primary actions (warm manuscript gold) |
| `accent/hover` | `#e8c9a0` | Hover |
| `accent/subtle` | `rgba(212, 165, 116, 0.12)` | Selected nav, chips |
| `success` | `#10b981` | Done phase |
| `warning` | `#f59e0b` | Negotiation |
| `danger` | `#ef4444` | Halt / errors |

Contrast: body text on `bg/secondary` ≥ **4.5:1**. Accent buttons: gold on dark with **≥ 3:1** for large text / UI components.

### Typography

| Role | Family | Size | Weight | Line height |
|------|--------|------|--------|-------------|
| Display / app title | Outfit | 20px | 600 | 1.2 |
| Section title | Outfit | 16px | 600 | 1.3 |
| Body / Plan prose | Outfit | 15px | 400 | 1.55 |
| UI label | Outfit | 12px | 500 | 1.4 |
| Mono / IDs | Fira Code | 13px | 400 | 1.5 |

Plan tab: **15–16px prose**, not all-caps. Chapter IDs in mono at 12px muted.

### Spacing & radius

- Base unit: `4px`
- Panel padding: `16px`
- Section gap: `24px`
- Input/button radius: `8px`
- Card radius: `10px`

### Elevation

Prefer **borders + background step** over heavy shadows. One soft shadow only for modals: `0 8px 32px rgba(0,0,0,0.4)`.

---

## Frames to create in Penpot

Create a file **Scriptorium — Product UI v1** with these pages:

### Page 1: Shell — Negotiation

Components:

1. **Header bar** (full width)
   - Logo wordmark “Scriptorium”
   - Project name dropdown (truncated)
   - Phase badge: `Negotiation` (warning chip)
   - Optional stepper: Intake → **Plan** → Draft → Review → Done

2. **Left rail — Artifacts**
   - `+ New` primary button
   - Group **Plan**: row “Brief & Outline” (selected state)
   - Group **Chapters**: empty state copy “Chapters appear after approval”
   - Collapsible project list above or below artifacts (match current app)

3. **Center — Plan tab (default in negotiation)**
   - Tab bar: **Plan** | Draft | Preview (Plan active)
   - Brief card: Title, Goal, Audience, Tone, Constraints (labeled fields)
   - Outline list: 6+ rows, each `section_id` + title + one-line goal
   - Empty Draft/Preview not shown on this frame

4. **Right rail — Assistant**
   - Pipeline step list (vertical)
   - Chat transcript area
   - Sticky footer: **Approve outline** (primary), secondary “Ask editor…”

### Page 2: Shell — Drafting

- Plan tab inactive; **Draft** active
- Left: Plan row + Chapter 1–4 with active chapter highlight
- Center: markdown editor chrome (toolbar optional v2), word count footer
- Right: status “Drafting section_02…” + chat

### Page 3: Shell — Preview

- **Preview** tab: rendered markdown read-only (use placeholder lorem structured as headings)
- Export row in sidebar: `final_manuscript`

### Page 4: Components

Build as Penpot components:

- `Button/Primary`, `Button/Secondary`, `Button/Ghost`
- `Tab/Active`, `Tab/Inactive`
- `NavItem/Default`, `NavItem/Selected`
- `PhaseBadge/*` (idle, negotiation, drafting, done)
- `BriefField/Label+Value`
- `OutlineRow/Default`, `OutlineRow/Active`
- `ChatBubble/System`, `ChatBubble/User`
- `Input/Text`, `Input/Textarea`

---

## UX checklist (must pass in design review)

- [ ] Outline readable without scrolling the assistant panel (center Plan owns content)
- [ ] Approve is visible but not more prominent than outline content
- [ ] Touch targets ≥ 44px for sidebar rows and tabs (mobile frame later)
- [ ] Focus ring visible on interactive elements (2px accent outline)
- [ ] Empty states for: no projects, no chapters, no brief yet
- [ ] Loading: skeleton for outline rows during planning phase
- [ ] Error: inline banner in assistant rail, not alert-only in console

---

## Mapping Penpot → code (after sign-off)

| Penpot component | React / CSS |
|------------------|-------------|
| Shell layout | `App.jsx` grid, `App.css` |
| Plan content | `PlanPanel.jsx` |
| Tokens | `frontend/src/index.css` `:root` |
| Phase badge | `PHASE_DOT` / header badge |

Do not implement token changes until Penpot frame is approved (or export specs copied into `docs/design/TOKENS.md`).

---

## Agent prompts for Penpot MCP (after connect)

Read-only first:

1. “Give a high-level overview of the current page.”
2. “List components on this page.”

Then build:

3. “Create a 1440×900 frame named Shell — Negotiation using the token colors in the brief: dark editorial background, gold accent #d4a574, Outfit typography.”
4. “Add a left sidebar 240px with artifact groups Plan and Chapters per SCRIPTORIUM_PENPOT_BRIEF.md.”
5. “Add center Plan tab with Brief card and Outline list (6 sections).”
6. “Add right 320px assistant column with Approve outline primary button.”

Iterate:

7. “Increase contrast on outline body text to meet 4.5:1 on panel background.”
8. “Add component variants for phase badges: negotiation, drafting, done.”

---

## References

- Plan layout: [hosted_ui plan Phase 4](../../.cursor/plans/) (product UI target)
- Runtime UI: `frontend/src/App.jsx`, `frontend/src/components/PlanPanel.jsx`
- UX priorities: accessibility → touch → layout → typography (ui-ux-pro-max)
- Visual taste: editorial density, single accent, no purple gradient clichés (design-taste-frontend)
