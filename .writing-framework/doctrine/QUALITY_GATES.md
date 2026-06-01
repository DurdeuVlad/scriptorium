# QUALITY GATES

**Status:** Canonical. Defines what "done" means at each phase. No phase advances without meeting its gate.

---

## Mission

Quality gates prevent incomplete or defective work from advancing through the pipeline. A gate is not a suggestion or a checklist to "mostly" complete. It is a binary pass/fail check. If the gate criteria are not met, the phase is not done.

Gates serve two populations: the agents executing the pipeline (who must know when they can advance) and the human reviewer (who must know what was verified before their review). Both need the same answer: exactly which criteria were checked, and whether each passed.

---

## Gate Model

Every gate evaluates five categories:

1. **Required outputs exist and are valid** — the deliverable is present, complete, and conforms to its schema
2. **Required schemas are populated correctly** — no required fields are empty, null, or placeholder-filled
3. **No doctrine violations** — the output does not violate any rule in EDITORIAL_DOCTRINE.md
4. **No unresolved blockers** — all blockers affecting the current phase are resolved or formally classified and routed
5. **QA perspectives applied where required** — the phases that require specific QA reviews have received them

---

## Phase Gates

---

### Discovery Gate

**Purpose:** Confirm that the system has enough context to produce a correct brief. The discovery report must be a complete, accurate picture of what is known, what was inferred, and what is missing.

**Required outputs:**
- Discovery report conforming to `discovery_report.schema.json`
- `context.confirmed` section: what is definitively known from the request, repo, and guides
- `context.inferred` section: what was assumed, with justification for each assumption
- `blockers` section: classified (B1-B9), documented, with status (resolved / pending / escalated)
- `next_actions` section: specific, concrete, actionable — not "proceed with brief"

**Pass condition:** A human can read the discovery report and know exactly what will be produced at the next phase, why those choices were made, and what uncertainties remain. No item in the discovery report says "TBD" or "to be determined" without a corresponding blocker entry.

**Fail condition:** Any required field is empty. Any inferred assumption has no justification. Any blocker is undocumented. Next actions are vague.

---

### Brief Gate

**Purpose:** Confirm that the brief contains all information a downstream agent needs to produce a correct outline without asking questions.

**Required outputs:**
- Brief document conforming to `brief.schema.json`
- `audience` field: specific — not "general readers" but a description precise enough to determine vocabulary level, assumed knowledge, and appropriate depth
- `scope` field: explicit boundaries — what is in scope and what is explicitly out of scope
- `constraints` field: format constraints, length guidance, style pack assignment, any user-specified requirements
- `success_criteria` field: how a correct output will be recognized — not "good writing" but specific criteria

**Pass condition:** An agent that has never interacted with the user or the prior conversation can read only the brief and produce a structurally correct outline. The brief is self-contained.

**Fail condition:** Any required field is absent or vague. Audience is described too broadly to inform decisions. Scope boundaries are implicit. Success criteria are not testable.

---

### Outline Gate

**Purpose:** Confirm that the outline is specific enough for parallel section drafters to write independently without overlap or gap.

**Required outputs:**
- Outline conforming to `outline.schema.json`
- Every section has: title, purpose statement (what this section does for the reader), estimated scope (rough word count or depth signal), and defined content boundaries
- Section order is justified — not just listed but explained in terms of reader progression
- No two sections have overlapping purpose statements
- All sections in the brief scope are accounted for; no scope gaps

**Pass condition:** An agent assigned any single section can read the outline and know what to write, what not to write (because it belongs in an adjacent section), and what depth to aim for — without asking questions.

**Fail condition:** Any section lacks a purpose statement. Purpose statements overlap between sections. Section order has no stated rationale. A scope area from the brief has no corresponding section.

---

### Draft Gate

**Purpose:** Confirm that the draft is a complete, reviewable document — not a skeleton, not a set of sections at varying completion stages.

**Required outputs:**
- Complete draft with all sections present and substantively written
- No section is a placeholder, stub, or "to be written" marker
- All sections conform to their outline purpose statements
- Voice consistency is either achieved or documented inconsistencies are explicitly flagged for the merge-normalizer with section-level detail
- All citations, canon references, or sourced claims are grounded — no unsupported assertions that require source material that does not exist

