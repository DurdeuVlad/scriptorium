# Guide Server — Command Integration Notes

**Version:** 1.0 (Phase 3)

This document specifies how each framework command and agent integrates with the guide-server MCP. It is the authoritative reference for which tool each command calls, what query it issues, and how it handles guide-server unavailability.

---

## Integration Pattern

All guide-server interactions follow this pattern:

1. **Check availability** — if guide-server MCP is unavailable, fall back to filesystem reads at `.writing-framework/guides/`
2. **Issue query** — use `find_guides` for search or `list_guides` for type browsing
3. **Filter by status** — always pass `status: "active"` unless explicitly browsing deprecated records
4. **Handle empty results** — if no guides found, classify as B3 blocker (missing guide) and continue with defaults

---

## Pre-Run Gap Check

Run `guide_gap_check` at session start with the active domain to verify required guide types are present before beginning production work.

```
tool: guide_gap_check
args: { "domain": "[active-domain]", "task": "[brief goal statement]" }
```

A gap report with `gapCount > 0` is informational, not a hard blocker, unless the missing type is `doctrine` or `style-pack` — those are blocking gaps.

---

## Command → Tool Mapping

### Foundation Commands

| Command | Tool | Query | Notes |
|---------|------|-------|-------|
| `/session-start` | `guide_gap_check` | domain from context | Check for gaps at session open |
| `/session-start` | `find_guides` | `type: "doctrine"` | Load all active doctrine records |
| `/status` | `get_stats` | — | Show guide store health in status output |
| `/help` | `list_guides` | `type: "template"` | List available templates in help output |

### Discovery Commands

| Command | Tool | Query | Notes |
|---------|------|-------|-------|
| `/discovery` | `find_guides` | task description as query | Find relevant guides before discovery pass |
| `/project-scan` | `list_guides` | all active by domain | Surface available guides for detected domain |
| `/guide-gap-check` | `guide_gap_check` | domain + task | Primary use case for this tool |

### Research Commands

| Command | Tool | Query | Notes |
|---------|------|-------|-------|
| `/research` | `find_guides` | `type: "canon", domain: X` | Load canon before research to avoid contradictions |
| `/validate-research` | `find_guides` | `type: "rubric", domain: X` | Load validation rubric for research type |
| `/source-gap-check` | `find_guides` | `type: "anti-pattern", query: "claims"` | Load claim grounding anti-patterns |

### Editorial Commands

| Command | Tool | Query | Notes |
|---------|------|-------|-------|
| `/write-brief` | `find_guides` | `type: "template", query: "brief"` | Load brief template |
| `/write-brief` | `find_guides` | `type: "example", query: "brief"` | Load brief example for reference |
| `/write-outline` | `find_guides` | `type: "template", domain: X` | Load domain-specific outline template |
| `/write-outline` | `find_guides` | `type: "canon", domain: X` | Load canon to structure outline against |
| `/draft-section` | `find_guides` | `type: "style-pack", domain: X` | Load active style pack (critical — blocks draft if missing) |
| `/draft-section` | `find_guides` | `type: "canon", domain: X` | Load canon for fact-checking during draft |
| `/draft-section` | `find_guides` | `type: "example", domain: X` | Load examples for voice reference |
| `/voice-pass` | `find_guides` | `type: "style-pack", domain: X` | Load style pack for voice normalization |
| `/voice-pass` | `find_guides` | `type: "anti-pattern", query: "voice"` | Load voice anti-patterns |
| `/line-edit` | `find_guides` | `type: "anti-pattern", query: "structure"` | Load structural anti-patterns |
| `/canon-check` | `list_guides` | `type: "canon", domain: X` | Load ALL canon for domain — not just top result |
| `/rewrite` | `find_guides` | `type: "example", domain: X` | Load examples for rewrite reference |

### QA Commands

