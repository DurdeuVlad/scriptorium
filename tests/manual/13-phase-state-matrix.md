# Phase × control state matrix

Cross-product of `PHASES` in `frontend/src/lib/phases.js` vs UI controls.  
**E** = enabled, **D** = disabled, **H** = hidden, **R** = read-only, **V** = visible.

Legend for assistant: **Strip** = collapsed 48px; **Open** = expanded drawer (default after project load).

| Control | idle | intake | planning | negotiation | drafting | scrubbing | copyediting | reviewing | review_halt | publishing | finished |
|---------|------|--------|----------|-------------|----------|-----------|-------------|-----------|-------------|------------|----------|
| `#welcome-empty` | V | H | H | H | H | H | H | H | H | H | H |
| `#plan-editor` (center) | H* | V | V | V | V | V | V | V | V | V | V |
| Plan fields editable | — | E† | R/W‡ | E | R | R | R | R | E | R | R |
| `#btn-draft-outline` | H | E§ | H | H | H | H | H | H | H | H | H |
| `#btn-approve-outline` | H | H | H | E | H | H | H | H | H | H | H |
| Export buttons | H | H | H | H | H | H | H | H | H | V¶ | V¶ |
| `#chat-input` | H | E | D‖ | E | D‖ | D‖ | D‖ | D‖ | E | E | E |
| `#btn-send-chat` | H | E | D‖ | E | D‖ | D‖ | D‖ | D‖ | E | E | E |
| `.waiting-panel` (plan) | H | H | V** | H | H | H | H | H | H | H | H |
| Chapter nav items | H | H | H | H | V | V | V | V | V | V | V |
| `[data-artifact="preview"]` | H | H | H | H | V†† | V†† | V†† | V†† | V†† | V†† | V†† |
| `[data-artifact="final_manuscript"]` | H | H | H | H | H | H | H | H | H | V‡‡ | V‡‡ |
| `isPipelineBusy` indicator | H | V§§ | V | H | V | V | V | V | H | H | H |
| Pipeline status "running" copy | H | V | V | H | V | V | V | V | H | H | H |
| Desktop grid 2:5:3 | — | Open | Open | Open | Open | Open | Open | Open | Open | Open | Open |
| Desktop grid collapsed | — | Strip | Strip | Strip | Strip | Strip | Strip | Strip | Strip | Strip | Strip |

\* No project: welcome instead.  
† `isEditablePlanPhase` includes intake; intake may show waiting instead of sections until outline.  
‡ `planning` often busy with 0 sections → waiting panel (MT-058).  
§ `canGeneratePlan`: intake and `intakeStatus !== "not_started"`.  
¶ `canShowExport(phase, manuscript)` — requires finished/publishing **and** manuscript content.  
‖ `pipelineBusy` from hook; chat disabled during automated pipeline except intake consult and review_halt / finished consult.  
\** `isWaitingForOutline` when busy and section count 0.  
†† Visible when manuscript keys exist (implementation in DocumentNav).  
‡‡ When `final_manuscript` present.  
§§ Intake shows busy during consult sub-steps; `publishing` not in `isPipelineBusy` (export/chat allowed).

## Intake sub-states (`intakeStatus`)

| intakeStatus | Draft outline | Consult choices / skip |
|--------------|---------------|-------------------------|
| `not_started` | H | V (first question) |
| `in_progress` | E (if allowed) | V |
| `complete` | E | H (chips may hide) |

## Procedures per phase row

| Phase | Primary procedures |
|-------|-------------------|
| idle | MT-001, MT-002 |
| intake | MT-063, MT-080–MT-084, MT-051–MT-059 |
| planning | MT-058, MT-051 |
| negotiation | MT-070–MT-074, MT-051–MT-057 |
| drafting–reviewing | MT-100–MT-102, MT-067, MT-042 |
| review_halt | MT-103, MT-085, MT-051 |
| publishing / finished | MT-090–MT-097, MT-095, MT-044 |

## Verification checklist

For each phase row, execute one procedure from the row and confirm **E/D/H** matches this table. Mark pass in `coverage-matrix.md` session log.

---
