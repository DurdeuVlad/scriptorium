# Extending the Framework for Your Domain

**Purpose:** Guide for customizing the Editorial Orchestrator framework for domain-specific needs without modifying core code.

---

## Core Framework is Domain-Agnostic

The framework (Phases 11-12) works for **any writing domain** out of the box:
- Technical documentation
- D&D campaigns
- Research papers
- Card game design
- Legal documents
- Marketing content
- Poetry
- Fiction
- Business reports

**You don't need to modify the framework.** Domain-specific behavior is controlled by:
1. **Style packs** (how to write)
2. **Templates** (what structure to use)
3. **Canon guides** (what facts/lore to follow)
4. **Rubrics** (how to evaluate)

All of these are **data**, not code. They live in guide-server.

---

## How to Customize for Your Domain

### Step 1: Create a Style Pack

**Location:** `mcp/guide-server/seeds/style-packs/your-domain.json`

**Example: Legal Document Style Pack**
```json
{
  "guide_id": "G-STYLE-007",
  "guide_type": "style-pack",
  "title": "Legal Document Style",
  "content": "# Legal Document Style\n\n## Voice\n- Formal, precise\n- Third person\n- No contractions\n- Passive voice acceptable\n\n## Terminology\n- Use defined terms consistently\n- Define terms on first use\n- Use 'shall' for obligations\n- Use 'may' for permissions\n\n## Structure\n- Numbered sections\n- Clear headings\n- Cross-references explicit\n\n## Anti-Patterns\n- Avoid: ambiguous pronouns\n- Avoid: 'and/or'\n- Avoid: unnecessary legalese",
  "status": "active",
  "applies_to": ["brief-writer", "section-drafter"],
  "domain": "legal"
}
```

**Then:**
```bash
cd mcp/guide-server
node src/seed.js  # Reload guide-server
```

**Now when writing:**
```
/write-brief
  Domain: legal
  # Automatically uses legal style pack
```

---

### Step 2: Create a Template

**Location:** `mcp/guide-server/seeds/templates/your-domain-template.json`

**Example: Contract Template**
```json
{
  "guide_id": "G-TMPL-007",
  "guide_type": "template",
  "title": "Contract Template",
  "content": "# Contract Template\n\n## Structure\n\n### 1. Title\n- Contract type\n- Parties\n\n### 2. Recitals\n- WHEREAS clauses\n- Background/context\n\n### 3. Definitions\n- Defined terms\n\n### 4. Obligations\n- Party A obligations\n- Party B obligations\n\n### 5. Term and Termination\n- Duration\n- Termination conditions\n\n### 6. Miscellaneous\n- Governing law\n- Dispute resolution\n- Signatures",
  "status": "active",
  "applies_to": ["outline-architect"],
  "domain": "legal"
}
```

---

### Step 3: Create Canon Guides (Optional)

**Location:** `mcp/guide-server/seeds/canon/your-domain-canon.json`

**Example: Company Policy Canon**
```json
{
  "guide_id": "G-CANON-007",
  "guide_type": "canon",
  "title": "Company Policy Canon",
  "content": "# Company Policy Canon\n\n## Established Facts\n- Company name: Acme Corp\n- Founded: 2020\n- Headquarters: San Francisco\n- Employee count: 500\n\n## Policies\n- Remote work: Hybrid (3 days in office)\n- PTO: 20 days/year\n- Health insurance: Provided\n\n## Terminology\n- Use 'team member' not 'employee'\n- Use 'manager' not 'supervisor'",
  "status": "active",
  "applies_to": ["section-drafter", "qa-domain"],
  "domain": "internal"
}
```

**QA will validate against this canon:**
```
/qa-domain
  # Checks draft against company policy canon
  # Flags inconsistencies
```

---

### Step 4: Create Rubrics (Optional)

**Location:** `mcp/guide-server/seeds/rubrics/your-domain-rubric.json`

**Example: Legal Document Rubric**
```json
{
  "guide_id": "G-RUB-007",
  "guide_type": "rubric",
  "title": "Legal Document Rubric",
  "content": "# Legal Document Rubric\n\n## Precision\n- All terms defined\n- No ambiguous pronouns\n- Cross-references accurate\n\n## Completeness\n- All obligations stated\n- All parties identified\n- Governing law specified\n\n## Enforceability\n- Consideration present\n- Terms not unconscionable\n- Signatures required",
  "status": "active",
  "applies_to": ["qa-domain"],
  "domain": "legal"
}
```

---

## Advanced: Custom Commands (Extension System)

If you need domain-specific commands (e.g., `/validate-contract`, `/generate-clause`), you can create custom commands.

### Option 1: Add to `.claude/commands/` (Simple)

**Location:** `.claude/commands/validate-contract.md`

```markdown
---
description: Validate contract against legal requirements
---

# /validate-contract

**Purpose:** Check contract for legal completeness

**Implementation:**
1. Load draft from cache-server
2. Query guide-server for legal rubric
3. Check for required elements:
   - Parties identified
   - Consideration present
   - Terms clear
   - Signatures section present
4. Return validation report

**Usage:**
/validate-contract draft_id=draft-123
```

**This command is now available in Claude Code.**

---

### Option 2: Create Extension Package (Advanced)

**Structure:**
```
extensions/
  legal-extension/
    extension.json
    commands/
      validate-contract.md
      generate-clause.md
    guides/
      legal-style.json
      contract-template.json
      legal-rubric.json
    README.md
```

**`extension.json`:**
```json
{
  "name": "legal-extension",
  "version": "1.0.0",
  "description": "Legal document writing tools",
  "commands": [
    "validate-contract",
    "generate-clause"
  ],
  "guides": [
    "guides/legal-style.json",
    "guides/contract-template.json",
    "guides/legal-rubric.json"
  ]
}
```

