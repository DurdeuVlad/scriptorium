# PARTIAL COMPLETION BEHAVIOR

**Status:** Canonical. Defines how agents handle incomplete work and partial outputs.
**Phase:** 5
**Related:** AUTONOMOUS_EXECUTION.md, BLOCKER_CLASSIFICATION.md

---

## Core Principle

**When full completion is not possible, produce partial output that is clearly labeled and useful. Silence is not an acceptable response to blockers.**

Partial output that documents what was completed, what is missing, and how to resume is more valuable than no output at all.

---

## Partial Completion Protocol

### When a Blocker Prevents Full Completion

**Required Actions:**
1. Complete all work that can be completed without the blocked information
2. Produce real partial output — not stubs, not empty headers, not "TBD" throughout
3. Document exactly what is missing and why in explicit terms
4. Write a RESUME section with specific instructions
5. Deliver the partial output with clear labeling

**Forbidden Actions:**
- Producing nothing because full completion is impossible
- Producing stubs or placeholders without real content
- Halting all work when some work can proceed
- Delivering partial output without labeling it as partial
- Writing vague resume instructions ("continue when ready")

---

## Partial Output Labeling

### Required Label Format

Every partial output must include a header section:

```markdown
## PARTIAL OUTPUT — RESUME REQUIRED

**Completed:** [specific list of sections/phases completed]
**Blocked:** [specific list of sections/phases blocked]
**Missing:** [specific description of what is needed]
**Blocker Type:** [B1-B9 classification]
**To Resume:** [executable command with parameters]

---
```

### Example: Partial Document Draft

```markdown
## PARTIAL OUTPUT — RESUME REQUIRED

**Completed:** 
- Section 1: Introduction (2,400 words)
- Section 2: Background (3,100 words)
- Section 4: Methodology (2,800 words)

**Blocked:** 
- Section 3: Literature Review (cannot proceed without source material)

**Missing:** 
- 5 academic papers on distributed consensus algorithms (see brief requirement #3)
- Specific papers needed: Raft, Paxos, Byzantine fault tolerance

**Blocker Type:** B4 (missing-source-material)

**To Resume:** 
1. Provide papers in `research/` directory or as URLs
2. Run: `/draft-section section_id=S3 run_id=abc123`

---

[Completed sections follow...]
```

---

## Quality Standards for Partial Output

### Completed Sections Must Be Production-Quality

**Standards:**
- Completed sections are final-quality, not drafts of drafts
- All completed sections validate against applicable schemas
- Completed sections follow style pack and doctrine
- No "TODO" or "TBD" markers in completed sections
- All completed sections have proper headers, structure, formatting

**Example — Acceptable:**
```markdown
## Section 1: Introduction

Docker is a containerization platform that enables developers to package
applications with their dependencies into standardized units called containers.
This guide covers Docker fundamentals for intermediate developers who have
experience with Linux systems and basic DevOps concepts.

[2,400 words of complete, production-quality content...]
```

**Example — Not Acceptable:**
```markdown
## Section 1: Introduction

TODO: Write introduction about Docker
[placeholder content]
```

### Blocked Sections Must Have Descriptive Placeholders

**Standards:**
- Placeholder clearly labeled with blocker type
- Specific description of what would go here
- Exact requirement to unblock
- No generic "content goes here" placeholders

**Example — Acceptable:**
```markdown
## Section 3: Literature Review

[BLOCKED: B4-missing-source-material]

This section will analyze 5 academic papers on distributed consensus algorithms,
comparing their approaches to leader election, log replication, and fault tolerance.

**Required to unblock:**
- Raft paper (Ongaro & Ousterhout, 2014)
- Paxos Made Simple (Lamport, 2001)
- Byzantine Generals Problem (Lamport et al., 1982)
- Viewstamped Replication (Liskov & Cowling, 2012)
- Zab protocol paper (Junqueira et al., 2011)

**When unblocked:** This section will be approximately 3,500 words covering
algorithm comparison, performance analysis, and use case recommendations.
```

**Example — Not Acceptable:**
```markdown
## Section 3: Literature Review

[Content pending source material]
```

---

## Resume Section Format

### Required Resume Fields

Every partial output must include a RESUME section with these fields:

