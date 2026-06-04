# Scriptorium design tokens

Source of truth for the React UI (`frontend/src/index.css` and shell components).

## Color

| Token | CSS variable | Hex |
|-------|--------------|-----|
| bg/primary | `--bg-primary` | `#0d0e12` |
| bg/secondary | `--bg-secondary` | `#161821` |
| bg/tertiary | `--bg-tertiary` | `#1f2230` |
| border/default | `--border-color` | `#2a2d3d` |
| text/primary | `--text-primary` | `#f3f4f6` |
| text/secondary | `--text-secondary` | `#9ca3af` |
| text/muted | `--text-muted` | `#6b7280` |
| accent/default | `--accent-color` | `#d4a574` |
| accent/hover | `--accent-hover` | `#e8c9a0` |
| accent/subtle | `--accent-light` | `rgba(212, 165, 116, 0.12)` |
| success | `--success-color` | `#10b981` |
| warning | `--warning-color` | `#f59e0b` |
| danger | `--danger-color` | `#ef4444` |

## Layout

| Token | Value |
|-------|-------|
| Header height | `56px` |
| Nav width | `240px` |
| Assistant drawer | `320px` |
| Assistant strip (collapsed) | `48px` |

## Typography

- Sans: Outfit 15–16px for plan prose; UI labels 11–13px uppercase where noted
- Mono: Fira Code for chapter IDs and editor content

## Motion

| Token | Value |
|-------|-------|
| `--motion-fast` | `150ms` |
| `--motion-normal` | `250ms` |
| `--motion-slow` | `600ms` |
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` |

See [`frontend/src/styles/animations.css`](../frontend/src/styles/animations.css). Respects `prefers-reduced-motion`.
