# Quick Start Guide

**For:** Developers validating Phase 11 / implementing Phase 12 or users exploring the framework

---

## What Is This?

The **Editorial Orchestrator** is a framework for AI agents to produce high-quality documents through structured workflows. The core writing pipeline is implemented; the remaining gap is full QA-system execution and end-to-end production verification.

---

## Current Status

✅ **Complete (Phases 1-10):**
- 14 doctrine files
- 15 schemas
- 10 workflows
- 3 MCP servers (guide, cache, artifact)
- 55+ seeded guides
- 4 evaluation rubrics
- 2 evaluation cases
- Comprehensive documentation

✅ **Implemented (Phases 11-12, verification pending):**
- 8 writing commands
- 4 writing agents
- brief/outline validation commands
- updated gate integration for brief and outline workflows

- 7 QA commands
- QA agent surfaces
- QA gate integration

⏳ **Still Remaining:**
- end-to-end validation against case-01
- rubric scoring and QA tuning

**Timeline to production:** verification and tuning time

---

## For Users: What Can I Do Now?

### 1. Explore the Framework
```bash
# Clone repository
git clone https://github.com/DurdeuVlad/scriptorium.git
cd scriptorium

# Read key documentation
cat README.md
cat ARCHITECTURE.md
cat ROADMAP.md
```

### 2. Understand the Architecture
- Read `ARCHITECTURE.md` — Complete system design
- Read `DECISIONS.md` — 46 design decisions explaining why things are the way they are
- Read `HANDOFF.md` — How agents work together

### 3. Review Specifications
- `docs/PHASE11_SPECIFICATION.md` — Core writing pipeline (implemented surface and remaining verification)
- `docs/PHASE12_SPECIFICATION.md` — QA system (implemented surface and remaining verification)
- `PRODUCTION_READINESS_PLAN.md` — Implementation timeline

### 4. Learn How to Customize
- `docs/EXTENDING_THE_FRAMEWORK.md` — How to customize for your domain
  - Create style packs (how to write)
  - Create templates (document structure)
  - Create canon guides (domain facts/lore)
  - Create custom commands (optional)

---

## For Developers: How Do I Implement This?

### Phase 11: Core Writing Pipeline (implemented)

**Status:** Implemented at the spec/adapter layer. Next work is verification.

**Validation steps:**
1. Read `docs/PHASE11_SPECIFICATION.md`
2. Install MCP servers (see below)
3. Run case-01 through `/write-brief` → `/write-outline` → `/draft-document`
4. Validate gate behavior and resume behavior
5. Score the output before starting Phase 12

**Implemented commands:**
- `/write-brief` — Generate brief from user requirements
- `/write-outline` — Generate outline from brief
- `/draft-section` — Draft individual section
- `/draft-document` — Orchestrate full document
- `/merge-draft` — Merge sections into coherent document
- `/rewrite` — Revise draft based on feedback
- `/validate-brief` — Validate brief against schema
- `/validate-outline` — Validate outline against schema

**Implemented agents:**
- `brief-writer` — Generates briefs
- `outline-architect` — Generates outlines
- `section-drafter` — Drafts sections
- `merge-normalizer` — Merges and normalizes drafts

---

### Phase 12: QA System (implemented)

**Status:** Implemented at the spec/adapter layer. Next work is verification and tuning.

**Validation steps:**
1. Read `docs/PHASE12_SPECIFICATION.md`
2. Run the six QA perspectives plus `/qa-final` against `evals/cases/case-01-technical-docs.md`
3. Check QA Gate behavior on the injected issues
4. Score against `evals/rubrics/qa-utility.md`
5. Tune false positives and actionability

**Implemented commands:**
- `/qa-reader` — Reader perspective (clarity, assumed knowledge)
- `/qa-skeptic` — Skeptic perspective (claim grounding)
- `/qa-domain` — Domain expert perspective (technical accuracy)
- `/qa-style` — Style adherence
- `/qa-coherence` — Logical coherence
- `/qa-ai-stink` — Generic AI phrasing detection
- `/qa-final` — Aggregate all perspectives, issue verdict

**Implemented QA agents:**
- `qa-reader`
- `qa-skeptic`
- `qa-domain`
- `qa-style`
- `qa-coherence`
- `qa-ai-stink`
- `qa-final`

---

## Installing MCP Servers

**Prerequisites:** Node.js installed

**See `MCP_INSTALLATION.md` for detailed installation instructions, including Windows-specific requirements.**

### Quick Install (if you have Node.js and build tools)
```bash
# Guide Server
cd mcp/guide-server
npm install
node src/setup.js
node src/seed.js

# Cache Server
cd mcp/cache-server
npm install
node src/setup.js

# Artifact Server
cd mcp/artifact-server
npm install
node src/setup.js
```

**Note:** On Windows, you may need Visual Studio Build Tools or use `npm install --build-from-source=false`

---

## Testing Your Implementation

### Phase 11 Testing
**Test case:** `evals/cases/case-01-technical-docs.md`

**Expected:**
- Can generate valid brief from requirements
- Can generate valid outline from brief
- Can draft all sections
- Can merge into coherent document
- All 3 blockers detected
- Artifact quality score ≥ 35/40

### Phase 12 Testing
**Test case:** `evals/cases/case-01-technical-docs.md` (6 injected quality issues)

**Expected:**
- All 6 issues detected
- False positive rate < 15%
- Severity accuracy ≥ 85%
- QA utility score ≥ 35/40

---

## Customizing for Your Domain

**You don't need to modify the framework.** Domain-specific behavior is controlled by data:

