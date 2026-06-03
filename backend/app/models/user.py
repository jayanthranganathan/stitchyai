"""User account and customer profile models."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import JSON, Boolean, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.base_model import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.admin import AdminProfile
    from app.models.delivery import DeliveryProfile
    from app.models.order import Order
    from app.models.tailor import TailorProfile


class UserAccount(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "user_accounts"

    phone: Mapped[str] = mapped_column(String(20), unique=True, index=True)
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
    admin_profile: Mapped[AdminProfile | None] = relationship(
        back_populates="user", uselist=False
    )


class CustomerProfile(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "customer_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user_accounts.id", ondelete="CASCADE"),
        unique=True,
        index=True,
    )
    addresses: Mapped[list[dict]] = mapped_column(JSON, default=list)
    preferences: Mapped[dict] = mapped_column(JSON, default=dict)

    user: Mapped[UserAccount] = relationship(back_populates="customer_profile")
    orders: Mapped[list[Order]] = relationship(back_populates="customer")
