# VOICE MODEL

**Status:** Canonical. Defines how agents handle voice — its preservation, its detection when absent, and its restoration when degraded.

---

## Mission

Voice is the hardest quality to preserve and the easiest to destroy. An agent that "improves" text without understanding its voice will produce prose that is technically cleaner and functionally worse. This doctrine prevents agents from smoothing, flattening, or normalizing voice out of existence in the name of improvement.

The failure mode this doctrine addresses: an agent receives text with a distinctive voice, applies "editorial improvements" (grammar, clarity, compression), and returns text that is more correct but less alive. The agent was optimizing for the wrong target.

---

## What Voice Is

Voice is the combination of qualities that make text feel written by a specific intelligence rather than generated from an average of all similar text.

Voice consists of:

**Sentence rhythm and variation.** Does the text mix short declarative sentences with longer analytical ones? Does it break the rhythm deliberately for emphasis? Voice is audible in the pattern of sentence lengths and structures across a paragraph.

**Commitment level.** How strongly does the writer state claims? Does the text say "this is wrong" or "this may be suboptimal"? High-commitment voice states things directly and accepts the responsibility. Low-commitment voice hedges. Some voices are characteristically high-commitment; hedging erases them.

**Word choice specificity.** Does the writer choose the most precise word or the safest one? A writer who says "the argument fails because it assumes X, which is false" has a different voice from one who says "there may be some concerns about the underlying assumptions."

**What the writer notices.** Voice shows in what details are selected. Two writers covering the same topic will not make the same choices about what to observe, quote, or foreground. These selection choices are voice.

**What the writer does not say.** Voice is as present in omissions as in inclusions. A writer who trusts the reader to make connections does not spell them out. An agent that adds transitional explanation to every logical step is erasing the voice's reliance on the reader's intelligence.

**Characteristic structures.** How does the writer open paragraphs? How do they close them? Do they use a characteristic move — a pivot sentence, a single-sentence final line, an enumerated assertion? These structural habits are voice.

---

## What Voice Is Not

**Voice is not consistent grammar.** Grammar can be correct while voice is absent. Voice can be present while grammar bends rules deliberately.

**Voice is not consistent tone.** Tone (formal, casual, urgent, detached) can vary across a document. Voice persists through tone changes — it is the sensibility underneath the tone.

**Voice is not the absence of casual language.** Casual language is a voice choice. Removing it "for professionalism" is a voice decision, not an editorial improvement.

**Voice is not the absence of technical language.** Technical precision is a voice choice in technical writing. Replacing technical terms with accessible alternatives changes voice, not just register.

---

## AI-Stink Detection

AI-stink is the quality of prose that signals it was generated rather than written. AI-stink results from: optimizing for plausibility over specificity, producing the most expected continuation at every point, and averaging across all similar text rather than committing to a specific perspective.

### Detection Checklist

Flag any text that exhibits these patterns:

**Structural AI-stink:**
- Opens a section with a rhetorical question ("What does it mean to...?" / "How can we...?")
- Uses "it is worth noting" or "it is important to note" — if it is worth noting, note it directly
- Opens with a definition of a term the audience already knows
- States the obvious before the non-obvious ("Writing is the act of putting words on a page. Good writing, however...")
- Ends a section with "In conclusion..." or "To summarize..." or "In summary..."
- Uses transition sentences that only announce what comes next without carrying meaning ("Now let us turn to...")

**Vocabulary AI-stink:**
- "Delve into," "unpack," "navigate," "explore" used as verbs for intellectual activity
- "Leverage" (use "use")
- "Holistic," "robust," "comprehensive," "cutting-edge," "game-changing," "transformative"
- "In today's fast-paced world" or any ambient-context opener
- "Nuanced," "multifaceted," "complex" used as filler adjectives
- "It goes without saying" (if it goes without saying, do not say it)

**Rhythm AI-stink:**
- All paragraphs roughly the same length
- All sentences roughly the same syntactic structure
- No unexpected rhythm breaks — no short emphatic sentences, no deliberate fragments
- Everything is the most predictable word choice — no moment of surprise or precision

**Commitment AI-stink:**
- Hedges a claim that should be stated directly ("may," "might," "could" when the claim is known)
- Smooths over a contradiction instead of naming it ("while there are differing perspectives...")
- Three examples when one would be more forceful
- An argument that leads to a conclusion but pulls back from stating it

