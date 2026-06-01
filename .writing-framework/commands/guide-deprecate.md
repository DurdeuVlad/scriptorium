# /guide-deprecate

**Phase:** 2
**Status:** stub
**Owner:** lead-editor
**Category:** guides

## Purpose
Marks a guide record as deprecated, preserving the record in guide-server but excluding it from default searches and agent guide-loading, and records the reason for deprecation along with any replacement reference.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| guide_id | string | Yes | (none) | The guide_id of the record to deprecate |
| deprecation_reason | string | Yes | (none) | Required explanation of why this guide is being deprecated |
| replaced_by | string | No | (none) | guide_id of the record that replaces this one, if applicable |

## Behavior
1. Validate that both `guide_id` and `deprecation_reason` are provided. If either is missing, surface a validation error and halt. Do not deprecate without a documented reason.
2. Call `guide-server get_guide` to retrieve the current record. If not found, surface an error and halt.
3. Confirm the record is not already `status: deprecated`. If it is, inform the user and halt gracefully.
4. If `replaced_by` is provided: call `guide-server get_guide` to verify the replacement record exists and is `status: active`. If it is not active, warn the user that they are linking to a non-active replacement and ask them to confirm.
5. If `replaced_by` is provided: call `/guide-link` with `guide_id_1: guide_id`, `guide_id_2: replaced_by`, `link_type: replaces`, `link_note: deprecation_reason`. This establishes the replacement relationship in the guide graph.
6. Call `guide-server deprecate_guide` with: guide_id, deprecation_reason, replaced_by (if provided), deprecated_at timestamp, deprecated_by: lead-editor.
7. Update the filesystem mirror frontmatter: set `status: deprecated`, add `deprecated_at` timestamp, add `deprecation_reason`, add `replaced_by` if applicable. Prepend a `[DEPRECATED]` marker to the file's first heading.
8. Confirm the deprecation with the user: show the record title, guide_id, deprecation reason, and replacement reference (if any).
9. Search for any active run contexts in cache-server that currently reference this guide_id. If any are found, warn that active runs are loaded with a now-deprecated guide and recommend refreshing those runs.

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| deprecated_guide_record | JSON | guide_record | Full record with updated status: deprecated |
| deprecation_confirmation | markdown (stdout) | — | Confirmation with guide_id, title, reason, and replacement reference if applicable |
| active_run_warnings | markdown (stdout) | — | List of active runs that currently reference this guide (if any) |

## Quality Gate
- guide-server must confirm the status update to `deprecated` before the command reports success.
- `deprecation_reason` must be non-empty and recorded in both the guide-server record and the filesystem mirror.
- The filesystem mirror must have the `[DEPRECATED]` marker and the updated frontmatter after the command completes.

## Error Handling
- guide-server deprecate_guide call fails: do not update the filesystem mirror. Surface the error. Recommend retrying or contacting the guide-server administrator.
- Replacement guide not found: surface an error identifying the missing replacement ID. Offer to proceed with deprecation without a replacement link, or halt until the user provides a valid replacement ID.
- Active runs reference the guide being deprecated: log the warning but do not block the deprecation. The user must manually refresh or re-run the affected sessions.

## Related Commands
- Run after: `/guide-promote` (when a newer guide supersedes this one), `/add-guide` (when a new replacement guide has been created)
- Run before: (nothing — deprecation is a terminal status action for a guide record)
- Related: `/guide-link`, `/update-guide`, `/find-guides`

## Related Agents
- lead-editor
- guide-server (MCP tool)

## Escalation Triggers
- Attempting to deprecate a guide of `type: doctrine` that has no replacement: require explicit lead-editor confirmation, as removing an active doctrine guide without replacement creates a coverage gap that may degrade agent output quality.
- More than five active runs reference the guide being deprecated: surface a summary of all affected runs and require explicit user confirmation before proceeding with the deprecation.

## Tool Adapter Notes
- **Claude Code:** Calls guide-server get_guide, deprecate_guide, and optionally link_guides via MCP tool calls. Updates filesystem mirror using the Edit tool. Searches cache-server for active run references using a cache-server query.
- **Codex:** Invoke with "Deprecate guide [guide_id]" or "Run /guide-deprecate". Codex will request deprecation_reason if not provided.
- **Windsurf:** Invoke via AI panel. The deprecated status will be reflected in the guide's mirror file in the editor.
- **Copilot:** Invoke in Copilot Chat. Provide guide_id and deprecation_reason in the invocation.
