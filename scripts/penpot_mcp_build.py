#!/usr/bin/env python3
"""Wait for Penpot plugin, then run execute_code to build negotiation shell."""

from __future__ import annotations

import json
import sys
import time

# Unbuffered logs when run from automation
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(line_buffering=True)
from pathlib import Path

# Reuse client helpers from penpot_mcp_client
sys.path.insert(0, str(Path(__file__).resolve().parent))
from penpot_mcp_client import (  # noqa: E402
    call_tool,
    extract_tool_text,
    initialize,
    load_endpoint,
)

PING = "return (typeof penpot !== 'undefined' && penpot.root) ? 'connected:' + penpot.root.name : 'no-root';"

DESIGN_ROOT = Path(__file__).resolve().parents[1] / "docs" / "design"
FRAMES = [
    DESIGN_ROOT / "penpot-execute-negotiation-shell.js",
    DESIGN_ROOT / "penpot-execute-drafting-shell.js",
    DESIGN_ROOT / "penpot-execute-preview-shell.js",
]


def plugin_ready(url: str, session: str) -> bool:
    probe = call_tool(url, session, "execute_code", {"code": PING})
    text = extract_tool_text(probe)
    return "connected:" in text and "No plugin instance" not in text


def wait_for_plugin(url: str, session: str, max_wait: int = 300, interval: int = 8) -> bool:
    elapsed = 0
    print(
        f"Waiting for Penpot plugin (up to {max_wait}s). "
        "Local MCP: Plugins > Load http://localhost:4400/manifest.json > Connect. "
        "Remote: File > MCP Server > Connect."
    )
    while elapsed < max_wait:
        if plugin_ready(url, session):
            print(f"Plugin ready at {elapsed}s")
            return True
        print(f"  [{elapsed}s] plugin not connected yet")
        time.sleep(interval)
        elapsed += interval
    return False


def main() -> int:
    url = load_endpoint()
    session = initialize(url)

    if not wait_for_plugin(url, session):
        print(
            "\nBlocked: start local MCP (scripts/start_penpot_mcp.ps1), open your Penpot file, "
            "load plugin from http://localhost:4400/manifest.json, click Connect, then re-run:\n"
            "  python scripts/penpot_mcp_build.py"
        )
        return 2

    for path in FRAMES:
        print(f"\n--- {path.name} ---")
        code = path.read_text(encoding="utf-8")
        result = call_tool(url, session, "execute_code", {"code": code})
        text = extract_tool_text(result)
        print(text)
        if "error" in result or "failed" in text.lower() or "No plugin instance" in text:
            return 1

    print("\nDone: Negotiation, Drafting, and Preview frames created on canvas.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
