"""Admin HTTP routes."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.admin.schemas import (
    AdminCreate,
    AdminOrderPublic,
    AdminPublic,
    ApprovalDecision,
    AssignTailor,
    PendingApproval,
)
from app.modules.admin.service import AdminService
from app.shared.dependencies import CurrentUser, require_roles

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/orders", response_model=list[AdminOrderPublic])
def list_all_orders(
    status: Annotated[str | None, Query()] = None,
    _user: Annotated[CurrentUser, Depends(require_roles("admin"))] = None,  # type: ignore[assignment]
    db: Annotated[Session, Depends(get_db)] = None,  # type: ignore[assignment]
) -> list[AdminOrderPublic]:
    return AdminService(db).list_orders(status)


@router.get("/approvals", response_model=list[PendingApproval])
def list_pending_approvals(
    kind: Annotated[str | None, Query(pattern=r"^(tailor|delivery|customer|order)$")] = None,
    _user: Annotated[CurrentUser, Depends(require_roles("admin"))] = None,  # type: ignore[assignment]
    db: Annotated[Session, Depends(get_db)] = None,  # type: ignore[assignment]
) -> list[PendingApproval]:
    return AdminService(db).pending_approvals(kind)


@router.post("/tailors/{tailor_id}/approve")
def approve_tailor(
    tailor_id: uuid.UUID,
    body: ApprovalDecision,
    _user: Annotated[CurrentUser, Depends(require_roles("admin"))],
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, str]:
    AdminService(db).approve_tailor(tailor_id, body)
    return {"status": "ok"}


@router.post("/delivery/{partner_id}/approve")
def approve_delivery(
    partner_id: uuid.UUID,
    body: ApprovalDecision,
    _user: Annotated[CurrentUser, Depends(require_roles("admin"))],
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, str]:
    AdminService(db).approve_delivery(partner_id, body)
    return {"status": "ok"}


@router.post("/orders/{order_id}/approve")
def approve_order(
    order_id: uuid.UUID,
    _user: Annotated[CurrentUser, Depends(require_roles("admin"))],
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, str]:
    AdminService(db).approve_order(order_id)
    return {"status": "confirmed"}


@router.post("/orders/{order_id}/assign")
def assign_order(
    order_id: uuid.UUID,
    body: AssignTailor,
    _user: Annotated[CurrentUser, Depends(require_roles("admin"))],
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, str]:
    AdminService(db).assign_order(order_id, body)
    return {"status": "assigned"}


@router.post("/admins", response_model=AdminPublic, status_code=status.HTTP_201_CREATED)
def create_admin(
    body: AdminCreate,
    _user: Annotated[CurrentUser, Depends(require_roles("admin"))],
    db: Annotated[Session, Depends(get_db)],
) -> AdminPublic:
    return AdminService(db).create_admin(body)


@router.get("/admins", response_model=list[AdminPublic])
def list_admins(
    _user: Annotated[CurrentUser, Depends(require_roles("admin"))],
    db: Annotated[Session, Depends(get_db)],
) -> list[AdminPublic]:
    return AdminService(db).list_admins()
