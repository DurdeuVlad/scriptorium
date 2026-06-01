# /discovery

**Phase:** 2
**Status:** stub
**Owner:** discovery-orchestrator
**Category:** discovery

## Purpose
Run a full discovery pass against the current project. Reads all available repo context, infers defaults, surfaces genuine blockers, and produces a structured discovery report. This is the mandatory first step before any writing work begins.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| scope | string | No | full | Options: full, context-only, blockers-only |
| domain | string | No | (inferred) | Domain override if detection is ambiguous |

## Behavior
1. Invoke `discovery-orchestrator`, which coordinates the following sub-steps:
2. Read all existing project files: briefs, outlines, drafts, prior discovery reports, run logs, artifact manifests.
3. Read all doctrine files from `doctrine/`. Note active constraints.
4. Read all applicable style packs from `styles/`. Identify any that match the detected or specified domain.
5. (Phase 2+) Query `guide-server` for canon records, templates, rubrics, and examples matching the detected domain.
6. Identify confirmed context: facts that are directly readable from existing files.
7. Identify inferred context: reasonable defaults that can be applied without user input.
8. Identify assumptions: inferences that carry uncertainty and should be noted in output.
9. Identify genuine blockers: information that cannot be inferred and that materially affects work direction.
10. Produce a `discovery_report` with five sections:
    - **Confirmed Context** — facts read from the repo
    - **Inferred Context** — defaults applied with rationale
    - **Assumptions** — inferences with stated uncertainty
    - **Blockers** — a list of `blocker_report`-compatible objects for each genuine blocker
    - **Immediate Actions** — the first three things that can be done without resolving any blocker
11. (Phase 2+) Save the discovery report to `cache-server` as a run artifact.
12. (Phase 1) Write the discovery report to `logs/discovery-{timestamp}.md`.

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| discovery_report | markdown (stdout) | none | Human-readable structured report |
| blockers | blocker_report[] | blocker_report | One object per genuine blocker found |
| immediate_actions | string[] | none | The first three executable actions |

## Quality Gate
- Confirmed Context must not include inferences — only directly-read facts.
- Blockers section must only list genuinely unresolvable items — not items with reasonable defaults.
- Immediate Actions must be actionable without resolving any listed blocker.
- Discovery report must be produced even if blockers exist — partial discovery is not a failure.

## Error Handling
- Repo is entirely empty: produce a discovery report that notes no prior context exists and lists `/session-start` and `/write-brief` as immediate actions.
- `guide-server` unreachable: note degraded guide search, proceed with filesystem-only discovery.
- Conflicting doctrine files: surface conflict explicitly; do not silently prefer one file over another.

## Related Commands
- Run after: `/session-start`
- Run before: `/write-brief`, `/requirements-brief`
- `/discovery-agent` — for targeted sub-scope discovery
- `/discovery-simulate-user` — for unattended discovery when user is unavailable

## Related Agents
- discovery-orchestrator
- discovery-agent
- blockage-handler

## Escalation Triggers
- If more than three genuine blockers are found: summarize them and ask the user to prioritize which to resolve first.
- If discovery finds conflicting active style packs for the same domain: surface the conflict and ask user to choose one.

## Tool Adapter Notes
- **Claude Code:** Reads filesystem directly. Invokes discovery-orchestrator agent. Renders report in chat.
- **Codex:** Invoke with "Run discovery" or "Run /discovery". Codex reads all repo files and produces the report.
- **Windsurf:** Invoke via AI panel. Windsurf has native file tree access for context gathering.
- **Copilot:** Invoke in Copilot Chat. Copilot reads the workspace and produces a discovery summary.
