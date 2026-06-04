"""Tailors module schemas."""

from __future__ import annotations

from datetime import date

from pydantic import BaseModel, Field


class TailorRegister(BaseModel):
    expertise_slugs: list[str] = Field(min_length=1)
    bio: str | None = None
    city: str | None = None
    documents: dict = Field(default_factory=dict)


class TailorMe(BaseModel):
    id: str
    user_id: str
    bio: str | None
    city: str | None
    approval_state: str
    expertise: list[str]
    rating: float | None


class InterestCreate(BaseModel):
    order_id: str
    note: str | None = None
    expected_delivery_date: date | None = None


class ProgressUpdate(BaseModel):
    progress_percent: int = Field(ge=0, le=100)
    note: str | None = None


class TailorOrderSummary(BaseModel):
    id: str  # order UUID
    status: str  # order status or "available"
    progress_percent: int
    expected_delivery_date: date | None
    placed_at: str | None
    total_amount: float
    currency: str
    category_name: str | None = None
    design_name: str | None = None
    customer_name: str | None = None
    notes: str | None = None
