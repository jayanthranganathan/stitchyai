"""Notifications module schemas."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class RegisterDevice(BaseModel):
    device_id: str = Field(min_length=4)
    token: str = Field(min_length=10)
    platform: str = Field(pattern=r"^(ios|android|web)$")


class DevicePublic(BaseModel):
    id: str


class NotificationPublic(BaseModel):
    id: str
    kind: str
    title: str
    body: str
    payload: dict
    read_at: datetime | None
    created_at: datetime
