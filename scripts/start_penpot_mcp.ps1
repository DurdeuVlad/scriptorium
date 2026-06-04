# Start Penpot MCP locally (plugin :4400, HTTP MCP :4401, WebSocket :4402).
# Keep this window open while using Penpot + Cursor.
Set-Location $PSScriptRoot\..
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
  Write-Host "Installing pnpm (required by @penpot/mcp)..."
  npm install -g pnpm@9.15.0 | Out-Null
}
Write-Host "Starting @penpot/mcp@stable (first run may take ~60s to build)..."
Write-Host "After it starts:"
Write-Host "  1. Open https://penpot.dwurdy.com and your design file"
Write-Host "  2. Plugins -> Load from URL -> http://localhost:4400/manifest.json"
Write-Host "  3. In the plugin panel: Connect to MCP server (status: Connected)"
Write-Host "  4. In another terminal: python scripts/penpot_mcp_build.py"
Write-Host ""
npx -y @penpot/mcp@stable
