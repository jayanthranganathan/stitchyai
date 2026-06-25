"""Subscriptions service — plan listing, current plan, tier changes.

Real money billing (Apple IAP / Google Play) is deferred. For now a plan can
be changed for free (non-production only) or by spending credits.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import ForbiddenError, NotFoundError, ValidationError
from app.core.plans import PLAN_CAPABILITIES, PlanTier, get_caps
from app.models.ai_generation import AIGenerationJob
from app.models.credit import CreditKind
from app.models.user import CustomerProfile
from app.modules.credits.service import CreditsService
from app.modules.subscriptions.schemas import (
    ChangePlanRequest,
    ChangePlanResult,
    PlanPublic,
    SubscriptionMe,
)

PLAN_DURATION_DAYS = 30


class SubscriptionsService:
    def __init__(self, db: Session) -> None:
        self.db = db

    @staticmethod
    def list_plans() -> list[PlanPublic]:
        return [
            PlanPublic(
                tier=caps.tier.value,
                label=caps.label,
                ai_enabled=caps.ai_enabled,
                ai_monthly_quota=caps.ai_monthly_quota,
                save_designs=caps.save_designs,
                custom_proposals=caps.custom_proposals,
                priority_matching=caps.priority_matching,
                credit_earn_multiplier=caps.credit_earn_multiplier,
                price_inr=caps.price_inr,
                price_credits=caps.price_credits,
                support=caps.support,
            )
            for caps in PLAN_CAPABILITIES.values()
        ]

    def _resolve_customer(self, user_id: uuid.UUID) -> CustomerProfile:
        customer = self.db.query(CustomerProfile).filter(CustomerProfile.user_id == user_id).first()
        if customer is None:
            raise NotFoundError("Customer profile not found for this account")
        return customer

    def _ai_used_this_month(self, user_id: uuid.UUID) -> int:
        now = datetime.now(UTC)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        return (
            self.db.scalar(
                select(func.count())
                .select_from(AIGenerationJob)
                .where(
                    AIGenerationJob.user_id == user_id,
                    AIGenerationJob.created_at >= month_start,
                )
            )
            or 0
        )

    def me(self, user_id: uuid.UUID) -> SubscriptionMe:
        customer = self._resolve_customer(user_id)
        caps = get_caps(customer.plan_tier)
        return SubscriptionMe(
            tier=caps.tier.value,
            label=caps.label,
            plan_expires_at=customer.plan_expires_at.isoformat()
            if customer.plan_expires_at
            else None,
            ai_enabled=caps.ai_enabled,
            ai_monthly_quota=caps.ai_monthly_quota,
            ai_used_this_month=self._ai_used_this_month(user_id),
            credit_balance=float(customer.credit_balance),
        )

    def change_plan(self, user_id: uuid.UUID, body: ChangePlanRequest) -> ChangePlanResult:
        customer = self._resolve_customer(user_id)
        target = PlanTier(body.target_tier)
        caps = get_caps(target)

        if target == PlanTier.STANDARD:
            # Downgrading to the free tier is always allowed and costs nothing.
            customer.plan_tier = target
            customer.plan_expires_at = None
            self.db.commit()
            return self._result(customer)

        if body.pay_with == "credits":
            credits = CreditsService(self.db)
            credits.redeem(
                customer,
                Decimal(caps.price_credits),
                CreditKind.REDEEM_UPGRADE,
                note=f"Upgrade to {caps.label} ({PLAN_DURATION_DAYS} days)",
            )
        elif body.pay_with == "free":
            # Interim path until store billing is wired up. Block in production
            # so we don't ship a "free Platinum" button to real users.
            if settings.app_env.strip().lower() == "production":
                raise ForbiddenError("Paid upgrades are not yet available. Use credits to upgrade.")
        else:  # pragma: no cover - schema already constrains this
            raise ValidationError("Unsupported payment method")

        customer.plan_tier = target
        customer.plan_expires_at = datetime.now(UTC) + timedelta(days=PLAN_DURATION_DAYS)
        self.db.commit()
        return self._result(customer)

    @staticmethod
    def _result(customer: CustomerProfile) -> ChangePlanResult:
        return ChangePlanResult(
            tier=customer.plan_tier.value,
            plan_expires_at=customer.plan_expires_at.isoformat()
            if customer.plan_expires_at
            else None,
            credit_balance=float(customer.credit_balance),
        )
