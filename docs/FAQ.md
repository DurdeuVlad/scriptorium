# FAQ

---

## What is Scriptorium?

Two things in one repo:

1. A **runnable newsroom app** (React + FastAPI + LangGraph).
2. A **portable editorial framework** (commands, agents, doctrine, MCP) for AI coding tools.

---

## Is it production ready?

**No.** Status is **alpha**. The app runs locally and in Docker; there is no built-in auth or hosted SaaS. Framework commands are specified and implemented; full end-to-end verification against eval case-01 is still in progress. See [PRODUCTION_READINESS_PLAN.md](../PRODUCTION_READINESS_PLAN.md).

---

## Which API key should I use?

Gemini is the default path (`GEMINI_API_KEY` in `.env`). OpenAI and Anthropic are supported alternatives. See `.env.example`.

---

## App vs framework—which do I need?

| Goal | Use |
|------|-----|
| Visual newsroom, Plan/Draft/Preview | **App** only |
| Slash commands in Cursor/Codex on any repo | **Framework** + MCP |
| Both | Clone once; follow [GUIDELINES.md](GUIDELINES.md) lanes A and B |

---

## Why are there `.claude`, `.codex`, `.windsurf`, and `.copilot` folders?

IDE **adapters** that mirror `.writing-framework/`. **Canonical specs:** `.writing-framework/commands/` and `.writing-framework/agents/`.

---

## Does the app use guide-server during a normal run?

Not yet for all LangGraph prompts—that integration is on the [roadmap](../README.md#roadmap-high-level). MCP servers are fully usable when you run framework commands inside your IDE.

---

## How do I report security issues?

See [SECURITY.md](../SECURITY.md). Do not post vulnerabilities in public issues.

---

## How do I contribute?

[CONTRIBUTING.md](../CONTRIBUTING.md) · [GUIDELINES.md](GUIDELINES.md) · [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md)

---

## Old repo name `ai-writing-framework`?

This project is now **Scriptorium** at `https://github.com/DurdeuVlad/scriptorium`. Update clones and MCP paths accordingly.
