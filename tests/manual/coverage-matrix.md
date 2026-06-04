# Coverage matrix — control → procedure

Every user-facing control in `frontend/src` maps to at least one procedure ID. Phase-specific rules reference [13-phase-state-matrix.md](13-phase-state-matrix.md).

| Control / surface | Selector / attribute | Procedure(s) | Phases |
|-------------------|---------------------|----------------|--------|
| Welcome empty state | `#welcome-empty` | MT-001 | idle (no project) |
| Welcome new project | `#btn-welcome-new` | MT-002, MT-020 | idle |
| Header brand / title | `.header-bar` | MT-003 | all |
| Mobile nav menu | `.header-menu-btn` | MT-004, MT-120 | ≤900px |
| Assistant toggle (header) | `#assistant-toggle` | MT-010, MT-011 | all |
| Phase stepper (display) | `.phase-stepper` | MT-005 | all |
| Project switcher trigger | `#project-switcher .project-switcher-trigger` | MT-021 | all |
| New project (menu) | `#btn-new-project` | MT-020 | all |
| Select project | `[data-project-id]` | MT-022 | all |
| Delete project | `.btn-delete-project` | MT-023 | all |
| Load overlay | `.project-loading-overlay` | MT-024 | switch/load |
| New project modal | `#new-project-modal` | MT-030 | modal open |
| Modal close × | `#new-project-modal .btn-ghost` | MT-031 | modal |
| Modal backdrop click | `.modal-backdrop` | MT-032 | modal |
| Modal Cancel | `.modal-footer .btn-secondary` | MT-033 | modal |
| Commissioning prompt | `#new-project-prompt` | MT-034 | modal |
| Domain radios | `input[name="domain"]` | MT-035 | modal |
| Project name | `#new-project-name` | MT-036 | modal |
| Commission project | `#btn-commission-project` | MT-037 | modal |
| Document nav drawer | `#document-nav-drawer` | MT-004, MT-120 | mobile |
| Nav backdrop | `.nav-backdrop` | MT-121 | mobile |
| Artifact nav (empty) | `#artifact-nav.document-nav-empty` | MT-040 | no project |
| Plan nav item | `[data-artifact="plan"]` | MT-041 | project loaded |
| Chapter nav | `[data-artifact="{chapterKey}"]` | MT-042 | drafting+ |
| Preview nav | `[data-artifact="preview"]` | MT-043 | manuscript exists |
| Final manuscript nav | `[data-artifact="final_manuscript"]` | MT-044 | finished |
| Center workspace | `#center-workspace` | MT-045 | all |
| Preview panel | `#preview-panel` | MT-046 | preview selected |
| Plan editor root | `#plan-editor` | MT-050 | plan view |
| Plan title | `#plan-title` | MT-051 | editable phases |
| Plan goal | `#plan-goal` | MT-052 | editable |
| Plan audience | `#plan-audience` | MT-053 | editable |
| Plan tone | `#plan-tone` | MT-054 | editable |
| Add section | `#plan-editor .btn-secondary` (Add section) | MT-055 | editable |
| Move section up/down | `.btn-ghost` in section row | MT-056 | editable |
| Remove section | `.danger` in section row | MT-057 | editable |
| Waiting panel (outline) | `.waiting-panel` | MT-058 | busy, 0 sections |
| Save status badge | `.save-status-badge` | MT-059 | plan edits |
| Plan read-only (drafting+) | `#plan-title` disabled | MT-067 | drafting, scrubbing, copyediting, reviewing |
| Assistant strip (collapsed) | `.assistant-strip` | MT-010, MT-011 | collapsed |
| Strip expand | `.assistant-strip-toggle` | MT-010 | collapsed |
| Assistant drawer (open) | `.assistant-drawer.open` | MT-060 | expanded |
| Collapse assistant | `[aria-label="Collapse assistant"]` | MT-061 | expanded |
| Pipeline status | `.status-message` | MT-062 | all |
| Draft outline | `#btn-draft-outline` | MT-063 | intake |
| Approve outline (drawer) | `#btn-approve-outline-drawer` | MT-070 | negotiation |
| Approve outline (workspace) | `#btn-approve-outline` | MT-071 | negotiation |
| Negotiation footer | `#negotiation-controls` | MT-072 | negotiation |
| Export DOCX (drawer) | drawer `.btn-secondary` (DOCX) | MT-090 | finished |
| Export PDF (drawer) | drawer `.btn-secondary` (PDF) | MT-091 | finished |
| Export DOCX (workspace) | workspace `.btn-secondary` (DOCX) | MT-092 | finished |
| Export PDF (workspace) | workspace `.btn-secondary` (PDF) | MT-093 | finished |
| Export status text | `.export-status` | MT-094 | export |
| Chat input | `#chat-input` | MT-080 | consult |
| Send chat | `#btn-send-chat` | MT-081 | consult |
| Enter in chat | `#chat-input` (keydown) | MT-082 | consult |
| Consult choice chips | `.consult-choice-btn` | MT-083 | intake |
| Skip question | `.consult-skip-btn` | MT-084 | intake |
| Ticket answer | `.ticket-answer-btn` | MT-085 | review_halt |
| Draft editor | `.draft-editor` | MT-100 | chapter view |
| Browser Back/Forward | — | **N/A** MT-130 | — |
| WS `start_run` (UI) | — | **N/A** MT-131 | — |

## Persona and stress scenarios (UX / HARD)

Not control-by-control; run **in-character** then **verifier**. See [PERSONAS.md](PERSONAS.md).

| ID | Persona | Primary user goal | Maps to MT (verifier) |
|----|---------|-------------------|------------------------|
| UX-101 | P1 Maya | First book, discover assistant | MT-002, MT-080+, MT-010/011 |
| UX-102 | P2 Jordan | Tech-docs → approve | MT-035, MT-063, MT-070+ |
| UX-103 | P3 Pat | 2-minute start | MT-030–033 |
| UX-104 | P4 Sam | Fix halted project | MT-022, MT-085, MT-103 |
| UX-105 | P5 Alex | Mobile chapter + chat | MT-120+, MT-100 |
| UX-106 | P6 Elena | PDF from Done project | MT-090+, MT-095 |
| UX-107 | P1/P2 mix | Wrong mental model (Docs) | MT-110, MT-067 |
| UX-201 | P7 | Double commission | MT-038 |
| UX-202 | P7 | Rapid project switch | MT-022, MT-024 |
| UX-203 | P7 | Modal escape | MT-031–033 |
| UX-204 | P7 | Chat spam | MT-080–082 |
| UX-205 | P1+P7 | Assistant collapse | MT-010, MT-061 |
| UX-206 | P4 | Delete active project | MT-023 |
| UX-207 | P6 | Export failure copy | MT-094, MT-143 |
| HARD-301 | P2 | Long outline wait | MT-058, MT-063 |
| HARD-302 | P2 | Plan + chat race | MT-051, MT-073, MT-111 |
| HARD-303 | P1 | Book vs article | MT-097, MT-035 |
| HARD-304 | P4 | Stepper vs badge | MT-005, MT-013 |
| HARD-305 | any | A11y snapshot names | MT-003, MT-070 |

## Playwright script mapping

| Script | Procedure IDs exercised |
|--------|-------------------------|
| `ui-smoke.mjs` | MT-001, MT-020, MT-037, MT-041, MT-060, MT-063 |
| `ui-consult-qa.mjs` | MT-022, MT-063, MT-070–MT-085, MT-011, MT-090+ |

Persona scenarios are **MCP-only** (no headless script).
