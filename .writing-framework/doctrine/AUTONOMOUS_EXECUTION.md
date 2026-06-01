# AUTONOMOUS EXECUTION

**Status:** Canonical. Defines how agents make decisions and proceed without user input.

---

## Mission

Agents should proceed as far as safely possible without user input. Users are interrupted only when ambiguity materially blocks output direction and cannot be reasonably resolved from context. The failure mode this doctrine prevents is the opposite of hallucination: agents that halt unnecessarily, ask questions with obvious answers, or produce no useful output while waiting for perfect instructions.

Default posture: proceed, log assumptions, flag non-obvious decisions, deliver real work.

---

## Decision Classification

Every decision an agent faces during execution falls into one of three types. Misclassifying a Type 1 as a Type 3 wastes user time. Misclassifying a Type 3 as a Type 1 produces wrong output. Classify carefully.

---

### Type 1 — Infer and Proceed

**Definition:** Sufficient context exists to make a reasonable decision without user input. A competent agent reviewing the same context would likely reach the same conclusion.

**Action:** Make the decision. Log the assumption in the discovery report or output header. Proceed without asking.

**Examples:**
- Choosing section order when the outline structure makes the sequence clear
- Selecting a style pack based on the document type and existing project context
- Inferring audience from existing documents in the project repo
- Choosing between two equivalent phrasings that have no doctrinal difference
- Inferring scope from the brief when the brief is specific enough

**Logging format for Type 1 decisions:**
```
[ASSUMPTION] [decision made] — basis: [what made this inferrable]
```

Do not ask the user to confirm Type 1 decisions. Do not include them in gate questions. Log them so they are auditable.

---

### Type 2 — Infer and Flag

**Definition:** Context supports a decision, but it is non-obvious and the user may prefer a different choice. The agent should not halt for this — but the user should know what was decided.

**Action:** Make the decision. Note it clearly in the output so the user can override. Proceed.

**Examples:**
- Inferring a conservative, formal tone when tone is unspecified and audience is ambiguous
- Choosing between two plausible outline structures of roughly equal merit
- Setting section depth when the brief does not specify granularity
- Deciding to skip a section that seems out of scope but was not explicitly excluded

**Flagging format for Type 2 decisions:**
```
[DECISION FLAGGED] [decision made] — reason: [why this was chosen] — override: [what to say to change it]
```

Flags should appear in the output header or discovery summary, not scattered through the document body.

---

### Type 3 — Must Ask

**Definition:** The ambiguity materially changes the output direction and cannot be reasonably inferred from context. Proceeding would risk producing work that is entirely wrong for the actual need.

**Action:** Stop that branch. Document the blocker with classification. Continue all other work that is not blocked. Ask the minimum question needed to resolve the ambiguity.

**Examples:**
- Target audience is completely unknown and the document type produces fundamentally different content for different audiences (e.g., technical spec vs. executive briefing)
- Instructions explicitly contradict each other and both interpretations are equally supported by context
- Required source material does not exist and no substitute is available and the section cannot be placeholder-drafted without it
- The user has given two conflicting directives for the same output element with no way to determine priority

**Rule:** Type 3 should be rare. If more than one Type 3 blocker arises in a standard task, this is a signal that the brief or discovery phase was insufficient. Route back to brief-writer before proceeding.

**Question format for Type 3:**
Ask one question. Provide enumerable options if the answer space is finite. State what you will assume if no response is received. Do not bundle multiple questions in a single ask.

---

## Partial Completion Protocol

When full completion is not possible, do not produce nothing. Partial output that is clearly labeled is useful. Silence is not.

**When a blocker prevents full completion:**

1. Complete all work that can be completed without the blocked information
2. Produce real partial output — not stubs, not empty headers, not "TBD" throughout
3. Document exactly what is missing and why in explicit terms
4. Write a RESUME section (format below)
5. Deliver the partial output with clear labeling

**Partial output must be labeled:**
```
## PARTIAL OUTPUT — RESUME REQUIRED
Completed: [list of sections/phases completed]
Missing: [list of specific items that could not be completed]
Blocked on: [specific item and blocker classification]
```

---

## Resume Point Format

Every blocker report and every partial output must include a RESUME section. The resume section must be specific enough that a new agent, without access to the prior conversation, can pick up exactly where work stopped.

```
## RESUME
- Blocked on: [specific item — be precise, not general]
- To resume: [exact action the user or next agent must take]
- When unblocked: [first concrete step after resolution]
- Already complete: [enumerate finished deliverables with locations]
- Estimated remaining work: [what is left to produce]
```

A RESUME section that says "continue when ready" is not a valid resume section. Name the specific input needed and the specific next action.

---

## Scope Discipline

**Do not expand scope without flagging it.** If you identify an adjacent improvement while executing a task, log it as a recommendation — do not implement it. An agent that silently expands scope creates unpredictable outputs and potentially overwrites work outside its charter.

**Complete the requested task first.** Extensions, recommendations, and adjacent work go in a clearly labeled appendix or separate section. They are never interleaved with the primary deliverable.

**The boundary of the current task is defined by the brief and outline.** If neither exists for this run, the boundary is defined by the user's most recent explicit instruction. Anything outside that boundary requires flagging before action.

**If scope is genuinely unclear:** classify as Type 2, make a conservative choice (narrower scope is safer than wider), and flag the decision for user review.

---

## Logging Requirements

Every agent execution must produce a log or output header that includes:
- Task received
- Type 1 assumptions made (enumerated)
- Type 2 decisions flagged (enumerated)
- Type 3 blockers encountered (enumerated)
- Phases completed
- Phases blocked or skipped
- Output locations

This log is not optional. It is the audit trail that allows the user and downstream agents to understand what happened and why.

---

## Cross-References

- `doctrine/HUMAN_IN_THE_LOOP_GATES.md` — specific trigger conditions for stopping and asking
- `doctrine/PROGRESSIVE_UNBLOCKING.md` — full blocker classification and continuation protocol
- `doctrine/DECOMPOSITION_RULES.md` — how to decompose work before executing it
- `schemas/discovery_report.schema.json` — structured format for logging assumptions and decisions
