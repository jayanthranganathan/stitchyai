"""User account and customer profile models."""

from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Any

from sqlalchemy import JSON, Boolean, DateTime, Enum, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.plans import PlanTier
from app.shared.base_model import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.admin import AdminProfile
    from app.models.credit import CreditTransaction
    from app.models.delivery import DeliveryProfile
    from app.models.order import Order
    from app.models.tailor import TailorProfile


class UserAccount(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "user_accounts"

    # Nullable: email-only (Firebase email/password) accounts have no phone.
    phone: Mapped[str | None] = mapped_column(String(20), unique=True, index=True, nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True, index=True)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    customer_profile: Mapped[CustomerProfile | None] = relationship(
        back_populates="user", uselist=False
    )
    tailor_profile: Mapped[TailorProfile | None] = relationship(
        back_populates="user", uselist=False
    )
    delivery_profile: Mapped[DeliveryProfile | None] = relationship(
        back_populates="user", uselist=False
    )
    admin_profile: Mapped[AdminProfile | None] = relationship(back_populates="user", uselist=False)


class CustomerProfile(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "customer_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user_accounts.id", ondelete="CASCADE"),
        unique=True,
        index=True,
    )
    addresses: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    preferences: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)

    # ── Subscription + credits ──────────────────────────────────────────────
    plan_tier: Mapped[PlanTier] = mapped_column(
        Enum(PlanTier, values_callable=lambda x: [e.value for e in x]),
        default=PlanTier.STANDARD,
        nullable=False,
        index=True,
    )
    plan_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    credit_balance: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0, nullable=False)

    user: Mapped[UserAccount] = relationship(back_populates="customer_profile")
    orders: Mapped[list[Order]] = relationship(back_populates="customer")
    credit_transactions: Mapped[list[CreditTransaction]] = relationship(
        back_populates="customer", cascade="all, delete-orphan"
    )
