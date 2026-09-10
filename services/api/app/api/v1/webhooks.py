import hashlib
import hmac
import json
import time
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Header, HTTPException, Request, status
from sqlalchemy import text

from ...config import settings
from ...db import SessionLocal

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


def _safe_uuid(value: str | None) -> str | None:
    if not value:
        return None
    try:
        return str(UUID(value))
    except ValueError:
        return None


async def _record_and_transition(provider: str, event_id: str, event_type: str, payload: dict[str, Any], *, user_id: str | None, provider_customer_id: str | None, provider_subscription_id: str, product_id: str | None, entitlement: str | None, status_value: str, environment: str | None, period_end_ms: int | None = None) -> bool:
    async with SessionLocal() as session:
        inserted = await session.execute(
            text("""
                insert into public.payment_webhook_events
                    (provider, provider_event_id, event_type, payload, processed_at)
                values (:provider, :event_id, :event_type, cast(:payload as jsonb), now())
                on conflict (provider, provider_event_id) do nothing
                returning id
            """),
            {"provider": provider, "event_id": event_id, "event_type": event_type, "payload": json.dumps(payload)},
        )
        if inserted.scalar_one_or_none() is None:
            await session.rollback()
            return False

        await session.execute(
            text("""
                insert into public.subscriptions
                    (user_id, provider, provider_customer_id, provider_subscription_id,
                     product_id, entitlement, status, environment, current_period_end, metadata, updated_at)
                values (:user_id, :provider, :customer_id, :subscription_id,
                        :product_id, :entitlement, :status, :environment,
                        case when :period_end_ms is null then null else to_timestamp(:period_end_ms / 1000.0) end,
                        cast(:metadata as jsonb), now())
                on conflict (provider, provider_subscription_id) do update set
                    user_id = coalesce(excluded.user_id, public.subscriptions.user_id),
                    provider_customer_id = coalesce(excluded.provider_customer_id, public.subscriptions.provider_customer_id),
                    product_id = coalesce(excluded.product_id, public.subscriptions.product_id),
                    entitlement = coalesce(excluded.entitlement, public.subscriptions.entitlement),
                    status = excluded.status,
                    environment = coalesce(excluded.environment, public.subscriptions.environment),
                    current_period_end = excluded.current_period_end,
                    metadata = excluded.metadata,
                    updated_at = now()
            """),
            {"user_id": user_id, "provider": provider, "customer_id": provider_customer_id, "subscription_id": provider_subscription_id, "product_id": product_id, "entitlement": entitlement, "status": status_value, "environment": environment, "period_end_ms": period_end_ms, "metadata": json.dumps({"event_type": event_type})},
        )
        await session.commit()
        return True


@router.post("/razorpay", status_code=status.HTTP_200_OK)
async def razorpay_webhook(request: Request, x_razorpay_signature: str | None = Header(default=None), x_razorpay_event_id: str | None = Header(default=None)) -> dict[str, Any]:
    if not settings.razorpay_webhook_secret:
        raise HTTPException(status_code=503, detail="Payment webhook is not configured")
    if not x_razorpay_signature or not x_razorpay_event_id:
        raise HTTPException(status_code=400, detail="Missing webhook security headers")
    raw_body = await request.body()
    expected = hmac.new(settings.razorpay_webhook_secret.encode(), raw_body, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, x_razorpay_signature):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")
    try:
        payload = json.loads(raw_body)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="Invalid webhook payload") from exc

    event = payload.get("event", "")
    source = payload.get("payload", {}).get("subscription") or payload.get("payload", {}).get("payment") or payload.get("payload", {}).get("order")
    entity = (source or {}).get("entity", {})
    status_map = {"subscription.activated": "active", "subscription.charged": "active", "subscription.resumed": "active", "subscription.paused": "paused", "subscription.cancelled": "cancelled", "subscription.completed": "expired", "payment.failed": "billing_issue", "payment.captured": "active", "payment.authorized": "active", "order.paid": "active"}
    if event not in status_map:
        return {"received": True, "ignored": True, "event": event}
    notes = entity.get("notes") or {}
    await _record_and_transition("razorpay", x_razorpay_event_id, event, payload, user_id=_safe_uuid(notes.get("user_id")), provider_customer_id=entity.get("customer_id"), provider_subscription_id=entity.get("id") or x_razorpay_event_id, product_id=notes.get("product_id"), entitlement=notes.get("entitlement"), status_value=status_map[event], environment=notes.get("environment"))
    return {"received": True, "event": event, "event_id": x_razorpay_event_id}


@router.post("/revenuecat", status_code=status.HTTP_200_OK)
async def revenuecat_webhook(request: Request, x_revenuecat_webhook_signature: str | None = Header(default=None)) -> dict[str, Any]:
    if not settings.revenuecat_webhook_secret:
        raise HTTPException(status_code=503, detail="RevenueCat webhook is not configured")
    if not x_revenuecat_webhook_signature:
        raise HTTPException(status_code=400, detail="Missing RevenueCat signature")
    raw_body = await request.body()
    parts = dict(item.split("=", 1) for item in x_revenuecat_webhook_signature.split(",") if "=" in item)
    timestamp, signature = parts.get("t"), parts.get("v1")
    try:
        if not timestamp or abs(time.time() - int(timestamp)) > 300:
            raise ValueError
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired RevenueCat signature") from exc
    expected = hmac.new(settings.revenuecat_webhook_secret.encode(), f"{timestamp}.".encode() + raw_body, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, signature or ""):
        raise HTTPException(status_code=401, detail="Invalid RevenueCat signature")
    try:
        payload = json.loads(raw_body)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="Invalid webhook payload") from exc

    event = payload.get("event", {})
    event_id, event_type = event.get("id"), event.get("type", "")
    if not event_id:
        raise HTTPException(status_code=400, detail="Missing RevenueCat event id")
    status_map = {"INITIAL_PURCHASE": "active", "RENEWAL": "active", "UNCANCELLATION": "active", "CANCELLATION": "cancelled", "EXPIRATION": "expired", "BILLING_ISSUE": "billing_issue", "SUBSCRIPTION_PAUSED": "paused", "NON_RENEWING_PURCHASE": "active"}
    if event_type not in status_map:
        return {"received": True, "ignored": True, "event": event_type}
    entitlement_ids = event.get("entitlement_ids") or []
    await _record_and_transition("revenuecat", event_id, event_type, payload, user_id=_safe_uuid(event.get("app_user_id")), provider_customer_id=event.get("original_app_user_id"), provider_subscription_id=event.get("transaction_id") or event.get("product_id") or event_id, product_id=event.get("product_id"), entitlement=entitlement_ids[0] if entitlement_ids else None, status_value=status_map[event_type], environment=event.get("environment"), period_end_ms=event.get("expiration_at_ms"))
    return {"received": True, "event": event_type, "event_id": event_id}
