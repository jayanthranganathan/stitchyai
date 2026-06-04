"""Orders module schemas."""

from __future__ import annotations

from datetime import date

from pydantic import BaseModel, Field


class OrderCreate(BaseModel):
    """Request body sent by the mobile app when placing an order.

    The app sends a single-item flat payload (one garment per order).
    The service resolves category_id from category_slug and looks up
    unit_price from the design (or defaults to 0 for custom orders).
    """

    category_slug: str
    design_id: str | None = None
    proposal_id: str | None = None
    measurements: dict = Field(default_factory=dict)
    quantity: int = Field(default=1, ge=1)
    expected_delivery_date: date
    # delivery_address is optional — service falls back to the customer's
    # saved default address when this is empty.
    delivery_address: dict = Field(default_factory=dict)
    notes: str | None = None


class OrderItemPublic(BaseModel):
    id: str
    category_id: str
    design_id: str | None
    proposal_id: str | None
    quantity: int
    unit_price: float
    subtotal: float


class OrderPublic(BaseModel):
    id: str
    status: str
    placed_at: str | None
    expected_delivery_date: date | None
    total_amount: float
    currency: str
    progress_percent: int
    items: list[OrderItemPublic]


class OrderProgress(BaseModel):
    status: str
    progress_percent: int
    eta: date | None
    current_actor: str | None
    history: list[dict]
