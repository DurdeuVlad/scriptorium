# AUTONOMY POLICY INTEGRATION

**Status:** Canonical. Defines how autonomy policies integrate with discovery, blockage handling, and workflow execution.
**Phase:** 5
**Related:** AUTONOMOUS_EXECUTION.md, BLOCKER_CLASSIFICATION.md, PARTIAL_COMPLETION.md

---

## Purpose

Integrate Type 1/2/3 decision classification with discovery workflows, blockage handling, and partial completion behavior. Ensure agents minimize unnecessary user interruption while never hallucinating user intent.

---

## Core Autonomy Principles

### 1. Minimize Unnecessary User Interruption

**Definition:** Ask only for materially blocking input. Do not ask questions with obvious answers.

**Implementation:**
- Classify every decision as Type 1, Type 2, or Type 3
- Type 1: Proceed without asking
- Type 2: Proceed and flag for review
- Type 3: Ask specific question, continue unblocked work

**Anti-Pattern:**
```
❌ "Should I use formal or informal tone?"
   (when style pack clearly specifies formal tone)

✅ Use formal tone per style pack, log assumption
```

### 2. Do Not Hallucinate User Intent

**Definition:** Never invent user preferences, requirements, or decisions beyond what is directly inferable from context.

**Implementation:**
- Label all inferences with basis
- Flag non-obvious decisions
- Ask when ambiguity materially affects output direction
- Document assumptions in discovery report

**Anti-Pattern:**
```
❌ Assume user wants OAuth 2.0 because "authentication" was mentioned
   (when brief doesn't specify auth method)

✅ Flag as B1 blocker: "Authentication method not specified"
   Ask: "Which authentication method: OAuth 2.0, JWT, sessions, or all?"
```

### 3. Continue All Safe Unblocked Work

**Definition:** When a blocker prevents some work, continue all work that is not blocked.

**Implementation:**
- Analyze impact scope for every blocker
- Identify unimpacted scope
- Execute all unblocked work in parallel
- Produce partial outputs with clear labeling

**Anti-Pattern:**
```
❌ Halt entire document draft because Section 3 needs source material
   (when Sections 1, 2, 4, 5 can proceed)

✅ Draft Sections 1, 2, 4, 5 to completion
   Create placeholder for Section 3
   Label output as partial
```

---

## Autonomy in Discovery Workflow

### Discovery-Agent Autonomy Rules

**Type 1 Decisions (Infer and Proceed):**
- Domain classification from task description keywords
- Style pack selection when single match found
- Template relevance based on name matching
- Prior artifact relevance based on domain matching

**Type 2 Decisions (Infer and Flag):**
- Multiple style packs match → choose most specific, flag alternatives
- Ambiguous domain → infer from keywords, flag assumption
- Template partially matches → mark as potentially relevant, flag limitations

**Type 3 Decisions (Must Ask):**
- None — discovery-agent does not make Type 3 decisions
- All ambiguities reported to discovery-orchestrator for B1 classification

**Example:**
```markdown
## Discovery Report — Type 1 Assumptions

[ASSUMPTION] Domain classified as 'technical-writing' — basis: task mentions "API documentation"
[ASSUMPTION] Style pack selected: technical-writing.md — basis: only style pack matching domain
[ASSUMPTION] Audience inferred as 'intermediate developers' — basis: CLAUDE.md specifies "developer audience"
```

### Discovery-Orchestrator Autonomy Rules

**Type 1 Decisions (Infer and Proceed):**
- Single style pack matches domain → select it
- Multiple non-conflicting guides found → use all
- Task domain clear from description → classify domain
- Prior run completed successfully → load as reference

**Type 2 Decisions (Infer and Flag):**
- Multiple style packs could apply → choose most specific, flag decision
- Task scope could be narrow or broad → choose narrow, flag expansion option
- Audience not specified but inferable → infer, flag assumption
- No prior runs but similar artifacts exist → note similarity, flag as reference

**Type 3 Decisions (Must Ask):**
- No style pack found AND domain unclear → B2 blocker, ask for domain
- Prior run exists with status='paused' → ask: resume or start fresh
- Task contradicts project constraints → B1 blocker, ask to resolve
- No doctrine files found → B2 blocker, ask to run `/install-framework`