**Pass condition:** The draft is ready for merge normalization (if from parallel section drafts) and QA. A QA agent can evaluate it against defined criteria without needing to make allowances for obvious incompleteness.

**Fail condition:** Any section is a placeholder. Any section contradicts its outline purpose statement. Voice inconsistencies are present but not flagged. Citations are claimed but not grounded.

---

### QA Gate

**Purpose:** Confirm that all required QA perspectives have been applied, issues have been classified, and no blocking issues remain.

**Required QA perspectives (minimum):**
- `qa-reader` — evaluates reader experience, flow, pacing, and comprehension
- `qa-skeptic` — evaluates factual claims, logical coherence, unsupported assertions, and argument strength
- `qa-coherence` — evaluates internal consistency, canon compliance, and cross-section continuity
- `qa-ai-stink` — evaluates for AI-generated language patterns, anti-patterns, and voice authenticity

**Required outputs per QA agent:**
- Structured issue list conforming to `qa_review.schema.json`
- Every issue classified as: `block` (must resolve before advancing) / `revise` (should resolve, not blocking) / `note` (optional, flagged for author awareness)
- Issues are specific — they name the location (section, paragraph, or sentence) and state the specific problem
- No issue is a vague paragraph summary ("the tone feels off throughout")

**Pass condition:** No `block` issues remain unresolved. All `revise` and `note` issues are documented and either resolved or formally deferred. The lead editor has reviewed the complete issue set.

**Fail condition:** Any `block` issue is unresolved. Any QA perspective was skipped without authorization. Any issue list is a prose summary rather than a structured list.

---

### Final Gate (Pre-Publication Check)

**Purpose:** Confirm the document is ready for human review or direct publication.

**Required outputs:**
- All prior gates passed (Discovery, Brief, Outline, Draft, QA)
- Voice pass completed: a voice editor agent or explicit voice check pass has been run
- Compression pass completed: document has been reviewed for length, redundancy, and filler removal
- All doc-level anti-patterns from EDITORIAL_DOCTRINE.md have been checked and resolved
- Run log is complete: all phases, decisions, gate results, and override decisions are documented

**Pass condition:** The document requires no further structural or content work before a human reviewer sees it. The human reviewer's job is judgment, not cleanup. They should not be the one discovering placeholder text, doctrine violations, or obvious compression opportunities.

**Fail condition:** Any prior gate did not pass. Voice pass was skipped. Compression pass was skipped. Doc-level anti-pattern check was not completed. Run log is missing phase entries.

---

## Gate Failure Behavior

When a gate fails, the agent must:

1. List exactly which criteria are unmet — specific, not summary
2. Return to the appropriate stage to address the failures
3. Do not advance to the next phase under any circumstances
4. Document the gate failure in the run cache with: gate name, failed criteria, return stage, and timestamp

**Gate failures are not errors to be hidden.** They are working correctly. A gate that catches a problem before it advances is doing its job.

---

## Override Rule

Any gate may be explicitly overridden by the user. An override must be:
- Requested explicitly ("skip the QA gate for this run" or "proceed despite the blocker")
- Logged in the run cache with: gate overridden, reason given, user identity (if available), and timestamp
- Scoped to the current run — a prior override does not carry forward

**Silent gate bypass is never permitted.** An agent that advances past a failed gate without authorization is producing unverified output and must not describe it as reviewed or approved.

---

## Cross-References

- `doctrine/EDITORIAL_DOCTRINE.md` — writing quality standards checked at Draft and Final gates
- `doctrine/AUTONOMOUS_EXECUTION.md` — how agents behave when a gate fails during autonomous execution
- `doctrine/DECOMPOSITION_RULES.md` — how phases connect in the standard decomposition sequence
- `schemas/quality_gate.schema.json` — structured format for gate check outputs
- `schemas/qa_review.schema.json` — structured format for QA issue lists
- `logs/` — where gate results and override records are stored
