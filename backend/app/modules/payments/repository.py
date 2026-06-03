"""Payments repository."""

from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from app.models.payment import Payment


class PaymentsRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_order(self, order_id: uuid.UUID) -> Payment | None:
        return (
            self.db.query(Payment).filter(Payment.order_id == order_id).one_or_none()
        )
