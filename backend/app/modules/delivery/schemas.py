"""Delivery module schemas."""

from __future__ import annotations

from pydantic import BaseModel, Field


class DeliveryRegister(BaseModel):
    vehicle_type: str = Field(pattern=r"^(bike|scooter|bicycle|car)$")
    license_url: str | None = None
    documents: dict = Field(default_factory=dict)
    city: str | None = None


class DeliveryMe(BaseModel):
    id: str
    user_id: str
    vehicle_type: str
    approval_state: str
    is_online: bool
    city: str | None


class StatusUpdate(BaseModel):
    is_online: bool


class AssignmentTransition(BaseModel):
    state: str = Field(pattern=r"^(accepted|picked_up|delivered|cancelled)$")
    note: str | None = None
