# DECOMPOSITION RULES

**Status:** Canonical. Defines how orchestrators break down work and assign it to subagents.

---

## Mission

Work decomposition determines output quality and coordination overhead. Poor decomposition causes voice inconsistency, scope overlap, wasted work, handoff failures, and merge collisions. Good decomposition produces clean parallel execution, minimal coordination overhead, and predictable outputs.

This doctrine defines how orchestrators must decompose tasks before dispatching subagents. Decomposition happens before execution — not during it.

---

## Core Decomposition Principles

### Decompose by Function, Not by Chunk Size

Wrong: split a 3,000-word document into three 1,000-word chunks and assign one to each agent.

Right: split the document into discrete functional stages — discovery, briefing, outlining, per-section drafting, merge normalization, QA — and assign one agent per stage, with per-section drafters running in parallel within the drafting stage.

Chunk-based decomposition produces: voice inconsistency at chunk boundaries, repeated content at seams, structural incoherence when chunks were written with different section context, and merge failures that require expensive re-drafting.

Function-based decomposition produces: clean handoffs with defined schemas, stages that can be parallelized safely, and predictable inputs and outputs at each boundary.

### Assign Bounded Scopes

Each subagent must have one clear scope that it owns completely. Scopes must not overlap. When two agents could both plausibly touch the same content, define one as primary (writes) and one as reviewer (critiques). Never let two agents write to the same scope concurrently without a defined merge protocol.

A scope definition must specify:
- What the agent is responsible for producing
- What inputs it receives (and from which prior stage)
- What outputs it produces (format and schema)
- What it is explicitly not responsible for

If you cannot write a clear scope definition for a subagent, the decomposition is not ready.

### Separate Writing from Reviewing

A subagent that drafts a section must not also review it. The drafting agent knows what it was trying to do — it will not catch its own blind spots. Route all finished drafts through a distinct review agent. The review agent's only job is to evaluate against defined criteria — not to redraft.

This applies even in single-agent workflows: complete the draft, then switch to review mode explicitly, do not attempt concurrent drafting and reviewing.

### Normalize at Merge Time, Not Drafting Time

Multiple subagents writing parallel sections will produce inconsistent voice, tone, sentence rhythm, and structural choices. This is expected and acceptable. Do not try to enforce voice consistency during parallel drafting by adding instructions to each agent — this creates coordination overhead without solving the root problem.

Instead: run a dedicated merge-normalizer agent after assembly. The merge-normalizer's only job is voice and style consistency across the assembled document. It does not revise content, structure, or accuracy — only surface consistency.

### Define Handoff Formats Before Dispatching

Every agent handoff must use a defined schema or structured format. An agent that produces "a paragraph summary and some notes" is not producing a valid handoff. Valid handoff formats include:

- JSON conforming to a named schema (e.g., `brief.schema.json`)
- Structured markdown with defined required sections
- Checklists with pass/fail fields
- Issue lists with classification fields (block / revise / note)

If a receiving agent cannot parse the handoff without reading prose for context, the handoff format is invalid. Fix the schema, not the receiving agent.

### Scope Maximum Rule

No single subagent should own more than:
- One document section (for section-drafter agents)
- One review perspective (for qa-* agents)
- One workflow stage (for orchestration-layer agents)

When a subagent is asked to span multiple scopes in one pass, it produces unfocused output. The constraint is strict by default. Exceptions must be explicitly documented in the orchestration plan with justification.

---

## Standard Document Decomposition Sequence

This is the default decomposition for a full document production run. Deviations must be justified in the orchestration plan.

