"""Tailor HTTP routes."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.tailors.schemas import (
    InterestCreate,
    ProgressUpdate,
    TailorMe,
    TailorOrderSummary,
    TailorRegister,
)
from app.modules.tailors.service import TailorsService
from app.shared.dependencies import CurrentUser, current_user, require_roles

router = APIRouter(prefix="/tailors", tags=["tailors"])


@router.post("/register", response_model=TailorMe, status_code=status.HTTP_201_CREATED)
def register(
    body: TailorRegister,
    user: Annotated[CurrentUser, Depends(current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> TailorMe:
    return TailorsService(db).register(uuid.UUID(user.id), body)


@router.get("/me", response_model=TailorMe)
def me(
    user: Annotated[CurrentUser, Depends(require_roles("tailor"))],
    db: Annotated[Session, Depends(get_db)],
) -> TailorMe:
    return TailorsService(db).me(uuid.UUID(user.id))


@router.get("/me/orders", response_model=list[TailorOrderSummary])
def my_orders(
    user: Annotated[CurrentUser, Depends(require_roles("tailor"))],
    db: Annotated[Session, Depends(get_db)],
) -> list[TailorOrderSummary]:
    return TailorsService(db).my_orders(uuid.UUID(user.id))


@router.get("/me/orders/available", response_model=list[TailorOrderSummary])
def available_orders(
    user: Annotated[CurrentUser, Depends(require_roles("tailor"))],
    db: Annotated[Session, Depends(get_db)],
) -> list[TailorOrderSummary]:
    return TailorsService(db).available_orders(uuid.UUID(user.id))


@router.post("/me/interests", status_code=status.HTTP_201_CREATED)
def send_interest(
    body: InterestCreate,
    user: Annotated[CurrentUser, Depends(require_roles("tailor"))],
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, str]:
    TailorsService(db).express_interest(uuid.UUID(user.id), body)
    return {"status": "sent"}


@router.patch("/me/orders/{order_id}/progress")
def update_progress(
    order_id: uuid.UUID,
    body: ProgressUpdate,
    user: Annotated[CurrentUser, Depends(require_roles("tailor"))],
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, str]:
    TailorsService(db).update_progress(uuid.UUID(user.id), order_id, body)
    return {"status": "ok"}
