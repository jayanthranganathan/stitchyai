"""Payments module schemas."""

from __future__ import annotations

from pydantic import BaseModel


class VerifyPayment(BaseModel):
    razorpay_payment_id: str
    razorpay_signature: str


class PaymentPublic(BaseModel):
    id: str
    order_id: str
    provider_order_id: str
    provider_payment_id: str | None
    amount: float
    currency: str
    status: str
    signature_verified: bool
