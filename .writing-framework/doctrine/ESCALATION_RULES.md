# ESCALATION RULES

**Status:** Canonical doctrine. These rules are non-negotiable. They govern when and how agents escalate. No agent may deviate from these rules based on convenience, time pressure, or a judgment that a different escalation path would be faster.

**Authority:** This file takes precedence over per-agent escalation trigger descriptions. When a per-agent spec describes an escalation trigger differently from this document, this document governs the behavior.

**Relation to other doctrine:** This file governs escalation routing. `doctrine/PROGRESSIVE_UNBLOCKING.md` governs blocker classification and partial output production. `doctrine/HUMAN_IN_THE_LOOP_GATES.md` governs which conditions require human input. Read all three before handling any blocker or escalation.

---

## Section 1: Escalation Principles

These principles are not guidelines. Every principle is a behavioral constraint.

---

**Principle 1: Escalation goes up the chain, not sideways.**

Agents escalate to the agent above them in the hierarchy, not to peer agents. section-drafter escalates to lead-orchestrator, not to lead-editor. qa-reader escalates to lead-orchestrator, not to qa-final. qa-final escalates to lead-orchestrator, not back to the QA agents.

The only exception is the blockage-handler pathway: any agent may route a blocker_report.json to blockage-handler, but this is not a peer escalation — blockage-handler is a specialized handling layer that feeds back to lead-orchestrator. Routing a blocker to blockage-handler is not a substitute for following the escalation chain.

Sideways escalation — routing to a peer agent to resolve a blocker — bypasses the orchestration layer and creates untracked state changes. It is forbidden.

---

**Principle 2: Every escalation produces a structured artifact.**

No silent failures. No verbal escalations. No escalation by omission (stopping work without documentation). Every escalation produces one of two artifacts:

1. **blocker_report.json** — for blockers that require classification, scoping, and a resume plan
2. **A flagged output with a populated `issues` field** — for outputs that are delivered but contain known deficiencies that require review

Both artifacts must comply with their schemas before delivery. An escalation without a structured artifact is a workflow halt, not an escalation, and workflow halts are forbidden.

---

**Principle 3: Escalation does not stop unblocked work.**

When an agent encounters a blocker and escalates, it continues all work that is not downstream of the blocker. The escalation is localized to the blocked branch. The rest of the run proceeds.

An agent that halts all work because one section or one branch is blocked has failed its escalation obligation. The correct behavior is: classify the blocker, produce the structured artifact, continue all unblocked work, deliver partial outputs with RESUME sections.

---

**Principle 4: Escalation thresholds are defined per agent.**

"Use judgment" is not a valid escalation threshold. Every agent in this system has defined conditions that trigger escalation. These conditions are specific, not vague. An agent that escalates based on a feeling that something is wrong, without a defined trigger condition being met, is escalating incorrectly.

If an agent encounters a situation that is not covered by its defined escalation triggers, the correct behavior is to classify the situation using the B1-B9 taxonomy, determine the closest matching trigger, proceed with the classification, and note in the blocker_report.json that the trigger required classification judgment.

---

**Principle 5: Escalation level determines routing.**

There are four escalation levels. Each level routes differently. An agent that bypasses Level 2 to route directly to Level 4 (the human gate) when a Level 2 resolution would suffice has violated the escalation protocol. Agents must route to the appropriate level — not the highest available level to avoid the effort of trying.

---

## Section 2: Escalation Chain

The four escalation levels define the routing hierarchy for every blocker or unresolvable issue.

---

**Level 1 — Within-agent self-resolution**

The agent resolves the issue autonomously without escalating.

Applies when:
- A reasonable default exists and the choice is reversible
- The decision is inferable from context (brief, doctrine, style pack, prior discovery report)
- The error is detectable and correctable within the agent's own scope
- The issue does not affect other agents' inputs or outputs

What the agent does: applies the inference or default, logs it as a Type 2 assumption in the output's `assumptions` field or `issues` field, continues work.

What the agent does not do: ask the user, stop work, route to blockage-handler.

---

**Level 2 — Agent → blockage-handler**

The agent cannot self-resolve the blocker. It classifies the blocker, identifies impacted scope, continues all unblocked work, produces partial outputs, and routes a blocker_report.json to blockage-handler.

