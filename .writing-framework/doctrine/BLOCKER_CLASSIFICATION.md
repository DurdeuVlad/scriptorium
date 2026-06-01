# BLOCKER CLASSIFICATION MODEL

**Status:** Canonical. Defines the B1-B9 blocker taxonomy and classification rules.
**Phase:** 5
**Related:** AUTONOMOUS_EXECUTION.md, PROGRESSIVE_UNBLOCKING.md

---

## Purpose

Standardize blocker classification across all agents and workflows. Every blocker must be classified using the B1-B9 taxonomy to enable consistent handling, severity assignment, and resume planning.

---

## B1-B9 Taxonomy

### B1: missing-user-decision

**Definition:** Ambiguous intent, contradictory instructions, or Type 3 decision needed where context does not support reasonable inference.

**Examples:**
- User request: "Write a technical guide for beginners" — unclear whether "beginners" means programming beginners or domain beginners
- Contradictory instructions: Brief says "formal tone" but style pack says "conversational tone" with equal priority
- Scope ambiguity: "Write about authentication" — unclear whether to cover OAuth, JWT, sessions, or all three

**Severity Assignment:**
- **Blocking:** When ambiguity affects fundamental document direction (audience, scope, tone)
- **Degraded:** When ambiguity is minor and reasonable default exists

**Resolution:**
- Ask user specific question with enumerable options
- State what will be assumed if no response received
- Continue all work not dependent on the decision

---

### B2: missing-repo-context

**Definition:** Missing project configuration, style pack, doctrine files, or other local context required to proceed.

**Examples:**
- No style pack found and domain unclear from task description
- No doctrine files in `.writing-framework/doctrine/`
- CLAUDE.md missing from project root
- `.writing-framework/` directory structure incomplete

**Severity Assignment:**
- **Blocking:** No style pack + unclear domain, no doctrine files (cannot establish baseline)
- **Degraded:** Missing optional doctrine files, missing templates (can use defaults)

**Resolution:**
- Ask user to run `/install-framework` to create missing structure
- Ask user to specify domain or style pack
- Provide instructions for creating missing files
- Continue with defaults where reasonable

---

### B3: missing-guide

**Definition:** Required guide record not found in guide-server or `.writing-framework/guides/`.

**Examples:**
- No canon guide for worldbuilding domain (required by doctrine)
- No rubric guide for document type
- No style-pack guide for specified domain
- No example guide when examples are required by workflow

**Severity Assignment:**
- **Blocking:** Missing guide required by doctrine (e.g., canon for worldbuilding)
- **Degraded:** Missing optional guide (e.g., examples, anti-patterns)

**Resolution:**
- Ask user to create guide using `/add-guide`
- Suggest guide-server query terms that might find related guides
- Continue with general rubrics if domain-specific rubric missing
- Flag assumption if proceeding without guide

---

### B4: missing-source-material

**Definition:** Research content, reference documents, external data, or source material explicitly required but unavailable.

**Examples:**
- Brief requires "5 academic papers on topic X" but none provided
- Outline section requires "API documentation" but link is broken
- Canon guide references "Character backstory document" but file not found
- Section requires "user interview data" but no data available

**Severity Assignment:**
- **Blocking:** Source material explicitly required and no substitute available
- **Degraded:** Source material helpful but can approximate or use placeholder

**Resolution:**
- Ask user to provide specific source material
- List exact files/links/data needed
- Continue with placeholder if degraded severity
- Flag sections that depend on missing material

---

### B5: failed-toolchain

**Definition:** MCP server unavailable, tool failure, infrastructure issue preventing normal operation.

**Examples:**
- guide-server unavailable (cannot query guides)
- cache-server unavailable (cannot persist run state)
- File system permissions error (cannot write artifacts)
- Network failure (cannot fetch external resources)

**Severity Assignment:**
- **Blocking:** Rarely — only if failure prevents any progress
- **Degraded:** Usually — use filesystem fallback, continue with reduced tracking

