# /apply-style-pack

**Phase:** 2
**Status:** stub
**Owner:** lead-editor
**Category:** sync

## Purpose
Activates a style pack for the current session or document run by loading it from the local filesystem or guide-server, registering it as the active style pack in the run context, and outputting a summary of its voice traits, tone profile, vocabulary rules, and anti-patterns.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| style_pack_name | string | No | (none) | Name of the style pack to load; used to locate in .writing-framework/styles/ |
| style_pack_path | string | No | (none) | Direct path to a style pack file; takes precedence over style_pack_name if both provided |
| run_id | string | No | (active run) | Run context to register the active style pack against |
| override_existing | boolean | No | false | If true, replace any currently active style pack for the run; if false and a style pack is already active, warn and halt |

## Behavior
1. Validate that at least one of `style_pack_name` or `style_pack_path` is provided. If neither is given, surface a validation error and halt.
2. **Resolve the style pack:**
   - If `style_pack_path` is provided: attempt to read the file at that path. If not found, surface a B2 blocker and halt.
   - If `style_pack_name` is provided (and no path): search `.writing-framework/styles/` for a file matching the name (case-insensitive). If not found locally, call `/find-guides type=style_pack query={style_pack_name}` and attempt to load the top result's content from guide-server.
   - If the style pack cannot be found by either method: flag as a B2 blocker — do not proceed with the run without a valid style pack.
3. Parse the style pack content. Confirm it contains the required sections: voice traits, tone profile, vocabulary rules (permitted and forbidden terms), and anti-patterns. Log a warning for any missing section but do not block activation.
4. Check whether a style pack is already registered as active for the current `run_id`. If one is active and `override_existing` is false: warn the user and halt. If `override_existing` is true: log that the previous style pack is being replaced.
5. Register the loaded style pack as the active style pack in the run context via cache-server (or session state if cache-server is unavailable). Record: style_pack_name, style_pack_path, activated_at, run_id.
6. Output a style pack summary:
   - Style pack name and source path
   - Voice traits: bullet list
   - Tone profile: brief description
   - Vocabulary rules: key permitted terms, key forbidden/discouraged terms
   - Anti-patterns: list of patterns to avoid
   - Any sections that were missing or could not be parsed

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| active_style_pack | JSON | — | Registered style pack record in run context (name, path, activated_at) |
| style_pack_summary | markdown (stdout) | — | Formatted summary of voice traits, tone, vocabulary rules, and anti-patterns |

## Quality Gate
- The style pack file must be readable and parseable before it is registered as active.
- The active style pack must be recorded in the run context (cache-server or session state) so downstream agents can reference it.
- A B2 blocker must be raised if the style pack cannot be found or loaded — never allow a run to proceed with a missing style pack if one is required by the brief.

## Error Handling
- Style pack not found locally or in guide-server: raise a B2 blocker. List where the search was attempted (local styles directory, guide-server). Recommend running `/add-guide type=style_pack` to create the missing style pack.
- Style pack is found but missing required sections (e.g., no voice traits defined): activate with a warning. Surface the specific missing sections so the user or lead-editor can fill the gaps.
- A style pack is already active and `override_existing: false`: surface the name of the currently active style pack and ask the user to confirm the replacement before rerunning with `override_existing: true`.

## Related Commands
- Run after: `/write-brief` or `/session-start` (when the style pack is specified in the brief)
- Run before: `/voice-pass`, `/orchestrate-finalize`, `/orchestrate-draft`
- Related: `/apply-doctrine`, `/add-guide`, `/find-guides`

## Related Agents
- lead-editor
- voice-editor
- guide-server (MCP tool)

## Escalation Triggers
- Style pack required by brief (brief.json references a style_pack field) but the named pack cannot be found: escalate as B2 blocker. Do not begin drafting or finalization without the specified style pack resolved.

## Tool Adapter Notes
- **Claude Code:** Reads style pack file using the Read tool. Registers the active style pack in cache-server via MCP tool call. Outputs the summary as formatted markdown.
- **Codex:** Invoke with "Apply style pack [name]" or "Run /apply-style-pack style_pack_name=[name]".
- **Windsurf:** Invoke via AI panel. The style pack summary will appear in the AI panel response.
- **Copilot:** Invoke in Copilot Chat. Provide the style pack name or path in the invocation.
