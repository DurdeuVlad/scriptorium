# HUMAN IN THE LOOP GATES

**Status:** Canonical. Defines exactly when agents stop and ask vs. proceed autonomously.

---

## Mission

This doctrine defines the specific conditions under which an agent must pause and request user input. The goal is to minimize unnecessary interruptions while protecting against consequential mistakes. Unnecessary asks waste user time and create learned helplessness in the workflow. Missing a required ask produces wrong or destructive output.

Default posture: proceed autonomously. Escalate only when the defined conditions below are met.

---

## Gate Categories

---

### Gate 1 — Required Input Missing

**Trigger:** The task requires information that cannot be inferred from context, and proceeding without it produces an output that is wrong by construction — not just suboptimal, but structurally incorrect.

**Distinguishing test:** Would two competent agents, given the same context, reach opposite conclusions? If yes, Gate 1 applies. If both would reach the same conclusion, this is a Type 1 decision — infer and proceed.

**Examples that trigger Gate 1:**
- Target audience is completely unspecified and the document's entire framing, vocabulary, and depth would differ between the two most plausible audiences
- The topic is ambiguous between two fundamentally different interpretations that produce different documents (not just different tones)
- The brief references source material that does not exist and no substitute is available and the section cannot be scaffolded without it
- A required style pack is explicitly called out in the brief but is absent from the repo and no project default applies

**Action:**
1. Ask one clear question
2. If the answer space is enumerable, list the options explicitly
3. State which option you will default to if no response is received within reasonable time
4. Continue all unblocked work while waiting
5. Do not halt the entire workflow for a single Gate 1 trigger

**Question format:**
```
[GATE 1 — INPUT REQUIRED]
Question: [single, specific question]
Options: [A] [description] / [B] [description] (if enumerable)
Default: I will proceed with [option] if no response is received.
Blocked work: [what is paused] | Continuing: [what is proceeding]
```

---

### Gate 2 — Consequential Ambiguity

**Trigger:** Two or more reasonable interpretations of the instruction exist and they produce substantially different outputs. Unlike Gate 1, context does exist — but it supports multiple readings.

**Distinguishing test:** Can the agent make a defensible choice and flag it (Type 2)? If yes, do that. Gate 2 applies only when the interpretations are so different in outcome that silent defaulting is not appropriate.

**Examples that trigger Gate 2:**
- "Write a brief for the launch" — internal strategy memo or external announcement copy? These are different documents with different audiences and purposes.
- "Expand this section" — add supporting detail within existing structure, or add new subsections that change the section's scope?
- Scope of rewrite is unclear — is this a voice and compression pass, or are structural changes permitted?
- "Make it shorter" when the document is already at minimum viable length — cut content or compress prose?

**Action:**
1. State both interpretations explicitly and specifically
2. State which you will default to and why
3. Give the user an opportunity to redirect before you proceed
4. If workflow allows real-time response, wait briefly; if not, proceed with the stated default and log the decision

**Format:**
```
[GATE 2 — AMBIGUITY]
Interpretation A: [specific description of what this produces]
Interpretation B: [specific description of what this produces]
Defaulting to: [A or B] — reason: [brief justification]
To override: [what the user should say to redirect]
```

---

### Gate 3 — Doctrine Conflict

**Trigger:** The user request explicitly contradicts established editorial doctrine. The agent cannot comply with the request without violating a non-negotiable rule.

**Examples that trigger Gate 3:**
- User requests a summary paragraph at the end of every section (violates compression doctrine — do not summarize what was just said)
- User asks to "make it sound more professional" in terms that mean stripping voice and replacing with generic corporate language
- User requests padded length to reach a word count without adding content
- User requests use of a prohibited phrase ("leverages," "delve into," etc.) for branding reasons they consider valid

**Action:**
1. Flag the conflict explicitly — name the doctrine rule
2. Explain specifically what the conflict is and what the doctrine says
3. Ask whether the user wants to override doctrine for this task
4. If override is confirmed, proceed and log the override with reason
5. If no response, default to doctrine compliance
6. Never silently comply with a doctrine-violating request

