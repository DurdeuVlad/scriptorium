# Penpot MCP — design-first workflow

Iterate on Scriptorium UI in your self-hosted Penpot **before** large React/CSS changes. Use Playwright MCP afterward to verify the implemented UI matches the signed-off design.

## Security

- Generate the MCP key in Penpot: **Your account → Integrations → MCP Server**.
- **Never commit** the `userToken` to git. If a key was shared in chat or logs, **regenerate** it in Penpot and update your local Cursor config only.
- Treat the MCP URL like a password.

## Enable Penpot in Cursor

1. Penpot: enable MCP, copy server URL from Integrations (includes `userToken`).
2. Cursor: **Settings → MCP** → add server (merge with project Playwright entry):

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    },
    "penpot": {
      "url": "https://YOUR_PENPOT_HOST/mcp/stream?userToken=YOUR_MCP_KEY"
    }
  }
}
```

3. Reload MCP servers in Cursor (restart or “Refresh MCP”).
4. In Penpot: open a file → **File → MCP Server → Connect** (plugin must stay connected).
5. Confirm tools appear (`high_level_overview`, `execute_code`, `export_shape`, etc. per your Penpot version).

Copy the template from [`.cursor/mcp.json.example`](../.cursor/mcp.json.example) — do not put real tokens in the repo.

## Design workflow

| Step | Tool | Action |
|------|------|--------|
| 1 | This repo | Read [design/SCRIPTORIUM_PENPOT_BRIEF.md](design/SCRIPTORIUM_PENPOT_BRIEF.md) |
| 2 | Penpot | New file *Scriptorium — Product UI v1* |
| 3 | Penpot MCP | Read-only overview of page / list structure |
| 4 | Penpot MCP | Build frames: Negotiation, Drafting, Preview + component library |
| 5 | You | Review contrast, outline readability, Approve placement |
| 6 | Penpot MCP | `export_shape` for key frames (reference in PR) |
| 7 | Code | Map tokens to `index.css` / `App.css` |
| 8 | Playwright MCP | [UI_REVIEW.md](UI_REVIEW.md) smoke + screenshots |

## Prerequisites (Penpot help)

- MCP operates on the **currently focused page** in the **active** Penpot browser tab.
- Remote MCP cannot import local files via path; use Penpot assets or export from browser.
- Prefer **frontier / vision-capable** models for layout and visual tasks.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `MCP server does not exist: penpot` | Add server in Cursor user/project MCP settings and reload |
| Tools empty | Connect plugin in Penpot file; check MCP enabled in account |
| `No plugin instance connected` | See **Connect does nothing** below — Cursor MCP alone is not enough |
| **File → MCP Server → Connect does nothing** | Open DevTools (F12) → Console + Network; look for WebSocket errors. Try **Local MCP workaround** below. On self-hosted, confirm Penpot is a recent build with MCP plugin support and that your reverse proxy allows WebSockets to the Penpot host. |
| Agent cannot write | Focus correct page/tab; confirm key not expired |
| Wrong file updated | Switch focused page in Penpot before prompting |

### Local MCP workaround (when remote Connect is dead)

Use this on `penpot.dwurdy.com` (or any host) when Integrations + Cursor work but **Connect** never links the file.

**Prerequisite:** `pnpm` must be on PATH. If `npx @penpot/mcp@stable` fails with `pnpm install`, run `npm install -g pnpm@9.15.0` once.

**Quick start (Windows):**

```powershell
.\scripts\start_penpot_mcp.ps1          # leave running (~60s first boot)
.\scripts\open_penpot_plugin_connect.ps1
python scripts\penpot_mcp_build.py      # polls until plugin connects, then builds frames
```

1. In a terminal: `npx -y @penpot/mcp@stable` (leave running; ports 4400 plugin, 4401 MCP, 4402 WebSocket).
2. In Penpot (your file open): **Plugins → Load from URL** → `http://localhost:4400/manifest.json`
3. Run the plugin → click **Connect to MCP server** until status is **Connected** (keep plugin panel open).
4. In Cursor MCP config, add a second server (or temporarily replace remote):

```json
"penpot-local": {
  "url": "http://localhost:4401/mcp",
  "type": "http"
}
```

5. Reload MCP in Cursor. Agent uses `penpot-local` for `execute_code`.

Chromium may block `https` → `http://localhost`; allow local network access for the Penpot tab or try Firefox.

## Links

- [Penpot MCP help](https://help.penpot.app/mcp/)
- [Penpot MCP docs (repo)](https://github.com/penpot/penpot/blob/main/docs/mcp/index.md)