Applies when:
- A B-type blocker has been identified that prevents completion of one or more outputs
- The blocker is scoped — only some work is affected
- The blocked work can be resumed when the blocker is resolved
- The resolution does not require a user decision

What the agent does: classify the blocker using the B1-B9 taxonomy; produce all unblocked outputs; produce a blocker_report.json with a complete resume plan; route to blockage-handler; continue all unblocked work.

What the agent does not do: stop all work, escalate directly to lead-orchestrator, route to the human gate.

---

**Level 3 — blockage-handler → lead-orchestrator**

blockage-handler has received a blocker report and determined that the resolution requires either a human gate trigger or an alternate workflow path that only lead-orchestrator can authorize.

Applies when:
- The blocker classification is B1 (missing user decision) and the decision is not inferable
- The blocker is B8 (contradictory instructions) that cannot be resolved by priority ordering
- Multiple overlapping blockers cover more than 50% of planned output
- The blocker type meets one of the human gate trigger conditions defined in Section 4

What blockage-handler does: complete the full blocker_report.json including all partial outputs produced; route to lead-orchestrator with explicit recommendation on whether this requires a human gate trigger or an autonomous resolution path.

What blockage-handler does not do: route directly to the human gate bypassing lead-orchestrator; resolve B8 contradictions unilaterally.

---

**Level 4 — lead-orchestrator → Human Gate**

lead-orchestrator has determined that the blocker requires user input. It triggers the appropriate human gate (Gate 1 through Gate 5 from `doctrine/HUMAN_IN_THE_LOOP_GATES.md`), surfaces the structured question using the defined gate format, and continues all unblocked work while waiting.

Applies when:
- Gate 1 trigger: required input is completely missing and cannot be inferred
- Gate 2 trigger: consequential ambiguity exists between two substantially different outputs
- Gate 3 trigger: the user request contradicts established doctrine
- Gate 4 trigger: canon conflict exists that requires a resolution decision
- Gate 5 trigger: a destructive operation is pending

What lead-orchestrator does: produce the gate-format output; state the default action clearly; continue all unblocked branches while waiting for user response; log the gate trigger in the run cache.

What lead-orchestrator does not do: halt all work while waiting; repeat the same gate ask after receiving no response (apply the stated default and proceed); route to the human gate for issues resolvable at Level 1, 2, or 3.

---

## Section 3: Escalation Triggers by Agent

For each agent: specific conditions that trigger escalation, the escalation level, the structured output produced, and what continues while the escalation is pending.

---

### intake-router

| Trigger | Level | Output | Continues |
|---------|-------|--------|-----------|
| Task type is genuinely ambiguous between two substantially different workflows (e.g., new document vs. revision of existing) and the distinction materially changes the entry point | 4 (Gate 2) | routing_decision.json with confidence_level="low" + open_questions populated; lead-orchestrator surfaces Gate 2 ask | No writing work begins until routing is confirmed; task description intake is complete |
| Required domain context is completely absent and no domain-specific command can be determined | 4 (Gate 1) | routing_decision.json with confidence_level="low" + open_questions populated | Task description captured; routing_decision delivered to lead-orchestrator for gate trigger |

---

### discovery-agent

| Trigger | Level | Output | Continues |
|---------|-------|--------|-----------|
| None — discovery-agent does not escalate. All gaps and ambiguities are documented in findings_report.json and passed to discovery-orchestrator for classification. | — | findings_report.json with gaps[] populated | All scanning continues; gaps are reported, not blocked on |

---

### discovery-orchestrator

| Trigger | Level | Output | Continues |
|---------|-------|--------|-----------|
| Task description is so underspecified that even the task type cannot be determined after full project inspection | 4 (Gate 1) | discovery_report.json with blockers[] containing B1 blocker; immediate_next_actions specifies Gate 1 ask | All readable context is still gathered; discovery_report delivered with the blocker documented |
| Contradictory instructions in CLAUDE.md and doctrine/ that cannot be reconciled (B8 blocker) | 3 → 4 | blocker_report.json (B8) routed to lead-orchestrator for Gate 3 trigger | All non-contradictory context gathered; discovery_report delivered with B8 blocker documented |

---

### brief-writer

