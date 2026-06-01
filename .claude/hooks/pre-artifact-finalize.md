# Pre-Artifact-Finalize Hook

**Hook Type:** Validation Check
**Trigger:** Before finalizing artifact (export, publish, or mark as complete)
**Purpose:** Prevent finalization of invalid or incomplete artifacts

---

## Hook Execution

**When triggered:**
- User invokes `/finalize-artifact` command
- Artifact export operation completes
- Artifact marked as final/published

**Hook runs:**
1. Check artifact validation status
2. Check source content complete (no placeholders)
3. Check file integrity
4. Check dependencies available (if export operation)
5. If all checks pass → allow finalization
6. If any check fails → block finalization, return validation report

---

## Check 1: Artifact Validation Status

**Validation:**
```javascript
const artifact = await artifact_server.inspect_artifact(artifact_id);

if (!artifact) {
  return {
    status: 'blocked',
    error: 'Artifact not found',
    remediation: 'Verify artifact_id is correct'
  };
}

if (artifact.validation_status === 'invalid') {
  const validation_results = await artifact_server.get_validation_results(artifact_id);
  
  return {
    status: 'blocked',
    error: 'Artifact validation failed',
    validation_errors: validation_results.filter(r => r.status === 'fail'),
    remediation: 'Fix validation errors and re-run /validate-artifact'
  };
}

// validation_status = 'valid' or 'not-validated' → allow finalization
// 'not-validated' allowed because validation is optional for some formats
```

**On failure:**
- Block finalization
- Return validation errors with locations
- Suggest fixes for each error

---

## Check 2: Source Content Complete

**Validation:**
```javascript
const content = await read_file(artifact.path);

// Check for unresolved placeholders
const placeholders = [
  /\[BLOCKED:\s*B\d-[^\]]+\]/g,
  /\[TODO:\s*[^\]]+\]/g,
  /\[TBD\]/g,
  /\[PLACEHOLDER\]/g
];

const found_placeholders = [];
for (const pattern of placeholders) {
  const matches = content.match(pattern);
  if (matches) {
    found_placeholders.push(...matches);
  }
}

if (found_placeholders.length > 0) {
  return {
    status: 'blocked',
    error: `${found_placeholders.length} unresolved placeholders in artifact`,
    placeholders: found_placeholders,
    remediation: 'Resolve placeholders or remove blocked sections'
  };
}
```

**On failure:**
- Block finalization
- Return list of placeholders
- Suggest resolving blockers or removing sections

---

## Check 3: File Integrity

**Validation:**
```javascript
const stats = await fs.stat(artifact.path);

if (stats.size === 0) {
  return {
    status: 'blocked',
    error: 'Artifact file is empty (0 bytes)',
    remediation: 'Regenerate artifact or check file path'
  };
}

// For structured formats, verify file opens without error
if (artifact.format === 'json') {
  try {
    JSON.parse(content);
  } catch (e) {
    return {
      status: 'blocked',
      error: 'Invalid JSON format',
      parse_error: e.message,
      remediation: 'Fix JSON syntax errors'
    };
  }
}

if (artifact.format === 'markdown') {
  // Check YAML frontmatter if present
  if (content.startsWith('---')) {
    const frontmatter_end = content.indexOf('---', 3);
    if (frontmatter_end === -1) {
      return {
        status: 'blocked',
        error: 'YAML frontmatter not properly closed',
        remediation: 'Add closing --- to frontmatter'
      };
    }
  }
}
```

**On failure:**
- Block finalization
- Return parse/integrity errors
- Suggest fixes

---

## Check 4: Dependencies Available

**Validation (for export operations):**
```javascript
if (operation_type === 'export') {
  const required_deps = {
    'docx': ['pandoc'],
    'pdf': ['pandoc'],
    'latex-pdf': ['pdflatex', 'xelatex', 'lualatex']
  };
  
  const deps = required_deps[target_format] || [];
  const missing = [];
  
  for (const dep of deps) {
    if (!check_dependency(dep)) {
      missing.push(dep);
    }
  }
  
  if (missing.length > 0) {
    return {
      status: 'blocked',
      error: `Required dependencies missing: ${missing.join(', ')}`,
      remediation: `Install missing dependencies or export to different format`,
      fallback: 'Export to markdown (no dependencies required)'
    };
  }
}
```

