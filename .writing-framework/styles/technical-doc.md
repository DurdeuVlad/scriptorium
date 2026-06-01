# Style Pack: Technical Documentation

**Domain:** Technical documentation, engineering docs, API references, runbooks, and architecture documentation
**Version:** 1.0
**Last updated:** 2026-03-28
**Related guides:** `guides/style-packs/`, `doctrine/precision.md`, `doctrine/structure.md`

---

## 1. Domain Overview

Technical documentation enables practitioners to understand, use, operate, and maintain systems. It includes API references, runbooks, architecture documents, setup guides, troubleshooting guides, internal engineering memos, and system design docs.

The defining characteristic of technical documentation is that its failures have direct operational consequences. A runbook with a missing step wastes engineering time. An API reference with an ambiguous parameter causes integration bugs. Unlike other forms of writing, technical docs are not read — they are used. Write for use.

---

## 2. Reader and Purpose

**Reader:** A technical practitioner who knows their domain but may not know this system. They have arrived with a goal: complete a task, understand a system, diagnose a problem, or make a decision. They are not reading for pleasure. They are scanning for the specific thing they need.

**Secondary reader:** A future version of the document's author, returning months later to understand what they built.

**Purpose:** To give the reader accurate, complete information in the minimum time required to act on it. Incomplete information is worse than no documentation, because it gives false confidence. Incorrect information is worse still.

The reader will scan before they read. Design for scanning: headers, numbered steps, code blocks, and tables all serve the reader who is looking for the specific answer before committing to full sequential reading.

---

## 3. Voice Model

**3.1 Precise over elegant**
When a precise technical term exists, use it. Do not replace "idempotent" with "safe to run multiple times" to seem more approachable — the precise term communicates more, faster, to the intended reader. Correctness of meaning takes priority over readability in all cases.

**3.2 Action-oriented**
Procedures use the imperative mood. Not "You should run the following command" or "The user will then run..." — just "Run the following command." The implied subject is the reader. The imperative is direct and unambiguous.

**3.3 Scannable by design**
The reader will not start at the top and read to the bottom. Use headers as navigation landmarks. The first sentence of each section must describe the section's content, not provide warm-up. Bold key terms the reader might scan for. Use code blocks, tables, and lists as visually distinct regions.

**3.4 Explicit about scope**
Every technical document must state what it covers and, where relevant, what it does not cover. "This document covers deployment to production. For staging, see [link]." Out-of-scope statements prevent readers from following a document that does not apply to their situation.

**3.5 Neutral affect**
Technical documentation does not attempt personality. It is not dry to the point of hostility, but it does not reach for warmth or humor. The tone serves the content, not the relationship. A runbook in a production incident is not the place for a witty aside.

---

## 4. Tone Profile

Professional and efficient. The writing is confident, accurate, and unsentimental. No rhetorical questions. No rhetorical momentum ("Now, this is where things get interesting..."). No padding. No throat-clearing. No marketing language.

The reader trusts technical documentation because it is accurate. Undermining that trust with false friendliness or vague optimism ("this is pretty easy once you get the hang of it") makes the document worse, not better. Reserve commentary for cases where a genuine caveat, warning, or contextual note is required.

---

## 5. Sentence and Paragraph Structure

**Sentences:**
- One action per sentence in procedural sections.
- In explanatory prose, longer sentences are acceptable — but only when the complexity of the sentence mirrors the complexity of the concept. Do not write long sentences to seem authoritative.
- Passive voice is acceptable when the object of the action is more important than the agent, or when the agent is unknown or irrelevant. "The token is validated on each request" is correct. "The system validates the token on each request" is equally correct. Choose based on what the reader needs to track.

**Paragraphs (explanatory prose):**
- 3-5 sentences. Longer paragraphs should be broken up or converted to lists.
- Each paragraph covers one conceptual unit.
- Do not transition between paragraphs with summaries. End one idea, begin the next.

**Lists:**
- Use bulleted lists for unordered sets of 3+ items.
- Use numbered steps for all procedures. Numbered steps signal: order matters, do not skip.
- Do not use lists for fewer than 3 items if they flow naturally as prose.
- Nested lists are permitted to one level of nesting. Beyond that, restructure.

**Code blocks:**
- Use code blocks for all commands, code samples, file paths, environment variables, configuration values, and literals that must be reproduced exactly.
- Never inline a command with prose styling ("run make test"). Put it in a code block.
- Annotate code blocks when the context is not obvious. A comment in the code block is better than a sentence before it.

**Tables:**
- Use tables for comparative reference material: parameter lists, flag descriptions, status codes, environment variable reference.
- Tables require a header row. Column headers should name the information type, not the value.
- Do not use tables for sequential or procedural information.

---

## 6. Vocabulary Guidance

**Preferred:**
- Domain-accurate technical terminology used consistently. If the codebase calls it a "handler", the docs call it a "handler" — not a "processor", "worker", or "listener."
- Imperative verbs for procedures: "Run", "Set", "Create", "Configure", "Verify"
- Direct causal language: "causes", "triggers", "prevents", "returns", "fails with"
- Explicit scope language: "this document covers", "this step applies only to", "see [reference] for"

