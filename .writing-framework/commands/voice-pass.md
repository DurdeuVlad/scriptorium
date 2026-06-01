# /voice-pass

**Phase:** 3
**Status:** stub
**Owner:** voice-editor
**Category:** editorial

## Purpose
Apply a voice and style consistency pass to a document using the active style pack. Identifies all deviations from voice, tone, terminology, and formatting rules and applies corrections throughout.

## Inputs
| Input | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| draft | file path or string | Yes | (none) | Document to apply voice pass to |
| style_pack | string | No | (active style pack) | Style pack name to apply |

## Behavior
1. Load the draft.
2. Identify the active style pack: use `style_pack` argument if provided; otherwise use the style pack from session context or brief.
3. Load the style pack definition from `styles/`. Extract: voice rules, tone rules, sentence structure preferences, terminology list, prohibited patterns, formatting rules.
4. Invoke `voice-editor` agent to apply a systematic pass:
   a. Scan for and correct: prohibited terms (replace with preferred alternatives from style pack).
   b. Scan for and correct: tone deviations (register shifts that don't match the audience relationship defined in the style pack).
   c. Scan for and correct: sentence structure deviations (patterns explicitly disallowed by the style pack).
   d. Scan for and correct: formatting violations (heading styles, list styles, emphasis usage).
   e. Flag (do not auto-correct): any passage where applying the style pack would change meaning, not just register.
5. Apply AI-stink check as a final pass.
6. Output the corrected document and a list of all corrections applied.

## Outputs
| Output | Type | Schema | Notes |
|--------|------|--------|-------|
| styled_draft | markdown (stdout + file) | none | Document with voice corrections applied |
| style_correction_log | markdown (stdout) | none | List of corrections applied, with type and location |

## Quality Gate
- All prohibited terms must be replaced.
- No tone deviations may remain in the output.
- Meaning-changing passages must be flagged, not auto-corrected.

## Error Handling
- Style pack not found: list available style packs; ask user to select one before proceeding.
- Draft not found: report error.
- Style pack definition is incomplete: apply what is defined; note which rules could not be applied.

## Related Commands
- Run after: `/line-edit`, `/compress`
- Run before: `/qa-style`, `/canon-check`
- `/apply-style-pack` — for setting the active style pack

## Related Agents
- voice-editor

## Escalation Triggers
- None. Voice pass is a fully autonomous editing operation.

## Tool Adapter Notes
- **Claude Code:** Reads style pack from styles/, applies pass, writes corrected file, logs corrections in chat.
- **Codex:** Invoke with "Apply the voice pass" or "Run /voice-pass".
- **Windsurf:** Invoke via AI panel.
- **Copilot:** Invoke in Copilot Chat.
