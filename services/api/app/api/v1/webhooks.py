import hashlib
import hmac
import json
from typing import Any

from fastapi import APIRouter, Header, HTTPException, Request, status

from ...config import settings

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/razorpay", status_code=status.HTTP_200_OK)
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: str | None = Header(default=None),
    x_razorpay_event_id: str | None = Header(default=None),
) -> dict[str, Any]:
    """Validate Razorpay's raw webhook body before processing a payment event.

    Production persistence should store x_razorpay_event_id with a UNIQUE constraint
    before applying a state transition, making retries idempotent.
    """
    if not settings.razorpay_webhook_secret:
        raise HTTPException(status_code=503, detail="Payment webhook is not configured")
    if not x_razorpay_signature or not x_razorpay_event_id:
        raise HTTPException(status_code=400, detail="Missing webhook security headers")

    raw_body = await request.body()
    expected = hmac.new(
        settings.razorpay_webhook_secret.encode("utf-8"),
        raw_body,
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(expected, x_razorpay_signature):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    try:
        payload = json.loads(raw_body)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="Invalid webhook payload") from exc

    event = payload.get("event", "")
    # TODO: persist x_razorpay_event_id with a unique index, then transition the
    # subscription/order state. Never trust client-supplied payment status.
    supported_events = {
        "payment.authorized",
        "payment.captured",
        "payment.failed",
        "order.paid",
        "subscription.activated",
        "subscription.charged",
        "subscription.completed",
        "subscription.cancelled",
        "subscription.paused",
        "subscription.resumed",
    }
    if event not in supported_events:
        return {"received": True, "ignored": True, "event": event}

    return {"received": True, "event": event, "event_id": x_razorpay_event_id}
