"""Tracking HTTP routes."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.tracking.schemas import PingBatch, TrackingSnapshot
from app.modules.tracking.service import TrackingService
from app.shared.dependencies import CurrentUser, require_roles

router = APIRouter(prefix="/tracking", tags=["tracking"])


@router.post("/pings", status_code=status.HTTP_202_ACCEPTED)
def submit_pings(
    body: PingBatch,
    user: Annotated[CurrentUser, Depends(require_roles("delivery"))],
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, int]:
    TrackingService(db).ingest(uuid.UUID(user.id), body)
    return {"accepted": len(body.pings)}


@router.get("/orders/{order_id}", response_model=TrackingSnapshot)
def get_snapshot(
    order_id: uuid.UUID,
    _user: Annotated[CurrentUser, Depends(require_roles("customer"))],
    db: Annotated[Session, Depends(get_db)],
) -> TrackingSnapshot:
    return TrackingService(db).snapshot_for_order(order_id)
