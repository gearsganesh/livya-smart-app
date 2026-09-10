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


class DashboardResponse(BaseModel):
    healthScore: int = Field(ge=0, le=100)
    hydrationMl: int = Field(ge=0)
    mood: int = Field(ge=0, le=10)
    focus: int = Field(ge=0, le=10)
    note: str | None = None


@router.get("/dashboard", response_model=DashboardResponse)
async def dashboard(user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text("""
            select body
            from public.journal_entries
            where user_id = :user_id
            order by created_at desc
            limit 1
        """),
        {"user_id": user["id"]},
    )
    row = result.first()
    return DashboardResponse(healthScore=78, hydrationMl=1200, mood=7, focus=7, note=row[0] if row else None)


@router.post("/check-ins", response_model=DashboardResponse)
async def create_check_in(
    payload: CheckInRequest,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(
        text("""
            insert into public.journal_entries (user_id, entry_date, title, body, metadata)
            values (:user_id, :entry_date, 'Daily check-in', :body, '{}'::jsonb)
        """),
        {"user_id": user["id"], "entry_date": date.today(), "body": payload.note},
    )
    await db.commit()
    return DashboardResponse(healthScore=78, hydrationMl=1200, mood=7, focus=7, note=payload.note)