**Resolution:**
- Use filesystem fallback for cache-server (write to `artifacts/`, `logs/`)
- Use direct file access for guide-server (read `.writing-framework/guides/`)
- Log warning about degraded operation
- Continue execution with available tools

---

### B6: artifact-export-failure

**Definition:** Cannot generate final artifact in requested format (docx, PDF, LaTeX).

**Examples:**
- docx generation fails (missing pandoc)
- PDF export fails (LaTeX compile error)
- LaTeX template missing required package
- Format conversion tool unavailable

**Severity Assignment:**
- **Blocking:** Only if export is the sole deliverable
- **Degraded:** Usually — drafting can continue, only final export blocked

**Resolution:**
- Continue drafting in markdown
- Produce all intermediate artifacts
- Document export failure in blocker report
- Suggest alternative export formats

---

### B7: schema-conflict

**Definition:** Output doesn't validate against schema, incompatible schema versions, or schema migration required.

**Examples:**
- brief.json missing required field from updated schema
- outline.json uses deprecated field structure
- discovery_report.json doesn't validate against schema
- Schema version mismatch between components

**Severity Assignment:**
- **Blocking:** When schema conflict prevents downstream processing
- **Degraded:** When schema can be migrated or validated with warnings

**Resolution:**
- Attempt schema migration if migration rules available
- Document which fields are invalid
- Produce best-effort output with validation warnings
- Flag for manual schema correction

---

### B8: canon-conflict

**Definition:** Draft content contradicts established canon, lore inconsistency detected, or factual error against canon guide.

**Examples:**
- Draft says "Character X is a wizard" but canon guide says "Character X is a warrior"
- Draft describes location differently than canon guide
- Draft contradicts prior document in same project
- Draft violates established world rules

**Severity Assignment:**
- **Blocking:** When conflict cannot be resolved without user decision
- **Degraded:** When conflict is minor and reasonable interpretation exists

**Resolution:**
- Surface both conflicting statements with file citations
- Ask user which is correct
- Continue all sections not affected by conflict
- Flag conflicting content for review

---

### B9: validation-failure

**Definition:** Quality gate failed, output incomplete, required fields missing, or validation check failed.

**Examples:**
- discovery_report.json missing required sections
- Section draft missing required subsections from outline
- Quality gate failed: readability score below threshold
- Output header missing required metadata

**Severity Assignment:**
- **Blocking:** When validation failure affects document integrity
- **Degraded:** When validation failure is non-critical (e.g., style warnings)

**Resolution:**
- Document which validation checks failed
- Produce partial output with completed sections
- Flag for manual review and correction
- Continue to next phase if failure is non-critical

---

## Classification Decision Tree

```
START: Blocker detected
  │
  ├─> User decision needed? ────────────────> B1: missing-user-decision
  │
  ├─> Project config missing? ──────────────> B2: missing-repo-context
  │
  ├─> Guide record missing? ────────────────> B3: missing-guide
  │
  ├─> Source material missing? ─────────────> B4: missing-source-material
  │
  ├─> Tool/infrastructure failure? ─────────> B5: failed-toolchain
  │
  ├─> Export/format failure? ───────────────> B6: artifact-export-failure
  │
  ├─> Schema validation failure? ───────────> B7: schema-conflict
  │
  ├─> Canon/lore conflict? ─────────────────> B8: canon-conflict
  │
  └─> Quality gate failure? ────────────────> B9: validation-failure
```

---

## Severity Assignment Rules

### Blocking Severity
Assign `severity: 'blocking'` when:
- Blocker prevents any reasonable progress on affected scope
- No substitute or workaround available
- Proceeding would produce fundamentally wrong output
- User decision required (B1, B8)
- Critical infrastructure missing (B2: no doctrine, no style pack)

**Effect:** Run status automatically set to 'paused' by cache-server

### Degraded Severity
Assign `severity: 'degraded'` when:
- Blocker reduces quality but progress is possible
- Reasonable substitute or workaround available
- Can proceed with flagged assumptions
- Filesystem fallback available (B5)
- Optional guide missing (B3)

**Effect:** Run continues with degraded quality noted

