"""Tracking repository."""

from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from app.models.delivery import LocationPing


class TrackingRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def insert_batch(self, pings: list[LocationPing]) -> None:
        self.db.add_all(pings)
        self.db.commit()

    def latest_for_assignment(self, assignment_id: uuid.UUID) -> LocationPing | None:
        return (
            self.db.query(LocationPing)
            .filter(LocationPing.assignment_id == assignment_id)
            .order_by(LocationPing.recorded_at.desc())
            .first()
        )
