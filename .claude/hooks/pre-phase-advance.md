# Pre-Phase-Advance Hook

**Hook Type:** Gate Check
**Trigger:** Before advancing from one workflow phase to next
**Purpose:** Enforce quality gates to prevent incomplete work from advancing

---

## Hook Execution

**When triggered:**
- Workflow attempts to advance to next phase
- Examples:
  - Discovery → Brief
  - Brief → Outline
  - Outline → Draft
  - Draft → Review
  - Review → Artifact

**Hook runs:**
1. Identify current phase and target phase
2. Determine required gate for transition
3. Run gate checks
4. If gate passes → allow phase advance
5. If gate fails → block phase advance, return gate failure report

---

## Gate Mapping

**Phase transitions and required gates:**

| From Phase | To Phase | Required Gate | Enforced By |
|------------|----------|---------------|-------------|
| Discovery | Brief | Discovery Gate | brief-writer |
| Brief | Outline | Brief Gate | outline-architect |
| Outline | Draft | Outline Gate | section-drafter |
| Draft | Review | Draft Gate | adversarial-reviewer |
| Review | Artifact | QA Gate | artifact-orchestrator |
| Artifact | Finalize | Artifact Gate | artifact-orchestrator |

---

## Discovery Gate Check

**Required before:** Brief creation

**Validation:**
```javascript
const discovery_report = await load_artifact('discovery_report.json');

// Check 1: Report exists and conforms to schema
if (!discovery_report || !validate_schema(discovery_report, 'discovery_report.schema.json')) {
  return gate_failure('Discovery report missing or invalid schema');
}

// Check 2: context.confirmed populated
if (!discovery_report.context?.confirmed || discovery_report.context.confirmed.length === 0) {
  return gate_failure('context.confirmed section empty');
}

// Check 3: context.inferred populated or explicitly empty
if (discovery_report.context?.inferred === undefined) {
  return gate_failure('context.inferred section missing');
}

// Check 4: blockers classified
for (const blocker of discovery_report.blockers || []) {
  if (!blocker.blocker_type || !blocker.blocker_type.match(/^B[1-9]/)) {
    return gate_failure(`Blocker not classified: ${blocker.description}`);
  }
}

// Check 5: next_actions specific
if (!discovery_report.next_actions || discovery_report.next_actions.length === 0) {
  return gate_failure('next_actions section empty');
}

for (const action of discovery_report.next_actions) {
  if (action.includes('TBD') || action.includes('to be determined')) {
    return gate_failure(`Vague next action: ${action}`);
  }
}

return gate_pass('Discovery Gate');
```

**On failure:**
- Block brief creation
- Return specific failed criteria
- Suggest: "Update discovery report or re-run /discover"

---

## Brief Gate Check

**Required before:** Outline creation

**Validation:**
```javascript
const brief = await load_artifact('brief.json');

// Check 1: Brief exists and conforms to schema
if (!brief || !validate_schema(brief, 'brief.schema.json')) {
  return gate_failure('Brief missing or invalid schema');
}

// Check 2: audience specific
if (!brief.audience?.primary || brief.audience.primary.toLowerCase().includes('general')) {
  return gate_failure('audience.primary too vague (must identify the actual reader)');
}

if (!brief.audience?.knowledge_level) {
  return gate_failure('audience.knowledge_level missing');
}

// Check 3: scope has boundaries
if (!brief.scope?.in_scope?.length || !brief.scope?.out_of_scope?.length) {
  return gate_failure('scope field missing in_scope or out_of_scope boundaries');
}

// Check 4: success_criteria testable
if (!brief.success_criteria || brief.success_criteria.length === 0) {
  return gate_failure('success_criteria field empty');
}

for (const criterion of brief.success_criteria) {
  if (criterion.includes('high quality') || criterion.includes('good writing')) {
    return gate_failure(`Vague success criterion: ${criterion} (must be testable)`);
  }
}

return gate_pass('Brief Gate');
```

**On failure:**
- Block outline creation
- Return specific failed fields
- Suggest: "Update brief.json or re-run /write-brief"

---

## Outline Gate Check

**Required before:** Section drafting

**Validation:**
```javascript
const outline = await load_artifact('outline.json');

// Check 1: Outline exists and conforms to schema
if (!outline || !validate_schema(outline, 'outline.schema.json')) {
  return gate_failure('Outline missing or invalid schema');
}

// Check 2: Every section has required fields
for (const section of outline.sections) {
  if (!section.title) {
    return gate_failure(`Section missing title: ${section.section_id}`);
  }
  
  if (!section.purpose) {
    return gate_failure(`Section missing purpose: ${section.title}`);
  }
  
  if (section.estimated_words === undefined || section.estimated_words === null) {
    return gate_failure(`Section missing estimated_words: ${section.title}`);
  }
}

// Check 3: Section order justified
if (!outline.structure_justification) {
  return gate_failure('structure_justification missing');
}

// Check 4: No overlapping purposes
const purposes = outline.sections.map(s => s.purpose);
const duplicates = purposes.filter((p, i) => purposes.indexOf(p) !== i);
if (duplicates.length > 0) {
  return gate_failure(`Overlapping purpose statements: ${duplicates.join(', ')}`);
}

return gate_pass('Outline Gate');
```

**On failure:**
- Block section drafting
- Return specific failed sections
- Suggest: "Update outline.json or re-run /write-outline"

---

## Draft Gate Check

**Required before:** Review

