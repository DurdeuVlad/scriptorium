# .claude/ — Claude Code Adapter

**Purpose:** Contains Claude Code-specific adapters for framework commands, agents, and hooks. This directory enables the Editorial Orchestrator framework to work with Claude Code.

---

## What Belongs Here

**Claude Code adapters ONLY:**
- Command adapters (thin wrappers for slash commands)
- Agent adapters (Claude-specific agent implementations)
- Hook implementations (Claude-specific hook execution)

**NEVER place here:**
- Canonical framework definitions (those go in `.writing-framework/`)
- Generated artifacts (those go in `artifacts/`)
- Documentation (those go in `docs/`)
- MCP server code (those go in `mcp/`)

---

## Directory Structure

```
.claude/
├── agents/                  # Claude agent adapters
├── commands/                # Claude command adapters (slash commands)
└── hooks/                   # Claude hook implementations
```

---

## File Placement Rules

### commands/
**Purpose:** Claude Code slash command adapters

**Naming:** `{command-name}.md`

**Format:**
```markdown
---
description: One-line description for Claude Code tool picker
---

# Command Implementation

[Adapter logic that calls canonical spec from .writing-framework/commands/]
```

**Examples:**
- `write-brief.md` — Adapter for /write-brief command
- `qa-reader.md` — Adapter for /qa-reader command

**Rules:**
- Must have YAML frontmatter with `description` field
- Must reference canonical spec in `.writing-framework/commands/`
- Keep adapter thin (logic in canonical spec, not here)

---

### agents/
**Purpose:** Claude-specific agent implementations

**Naming:** `{agent-name}.md`

**Examples:**
- `brief-writer.md` — Claude adapter for brief-writer agent
- `adversarial-reviewer.md` — Claude adapter for adversarial-reviewer agent

**Rules:**
- Must reference canonical spec in `.writing-framework/agents/`
- Claude-specific behavior only (tool-agnostic behavior in canonical spec)

---

### hooks/
**Purpose:** Claude-specific hook implementations

**Naming:** `{hook-name}.md`

**Examples:**
- `pre-workflow-start.md` — Claude implementation of pre-workflow-start hook
- `pre-phase-advance.md` — Claude implementation of pre-phase-advance hook
- `on-failure.md` — Claude implementation of on-failure hook

**Current files:**
- `pre-workflow-start.md`
- `pre-phase-advance.md`
- `pre-artifact-finalize.md`
- `on-failure.md`
- `README.md` — Hook system overview

**Rules:**
- Must implement hook spec from `.writing-framework/hooks/`
- Claude-specific execution logic
- Must follow hook response format from canonical spec

---

## Adapter Pattern

**Canonical spec** (`.writing-framework/`) defines WHAT:
- Purpose
- Inputs/outputs
- Behavior rules
- Quality criteria

**Adapter** (`.claude/`) defines HOW for Claude Code:
- Tool invocation
- Claude-specific formatting
- Error handling
- Integration with Claude Code features

**Example:**

Canonical spec (`.writing-framework/commands/write-brief.md`):
```markdown
# /write-brief Command

**Purpose:** Generate brief from discovery report

**Inputs:**
- discovery_report_id
- user_requirements

**Outputs:**
- brief.json (validated against brief.schema.json)

**Behavior:**
1. Load discovery report from cache
2. Extract requirements
3. Generate brief
4. Validate against schema
5. Pass Brief Gate
6. Save to cache
```

Claude adapter (`.claude/commands/write-brief.md`):
```markdown
---
description: Generate brief from discovery report
---

# /write-brief

[Claude-specific implementation that follows canonical spec]
```

---

## Cross-References

- `DIRECTORY_STRUCTURE.md` — Repository-wide file placement rules
- `.writing-framework/README.md` — Framework core directory
- `.claude/hooks/README.md` — Hook system overview
