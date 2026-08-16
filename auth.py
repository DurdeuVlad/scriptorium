"""Optional shared-bearer-token auth for the whole API + WebSocket surface.

Scriptorium ships with no authentication by default (documented in
README.md's maturity table and docker-compose.yml's "prod" profile
comment) -- this module makes it possible to actually gate access when
API_AUTH_TOKEN is set, without changing anything for the existing
unauthenticated local-dev workflow when it isn't.

Applied as a single global ASGI middleware (see ApiTokenAuthMiddleware)
rather than a per-route dependency, deliberately: this codebase's own
security history (see scriptorium#12's review chain) showed that
per-endpoint checks are easy to add to every route but one. A single
gate in front of the whole app can't have that failure mode.
"""

import os
import secrets

API_AUTH_TOKEN = os.environ.get("API_AUTH_TOKEN", "").strip()

# Paths that stay reachable without a token even when API_AUTH_TOKEN is
# set, e.g. so a container orchestrator's health check doesn't need the
# secret.
EXEMPT_HTTP_PATHS = {"/health"}


def _extract_bearer_token(raw_header_value: str) -> str:
    if raw_header_value.startswith("Bearer "):
        return raw_header_value[len("Bearer "):].strip()
    return ""


def is_valid_token(provided: str) -> bool:
    if not API_AUTH_TOKEN:
        # Auth disabled -- unset API_AUTH_TOKEN means "local/dev mode",
        # matching this app's documented default (no auth).
        return True
    if not provided:
        return False
    # Compare as bytes: secrets.compare_digest raises TypeError on str
    # arguments containing non-ASCII characters, and `provided` is
    # attacker-controlled request input.
    return secrets.compare_digest(provided.encode("utf-8", "replace"), API_AUTH_TOKEN.encode("utf-8"))


class ApiTokenAuthMiddleware:
    """Raw ASGI middleware (not BaseHTTPMiddleware, which doesn't apply
    correctly to websocket scopes) gating both HTTP and WebSocket traffic
    behind API_AUTH_TOKEN. A complete no-op, for every request, when
    API_AUTH_TOKEN is unset."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if not API_AUTH_TOKEN or scope["type"] not in ("http", "websocket"):
            await self.app(scope, receive, send)
            return

        if scope["type"] == "http" and (
            scope.get("path") in EXEMPT_HTTP_PATHS or scope.get("method") == "OPTIONS"
        ):
            # CORS preflight requests never carry the app's own
            # Authorization header -- browsers don't attach it to
            # OPTIONS. This middleware is added after CORSMiddleware in
            # app.py, which in Starlette makes it the *outer* layer (it
            # runs before CORSMiddleware, not after), so without this
            # exemption every preflight would get a bare 401 with none
            # of CORSMiddleware's Access-Control-Allow-* headers
            # attached, silently breaking any cross-origin deployment
            # the moment API_AUTH_TOKEN is set.
            await self.app(scope, receive, send)
            return

        headers = dict(scope.get("headers") or [])
        raw = headers.get(b"authorization", b"").decode("latin-1")
        provided = _extract_bearer_token(raw)

        if not is_valid_token(provided):
            if scope["type"] == "websocket":
                await send({"type": "websocket.close", "code": 4401})
            else:
                await send({
                    "type": "http.response.start",
                    "status": 401,
                    "headers": [(b"content-type", b"application/json")],
                })
                await send({
                    "type": "http.response.body",
                    "body": b'{"detail":"Unauthorized"}',
                })
            return

        await self.app(scope, receive, send)
