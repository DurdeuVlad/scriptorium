# Start local Penpot MCP, wait for HTTP port, then run build script (polls for plugin).
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

$mcpJob = Start-Job -ScriptBlock {
    Set-Location $using:root
    npx -y @penpot/mcp@stable 2>&1
}

Write-Host "Waiting for http://localhost:4401/mcp ..."
$ready = $false
for ($i = 0; $i -lt 60; $i++) {
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:4401/mcp" -Method Post `
            -ContentType "application/json" `
            -Body '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"probe","version":"1"}}}' `
            -TimeoutSec 3 -ErrorAction Stop
        if ($r.Headers["mcp-session-id"]) { $ready = $true; break }
    } catch {
        # not up yet
    }
    Start-Sleep -Seconds 2
}

if (-not $ready) {
    Write-Host "Local MCP did not become ready in 120s. Check job output:"
    Receive-Job $mcpJob -Keep | Select-Object -Last 30
    exit 1
}

Write-Host "Local MCP is up. Connect the browser plugin, then building frames..."
$env:PENPOT_MCP_URL = "http://localhost:4401/mcp"
python scripts/penpot_mcp_build.py
$code = $LASTEXITCODE
if ($code -ne 0) {
    Write-Host ""
    Write-Host "Plugin not connected yet? In Penpot:"
    Write-Host "  Plugins -> Load http://localhost:4400/manifest.json -> Connect"
    Write-Host "Then: python scripts/penpot_mcp_build.py"
}
exit $code
