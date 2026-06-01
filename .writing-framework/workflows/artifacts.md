# Artifacts Workflow

**Status:** Phase 7 — Executable
**Owner:** artifact-orchestrator
**Trigger:** /orchestrate-artifact, /write-markdown, /write-docx, /write-pdf, /write-latex, or any export command
**Output:** Artifact file at validated output path + artifact_manifest.json (schemas/artifact_manifest.schema.json)
**MCP Integration:** Uses artifact-server for all artifact operations
**Key Principle:** Deterministic output paths, validate after generation, no magical hidden behavior

## Purpose
Define the artifact generation and management workflow for all document output formats. Handles creation, update, conversion, validation, and export of artifacts across supported formats (markdown, docx, pdf, latex). All artifact operations produce a manifest entry for traceability.

## Inputs
| Input | Type | Required | Source |
|-------|------|----------|--------|
| source_content | Markdown file (primary); other formats via conversion | Yes | Drafting or review workflow |
| target_format | string (markdown / docx / pdf / latex) | Yes | User or orchestrator |
| output_path | string (file path) | Yes | User or orchestrator |
| artifact_manifest | object | No | schemas/artifact_manifest.schema.json — existing manifest to update |
| validation_requirements | object | No | Orchestrator or style pack |

## Execution Steps

### Step 1: Initialize Artifact Generation (artifact-orchestrator)
- Receive source content and target format from calling workflow
- Validate source content is present and non-empty
- Validate target format is supported (markdown, docx, pdf, latex)
- Determine output path (user-specified or auto-generated)
- Call `save_step`: step_name='artifact-init', agent='artifact-orchestrator', status='completed'

### Step 2: Pre-Generation Validation (artifact-orchestrator)
- Check source content for unresolved placeholders (e.g., [BLOCKED: B4-missing-source])
- **If placeholders found:** B9 blocker (validation-failure), do not generate artifact
- Check output path is writable
- **If path not writable:** B6 blocker (artifact-export-failure), request writable path
- Verify format-specific dependencies available (pandoc for docx/pdf, latex for pdf from tex)
- **If dependencies missing:** B5 blocker (failed-toolchain) with degraded severity, offer markdown fallback
- Call `save_step`: step_name='pre-validation', agent='artifact-orchestrator', status='completed'

### Step 3: Generate Artifact (artifact-server)
- **For markdown:** Call `create_markdown(path, content, metadata, run_id, step_id)`
- **For docx from markdown:** Call `export_markdown_to_docx(artifact_id, output_path, reference_doc)`
- **For pdf from markdown:** Call `export_markdown_to_pdf(artifact_id, output_path, template, variables)`
- **For latex:** Call `create_latex(path, content, document_class, run_id, step_id)`
- **For pdf from latex:** Call `compile_latex_to_pdf(artifact_id, engine, passes)`
- artifact-server writes file to filesystem and records metadata in SQLite
- artifact-server returns artifact_id, path, size_bytes
- Call `save_step`: step_name='artifact-generation', agent='artifact-server', status='completed', output_summary includes artifact_id

### Step 4: Post-Generation Validation (artifact-server)
- Call `validate_artifact(artifact_id, checks)` to run format-specific validation
- **For markdown:** Check YAML frontmatter, heading hierarchy, empty sections, broken links
- **For docx/pdf:** Check file integrity, file size > 0
- **For latex:** Check file exists (compilation validation happens in compile step)
- artifact-server updates validation_status in database (valid/invalid/not-validated)
- artifact-server stores validation findings in validation_results table
- Call `save_step`: step_name='post-validation', agent='artifact-server', status='completed'