| Trigger | Level | Output | Continues |
|---------|-------|--------|-----------|
| Audience is completely unknown and cannot be inferred from any available context — the two most plausible audiences would produce different documents | 4 (Gate 1) | brief.json with audience partially populated and open_questions containing B1 blocker | All other brief fields (purpose, scope, constraints) are drafted to the extent possible without audience; partial brief delivered |
| Contradictory instructions about scope that cannot be resolved by priority (explicit user instruction vs. doctrine constraint) | 4 (Gate 3) | blocker_report.json (B8) routed to lead-orchestrator; Gate 3 triggered | Other brief fields continue; conflicting scope fields marked as pending in brief.json |
| No style pack available and tone is a critical project-specific requirement that cannot default | 2 | blocker_report.json (B7) | All other brief fields produced; tone field marked as pending |

---

### outline-architect

| Trigger | Level | Output | Continues |
|---------|-------|--------|-----------|
| Brief scope is too large for a single document (would require more than twice the maximum word count) | 2 → 3 | blocker_report.json (B1, flagged as scope-too-large); recommendation to split into series routed to lead-orchestrator | Outline scaffold produced to document the scope; no section drafting begins |
| Required template is missing and the document type is specialized enough that a generic structure would be inappropriate | 2 | blocker_report.json (B2); generic structure placeholder produced with flag | Generic outline structure produced where possible; flagged sections noted |
| Brief success criteria cannot be mapped to any coherent section structure | 4 (Gate 1) | blocker_report.json (B1, scope-conflict); routed to lead-orchestrator for Gate 1 ask | No outline produced until success criteria are clarified; discovery is complete |

---

### section-drafter

| Trigger | Level | Output | Continues |
|---------|-------|--------|-----------|
| Required source material referenced in section_entry.source_refs is missing or inaccessible (B4) | 2 | section_draft.json with status="blocked", content containing structural placeholder, blocker_report field populated (B4) | All other assigned sections (in parallel instances) continue; this section's structure is scaffolded |
| Canon conflict found in section content (B8) | 2 → 3 | section_draft.json with status="blocked" at the conflicting claim; blocker_report (B8) routed to lead-orchestrator for Gate 4 | All non-conflicting section content is drafted; only the specific conflicting claim is held |
| Section scope substantially different from what the content actually requires (deviation >50% of estimated word count) | 1 | section_draft.json with deviation documented in issues[]; draft produced to content requirements | Section is delivered; deviation is flagged for lead-editor review at Draft Gate |

---

### merge-normalizer

| Trigger | Level | Output | Continues |
|---------|-------|--------|-----------|
| Voice inconsistencies so severe that normalization would require rewriting more than 30% of any single section | 2 | merge_report.json with the severe inconsistency flagged in scope_deviations; section marked as requiring lead-editor review before advancing | Remaining sections are assembled; the flagged section passes through unnormalized with flag documented |
| Placeholder sections affect more than one-third of the document's total planned content | 3 | merge_report.json delivered with flag to lead-orchestrator; escalation note identifying the threshold breach | Assembly proceeds; draft.md produced with all placeholders clearly marked; escalation routed before QA dispatch |

---

### lead-editor

| Trigger | Level | Output | Continues |
|---------|-------|--------|-----------|
| Irresolvable conflict between stated user style preference and doctrine rules | 4 (Gate 3) | review_report.json with gate_decision=BLOCK and Gate 3 conflict documented; lead-orchestrator triggers Gate 3 | Gate decision delivered; no revision dispatched until Gate 3 is resolved |
| Canon conflict found in draft content | 4 (Gate 4) | review_report.json with canon conflict documented; blocker_report.json (B8) routed to lead-orchestrator for Gate 4 | All non-canon sections reviewed; revision pass on canon sections suspended until Gate 4 resolves |
| Scope expansion beyond the approved brief detected in the draft | 4 (Gate 2) | review_report.json flagging the scope expansion; lead-orchestrator triggers Gate 2 asking whether to expand the brief or trim the draft | Gate decision is pending; revision plan for non-scope-expansion issues is prepared in parallel |
| Revision loop exceeds three passes on the same issue without resolution | 3 | review_report.json with escalation note; lead-orchestrator determines whether to route to user or apply a different resolution path | All other issues continue through revision; only the looping issue is escalated |

---

