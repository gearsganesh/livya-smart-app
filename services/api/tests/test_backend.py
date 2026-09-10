"""LIVYA FastAPI integration/security smoke tests.

Run from services/api with:
  python -m pytest -q tests/test_backend.py

No live database or AI server is required. Supabase JWKS is replaced by an
in-process RSA/JWKS fixture so the JWT verification path itself is exercised.
"""

import asyncio
from pathlib import Path
from types import SimpleNamespace

import httpx
import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi.testclient import TestClient

from app.ai.schemas import QuantifiedMetrics
from app.auth.service import auth_service
from app.main import app


@pytest.fixture(scope="module")
def rsa_fixture():
    private = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    public = private.public_key()
    numbers = public.public_numbers()
    to_b64 = lambda n: jwt.utils.base64url_encode(n.to_bytes((n.bit_length() + 7) // 8, "big")).decode()
    jwk = {"kty": "RSA", "kid": "livya-test-kid", "use": "sig", "alg": "RS256", "n": to_b64(numbers.n), "e": to_b64(numbers.e)}
    return private, jwk


def test_jwt_verification_against_jwks(monkeypatch, rsa_fixture):
    private, jwk = rsa_fixture

    async def fake_jwks():
        return {"keys": [jwk]}

    monkeypatch.setattr(auth_service, "jwks", fake_jwks)
    token = jwt.encode(
        {"sub": "00000000-0000-0000-0000-000000000001", "aud": "authenticated", "iss": auth_service.auth_url, "exp": 4102444800},
        private, algorithm="RS256", headers={"kid": jwk["kid"]},
    )
    claims = asyncio.run(auth_service.verify_token(token))
    assert claims["sub"] == "00000000-0000-0000-0000-000000000001"
    with pytest.raises(Exception):
        asyncio.run(auth_service.verify_token(token + "tampered"))


def test_middleware_rejects_missing_bearer():
    with TestClient(app) as client:
        response = client.get("/api/v1/check-ins")
        assert response.status_code == 401
        assert response.json()["detail"] == "Authentication required"


def test_cors_allows_configured_mobile_development_origins():
    with TestClient(app) as client:
        for origin in ("http://localhost:8081", "http://localhost:19006"):
            response = client.options("/api/v1", headers={"Origin": origin, "Access-Control-Request-Method": "GET"})
            assert response.status_code == 200
            assert response.headers.get("access-control-allow-origin") == origin
        blocked = client.options("/api/v1", headers={"Origin": "http://evil.invalid", "Access-Control-Request-Method": "GET"})
        assert "access-control-allow-origin" not in blocked.headers


def test_dynamic_ai_payload_does_not_echo_raw_input_or_create_disk_artifacts(monkeypatch, tmp_path):
    raw_secret = "PRIVATE-PAYLOAD-SENTINEL-DO-NOT-PERSIST"

    async def fake_process(payload):
        assert payload.text == raw_secret
        return SimpleNamespace(
            metrics=QuantifiedMetrics(mood=7, focus=8, physiological_load=2, recommendations=["Rest"], summary="Validated result", confidence=0.9),
            processor="test", model="test-model",
        )

    async def fake_verify(_token):
        return {"sub": "00000000-0000-0000-0000-000000000001"}

    monkeypatch.setattr("app.api.v1.ai.blind_processor.process", fake_process)
    monkeypatch.setattr("app.auth.dependencies.auth_service.verify_token", fake_verify)
    before = {p.relative_to(tmp_path) for p in tmp_path.rglob("*")}
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/ai/process", headers={"Authorization": "Bearer test-token"},
            json={"input_type": "text", "text": raw_secret, "context": {"source": "test"}},
        )
    after = {p.relative_to(tmp_path) for p in tmp_path.rglob("*")}
    assert response.status_code == 200
    assert raw_secret not in response.text
    assert after == before


def test_transport_configuration_is_explicit():
    middleware_names = {m.cls.__name__ for m in app.user_middleware}
    assert "CORSMiddleware" in middleware_names
    assert "HTTPSOnlyMiddleware" in middleware_names
    assert "AIRequestSizeMiddleware" in middleware_names


def test_httpx_dependency_is_available():
    assert httpx.__version__
