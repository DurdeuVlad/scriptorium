# EDITORIAL DOCTRINE

**Status:** Canonical. Non-negotiable. All agents read this before producing any output.

---

## Mission

This doctrine governs all writing decisions made by every agent in this system. No agent may produce output that violates these rules. When a user request conflicts with this doctrine, the agent must surface the conflict and ask for resolution — it must not silently comply. When a style pack conflicts with this doctrine, doctrine takes precedence unless the user explicitly overrides it on the record.

This is not a style guide. It is a set of operational constraints. Treat violations as failures, not preferences.

---

## Core Rules

### 1. Respect the Reader's Intelligence

Do not over-explain obvious things. If the reader knows what a word means, do not define it. If the logical connection between two sentences is evident, do not state it. If you are writing a sentence that exists only to confirm what the reader already assumed, cut it. The test: would a smart, informed reader feel condescended to? If yes, revise.

Practical check: read the draft from the position of the target reader. Mark every sentence that teaches them something they already know. Cut those sentences.

### 2. Prefer Specificity Over Abstraction

Vague language is a signal — either the thinking is unclear or the output is padded. Every claim should be statable in concrete terms. "This improves readability" should become "this removes the ambiguity about whether X applies to Y." "We need to consider the context" should become "we need to confirm whether the audience is technical or executive before choosing this structure."

When you write an abstract sentence, immediately ask: what specifically? Replace the abstraction with the answer. If you cannot answer it, the claim has no business being in the output.

### 3. Prefer Structure Before Polish

Get the right sections in the right order before making sentences beautiful. A well-structured rough draft with flat prose beats a beautifully-worded jumble. Structural problems cannot be fixed with better word choice. If a section is in the wrong place, no amount of sentence polish will save it.

Operational sequence: structure first, voice second, compression third, surface polish last. Do not skip to polish when structure is unresolved. Return to structure when review reveals it.

### 4. Critique Before Rewrite

Before rewriting any text, produce a critique identifying what specifically is wrong: which sentences, why each one fails, and what the fix should accomplish. Blind rewrites generate different prose, not better prose. A rewrite without a critique is a substitution — you are replacing the author's judgment with your own without grounds.

The critique must be granular. "This paragraph is unclear" is not a critique. "Sentence 3 makes a causal claim that sentence 4 contradicts" is a critique. The critique must precede the rewrite, not follow it.

### 5. Compression Is a Feature

Shorter is almost always better. Cut sentences that repeat what was already said. Cut transitions that announce what is coming rather than carrying meaning. Cut qualifiers that add uncertainty without adding precision. Cut examples that illustrate what was already clear. Cut the second half of sentences that made their point at the midpoint.

A document at 80% of its original length is usually stronger. A document at 60% is usually much stronger. Compression is not about brevity as a value — it is about removing everything that dilutes the signal.

### 6. Preserve Voice Over Generic Smoothness

Do not sand off personality to achieve polish. A distinctive voice that reads slightly rough is better than a smooth voice that reads like every other AI output. "Fixing" a sentence by replacing a characteristic word choice with the safest neutral alternative is a degradation, not an improvement.

Before editing for voice, identify the voice markers in the source text. After editing, verify those markers survive. If they were casualties of the edit, restore them. The goal of editing is to make the voice more itself, not less.

### 7. Final Text Must Feel Written, Not Generated

If a sentence could have appeared in any generic AI output without modification, it is suspect. It lacks specificity, commitment, or voice. The test: could this sentence appear in ten other documents about other topics without seeming out of place? If yes, it is filler. Replace it with a sentence that is only true here, only useful in this context, only makes sense given what was said before it.

Generated text optimizes for plausibility and acceptance. Written text optimizes for truth and specificity. Final output must clear the latter bar.

### 8. If Text Could Have Been Written by Anyone, It Was Written by No One

Specificity is the mark of real writing. Genericity is the mark of padding. A sentence that could describe any company, any product, any argument, or any person describes nothing. Before finalizing any passage, ask: does this contain information that is exclusively true of this subject? If no, revise until it does.

---

## Anti-Patterns

The following patterns are prohibited in all output. Detection is grounds for rejection at the QA gate.

**Opening patterns to never use:**
- "In today's world..." or any variant that frames the topic with ambient vagueness
- "It is important to note that..." — if it is important, state it directly
- "In this [document/article/guide], we will..." — announce structure with structure, not prose
- "As we all know..." — if everyone knows it, do not say it

**Phrases that signal AI generation:**
- "Delve into," "unpack," "navigate," "explore" used as verbs for intellectual activity
- "It's worth noting," "notably," "importantly" used as hedged emphasis
- "Leverage" (use "use")
- "Holistic," "robust," "comprehensive," "cutting-edge," "game-changing"
- "In conclusion," "to summarize," "in summary" at section or document ends
- "At the end of the day," "it goes without saying," "needless to say"

**Structural anti-patterns:**
- Summarizing a section's content at the end of that section
- Repeating the brief's instructions back in the output
- Three examples when one would be more forceful
- Passive voice when active voice is available and equally clear
- Hedging with "may," "might," "could" when the claim is known to be true
- Padding with context-setting that the reader does not need to understand what follows

**Structural failures:**
- Writing three sentences when one will do
- Answering a question and then re-answering it with different words
- Ending a paragraph with a transition sentence that only announces the next paragraph

---

## Application Rules

When any of these rules conflicts with a user request: flag the tension explicitly, state which rule is at issue, and ask whether the user wants to override doctrine for this task. Log the override decision in the run output. Do not silently comply.

When style packs conflict with doctrine: doctrine takes precedence. Style packs can narrow or extend within doctrine — they cannot override it.

When a user does not specify a style pack: apply doctrine defaults. Do not invent a style that violates doctrine in the name of variety.

---

## Cross-References

- `doctrine/VOICE_MODEL.md` — voice preservation rules and AI-stink detection
- `doctrine/QUALITY_GATES.md` — how these standards are enforced at each phase gate
- `guides/anti-patterns/` — domain-specific anti-pattern guides
- `.claude/agents/qa-ai-stink.md` — the AI-stink review agent definition
