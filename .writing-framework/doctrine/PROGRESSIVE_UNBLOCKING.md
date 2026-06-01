# PROGRESSIVE UNBLOCKING

**Status:** Canonical. Defines how agents handle blockers and continue producing value when work cannot fully complete.

---

## Mission

Blockers are normal. The wrong response to a blocker is to halt all work and wait. The right response is to classify the blocker precisely, identify its exact scope of impact, continue all unaffected work, produce maximum useful partial output, and create a resume point specific enough for a new agent to pick up without re-reading the prior conversation.

An agent that produces nothing because one part of the task is blocked has failed. An agent that produces partial output with a clear resume point has succeeded.

---

## Blocker Classification

Every blocker encountered must be classified using the taxonomy below. Classification determines the resolution path. Misclassifying a blocker wastes time — a B2 (missing repo context) handled as a B1 (missing user decision) creates an unnecessary user interrupt when the agent could have searched for alternatives.

---

### B1 — Missing User Decision

**Definition:** The task requires a choice that only the user can make. Context does not support an inference. The two or more options are not equivalent and produce meaningfully different outputs.

**Examples:**
- Which of two conflicting user instructions to follow when both are explicitly stated
- Audience is undefined and cannot be inferred from any available context, and the two most plausible audiences would produce different documents
- User has not specified which of two possible scopes the task covers, and the scopes are mutually exclusive

**Resolution path:**
1. Ask the minimum question — one question, specific options if enumerable
2. State what you will default to if no response is received within reasonable time
3. Document the blocker in the run cache
4. Continue all work not dependent on this decision
5. Produce partial output with a RESUME section

**Do not classify as B1 when:** the decision is inferable from context (even weakly). Infer it, log it as a Type 2 flag, and proceed. B1 is for genuine decision-point blockers, not discomfort with uncertainty.

---

### B2 — Missing Repo Context

**Definition:** A referenced artifact, guide, or resource does not exist in the repository and cannot be found through search.

**Examples:**
- A guide referenced in the brief does not exist in `guides/`
- A style pack named in the project config is absent from `styles/`
- A canon record referenced by an outline section is not in the guide library

**Resolution path:**
1. Search thoroughly before classifying — check alternative paths, naming variants, and related files
2. If genuinely absent: create a placeholder if appropriate (for guides, a stub with a gap marker)
3. Continue with best available context — document what was used instead
4. Add a `guide-gap-check` or equivalent action to the recommended next actions
5. Note in every section that relied on the missing resource that it was produced without it

**Do not halt work** for a B2. Proceed with whatever context is available and document the gap explicitly.

---

### B3 — Missing Guide

**Definition:** No guide exists for the domain, topic, or subject matter being written about, and the absence creates a knowledge gap that must be made explicit.

**Examples:**
- Writing a technical document in a domain for which no domain guide has been created
- Writing about a product with no product guide in the library
- Writing about a character or world for which no fiction guide exists

**Resolution path:**
1. Document the gap with specificity — which guide is missing and what it would have provided
2. Proceed without the guide, explicitly noting every assumption made in the absence of authoritative guidance
3. Add `/guide-gap-check` or guide creation to recommended next actions
4. Flag sections where accuracy is most dependent on the missing guide so the reviewer knows where to focus verification

**B3 does not block work.** It degrades confidence in accuracy. This must be communicated to the reviewer — not concealed.

---

### B4 — Missing Source Material

**Definition:** The task requires specific source material (a research report, a reference document, a transcript, a data set) that was not provided and has no available substitute.

**Examples:**
- Brief calls for synthesis of a research report that was not attached
- Section requires quotes or data from a source document that cannot be located
- Factual claims in the brief require grounding in a source that does not exist in the repo

**Resolution path:**
1. Draft a structure-only or placeholder version of the affected section — show the section's architecture and what content it needs, without fabricating the content
2. Label the placeholder explicitly: what source is needed, what it would provide, and what section it would fill
3. Complete all sections not dependent on the missing source
4. Include the missing source in the RESUME section as a required input before completing those sections

**Never fabricate source material.** A structure-only placeholder is correct. Invented citations or invented data is not.

---

### B5 — Failed Toolchain

**Definition:** A tool, MCP server, file system operation, or external service that the agent depends on has failed or is unavailable.

**Examples:**
- MCP server not responding to a required call
- File write operation failing with an error
- Schema validation tool returning an unexpected error
- External API call timing out

**Resolution path:**
1. Attempt the operation once. If it fails, do not retry in a loop.
2. Log the error with full context: what was attempted, the exact error returned, the timestamp
3. Identify whether a fallback method exists (e.g., plain text output instead of validated JSON, markdown instead of a formatted document)
4. If a fallback exists: use it, document that a fallback was used and why
5. If no fallback exists: classify the impacted work as blocked, produce output for unimpacted work, and include the toolchain failure in the RESUME section

**Do not silently recover.** If a fallback was used, the output must say so.

---

### B6 — Artifact Export Failure

**Definition:** A completed document cannot be exported to the required format.

**Examples:**
- LaTeX compilation fails due to a rendering error
- docx conversion is unavailable or produces a corrupt file
- PDF generation fails

**Resolution path:**
1. Deliver the document in the closest available format (typically structured markdown)
2. Log the export failure with the exact error
3. Note in the output header that the delivered format is a fallback and which format was intended
4. Include export recovery as a recommended next action

The content is complete. The format is not. This distinction must be explicit in the output.

---

### B7 — Schema Conflict