### Step 5: Create Artifact Manifest (artifact-orchestrator)
- Query artifact-server: `inspect_artifact(artifact_id)` to get full metadata
- Construct artifact_manifest.json per schemas/artifact_manifest.schema.json
- Include: artifact_id, artifact_type, output_path, generation_method, validation_status, file_size_bytes, word_count, dependencies_used, run_id, created_at
- Call `save_artifact`: artifact_type='structured-data', content=artifact_manifest.json
- Call `save_step`: step_name='manifest-creation', agent='artifact-orchestrator', status='completed'

### Step 6: Handle Validation Failures (artifact-orchestrator)
- **If validation_status = 'invalid':**
  - Classify as B6 blocker (artifact-export-failure)
  - **If target was docx or pdf:** Attempt fallback to markdown format
  - Call `create_markdown` with same content
  - Document failure in manifest with validation_errors array
  - Call `save_blocker`: blocker_type='B6-artifact-export-failure', severity='degraded'
- **If validation_status = 'valid':**
  - Proceed to Step 7
- Call `save_step`: step_name='failure-handling', agent='artifact-orchestrator', status='completed'

### Step 7: Normalize Artifact (artifact-server, optional)
- **If normalization requested:** Call `normalize_artifact(artifact_id, rules)`
- artifact-server applies formatting normalization (trailing whitespace, line endings, section spacing)
- artifact-server increments version number, creates version record
- artifact-server returns changes_made array
- **If no normalization requested:** Skip to Step 8
- Call `save_step`: step_name='normalization', agent='artifact-server', status='completed'

### Step 8: Return Artifact Manifest (artifact-orchestrator)
- Return artifact_manifest.json to calling workflow
- Include: artifact_id, path, validation_status, export_status
- **If export succeeded:** export_status='exported'
- **If export failed with fallback:** export_status='failed', include fallback artifact info
- Call `save_step`: step_name='artifact-return', agent='artifact-orchestrator', status='completed'

## Supported Operations
| Operation | Command | Description |
|-----------|---------|-------------|
| create_markdown | /write-markdown | Create new markdown file from content string |
| update_markdown | /edit-markdown | Update existing markdown file |
| create_docx | /write-docx | Create new Word document from markdown source |
| update_docx | /edit-docx | Update existing Word document |
| create_latex | /write-latex | Create new LaTeX source file |
| update_latex | /edit-latex | Update existing LaTeX source file |
| compile_latex_to_pdf | /write-pdf | Compile LaTeX source to PDF |
| export_markdown_to_docx | /export-docx | Convert markdown to Word document |
| export_markdown_to_pdf | /export-pdf | Convert markdown to PDF via intermediate format |
| inspect_artifact | /artifact-validate | Read and report on artifact metadata and format |
| validate_artifact | /artifact-validate | Confirm artifact integrity and format compliance |
| normalize_artifact | /normalize-artifact | Apply formatting normalization to existing artifact |

## Decision Points and Autonomy Rules

### Type 1 Decisions (Infer and Proceed)
- **Target format is markdown:** Create directly, no conversion needed
- **Output path writable:** Proceed with generation
- **No placeholders in source:** Proceed with generation
- **Validation passes:** Return artifact manifest with status='valid'

### Type 2 Decisions (Infer and Flag)
- **Output path not specified:** Auto-generate path from run_id and format, flag path
- **Dependencies available but optional template not provided:** Use default template, flag
- **Validation warnings (not failures):** Proceed with artifact, flag warnings in manifest
- **Normalization changes made:** Apply changes, flag what was normalized

### Type 3 Decisions (Must Ask)
- **Target format unsupported:** B6 blocker, suggest markdown fallback, ask user
- **Source contains unresolved placeholders:** B9 blocker, cannot generate, ask user to resolve
- **Output path not writable:** B6 blocker, request writable path from user
- **Validation fails:** B6 blocker, attempt fallback, escalate if fallback also fails
- **artifact-server MCP unavailable:** B5 blocker, cannot proceed without artifact-server

