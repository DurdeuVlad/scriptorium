# Style Pack: Internal Memo

**Domain:** Internal organizational communication — memos, decision records, project updates, meeting summaries, policy documents
**Version:** 1.0
**Last updated:** 2026-03-28
**Related guides:** `guides/style-packs/`, `doctrine/clarity.md`, `doctrine/structure.md`

---

## 1. Domain Overview

Internal memos are operational documents. They exist to communicate decisions, surface blockers, assign actions, align on status, or record the reasoning behind a choice. Unlike general writing, the measure of quality is not beauty or argument — it is whether the recipient can act on the memo without needing to follow up.

Internal memos are also the organizational memory. A well-written decision record from six months ago can save hours of re-litigation. A poorly written one — or one that buried the decision — is useless when the context has been forgotten.

This style pack covers: decision memos, project status updates, meeting summaries, policy announcements, escalation memos, retrospectives, and architectural decision records (ADRs).

---

## 2. Reader and Purpose

**Reader:** A colleague with organizational context and limited time. They know the project names, the team structure, and the general situation. They do not need background that they already have. They need the decision, the action, or the status — in that order.

**Secondary reader:** A future organizational member who needs to reconstruct why a decision was made. Decision records, in particular, should be readable without organizational memory.

**Purpose:**
- Decision memos: Record what was decided, why, and what the next steps are.
- Status updates: Communicate current state, blockers, and trajectory without burying the lead.
- Meeting summaries: Capture decisions made and actions assigned. Not a transcript.
- Policy documents: State the rule, who it applies to, and when it takes effect.

The memo has done its job when the recipient knows what they need to know and what (if anything) they need to do.

---

## 3. Voice Model

**3.1 BLUF — Bottom Line Up Front**
The first sentence of the memo states the decision, finding, or key status. Everything after that is support. If someone reads only the first sentence, they should know the most important thing. This is not a narrative that builds to a conclusion — it is a dispatch.

"Decision: We are postponing the launch to Q3." Not: "After considerable analysis of the market conditions, team capacity, and the findings from last week's stakeholder review, we have arrived at the conclusion that..."

**3.2 Professional but not formal**
Collegial register. Write as you would speak to a respected colleague in a meeting: clear, direct, without the stiffness of bureaucratic language. Contractions are acceptable. Jargon that the recipient knows is acceptable. Jargon used to obscure meaning is not.

**3.3 Transparent about uncertainty**
When something is not known, say so. "We don't have the vendor contract terms yet; that is blocking the final cost estimate" is more useful than inferring a number or omitting the dependency entirely. False confidence in a memo leads to downstream decisions based on bad information.

**3.4 Specific about owners, dates, and actions**
An action item without an owner is a wish. An action item without a date is an aspiration. Every action item must have: who is doing it, what exactly they are doing, and by when. "The team will look into this" is not an action item.

**3.5 No padding**
Internal memos are not performances. The recipient is not evaluating the writer's effort — they are extracting information. Phrases that signal effort without adding content ("We have thoroughly reviewed all available information and stakeholder feedback in order to...") are noise. Cut them.

---

## 4. Tone Profile

Collegial and direct. The tone assumes shared context, shared goals, and mutual respect between professionals. It does not dress up decisions in diplomatic language to the point of obscuring them. It does not adopt a formal register to signal seriousness — the content signals seriousness.

Not stiff: avoid passive constructions used for bureaucratic distance ("it has been decided", "it is recommended").
Not casual: this is a professional communication that will be read, filed, and potentially referenced later.

When delivering unwelcome news (a delay, a change of direction, a resource cut), be direct without being blunt. State the situation, the reasoning, and the path forward. Do not soften the fact with so many qualifications that the reader is unsure what has actually happened.

---

## 5. Sentence and Paragraph Structure

**Sentences:**
- Short to medium length. Internal memos should be readable in a single pass.
- Active voice with named subjects: "Jana confirmed the vendor terms" not "the vendor terms were confirmed."
- One idea per sentence for action items and decisions. Complex reasoning may require longer sentences in the context section.

**Paragraphs:**
- 2-4 sentences maximum for most sections.
- Each paragraph covers one point. Do not merge the decision and the next steps into the same paragraph.
- Do not end paragraphs with transitions to the next section. Use headers instead.

**Headers:**
- Use for all memos over 200 words.
- Standard headers for decision memos: Summary / Context / Decision / Rationale / Risks / Next Steps
- Standard headers for status updates: Status / Progress Since Last Update / Blockers / Next Period Plan / Actions
- Standard headers for meeting summaries: Date / Attendees / Decisions Made / Actions Assigned / Open Questions
- Do not use headers as decorative section dividers when the content is short enough to read without navigation.

**Lists:**
- Use bullets for: action items, blockers, risks, options considered.
- Use numbered lists for: sequential decisions made, ranked priorities, ordered steps.
- Nested bullets: one level only. Two-level nesting is acceptable. Three levels means the content needs to be restructured.

---

## 6. Vocabulary Guidance

**Preferred:**
- Specific numbers and dates: "by March 15", "three of the five vendors", "a 20% increase in estimated cost"
- Named owners: "Jana", "the backend team", "Product" — not "someone", "the relevant party", "stakeholders"
- Action verbs: "decided", "approved", "blocked on", "escalating", "deferring"
- Honest hedges when appropriate: "we estimate", "subject to vendor confirmation", "contingent on"

**Avoid:**
- Corporate jargon that substitutes for meaning:
  - `leverage synergies` — say what the actual benefit is
  - `move the needle` — say what metric you are changing and by how much
  - `circle back` — use "follow up" or name a specific date
  - `align on` — say "agree on" or "decide"
  - `bandwidth` — use "capacity" or "time"
  - `socialize` — use "share with", "discuss with", "get feedback from"
  - `ideate` — use "generate ideas" or just name the activity
  - `learnings` — use "lessons" or "findings"
