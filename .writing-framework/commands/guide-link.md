# /guide-link

**Phase:** 2
**Status:** stub
**Owner:** lead-editor
**Category:** guides

## Purpose
Creates a typed directional link relationship between two guide records in guide-server, enabling agents to traverse the guide graph and discover related, contradicting, superseding, or dependent guides.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| guide_id_1 | string | Yes | (none) | The source guide in the link relationship |
| guide_id_2 | string | Yes | (none) | The target guide in the link relationship |
| link_type | string | Yes | (none) | One of: extends, contradicts, replaces, supports, requires |
| link_note | string | No | (none) | Optional explanation of why the relationship exists |

## Behavior
1. Validate that both `guide_id_1` and `guide_id_2` are provided and are different values. If they are the same, surface a validation error (a guide cannot link to itself) and halt.
2. Validate that `link_type` is one of the recognized values: extends, contradicts, replaces, supports, requires. If not, surface a validation error listing valid types and halt.
3. Verify both guide records exist by calling `guide-server get_guide` for each. If either record is not found, surface an error identifying which ID was missing and halt.
4. Check whether the link already exists by calling `guide-server get_links` for `guide_id_1`. If a link with the same `link_type` to `guide_id_2` already exists, warn the user and halt (idempotent — do not create duplicate links).
5. **Link semantics validation:**
   - `replaces`: warn if `guide_id_2` is not `status: deprecated` — a replacement link typically implies the target should be deprecated. Ask the user to confirm or run `/guide-deprecate` on guide_id_2 first.
   - `contradicts`: warn that contradicting links should be reviewed for doctrine coherence. Recommend a lead-editor review.
6. Call `guide-server link_guides` with: guide_id_1, guide_id_2, link_type, link_note (if provided), created_at timestamp.
7. Update the filesystem mirror frontmatter of `guide_id_1` to include the new link in a `linked_guides` array.
8. Return confirmation with both records' titles, the link type created, and the link ID assigned by guide-server.

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| link_record | JSON | — | Confirmed link record with link_id, both guide_ids, link_type, and created_at |
| confirmation | markdown (stdout) | — | Human-readable confirmation showing both guide titles and link type |

## Quality Gate
- guide-server must confirm the link was created before the command reports success.
- Both guide records must be confirmed to exist before the link is created.
- Duplicate links of the same type between the same two guides must not be created.

## Error Handling
- guide-server link creation fails: surface the error with the guide IDs and link type; do not write a partial link. Recommend retrying or checking guide-server availability.
- One guide record is in `status: deprecated`: warn the user that linking to a deprecated record may cause confusion for agents that filter by status. Proceed if the user confirms.
- guide-server `link_guides` tool is unavailable: update only the filesystem mirrors of both guides to record the relationship in their `linked_guides` frontmatter, mark as `sync_status: pending`, and warn the user.

## Related Commands
- Run after: `/add-guide` (to link a new guide to related records)
- Related: `/update-guide`, `/guide-deprecate`, `/find-guides`

## Related Agents
- lead-editor
- guide-server (MCP tool)

## Escalation Triggers
- `link_type: contradicts` between two doctrine records: escalate to lead-editor for doctrine coherence review before the link is created, as conflicting doctrine can degrade agent output quality across all runs.

## Tool Adapter Notes
- **Claude Code:** Calls guide-server get_guide (twice), get_links, and link_guides via MCP tool calls. Updates filesystem mirrors using the Edit tool.
- **Codex:** Invoke with "Link guide [id1] to [id2] as [type]" or "Run /guide-link".
- **Windsurf:** Invoke via AI panel. Provide both guide IDs and the link type in the invocation.
- **Copilot:** Invoke in Copilot Chat. Copilot will request guide IDs and link type if not supplied.
