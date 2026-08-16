# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| `main` (latest) | Yes |
| Older tags | Best effort |

Scriptorium is in **alpha**. Security fixes land on `main` first.

## Reporting a vulnerability

**Do not** open public GitHub issues for security problems.

1. Email or DM the maintainer via [GitHub profile](https://github.com/DurdeuVlad) with subject `Scriptorium security`.
2. Include: description, reproduction steps, impact, and affected paths (app API, MCP servers, framework commands).
3. Expect an initial response within **7 days**.

We will coordinate disclosure and credit if you wish.

## What to include in reports

- Remote code execution, auth bypass, or path traversal in `app.py` / artifact export
- Secret leakage via logs, WebSocket payloads, or committed config
- MCP server exposure when bound to non-localhost interfaces

## Out of scope (for now)

- Missing authentication on local dev installs with `API_AUTH_TOKEN` unset (documented default — see `docs/APP.md#security`)
- Social engineering or issues in third-party LLM providers
- Findings that require physical access to the developer machine

## Safe defaults for self-hosting

- Keep `.env` and `.cursor/mcp.json` out of git (see `.gitignore`)
- Set `API_AUTH_TOKEN` before exposing the API beyond localhost, or put your own auth layer in front of it — see `docs/APP.md#security` and `.env.example`
- Rotate API keys if they appear in logs or issue attachments
