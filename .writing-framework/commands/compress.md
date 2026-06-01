# /compress

**Phase:** 3
**Status:** stub
**Owner:** compression-editor
**Category:** editorial

## Purpose
Reduce the word count of a document while preserving its informational content and argument. Targets padding, throat-clearing, over-explained points, and redundant examples. Does not remove substantive content.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| draft | file path or string | Yes | (none) | Document or section to compress |
| target_word_count | integer | No | (inferred from brief) | Target word count after compression |
| scope | string | No | full | Options: full, section_id — restrict to one section |

## Behavior
1. Load the draft and brief (for target scope reference).
2. Determine target word count: use `target_word_count` argument if provided; otherwise infer from brief scope constraints; otherwise target 80% of current word count as a default.
3. Invoke `compression-editor` agent:
   a. Identify and eliminate padding: throat-clearing, filler phrases, hollow affirmations, excessive hedging.
   b. Identify and eliminate redundancy: repeated explanations, same point made twice in different words.
   c. Identify and consolidate over-explained simple points: where 4 sentences do the work of 1.
   d. Identify and remove redundant examples: where three examples illustrate a point that one would serve.
   e. Preserve: all substantive claims, all critical evidence, all structural transitions that carry argument.
4. Apply self-QA: reader and coherence perspectives to confirm compression has not broken the argument.
5. Report: original word count, final word count, compression percentage, types of edits applied.
6. Output the compressed document.

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| compressed_draft | markdown (stdout + file) | none | Compressed document |
| compression_report | markdown (stdout) | none | Summary of word count delta and edit types applied |

## Quality Gate
- No substantive claims may be removed.
- All critical evidence must be preserved.
- Compressed document must not score worse on reader or coherence QA than the original.

## Error Handling
- Draft not found: report error.
- Target word count is lower than the minimum viable document length for the brief's scope: warn user; compress as far as possible without losing substance; report the gap.
- Compression target already met (draft is already at or below target): note this and return the original document.

## Related Commands
- Run after: `/merge-draft`, `/line-edit`
- Run before: `/voice-pass`, `/qa-final`

## Related Agents
- compression-editor

## Escalation Triggers
- If reaching the target word count requires removing substantive content: surface this and ask user to choose between accepting a longer document or approving content removal.

## Tool Adapter Notes
- **Claude Code:** Reads draft, applies compression, writes file, reports stats in chat.
- **Codex:** Invoke with "Compress this document" or "Run /compress".
- **Windsurf:** Invoke via AI panel.
- **Copilot:** Invoke in Copilot Chat.
