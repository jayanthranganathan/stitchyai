"""Orders repository."""

from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from app.models.order import Order


class OrdersRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get(self, order_id: uuid.UUID) -> Order | None:
        return self.db.get(Order, order_id)

    def list_for_customer(self, customer_id: uuid.UUID) -> list[Order]:
        return (
            self.db.query(Order)
            .filter(Order.customer_id == customer_id)
            .order_by(Order.created_at.desc())
            .all()
        )

    def save(self, order: Order) -> Order:
        self.db.add(order)
        self.db.commit()
        self.db.refresh(order)
        return order
