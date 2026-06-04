"""Delivery HTTP routes."""

from __future__ import annotations

import uuid
from typing import Annotated, Any

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.delivery.schemas import (
    AssignmentTransition,
    DeliveryMe,
    DeliveryRegister,
    StatusUpdate,
)
from app.modules.delivery.service import DeliveryService
from app.shared.dependencies import CurrentUser, current_user, require_roles

router = APIRouter(prefix="/delivery", tags=["delivery"])


@router.post("/register", response_model=DeliveryMe, status_code=status.HTTP_201_CREATED)
def register(
    body: DeliveryRegister,
    user: Annotated[CurrentUser, Depends(current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> DeliveryMe:
    return DeliveryService(db).register(uuid.UUID(user.id), body)


@router.get("/me", response_model=DeliveryMe)
def me(
    user: Annotated[CurrentUser, Depends(require_roles("delivery"))],
    db: Annotated[Session, Depends(get_db)],
) -> DeliveryMe:
    return DeliveryService(db).me(uuid.UUID(user.id))


@router.patch("/me/status", response_model=DeliveryMe)
def set_status(
    body: StatusUpdate,
    user: Annotated[CurrentUser, Depends(require_roles("delivery"))],
    db: Annotated[Session, Depends(get_db)],
) -> DeliveryMe:
    return DeliveryService(db).set_status(uuid.UUID(user.id), body)


@router.get("/me/assignments")
def my_assignments(
    _user: Annotated[CurrentUser, Depends(require_roles("delivery"))],
    _db: Annotated[Session, Depends(get_db)],
) -> list[dict[str, Any]]:
    # TODO: implement
    return []


@router.patch("/me/assignments/{assignment_id}")
def transition(
    assignment_id: uuid.UUID,
    body: AssignmentTransition,
    _user: Annotated[CurrentUser, Depends(require_roles("delivery"))],
    _db: Annotated[Session, Depends(get_db)],
) -> dict[str, str]:
    # TODO: implement state machine
    return {"status": body.state, "assignment_id": str(assignment_id)}
