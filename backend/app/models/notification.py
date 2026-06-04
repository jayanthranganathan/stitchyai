"""FCM device tokens and in-app notification inbox."""

from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import JSON, DateTime, Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.base_model import Base, TimestampMixin, UUIDPrimaryKeyMixin


class DevicePlatform(enum.StrEnum):
    IOS = "ios"
    ANDROID = "android"
    WEB = "web"


class FcmToken(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "fcm_tokens"

    user_account_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user_accounts.id", ondelete="CASCADE"), index=True
    )
    device_id: Mapped[str] = mapped_column(String(128))
    token: Mapped[str] = mapped_column(String(500), unique=True)
    platform: Mapped[DevicePlatform] = mapped_column(
        Enum(DevicePlatform, values_callable=lambda x: [e.value for e in x])
    )
    last_seen_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Notification(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "notifications"

    user_account_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user_accounts.id", ondelete="CASCADE"), index=True
    )
    kind: Mapped[str] = mapped_column(String(64), index=True)
    title: Mapped[str] = mapped_column(String(255))
    body: Mapped[str] = mapped_column(String(2000))
    payload: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