**On failure:**
- Block export operation
- Return missing dependencies
- Suggest installation or fallback format

---

## Check 5: Export Operation Status

**Validation (if artifact was created via export):**
```javascript
if (artifact.generation_method === 'export') {
  const export_op = await artifact_server.get_export_operation(artifact_id);
  
  if (export_op.status === 'failed') {
    return {
      status: 'blocked',
      error: 'Export operation failed',
      export_error: export_op.error_message,
      remediation: 'Fix export errors and retry export'
    };
  }
  
  if (export_op.status === 'pending') {
    return {
      status: 'blocked',
      error: 'Export operation still in progress',
      remediation: 'Wait for export to complete'
    };
  }
}
```

**On failure:**
- Block finalization
- Return export error details
- Suggest retry or fix

---

## Hook Response Format

**Success:**
```json
{
  "hook": "pre-artifact-finalize",
  "artifact_id": "art_123",
  "status": "pass",
  "checks_passed": [
    "validation_status: valid",
    "no_placeholders: true",
    "file_integrity: pass",
    "dependencies_available: true"
  ],
  "proceed": true
}
```

**Failure:**
```json
{
  "hook": "pre-artifact-finalize",
  "artifact_id": "art_123",
  "status": "blocked",
  "error": "3 unresolved placeholders in artifact",
  "placeholders": [
    "[BLOCKED: B4-missing-source] at line 45",
    "[TODO: Add example] at line 120",
    "[TBD] at line 200"
  ],
  "remediation": "Resolve placeholders or remove blocked sections",
  "proceed": false
}
```

---

## Integration

**Artifact workflow integration:**
- Hook runs before Step 8 (Return Artifact Manifest)
- If hook fails, artifact not marked as final
- Artifact remains in draft state
- User can fix issues and retry finalization

**Cache-server integration:**
- Hook execution logged via save_step
- Failures logged as blockers (B6-artifact-export-failure or B9-validation-failure)
- Artifact manifest includes finalization_status field

---

## Examples

**Example 1: Validation failed**
```
Operation: /finalize-artifact art_123
Hook: pre-artifact-finalize
Check: Artifact validation status
Result: BLOCKED

Error:
Artifact validation failed (status=invalid)

Validation errors:
  1. YAML frontmatter not properly closed (line 1)
  2. Heading hierarchy skipped level: H1 → H3 (line 45)
  3. Empty section: "Conclusion" (line 120)

Remediation:
  1. Add closing --- to YAML frontmatter
  2. Insert H2 heading before H3 at line 45
  3. Add content to Conclusion or remove section

Next action: Fix validation errors and re-run /validate-artifact
```

**Example 2: Unresolved placeholders**
```
Operation: /finalize-artifact art_456
Hook: pre-artifact-finalize
Check: Source content complete
Result: BLOCKED

Error:
3 unresolved placeholders in artifact

Placeholders:
  1. [BLOCKED: B4-missing-source] at line 45
     Context: "According to [BLOCKED: B4-missing-source], the approach..."
  
  2. [TODO: Add example] at line 120
     Context: "For example, [TODO: Add example]"
  
  3. [TBD] at line 200
     Context: "The timeline is [TBD]"

Remediation:
  - Resolve B4 blocker (obtain missing source material)
  - Add example at line 120
  - Specify timeline at line 200

Next action: Resolve placeholders and retry finalization
```

**Example 3: Missing dependencies**
```
Operation: /finalize-artifact art_789 --export docx
Hook: pre-artifact-finalize
Check: Dependencies available
Result: BLOCKED

Error:
Required dependency missing: pandoc

Remediation:
  1. Install pandoc: https://pandoc.org/installing.html
  2. Verify installation: pandoc --version
  3. Retry export operation

Fallback: Export to markdown (no dependencies required)

Next action: Install pandoc or export to markdown
```

**Example 4: All checks pass**
```
Operation: /finalize-artifact art_999
Hook: pre-artifact-finalize
Checks: All passed
Result: PROCEED

Artifact finalized:
  - artifact_id: art_999
  - path: artifacts/run_123/exports/final-draft.md
  - validation_status: valid
  - file_size: 15,432 bytes
  - finalized_at: 2026-03-29T00:00:00Z

Next action: Artifact ready for distribution
```
