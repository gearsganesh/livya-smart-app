from __future__ import annotations

import ssl

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from ..config import settings


class HTTPSOnlyMiddleware(BaseHTTPMiddleware):
    """Reject clear-text API access in production.

    TLS itself should be terminated by the trusted ingress/load balancer. The
    middleware honors X-Forwarded-Proto only when running behind that edge.
    """

    async def dispatch(self, request: Request, call_next):
        if settings.require_https and settings.app_env.lower() not in {"development", "test"}:
            forwarded = request.headers.get("x-forwarded-proto", "").split(",", 1)[0].strip().lower()
            if request.url.scheme != "https" and forwarded != "https":
                return JSONResponse(status_code=426, content={"detail": "HTTPS/TLS 1.3 is required"})
        return await call_next(request)


def build_tls_context(certfile: str, keyfile: str) -> ssl.SSLContext:
    """Build an edge/uvicorn TLS context that permits TLS 1.3 only."""
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.minimum_version = ssl.TLSVersion.TLSv1_3
    context.maximum_version = ssl.TLSVersion.TLSv1_3
    context.load_cert_chain(certfile=certfile, keyfile=keyfile)
    return context