---

## Multi-Blocker Scenarios

### Overlapping Blockers
When multiple blockers affect overlapping scope:
1. Classify each blocker independently
2. Determine combined impacted_scope
3. If combined scope >50% of total: escalate to lead-orchestrator
4. Continue all non-overlapping unblocked work

### Cascading Blockers
When one blocker causes downstream blockers:
1. Report root cause blocker only
2. Note cascading effects in description
3. Resume plan addresses root cause
4. Downstream blockers resolve automatically when root resolved

### Contradictory Blockers
When blockers conflict (e.g., B1 says "ask user" but B5 says "user unavailable"):
1. Prioritize higher-severity blocker
2. Document both in blocker report
3. Escalate to lead-orchestrator if unresolvable
4. Continue maximum possible work

---

## Blocker Lifecycle

```
1. DETECTED    → Agent encounters blocker during execution
2. CLASSIFIED  → blockage-handler assigns B-type code and severity
3. SCOPED      → Impact analysis determines affected/unaffected work
4. PERSISTED   → save_blocker writes to cache-server
5. REPORTED    → blocker_report.json returned to orchestrator
6. RESOLVED    → User provides input or issue fixed
7. RESUMED     → Execution continues from resume point
8. CLOSED      → Blocker marked resolved in cache-server
```

---

## Classification Examples

### Example 1: Ambiguous Audience
**Scenario:** User says "Write a guide to Docker" without specifying audience.

**Classification:** B1 (missing-user-decision)
**Severity:** Degraded (can infer "intermediate developers" and flag)
**Resolution:** Infer intermediate audience, flag assumption, continue
**Impacted:** None (proceeding with assumption)
**Unimpacted:** All sections

### Example 2: No Style Pack
**Scenario:** No style pack found, domain unclear from task description.

**Classification:** B2 (missing-repo-context)
**Severity:** Blocking (cannot establish tone/structure baseline)
**Resolution:** Ask user for domain or style pack
**Impacted:** All downstream work (brief, outline, draft)
**Unimpacted:** Discovery can complete, research can proceed

### Example 3: Missing Canon Guide
**Scenario:** Worldbuilding task, no canon guide found, doctrine requires canon.

**Classification:** B3 (missing-guide)
**Severity:** Blocking (required by doctrine)
**Resolution:** Ask user to create canon guide with `/add-guide`
**Impacted:** All sections referencing world lore
**Unimpacted:** Sections about game mechanics (if independent)

### Example 4: Cache-Server Down
**Scenario:** cache-server unavailable during discovery.

**Classification:** B5 (failed-toolchain)
**Severity:** Degraded (filesystem fallback available)
**Resolution:** Write to `artifacts/` and `logs/`, continue
**Impacted:** Run tracking (degraded)
**Unimpacted:** All execution (continues normally)

---

## Integration with Cache-Server

**Blocker Persistence:**
```javascript
// blockage-handler calls save_blocker
cache.save_blocker({
  run_id: currentRunId,
  step_id: currentStepId,
  blocker_type: 'B2-missing-repo-context',
  description: 'No style pack found for domain "technical writing"',
  resolution_required: 'User must specify style pack or domain',
  severity: 'blocking'  // Auto-pauses run
});
```

**Blocker Query:**
```javascript
// Check for unresolved blockers before resume
const context = cache.fetch_run_context({ run_id, include_blockers: true });
const unresolvedBlockers = context.blockers.filter(b => !b.resolved);
if (unresolvedBlockers.length > 0) {
  // Cannot resume until blockers resolved
}
```

---

## Cross-References

- `doctrine/AUTONOMOUS_EXECUTION.md` — Type 1/2/3 decision classification
- `doctrine/PROGRESSIVE_UNBLOCKING.md` — Partial completion protocol
- `schemas/blocker_report.schema.json` — Blocker report format
- `workflows/blockage.md` — Blockage handling workflow
- `agents/blockage-handler.md` — Blockage handler agent spec
- `mcp/cache-server/BLOCKER_MODEL.md` — Cache-server blocker persistence