**Example:**
```markdown
## Discovery Report — Type 3 Blocker

[BLOCKER: B2-missing-repo-context]

No style pack found for domain "technical writing" and domain classification is ambiguous.

**Question:** Which style pack should be used?
**Options:**
  1. Create new style pack for technical writing
  2. Use general.md style pack with technical adaptations
  3. Specify different domain

**If no response:** Will use general.md and flag all tone/structure decisions for review.

**Unblocked work:** Discovery can complete, research can proceed, brief template can be created.
```

---

## Autonomy in Blockage Handling

### Blockage-Handler Autonomy Rules

**Type 1 Decisions (Infer and Proceed):**
- Execute all unblocked work (always proceed with unimpacted scope)
- Classify blocker using B1-B9 taxonomy
- Assign severity based on impact analysis
- Create placeholders for blocked sections
- Generate resume plan with specific commands

**Type 2 Decisions (Infer and Flag):**
- Choose between multiple unblocking strategies → select most conservative, flag alternatives
- Prioritize unblocked work order → choose logical sequence, flag rationale
- Infer blocker severity when ambiguous → choose blocking if uncertain, flag assumption

**Type 3 Decisions (Must Ask):**
- Resolve B1 blocker (missing user decision) → cannot infer, must ask
- Resolve B8 blocker (contradictory instructions) → cannot choose, must ask
- Determine whether to abandon run when >80% blocked → must ask user

**Example:**
```markdown
## Blocker Report — Type 1 Execution

[BLOCKER: B4-missing-source-material]
Section 3 requires 5 academic papers on distributed consensus.

**Impacted Scope:** Section 3 (Literature Review)
**Unimpacted Scope:** Sections 1, 2, 4, 5, 6

**Type 1 Decision:** Execute all unblocked work
**Action Taken:** Drafted Sections 1, 2, 4, 5, 6 to completion (12,800 words)

**Partial Output:** 5/6 sections complete
**Resume Command:** `/draft-section section_id=S3 run_id=abc123`
```

---

## Autonomy Boundary Examples

### Example 1: Tone Selection

**Scenario:** Brief doesn't specify tone, style pack says "professional", CLAUDE.md says "accessible".

**Analysis:**
- "Professional" and "accessible" are not contradictory
- Can use professional-accessible tone
- This is Type 1 (inferable from context)

**Action:**
```markdown
[ASSUMPTION] Tone: professional but accessible — basis: style pack + CLAUDE.md
```

**Wrong Action:**
```markdown
❌ [BLOCKER: B1] Tone not specified, need user decision
```

### Example 2: Audience Ambiguity

**Scenario:** Task says "write guide to Kubernetes" without specifying audience.

**Analysis:**
- Audience materially affects content (beginner vs. expert)
- No clear basis to infer audience from context
- This is Type 3 (must ask)

**Action:**
```markdown
[BLOCKER: B1-missing-user-decision]

Audience not specified. Kubernetes guide content differs significantly for:
- Beginners (needs Docker basics, container concepts)
- Intermediate (assumes container knowledge)
- Experts (focuses on advanced orchestration)

**Question:** Which audience level?
**If no response:** Will assume intermediate and flag all complexity decisions.
```

**Wrong Action:**
```markdown
❌ [ASSUMPTION] Audience: intermediate developers — basis: most common use case
```

### Example 3: Section Order

**Scenario:** Outline has 5 sections, no explicit order specified, logical flow is clear.

**Analysis:**
- Section order inferable from logical dependencies
- No material impact on content (only presentation)
- This is Type 1 (proceed with logical order)

**Action:**
```markdown
[ASSUMPTION] Section order: 1→2→3→4→5 — basis: logical dependency flow (each section builds on prior)
```

**Wrong Action:**
```markdown
❌ [BLOCKER: B1] Section order not specified
```

### Example 4: Missing Source Material

**Scenario:** Section requires "API documentation" but link is broken.

**Analysis:**
- Cannot proceed without source material
- No substitute available
- This is Type 3 (must ask) + partial completion

**Action:**
```markdown
[BLOCKER: B4-missing-source-material]

Section 4 requires API documentation (link broken: https://example.com/api-docs).

**Impacted:** Section 4 only
**Unimpacted:** Sections 1, 2, 3, 5, 6

**Action Taken:** Drafted Sections 1, 2, 3, 5, 6 to completion
**Placeholder Created:** Section 4 with description of what will be covered

**To Resume:** Provide working API documentation link or alternative source
```

