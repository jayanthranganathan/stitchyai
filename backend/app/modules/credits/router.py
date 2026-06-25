"""Credits HTTP routes."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.credits.schemas import CreditBalance, CreditTransactionPublic
from app.modules.credits.service import CreditsService
from app.shared.dependencies import CurrentUser, require_roles

router = APIRouter(prefix="/credits", tags=["credits"])


@router.get("/balance", response_model=CreditBalance)
def get_balance(
    user: Annotated[CurrentUser, Depends(require_roles("customer"))],
    db: Annotated[Session, Depends(get_db)],
) -> CreditBalance:
    return CreditsService(db).balance(uuid.UUID(user.id))


@router.get("/history", response_model=list[CreditTransactionPublic])
def get_history(
    user: Annotated[CurrentUser, Depends(require_roles("customer"))],
    db: Annotated[Session, Depends(get_db)],
) -> list[CreditTransactionPublic]:
    return CreditsService(db).history(uuid.UUID(user.id))
