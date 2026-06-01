# Role Contract Template

**Version:** 2.0
**Applies to:** All agents in `.writing-framework/agents/`

This template defines the required structure for every agent spec in the Editorial Orchestrator framework. Every agent spec must include all required sections. Optional sections may be omitted if genuinely not applicable, but must not be omitted for convenience.

---

## Template

Copy the block below and fill in every section. Replace `[PLACEHOLDER]` values. Do not leave placeholder text in a finalized spec.

---

```markdown
# [Agent Name]

**Phase:** [phase when this agent becomes active, e.g. 2]
**Status:** [stub | active | deprecated]
**Category:** [meta-orchestration | writing-editing | qa | sync | artifact]
**Invoked by:** [commands and agents that invoke this agent]

## Mission
[One paragraph. What this agent exists to do. Must be specific enough that someone could determine from this paragraph alone whether this agent is the right one for a given task. Must name the artifact it produces.]

## Adjacent Agent Boundaries
[Required. List 3–6 specific boundary cases that define where this agent's scope ends and an adjacent agent's begins. Format: "X is handled by [agent], not this agent." Prevents scope creep.]

- [Boundary case 1]
- [Boundary case 2]
- [Boundary case 3]
- [Add more as needed]

## Allowed Inputs
| Input | Type | Required | Notes |
|-------|------|----------|-------|
| [input name] | [type] | Yes/No | [notes] |

## Required Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| [output name] | [type] | [schema file or —] | [notes] |

## Behavior
[Numbered steps. Every step must be specific and actionable. No step should be "use judgment" without defining what that judgment is constrained by. Steps must reference specific files, schemas, and doctrine where applicable.]

1. [Step 1]
2. [Step 2]
...

## Forbidden Behaviors
[Required. At least 4 specific forbidden behaviors. Each must name the specific action forbidden, not a vague category. Format: "Does not [specific action] — [why or what agent does instead]."]

- Does not [forbidden action 1] — [rationale or redirect]
- Does not [forbidden action 2] — [rationale or redirect]
- Does not [forbidden action 3] — [rationale or redirect]
- Does not [forbidden action 4] — [rationale or redirect]

## Maximum Scope
**Scope ceiling:** [One sentence. The hardest limit on what this agent can change. Must be specific about what files/artifacts are off-limits.]

[Additional scope notes if needed.]

## Escalation Triggers
[Required. Each trigger must specify: condition → escalation level → what output is produced → what continues while escalation is pending.]

| Trigger Condition | Level | Output | Continues While Pending |
|-------------------|-------|--------|------------------------|
| [condition] | [1-4] | [artifact] | [what work proceeds] |

Escalation levels:
- Level 1: Self-resolve (agent resolves without escalating)
- Level 2: → blockage-handler (classify, scope, partial output)
- Level 3: → lead-orchestrator (route to alternate path or human gate)
- Level 4: → Human Gate (user decision required per HUMAN_IN_THE_LOOP_GATES.md)

## Final Prose Ownership
[Required for agents that produce or touch document text. State clearly: does this agent hold final prose ownership, or does it produce bounded output that feeds the owner?]

[For lead-orchestrator and merge-normalizer only:] This agent holds final prose ownership over assembled documents.

[For all other agents:] This agent produces bounded output only. It does not hold assembly-level prose ownership. Assembled document text is owned by merge-normalizer (during drafting) and lead-orchestrator (for final output routing).

## Handoff Format
[Required. Show the exact JSON or file structure this agent produces for the next agent in the chain. Must match the referenced schema. Include a complete example with realistic field values, not just field names.]

[Schema reference: `schemas/[schema-name].schema.json`]

```json
{
  "field_name": "example value",
  ...
}
```

## Quality Self-Check
[Required. A checklist the agent runs against its own output before delivering. Each item must be verifiable — no "ensure quality" items. Format: checkable statements.]

- [ ] [Specific verifiable check 1]
- [ ] [Specific verifiable check 2]
- [ ] [Specific verifiable check 3]
...

## Cross-References
[Required. List all related agents, commands, schemas, and doctrine files. Keep current.]

- **Agents:** [list]
- **Commands:** [list]
- **Schemas:** [list]
- **Doctrine:** [list]
```

---

## Required Section Checklist

Before marking an agent spec as `Status: active`, verify all required sections are present and complete:

| Section | Required | Notes |
|---------|----------|-------|
| Mission | Yes | Must name the artifact produced |
| Adjacent Agent Boundaries | Yes | Minimum 3 boundary cases |
| Allowed Inputs | Yes | All inputs with Required flag |
| Required Outputs | Yes | All outputs with schema reference |
| Behavior | Yes | Numbered steps, no vague "use judgment" |
| Forbidden Behaviors | Yes | Minimum 4 specific items |
| Maximum Scope | Yes | Must include Scope Ceiling sentence |
| Escalation Triggers | Yes | All triggers with level + continues-while-pending |
| Final Prose Ownership | Yes for prose-touching agents | Must state ownership or non-ownership |
| Handoff Format | Yes | Must include JSON example matching schema |
| Quality Self-Check | Yes | Minimum 4 checkable items |
| Cross-References | Yes | Agents, Commands, Schemas, Doctrine |

---

## Common Spec Failures

These patterns indicate a spec that needs revision:

**Vague mission**: "Helps with writing tasks." → Fix: name the specific artifact produced and the bounded scope.

**Overlap with adjacent agent**: Section-drafter spec that says it "revises content as needed." → Fix: state explicitly that revision is lead-editor's scope, not section-drafter's.

**Escalation without continuation**: "If source material is missing, halt." → Fix: identify what can continue while the blocker is pending.

**Hollow forbidden behaviors**: "Does not produce low-quality output." → Fix: name the specific action that is forbidden, not the outcome to avoid.

**Missing schema reference**: Handoff format shows arbitrary JSON without referencing a schema file. → Fix: all structured outputs must reference a schema in `.writing-framework/schemas/`.

**Final prose ownership ambiguity**: An editorial agent spec that doesn't state whether it holds prose ownership. → Fix: explicitly state "produces bounded output only."

---

## Version History

| Version | Date | Change |
|---------|------|--------|
| 1.0 | Phase 1 | Initial stub format established |
| 2.0 | Phase 2 | Added Adjacent Agent Boundaries, Scope Ceiling, Escalation levels, Final Prose Ownership sections |