### brief-writer (sub-role: canon-checker invocation for brief)

This applies when lead-editor receives brief.json and identifies canon-relevant content during the Brief Gate review. The lead-editor routes the brief to canon-checker. canon-checker does not escalate; it reports. lead-editor acts on the report.

---

### qa-reader

| Trigger | Level | Output | Continues |
|---------|-------|--------|-----------|
| draft.md or brief.json absent or empty | 2 | blocker_report.json (B2) routed to lead-orchestrator | Other QA agents continue; qa-final cannot close gate until this agent delivers |
| No escalation triggers for content findings — all findings are documented in review_report.json regardless of severity | — | review_report.json with gate_implication populated | N/A — QA agents do not escalate content findings; they report them |

---

### qa-skeptic

| Trigger | Level | Output | Continues |
|---------|-------|--------|-----------|
| draft.md or brief.json absent or empty | 2 | blocker_report.json (B2) | Other QA agents continue |
| No escalation triggers for content findings | — | review_report.json | N/A |

---

### qa-domain

| Trigger | Level | Output | Continues |
|---------|-------|--------|-----------|
| draft.md or brief.json absent or empty | 2 | blocker_report.json (B2) | Other QA agents continue |
| Canon conflict found during domain review — not an escalation; always documented in review_report.json and passed to qa-final, which routes it to lead-orchestrator | — | review_report.json with canon conflict issue; gate_implication reflects severity | N/A — canon conflicts found in QA are reported in review_report; they become Gate 4 triggers if qa-final classifies them as blocking |

---

### qa-style

| Trigger | Level | Output | Continues |
|---------|-------|--------|-----------|
| draft.md, brief.json, or style pack absent | 2 | blocker_report.json (B2 or B7 depending on what is absent) | Other QA agents continue |
| No escalation triggers for content findings | — | review_report.json | N/A |

---

### qa-coherence

| Trigger | Level | Output | Continues |
|---------|-------|--------|-----------|
| draft.md or brief.json absent or empty | 2 | blocker_report.json (B2) | Other QA agents continue |
| No escalation triggers for content findings | — | review_report.json | N/A |

---

### qa-ai-stink

| Trigger | Level | Output | Continues |
|---------|-------|--------|-----------|
| draft.md absent or empty | 2 | blocker_report.json (B2) | Other QA agents continue |
| No escalation triggers for content findings | — | review_report.json | N/A |

---

### qa-final

| Trigger | Level | Output | Continues |
|---------|-------|--------|-----------|
| Any required QA perspective report is missing | 2 | quality_gate.json with missing_perspectives[] populated; gate cannot close; lead-orchestrator routes to reacquire the missing report | Gate remains open; all received reports are aggregated and ready |
| Conflicting gate implications across perspectives (e.g., qa-domain says accept-level, qa-coherence says block-level) | 3 | quality_gate.json with conflict documented in justification; blocker routed to lead-orchestrator who surfaces to lead-editor for resolution | Gate decision deferred on the conflicting criteria; non-conflicting criteria are fully aggregated |
| Brief success criteria that no QA report has addressed | 3 | quality_gate.json with the uncovered criterion documented in success_criteria_evaluation as "unevaluated"; blocker routed to lead-orchestrator before finalizing | Gate decision deferred until uncovered criteria are evaluated or explicitly waived |
| Blocking issues that cannot be resolved by revision (e.g., fundamental scope mismatch with brief) | 4 (Gate 1 or Gate 2) | quality_gate.json with gate_decision=BLOCK; lead-orchestrator triggers appropriate human gate | Gate decision delivered; revision routes for resolvable issues are prepared in the revision_priority_list |

---

### adversarial-reviewer

| Trigger | Level | Output | Continues |
|---------|-------|--------|-----------|
| None — adversarial-reviewer does not escalate. All findings are reported in adversarial_review.json. Severity classifications signal priority to qa-final. | — | adversarial_review.json | N/A |

---

### canon-checker

| Trigger | Level | Output | Continues |
|---------|-------|--------|-----------|
| None — canon-checker does not escalate. CONFLICT classifications are reported in canon_check_report.json. Escalation from canon conflicts is the responsibility of the agent that invoked canon-checker (lead-editor or lead-orchestrator). | — | canon_check_report.json | N/A |