**Avoid:**
- `simply`, `just`, `easily`, `straightforward` — these are false promises. The reader may not find it easy. When they don't, these words undermine trust in the entire document.
- `basically`, `essentially`, `fundamentally` — vague softeners that reduce precision without adding anything.
- `robust`, `powerful`, `flexible`, `seamlessly` — marketing language. Replace with specific capability claims.
- Synonyms for a technical term that already exists. Consistency is more important than variety in technical writing.
- Ambiguous pronouns ("it", "this", "they") when referencing technical objects — refer to the named object.

**Define on first use:**
- Any term that has a specific meaning in this system that differs from its common meaning.
- Any abbreviation or acronym on first use, followed by the abbreviation in parentheses: "The Application Load Balancer (ALB) routes..."
- Domain jargon when the reader may not share the domain (e.g., if the doc may be read by someone outside the engineering team).

---

## 7. Structural Preferences

Technical documents follow a consistent information architecture. Deviation from this structure requires a reason.

**Standard structure:**
1. **Overview** — what this document covers, who it is for, and what state it was last verified against
2. **Prerequisites** — what the reader must have set up or know before beginning
3. **Procedure / main content** — numbered steps or organized explanatory sections
4. **Expected output / verification** — how the reader confirms the procedure succeeded
5. **Troubleshooting / error cases** — common failures, error messages, and recovery steps
6. **Reference** — parameter tables, configuration options, flag listings
7. **Related documents** — links to adjacent documentation

Not every document requires every section. A short troubleshooting guide may not have a prerequisites section. An API reference may have no procedure section. But the sequence — overview before procedure, procedure before troubleshooting, troubleshooting before reference — does not change.

**Procedures:**
- List prerequisites explicitly before the first step. Prerequisites that appear mid-procedure cause failures that are difficult to diagnose.
- State the expected output after each significant step. "You should see output similar to the following:" followed by an example block. This gives readers a verification checkpoint.
- Document error cases inline when they are predictable. "If this step fails with `permission denied`, verify that..." is more useful than a separate troubleshooting section the reader must navigate to.

**Version and freshness:**
- All technical documents should carry a version or last-verified date.
- Stale documentation that has not been verified against the current implementation is a liability. Note known gaps explicitly: "This section was last verified against v2.4. Behavior may differ in later versions."

---

## 8. Anti-Patterns

**"Simply run the following command..."**
"Simply", "just", and "easily" are forbidden in technical documentation. They set false expectations. If the command is complex or has preconditions, these words mislead. If it is genuinely simple, the word adds nothing.

**Omitting error cases**
Documentation that describes only the success path is incomplete. Real systems fail in predictable ways. Document the 3-5 most common failure modes with their error messages and recovery steps. A reader in a production incident will thank you.

**Assuming context**
Procedures that reference "the config file" without specifying its name and location, or that reference "the previous step" when the steps are not numbered, transfer work to the reader. Make every step self-contained enough that a reader who skipped the previous step can identify what they missed.

**Describing the feature instead of the use case**
"This API endpoint accepts a JSON payload with the following fields" describes the feature. "To create a new user, send a POST request to `/users` with the following payload" describes the use case. Use cases are why practitioners reach for documentation. Features are the what; use cases are the why and how.

**Stale documentation**
Documentation that contradicts the current system state is worse than no documentation. It sends readers down false paths with full confidence. Establish a process for verifying documents against implementation at release boundaries.

**Inconsistent terminology**
If the codebase, the UI, and the documentation all use different names for the same thing, readers spend cognitive overhead on translation. Establish a terms glossary for any system with non-obvious vocabulary. Use terms consistently.

**Nested bullets as structure**
Three levels of nested bullets indicate that the content should be reorganized into sections with headers. Deeply nested lists cannot be scanned — the indentation hierarchy requires careful reading that defeats the purpose of the list format.

---

## 9. Example Phrases

### Good

- "Run `make test` from the repo root. If the command fails with `missing module`, see [Troubleshooting: missing module]."
- "This document covers deployment to production. For staging deployment, see [staging-deploy.md]."
- "Set the `DATABASE_URL` environment variable before running the migrations. If this variable is not set, the migration will fail immediately with `missing required env: DATABASE_URL`."
- "Prerequisites: Node.js 18 or higher. An active API key. Write access to the target repository."
- "The token is validated on each request. An expired token returns HTTP 401 with body `{\"error\": \"token_expired\"}`."

### Bad

- "Simply execute the following straightforward steps to easily set up your environment."
- "The system provides a robust and comprehensive set of tools for seamlessly managing your infrastructure."
- "This is a pretty powerful feature once you get the hang of it — basically it lets you do a lot of cool stuff with the data."
- "Run the command. Then do the next thing. You'll know if it worked."
- "Note: make sure everything is configured correctly before proceeding."

---

## 10. Related Guides and Cross-References

- `doctrine/precision.md` — framework doctrine on precise language
- `doctrine/structure.md` — framework doctrine on document structure
- `guides/rubrics/technical-doc-rubric.md` — QA evaluation criteria for this domain
- `guides/anti-patterns/technical-doc-anti-patterns.md` — extended failure mode catalog
- `guides/examples/technical-doc-examples.md` — worked examples of well-structured technical docs
- `guides/templates/runbook-template.md` — standard runbook template
- `guides/templates/api-reference-template.md` — standard API reference template
- `styles/internal-memo.md` — for technical decision memos and architecture decision records
- `styles/general-writing.md` — for technical writing aimed at non-practitioner audiences