**Installation:**
```bash
# Copy extension to framework
cp -r extensions/legal-extension .claude/extensions/

# Load guides into guide-server
cd mcp/guide-server
node src/seed.js --extension legal-extension
```

---

## Examples by Domain

### D&D Campaign Writing

**Already included in guide-server:**
- Style packs: `lore-dm.json`, `lore-player-facing.json`
- Templates: `dnd-lore-template.json`
- Canon: `dnd-canon.json`

**Usage:**
```
/write-brief
  Domain: dnd
  Requirements: Write a campaign setting for Forgotten Realms
  
/write-outline
  # Uses dnd-lore-template

/draft-document
  # Uses lore-dm style pack
  
/qa-domain
  # Validates against dnd-canon
```

**Custom commands (optional):**
- Create `/generate-npc` in `.claude/commands/`
- Create `/validate-lore` in `.claude/commands/`

---

### Research Paper Writing

**Create these guides:**
- Style pack: `academic-research.json` (formal, third person, citations required)
- Template: `research-paper-template.json` (abstract, intro, methods, results, discussion)
- Rubric: `research-rubric.json` (claim grounding, citation format)

**Usage:**
```
/write-brief
  Domain: research
  Requirements: Write a research paper on machine learning
  
/qa-skeptic
  # Checks claim grounding (already built-in)
  
/qa-style
  # Enforces academic style
```

**Custom commands (optional):**
- `/validate-citations` - Check citation format
- `/generate-bibliography` - Auto-generate bibliography

---

### Card Game Design

**Already included in guide-server:**
- Style pack: `card-flavor.json`
- Template: `card-game-template.json`

**Usage:**
```
/write-brief
  Domain: card-game
  Requirements: Design a deck-building card game
  
/draft-document
  # Uses card-game-template and card-flavor style
```

**Custom commands (optional):**
- `/generate-card` - Generate card from template
- `/validate-mechanics` - Check mechanics consistency

---

### Marketing Content

**Create these guides:**
- Style pack: `marketing.json` (persuasive, benefit-focused, call-to-action)
- Template: `landing-page-template.json` (hero, features, testimonials, CTA)
- Rubric: `marketing-rubric.json` (clarity, persuasiveness, CTA present)

**Usage:**
```
/write-brief
  Domain: marketing
  Requirements: Write landing page copy for SaaS product
  
/draft-document
  # Uses marketing style and landing-page template
```

---

## Best Practices

### 1. Start with Style Packs and Templates
**Don't create custom commands unless you really need them.**

Most domain-specific needs are handled by:
- Style packs (how to write)
- Templates (what structure)
- Canon (what facts)
- Rubrics (how to evaluate)

### 2. Use Canon for Domain Knowledge
If your domain has established facts, terminology, or lore, put it in canon guides.

QA will automatically validate against canon.

### 3. Create Custom Commands Only for Repetitive Tasks
Good reasons for custom commands:
- `/generate-npc` - Generates structured data repeatedly
- `/validate-citations` - Complex format checking
- `/extract-entities` - Parsing and structuring

Bad reasons:
- Domain-specific writing style (use style packs)
- Domain-specific structure (use templates)
- Domain-specific validation (use rubrics + canon)

### 4. Keep Custom Commands Generic
If you create `/validate-contract`, make it work for any contract type.

Don't create `/validate-employment-contract`, `/validate-nda`, etc.

Use parameters instead:
```
/validate-contract type=employment
/validate-contract type=nda
```

---

## Extension Development Guide

### Creating a Custom Command

**1. Define the command:**
`.claude/commands/my-command.md`

```markdown
---
description: One-line description
---

# /my-command

**Purpose:** What this command does

**Inputs:**
- input1 (type, description)
- input2 (type, description)

**Process:**
1. Load data from cache-server
2. Query guide-server for guides
3. Perform operation
4. Return result

**Outputs:**
- output (type, description)

**Implementation:**
[Command logic here]
```

**2. Test the command:**
```
/my-command input1=value1 input2=value2
```

**3. Document usage:**
Add to extension README.

---

### Creating a Guide

**1. Create JSON file:**
`mcp/guide-server/seeds/your-type/your-guide.json`

**2. Follow schema:**
```json
{
  "guide_id": "G-TYPE-NNN",
  "guide_type": "style-pack|template|canon|rubric|anti-pattern",
  "title": "Guide Title",
  "content": "Markdown content",
  "status": "active",
  "applies_to": ["agent-name", "command-name"],
  "domain": "your-domain"
}
```

**3. Seed guide-server:**
```bash
cd mcp/guide-server
node src/seed.js
```

---

## Community Extensions

**Future:** Extension marketplace where community can share domain-specific extensions.

**For now:** Share extensions via:
- GitHub repositories
- Framework discussions
- Documentation wiki

---

## Summary

**Core framework (Phases 11-12) works for all domains.**

**To customize:**
1. **First:** Create style packs, templates, canon, rubrics (data, not code)
2. **If needed:** Create custom commands in `.claude/commands/`
3. **Advanced:** Package as extension for reuse/sharing

**Don't modify core framework code.** Extend through data and custom commands.

---

## Cross-References

- `mcp/guide-server/seeds/` — Example guides for D&D, card games
- `.claude/commands/` — Where to add custom commands
- `PRODUCTION_READINESS_PLAN.md` — Core framework implementation
- `docs/PHASE11_SPECIFICATION.md` — Core writing pipeline
- `docs/PHASE12_SPECIFICATION.md` — QA system
