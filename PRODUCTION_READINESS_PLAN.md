# Production Readiness Plan

**Current Status:** Phases 11-12 Implemented, Verification Pending ✅  
**Production Status:** NOT READY ❌ (public **alpha** — see [README.md](README.md#project-status-alpha))  
**Target:** Fully operational writing system ready for import into any project

**Note:** [ROADMAP.md](ROADMAP.md) phases 7–8 are labeled *infrastructure complete* here; full orchestrate-artifact and sync upgrade automation remain verification targets, not blockers for open-source preview.

---

## Executive Summary

**What we have:** Complete architectural foundation, database infrastructure, evaluation framework, comprehensive documentation.

**What we need:** End-to-end verification, rubric scoring, and tuning.

**Timeline to production:** verification and tuning time
**Effort estimate:** verification and tuning only

---

## Current State Assessment

### ✅ Completed (Phases 1-10)

| Phase | Deliverable | Status |
|-------|-------------|--------|
| 1 | Foundation & Doctrine | ✅ Complete |
| 2 | Agent & Command Contracts | ✅ Complete |
| 3 | Guide Server MCP | ✅ Complete |
| 4 | Cache Server MCP | ✅ Complete |
| 5 | Discovery & Blockage | ✅ Complete |
| 6 | Editorial Workflows | ✅ Complete |
| 7 | Artifact Infrastructure | ✅ Complete |
| 8 | Sync & Portability | ✅ Complete |
| 9 | Hooks & Guardrails | ✅ Complete |
| 10 | Evaluation Framework | ✅ Complete |

**Result:** Infrastructure layer complete, specifications written, MCPs operational.

---

### Remaining Gap

| Phase | Deliverable | Status | Blocks |
|-------|-------------|--------|--------|
| 11 | Core Writing Pipeline | ✅ Implemented (verification pending) | End-to-end proof still needed |
| 12 | QA & Review System | ✅ Implemented (verification pending) | QA eval proof still needed |

**Result:** The writing and QA paths exist, but production proof is still incomplete.

**Note:** Domain-specific features (D&D, research, card games) are handled through style packs, templates, and canon guides (already seeded in guide-server). No additional phases needed.

---

## Production Readiness Roadmap

### Phase 11: Core Writing Pipeline (implemented, verification pending)
**Timeline:** 4-6 weeks completed  
**Effort:** 60-80 hours completed  
**Priority:** Completed implementation; remaining work is verification

#### Deliverables

**1. Implemented Command Surface (8 commands)**
- `/write-brief` — Generate brief from discovery report
- `/write-outline` — Generate outline from brief
- `/draft-section` — Draft single section from outline
- `/draft-document` — Orchestrate full document draft
- `/merge-draft` — Merge section drafts into coherent document
- `/rewrite` — Revise draft based on rewrite plan
- `/validate-brief` — Validate brief against schema and Brief Gate
- `/validate-outline` — Validate outline against schema and Outline Gate

**Implementation location:** `.claude/commands/{command-name}.md`

**Current command expectations:**
- Accept inputs per canonical spec
- Call appropriate MCP tools (guide-server, cache-server)
- Execute agent logic
- Validate outputs against schemas
- Pass quality gates
- Handle errors and create resume points
- Return structured outputs

---

**2. Implemented Agent Surface (4 agents)**
- `brief-writer` — Generates briefs from discovery reports
- `outline-architect` — Generates outlines from briefs
- `section-drafter` — Drafts individual sections
- `merge-normalizer` — Merges and normalizes section drafts

**Implementation location:** `.claude/agents/{agent-name}.md`

**Current agent expectations:**
- Follow canonical spec behavior
- Query guide-server for applicable guides
- Apply style packs, rubrics, templates
- Make Type 1/2/3 decisions per autonomy rules
- Escalate when required
- Log all decisions to cache-server

---

**3. Workflow Orchestration**
- Brief workflow execution
- Outline workflow execution
- Drafting workflow execution
- Gate enforcement via hooks

**Integration points:**
- `pre-phase-advance` hook validates gates
- `on-failure` hook creates resume points
- cache-server tracks run state
- guide-server provides editorial guidance

---

**4. Schema Finalization**
Defined and aligned for Phase 11:
- `brief.schema.json` ✅
- `outline.schema.json` ✅
- `merge_report.schema.json` ✅
- `rewrite_plan.schema.json` ✅

---

#### Success Criteria

**Minimum viable product:**
- [ ] Can run `/write-brief` and get valid brief.json
- [ ] Can run `/write-outline` from brief and get valid outline.json
- [ ] Can run `/draft-section` and get markdown section
- [ ] Can run `/draft-document` and get full draft
- [ ] Brief Gate blocks invalid briefs
- [ ] Outline Gate blocks invalid outlines
- [ ] All outputs saved to cache-server
- [ ] Can resume from failure

**Test with:** `evals/cases/case-01-technical-docs.md`

**Expected result:** Complete API reference guide, all gates passed, no manual intervention.

---

### Phase 12: QA & Review System
**Timeline:** 3-4 weeks  
**Effort:** 40-50 hours  
**Priority:** HIGH — Needed for quality assurance

#### Deliverables

**1. QA Perspective Commands (7 commands)**
- `/qa-reader` — Reader perspective review
- `/qa-skeptic` — Skeptic perspective review
- `/qa-domain` — Domain expert perspective review
- `/qa-style` — Style adherence review
- `/qa-coherence` — Logical coherence review
- `/qa-ai-stink` — Generic phrasing detection
- `/qa-final` — Aggregate all perspectives, issue verdict

**Each QA command must:**
- Accept draft input
- Apply perspective-specific rubric
- Generate structured `review_report.json`
- Assign severity (critical, major, minor)
- Provide actionable findings with locations
- Return pass/fail/conditional verdict

---

**2. Adversarial Reviewer Agent**
- `adversarial-reviewer` — Finds weakest points in document

**Must:**
- Challenge every claim
- Identify assumed knowledge
- Flag logical gaps
- Detect unsupported assertions
- No false positives (precision > 85%)

---

**3. QA Workflow Execution**
- Run all active perspectives
- Aggregate findings
- Enforce QA Gate
- Block advancement if critical findings
- Log all reviews to cache-server

---

#### Success Criteria

**Minimum viable product:**
- [ ] Can run `/qa-reader` and get structured findings
- [ ] Can run `/qa-final` and get aggregated verdict
- [ ] QA Gate blocks drafts with critical findings
- [ ] False positive rate < 15%
- [ ] All 6 injected issues in case-01 detected

**Test with:** `evals/cases/case-01-technical-docs.md` (6 injected quality issues)

**Expected result:** All 6 issues detected, severity correct, findings actionable.

---

### Framework Extension (Optional)

**Status:** Documentation complete  
**Guide:** `docs/EXTENDING_THE_FRAMEWORK.md`

The core framework (Phases 11-12) is **production-ready for all domains** without modification.

**Domain-specific customization is handled through:**
1. **Style packs** — Control writing style (already seeded for D&D, card games)
2. **Templates** — Control document structure (already seeded for D&D, card games)
3. **Canon guides** — Control domain facts/lore (already seeded for D&D)
4. **Rubrics** — Control evaluation criteria

**Users can optionally create custom commands** for domain-specific tasks:
- `/generate-npc` (D&D)
- `/validate-citations` (research)
- `/generate-card` (card games)
- `/validate-contract` (legal)

**See `docs/EXTENDING_THE_FRAMEWORK.md` for:**
- How to create style packs
- How to create templates
- How to create canon guides
- How to create custom commands
- Examples for D&D, research, card games, legal, marketing

---

## Implementation Strategy

### Week-by-Week Breakdown

**Weeks 1-2: Phase 11 Foundation**
- Implement `/write-brief` command
- Implement `brief-writer` agent
- Integrate with guide-server and cache-server
- Test with simple brief generation

**Weeks 3-4: Phase 11 Outline & Drafting**
- Implement `/write-outline` command
- Implement `outline-architect` agent
- Implement `/draft-section` command
- Implement `section-drafter` agent
- Test with case-01 (technical docs)

**Weeks 5-6: Phase 11 Completion**
- Implement `/draft-document` orchestration
- Implement `/merge-draft` command
- Implement `merge-normalizer` agent
- Full end-to-end test with case-01
- Validate against evaluation rubrics

**Weeks 7-9: Phase 12 QA System**
- Implement 7 QA perspective commands
- Implement `adversarial-reviewer` agent
- Integrate QA workflow
- Test with case-01 (6 injected issues)
- Validate false positive rate < 15%

**Week 10: Phase 12 Completion**
- Implement `/qa-final` aggregation
- Enforce QA Gate
- Full QA workflow test
- Validate against qa-utility rubric

**Week 11+: Optional Extensions**
- Users can create custom commands as needed
- Community can share domain-specific extensions
- See `docs/EXTENDING_THE_FRAMEWORK.md` for guidance

---

## Testing & Validation Plan

### Phase 11 Testing

**Test case:** `evals/cases/case-01-technical-docs.md`

**Steps:**
1. Run `/write-brief` with case requirements
2. Validate brief against Brief Gate
3. Run `/write-outline` from brief
4. Validate outline against Outline Gate
5. Run `/draft-document` from outline
6. Validate draft against Draft Gate
7. Check all 3 blockers detected
8. Check resume capability

**Success criteria:**
- All gates pass
- 3/3 blockers detected
- Resume from failure works
- Artifact quality score ≥ 35/40

---

### Phase 12 Testing

**Test case:** `evals/cases/case-01-technical-docs.md` (6 injected quality issues)

**Steps:**
1. Run `/qa-reader` on draft
2. Run `/qa-skeptic` on draft
3. Run `/qa-domain` on draft
4. Run `/qa-style` on draft
5. Run `/qa-coherence` on draft
6. Run `/qa-ai-stink` on draft
7. Run `/qa-final` to aggregate
8. Check QA Gate enforcement

**Success criteria:**
- 6/6 issues detected
- False positive rate < 15%
- Severity accuracy ≥ 85%
- Actionability ≥ 85%
- QA utility score ≥ 35/40

---

## Production Deployment Checklist

### Pre-Deployment

- [ ] All Phase 11 commands implemented and tested
- [ ] All Phase 12 commands implemented and tested
- [ ] All MCPs operational (guide-server, cache-server, artifact-server)
- [ ] All schemas validated
- [ ] All hooks functional
- [ ] All evaluation cases pass
- [ ] Documentation updated

### Deployment

- [ ] MCP servers configured and seeded
- [ ] Guide-server populated with 55 seed records
- [ ] Cache-server initialized
- [ ] Artifact-server initialized
- [ ] Environment variables configured
- [ ] Logging configured

### Post-Deployment

- [ ] Run smoke tests (brief → outline → draft)
- [ ] Run full evaluation suite
- [ ] Verify all rubrics score ≥ 35/40
- [ ] Monitor for errors
- [ ] Collect user feedback

---

## Import into New Project

### Prerequisites

1. **Node.js** installed (for MCP servers)
2. **Claude Code** or compatible tool
3. **Git** for cloning repository

### Installation Steps

**Step 1: Clone Repository**
```bash
git clone https://github.com/DurdeuVlad/scriptorium.git
cd scriptorium
```

**Step 2: Install MCP Servers**
```bash
# Guide server
cd mcp/guide-server
npm install
node src/setup.js
node src/seed.js

# Cache server
cd ../cache-server
npm install
node src/setup.js

# Artifact server
cd ../artifact-server
npm install
node src/setup.js
```

**Step 3: Configure Claude Code**
Add to `.claude/config.json`:
```json
{
  "mcpServers": {
    "guide-server": {
      "command": "node",
      "args": ["mcp/guide-server/src/server.js"]
    },
    "cache-server": {
      "command": "node",
      "args": ["mcp/cache-server/src/server.js"]
    },
    "artifact-server": {
      "command": "node",
      "args": ["mcp/artifact-server/src/server.js"]
    }
  }
}
```

**Step 4: Verify Installation**
```bash
# Test guide-server
node mcp/guide-server/src/test.js

# Test cache-server
node mcp/cache-server/src/test.js
```

**Step 5: Start Writing**
```bash
# In Claude Code
/write-brief
# Follow prompts to generate brief

/write-outline
# Generate outline from brief

/draft-document
# Generate full draft
```

---

## Success Metrics

### Phase 11 Success
- [ ] Can write technical documentation end-to-end
- [ ] Artifact quality score ≥ 35/40
- [ ] Process reliability score ≥ 35/40
- [ ] All gates functional
- [ ] Resume capability works

### Phase 12 Success
- [ ] QA utility score ≥ 35/40
- [ ] Issue detection rate ≥ 85%
- [ ] False positive rate < 15%
- [ ] Severity accuracy ≥ 85%
- [ ] Actionability ≥ 85%

### Overall Production Readiness
- [ ] All evaluation cases pass
- [ ] All rubrics score ≥ 35/40
- [ ] Documentation complete
- [ ] Installation guide tested
- [ ] User feedback positive

---

## Risk Mitigation

### Risk 1: Command Implementation Complexity
**Mitigation:** Start with simplest command (`/write-brief`), iterate, test thoroughly before moving to next.

### Risk 2: MCP Integration Issues
**Mitigation:** Test each MCP tool individually, verify connectivity before integration.

### Risk 3: Quality Gate False Positives
**Mitigation:** Tune gate criteria based on test results, aim for <15% false positive rate.

### Risk 4: Agent Decision Making
**Mitigation:** Implement Type 1/2/3 decision logic carefully, log all decisions, review for correctness.

### Risk 5: Timeline Slippage
**Mitigation:** Focus on Phase 11 MVP first (brief → outline → draft), defer nice-to-haves.

---

## Next Immediate Steps

**Priority 1: Phase 11 Kickoff**
1. Read Phase 11 requirements in `ROADMAP.md`
2. Review command specs in `.writing-framework/commands/`
3. Review agent specs in `.writing-framework/agents/`
4. Start with `/write-brief` implementation
5. Test with simple brief generation

**Priority 2: Development Environment**
1. Set up local MCP servers
2. Configure Claude Code
3. Test MCP connectivity
4. Verify guide-server seeded

**Priority 3: Testing Framework**
1. Set up evaluation case runner
2. Automate rubric scoring
3. Create test harness for commands
4. Establish CI/CD pipeline

---

## Conclusion

**Current state:** Infrastructure complete, writing pipeline implemented, QA execution still missing.

**Path to production:** 2 major phases (11, 12), 10 weeks, 100-130 hours.

**First milestone:** Phase 11 complete (6 weeks) — Can write basic documents.

**Production ready:** After Phase 12 (10 weeks) — Can write quality-checked documents for **all domains**.

**Domain customization:** Optional, handled through style packs, templates, canon guides, and custom commands (see `docs/EXTENDING_THE_FRAMEWORK.md`).

**Bottom line:** You have a solid foundation. Build the execution layer (Phases 11-12), and you're production-ready for any writing domain.
