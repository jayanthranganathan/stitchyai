"""Pydantic request/response schemas for the auth module."""

from __future__ import annotations

import re

from pydantic import BaseModel, Field, field_validator


def _normalize_phone(v: str) -> str:
    """Strip formatting chars, then normalise to E.164-ish format.

    Accepted inputs (all become +919876543201):
        +91 9876543201        ← space after country code
        +91-9876543201        ← dash separator
        +91 98765 43201       ← grouped digits
        919876543201          ← no + sign
        09876543201           ← local Indian leading-0 format
        9876543201            ← 10-digit local Indian number
    """
    # 1. Strip spaces, dashes, brackets, dots
    cleaned = re.sub(r"[\s\-\(\)\.]", "", v.strip())

    # 2. Leading-zero local format → prepend +91 (Indian default)
    if re.match(r"^0\d{9,10}$", cleaned):
        cleaned = "+91" + cleaned[1:]

    # 3. 10-digit local number (no country code, no leading 0)
    elif re.match(r"^[6-9]\d{9}$", cleaned):
        cleaned = "+91" + cleaned

    # 4. Has country digits but no + sign
    elif not cleaned.startswith("+") and re.match(r"^\d{10,15}$", cleaned):
        cleaned = "+" + cleaned

    return cleaned


class OtpRequest(BaseModel):
    phone: str = Field(
        description="Phone number in any common format — +919876543201, 09876543201, 9876543201"
    )

    @field_validator("phone", mode="before")
    @classmethod
    def normalise_phone(cls, v: object) -> str:
        if not isinstance(v, str):
            raise ValueError("phone must be a string")
        normalised = _normalize_phone(v)
        if not re.match(r"^\+[1-9]\d{7,14}$", normalised):
            raise ValueError(
                f"Invalid phone number '{v}'. "
                "Use E.164 format (+919876543201) or a 10-digit Indian number."
            )
        return normalised


class OtpVerify(BaseModel):
    phone: str = Field(
        description="Same phone number used in /otp/request"
    )
    code: str = Field(min_length=4, max_length=8)

    @field_validator("phone", mode="before")
    @classmethod
    def normalise_phone(cls, v: object) -> str:
        if not isinstance(v, str):
            raise ValueError("phone must be a string")
        normalised = _normalize_phone(v)
        if not re.match(r"^\+[1-9]\d{7,14}$", normalised):
            raise ValueError(
                f"Invalid phone number '{v}'. "
                "Use E.164 format (+919876543201) or a 10-digit Indian number."
            )
        return normalised


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
