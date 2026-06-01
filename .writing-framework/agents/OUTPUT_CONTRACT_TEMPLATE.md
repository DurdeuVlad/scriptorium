# Output Contract Template

**Version:** 2.0 (Phase 2)
**Related:** `HANDOFF_CONTRACTS.md`, `ROLE_CONTRACT_TEMPLATE.md`, `.writing-framework/schemas/`

An output contract defines exactly what one agent produces for the next. It is the formal specification of a handoff artifact — independent of the agent that produces it. This template is used when defining a new output, adding an output to an existing agent, or documenting an undocumented output.

---

## What an Output Contract Is

An output contract answers four questions:
1. **What is the artifact?** (file, JSON, structured text)
2. **What schema governs it?** (schema file path, or "none — free-form with specified fields")
3. **What are the required fields?** (must be present for the receiving agent to accept)
4. **What does the receiving agent do when it arrives?** (validation, action, routing)

Output contracts live in agent spec files (in the `## Required Outputs` and `## Handoff Format` sections) and are indexed in `HANDOFF_CONTRACTS.md`. This template is the format for defining them.

---

## Template

Copy this block when defining a new output contract. Fill in every field.

```markdown
### Output Contract: [artifact name]

**Produced by:** [agent name]
**Consumed by:** [agent name(s)] — list all receivers
**Trigger:** [what causes this output to be produced]
**Format:** [JSON file | Markdown file | Structured text | Embedded in run context]
**Schema:** [`.writing-framework/schemas/[name].schema.json`] or [none — free-form, fields defined below]
**Artifact path:** [`artifacts/[name].json`] or [varies — specify rule]

#### Required Fields
| Field | Type | Description | Validation Rule |
|-------|------|-------------|-----------------|
| [field] | [type] | [what it contains] | [how receiver validates it] |

#### Optional Fields
| Field | Type | Description | When Present |
|-------|------|-------------|--------------|
| [field] | [type] | [what it contains] | [condition under which it appears] |

#### Example
```json
{
  "field_name": "example value — realistic, not placeholder",
  "another_field": 0,
  "nested": {
    "key": "value"
  }
}
```

#### Receiving Agent Behavior
1. [First thing the receiving agent does with this output]
2. [Validation step]
3. [Action taken on receipt]

#### Partial Output Handling
[What happens if this output is incomplete due to a blocker. What fields are still required even in a partial output. How the receiving agent detects that the output is partial.]

#### On Validation Failure
[What happens if the output fails schema validation or required fields are missing. Blocker type. Which agent handles the failure.]
```

---

## Output Contract Registry

All outputs in the framework, indexed by artifact name. Links to the agent spec that defines each.

| Artifact | Produced By | Consumed By | Schema | Phase |
|----------|-------------|-------------|--------|-------|
| `routing_decision` | intake-router | lead-orchestrator | none (embedded) | 2 |
| `discovery_report` | discovery-orchestrator | lead-orchestrator | none (structured markdown) | 2 |
| `discovery_findings` | discovery-agent | discovery-orchestrator | none (embedded) | 2 |
| `brief.json` | brief-writer | outline-architect, lead-orchestrator | `brief.schema.json` | 3 |
| `outline.json` | outline-architect | section-drafter (per section), lead-orchestrator | `outline.schema.json` | 3 |
| `section_draft` | section-drafter | merge-normalizer | `section_draft.schema.json` | 3 |
| `draft.md` | merge-normalizer | lead-editor, QA agents | none (markdown) | 3 |
| `merge_report.json` | merge-normalizer | lead-editor, lead-orchestrator | `merge_report.schema.json` | 3 |
| `voice_corrected_draft` | voice-editor | lead-editor | none (markdown) | 3 |
| `line_edited_draft` | line-editor | lead-editor | none (markdown) | 3 |
| `clarity_edited_draft` | clarity-editor | lead-editor | none (markdown) | 3 |
| `compressed_draft` | compression-editor | lead-editor | none (markdown) | 3 |
| `canon_check_report` | canon-checker | lead-editor, lead-orchestrator | none (structured markdown) | 3 |
| `adversarial_review_report` | adversarial-reviewer | lead-editor | none (structured markdown) | 3 |
| `review_report.json` (×6) | qa-reader, qa-skeptic, qa-domain, qa-style, qa-coherence, qa-ai-stink | qa-final | `review_report.schema.json` | 4 |
| `quality_gate.json` | qa-final | lead-orchestrator | `quality_gate.schema.json` | 4 |
| `blocker_report.json` | blockage-handler | lead-orchestrator | `blocker_report.schema.json` | 2 |
| `artifact_manifest.json` | artifact-orchestrator | lead-orchestrator, export commands | `artifact_manifest.schema.json` | 5 |
| `sync_manifest.json` | framework-sync-agent | lead-orchestrator, import-export-orchestrator | `sync_manifest.schema.json` | 6 |
| `research_report.json` | research commands | brief-writer, section-drafter | `research_report.schema.json` | 3 |
| `rewrite_plan.json` | lead-editor | section-drafter (for rewrites) | `rewrite_plan.schema.json` | 3 |

---

## Output Contract Validation Checklist

Before marking an output contract as complete, verify:

- [ ] Schema file exists in `.writing-framework/schemas/` OR free-form fields are fully specified
- [ ] Required fields are exhaustive — no field that a receiver depends on is missing from the required list
- [ ] Example JSON is realistic and complete (not placeholder text)
- [ ] Partial output handling defines minimum viable partial output
- [ ] On validation failure defines a specific blocker type (B1-B9) and routing

---

## Adding a New Output Contract

When a new agent is created or a new output type is defined:

1. Define the output contract using this template
2. Add the contract to the agent's `## Required Outputs` and `## Handoff Format` sections
3. Create the schema file in `.writing-framework/schemas/` if one is needed
4. Add the output to the registry table above
5. Add the handoff to `HANDOFF_CONTRACTS.md` Section 2 and Section 3
6. Update the receiving agent's `## Allowed Inputs` to list this output as an input