- Passive constructions that hide accountability: "a decision was made", "it was agreed"
- Vague urgency without timeline: "as soon as possible", "at your earliest convenience"
- Filler acknowledgments: "Thank you for your continued support and collaboration."

**Acronyms:**
- Spell out on first use unless the acronym is universal in the organization.
- Do not assume the reader knows the internal project names: spell them out once, abbreviate thereafter.

**Dates:**
- Always give specific calendar dates, not relative ones. "By end of month" is ambiguous if the memo is forwarded or filed. Write "by March 31."

---

## 7. Structural Preferences

**Memo header (required):**
```
Date:    YYYY-MM-DD
From:    [Author name / team]
To:      [Recipient(s) / distribution]
Subject: [Specific description — not "Update" or "Re: Project"]
Status:  [Draft / Final / For Decision / For Review / FYI]
```

The subject line should describe the content specifically: "Decision: Moving API Gateway to Phase 3" not "API Gateway Update."

**Decision memo structure:**
1. **Summary** — one sentence. What was decided.
2. **Context** — 1-3 sentences. Only what the reader needs to understand the decision; not a full history.
3. **Decision** — the decision stated explicitly, with the effective date if applicable.
4. **Rationale** — the key reasons. Bullets are appropriate here.
5. **Alternatives considered** — what was not chosen and why (brief).
6. **Risks and mitigations** — what could go wrong and what is being done about it.
7. **Next Steps** — specific actions with owners and dates.

**Status update structure:**
1. **Status** — one word or phrase: On Track / At Risk / Blocked / Delayed / Complete
2. **Summary** — one or two sentences on current state.
3. **Progress** — what changed since the last update.
4. **Blockers** — specific blockers with owners and expected resolution dates.
5. **Next period plan** — what the team will do before the next update.
6. **Actions** — specific asks of the recipient(s), if any.

**Meeting summary structure:**
- Date, duration, attendees (names only, not titles)
- Decisions made — numbered, specific
- Actions assigned — owner / action / due date in tabular format
- Open questions — parked items with assigned owners
- Next meeting date if recurring

Do not write meeting summaries as prose narratives. The value is the decisions and actions, not the flow of the conversation.

---

## 8. Anti-Patterns

**Burying the decision in paragraph 4**
If the memo does not state the decision, recommendation, or key finding in the first two sentences, it has failed. A reader who stops at paragraph 2 should know the most important thing. The rest of the memo is evidence and logistics.

**Action items without owners or dates**
"We should follow up on the vendor contract" is not an action item. "Jana: confirm vendor terms. Due: March 20." is an action item. Every action must have a name attached and a date. If no one has been assigned, note that explicitly and assign someone in the memo.

**Providing background the recipient already has**
"As you know, we have been working on the API gateway migration since Q4..." The recipient knows. Skip to what they do not know. If in doubt about what the reader knows, assume they know the project; brief only on the specific new development.

**Ending with a request for vague next steps**
"Please let me know if you have any questions or concerns." This is filler that signals the memo has not done its job. If you want a specific response by a specific time, say so: "Please confirm by March 10 whether this is approved." If no response is needed, say so.

**False confidence to avoid discomfort**
A memo that obscures a delay, downplays a blocker, or omits a risk to avoid delivering bad news is worse than no memo. The reader will discover the reality eventually. The cost of discovering it late — rather than addressing it when the memo was written — is organizational debt.

**Using the memo as a thought exercise**
Circulating a memo of open questions without a recommendation or a clear ask is not a useful memo. Memos crystallize thinking; they are not the place to do the thinking. If the analysis is incomplete, note that explicitly: "Decision pending vendor confirmation of cost. Recommendation will follow by March 18."

---

## 9. Example Phrases

### Good

- "Decision: We will move the launch to Q3. Rationale below."
- "Action: Jana to confirm vendor terms by March 20. Blocking: nothing."
- "Status: At Risk. The database migration is two days behind due to a schema conflict discovered on March 25. See Blockers."
- "We don't have the security audit results yet. This is blocking the staging deploy. Owner: Marcus. Expected: March 31."
- "Alternatives considered: (1) delaying the entire release — rejected because of contractual commitments. (2) shipping without the auth module — rejected because of compliance requirements."

### Bad

- "In order to ensure continued alignment and facilitate cross-functional synergies, we would like to take this opportunity to outline our thinking with respect to the upcoming Q3 planning cycle..."
- "Please let me know if you have any questions or concerns at your earliest convenience."
- "The team has been working hard to address the various challenges that have come up, and we are confident that we will be able to resolve them in a timely manner going forward."
- "As we all know, the project has faced some headwinds lately, and it's important for us to all be on the same page as we move forward."
- "Action items: follow up on vendor stuff, look into the compliance thing, check in with the team."

---

## 10. Related Guides and Cross-References

- `doctrine/clarity.md` — framework doctrine on clear communication
- `doctrine/structure.md` — framework doctrine on document structure
- `guides/rubrics/internal-memo-rubric.md` — QA evaluation criteria for this domain
- `guides/anti-patterns/internal-memo-anti-patterns.md` — extended anti-pattern catalog
- `guides/templates/decision-memo-template.md` — standard decision memo template
- `guides/templates/status-update-template.md` — standard project status update template
- `guides/templates/meeting-summary-template.md` — standard meeting summary template
- `guides/decision-records/` — canonical decision records for this framework
- `styles/technical-doc.md` — for architecture decision records with technical depth
- `styles/general-writing.md` — for longer-form organizational writing (proposals, research)
