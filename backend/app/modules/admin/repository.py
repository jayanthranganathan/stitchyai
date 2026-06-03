"""Admin repository."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.admin import AdminProfile


class AdminRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_admins(self) -> list[AdminProfile]:
        return self.db.query(AdminProfile).all()