**Format:**
```
[GATE 3 — DOCTRINE CONFLICT]
Request: [what was asked]
Conflict: [which doctrine rule this violates, and how]
Options: [A] Proceed with doctrine-compliant version | [B] Override doctrine for this task
Default: Proceeding with doctrine-compliant version unless instructed otherwise.
```

---

### Gate 4 — Canon Conflict

**Trigger:** The requested content contradicts established canon held in the guide system. This applies to fiction, world-building, product descriptions, technical specifications, or any domain where canonical records exist.

**Examples that trigger Gate 4:**
- A character description in the draft contradicts the canon record for that character
- A world rule stated in the draft conflicts with an established lore entry
- A technical claim contradicts an authoritative source document in the guides
- A product specification differs from the canonical product record

**Action:**
1. Surface the conflict with specific citations — name the guide, the canon record, and the specific contradiction
2. Do not silently override canon, even if the new content seems better
3. Ask for resolution — either update canon to reflect the new content, or revise the draft to respect existing canon
4. Do not advance past this gate until the conflict is resolved

**Format:**
```
[GATE 4 — CANON CONFLICT]
Draft claim: [what the current draft states]
Canon record: [what the guide says, with path/reference]
Conflict: [specific contradiction]
Options: [A] Revise draft to match canon | [B] Update canon to reflect new intent | [C] Treat this as a retcon and document it
Waiting for resolution before proceeding.
```

---

### Gate 5 — Destructive Operation

**Trigger:** The next step would irreversibly overwrite, delete, or replace existing completed work.

**Examples that trigger Gate 5:**
- Overwriting a completed and approved artifact
- Deleting guide records or canon entries
- Replacing canon records with content that conflicts with them
- Clearing a run cache that may contain needed state
- Any file operation that removes data that cannot be recovered from source control

**Action:**
1. Stop. Do not perform the operation.
2. State what the operation is, what it would affect, and that it cannot be undone
3. Ask for explicit confirmation before proceeding
4. Never assume. Never interpret prior approval as covering a new destructive operation.

**Format:**
```
[GATE 5 — DESTRUCTIVE OPERATION]
Operation: [exactly what would happen]
Affected: [what files, records, or artifacts would be changed or lost]
This action cannot be undone.
Confirm: should I proceed? [yes/no]
```

---

## Gate Behavior Rules

**Ask the minimum question needed.** Do not bundle multiple gate questions into one ask. If Gate 1 and Gate 2 both trigger on the same task, ask the Gate 1 question first — resolving it may eliminate the Gate 2 ambiguity.

**State your default action.** Every gate ask must include what you will do if no response is received. Agents without a stated default create frozen workflows.

**Continue unblocked work.** A gate trigger on one branch of work does not halt all other branches. Identify what is blocked and what is not. Continue the unblocked work. Deliver partial output if the blocked item prevents full completion.

**Log every gate trigger.** Every gate activation must be recorded in the run cache with: gate type, trigger condition, question asked, default stated, and resolution received (or "pending").

**Do not repeat gate asks.** If a gate was triggered and the user gave no response, proceed with the stated default. Do not re-ask the same question at the next phase.

---

## Gate Non-Triggers (Do Not Ask When)

These situations do not trigger a gate. Agents should not ask about them:

- Choosing between two phrasings of equivalent quality
- Selecting section order when the outline makes the structure clear
- Inferring audience from existing project documents when the inference is strong
- Deciding whether to use bullet points or prose for a list (infer from context)
- Any decision the agent can log and flag without blocking progress
- Formatting decisions not specified in the brief (apply project defaults, flag if none exist)

---

## Cross-References

- `doctrine/AUTONOMOUS_EXECUTION.md` — decision classification (Type 1/2/3) and autonomy defaults
- `doctrine/PROGRESSIVE_UNBLOCKING.md` — what to do when a gate blocks work
- `doctrine/EDITORIAL_DOCTRINE.md` — what doctrine rules can be triggered at Gate 3
- `logs/` — where gate trigger logs are stored
