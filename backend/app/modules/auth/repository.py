"""DB access for the auth module — looking up / creating user accounts."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.user import UserAccount


class AuthRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def find_by_phone(self, phone: str) -> UserAccount | None:
        return self.db.query(UserAccount).filter(UserAccount.phone == phone).one_or_none()

    def create(self, phone: str) -> UserAccount:
        user = UserAccount(phone=phone, is_active=True)
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