### Detection Action

When AI-stink is detected:
1. Flag the specific phrase or pattern — do not make a general observation
2. State specifically what is wrong with it (which detection criterion it triggers)
3. Propose a specific fix — not just "rewrite this" but a concrete alternative or approach
4. Do not perform a blind rewrite. The fix must justify itself against the specific diagnosis.

---

## Voice Preservation Rules

### When Editing Text from a User or Prior Agent

1. Identify the characteristic voice markers before editing — list them explicitly. What is the sentence length tendency? What is the commitment level? What characteristic word choices or structural moves are present?
2. Only edit for the stated purpose. If the task is grammar correction, do not also change voice. If the task is compression, do not also change commitment level.
3. Do not change characteristic structures unless they violate doctrine — and if they do, flag the doctrine conflict before removing them.
4. After editing, verify that the identified voice markers survive. If they were changed as a side effect of the edit, restore them.
5. If restoring a voice marker conflicts with the edit goal, surface the conflict. Do not silently choose one over the other.

### When Merging Text from Multiple Agents

1. Before normalization, identify the dominant voice in each section and document it.
2. Identify the target voice for the document — from the voice pack, the user's source text, or the style pack.
3. Normalize toward the target voice, not toward a generic neutral voice.
4. Document every section where a voice change was made and why.
5. Normalization to flat, neutral prose is the wrong outcome. If the normalization pass produces text that has no distinctive voice characteristics, it has failed.

---

## Voice Pack Specification

A voice pack is a compact, precise description of the specific voice for a given project, document type, or client. Voice packs are the specification that normalizers and voice editors work from.

### Required Voice Pack Fields

**Sentence length tendency:** Short and punchy / Long and analytical / Varied with deliberate rhythm shifts. If varied, describe the pattern of variation (e.g., "typically opens with a short declaration, develops with longer analytical sentences, closes short").

**Commitment level:** Direct assertions that accept the claim / Qualified claims with hedged confidence / Reader-led phrasing that positions the reader to conclude. Note whether commitment varies by topic type.

**Characteristic vocabulary:** Formal / Technical / Colloquial / Domain-specific. Name specific words or phrases that are characteristic (and specific words that should never appear).

**What the writing notices:** What details does this voice attend to? Technical specifics? Human consequences? Structural logic? Aesthetic qualities? A voice pack for technical writing attends to precision; a voice pack for narrative attends to character and causality.

**What the writing trusts the reader to know:** What does this voice not explain? A voice that trusts technical readers does not define standard terms. A voice that trusts sophisticated readers does not explain logical connections. State the assumed knowledge level explicitly.

**Anti-targets:** Specific voice qualities this pack is defined against. "Never sounds like a corporate press release." "Never sounds like a product FAQ." "Never uses rhetorical questions." Anti-targets are often easier to specify than positive targets.

### Voice Pack Length and Location

Voice packs should be 200-400 words. Longer than that and they are not being used — they are being filed. Short enough to read before every edit pass.

Voice packs live in `styles/` or `guides/style-packs/` depending on project structure. The voice pack filename should match the project or document type it governs.

---

## Voice Editing Pass Protocol

When a voice editing pass is explicitly required:

1. Read the voice pack for the project. If no voice pack exists, create one from the source text before proceeding.
2. Read the draft and mark every passage that deviates from the voice pack specification.
3. For each marked passage: state the deviation, propose the correction, apply it.
4. Run the AI-stink detection checklist on the final draft.
5. Produce a voice edit log: what was changed, what was preserved, and any voice pack gaps that were revealed.

A voice editing pass is not a rewrite. It is a targeted intervention on specific voice failures. Passages that conform to the voice pack should not be touched.

---

## Cross-References

- `doctrine/EDITORIAL_DOCTRINE.md` — general editorial rules, anti-patterns, and the genericity test
- `styles/` — domain and project voice packs
- `guides/style-packs/` — alternative voice pack location for guide-based projects
- `.claude/agents/qa-ai-stink.md` — the QA agent that runs AI-stink detection
- `.claude/agents/voice-editor.md` — the agent that executes voice editing passes
- `doctrine/DECOMPOSITION_RULES.md` — merge-normalizer stage where voice normalization occurs
