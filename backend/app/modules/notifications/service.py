"""Notifications service."""

from __future__ import annotations

import logging
import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy.orm import Session

from app.models.notification import DevicePlatform, FcmToken
from app.modules.notifications.repository import NotificationsRepository
from app.modules.notifications.schemas import NotificationPublic, RegisterDevice

logger = logging.getLogger(__name__)


class NotificationsService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = NotificationsRepository(db)

    def register_device(self, user_id: uuid.UUID, body: RegisterDevice) -> uuid.UUID:
        token = FcmToken(
            user_account_id=user_id,
            device_id=body.device_id,
            token=body.token,
            platform=DevicePlatform(body.platform),
            last_seen_at=datetime.now(tz=UTC),
        )
        saved = self.repo.upsert_token(token)
        return saved.id

    def send_to_user(
        self,
        user_id: uuid.UUID,
        title: str,
        body: str,
        payload: dict[str, Any] | None = None,
    ) -> None:
        """Send a push notification to all FCM devices registered to a user.
        Currently logs only — wire up FCM when fcm_server_key is configured.
        """
        logger.info(
            "Push notification → user=%s title=%r payload=%s",
            user_id,
            title,
            payload,
        )
        # TODO: iterate self.repo.tokens_for_user(user_id) and call FCM HTTP v1 API

    def list(self, user_id: uuid.UUID) -> list[NotificationPublic]:
        return [
            NotificationPublic(
                id=str(n.id),
                kind=n.kind,
                title=n.title,
                body=n.body,
                payload=n.payload,
                read_at=n.read_at,
                created_at=n.created_at,
            )
            for n in self.repo.list_for_user(user_id)
        ]
