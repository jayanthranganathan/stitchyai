"""Notifications repository."""

from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from app.models.notification import FcmToken, Notification


class NotificationsRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def upsert_token(self, token: FcmToken) -> FcmToken:
        existing = self.db.query(FcmToken).filter(FcmToken.token == token.token).one_or_none()
        if existing:
            existing.user_account_id = token.user_account_id
            existing.device_id = token.device_id
            existing.platform = token.platform
            self.db.commit()
            return existing
        self.db.add(token)
        self.db.commit()
        self.db.refresh(token)
        return token

    def list_for_user(self, user_id: uuid.UUID) -> list[Notification]:
        return (
            self.db.query(Notification)
            .filter(Notification.user_account_id == user_id)
            .order_by(Notification.created_at.desc())
            .all()
        )
