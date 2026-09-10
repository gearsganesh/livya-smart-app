from __future__ import annotations

from typing import Any, Callable

from fastapi import HTTPException, Request, status
from starlette.middleware.base import BaseHTTPMiddleware

from .service import auth_service

PUBLIC_PATHS = {
    "/health",
    "/api/v1",
    "/api/v1/auth/signup",
    "/api/v1/auth/login",
    "/api/v1/auth/refresh",
    "/api/v1/webhooks/razorpay",
    "/api/v1/webhooks/revenuecat",
}


async def get_current_user(request: Request) -> dict[str, Any]:
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    return user


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable):
        if request.method == "OPTIONS" or request.url.path in PUBLIC_PATHS:
            return await call_next(request)
        authorization = request.headers.get("Authorization", "")
        if not authorization.startswith("Bearer "):
            return await self._unauthorized()
        token = authorization.removeprefix("Bearer ").strip()
        if not token:
            return await self._unauthorized()
        try:
            request.state.user = await auth_service.verify_token(token)
            request.state.access_token = token
        except HTTPException as exc:
            return await self._json_error(exc.status_code, str(exc.detail))
        return await call_next(request)

    async def _unauthorized(self):
        return await self._json_error(401, "Authentication required")

    async def _json_error(self, code: int, detail: str):
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=code, content={"detail": detail})
