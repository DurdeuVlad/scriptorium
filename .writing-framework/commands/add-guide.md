# /add-guide

**Phase:** 2
**Status:** stub
**Owner:** lead-editor
**Category:** guides

## Purpose
Adds a new guide record to guide-server and writes a filesystem mirror of the record to the `.writing-framework/guides/` directory, ensuring the guide is indexed and retrievable by all agents in subsequent runs.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| content | string (markdown) | Yes | (none) | Full body of the guide in markdown format |
| type | string | Yes | (none) | One of: doctrine, style_pack, canon, template, rubric, example, anti_pattern, decision_record |
| title | string | Yes | (none) | Human-readable title for the guide record |
| summary | string | Yes | (none) | 1–3 sentence summary used in search results and listings |
| tags | array of strings | No | [] | Categorization tags for filtering and discovery |
| domain | string | No | (none) | Domain this guide applies to (e.g., "technology", "finance", "healthcare") |
| status | string | No | draft | Initial status: draft or active |
| linked_guides | array of strings | No | [] | Guide IDs this record relates to (links resolved after creation) |

## Behavior
1. Validate that all required fields are present: `content`, `type`, `title`, `summary`. If any required field is missing, surface a validation error listing the missing fields and halt without writing any record.
2. Validate that `type` is one of the recognized type values: doctrine, style_pack, canon, template, rubric, example, anti_pattern, decision_record. If `type` is unrecognized, surface a validation error and halt.
3. Check for duplicate detection: search guide-server for existing records with the same `title` and `type`. If a duplicate is found, warn the user and ask them to confirm they intend to create a second record (not update the existing one). Do not auto-overwrite.
4. Call `guide-server add_guide` with the validated fields. On success, capture the assigned `guide_id` returned by guide-server.
5. Construct the filesystem mirror path: `.writing-framework/guides/{type}/{guide_id}-{slugified-title}.md`.
6. Write the filesystem mirror file. The file must contain: a frontmatter block with all metadata fields (guide_id, type, title, summary, tags, domain, status, created_at), followed by the full `content` markdown body.
7. If `linked_guides` is non-empty: for each guide ID in the list, call `/guide-link` with `link_type: supports` to establish the relationship. Log any link failures as warnings (do not halt).
8. Return the full guide record with the assigned `guide_id`, filesystem mirror path, and confirmation of guide-server write.

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| guide_record | JSON | guide_record | Full record as stored in guide-server, including assigned guide_id |
| mirror_path | string | — | Filesystem path where the guide mirror was written |
| confirmation | markdown (stdout) | — | Human-readable confirmation with guide_id and next steps |

## Quality Gate
- guide-server must confirm the record was written before the command reports success.
- The filesystem mirror file must exist at the expected path after the command completes.
- `guide_id` must be present in both the guide-server record and the filesystem mirror frontmatter.

## Error Handling
- guide-server is unavailable: write the filesystem mirror only, assign a provisional `guide_id` using the pattern `local-{timestamp}`, and flag the record as `sync_status: pending`. Surface a warning that the record must be synced to guide-server when it becomes available.
- Filesystem write fails: log the error, do not block the guide-server write. Warn the user that the filesystem mirror is missing and recommend running `/update-guide` to re-sync.
- Duplicate confirmed by user but they still choose to create: proceed with the new record; add a `see_also` link to the existing record automatically.

## Related Commands
- Run before: `/guide-promote` (to move the record from draft to active)
- Related: `/update-guide`, `/guide-link`, `/find-guides`, `/guide-gap-check`

## Related Agents
- lead-editor
- guide-server (MCP tool)

## Escalation Triggers
- Type validation fails (unrecognized guide type): halt and surface the valid type list; do not create a record with an invalid type.
- User confirms duplicate intent but the existing record has `status: active` and `type: doctrine`: require an explicit override confirmation before proceeding, as doctrine records have high downstream impact.

## Tool Adapter Notes
- **Claude Code:** Calls guide-server add_guide via MCP tool call. Writes the filesystem mirror using the Write tool. Uses the Bash tool to create subdirectories if they do not exist.
- **Codex:** Invoke with "Add a guide" or "Run /add-guide". Codex prompts for required fields if not all are supplied.
- **Windsurf:** Invoke via AI panel. Windsurf may display the new guide file in the editor after creation.
- **Copilot:** Invoke in Copilot Chat. Supply all required fields in the invocation or Copilot will request them.
