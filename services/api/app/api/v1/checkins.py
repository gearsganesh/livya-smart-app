from datetime import date

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from ...auth.dependencies import get_current_user
from ...db import get_db

router = APIRouter(tags=["check-ins"])


class CheckInRequest(BaseModel):
    note: str = Field(min_length=1, max_length=2000)
    mood: int | None = Field(default=None, ge=0, le=10)
    focus: int | None = Field(default=None, ge=0, le=10)
    hydrationMl: int | None = Field(default=None, ge=0, le=10000)


class DashboardResponse(BaseModel):
    healthScore: int = Field(ge=0, le=100)
    hydrationMl: int = Field(ge=0)
    mood: int = Field(ge=0, le=10)
    focus: int = Field(ge=0, le=10)
    note: str | None = None


async def _dashboard_state(db: AsyncSession, user_id: str) -> DashboardResponse:
    journal = (await db.execute(
        text("""
            select body, metadata
            from public.journal_entries
            where user_id = :user_id
            order by created_at desc
            limit 1
        """),
        {"user_id": user_id},
    )).first()

    metrics = (await db.execute(
        text("""
            select distinct on (metric_type) metric_type, value
            from public.health_metrics
            where user_id = :user_id
              and metric_type in ('health_score', 'hydration_ml', 'mood', 'focus')
            order by metric_type, recorded_at desc
        """),
        {"user_id": user_id},
    )).all()
    latest = {row[0]: row[1] for row in metrics}
    metadata = (journal[1] or {}) if journal else {}

    def bounded(name: str, fallback: int, low: int, high: int) -> int:
        raw = latest.get(name, metadata.get(name, fallback))
        try:
            return max(low, min(high, int(raw)))
        except (TypeError, ValueError):
            return fallback

    return DashboardResponse(
        healthScore=bounded('health_score', 0, 0, 100),
        hydrationMl=bounded('hydration_ml', 0, 0, 10000),
        mood=bounded('mood', 0, 0, 10),
        focus=bounded('focus', 0, 0, 10),
        note=journal[0] if journal else None,
    )


@router.get("/dashboard", response_model=DashboardResponse)
async def dashboard(user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await _dashboard_state(db, user["id"])


@router.post("/check-ins", response_model=DashboardResponse)
async def create_check_in(
    payload: CheckInRequest,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    metadata = {
        key: value
        for key, value in {
            'mood': payload.mood,
            'focus': payload.focus,
            'hydration_ml': payload.hydrationMl,
        }.items()
        if value is not None
    }
    await db.execute(
        text("""
            insert into public.journal_entries (user_id, entry_date, title, body, metadata)
            values (:user_id, :entry_date, 'Daily check-in', :body, cast(:metadata as jsonb))
        """),
        {"user_id": user["id"], "entry_date": date.today(), "body": payload.note, "metadata": __import__('json').dumps(metadata)},
    )
    for metric_type, value in metadata.items():
        await db.execute(
            text("""
                insert into public.health_metrics (user_id, metric_type, value, unit, source)
                values (:user_id, :metric_type, :value, :unit, 'check_in')
            """),
            {
                "user_id": user["id"],
                "metric_type": metric_type,
                "value": value,
                "unit": 'ml' if metric_type == 'hydration_ml' else 'score',
            },
        )
    await db.commit()
    return await _dashboard_state(db, user["id"])
