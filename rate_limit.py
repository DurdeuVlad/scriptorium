"""Minimal in-memory rate limiting for the app's most expensive
operations (project creation, pipeline runs that make real LLM calls)
and a cap on concurrent WebSocket connections.

Deliberately not distributed/Redis-backed: this app targets single-process
self-hosted deployment (see README.md's maturity table), so an in-memory
sliding window is the right amount of complexity. Every limiter defaults
to a sane non-zero value so protection is on even if nobody configures
anything -- this matters more than usual here, since API_AUTH_TOKEN
(auth.py) is opt-in, so rate limiting is often the *only* protection
against a runaway or abusive client.

Keyed by client identity: prefers X-Forwarded-For / X-Real-IP (set by
the nginx reverse proxy in docker-compose.yml's "prod" profile) and
falls back to the direct connection's peer address. Trusting forwarded
headers is only meaningful when the app truly sits behind that proxy;
if it's reachable directly, a client could spoof this to evade limits --
an accepted limitation for a self-hosted single-operator tool, not a
distributed adversarial deployment.
"""

import os
import time
from collections import defaultdict, deque
from typing import Deque, Dict


class RateLimiter:
    """Sliding-window limiter: at most max_requests per window_seconds,
    per key. max_requests <= 0 disables limiting for this instance."""

    def __init__(self, max_requests: int, window_seconds: float):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._hits: Dict[str, Deque[float]] = defaultdict(deque)

    def allow(self, key: str) -> bool:
        if self.max_requests <= 0:
            return True
        now = time.monotonic()
        hits = self._hits[key]
        while hits and now - hits[0] > self.window_seconds:
            hits.popleft()
        if len(hits) >= self.max_requests:
            return False
        hits.append(now)
        return True


def _int_env(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, default))
    except ValueError:
        return default


PROJECT_CREATE_LIMITER = RateLimiter(
    max_requests=_int_env("RATE_LIMIT_PROJECT_CREATE_PER_HOUR", 20),
    window_seconds=3600,
)
PIPELINE_RUN_LIMITER = RateLimiter(
    max_requests=_int_env("RATE_LIMIT_PIPELINE_RUNS_PER_HOUR", 30),
    window_seconds=3600,
)
MAX_CONCURRENT_WS_CONNECTIONS = _int_env("MAX_CONCURRENT_WS_CONNECTIONS", 50)


def client_key(conn) -> str:
    """conn is a FastAPI/Starlette Request or WebSocket -- both expose
    .headers and .client the same way."""
    headers = conn.headers
    forwarded = headers.get("x-forwarded-for") or headers.get("x-real-ip")
    if forwarded:
        return forwarded.split(",")[0].strip()
    client = getattr(conn, "client", None)
    return client.host if client else "unknown"