---

### voice-editor

| Trigger | Level | Output | Continues |
|---------|-------|--------|-----------|
| None — voice-editor does not escalate. Passages where voice cannot be fixed without structural rewriting are flagged in voice_notes under structural_flags with recommended_routing, but the agent does not route them directly. lead-editor acts on structural_flags. | — | edited_draft.md + voice_notes with structural_flags[] | N/A |

---

### clarity-editor

| Trigger | Level | Output | Continues |
|---------|-------|--------|-----------|
| None within the specialist editor role. Passages requiring structural rewriting beyond clarity scope are flagged in edit_notes for lead-editor routing. | — | edited_draft.md + edit_notes | N/A |

---

### line-editor

| Trigger | Level | Output | Continues |
|---------|-------|--------|-----------|
| None within the specialist editor role. Grammar or style issues outside line-editor scope are flagged in edit_notes. | — | edited_draft.md + edit_notes | N/A |

---

### compression-editor

| Trigger | Level | Output | Continues |
|---------|-------|--------|-----------|
| None within the specialist editor role. Structural padding that cannot be removed without content loss is flagged in edit_notes. | — | edited_draft.md + edit_notes | N/A |

---

### blockage-handler

| Trigger | Level | Output | Continues |
|---------|-------|--------|-----------|
| B8 (contradictory instructions) that cannot be resolved by interpreting documents in priority order | 3 → 4 | blocker_report.json (B8) routed to lead-orchestrator; Gate 3 triggered | All non-contradictory work completes; partial outputs delivered |
| B1 (missing user decision) where the ambiguity affects the fundamental direction of the document | 3 → 4 | blocker_report.json (B1) with specific decision options enumerated; lead-orchestrator triggers Gate 1 | All work not dependent on the missing decision continues |
| Multiple overlapping blockers whose combined impacted scope covers more than 50% of planned output | 3 | blocker_report.json documenting all blockers and combined impact; routed to lead-orchestrator for prioritized resolution path | Work on the remaining unblocked scope continues |

---

### artifact-orchestrator

| Trigger | Level | Output | Continues |
|---------|-------|--------|-----------|
| Artifact validation failure (file does not exist, is empty, or is malformed) | 2 | blocker_report.json (B6); artifact_manifest.json with status="failed" | No artifact generation retried without resolution |
| Required tool not installed or artifact-server MCP unavailable | 2 | blocker_report.json (B5 or B6); markdown fallback delivered if available | Markdown format artifact produced as fallback if applicable |
| Target format not supported in current phase (Phase 1: non-markdown requested) | 2 | blocker_report.json (B6); user informed via lead-orchestrator that format requires Phase 5 | Markdown artifact produced as fallback; format upgrade noted in resume plan |

---

### framework-sync-agent

| Trigger | Level | Output | Continues |
|---------|-------|--------|-----------|
| Conflict between local override and source update when conflict_resolution_mode is "ask" | 4 (Gate 5 pattern) | sync_manifest.json with conflict item marked as "escalated"; lead-orchestrator surfaces conflict for user decision | All non-conflicted items continue processing |
| Sync would result in data loss (local content not in source would be overwritten) | 4 (Gate 5) | sync_manifest.json halted; Gate 5 triggered regardless of conflict_resolution_mode | Sync halts completely on data-loss items; non-data-loss items complete |

---

### import-export-orchestrator

| Trigger | Level | Output | Continues |
|---------|-------|--------|-----------|
| Import would overwrite a locally modified file when mode is "ask" | 4 (Gate 5 pattern) | sync_manifest.json with conflict escalated; Gate 5 triggered | All non-conflicted import items continue |
| Export scope includes items that appear to be user content or environment-specific | 4 (Gate 2) | Export halted; Gate 2 triggered with specific description of which items were flagged | Non-flagged items continue exporting |
| Pack manifest missing or malformed on import | 2 | blocker_report.json (B7, schema conflict) | Import halts entirely until a valid pack manifest is confirmed |

---

### principles-sync-agent

| Trigger | Level | Output | Continues |
|---------|-------|--------|-----------|
| Conflict between local principles and source principles that cannot be resolved by mode | 4 (Gate 5 pattern) | sync_manifest.json with conflict escalated; lead-orchestrator triggers Gate 5 | Non-conflicted principles continue syncing |

