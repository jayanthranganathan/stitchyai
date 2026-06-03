"""Payments service — Razorpay integration."""

from __future__ import annotations

import hashlib
import hmac
import uuid

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import NotFoundError, ValidationError
from app.modules.payments.repository import PaymentsRepository
from app.modules.payments.schemas import VerifyPayment


class PaymentsService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = PaymentsRepository(db)

    def verify_client_payment(self, order_id: uuid.UUID, body: VerifyPayment) -> None:
        payment = self.repo.get_by_order(order_id)
        if not payment:
            raise NotFoundError("Payment not found")
        if not self._verify_signature(
            payment.provider_order_id, body.razorpay_payment_id, body.razorpay_signature
        ):
            raise ValidationError("Razorpay signature mismatch")
        payment.signature_verified = True
        payment.provider_payment_id = body.razorpay_payment_id
        self.db.commit()

    @staticmethod
    def _verify_signature(order_id: str, payment_id: str, signature: str) -> bool:
        secret = settings.razorpay_key_secret.encode()
        body = f"{order_id}|{payment_id}".encode()
        expected = hmac.new(secret, body, hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, signature)