| Command | Tool | Query | Notes |
|---------|------|-------|-------|
| `/qa-reader` | `find_guides` | `type: "rubric", query: "reader"` | Load reader rubric (G-RUB-001) |
| `/qa-skeptic` | `find_guides` | `type: "rubric", query: "skeptic"` | Load skeptic rubric (G-RUB-002) |
| `/qa-domain` | `find_guides` | `type: "rubric", query: "domain"` | Load domain rubric (G-RUB-003) |
| `/qa-domain` | `list_guides` | `type: "canon", domain: X` | Load all canon for domain |
| `/qa-style` | `find_guides` | `type: "rubric", query: "style"` | Load style rubric (G-RUB-004) |
| `/qa-style` | `find_guides` | `type: "style-pack", domain: X` | Load active style pack |
| `/qa-coherence` | `find_guides` | `type: "rubric", query: "coherence"` | Load coherence rubric (G-RUB-005) |
| `/qa-ai-stink` | `find_guides` | `type: "rubric", query: "ai-stink"` | Load ai-stink rubric (G-RUB-006) |
| `/qa-ai-stink` | `find_guides` | `type: "anti-pattern", query: "ai-stink"` | Load ai-stink anti-patterns (G-ANTI-001) |
| `/qa-final` | `find_guides` | `type: "rubric", query: "final gate"` | Load final gate rubric (G-RUB-007) |

### Guide Management Commands

These commands map directly to guide-server tools:

| Command | Tool | Notes |
|---------|------|-------|
| `/add-guide` | `add_guide` | Creates guide in draft status; auto-promotes if `status: active` |
| `/update-guide` | `update_guide` | Partial update — omitted fields unchanged |
| `/find-guides` | `find_guides` | Direct FTS search; pass user query as-is |
| `/guide-gap-check` | `guide_gap_check` | Direct call; domain required |
| `/guide-link` | `link_guides` | Both guides must exist; validates link_type |
| `/guide-promote` | `promote_guide` | Moves draft → active |
| `/guide-deprecate` | `deprecate_guide` | Requires reason; optionally links superseded_by |

---

## Fallback Behavior

When guide-server MCP is unavailable:

1. **For style packs** — read directly from `.writing-framework/styles/[domain].md`
2. **For doctrine** — read directly from `.writing-framework/doctrine/*.md`
3. **For canon** — read directly from `.writing-framework/guides/canon/*.md`
4. **For rubrics** — read directly from `.writing-framework/guides/rubrics/*.md`
5. **For templates** — read directly from `.writing-framework/guides/templates/*.md`

Filesystem path format: `.writing-framework/guides/[type]/[slug].md`

Log a warning when falling back to filesystem. The filesystem and guide-server should be in sync — if they diverge, run `/guide-gap-check` to surface the discrepancy.

---

## Guide Retrieval Priority Order

When multiple guides match a query:

1. **Exact type + domain match** — highest priority
2. **Type match, domain = "general"** — applies across all domains
3. **Type match, domain mismatch** — lower priority; include only if no better match
4. **Body match only (no type match)** — informational only; do not treat as authoritative for that type

---

## Adding New Guides at Runtime

Agents may add guides during a run using `/add-guide`. Guidelines:

- New guides start as `draft` — they do not appear in active searches until promoted
- Use `/guide-promote` after verifying quality to make the guide active
- New canon records added during a run must be validated against existing canon to avoid contradictions (`link_type: "contradicts"` triggers a B8 blocker review)
- New anti-pattern records should reference the doctrine they implement (`link_type: "implements"`)

---

## Search Query Patterns

Effective `find_guides` queries for common lookups:

| What You Need | Query |
|---------------|-------|
| Style rules for a domain | `type: "style-pack", domain: X` |
| QA rubric for a perspective | `type: "rubric", query: "reader"` (or skeptic, domain, etc.) |
| Anti-patterns for a task | `type: "anti-pattern", query: "voice correction"` |
| Canon facts for a domain | `type: "canon", domain: X` — use `list_guides` not `find_guides` to get all |
| Template for document type | `type: "template", query: "brief"` or `"outline"` etc. |
| Example of correct output | `type: "example", query: "qa review"` |
| Decision rationale | `type: "decision-record", query: "proxy architecture"` |

---

## MCP Configuration

Add to Claude Code settings to connect the guide-server:

```json
{
  "mcpServers": {
    "guide-server": {
      "command": "node",
      "args": ["mcp/guide-server/src/server.js"],
      "env": {
        "GUIDE_DB_PATH": "mcp/guide-server/guides.db"
      }
    }
  }
}
```

The server reads `GUIDE_DB_PATH` from the environment; if unset, it defaults to `mcp/guide-server/guides.db` relative to the working directory.
