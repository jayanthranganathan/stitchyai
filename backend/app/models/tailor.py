"""Tailor profile, expertise, interest, and order assignment."""

from __future__ import annotations

import enum
import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import JSON, Date, DateTime, Enum, ForeignKey, Integer, Numeric, String, Table, Column
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.base_model import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.order import Order
    from app.models.user import UserAccount


class ApprovalState(str, enum.Enum):
    REGISTERED = "registered"
    DOCUMENTS_UPLOADED = "documents_uploaded"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    SUSPENDED = "suspended"


class AssignmentState(str, enum.Enum):
    PROPOSED = "proposed"
    ACCEPTED = "accepted"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


# Many-to-many: tailor <-> expertise tags
tailor_expertise_link = Table(
    "tailor_expertise_link",
    Base.metadata,
    Column("tailor_id", UUID(as_uuid=True), ForeignKey("tailor_profiles.id", ondelete="CASCADE")),
    Column("expertise_id", UUID(as_uuid=True), ForeignKey("tailor_expertise.id", ondelete="CASCADE")),
)


class TailorExpertise(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """A tag a tailor can pick (Blouses, Kurtis, etc.). Seeded from `category`."""

    __tablename__ = "tailor_expertise"

    slug: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(128))


class TailorProfile(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "tailor_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user_accounts.id", ondelete="CASCADE"),
        unique=True,
        index=True,
    )
    bio: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    documents: Mapped[dict] = mapped_column(JSON, default=dict)  # {aadhaar_url, pan_url, ...}
    approval_state: Mapped[ApprovalState] = mapped_column(
    Enum(ApprovalState, native_enum=False, values_callable=lambda x: [e.value for e in x]),
        default=ApprovalState.REGISTERED, index=True
    )
    rating: Mapped[float | None] = mapped_column(Numeric(3, 2), nullable=True)
    city: Mapped[str | None] = mapped_column(String(128), index=True, nullable=True)

    user: Mapped[UserAccount] = relationship(back_populates="tailor_profile")
    expertise: Mapped[list[TailorExpertise]] = relationship(
        secondary=tailor_expertise_link, lazy="selectin"
    )
    interests: Mapped[list[TailorInterest]] = relationship(back_populates="tailor")
    assignments: Mapped[list[OrderAssignment]] = relationship(back_populates="tailor")


class TailorInterest(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "tailor_interests"

    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), index=True
    )
    tailor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tailor_profiles.id", ondelete="CASCADE"), index=True
    )
    note: Mapped[str | None] = mapped_column(String(500), nullable=True)
    expected_delivery_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    tailor: Mapped[TailorProfile] = relationship(back_populates="interests")
    order: Mapped[Order] = relationship(back_populates="tailor_interests")


class OrderAssignment(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "order_assignments"

    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), index=True
    )
    tailor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tailor_profiles.id", ondelete="CASCADE"), index=True
    )
    assigned_by_admin_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("admin_profiles.id"), nullable=True
    )
    agreed_delivery_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    state: Mapped[AssignmentState] = mapped_column(
        Enum(AssignmentState, values_callable=lambda x: [e.value for e in x]),
        default=AssignmentState.PROPOSED, index=True
    )
    progress_percent: Mapped[int] = mapped_column(Integer, default=0)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    tailor: Mapped[TailorProfile] = relationship(back_populates="assignments")
    order: Mapped[Order] = relationship(back_populates="assignments")
