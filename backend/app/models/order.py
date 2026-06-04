"""Order, line item, and immutable status history."""

from __future__ import annotations

import enum
import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import JSON, Date, DateTime, Enum, ForeignKey, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.base_model import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.catalog import Design, DesignProposal
    from app.models.delivery import DeliveryAssignment
    from app.models.payment import Payment
    from app.models.tailor import OrderAssignment, TailorInterest
    from app.models.user import CustomerProfile


class OrderStatus(enum.StrEnum):
    DRAFT = "draft"
    PLACED = "placed"
    CONFIRMED = "confirmed"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    READY = "ready"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    UNDELIVERABLE = "undeliverable"


class Order(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "orders"

    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("customer_profiles.id", ondelete="RESTRICT"),
        index=True,
    )
    status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus, values_callable=lambda x: [e.value for e in x]),
        default=OrderStatus.DRAFT,
        index=True,
    )
    expected_delivery_date: Mapped[date | None] = mapped_column(Date, index=True, nullable=True)
    placed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    delivery_address: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    total_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    currency: Mapped[str] = mapped_column(String(3), default="INR")
    progress_percent: Mapped[int] = mapped_column(Integer, default=0)
    notes: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    customer: Mapped[CustomerProfile] = relationship(back_populates="orders")
    items: Mapped[list[OrderItem]] = relationship(
        back_populates="order", cascade="all, delete-orphan"
    )
    history: Mapped[list[OrderStatusHistory]] = relationship(back_populates="order")
    tailor_interests: Mapped[list[TailorInterest]] = relationship(back_populates="order")
    assignments: Mapped[list[OrderAssignment]] = relationship(back_populates="order")
    delivery_assignments: Mapped[list[DeliveryAssignment]] = relationship(back_populates="order")
    payment: Mapped[Payment | None] = relationship(back_populates="order", uselist=False)


class OrderItem(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "order_items"

    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), index=True
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id", ondelete="RESTRICT")
    )
    design_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("designs.id"), nullable=True
    )
    proposal_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("design_proposals.id"), nullable=True
    )
    measurements: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    unit_price: Mapped[float] = mapped_column(Numeric(12, 2))
    subtotal: Mapped[float] = mapped_column(Numeric(12, 2))

    order: Mapped[Order] = relationship(back_populates="items")
    design: Mapped[Design | None] = relationship(back_populates="order_items")
    proposal: Mapped[DesignProposal | None] = relationship(back_populates="order_items")


class OrderStatusHistory(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Immutable audit log of order state transitions."""

    __tablename__ = "order_status_history"

    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), index=True
    )
    status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus, values_callable=lambda x: [e.value for e in x])
    )
    progress_percent: Mapped[int] = mapped_column(Integer, default=0)
    note: Mapped[str | None] = mapped_column(String(500), nullable=True)
    actor_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    actor_role: Mapped[str | None] = mapped_column(String(32), nullable=True)

    order: Mapped[Order] = relationship(back_populates="history")