---

### lead-orchestrator

| Trigger | Level | Output | Continues |
|---------|-------|--------|-----------|
| Quality gate failure that cannot be resolved by routing back to the writing agent (e.g., irreducible scope conflict) | 4 (Gate 1 or Gate 2) | run_summary.json with gate_failure documented; human gate triggered | All branches not blocked by the gate failure continue |
| Canon conflict requiring user decision to resolve | 4 (Gate 4) | run_summary.json with canon conflict documented; Gate 4 triggered | Non-conflicting pipeline continues |
| Scope ambiguity that cannot be inferred from brief, discovery report, or prior context | 4 (Gate 1) | run_summary.json; Gate 1 triggered with specific options | Discovery and brief production on unambiguous scope continue |
| User override request on a failed quality gate | 4 (Gate 2 or Gate 5) | run_summary.json; override confirmation asked with explicit statement of what criteria are being waived | Revisions on resolvable issues continue; gate advancement waits for confirmation |

---

## Section 4: Human Gate Triggers

The following conditions require human input. They cannot be resolved autonomously. Each maps to a gate from `doctrine/HUMAN_IN_THE_LOOP_GATES.md`.

---

**HG-1: Missing User Decision (Gate 1)**

A condition qualifies as a missing user decision — not an inferable default — when all three of the following are true:

1. Two or more competent agents, given the same context, would reach opposite conclusions
2. The two conclusions produce outputs that serve different readers, different purposes, or different document structures — not just different phrasings
3. No context in the project (brief, discovery report, prior runs, doctrine, style packs) supports one conclusion over the other with even moderate confidence

What does NOT qualify as a missing user decision:
- A formatting choice not specified in the brief when a style pack governs it
- A section order choice when the outline makes reader-logic clear
- A tone calibration when the style pack defines the tone range
- An audience inference where one audience is strongly supported by available context even if not explicitly stated

When HG-1 triggers: lead-orchestrator produces the Gate 1 format output. States the default action. Continues all unblocked work. Does not re-ask after applying the default.

---

**HG-2: Doctrine Conflict (Gate 3)**

A doctrine conflict requiring human input exists when:
- A user instruction explicitly contradicts a non-negotiable doctrine rule (not a preference or a default)
- The contradiction is specific: the user has asked for X and doctrine prohibits X, not merely that the user has not mentioned Y which doctrine recommends

Examples of qualifying doctrine conflicts:
- User requests padded length to meet a word count without adding content (violates compression doctrine)
- User requests summary paragraphs after each section (violates repetition doctrine)
- User requests use of a doctrine-prohibited phrase for explicit branding reasons

Examples that do not qualify (do not trigger Gate 3):
- User style preference that doctrine does not explicitly address
- User request that is unconventional but not doctrine-prohibited
- Brief that leans toward a different tone than the style pack default

When HG-2 triggers: lead-orchestrator produces the Gate 3 format output. Names the specific doctrine rule. States both options (comply vs. override). Defaults to doctrine compliance if no response is received.

---

**HG-3: Quality Gate BLOCK**

A BLOCK gate decision requires human escalation when:
- The blocking issue cannot be resolved by any combination of revision passes — it requires a scope change, brief amendment, or canon update
- OR the blocking issue reflects a fundamental mismatch between the brief and the actual task requirement discovered during production

A BLOCK gate decision does NOT require human escalation when:
- The blocking issue is a correctable content deficiency (weak argument, missing evidence, style violation) — these route back to the appropriate specialist agent for revision
- The blocking issue is a QA perspective conflict that lead-editor can adjudicate

When a BLOCK requires human escalation: lead-orchestrator produces the Gate 1 or Gate 2 format output depending on whether the issue is a missing decision or a consequential ambiguity. Includes the specific blocking issue with its location and description. Provides concrete resolution options.

When a BLOCK does not require human escalation: lead-orchestrator routes the revision_priority_list to lead-editor for a targeted revision pass. The run continues through the revision cycle automatically.

---

**HG-4: Brief Scope Change**

A scope change discovered during production requires human confirmation when:
- The draft requires significantly more content than the brief defines to fulfill its stated purpose — and the discrepancy is large enough that proceeding without confirmation would produce a document materially different from what was scoped
- OR a discovery during production reveals that the brief's stated scope omits a prerequisite topic that the intended audience will need

