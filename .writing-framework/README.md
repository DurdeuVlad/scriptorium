# .writing-framework/ — Framework Core

**Purpose:** Contains all canonical framework definitions. This is the tool-agnostic source of truth for the Editorial Orchestrator framework.

---

## What Belongs Here

**ONLY canonical framework definitions:**
- Agent specifications
- Command specifications
- Doctrine files (framework principles and rules)
- Workflow specifications
- JSON schemas
- Editorial guides (style packs, rubrics, canon, anti-patterns)
- Document templates
- Hook specifications (canonical definitions, not implementations)
- Usage examples

**NEVER place here:**
- Tool-specific implementations (those go in `.claude/`, `.copilot/`, etc.)
- Generated artifacts (those go in `artifacts/`)
- MCP server code (those go in `mcp/`)
- Documentation (those go in `docs/`)
- Test cases (those go in `evals/`)

---

## Directory Structure

```
.writing-framework/
├── agents/                  # Agent specifications
├── commands/                # Command specifications
├── doctrine/                # Framework principles and rules
├── examples/                # Usage examples
├── guides/                  # Editorial guides
│   ├── style-packs/         # Style guides
│   ├── rubrics/             # Evaluation rubrics
│   ├── canon/               # Canon reference material
│   └── anti-patterns/       # Anti-pattern guides
├── hooks/                   # Hook specifications (canonical)
├── schemas/                 # JSON schemas
├── templates/               # Document templates
└── workflows/               # Workflow specifications
```

---

## File Placement Rules

### agents/
**Purpose:** Canonical agent specifications (tool-agnostic)

**Naming:** `{agent-name}.md`

**Examples:**
- `brief-writer.md`
- `outline-architect.md`
- `adversarial-reviewer.md`

---

### commands/
**Purpose:** Canonical command specifications (tool-agnostic)

**Naming:** `{command-name}.md`

**Examples:**
- `write-brief.md`
- `write-outline.md`
- `qa-reader.md`

---

### doctrine/
**Purpose:** Framework principles, rules, and policies

**Naming:** `{DOCTRINE_NAME}.md` (SCREAMING_SNAKE_CASE)

**Examples:**
- `EDITORIAL_DOCTRINE.md`
- `QUALITY_GATES.md`
- `BLOCKER_CLASSIFICATION.md`

**Current files (14):**
- AUTONOMOUS_EXECUTION.md
- AUTONOMY_INTEGRATION.md
- BLOCKER_CLASSIFICATION.md
- DECOMPOSITION_RULES.md
- EDITORIAL_DOCTRINE.md
- ESCALATION_RULES.md
- EVALUATION_RUBRICS.md
- HUMAN_IN_THE_LOOP_GATES.md
- OPERATIONAL_GUARDRAILS.md
- PARTIAL_COMPLETION.md
- PROGRESSIVE_UNBLOCKING.md
- QUALITY_GATES.md
- TEMPLATE_SOURCE_OF_TRUTH.md
- VOICE_MODEL.md

---

### workflows/
**Purpose:** Workflow specifications (executable procedures)

**Naming:** `{workflow-name}.md`

**Examples:**
- `discovery.md`
- `brief.md`
- `qa.md`

**Current files (10):**
- artifacts.md
- blockage.md
- brief.md
- discovery.md
- drafting.md
- outline.md
- qa.md
- research.md
- review.md
- sync.md

---

### schemas/
**Purpose:** JSON schemas for all data structures

**Naming:** `{schema_name}.schema.json`

**Examples:**
- `brief.schema.json`
- `outline.schema.json`
- `discovery_report.schema.json`

**Current files (15):**
- artifact_manifest.schema.json
- blocker_report.schema.json
- brief.schema.json
- conflict_report.schema.json
- discovery_report.schema.json
- export_pack.schema.json
- findings_report.schema.json
- import_pack.schema.json
- merge_report.schema.json
- outline.schema.json
- quality_gate.schema.json
- research_report.schema.json
- review_report.schema.json
- rewrite_plan.schema.json
- sync_manifest.schema.json

---

### guides/
**Purpose:** Editorial guides (style packs, rubrics, canon, anti-patterns)

**Subdirectories:**
- `style-packs/` — Style guides
- `rubrics/` — Evaluation rubrics
- `canon/` — Canon reference material
- `anti-patterns/` — Anti-pattern guides

**Naming conventions:**
- Style packs: `{style-name}.md`
- Rubrics: `{style-name}-rubric.md`
- Canon: `{domain}-canon.md`
- Anti-patterns: `{style-name}-anti.md`

---

### hooks/
**Purpose:** Canonical hook specifications (NOT implementations)

**Naming:** `{hook-name}.md`

**Examples:**
- `pre-workflow-start.md`
- `pre-phase-advance.md`
- `on-failure.md`

**Note:** Hook *implementations* go in `.claude/hooks/`, not here.

---

### templates/
**Purpose:** Document templates

**Naming:** `{template-name}.md`

**Examples:**
- `api-reference.md`
- `tutorial.md`
- `campaign-setting.md`

---

### examples/
**Purpose:** Usage examples and sample workflows

**Naming:** `{example-name}.md`

---

## Cross-References

- `DIRECTORY_STRUCTURE.md` — Repository-wide file placement rules
- `.claude/README.md` — Claude adapter directory
- `mcp/README.md` — MCP servers directory
