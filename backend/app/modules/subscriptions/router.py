"""Subscriptions HTTP routes."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.subscriptions.schemas import (
    ChangePlanRequest,
    ChangePlanResult,
    PlanPublic,
    SubscriptionMe,
)
from app.modules.subscriptions.service import SubscriptionsService
from app.shared.dependencies import CurrentUser, require_roles

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


@router.get("/plans", response_model=list[PlanPublic])
def list_plans() -> list[PlanPublic]:
    return SubscriptionsService.list_plans()


@router.get("/me", response_model=SubscriptionMe)
def my_subscription(
    user: Annotated[CurrentUser, Depends(require_roles("customer"))],
    db: Annotated[Session, Depends(get_db)],
) -> SubscriptionMe:
    return SubscriptionsService(db).me(uuid.UUID(user.id))


@router.post("/change", response_model=ChangePlanResult)
def change_plan(
    body: ChangePlanRequest,
    user: Annotated[CurrentUser, Depends(require_roles("customer"))],
    db: Annotated[Session, Depends(get_db)],
) -> ChangePlanResult:
    return SubscriptionsService(db).change_plan(uuid.UUID(user.id), body)