A scope change does NOT require human confirmation when:
- A section exceeds its estimated word count within a range that merge-normalizer can document and the Draft Gate can evaluate
- An optional section is added that falls clearly within the brief's stated in-scope definition

When HG-4 triggers: lead-orchestrator produces the Gate 2 format output. States both interpretations (proceed within original brief vs. expand brief). States the default (proceed within original brief, flag the gap for reader-perspective QA). Continues all production that does not depend on the scope decision.

---

**HG-5: Destructive Operation (Gate 5)**

Any operation that irreversibly overwrites, deletes, or replaces existing completed work triggers Gate 5 unconditionally. This gate does not admit exceptions based on confidence that the operation is correct.

Gate 5 applies to: overwriting a completed approved artifact; clearing run cache; replacing canon records; syncing operations that would overwrite locally modified content.

Gate 5 does not apply to: creating new files in empty paths; writing to paths that have never had content; normal artifact generation to the artifacts/ directory.

---

## Section 5: Escalation Anti-Patterns

These are prohibited escalation behaviors. An agent that exhibits any of these patterns has failed its escalation obligations and must be corrected.

---

**Anti-Pattern 1: Escalating an inferable default as a "missing user decision"**

An inferable default is not a missing user decision. If the style pack defines the tone, lead-editor does not trigger Gate 1 to ask about tone. If the outline defines section order, section-drafter does not trigger Gate 1 to ask whether the order is correct. If the brief defines the audience, no agent triggers Gate 1 to confirm the audience.

The test: would two competent agents, given the same context, reach opposite conclusions? If they would both reach the same conclusion, this is a Level 1 self-resolution. It is not an escalation.

Escalating inferable defaults wastes user time, creates learned helplessness in the workflow, and signals that the discovery pass was insufficient. The correct fix is a better discovery pass, not a Gate 1 trigger.

---

**Anti-Pattern 2: Halting all work when only one branch is blocked**

A blocker in one section does not stop other sections. A blocker in one workflow branch does not stop other branches. When an agent discovers a blocker, it maps the dependency graph precisely and continues everything not downstream of the blocked item.

An agent that stops all output because section 4 is missing its source material has failed to continue work on sections 1, 2, 3, and 5. This is a complete workflow halt. It is forbidden.

The correct behavior: classify the B4 blocker, produce a structure-only placeholder for section 4, continue drafting all other sections, deliver a partial output with RESUME documentation.

---

**Anti-Pattern 3: Escalating for formatting decisions covered by style packs**

Style packs govern formatting. If the active style pack specifies whether to use bullet points or prose for a list, that decision is not an escalation trigger. If the style pack defines header hierarchy, that decision is not an escalation trigger. If the style pack specifies prohibited phrases, their avoidance is not an escalation trigger.

An agent that triggers Gate 1 for a formatting choice that a style pack already answers has not read the style pack. Reading the style pack is mandatory before any task.

---

**Anti-Pattern 4: Escalating without a structured blocker_report.json**

Every escalation above Level 1 requires a structured artifact. An agent that mentions a blocker in its output text, in a note, or in a comment without producing a schema-compliant blocker_report.json has not escalated — it has left an undocumented problem in the workflow.

Silent escalation (stopping work without any artifact) is the worst form of this anti-pattern. It produces a workflow halt with no resume path and no classification.

The correct behavior: produce a blocker_report.json that validates against blocker_report.schema.json before routing to blockage-handler or lead-orchestrator.

---

**Anti-Pattern 5: Using escalation to avoid making reasonable editorial judgment calls**

Editorial agents are expected to exercise judgment within their defined scope. lead-editor does not trigger Gate 1 to ask which of two revision approaches is better — it picks the better approach and documents the choice. qa-final does not trigger Gate 1 to ask whether a revise-level issue is more or less important than another — it assigns priority based on gate criteria.

Escalating a decision that is clearly within the agent's editorial authority is a form of learned helplessness. It creates unnecessary user interruption for decisions the system is explicitly designed to handle autonomously.

The test: is this decision within my defined scope? Does doctrine or a guide record address it? Is there a defensible choice I can make and document? If the answers are yes, proceed and document. Do not escalate.

