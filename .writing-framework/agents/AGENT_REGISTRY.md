# Agent Registry

**Version:** 2.0 (Phase 2)
**Source of truth:** Individual agent specs in `.writing-framework/agents/`

This registry is the index of all agents in the Editorial Orchestrator framework. Use it to find the right agent for a task, understand the agent taxonomy, and verify there is no scope overlap between agents.

Do not define agent behavior here â€” that lives in individual spec files. This file is a navigation and reference index only.

---

## Agent Taxonomy

The framework defines 27 agents across three categories.

### Category 1: Meta / Orchestration (10 agents)

These agents coordinate work, route tasks, manage run state, handle blockers, and manage sync operations. They do not write prose.

| Agent | Role Summary | Owns | Invoked By |
|-------|-------------|------|-----------|
| `lead-orchestrator` | Coordinates all workflow stages for a run. Enforces quality gates. Routes between agents. | Run lifecycle, gate decisions | User-facing commands, /orchestrate-* |
| `intake-router` | Classifies incoming tasks and routes to the correct workflow entry point. | Task routing decision | lead-orchestrator, /session-start |
| `discovery-orchestrator` | Coordinates the discovery pass. Delegates to discovery-agent. Produces discovery report. | Discovery report | lead-orchestrator, /discovery |
| `discovery-agent` | Executes discovery work: reads repo, infers context, identifies blockers. | Discovery findings | discovery-orchestrator |
| `blockage-handler` | Classifies blockers (B1-B9), scopes impact, continues unblocked work, produces resume plans. | blocker_report.json | Any agent that encounters a blocker |
| `brief-writer` | Produces the project brief (brief.json) from user goal and discovery context. | brief.json | lead-orchestrator, /write-brief, /orchestrate-brief |
| `artifact-orchestrator` | Manages artifact generation and export pipeline. Coordinates write/export commands. | artifact_manifest.json | lead-orchestrator, /orchestrate-artifact |
| `import-export-orchestrator` | Manages outbound framework publishing and compatibility bundle operations. | Framework export state | lead-orchestrator, /export-framework, /export-pack, /install-framework |
| `framework-sync-agent` | Executes inbound framework synchronization and compatibility imports. | sync_manifest.json | /import-framework, /sync-framework, /upgrade-framework |
| `principles-sync-agent` | Preserves legacy doctrine/style compatibility flows. | Doctrine sync state | /sync-principles, /import-principles, /export-principles |

### Category 2: Writing / Editing (10 agents)

These agents produce, structure, assemble, and refine document prose. Final assembled prose is owned by `merge-normalizer` (during drafting) and `lead-orchestrator` (for routing). Other writing agents produce bounded outputs only.

| Agent | Role Summary | Owns | Invoked By |
|-------|-------------|------|-----------|
| `lead-editor` | Oversees the editorial pipeline. Routes drafts through revision, review, and editorial passes. Makes structural decisions. | Editorial routing decisions | lead-orchestrator, /orchestrate-review |
| `outline-architect` | Produces the document outline (outline.json) from brief.json. Defines section structure. | outline.json | lead-orchestrator, /write-outline, /orchestrate-outline |
| `section-drafter` | Drafts one assigned section per invocation. Produces bounded section output. | section_draft (per section) | lead-orchestrator, /draft-section |
| `merge-normalizer` | Assembles section drafts into a unified document. Normalizes voice. Holds final prose ownership during assembly. | draft.md, merge_report.json | lead-orchestrator, /merge-draft |
| `voice-editor` | Applies voice normalization against the active style pack. Single-pass voice correction. | Voice-corrected draft | lead-orchestrator, /voice-pass |
| `line-editor` | Applies line-level editing: sentence clarity, rhythm, word choice. Does not change structure. | Line-edited draft | lead-editor, /line-edit |
| `clarity-editor` | Targets unclear or ambiguous passages. Rewrites for reader comprehension. | Clarity-edited draft | lead-editor, /line-edit (clarity mode) |
| `compression-editor` | Removes redundancy, tightens prose, reduces word count without losing content. | Compressed draft | lead-editor, /compress |
| `canon-checker` | Checks document content against canon guide records. Flags violations. | canon_check_report.json | lead-orchestrator, /canon-check |
| `adversarial-reviewer` | Reviews document from an adversarial perspective. Finds weaknesses before QA. | adversarial_review_report | lead-editor, /orchestrate-review |

### Category 3: QA (7 agents)

QA agents evaluate documents from distinct perspectives. They do not edit. They report findings and issue perspective-level verdicts. `qa-final` aggregates and issues the gate decision.

| Agent | Perspective | Finds | Schema |
|-------|-------------|-------|--------|
| `qa-reader` | Reader | Assumed knowledge, unclear references, unmet reader needs | review_report.schema.json |
| `qa-skeptic` | Skeptic | Thin arguments, ungrounded claims, padding, weak conclusions | review_report.schema.json |
| `qa-domain` | Domain | Terminology errors, canon violations, domain convention failures | review_report.schema.json |
| `qa-style` | Style pack | Voice deviations, formatting violations, prohibited terms | review_report.schema.json |
| `qa-coherence` | Coherence | Structural gaps, disconnected transitions, contradictions, orphaned points | review_report.schema.json |
| `qa-ai-stink` | AI-stink detection | Hollow affirmations, oversmooth transitions, unearned gravitas, filler phrases | review_report.schema.json |
| `qa-final` | Aggregator / gate | Aggregates all perspectives, issues ACCEPT/REVISE/BLOCK | quality_gate.schema.json |

---

## Scope Overlap Analysis

