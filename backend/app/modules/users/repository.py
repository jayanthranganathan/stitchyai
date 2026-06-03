"""Users repository — looking up users and addresses."""

from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from app.models.user import CustomerProfile, UserAccount


class UsersRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get(self, user_id: uuid.UUID) -> UserAccount | None:
        return self.db.get(UserAccount, user_id)

    def get_customer_profile(self, user_id: uuid.UUID) -> CustomerProfile | None:
        return (
            self.db.query(CustomerProfile)
            .filter(CustomerProfile.user_id == user_id)
            .one_or_none()
        )
