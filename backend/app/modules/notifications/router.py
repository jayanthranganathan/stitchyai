"""Notifications HTTP routes."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.notifications.schemas import DevicePublic, NotificationPublic, RegisterDevice
from app.modules.notifications.service import NotificationsService
from app.shared.dependencies import CurrentUser, current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.post("/devices", response_model=DevicePublic, status_code=status.HTTP_201_CREATED)
def register_device(
    body: RegisterDevice,
    user: Annotated[CurrentUser, Depends(current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> DevicePublic:
    device_id = NotificationsService(db).register_device(uuid.UUID(user.id), body)
    return DevicePublic(id=str(device_id))


@router.get("", response_model=list[NotificationPublic])
def list_inbox(
    user: Annotated[CurrentUser, Depends(current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> list[NotificationPublic]:
    return NotificationsService(db).list(uuid.UUID(user.id))