Potential overlap areas and how they are resolved:

| Overlap Area | Agents Involved | Resolution |
|-------------|-----------------|------------|
| Voice normalization | voice-editor, merge-normalizer, section-drafter | merge-normalizer normalizes across assembled sections; voice-editor does a single-pass post-assembly correction; section-drafter applies voice when drafting but does not normalize across sections |
| Structural decisions | outline-architect, lead-editor, section-drafter | outline-architect owns all structural decisions before drafting; lead-editor owns structural revision decisions after QA; section-drafter flags scope deviations but does not make structural changes |
| Blocker handling | blockage-handler, lead-orchestrator, any agent | Any agent classifies its own blocker; blockage-handler handles routing and scoping; lead-orchestrator decides path continuation; no agent other than blockage-handler produces authoritative blocker_report.json |
| Prose editing | line-editor, clarity-editor, voice-editor, compression-editor | Each has a distinct axis: rhythm/word choice (line-editor), comprehension (clarity-editor), register/voice (voice-editor), length (compression-editor). They do not overlap. lead-editor routes to the right one. |
| QA findings | qa-* agents, adversarial-reviewer | QA agents apply fixed perspectives; adversarial-reviewer applies an unconstrained adversarial lens before QA. They do not duplicate â€” adversarial review precedes, QA follows. |
| Gate decisions | qa-final, lead-orchestrator | qa-final issues the gate decision; lead-orchestrator enforces it (decides whether to route to revision, requeue, or escalate to user). Gate decision making belongs to qa-final; gate enforcement belongs to lead-orchestrator. |
| Sync operations | framework-sync-agent, principles-sync-agent, import-export-orchestrator | framework-sync-agent handles primary inbound sync; import-export-orchestrator handles primary outbound sync; principles-sync-agent preserves the legacy doctrine/style compatibility layer. |

---

## Final Prose Ownership

**Doctrine rule:** Final prose ownership over assembled documents is held exclusively by:
1. `merge-normalizer` â€” during assembly of section drafts into draft.md
2. `lead-orchestrator` â€” for final output routing and artifact production

All other agents produce bounded outputs that feed these owners. No other agent modifies assembled document prose directly. Agents that produce section-level prose (section-drafter) or pass-level edits (line-editor, voice-editor, etc.) do so within their bounded scope only â€” they do not hold ownership of the assembled document.

---

## Agent Invocation Matrix

Which commands invoke which agents:

| Command Group | Primary Agents |
|--------------|---------------|
| /session-start, /status | lead-orchestrator, intake-router |
| /discovery, /project-scan | discovery-orchestrator, discovery-agent |
| /write-brief, /requirements-brief | brief-writer |
| /write-outline | outline-architect |
| /draft-section, /draft-document | section-drafter, lead-orchestrator |
| /merge-draft | merge-normalizer |
| /voice-pass | voice-editor |
| /line-edit | line-editor, clarity-editor |
| /compress | compression-editor |
| /canon-check | canon-checker |
| /qa-reader through /qa-ai-stink | respective QA agents |
| /qa-final | qa-final |
| /orchestrate-* | lead-orchestrator (coordinates all) |
| /export-framework, /export-pack, /install-framework | import-export-orchestrator |
| /import-framework, /sync-framework, /upgrade-framework | framework-sync-agent |
| /sync-principles, /import-principles, /export-principles | principles-sync-agent |
| /write-markdown through /artifact-validate | artifact-orchestrator |

---

## Agent File Index

All agent specs live in `.writing-framework/agents/`. Each file follows the ROLE_CONTRACT_TEMPLATE.md format.

| File | Agent | Status |
|------|-------|--------|
| lead-orchestrator.md | Lead Orchestrator | Active (Phase 2) |
| intake-router.md | Intake Router | Active (Phase 2) |
| discovery-orchestrator.md | Discovery Orchestrator | Active (Phase 2) |
| discovery-agent.md | Discovery Agent | Active (Phase 2) |
| blockage-handler.md | Blockage Handler | Active (Phase 2) |
| brief-writer.md | Brief Writer | Active (Phase 2) |
| artifact-orchestrator.md | Artifact Orchestrator | Active (Phase 2) |
| import-export-orchestrator.md | Import/Export Orchestrator | Active (Phase 2) |
| framework-sync-agent.md | Framework Sync Agent | Active (Phase 2) |
| principles-sync-agent.md | Principles Sync Agent | Active (Phase 2) |
| lead-editor.md | Lead Editor | Active (Phase 2) |
| outline-architect.md | Outline Architect | Active (Phase 2) |
| section-drafter.md | Section Drafter | Active (Phase 2) |
| merge-normalizer.md | Merge Normalizer | Active (Phase 2) |
| voice-editor.md | Voice Editor | Active (Phase 2) |
| line-editor.md | Line Editor | Active (Phase 2) |
| clarity-editor.md | Clarity Editor | Active (Phase 2) |
| compression-editor.md | Compression Editor | Active (Phase 2) |
| canon-checker.md | Canon Checker | Active (Phase 2) |
| adversarial-reviewer.md | Adversarial Reviewer | Active (Phase 2) |
| qa-reader.md | QA Reader | Active (Phase 2) |
| qa-skeptic.md | QA Skeptic | Active (Phase 2) |
| qa-domain.md | QA Domain | Active (Phase 2) |
| qa-style.md | QA Style | Active (Phase 2) |
| qa-coherence.md | QA Coherence | Active (Phase 2) |
| qa-ai-stink.md | QA AI-Stink | Active (Phase 2) |
| qa-final.md | QA Final | Active (Phase 2) |

