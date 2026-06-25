"""Subscription plan tiers and their capabilities — single source of truth.

Used by the AI gating, subscriptions module, and credits earn-rate logic.
Keep this in sync with the mobile SubscriptionScreen copy.
"""

from __future__ import annotations

import enum
from dataclasses import dataclass


class PlanTier(enum.StrEnum):
    STANDARD = "standard"
    GOLD = "gold"
    PLATINUM = "platinum"


@dataclass(frozen=True)
class PlanCaps:
    """What a tier unlocks. ``ai_monthly_quota=None`` means unlimited."""

    tier: PlanTier
    label: str
    ai_enabled: bool
    ai_monthly_quota: int | None
    save_designs: bool
    custom_proposals: bool
    priority_matching: bool
    credit_earn_multiplier: float  # fraction of order value returned as credits
    price_inr: int  # monthly price in INR (0 = free); billing deferred
    price_credits: int  # cost in credits to self-upgrade for 30 days
    support: str


PLAN_CAPABILITIES: dict[PlanTier, PlanCaps] = {
    PlanTier.STANDARD: PlanCaps(
        tier=PlanTier.STANDARD,
        label="Standard",
        ai_enabled=False,
        ai_monthly_quota=0,
        save_designs=False,
        custom_proposals=False,
        priority_matching=False,
        credit_earn_multiplier=0.05,
        price_inr=0,
        price_credits=0,
        support="Standard",
    ),
    PlanTier.GOLD: PlanCaps(
        tier=PlanTier.GOLD,
        label="Gold",
        ai_enabled=True,
        ai_monthly_quota=30,
        save_designs=True,
        custom_proposals=True,
        priority_matching=False,
        credit_earn_multiplier=0.05,
        price_inr=199,
        price_credits=1990,
        support="Priority",
    ),
    PlanTier.PLATINUM: PlanCaps(
        tier=PlanTier.PLATINUM,
        label="Platinum",
        ai_enabled=True,
        ai_monthly_quota=None,  # unlimited
        save_designs=True,
        custom_proposals=True,
        priority_matching=True,
        credit_earn_multiplier=0.10,
        price_inr=499,
        price_credits=4990,
        support="Dedicated",
    ),
}


def get_caps(tier: PlanTier | str) -> PlanCaps:
    """Resolve capabilities for a tier. Falls back to Standard on unknown input."""
    if isinstance(tier, str):
        try:
            tier = PlanTier(tier)
        except ValueError:
            tier = PlanTier.STANDARD
    return PLAN_CAPABILITIES[tier]