```markdown
## RESUME

**Blocked on:** [exact description of what must be provided or resolved]

**To resume:** [specific command or action to run when unblocked]

**When unblocked:** [description of what will be produced after resolution]

**Already complete:** [enumerated list of finished deliverables with locations]

**Estimated remaining work:** [what is left to produce]
```

### Resume Field Guidelines

**Blocked on:**
- Must be specific, not general
- Must be actionable (user knows exactly what to provide)
- Must cite specific files, data, or decisions needed

**To resume:**
- Must be an executable command with parameters
- Must include run_id if applicable
- Must be copy-pastable (no placeholders)

**When unblocked:**
- Must describe specific outputs that will be produced
- Must include estimated scope (word count, section count, etc.)
- Must note any dependencies on other work

**Already complete:**
- Must enumerate all finished work with artifact IDs or file paths
- Must note which work is production-ready vs. needs review
- Must include locations where outputs are stored

**Estimated remaining work:**
- Must be specific (not "finish the document")
- Must include phases/sections/outputs remaining
- Must note any additional blockers that might arise

---

## Partial Completion Scenarios

### Scenario 1: Section-Level Blocker

**Situation:** Outline has 5 sections, Section 3 requires missing source material.

**Action:**
1. Draft Sections 1, 2, 4, 5 to completion
2. Create descriptive placeholder for Section 3
3. Label output as partial
4. Write RESUME section with specific source material needed
5. Deliver 4 complete sections + 1 placeholder + RESUME

**Result:** 80% complete document, clear path to 100%

### Scenario 2: Brief-Level Blocker

**Situation:** Cannot write brief because user intent is ambiguous (B1 blocker).

**Action:**
1. Complete discovery phase (not blocked)
2. Document ambiguity in discovery report
3. List specific questions that need answers
4. Create brief template with known fields filled in
5. Label brief as partial, mark ambiguous fields as [PENDING USER INPUT]
6. Write RESUME section with specific questions

**Result:** Discovery complete, brief template ready, clear questions for user

### Scenario 3: Export-Level Blocker

**Situation:** PDF export fails (B6 blocker), but drafting is complete.

**Action:**
1. Complete all drafting phases
2. Produce markdown final draft
3. Attempt docx export as alternative
4. Document PDF export failure
5. Label output as complete draft, partial export
6. Write RESUME section with export troubleshooting steps

**Result:** Complete draft in markdown, alternative format available, export issue documented

### Scenario 4: Multi-Section Blocker

**Situation:** Sections 2, 4, 6 all require same missing source material.

**Action:**
1. Draft Sections 1, 3, 5, 7, 8 to completion
2. Create single descriptive placeholder noting all blocked sections
3. Group blocked sections in RESUME
4. Note that resolving one blocker unblocks all three sections
5. Provide single resume command that will draft all blocked sections

**Result:** 5/8 sections complete, efficient resume plan

---

## Integration with Cache-Server

### Saving Partial Outputs

```javascript
// Save each completed section as artifact
for (const section of completedSections) {
  cache.save_artifact({
    run_id: currentRunId,
    step_id: currentStepId,
    artifact_type: 'intermediate-draft',
    content: section.content,
    metadata: JSON.stringify({
      section_id: section.id,
      status: 'complete',
      word_count: section.wordCount
    })
  });
}

// Save placeholders for blocked sections
for (const section of blockedSections) {
  cache.save_artifact({
    run_id: currentRunId,
    step_id: currentStepId,
    artifact_type: 'intermediate-draft',
    content: section.placeholder,
    metadata: JSON.stringify({
      section_id: section.id,
      status: 'blocked',
      blocker_type: section.blockerType
    })
  });
}
```

### Creating Resume Points

```javascript
// Create resume point with partial progress
cache.save_resume_point({
  run_id: currentRunId,
  step_index: currentStepIndex,
  checkpoint_name: 'partial-draft-pre-section-3',
  state_snapshot: JSON.stringify({
    phase: 'drafting',
    completed_sections: ['S1', 'S2', 'S4', 'S5'],
    blocked_sections: ['S3'],
    blocker_type: 'B4-missing-source-material',
    next_action: 'draft-section-3'
  }),
  artifact_ids: JSON.stringify(completedArtifactIds)
});
```