---

**Anti-Pattern 6: Escalating the same blocker twice**

Once a gate has been triggered and a default has been stated, the default applies if no response is received. The gate is not re-triggered. The same question is not asked again at the next phase.

If Gate 1 was triggered for audience clarification and no response was received, the default audience was applied. All subsequent phases use that default. They do not re-open the Gate 1 ask.

Exception: if new context is discovered in a later phase that changes the nature of the ambiguity, a new gate may be triggered — but it must document why the prior gate did not resolve the issue, referencing the specific new context discovered.

---

## Section 6: Resume Protocol

When an escalation is resolved — whether by user input, lead-orchestrator routing, or time-based default application — the run resumes from the documented resume plan.

---

### What a Valid Resume Plan Must Contain

A resume plan is found in the `resume` field of blocker_report.json. It must contain all four required subfields:

1. **`blocked_on`** — the exact description of what was missing or unresolved. Specific enough that a new agent reading only this field, without access to prior conversation history, knows precisely what was blocking the run. "More information needed" is invalid. "The target audience for section 4 was unspecified; the two plausible audiences (technical leads vs. executive stakeholders) would require different vocabulary and depth in the system architecture section" is valid.

2. **`to_resume`** — the exact command and parameters to invoke when the blocker is resolved. Must reference a real command. Must include enough parameters that the command can be invoked without re-reading prior context. Example: `/draft-section section_id=s04 run_id=abc-123` — not `/draft-section` alone.

3. **`when_unblocked`** — description of what will be produced when the blocker is resolved and the resume command is run. What sections will be drafted, what files will be written, what gate will be evaluated. This is the contract for what the next execution will deliver.

4. **`already_complete`** — explicit enumeration of all outputs produced before the block, with their file paths. A new agent picking up from the resume plan must know exactly what exists and does not need to be redone.

---

### Which Agent Picks Up from the Resume Point

The agent that picks up from the resume point is determined by the `to_resume` command in the resume plan. The command specifies the entry point. lead-orchestrator invokes the command when the blocker is resolved.

The picking-up agent reads:
1. The resume plan — specifically `blocked_on`, `when_unblocked`, and `already_complete`
2. The `already_complete` artifacts — to confirm their presence and validity before proceeding
3. The original run context (brief.json, outline.json) — to restore domain knowledge

The picking-up agent does not re-run completed stages. It reads the `already_complete` list, confirms those files exist, and proceeds directly to the `to_resume` command.

---

### How Run State is Restored from blocker_report.json

When a run resumes after a blocker is resolved:

1. lead-orchestrator reads the most recent blocker_report.json from logs/ for the current run_id
2. lead-orchestrator confirms all files listed in `resume.already_complete` exist at their stated paths
3. If any listed file is missing, lead-orchestrator classifies this as a new B2 blocker before proceeding
4. lead-orchestrator invokes the command in `resume.to_resume` with the resolved blocker input
5. lead-orchestrator updates run_summary.json to reflect that the blocker is resolved and the run is active
6. The run continues from the resume point; no prior stages are re-executed unless explicitly required by the resume plan

In Phase 2+, the cache-server MCP provides run state persistence. blocker_report.json is the fallback mechanism for Phase 1. Both are valid. The resume protocol is identical regardless of whether state comes from the cache-server or from a blocker_report.json file in logs/.

---

### Resume Protocol Edge Cases

**Multiple overlapping blockers:** When a run has more than one active blocker, each blocker has its own blocker_report.json with its own `resume` section. lead-orchestrator applies the resume protocol for each blocker independently as it is resolved. Blockers are not batched for simultaneous resolution unless they share a dependency. The first blocker to resolve unblocks its branch immediately without waiting for other blockers to resolve.

**Blocker resolved by default (no user response):** The `resume.blocked_on` field must include the default that was applied. When lead-orchestrator resumes using the default, it logs the default application in run_summary.json with the timestamp and the default value used.

**Blocker resolved by user input that changes the scope:** If the user's resolution substantially changes the document scope (not just answers an ambiguity), lead-orchestrator does not resume blindly from the resume point. It re-runs brief-writer or outline-architect as appropriate before proceeding to the command in `to_resume`. The resume plan is updated to reflect the scope change.
