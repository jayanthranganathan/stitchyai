"""Tailors repository."""

from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from app.models.tailor import OrderAssignment, TailorExpertise, TailorInterest, TailorProfile


class TailorsRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_user(self, user_id: uuid.UUID) -> TailorProfile | None:
        return (
            self.db.query(TailorProfile)
            .filter(TailorProfile.user_id == user_id)
            .one_or_none()
        )

    def find_expertise(self, slugs: list[str]) -> list[TailorExpertise]:
        return (
            self.db.query(TailorExpertise).filter(TailorExpertise.slug.in_(slugs)).all()
        )

    def list_assignments(self, tailor_id: uuid.UUID) -> list[OrderAssignment]:
        return (
            self.db.query(OrderAssignment)
            .filter(OrderAssignment.tailor_id == tailor_id)
            .order_by(OrderAssignment.created_at.desc())
            .all()
        )

    def list_interests(self, tailor_id: uuid.UUID) -> list[TailorInterest]:
        return (
            self.db.query(TailorInterest)
            .filter(TailorInterest.tailor_id == tailor_id)
            .all()
        )