---

## Autonomy Rules for Partial Completion

### Type 1 Decisions (Infer and Proceed)
- **Complete all unblocked work:** Always proceed with unimpacted scope
- **Create descriptive placeholders:** For all blocked sections
- **Label partial outputs:** With completion status
- **Generate resume plan:** With specific commands

### Type 2 Decisions (Infer and Flag)
- **Choose section order:** When multiple unblocked sections available
- **Determine placeholder detail level:** Based on blocker type
- **Estimate remaining work:** Based on outline and progress

### Type 3 Decisions (Must Ask)
- **Abandon partial output:** Never — always produce what is possible
- **Skip quality standards for completed sections:** Never — completed work must be production-quality
- **Proceed with blocked work using guesses:** Never — create placeholder instead

---

## Quality Gate for Partial Outputs

**Pass Criteria:**
- ✅ All unblocked work completed to production quality
- ✅ All blocked work has descriptive placeholders
- ✅ Partial output clearly labeled with header
- ✅ RESUME section includes all required fields
- ✅ Resume command is executable (not vague)
- ✅ All completed sections validate against schemas
- ✅ All artifacts saved to cache-server with status metadata

**Fail Criteria:**
- ❌ Unblocked work not completed (halted unnecessarily)
- ❌ Completed sections are stubs or low-quality
- ❌ Partial output not labeled
- ❌ RESUME section missing or vague
- ❌ No clear path to completion

---

## Examples from Real Workflows

### Example 1: Discovery with Missing Doctrine

**Partial Output:**
```markdown
## PARTIAL OUTPUT — RESUME REQUIRED

**Completed:**
- Context scan (8 directories scanned)
- Guide query (12 guides found)
- Style pack detection (technical-writing.md selected)

**Blocked:**
- Doctrine analysis (no doctrine files found)

**Missing:**
- All doctrine files in `.writing-framework/doctrine/`
- Expected: EDITORIAL_DOCTRINE.md, AUTONOMOUS_EXECUTION.md, QUALITY_GATES.md, etc.

**Blocker Type:** B2 (missing-repo-context)

**To Resume:**
1. Run: `/install-framework` to create doctrine files
2. Run: `/discovery` to re-scan with doctrine present

**Already complete:**
- discovery_report.json (partial) saved to cache-server
- Style pack identified: technical-writing.md
- 12 guides catalogued

**Estimated remaining work:**
- Doctrine analysis (5 minutes)
- Gap classification (2 minutes)
- Final discovery report assembly (3 minutes)
```

### Example 2: Draft with Missing Canon

**Partial Output:**
```markdown
## PARTIAL OUTPUT — RESUME REQUIRED

**Completed:**
- Section 1: Introduction to the Realm (1,800 words)
- Section 2: Geography and Climate (2,200 words)
- Section 5: Economy and Trade (1,900 words)

**Blocked:**
- Section 3: Major Factions (requires faction canon)
- Section 4: Historical Timeline (requires historical canon)

**Missing:**
- Canon guide for faction details (names, leaders, motivations)
- Canon guide for historical events (dates, outcomes, consequences)

**Blocker Type:** B3 (missing-guide)

**To Resume:**
1. Create canon guides using `/add-guide type=canon domain=worldbuilding`
2. Run: `/draft-section section_id=S3 run_id=xyz789`
3. Run: `/draft-section section_id=S4 run_id=xyz789`

**Already complete:**
- 3 sections (5,900 words total) saved to cache-server
- Artifact IDs: art-001, art-002, art-005

**Estimated remaining work:**
- Section 3: ~2,500 words
- Section 4: ~3,000 words
- Final merge and normalization: ~30 minutes
```

---

## Cross-References

- `doctrine/AUTONOMOUS_EXECUTION.md` — Type 1/2/3 decision classification
- `doctrine/BLOCKER_CLASSIFICATION.md` — B1-B9 blocker taxonomy
- `workflows/blockage.md` — Blockage handling workflow
- `agents/blockage-handler.md` — Blockage handler agent spec
- `mcp/cache-server/RESUME_PROTOCOL.md` — Resume strategies and validation