### Blocker Scenarios
- **B5 (failed-toolchain):** artifact-server MCP unavailable, pandoc missing, latex missing
- **B6 (artifact-export-failure):** Validation failed, file not created, export operation failed
- **B9 (validation-failure):** Source content invalid (placeholders, malformed), cannot generate artifact

## Outputs
| Output | Type | Schema | Destination |
|--------|------|--------|-------------|
| artifact_file | File (format varies) | — | output_path specified by user or orchestrator |
| artifact_manifest.json | JSON object | schemas/artifact_manifest.schema.json | Cache-server, artifact registry |

## Quality Gate (Artifact Gate)

**Pass Criteria:**
- ✅ File exists at specified output_path
- ✅ File size > 0 bytes
- ✅ Format is correct (extension matches artifact_type)
- ✅ File opens or parses without error (format-specific validation passes)
- ✅ Manifest entry populated with all required fields (artifact_id, artifact_type, output_path, generation_method, validation_status, created_at)
- ✅ No unresolved placeholders in output
- ✅ validation_status = 'valid' or 'not-validated' (not 'invalid')
- ✅ If export failed, failure documented in manifest and fallback artifact exists

**Fail Criteria:**
- ❌ File does not exist at output_path
- ❌ File size = 0 bytes (empty file)
- ❌ Format validation failed (validation_status = 'invalid')
- ❌ Unresolved placeholders in output
- ❌ Manifest missing required fields
- ❌ Export failed with no fallback artifact

**Gate Decisions:**
- **ACCEPT:** File valid, manifest complete, no blockers → artifact ready for delivery
- **ACCEPT (degraded):** Export failed but fallback artifact created → proceed with fallback
- **BLOCK:** Validation failed, no fallback possible → B6 blocker, cannot proceed

**On BLOCK:**
- Call `save_blocker` with classification (B5/B6/B9)
- Document specific failure in manifest validation_errors array
- If fallback attempted, document fallback artifact_id
- Run status set to 'paused' if severity='blocking'

## Related Commands
- /write-markdown
- /write-docx
- /write-pdf
- /write-latex
- /edit-docx
- /edit-latex
- /export-docx
- /export-pdf
- /normalize-artifact
- /artifact-validate
- /orchestrate-artifact

## Related Agents
- artifact-orchestrator (owner)
- artifact-server (MCP tool — Phase 5 implementation)

## Artifact-Server Integration

**Tools Used:**
- `create_markdown` — Create new markdown file
- `update_markdown` — Update existing markdown file
- `create_latex` — Create new LaTeX source file
- `export_markdown_to_docx` — Convert markdown to DOCX via pandoc
- `export_markdown_to_pdf` — Convert markdown to PDF via pandoc
- `compile_latex_to_pdf` — Compile LaTeX to PDF
- `inspect_artifact` — Get artifact metadata
- `validate_artifact` — Run format-specific validation
- `normalize_artifact` — Apply formatting normalization
- `list_artifacts` — List artifacts by format or run_id

**Dependencies:**
- artifact-server MCP (required)
- pandoc (required for docx/pdf export from markdown)
- LaTeX toolchain (required for pdf from latex: pdflatex, xelatex, or lualatex)

**Fallback (if dependencies unavailable):**
- If pandoc missing: B5 blocker (degraded), offer markdown fallback
- If latex missing: B5 blocker (degraded), offer markdown or pandoc PDF fallback
- If artifact-server unavailable: B5 blocker (blocking), cannot proceed

## Cross-References
- `schemas/artifact_manifest.schema.json` — output format
- `mcp/artifact-server/README.md` — artifact-server MCP documentation
- `mcp/artifact-server/schema.sql` — artifact database schema
- `doctrine/AUTONOMOUS_EXECUTION.md` — Type 1/2/3 decision rules
- `doctrine/BLOCKER_CLASSIFICATION.md` — B5/B6/B9 blocker definitions
- `workflows/review.md` — provides reviewed draft as source content input
- `agents/artifact-orchestrator.md` — artifact-orchestrator specification
