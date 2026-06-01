# Blocker Model

## Overview

Blockers represent execution halts or degradations that require intervention. The blocker model enables the system to:
- Persist why execution stopped
- Classify the type of intervention needed
- Track resolution state
- Support partial progress and resume

## Blocker Record Fields

```typescript
interface BlockerRecord {
  blocker_id: string;           // UUID
  run_id: string;               // Run where blocker occurred
  step_id: string;              // Step where blocker occurred
  blocker_type: string;         // Classification of blocker
  description: string;          // What is blocking, specifically
  resolution_required: string;  // What must happen to unblock
  severity: BlockerSeverity;    // blocking | degraded
  resolved: boolean;            // Resolution status
  resolution_note: string | null; // How it was resolved
  created_at: string;           // ISO 8601 timestamp
  resolved_at: string | null;   // ISO 8601 timestamp
}
```

## Blocker Types

| Type | Description | Example |
|------|-------------|---------|
| `missing-input` | Required input not provided | User didn't specify target audience |
| `canon-conflict` | Output conflicts with established canon | Character name mismatch with canon |
| `qa-fail` | Quality gate failed | Clarity score below threshold |
| `ambiguous-instruction` | User instruction unclear or contradictory | "Make it shorter but add more detail" |
| `external-dependency` | External resource unavailable | API timeout, file not found |

## Severity Levels

### `blocking`

**Effect:** Halts run execution. Run status changes to `paused`.

**When to use:**
- Cannot proceed without resolution
- Output would be incorrect or incomplete without intervention
- Quality gate hard failure

**Example:**
```json
{
  "blocker_type": "canon-conflict",
  "description": "Section draft uses character name 'Elara' but canon establishes 'Elora'",
  "resolution_required": "User must clarify canonical name or approve override",
  "severity": "blocking"
}
```

### `degraded`

**Effect:** Run continues but quality or scope is reduced.

**When to use:**
- Can proceed with reduced quality
- Non-critical optional feature unavailable
- Soft quality gate failure (warning, not error)

**Example:**
```json
{
  "blocker_type": "external-dependency",
  "description": "Style pack 'technical-formal' not found, using default",
  "resolution_required": "Install technical-formal style pack for optimal output",
  "severity": "degraded"
}
```

## Blocker Lifecycle

```
[save_blocker] → unresolved → [severity=blocking?] → run paused
                             ↓
                          [severity=degraded?] → run continues
                             ↓
                          [resolve blocker] → resolved
```

### Resolution Flow

1. **Blocker created**: Agent calls `save_blocker` when encountering an issue
2. **Run state updated**: If severity is `blocking`, run status → `paused`
3. **Human intervention**: User reviews blocker, provides resolution
4. **Blocker marked resolved**: Update blocker record with `resolved=true` and `resolution_note`
5. **Run resumed**: Call `fetch_run_context` or `fetch_resume_point` to continue

## Blocker Resolution Patterns

### Pattern 1: User Provides Missing Input

**Blocker:**
```json
{
  "blocker_type": "missing-input",
  "description": "Target audience not specified",
  "resolution_required": "User must specify: general public, domain experts, or practitioners"
}
```

**Resolution:**
User provides input → Update run input_params → Resume from blocked step

### Pattern 2: User Resolves Canon Conflict

**Blocker:**
```json
{
  "blocker_type": "canon-conflict",
  "description": "Draft states 'magic is rare' but canon establishes 'magic is common'",
  "resolution_required": "User must approve canon override or request redraft"
}
```

**Resolution:**
User chooses: (a) redraft with canon compliance, or (b) override canon with justification

### Pattern 3: QA Fail Requires Revision

**Blocker:**
```json
{
  "blocker_type": "qa-fail",
  "description": "Clarity review failed: 12 ambiguous pronoun references, threshold is 5",
  "resolution_required": "Revision pass to resolve pronoun ambiguities"
}
```

**Resolution:**
Invoke clarity-editor agent → Produce revised draft → Re-run QA

### Pattern 4: Ambiguous Instruction Clarification

**Blocker:**
```json
{
  "blocker_type": "ambiguous-instruction",
  "description": "User requested 'more detail' and 'shorter length' simultaneously",
  "resolution_required": "User must clarify priority: detail or brevity"
}
```

**Resolution:**
User clarifies → Update run parameters → Resume

## Blocker Queries

### Find all unresolved blockers for a run
```sql
SELECT * FROM blockers 
WHERE run_id = ? AND resolved = 0 
ORDER BY created_at ASC
```

### Find all blocking-severity blockers across all runs
```sql
SELECT b.*, r.workflow, r.project 
FROM blockers b
JOIN runs r ON b.run_id = r.run_id
WHERE b.severity = 'blocking' AND b.resolved = 0
ORDER BY b.created_at ASC
```

### Get blocker resolution statistics
```sql
SELECT 
  blocker_type,
  COUNT(*) as total,
  SUM(CASE WHEN resolved = 1 THEN 1 ELSE 0 END) as resolved_count,
  AVG(JULIANDAY(resolved_at) - JULIANDAY(created_at)) * 24 as avg_resolution_hours
FROM blockers
WHERE resolved = 1
GROUP BY blocker_type
```

## Blocker Reports

Agents should generate structured blocker reports that include:

```typescript
interface BlockerReport {
  blocker_id: string;
  run_id: string;
  step_id: string;
  blocker_type: string;
  description: string;
  resolution_required: string;
  severity: 'blocking' | 'degraded';
  
  // Additional context
  impacted_scope: string[];      // Which steps/artifacts are blocked
  suggested_actions: string[];   // Possible resolution paths
  related_artifacts: string[];   // Artifact IDs relevant to blocker
  escalation_level: number;      // 1-4 per ESCALATION_RULES.md
}
```

## Integration with Escalation System

Blockers trigger escalation per `.writing-framework/doctrine/ESCALATION_RULES.md`:

| Blocker Type | Default Escalation Level |
|--------------|-------------------------|
| `missing-input` | L2 (blockage-handler) |
| `canon-conflict` | L3 (lead-orchestrator) |
| `qa-fail` | L2 (blockage-handler) |
| `ambiguous-instruction` | L3 (lead-orchestrator) |
| `external-dependency` | L1 (self-resolve with fallback) |

## Related

- `RUN_MODEL.md` — run lifecycle and state management
- `RESUME_PROTOCOL.md` — resuming from blockers
- `.writing-framework/doctrine/ESCALATION_RULES.md` — escalation chain
- `.writing-framework/agents/blockage-handler.md` — blocker resolution agent
