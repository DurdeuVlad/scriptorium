# /find-guides

**Phase:** 2
**Status:** stub
**Owner:** any agent
**Category:** guides

## Purpose
Searches guide-server using FTS5 full-text search and returns a ranked list of matching guide records with relevance scores, supporting optional filtering by type, domain, tags, and status.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| query | string | Yes | (none) | Full-text search query string |
| type | string | No | (all) | Filter to a specific guide type: doctrine, style_pack, canon, template, rubric, example, anti_pattern, decision_record |
| domain | string | No | (all) | Filter to a specific domain |
| tags | array of strings | No | [] | Filter to records containing ALL specified tags |
| status | string | No | active | Filter by status: draft, active, deprecated, or all |
| limit | integer | No | 10 | Maximum number of results to return |
| include_content | boolean | No | false | Whether to include the full content body in results (default: summaries only) |

## Behavior
1. Validate that `query` is present and non-empty. If missing, surface a validation error and halt.
2. Construct the search request: combine the `query` string with any provided filter parameters (`type`, `domain`, `tags`, `status`).
3. Call `guide-server search_guides` with the constructed query and filters. Guide-server executes an FTS5 full-text search against titles, summaries, content bodies, and tags.
4. Receive the ranked results list from guide-server. Each result includes: guide_id, title, type, domain, summary, tags, status, relevance_score, last_updated.
5. If `include_content` is true: for each result in the returned list, call `guide-server get_guide` to retrieve the full content body and append it to the result object.
6. Apply the `limit` to the final results list if guide-server does not enforce it natively.
7. **Fallback behavior:** If guide-server is unavailable or returns an error: fall back to a filesystem grep of `.writing-framework/guides/` matching the query string against all `.md` file contents and frontmatter. Return matching files as results with `source: filesystem-fallback` noted in the response.
8. Present results in a ranked table (by relevance_score descending) with columns: rank, guide_id, title, type, domain, summary, tags.
9. If no results are found: report "no matching guides found" and suggest broadening the query or running `/guide-gap-check` to identify what guides should be created.

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| results | JSON array | guide_record[] | Ranked list of matching guide records |
| results_summary | markdown (stdout) | — | Formatted table of results with rank, id, title, type, domain, and summary |
| search_metadata | JSON | — | Query used, filters applied, total results found, source (guide-server or filesystem-fallback) |

## Quality Gate
- The response must include a non-empty results array or an explicit "no results found" message — never a silent empty response.
- If the filesystem fallback was used, this must be stated clearly in the output so callers know guide-server was unavailable.
- Relevance scores must be included in the raw output even if not displayed in the formatted table.

## Error Handling
- guide-server search returns an error: attempt the filesystem fallback immediately. If the fallback also fails, surface the error and recommend checking guide-server and filesystem availability.
- Query contains only stop words or is too short for FTS5: surface a "query too broad" warning and suggest adding more specific terms.
- `tags` filter returns zero results: relax the tags filter to OR matching instead of AND matching, re-run, and note the relaxation in the output.

## Related Commands
- Run before: `/add-guide` (to check for duplicates), `/guide-gap-check` (when no results found)
- Related: `/add-guide`, `/update-guide`, `/guide-link`, `/apply-doctrine`, `/apply-style-pack`

## Related Agents
- Any agent (this command is callable by all agents to retrieve relevant guides)
- lead-editor
- discovery-agent
- guide-server (MCP tool)

## Escalation Triggers
- guide-server is unavailable and the filesystem fallback also returns no results: surface this as a potential infrastructure issue and recommend running `/session-start` to verify tool connectivity.

## Tool Adapter Notes
- **Claude Code:** Calls guide-server search_guides via MCP tool call. Falls back to a Grep tool call on `.writing-framework/guides/` if guide-server is unavailable. Results are formatted in markdown for display.
- **Codex:** Invoke with "Find guides about [topic]" or "Run /find-guides query=[query]". Codex presents results inline in chat.
- **Windsurf:** Invoke via AI panel. Results are displayed as a formatted list in the AI panel response.
- **Copilot:** Invoke in Copilot Chat. Provide the query as a natural language phrase; Copilot constructs the search request.
