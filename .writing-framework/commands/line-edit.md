# /line-edit

**Phase:** 3
**Status:** stub
**Owner:** line-editor
**Category:** editorial

## Purpose
Apply a line-level editing pass to a document or section. Targets: word choice, sentence rhythm, redundancy, transition quality, and clarity of expression. Does not restructure content.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| draft | file path or string | Yes | (none) | Document or section to line-edit |
| scope | string | No | full | Options: full, section_id — restrict to one section |
| intensity | string | No | standard | Options: light (touch up), standard (full pass), heavy (aggressive revision) |

## Behavior
1. Load the draft (and active style pack for reference).
2. Invoke `line-editor` agent to apply a line-level pass with the specified intensity:
   - **Light:** Fix clear errors only — wrong word choices, broken sentences, obvious redundancies.
   - **Standard:** Fix errors and improve: sentence rhythm, transition quality, word-level precision, minor redundancies.
   - **Heavy:** Improve throughout — compress wordy constructions, vary sentence structure, sharpen every transition, eliminate all padding.
3. Line-editing rules:
   - Do not restructure sections or reorder paragraphs.
   - Do not remove content without justification.
   - Preserve the author's voice within the constraints of the active style pack.
   - Flag any passages where style pack constraints conflict with natural expression.
4. Apply the AI-stink QA perspective as a final check on the edited output.
5. Output the edited document with all changes applied.

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| edited_draft | markdown (stdout + file) | none | Document with line edits applied |

## Quality Gate
- Structural content (argument, evidence, examples) must be preserved.
- No sentences may be deleted without replacement unless they are purely redundant.
- Edited output must pass the AI-stink perspective.

## Error Handling
- Draft not found: report error; direct user to specify a valid path.
- Style pack not found: apply general-writing line-editing defaults; note this.
- Scope references a section not found in draft: report the available sections; ask user to clarify.

## Related Commands
- Run after: `/merge-draft`, `/rewrite`
- Run before: `/compress`, `/voice-pass`

## Related Agents
- line-editor

## Escalation Triggers
- None. Line editing never escalates; it is a purely autonomous pass.

## Tool Adapter Notes
- **Claude Code:** Reads draft, applies edits, writes revised file, notes key changes in chat.
- **Codex:** Invoke with "Line-edit this document" or "Run /line-edit".
- **Windsurf:** Invoke via AI panel.
- **Copilot:** Invoke in Copilot Chat.
