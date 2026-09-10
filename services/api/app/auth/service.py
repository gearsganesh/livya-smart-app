from __future__ import annotations

import time
from typing import Any

import httpx
import jwt
from fastapi import HTTPException, status

from ..config import settings


class AuthService:
    def __init__(self) -> None:
        self._jwks: dict[str, Any] | None = None
        self._jwks_loaded_at = 0.0

    @property
    def base_url(self) -> str:
        if not settings.supabase_url:
            raise HTTPException(status_code=500, detail="Supabase URL is not configured")
        return settings.supabase_url.rstrip("/")

    @property
    def auth_url(self) -> str:
        return f"{self.base_url}/auth/v1"

    @property
    def headers(self) -> dict[str, str]:
        if not settings.supabase_publishable_key:
            raise HTTPException(status_code=500, detail="Supabase publishable key is not configured")
        return {"apikey": settings.supabase_publishable_key, "Content-Type": "application/json"}

    async def _request(self, method: str, path: str, **kwargs: Any) -> dict[str, Any]:
        headers = {**self.headers, **kwargs.pop("headers", {})}
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.request(method, f"{self.auth_url}{path}", headers=headers, **kwargs)
        if response.is_error:
            detail = response.text
            try:
                payload = response.json()
                detail = payload.get("msg") or payload.get("message") or payload.get("error_description") or detail
            except ValueError:
                pass
            raise HTTPException(status_code=response.status_code, detail=detail)
        return response.json()

    async def signup(self, email: str, password: str, name: str | None) -> dict[str, Any]:
        data: dict[str, Any] = {"email": email, "password": password}
        if name:
            data["data"] = {"name": name, "full_name": name}
        return await self._request("POST", "/signup", json=data)

    async def login(self, email: str, password: str) -> dict[str, Any]:
        return await self._request("POST", "/token?grant_type=password", json={"email": email, "password": password})

    async def refresh(self, refresh_token: str) -> dict[str, Any]:
        return await self._request("POST", "/token?grant_type=refresh_token", json={"refresh_token": refresh_token})

    async def get_user(self, access_token: str) -> dict[str, Any]:
        return await self._request("GET", "/user", headers={"Authorization": f"Bearer {access_token}"})

    async def jwks(self) -> dict[str, Any]:
        now = time.monotonic()
        if self._jwks and now - self._jwks_loaded_at < 3600:
            return self._jwks
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(f"{self.auth_url}/.well-known/jwks.json", headers={"apikey": settings.supabase_publishable_key})
        if response.is_success:
            self._jwks = response.json()
            self._jwks_loaded_at = now
            return self._jwks
        return {"keys": []}

    async def verify_token(self, token: str) -> dict[str, Any]:
        jwks = await self.jwks()
        keys = jwks.get("keys", [])
        if keys:
            try:
                header = jwt.get_unverified_header(token)
                key_data = next((key for key in keys if key.get("kid") == header.get("kid")), None)
                if not key_data:
                    raise ValueError("Unknown signing key")
                if key_data.get("kty") == "RSA":
                    signing_key = jwt.algorithms.RSAAlgorithm.from_jwk(key_data)
                elif key_data.get("kty") == "EC":
                    signing_key = jwt.algorithms.ECAlgorithm.from_jwk(key_data)
                else:
                    raise ValueError("Unsupported signing key type")
                return jwt.decode(token, signing_key, algorithms=[header.get("alg", "ES256")], audience="authenticated", issuer=self.auth_url)
            except (jwt.PyJWTError, ValueError, TypeError) as exc:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired access token") from exc

        # Legacy projects with symmetric signing secrets are verified by Supabase Auth itself.
        try:
            return await self._verified_user_claims(token)
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unable to verify access token") from exc

    async def _verified_user_claims(self, token: str) -> dict[str, Any]:
        return await self.get_user(token)


auth_service = AuthService()
