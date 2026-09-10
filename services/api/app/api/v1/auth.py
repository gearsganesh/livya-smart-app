from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ...auth.dependencies import get_current_user
from ...auth.schemas import AuthSession, LoginRequest, MeResponse, RefreshRequest, SignUpRequest, UserProfile
from ...auth.service import auth_service
from ...db import get_db

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=AuthSession | dict)
async def signup(payload: SignUpRequest):
    result = await auth_service.signup(payload.email, payload.password, payload.name)
    if result.get("access_token"):
        return result
    return {"user": result.get("user"), "session": result.get("session"), "message": "Check your email to confirm the account."}


@router.post("/login", response_model=AuthSession)
async def login(payload: LoginRequest):
    return await auth_service.login(payload.email, payload.password)


@router.post("/refresh", response_model=AuthSession)
async def refresh(payload: RefreshRequest):
    return await auth_service.refresh(payload.refresh_token)


@router.get("/me", response_model=MeResponse)
async def me(request: Request, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    user_id = user.get("id")
    profile = None
    if user_id:
        from ...models.profile import Profile
        row = await db.scalar(select(Profile).where(Profile.id == user_id))
        if row:
            profile = UserProfile.model_validate(row, from_attributes=True)
    return {"user": user, "profile": profile}
