"""Catalog: categories, library designs, and customer-submitted proposals."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import JSON, Boolean, ForeignKey, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.base_model import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.order import OrderItem
    from app.models.user import CustomerProfile


class Category(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "categories"

    slug: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(128))
    icon_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    designs: Mapped[list[Design]] = relationship(back_populates="category")


class Design(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "designs"

    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    images: Mapped[list[str]] = mapped_column(JSON, default=list)
    base_price: Mapped[float] = mapped_column(Numeric(12, 2))
    tags: Mapped[list[str]] = mapped_column(JSON, default=list)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    category: Mapped[Category] = relationship(back_populates="designs")
    order_items: Mapped[list[OrderItem]] = relationship(back_populates="design")


class DesignProposal(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """A customer-submitted custom design attached to one order item."""

    __tablename__ = "design_proposals"

    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("customer_profiles.id", ondelete="CASCADE"), index=True
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id", ondelete="CASCADE")
    )
    description: Mapped[str] = mapped_column(String(2000))
    reference_images: Mapped[list[str]] = mapped_column(JSON, default=list)

    order_items: Mapped[list[OrderItem]] = relationship(back_populates="proposal")
    customer: Mapped[CustomerProfile] = relationship()