**Definition:** Two agents, two phases, or two sources have produced outputs that conform to different versions of the same schema, and they cannot be merged without resolving the version conflict.

**Examples:**
- A brief produced in the current run conforms to `brief.schema.json v2.0` but the outline-architect is reading from a cached brief that conforms to `v1.0`
- Two section drafts produced by parallel agents use different field names for the same data

**Resolution path:**
1. Identify which schema version is canonical for this run (check `schemas/` for the current version)
2. Flag the conflict — do not merge conflicting schemas silently
3. If the non-canonical version can be mapped to the canonical version without data loss: do so and document the mapping
4. If data loss would occur: escalate to the orchestrating agent before proceeding

**Never silently merge outputs that conform to different schema versions.**

---

### B8 — Canon Conflict

**Definition:** Requested content contradicts an established canon record in the guide system.

**Examples:**
- A draft section attributes a characteristic to a character that contradicts the character's canon record
- A world rule stated in the draft contradicts an established lore entry
- A technical specification contradicts the canonical product spec

**Resolution path:**
1. Surface the conflict with specific citations — the draft claim and the canon record (with path), stated as a specific contradiction
2. Do not silently override canon in either direction (do not rewrite the draft to match canon without flagging it; do not update canon without authorization)
3. Escalate to the lead-editor agent or the user if the lead-editor is unavailable
4. Hold the conflicting section in draft state until the conflict is resolved

**B8 is a hard stop for the conflicting content.** All other sections may proceed.

---

### B9 — Validation Failure

**Definition:** An output has failed a defined quality gate or schema validation check.

**Examples:**
- A draft fails the QA gate with unresolved blocking issues
- A brief fails schema validation because required fields are missing
- An outline fails its gate because section purposes overlap

**Resolution path:**
1. Return to the failed stage — do not advance past a failed gate
2. Produce a specific issue list: which criteria failed and exactly what must change
3. Do not attempt to "partially advance" — gates are binary
4. Document the failure in the run cache with the failed criteria enumerated

**B9 does not block all other work** unless the failed phase is a prerequisite for all remaining work. If other branches are independent, continue them.

---

## Progressive Continuation Protocol

When a blocker is encountered, execute this protocol in order:

1. **Classify** the blocker using the B1-B9 taxonomy
2. **Record** it in the run cache or produce a `blocker_report.schema.json` output with: classification, specific description, impact scope, and resolution path
3. **Determine impacted scope:** what work depends on the blocked item — specifically and only that work
4. **Identify unimpacted work:** everything that can proceed without the blocked item
5. **Continue all unimpacted work** — do not treat a single blocker as a total workflow halt
6. **Produce maximum useful partial output** — real content, not stubs
7. **Write a RESUME section** (format below) that is specific enough for handoff

---

## RESUME Section Format

Every partial output and every blocker report must end with a RESUME section. The RESUME section is the contract between this execution and the next. It must be specific enough that an agent reading only the RESUME section — without access to the prior conversation — can continue correctly.

```
## RESUME

### Blocked on
[Specific item — not "missing information" but "the target audience for the technical overview section
was not specified and the two plausible audiences (engineering leads vs. executive stakeholders)
would require different vocabulary and depth"]

### Blocker classification
[B1 / B2 / ... / B9] — [one-line description]

### To resume
[Exact action required: "Provide the target audience for the technical overview section.
Options: A) engineering leads (technical depth, domain vocabulary assumed) or
B) executive stakeholders (strategic framing, no assumed technical knowledge)"]

### Default if no response
[What the agent will assume if no response is received, stated specifically]

### When unblocked — first step
[The exact first action after the blocker is resolved:
"With audience confirmed as [X], complete the technical overview section using the
engineering voice pack. The section structure is already complete in the outline."]

### Already complete
[Enumerate finished deliverables with their locations:
- Discovery report: /runs/[run-id]/discovery_report.json
- Brief: /runs/[run-id]/brief.json
- Outline: /runs/[run-id]/outline.json
- Section drafts complete: Introduction, Background, Methodology
- Section drafts blocked: Technical Overview, Results Interpretation]

### Estimated remaining work
[What is left to produce after the blocker is resolved and any remaining unblocked work]
```

A RESUME section that says "continue when ready" is not valid. A RESUME section that says "to resume, confirm whether the audience is engineering leads or executive stakeholders; the default is engineering leads; when confirmed, complete section 4 (Technical Overview) using the engineering voice pack at /styles/engineering.md" is valid.

---

## Partial Output Standards

Partial output is only useful when:

- **Labeled as partial** — the output header states explicitly what is present and what is missing
- **Missing portions enumerated** — a specific list of what was not completed and why (blocker classification and description)
- **Resume point specific** — the RESUME section passes the handoff test: a new agent reading only the RESUME section can continue correctly
- **Delivered content is usable** — not a skeleton of headers with no content, but real, reviewable output for the completed sections

A partial output that fails any of these four criteria is worse than no output — it creates false confidence that work was done when it was not. Either produce real partial output or state clearly that the blocker prevents any useful output at all (this should be rare and must be justified).

---

## Cross-References

- `doctrine/AUTONOMOUS_EXECUTION.md` — decision type classification and partial completion protocol
- `doctrine/HUMAN_IN_THE_LOOP_GATES.md` — when blockers require user escalation
- `doctrine/QUALITY_GATES.md` — B9 validation failures and gate behavior
- `schemas/blocker_report.schema.json` — structured format for blocker documentation
- `logs/` — where blocker reports and run cache entries are stored
