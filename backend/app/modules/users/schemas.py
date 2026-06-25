"""Users module schemas."""

from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field


class Address(BaseModel):
    label: str = Field(min_length=1, max_length=64)
    line1: str
    line2: str | None = None
    city: str
    state: str
    pincode: str
    landmark: str | None = None
    lat: float | None = None
    lng: float | None = None


class UserUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    addresses: list[Address] | None = None


class UserMe(BaseModel):
    id: str
    phone: str
    email: str | None  # plain str — no re-validation of stored emails
    full_name: str | None
    roles: list[str]
    addresses: list[Address]
