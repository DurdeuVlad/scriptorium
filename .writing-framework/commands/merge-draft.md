# /merge-draft

**Phase:** 3
**Status:** active
**Owner:** merge-normalizer
**Category:** editorial

## Purpose
Merge drafted sections into a single markdown document, normalize voice and formatting, and emit a schema-valid `merge_report.json` describing section status and normalization decisions.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| sections | array of file paths, artifact refs, or inline markdown | Yes | (none) | Ordered section drafts to merge |
| outline | file path or object | No | (active outline) | Outline used to confirm ordering and coverage |
| brief | file path or object | No | (active brief) | Voice and tone target for normalization |
| run_id | string | No | (active run) | Cache-server run identifier |

## Behavior
1. Load the section drafts in outline order.
2. Load the active brief and outline when available.
3. Invoke `merge-normalizer` to:
   - assemble the sections in order
   - preserve heading hierarchy
   - document placeholders or blocked sections without silently hiding them
   - identify voice inconsistencies
   - apply safe normalization when it does not change meaning
4. Produce `merge_report.json` matching `.writing-framework/schemas/merge_report.schema.json`, including:
   - `merge_id`
   - `outline_id`
   - `run_id`
   - `sections_merged`
   - `voice_issues`
   - `normalization_applied`
   - `normalization_notes`
   - `draft_path`
   - `created_by`
   - `created_at`
5. Validate the merge report against the schema.
6. Save the merged draft and merge report to cache-server.
7. Return both artifacts plus any warnings that require follow-up.

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| merged_draft | markdown | none | Assembled document draft |
| merge_report.json | JSON object | merge_report.schema.json | Normalization and section-status report |

## Quality Gate
- No input section is silently dropped.
- Section status in `sections_merged` matches the assembled draft.
- Voice normalization is logged rather than hidden.
- `merge_report.json` validates against the current schema.

## Error Handling
- Empty section: mark the section status accordingly in `sections_merged` and continue.
- Severe voice inconsistency: flag it in `voice_issues`; only normalize automatically when safe.
- Schema failure in the merge report: stop and return the validation errors.

## Related Commands
- Run after: `/draft-section`, `/draft-document`
- Run before: `/rewrite`, review, and QA commands

## Related Agents
- merge-normalizer

## Escalation Triggers
- Voice normalization would require substantial content rewriting rather than normalization.
- The merged draft exceeds brief constraints badly enough that a dedicated rewrite or compression pass is required.

## Tool Adapter Notes
- **Claude Code:** Reads section artifacts, writes the merged markdown, and validates `merge_report.json`.
- **Codex:** Invoke with "Run /merge-draft" using the current section drafts.
- **Windsurf:** Invoke through the command adapter.
- **Copilot:** Invoke in chat with the active draft section set.
