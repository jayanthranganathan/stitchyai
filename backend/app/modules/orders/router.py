"""Orders HTTP routes."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.orders.schemas import OrderCreate, OrderProgress, OrderPublic
from app.modules.orders.service import OrdersService
from app.shared.dependencies import CurrentUser, require_roles

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=OrderPublic, status_code=status.HTTP_201_CREATED)
def create_order(
    body: OrderCreate,
    user: Annotated[CurrentUser, Depends(require_roles("customer"))],
    db: Annotated[Session, Depends(get_db)],
) -> OrderPublic:
    # Service resolves CustomerProfile from user_id internally
    return OrdersService(db).create(uuid.UUID(user.id), body)


@router.get("", response_model=list[OrderPublic])
def list_my_orders(
    user: Annotated[CurrentUser, Depends(require_roles("customer"))],
    db: Annotated[Session, Depends(get_db)],
) -> list[OrderPublic]:
    return OrdersService(db).list_for_customer(uuid.UUID(user.id))


@router.get("/{order_id}", response_model=OrderPublic)
def get_order(
    order_id: uuid.UUID,
    user: Annotated[CurrentUser, Depends(require_roles("customer"))],
    db: Annotated[Session, Depends(get_db)],
) -> OrderPublic:
    return OrdersService(db).get_for_customer(uuid.UUID(user.id), order_id)


@router.get("/{order_id}/progress", response_model=OrderProgress)
def get_progress(
    order_id: uuid.UUID,
    _user: Annotated[CurrentUser, Depends(require_roles("customer"))],
    db: Annotated[Session, Depends(get_db)],
) -> OrderProgress:
    return OrdersService(db).progress(order_id)


@router.post("/{order_id}/cancel")
def cancel(
    order_id: uuid.UUID,
    _user: Annotated[CurrentUser, Depends(require_roles("customer"))],
    _db: Annotated[Session, Depends(get_db)],
) -> dict[str, str]:
    # TODO: implement cancellation state machine
    return {"status": "cancelled", "id": str(order_id)}


@router.post("/{order_id}/deliver", response_model=OrderPublic)
def mark_delivered(
    order_id: uuid.UUID,
    user: Annotated[CurrentUser, Depends(require_roles("admin", "delivery"))],
    db: Annotated[Session, Depends(get_db)],
) -> OrderPublic:
    """Mark an order delivered — awards order-completion credits to the customer."""
    role = "admin" if user.has_role("admin") else "delivery"
    return OrdersService(db).mark_delivered(order_id, actor_role=role)
