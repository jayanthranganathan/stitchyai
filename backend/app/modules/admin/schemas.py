"""Admin module schemas."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, EmailStr, Field


class ApprovalDecision(BaseModel):
    approve: bool
    reason: str | None = None


class AssignTailor(BaseModel):
    tailor_id: str


class AdminCreate(BaseModel):
    phone: str
    email: EmailStr | None = None
    full_name: str
    role: str = Field(pattern=r"^(super_admin|ops|support)$", default="ops")
    permissions: list[str] = Field(default_factory=list)


class AdminPublic(BaseModel):
    id: str
    full_name: str
    phone: str
    email: str | None  # plain str — no re-validation of stored emails
    role: str
    permissions: list[str]


class PendingApproval(BaseModel):
    kind: str
    id: str
    name: str | None
    submitted_at: str
    details: dict[str, Any]


class AdminOrderItem(BaseModel):
    id: str
    category_id: str
    design_id: str | None
    quantity: int
    unit_price: float
    subtotal: float


class AdminOrderPublic(BaseModel):
    id: str
    status: str
    progress_percent: int
    total_amount: float
    currency: str
    placed_at: str | None
    expected_delivery_date: str | None
    customer_name: str | None
    tailor_name: str | None
    items: list[AdminOrderItem]