**Validation:**
```javascript
const draft = await load_artifact('full_draft.md');
const outline = await load_artifact('outline.json');

// Check 1: Draft exists
if (!draft) {
  return gate_failure('Draft file missing');
}

// Check 2: All sections present
for (const section of outline.sections) {
  if (!draft.includes(section.title)) {
    return gate_failure(`Section missing from draft: ${section.title}`);
  }
}

// Check 3: No placeholder sections
if (draft.includes('[Section to be written]') || draft.includes('[BLOCKED:')) {
  return gate_failure('Draft contains placeholder sections');
}

// Check 4: Word count within range (warning only)
const word_count = count_words(draft);
const estimated_total = outline.sections.reduce((sum, s) => sum + (s.estimated_words || 0), 0);
if (word_count < estimated_total * 0.8 || word_count > estimated_total * 1.2) {
  warnings.push(`Word count ${word_count} outside ±20% of estimate ${estimated_total}`);
}

return gate_pass('Draft Gate', warnings);
```

**On failure:**
- Block review start
- Return missing sections
- Suggest: "Complete drafting or mark sections as blocked"

---

## QA Gate Check

**Required before:** Artifact generation

**Validation:**
```javascript
const quality_gate = await load_artifact('quality_gate.json');
const review_report = await load_artifact('review_report.json');

// Check 1: quality_gate exists and conforms to schema
if (!quality_gate || !validate_schema(quality_gate, 'quality_gate.schema.json')) {
  return gate_failure('quality_gate missing or invalid schema');
}

// Check 2: Required QA perspectives applied
const required_perspectives = ['reader', 'skeptic', 'coherence', 'ai-stink', 'final'];
const applied = review_report?.perspectives_applied || [];
for (const perspective of required_perspectives) {
  if (!applied.includes(perspective)) {
    return gate_failure(`Required QA perspective not applied: ${perspective}`);
  }
}

// Check 3: Gate decision must pass
if (quality_gate.decision !== 'PASS') {
  return gate_failure(`QA gate did not pass: ${quality_gate.decision}`);
}

// Check 4: No unmet criteria remain
if (quality_gate.unmet_criteria && quality_gate.unmet_criteria.length > 0) {
  return gate_failure(`${quality_gate.unmet_criteria.length} unmet QA gate criteria remain`);
}

return gate_pass('QA Gate');
``` 

**On failure:**
- Block artifact generation
- Return blocking findings
- Suggest: "Resolve critical findings or run /qa-final"

---

## Artifact Gate Check

**Required before:** Artifact finalization

**Validation:**
```javascript
const artifact = await artifact_server.inspect_artifact(artifact_id);

// Check 1: Artifact exists
if (!artifact) {
  return gate_failure('Artifact not found');
}

// Check 2: Validation status acceptable
if (artifact.validation_status === 'invalid') {
  return gate_failure('Artifact validation failed (status=invalid)');
}

// Check 3: No placeholders
const content = await read_file(artifact.path);
if (content.includes('[BLOCKED:') || content.includes('[TODO:')) {
  return gate_failure('Artifact contains unresolved placeholders');
}

// Check 4: File size > 0
if (artifact.size_bytes === 0) {
  return gate_failure('Artifact file is empty');
}

// Check 5: Dependencies available (if export operation)
if (target_format === 'docx' || target_format === 'pdf') {
  if (!check_dependency('pandoc')) {
    return gate_failure('Required dependency missing: pandoc');
  }
}

return gate_pass('Artifact Gate');
```

**On failure:**
- Block finalization
- Return validation errors
- Suggest: "Run /validate-artifact or resolve placeholders"

---

## Hook Response Format

**Success:**
```json
{
  "hook": "pre-phase-advance",
  "gate": "Brief Gate",
  "status": "pass",
  "warnings": [],
  "proceed": true
}
```

**Failure:**
```json
{
  "hook": "pre-phase-advance",
  "gate": "Brief Gate",
  "status": "fail",
  "failed_criteria": [
    "audience field too vague: 'general readers'",
    "success_criteria not testable: 'high quality writing'"
  ],
  "remediation": "Update brief.json with specific audience and testable success criteria",
  "proceed": false
}
```

---

## Integration

**Workflow integration:**
- Hook runs automatically before phase transition
- If gate fails, phase advance blocked
- Gate failure report returned to user
- Workflow can continue other work (partial completion)

**Cache-server integration:**
- Gate check results logged via save_step
- Gate failures logged as blockers (B9-validation-failure)
- Resume point created at gate boundary

---

## Examples

**Example 1: Brief Gate failure**
```
Workflow: write-outline
Phase transition: Brief → Outline
Gate: Brief Gate
Result: FAIL

Failed criteria:
  - audience field too vague: "general readers"
  - success_criteria not testable: "high quality writing"

Remediation: Update brief.json:
  - audience: Specify target reader (e.g., "software engineers with 2+ years experience")
  - success_criteria: Make testable (e.g., "all code examples compile")

Next action: Edit brief.json and re-run /write-outline
```

**Example 2: QA Gate failure**
```
Workflow: export-artifact
Phase transition: Review → Artifact
Gate: QA Gate
Result: FAIL

Failed criteria:
  - 3 unresolved critical findings

Blocking findings:
  1. [qa-reader] Assumed knowledge not in audience spec (line 45)
  2. [qa-domain] Technical claim unsupported (line 120)
  3. [qa-coherence] Section transition missing (between sections 3-4)

Remediation: Resolve critical findings or update draft

Next action: Fix findings and re-run /qa-final
```
