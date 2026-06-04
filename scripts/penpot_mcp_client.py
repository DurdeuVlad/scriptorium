#!/usr/bin/env python3
"""Minimal Penpot Streamable HTTP MCP client for execute_code when IDE MCP is unavailable."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

import urllib.request

import os

ROOT = Path(__file__).resolve().parents[1]
MCP_JSON = ROOT / ".cursor" / "mcp.json"
DESIGN_JS = ROOT / "docs" / "design" / "penpot-execute-negotiation-shell.js"
LOCAL_MCP_URL = "http://localhost:4401/mcp"

HEADERS_BASE = {
    "Content-Type": "application/json",
    "Accept": "application/json, text/event-stream",
}


def _mcp_alive(url: str, timeout: float = 2.0) -> bool:
    try:
        result, session = mcp_post(
            url,
            {
                "jsonrpc": "2.0",
                "id": 0,
                "method": "initialize",
                "params": {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {},
                    "clientInfo": {"name": "scriptorium-probe", "version": "1.0.0"},
                },
            },
        )
        return bool(session) and "error" not in result
    except Exception:
        return False


def load_endpoint() -> str:
    """Prefer PENPOT_MCP_URL, then live local MCP, then mcp.json entries."""
    env_url = os.environ.get("PENPOT_MCP_URL", "").strip()
    if env_url:
        return env_url
    if _mcp_alive(LOCAL_MCP_URL):
        return LOCAL_MCP_URL
    if MCP_JSON.is_file():
        data = json.loads(MCP_JSON.read_text(encoding="utf-8"))
        servers = data.get("mcpServers") or {}
        for key in ("penpot-local", "penpot"):
            entry = servers.get(key)
            if isinstance(entry, dict):
                url = (entry.get("url") or "").strip()
                if url and _mcp_alive(url):
                    return url
        for key in ("penpot-local", "penpot"):
            entry = servers.get(key)
            if isinstance(entry, dict):
                url = (entry.get("url") or "").strip()
                if url:
                    return url
    return LOCAL_MCP_URL


def parse_sse_or_json(body: str) -> dict:
    """Extract JSON-RPC result from plain JSON or SSE data lines."""
    body = body.strip()
    if not body:
        return {}
    if body.startswith("{"):
        return json.loads(body)
    for line in body.splitlines():
        line = line.strip()
        if line.startswith("data:"):
            payload = line[5:].strip()
            if payload and payload != "[DONE]":
                try:
                    return json.loads(payload)
                except json.JSONDecodeError:
                    continue
    # last resort: find first JSON object
    match = re.search(r"\{.*\}", body, re.DOTALL)
    if match:
        return json.loads(match.group(0))
    return {"raw": body}


def mcp_post(url: str, payload: dict, session_id: str | None = None) -> tuple[dict, str | None]:
    headers = dict(HEADERS_BASE)
    if session_id:
        headers["mcp-session-id"] = session_id
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        new_session = resp.headers.get("mcp-session-id") or resp.headers.get("Mcp-Session-Id")
        text = resp.read().decode("utf-8", errors="replace")
        return parse_sse_or_json(text), new_session


def initialize(url: str) -> str:
    result, session = mcp_post(
        url,
        {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": "scriptorium-agent", "version": "1.0.0"},
            },
        },
    )
    if not session:
        raise SystemExit(f"initialize failed: no mcp-session-id in response: {result}")
    mcp_post(url, {"jsonrpc": "2.0", "method": "notifications/initialized"}, session)
    print("MCP session:", session)
    if "error" in result:
        print("initialize note:", result.get("error"))
    return session


def call_tool(url: str, session: str, name: str, arguments: dict) -> dict:
    result, _ = mcp_post(
        url,
        {
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/call",
            "params": {"name": name, "arguments": arguments},
        },
        session,
    )
    return result


def extract_tool_text(result: dict) -> str:
    if "error" in result:
        return json.dumps(result["error"], indent=2)
    res = result.get("result", result)
    content = res.get("content") if isinstance(res, dict) else None
    if isinstance(content, list):
        parts = []
        for block in content:
            if isinstance(block, dict) and block.get("type") == "text":
                parts.append(block.get("text", ""))
        return "\n".join(parts) if parts else json.dumps(res, indent=2)[:4000]
    return json.dumps(res, indent=2)[:4000]


def main() -> int:
    url = load_endpoint()
    print("Endpoint host:", urlparse(url).netloc)

    session = initialize(url)

    overview = call_tool(url, session, "high_level_overview", {})
    print("\n--- high_level_overview ---")
    print(extract_tool_text(overview)[:2000])

    code = DESIGN_JS.read_text(encoding="utf-8")
    # execute_code expects a single expression/script with return
    exec_result = call_tool(url, session, "execute_code", {"code": code})
    print("\n--- execute_code (negotiation shell) ---")
    print(extract_tool_text(exec_result))

    if "error" in exec_result:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
