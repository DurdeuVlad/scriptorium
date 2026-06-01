# /guide-promote

**Phase:** 2
**Status:** stub
**Owner:** lead-editor
**Category:** guides

## Purpose
Promotes a guide record from draft to active status after confirming it meets promotion criteria, making it available to agents in default searches and production runs.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| guide_id | string | Yes | (none) | The guide_id of the draft record to promote |
| override_criteria | boolean | No | false | Set true to bypass promotion criteria checks (lead-editor only; must document reason) |
| override_reason | string | No | (none) | Required if override_criteria is true |

## Behavior
1. Validate that `guide_id` is provided. If missing, halt with a validation error.
2. Call `guide-server get_guide` to retrieve the current record. If the record is not found, surface an error and halt.
3. Confirm the record is currently in `status: draft`. If it is already `active`, inform the user and halt gracefully. If it is `deprecated`, surface an error — deprecated records cannot be promoted; a new record must be created.
4. **Run promotion criteria checks** (skipped if `override_criteria: true`):
   - **Criteria 1 — Prior use:** Check whether this guide appears in any run context in cache-server (i.e., was it loaded by an agent in at least one completed run). If no prior use is found, note as a soft warning but do not block.
   - **Criteria 2 — Doctrine compliance:** If `type` is not `doctrine`, check whether the guide's content is consistent with active doctrine records by calling `/find-guides type=doctrine domain={guide.domain}` and reviewing for conflicts. Surface any conflicts found.
   - **Criteria 3 — No active duplicate:** Search guide-server for active records with matching `title` and `type`. If an active duplicate exists, halt and recommend linking or deprecating the existing record first.
5. If criteria checks pass (or are overridden with a documented reason): call `guide-server update_guide` with `guide_id` and `status: active`, recording `promoted_at` timestamp and `promoted_by: lead-editor`.
6. Update the filesystem mirror frontmatter: set `status: active`, add `promoted_at` timestamp.
7. Return the updated guide record and confirmation.

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| promoted_guide_record | JSON | guide_record | Full record with updated status: active |
| promotion_report | markdown (stdout) | — | Criteria check results, any warnings, and confirmation of promotion |

## Quality Gate
- guide-server must confirm the status update to `active` before the command reports success.
- The filesystem mirror must reflect `status: active` after the command completes.
- If `override_criteria` was used, `override_reason` must be recorded in the guide record's revision history.

## Error Handling
- Doctrine conflict found in criteria check: surface the conflict with both guide IDs and conflicting passages. Do not promote until the conflict is resolved or the user explicitly overrides. Recommend running `/guide-link` with `link_type: contradicts` to document the conflict.
- guide-server update fails: do not update the filesystem mirror status. Surface the error and recommend retrying.
- Active duplicate found: list the duplicate record (title, guide_id, created_at). Recommend either deprecating the existing record via `/guide-deprecate` or using `/guide-link replaces` if the new record supersedes the old one.

## Related Commands
- Run after: `/add-guide` (once a draft guide is ready for production use)
- Related: `/guide-deprecate`, `/update-guide`, `/guide-link`

## Related Agents
- lead-editor
- guide-server (MCP tool)

## Escalation Triggers
- Doctrine compliance check reveals a conflict with an existing active doctrine record: require explicit lead-editor sign-off (not just override_criteria=true) before promotion, as doctrine conflicts affect all production runs.

## Tool Adapter Notes
- **Claude Code:** Calls guide-server get_guide, searches for duplicates and doctrine conflicts via guide-server search_guides, then calls update_guide via MCP tool calls. Updates filesystem mirror using the Edit tool.
- **Codex:** Invoke with "Promote guide [guide_id]" or "Run /guide-promote guide_id=[id]".
- **Windsurf:** Invoke via AI panel. The status change will be reflected in the guide's mirror file in the editor.
- **Copilot:** Invoke in Copilot Chat. Copilot will request the guide_id if not provided.
