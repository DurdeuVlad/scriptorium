# /update-guide

**Phase:** 2
**Status:** stub
**Owner:** lead-editor
**Category:** guides

## Purpose
Updates an existing guide record in guide-server by ID and refreshes the corresponding filesystem mirror, ensuring the record's metadata and content remain consistent across both storage locations.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| guide_id | string | Yes | (none) | The guide_id of the record to update |
| content | string (markdown) | No | (unchanged) | New body content; replaces existing content if provided |
| title | string | No | (unchanged) | New title |
| summary | string | No | (unchanged) | New summary |
| tags | array of strings | No | (unchanged) | Replaces the full tags list if provided |
| domain | string | No | (unchanged) | New or updated domain value |
| status | string | No | (unchanged) | New status; use guide-promote or guide-deprecate for status transitions |
| update_reason | string | No | (none) | Optional note describing why the record was updated; written to revision history |

## Behavior
1. Validate that `guide_id` is provided. If missing, halt with a validation error.
2. Call `guide-server get_guide` with the provided `guide_id`. If the record does not exist, surface a "guide not found" error with the supplied ID and halt.
3. Confirm that at least one updatable field is provided (content, title, summary, tags, domain, status). If no fields are provided, warn the user that there is nothing to update and halt gracefully.
4. Validate any provided field values: `status` must be one of `draft`, `active`, `deprecated`; `type` is not updatable via this command (type changes require deprecating and recreating the record). If an invalid value is provided, surface a validation error and halt.
5. Merge the provided fields with the existing record. Fields not specified in the input are left unchanged.
6. Call `guide-server update_guide` with `guide_id` and the merged update payload. Record the `updated_at` timestamp returned by guide-server.
7. Locate the existing filesystem mirror at `.writing-framework/guides/{type}/{guide_id}-*.md` (match by guide_id prefix). If found, overwrite the file with updated frontmatter and content. If the mirror is not found, create it at the expected path (using the current title slug).
8. Append a revision note to the filesystem mirror's frontmatter `revision_history` array: `{updated_at, update_reason, fields_changed: [list]}`.
9. Return the updated guide record and confirm the filesystem mirror was refreshed.

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| updated_guide_record | JSON | guide_record | Full updated record as confirmed by guide-server |
| mirror_path | string | — | Filesystem path of the updated mirror file |
| confirmation | markdown (stdout) | — | Human-readable confirmation listing updated fields and guide_id |

## Quality Gate
- guide-server must confirm the update before the command reports success.
- The filesystem mirror must reflect all updated field values after the command completes.
- If `update_reason` is not provided and `content` was changed, warn that update reason is strongly recommended for doctrine and canon types.

## Error Handling
- guide-server is unavailable: apply the update to the filesystem mirror only. Set `sync_status: pending_sync` in the mirror frontmatter. Surface a warning that the guide-server record is out of sync.
- Filesystem mirror not found: create it from the guide-server record after the update. Log the creation as a mirror recovery action.
- Attempt to update `type` field: surface an error explaining that type changes require deprecating the existing record and creating a new one with `/add-guide`.
- guide-server returns a conflict error (record modified by another process since last read): surface the conflict, show both versions, and ask the user to confirm which version should be authoritative.

## Related Commands
- Run after: `/add-guide` (when updating a newly created draft)
- Related: `/guide-promote`, `/guide-deprecate`, `/guide-link`, `/find-guides`

## Related Agents
- lead-editor
- guide-server (MCP tool)

## Escalation Triggers
- Attempting to set `status: deprecated` directly via this command: redirect to `/guide-deprecate` which enforces the deprecation_reason requirement.
- Updating a guide record with `status: active` and `type: doctrine`: surface a warning that doctrine changes have broad downstream impact; require explicit confirmation before proceeding.

## Tool Adapter Notes
- **Claude Code:** Calls guide-server get_guide then update_guide via MCP tool calls. Updates the filesystem mirror using the Edit or Write tool. Locates the mirror file via a Glob search on the guide_id prefix.
- **Codex:** Invoke with "Update guide [guide_id]" or "Run /update-guide". Codex prompts for the guide_id if not provided.
- **Windsurf:** Invoke via AI panel. The updated mirror file will be reflected in the editor if it was already open.
- **Copilot:** Invoke in Copilot Chat. Provide guide_id and the fields to update in the invocation.
