from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class SignUpRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    name: str | None = Field(default=None, max_length=120)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class RefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=1)


class UserProfile(BaseModel):
    id: str
    email: EmailStr | None = None
    name: str | None = None
    subscription_tier: str = "free"
    created_at: datetime | None = None
    updated_at: datetime | None = None


class AuthSession(BaseModel):
    access_token: str
    refresh_token: str | None = None
    expires_in: int | None = None
    expires_at: int | None = None
    token_type: str = "bearer"
    user: dict


class MeResponse(BaseModel):
    user: dict
    profile: UserProfile | None = None
