"""Delivery repository."""

from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from app.models.delivery import DeliveryAssignment, DeliveryProfile


class DeliveryRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_user(self, user_id: uuid.UUID) -> DeliveryProfile | None:
        return (
            self.db.query(DeliveryProfile).filter(DeliveryProfile.user_id == user_id).one_or_none()
        )

    def list_assignments(self, partner_id: uuid.UUID) -> list[DeliveryAssignment]:
        return (
            self.db.query(DeliveryAssignment)
            .filter(DeliveryAssignment.delivery_partner_id == partner_id)
            .order_by(DeliveryAssignment.created_at.desc())
            .all()
        )