### 1. Create a Style Pack
**File:** `mcp/guide-server/seeds/style-packs/your-domain.json`

```json
{
  "guide_id": "G-STYLE-XXX",
  "guide_type": "style-pack",
  "title": "Your Domain Style",
  "content": "# Style Rules\n\n- Voice: formal/casual\n- Tone: ...\n- Terminology: ...",
  "status": "active",
  "applies_to": ["section-drafter"],
  "domain": "your-domain"
}
```

### 2. Create a Template
**File:** `mcp/guide-server/seeds/templates/your-template.json`

```json
{
  "guide_id": "G-TMPL-XXX",
  "guide_type": "template",
  "title": "Your Document Template",
  "content": "# Structure\n\n## Section 1\n## Section 2\n...",
  "status": "active",
  "applies_to": ["outline-architect"],
  "domain": "your-domain"
}
```

### 3. Seed Guide Server
```bash
cd mcp/guide-server
node src/seed.js
```

**See `docs/EXTENDING_THE_FRAMEWORK.md` for complete guide.**

---

## Directory Structure

```
scriptorium/
├── .writing-framework/     # Canonical specs (source of truth)
│   ├── doctrine/           # 14 doctrine files
│   ├── schemas/            # 15 JSON schemas
│   ├── workflows/          # 10 workflow specs
│   ├── commands/           # Command specs (stubs)
│   └── agents/             # Agent specs (stubs)
├── .claude/                # Claude Code adapter
│   ├── commands/           # Command implementations (to be built)
│   ├── agents/             # Agent implementations (to be built)
│   └── hooks/              # Hook implementations
├── mcp/                    # MCP servers
│   ├── guide-server/       # Knowledge layer (ready)
│   ├── cache-server/       # State management (ready)
│   └── artifact-server/    # Artifact generation (ready)
├── evals/                  # Evaluation framework
│   ├── rubrics/            # 4 scoring rubrics
│   ├── cases/              # 2 evaluation cases
│   └── BASELINE_COMPARISON.md
├── docs/                   # Documentation
│   ├── PHASE11_SPECIFICATION.md
│   ├── PHASE12_SPECIFICATION.md
│   └── EXTENDING_THE_FRAMEWORK.md
├── README.md               # Project overview
├── ARCHITECTURE.md         # System architecture
├── ROADMAP.md              # Phase roadmap
├── DECISIONS.md            # Design decisions
├── HANDOFF.md              # Agent continuity
└── PRODUCTION_READINESS_PLAN.md
```

---

## Key Concepts

### Workflows
Structured pipelines: Discovery → Brief → Outline → Draft → Review → QA → Artifact → Export

### Quality Gates
Checkpoints that block advancement if criteria not met (Brief Gate, Outline Gate, Draft Gate, QA Gate)

### Blockers
9 types (B1-B9): missing info, conflicting requirements, scope ambiguity, etc.

### Agents
Specialized AI agents with defined scopes: brief-writer, outline-architect, section-drafter, adversarial-reviewer, etc.

### MCP Servers
- **guide-server:** Stores style packs, templates, canon, rubrics, anti-patterns
- **cache-server:** Tracks run state, blockers, resume points
- **artifact-server:** Manages artifacts, exports to DOCX/PDF

### Schemas
Structured data formats: brief, outline, discovery_report, review_report, blocker_report, etc.

---

## Common Questions

### Q: Can I use this now for writing?
**A:** Partially. The writing and QA surfaces are implemented at the framework level, but full production verification is still pending.

### Q: How long until it's production-ready?
**A:** 10 weeks of focused development (100-130 hours).

### Q: What domains does it support?
**A:** Any domain. Style packs and templates control domain-specific behavior. D&D and card game style packs are already seeded.

### Q: Do I need to modify the framework for my domain?
**A:** No. Create style packs, templates, and canon guides (data, not code). See `docs/EXTENDING_THE_FRAMEWORK.md`.

### Q: Can I create custom commands?
**A:** Yes, optionally. Add them to `.claude/commands/`. See extension guide.

### Q: What if I want to use a different AI tool (not Claude)?
**A:** Canonical specs are in `.writing-framework/`. Create an adapter directory (like `.claude/`) for your tool.

---

## Next Steps

### If You're Exploring:
1. Read `README.md`
2. Read `ARCHITECTURE.md`
3. Read `docs/EXTENDING_THE_FRAMEWORK.md`

### If You're Implementing:
1. Read `docs/PHASE11_SPECIFICATION.md`
2. Install MCP servers
3. Start with `/write-brief` command
4. Test incrementally

### If You're Customizing:
1. Read `docs/EXTENDING_THE_FRAMEWORK.md`
2. Create style pack for your domain
3. Create template for your document type
4. Seed guide-server

---

## Resources

- **Repository:** https://github.com/DurdeuVlad/scriptorium
- **Phase 11 Spec:** `docs/PHASE11_SPECIFICATION.md`
- **Phase 12 Spec:** `docs/PHASE12_SPECIFICATION.md`
- **Extension Guide:** `docs/EXTENDING_THE_FRAMEWORK.md`
- **Production Plan:** `PRODUCTION_READINESS_PLAN.md`

---

## Support

For questions or issues:
1. Check `ARCHITECTURE.md` for system design
2. Check `DECISIONS.md` for design rationale
3. Check `docs/EXTENDING_THE_FRAMEWORK.md` for customization
4. Review Phase 11-12 specifications for implementation details

---

**Status:** Phases 11-12 implemented, verification pending  
**Last Updated:** 2026-03-31
