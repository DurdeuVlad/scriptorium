# normalize-artifact

**Category:** Artifacts
**Phase:** 5 — Artifact Production

## Purpose
Normalize a draft document to the active voice pack and style pack before artifact export. Run after parallel section drafting or after a merge to ensure consistent voice, heading style, and formatting across the full document.

## Inputs
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| source | string | yes | Path to draft document to normalize |
| output_path | string | no | Output path. Default: writes normalized version alongside source with `.normalized.md` suffix. |
| style_pack | string | no | Style pack to normalize against. Inherits from session if omitted. |
| voice_pack | string | no | Voice pack to normalize against. Inherits from session if omitted. |
| dry_run | boolean | no | Report normalization changes without applying. Default: false. |

## Outputs
- Writes normalized document to output_path
- Returns normalization report: list of changes by section (voice corrections, heading fixes, formatting adjustments)

## Behavior
1. Load source document and active style/voice packs
2. For each section: check against voice pack patterns (forbidden constructions, sentence length, register)
3. Apply heading normalization (consistent levels, consistent capitalization style)
4. Apply paragraph-level style rules (spacing, list format)
5. Output normalized document
6. Produce normalization summary

## Blockers
| Code | Condition |
|------|-----------|
| B4 | Source file not found |
| B3 | No style pack or voice pack loaded |

## Related Commands
- `/voice-pass` — voice-only normalization pass
- `/merge-draft` — merge step that triggers normalization
- `/write-markdown` — render after normalization
