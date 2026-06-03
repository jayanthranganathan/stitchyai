"""Tracking service — ingest pings, expose latest snapshot to customers."""

from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.models.delivery import LocationPing
from app.modules.tracking.repository import TrackingRepository
from app.modules.tracking.schemas import PingBatch, TrackingSnapshot


class TrackingService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = TrackingRepository(db)

    def ingest(self, partner_id: uuid.UUID, batch: PingBatch) -> None:
        pings = [
            LocationPing(
                delivery_partner_id=partner_id,
                assignment_id=uuid.UUID(p.assignment_id),
                lat=p.lat,
                lng=p.lng,
                accuracy_m=p.accuracy_m,
                recorded_at=p.recorded_at,
            )
            for p in batch.pings
        ]
        self.repo.insert_batch(pings)

    def snapshot_for_order(self, order_id: uuid.UUID) -> TrackingSnapshot:
        # TODO: find the active delivery_assignment for this order, then latest ping
        raise NotFoundError("Tracking not yet implemented")
