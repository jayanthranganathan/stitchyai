"""Payments HTTP routes."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.payments.schemas import VerifyPayment
from app.modules.payments.service import PaymentsService

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/webhook")
async def webhook(request: Request, _db: Annotated[Session, Depends(get_db)]) -> dict[str, str]:
    # TODO: verify X-Razorpay-Signature header, parse event, mark payment captured / refunded.
    _ = await request.body()
    return {"status": "ok"}


@router.post("/{order_id}/verify")
def verify(
    order_id: uuid.UUID,
    body: VerifyPayment,
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, str]:
    PaymentsService(db).verify_client_payment(order_id, body)
    return {"status": "verified"}
