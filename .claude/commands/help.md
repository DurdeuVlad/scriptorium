---
description: Show framework overview, current status, and next steps
---

# Editorial Orchestrator — Help

## Current Status

**Infrastructure:** ✅ Complete (Phases 1-10)  
**Writing Pipeline:** ✅ Implemented (Phase 11, verification pending)  
**QA System:** ✅ Implemented (Phase 12, verification pending)  
**Production Ready:** After end-to-end verification and tuning

---

## What This Framework Is

The **Editorial Orchestrator** is an agent-first editorial framework for orchestration-driven document production. It supports autonomous agents producing high-quality documents through a structured pipeline:

**Discovery → Brief → Outline → Draft → Review → QA → Artifact → Export**

---

## What You Can Do NOW

### 1. Explore the Infrastructure ✅
- Read `README.md` — Project overview
- Read `ARCHITECTURE.md` — System design
- Read `ROADMAP.md` — Phase roadmap
- Read `DECISIONS.md` — 46 design decisions
- Read `HANDOFF.md` — Agent continuity guide

### 2. Review Specifications ✅
- `docs/PHASE11_SPECIFICATION.md` — Core writing pipeline (8 commands, 4 agents)
- `docs/PHASE12_SPECIFICATION.md` — QA system (implemented surface, verification pending)
- `PRODUCTION_READINESS_PLAN.md` — Implementation timeline

### 3. Explore MCP Servers ✅
- `mcp/guide-server/` — Knowledge layer (55+ seeded guides)
- `mcp/cache-server/` — State management
- `mcp/artifact-server/` — Artifact generation

### 4. Review Evaluation Framework ✅
- `evals/rubrics/` — 4 scoring rubrics
- `evals/cases/` — 2 evaluation cases
- `evals/BASELINE_COMPARISON.md` — Baseline methodology

### 5. Learn How to Extend ✅
- `docs/EXTENDING_THE_FRAMEWORK.md` — Customization guide
  - Create style packs for your domain
  - Create templates for your document types
  - Create canon guides for your facts/lore
  - Create custom commands (optional)

---

## What You CANNOT Do Yet ❌

**Remaining gap:** End-to-end validation of the writing and QA pipelines, plus tuning against the evaluation rubrics.

---

## Quick Start for Developers

### To Verify Phases 11-12:
1. Read `docs/PHASE11_SPECIFICATION.md`
2. Run `evals/cases/case-01-technical-docs.md` through `/write-brief` → `/write-outline` → `/draft-document`
3. Run `/qa-reader` through `/qa-ai-stink` plus `/qa-final` on that draft
4. Confirm Brief, Outline, Draft, and QA gate behavior
5. Score the result with the evaluation rubrics and tune findings quality

### To Install MCP Servers:
**See `MCP_INSTALLATION.md` for detailed instructions.**

Quick install (if you have build tools):
```bash
cd mcp/guide-server && npm install && node src/setup.js && node src/seed.js
cd ../cache-server && npm install && node src/setup.js
cd ../artifact-server && npm install && node src/setup.js
```

**Windows users:** May need `npm install --build-from-source=false`

---

## Supported Domains (After Phase 11-12)

The framework works for **any writing domain** out of the box:
- Technical documentation
- D&D campaigns (style packs already seeded)
- Research papers
- Card game design (style packs already seeded)
- Legal documents
- Marketing content
- Fiction
- Business reports
- Poetry

**Domain customization:** See `docs/EXTENDING_THE_FRAMEWORK.md`

---

## Timeline to Production

**Current:** Writing and QA paths implemented (Phases 11-12)  
**Next milestone:** Production-ready after verification

**Remaining estimate:** verification and tuning only

---

## Key Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Project overview |
| `ARCHITECTURE.md` | System architecture |
| `ROADMAP.md` | Phase roadmap |
| `DECISIONS.md` | Design decisions (D-001 to D-046) |
| `HANDOFF.md` | Agent continuity |
| `CLAUDE.md` | Operating rules for agents |
| `PRODUCTION_READINESS_PLAN.md` | Implementation plan |
| `docs/EXTENDING_THE_FRAMEWORK.md` | Customization guide |
| `docs/PHASE11_SPECIFICATION.md` | Core writing pipeline spec |
| `docs/PHASE12_SPECIFICATION.md` | QA system spec |

---

## Need More Help?

- **For implementation:** Read `docs/PHASE12_SPECIFICATION.md`
- **For customization:** Read `docs/EXTENDING_THE_FRAMEWORK.md`
- **For architecture:** Read `ARCHITECTURE.md`
- **For decisions:** Read `DECISIONS.md`
- **For continuity:** Read `HANDOFF.md`

---

## Repository

**GitHub:** https://github.com/DurdeuVlad/ai-writing-framework  
**Status:** Phases 11-12 implemented, verification pending
