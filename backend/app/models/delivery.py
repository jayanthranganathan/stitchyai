"""Delivery partner profile, assignments, and location pings."""

from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import JSON, Boolean, DateTime, Enum, Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.tailor import ApprovalState
from app.shared.base_model import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.order import Order
    from app.models.user import UserAccount


class VehicleType(str, enum.Enum):
    BIKE = "bike"
    SCOOTER = "scooter"
    BICYCLE = "bicycle"
    CAR = "car"


class DeliveryKind(str, enum.Enum):
    CUSTOMER_TO_TAILOR = "customer_to_tailor"
    TAILOR_TO_CUSTOMER = "tailor_to_customer"
    OFFICE_TO_CUSTOMER = "office_to_customer"
    CUSTOMER_TO_OFFICE = "customer_to_office"


class DeliveryAssignmentState(str, enum.Enum):
    PROPOSED = "proposed"
    ACCEPTED = "accepted"
    PICKED_UP = "picked_up"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class DeliveryProfile(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "delivery_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user_accounts.id", ondelete="CASCADE"),
        unique=True,
        index=True,
    )
    vehicle_type: Mapped[VehicleType] = mapped_column(
        Enum(VehicleType, values_callable=lambda x: [e.value for e in x]), default=VehicleType.BIKE
    )
    license_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    documents: Mapped[dict] = mapped_column(JSON, default=dict)
    approval_state: Mapped[ApprovalState] = mapped_column(
    Enum(ApprovalState, native_enum=False, values_callable=lambda x: [e.value for e in x]),
        default=ApprovalState.REGISTERED, index=True
    )
    is_online: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    last_lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    last_lng: Mapped[float | None] = mapped_column(Float, nullable=True)
    last_seen_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    city: Mapped[str | None] = mapped_column(String(128), index=True, nullable=True)

    user: Mapped[UserAccount] = relationship(back_populates="delivery_profile")
    assignments: Mapped[list[DeliveryAssignment]] = relationship(back_populates="partner")


class DeliveryAssignment(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "delivery_assignments"

    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), index=True
    )
    delivery_partner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("delivery_profiles.id", ondelete="CASCADE"),
        index=True,
    )
    kind: Mapped[DeliveryKind] = mapped_column(
        Enum(DeliveryKind, values_callable=lambda x: [e.value for e in x])
    )
    pickup_location: Mapped[dict] = mapped_column(JSON)  # {address, lat, lng, contact}
    drop_location: Mapped[dict] = mapped_column(JSON)
    state: Mapped[DeliveryAssignmentState] = mapped_column(
        Enum(DeliveryAssignmentState, values_callable=lambda x: [e.value for e in x]),
        default=DeliveryAssignmentState.PROPOSED, index=True
    )
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    partner: Mapped[DeliveryProfile] = relationship(back_populates="assignments")
    order: Mapped[Order] = relationship(back_populates="delivery_assignments")
    pings: Mapped[list[LocationPing]] = relationship(back_populates="assignment")


class LocationPing(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "location_pings"

    delivery_partner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("delivery_profiles.id", ondelete="CASCADE"),
        index=True,
    )
    assignment_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("delivery_assignments.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    lat: Mapped[float] = mapped_column(Float)
    lng: Mapped[float] = mapped_column(Float)
    accuracy_m: Mapped[float | None] = mapped_column(Float, nullable=True)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)

    assignment: Mapped[DeliveryAssignment | None] = relationship(back_populates="pings")