**Wrong Action:**
```markdown
❌ Invent API documentation content based on common patterns
❌ Skip Section 4 entirely without placeholder
❌ Halt all work waiting for documentation
```

---

## Autonomy Decision Matrix

| Scenario | Type | Action | Rationale |
|----------|------|--------|-----------|
| Single style pack matches domain | 1 | Select it, log | Obvious choice |
| Multiple style packs match | 2 | Choose most specific, flag | Reasonable default, user may prefer different |
| No style pack, unclear domain | 3 | Ask for domain | Material impact, cannot infer |
| Tone specified in style pack | 1 | Use it, log | Explicit specification |
| Tone not specified, inferable | 2 | Infer conservative, flag | Reasonable default, user may prefer different |
| Tone contradictory | 3 | Ask to resolve | Cannot choose without user input |
| Audience clear from context | 1 | Use it, log | Directly inferable |
| Audience ambiguous | 3 | Ask for audience | Material impact on content |
| Section order logical | 1 | Use logical order, log | Clear from dependencies |
| Section order ambiguous | 2 | Choose conservative, flag | Reasonable default |
| Source material missing | 3 | Ask for material, continue unblocked work | Cannot proceed without, but don't halt |
| Optional guide missing | 2 | Proceed with defaults, flag | Can continue with reduced quality |
| Required guide missing | 3 | Ask to create guide | Required by doctrine |
| Tool failure with fallback | 1 | Use fallback, log | Fallback available |
| Tool failure without fallback | 3 | Report failure, continue what's possible | Cannot proceed, but don't halt |

---

## Integration with Cache-Server

### Logging Autonomy Decisions

```javascript
// Log Type 1 assumptions in discovery report
const discoveryReport = {
  assumptions: [
    {
      type: 'Type1',
      decision: 'Domain classified as technical-writing',
      basis: 'Task mentions API documentation and developer tools',
      timestamp: new Date().toISOString()
    }
  ]
};

cache.save_artifact({
  run_id: currentRunId,
  artifact_type: 'structured-data',
  content: JSON.stringify(discoveryReport)
});
```

### Logging Type 2 Flags

```javascript
// Log Type 2 flags in step metadata
cache.save_step({
  run_id: currentRunId,
  step_name: 'style-pack-selection',
  agent: 'discovery-orchestrator',
  output_summary: JSON.stringify({
    decision: 'Selected technical-writing.md',
    flagged: true,
    alternatives: ['general.md', 'developer-docs.md'],
    override: 'To use different style pack, specify in brief'
  }),
  status: 'completed'
});
```

### Logging Type 3 Blockers

```javascript
// Log Type 3 blockers via save_blocker
cache.save_blocker({
  run_id: currentRunId,
  step_id: currentStepId,
  blocker_type: 'B1-missing-user-decision',
  description: 'Audience not specified: beginner, intermediate, or expert?',
  resolution_required: 'User must specify target audience level',
  severity: 'blocking'
});
```

---

## Quality Gate for Autonomy

**Pass Criteria:**
- ✅ All Type 1 decisions logged with basis
- ✅ All Type 2 decisions flagged with override path
- ✅ All Type 3 decisions result in specific questions (not vague)
- ✅ No Type 3 decisions treated as Type 1 (no hallucination)
- ✅ No Type 1 decisions treated as Type 3 (no unnecessary interruption)
- ✅ All unblocked work continued despite blockers

**Fail Criteria:**
- ❌ Type 1 decision not logged (assumption hidden)
- ❌ Type 2 decision not flagged (user can't override)
- ❌ Type 3 decision made without asking (hallucination)
- ❌ Type 1 decision escalated unnecessarily (wasted user time)
- ❌ Unblocked work halted due to blocker (unnecessary halt)

---

## Cross-References

- `doctrine/AUTONOMOUS_EXECUTION.md` — Type 1/2/3 decision classification
- `doctrine/BLOCKER_CLASSIFICATION.md` — B1-B9 blocker taxonomy
- `doctrine/PARTIAL_COMPLETION.md` — Partial output standards
- `workflows/discovery.md` — Discovery workflow with autonomy rules
- `workflows/blockage.md` — Blockage workflow with autonomy rules
- `agents/discovery-agent.md` — Discovery agent autonomy rules
- `agents/blockage-handler.md` — Blockage handler autonomy rules