```
1. discovery-agent
   Input: user request, available project context, guide library
   Output: discovery_report (discovery_report.schema.json)
   Parallel: no — must complete before brief

2. brief-writer
   Input: discovery_report, user instruction
   Output: brief (brief.schema.json)
   Parallel: no — must complete before outline

3. outline-architect
   Input: brief
   Output: outline (outline.schema.json)
   Parallel: no — must complete before section drafting

4. section-drafter × N (one per section)
   Input: outline (section definition), brief, relevant guides, style pack
   Output: section draft (section_draft.schema.json)
   Parallel: YES — all section-drafters run concurrently

5. merge-normalizer
   Input: all section drafts, style pack, voice pack
   Output: assembled document with normalized voice
   Parallel: no — runs after all section drafts are complete

6. qa-* agents (run in parallel)
   - qa-reader: reader experience and flow
   - qa-skeptic: factual claims, unsupported assertions, logical gaps
   - qa-coherence: internal consistency, canon compliance
   - qa-ai-stink: AI-generated language detection
   Input: assembled document
   Output: structured issue list (qa_review.schema.json) per agent
   Parallel: YES — all QA agents run concurrently on the same document

7. lead-editor
   Input: assembled document + all QA issue lists
   Output: final document + resolved issue log
   Parallel: no — final gate
```

For shorter tasks or single-section documents, steps may be collapsed. Document the collapsed steps in the orchestration log.

---

## Parallelization Decision Rules

**Safe to parallelize:**
- Section drafters (one per section, non-overlapping scope)
- QA agents (each reviewing from a different perspective on the same static document)
- Guide creation agents (one per guide, non-overlapping subject matter)

**Must be sequential:**
- Discovery → Brief → Outline → [parallel section drafting] → Merge → [parallel QA] → Final
- Any step where the output of step N is the input of step N+1
- Any step that writes to shared state (run cache, canon records, guide library)

**Conflict risk — requires coordination:**
- Two agents updating the same guide simultaneously
- Two agents appending to the same run log
- Any agent that reads from and writes to the same schema record in the same pass

When conflict risk exists, assign one agent as primary writer and route others through the primary agent or through a merge step.

---

## Handoff Schema Requirements

Every inter-agent handoff must conform to a named schema. The schemas that must exist for a standard run:

| Handoff | Schema |
|---|---|
| Discovery → Brief | `discovery_report.schema.json` |
| Brief → Outline | `brief.schema.json` |
| Outline → Section Drafters | `outline.schema.json` |
| Section Drafters → Merge Normalizer | `section_draft.schema.json` |
| Merge Normalizer → QA Agents | *(assembled document, no schema required)* |
| QA Agents → Lead Editor | `qa_review.schema.json` |
| Lead Editor → Output | `final_document.schema.json` |

If a schema does not exist for a required handoff, do not proceed with the handoff. Create the schema or use the closest existing one and document the deviation.

---

## Anti-Patterns

**One-agent-does-everything:** A single agent attempting discovery, briefing, drafting, and QA in one pass. This is the highest-risk decomposition failure. It produces all the problems that decomposition is designed to prevent: voice that is neither consistent nor distinctive, structural problems discovered only at the end, and no checkpoint for human review.

**Chunk-based splits:** Assigning "the first half" and "the second half" to two agents. Guarantees voice and structural inconsistencies at the midpoint and forces expensive re-normalization.

**Skipping merge-normalization:** Assembling parallel section drafts and declaring the document done. Without normalization, voice inconsistency will be detectable to any careful reader.

**Vague handoffs:** Agent A produces "a summary of findings and some thoughts" for Agent B. Agent B cannot operate on this. It must ask clarifying questions or make assumptions — both of which are decomposition failures that appear as execution failures.

**Overlapping QA scopes:** Assigning two QA agents to the same perspective. They will produce duplicate issues and conflicting recommendations. Define non-overlapping QA perspectives before dispatch.

**Skipping discovery:** Starting at briefing or outlining without a discovery pass when the project context is not fully established. Brief-writers and outline-architects that lack context produce documents that do not fit the project.

---

## Cross-References

- `doctrine/QUALITY_GATES.md` — what each phase must produce before the next phase begins
- `doctrine/AUTONOMOUS_EXECUTION.md` — how agents make decisions within their assigned scope
- `.claude/agents/` — individual agent definitions and scope specifications
- `schemas/` — all handoff schema definitions
- `doctrine/VOICE_MODEL.md` — merge-normalizer rules for voice consistency
