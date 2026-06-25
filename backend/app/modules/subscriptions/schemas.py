"""Subscriptions module schemas."""

from __future__ import annotations

from pydantic import BaseModel, Field


class PlanPublic(BaseModel):
    tier: str
    label: str
    ai_enabled: bool
    ai_monthly_quota: int | None
    save_designs: bool
    custom_proposals: bool
    priority_matching: bool
    credit_earn_multiplier: float
    price_inr: int
    price_credits: int
    support: str


class SubscriptionMe(BaseModel):
    tier: str
    label: str
    plan_expires_at: str | None
    ai_enabled: bool
    ai_monthly_quota: int | None
    ai_used_this_month: int
    credit_balance: float


class ChangePlanRequest(BaseModel):
    target_tier: str = Field(pattern=r"^(standard|gold|platinum)$")
    pay_with: str = Field(default="free", pattern=r"^(free|credits)$")


class ChangePlanResult(BaseModel):
    tier: str
    plan_expires_at: str | None
    credit_balance: float
