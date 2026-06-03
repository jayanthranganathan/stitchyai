"""Pydantic request/response schemas for the auth module."""

from __future__ import annotations

from pydantic import BaseModel, Field


class OtpRequest(BaseModel):
    phone: str = Field(pattern=r"^\+?[1-9]\d{7,14}$")


class OtpVerify(BaseModel):
    phone: str = Field(pattern=r"^\+?[1-9]\d{7,14}$")
    code: str = Field(min_length=4, max_length=8)


class TokenPair(BaseModel):
    access: str
    refresh: str
    token_type: str = "Bearer"


class UserPublic(BaseModel):
    id: str
    phone: str
    email: str | None = None
    full_name: str | None = None
    roles: list[str]


class AuthResult(BaseModel):
    user: UserPublic
    tokens: TokenPair


class RefreshRequest(BaseModel):
    refresh: str
