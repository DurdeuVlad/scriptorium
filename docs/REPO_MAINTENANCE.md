# Repository maintenance notes

Internal notes on what was removed from the public tree and what remains optional to prune later.

## Removed (2026-06 cleanup)

### Penpot design MCP experiment

Did not become the sustained design workflow. Removed:

- `docs/PENPOT_MCP.md`, `docs/design/SCRIPTORIUM_PENPOT_BRIEF.md`, `docs/design/penpot-execute-*.js`
- `scripts/penpot_mcp_*.py`, `scripts/penpot_mcp_*.ps1`, `scripts/start_penpot_mcp.ps1`, `scripts/open_penpot_plugin_connect.ps1`
- Penpot entries from `.cursor/mcp.json.example`

**Kept:** [design/TOKENS.md](design/TOKENS.md) as the CSS token reference for the React app.

### Cursor-agent-as-contributor QA process

Contributor docs no longer require a Cursor agent + Playwright MCP session logs. Removed:

- `tests/manual/MCP_AGENT_WORKFLOW.md`
- Session artifacts: `tests/manual/MCP_SESSION_*.md`, `MCP_PERSONA_SESSION_*.md`, `MCP_PROPOSAL_SESSION_*.md`

**Canonical QA now:** `npm run ui-smoke` / `ui-consult-qa` plus walking [tests/manual/README.md](../tests/manual/README.md).

### Experimental UI QA scripts

- `frontend/scripts/ui-proposal-qa.mjs`, `ui-waiting-qa.mjs`
- `scripts/seed_proposal_qa_phase.py`
- Duplicate root `scripts/ui-smoke.mjs` (use `frontend/scripts/` only)

Proposal-flow procedures (`MT-096`–`MT-101` in [06-assistant-consult.md](../tests/manual/06-assistant-consult.md)) remain documented; automate via `ui-consult-qa` or manual browser walks.

## Still in repo (intentional)

| Path | Why keep |
|------|----------|
| `scripts/reconcile_all_phases.py` | Called by `ui-consult-qa` for phase consistency |
| `scripts/ensure_review_halt_fixture.py` | Local fixture for review-halt manual tests |
| `docs/screenshots/manual/` | Reference captures for UI regressions |
| `.cursor/mcp.json.example` | Optional Playwright MCP for IDE users only |
| `tests/manual/PERSONAS.md`, `14-*`, `15-*` | Human persona/stress specs (not agent session logs) |

## Candidates for future removal (not done yet)

Review when touching these areas:

| Item | Rationale |
|------|-----------|
| `.playwright-mcp/` (local only, gitignored) | Browser MCP debug dumps; safe to delete locally anytime |
| `docs/phases/*.md` under `docs/phases/` | Historical phase QA reports; archive or move to wiki if noisy |
| Duplicate procedure IDs | e.g. `MT-096` used in both `06-assistant-consult.md` and `09-export-finish.md` — consolidate IDs in a doc pass |
| `PRODUCTION_READINESS_PLAN.md` vs `ROADMAP.md` overlap | Merge when status story stabilizes |
| Full `evals/` tree | Keep until case-01 baselines are published; then trim obsolete rubric drafts |
| `mcp/` servers if unused in your deployment | Framework artifact/guide servers are product surface, not experiments |

## Contributor UI checklist (current)

1. [design/TOKENS.md](design/TOKENS.md)
2. Implement in `frontend/src/`
3. `cd frontend && npm run ui-smoke && npm run ui-consult-qa`
4. Spot-check [coverage-matrix.md](../tests/manual/coverage-matrix.md) for your change area
