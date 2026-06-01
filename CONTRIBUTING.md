# Contributing to Scriptorium

All contributions must respect the editorial pipeline and maintain schema compliance.

## Before You Contribute

1. Read `README.md`, `ARCHITECTURE.md`, `QUICK_START.md`
2. Check `DECISIONS.md` for design choices
3. Review relevant phase specification

## What to Contribute

- Commands (new pipeline phases)
- Agents (specialized AI agents)
- Guides (style packs, canon, templates)
- MCP Servers (guide-server, cache-server, artifact-server)
- Tests and evaluations
- Documentation

## What NOT to Contribute

- Personal test artifacts (`.flux/sessions/*/build-notes.md`, `audit-report.md`, `qa-log.md`)
- Database files or node_modules
- Uncommitted temporary files

## Workflow

1. Fork and create feature branch
2. Test on `evals/cases/case-01`
3. Commit with conventional commits: `type(scope): subject`
4. Validate outputs against schemas
5. Open a PR

## Questions?

Check `ARCHITECTURE.md`, `DECISIONS.md`, or open an issue.
