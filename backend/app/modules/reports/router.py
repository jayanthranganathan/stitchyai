"""Reports HTTP routes."""

from __future__ import annotations

from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.reports.schemas import OrdersReport
from app.modules.reports.service import ReportsService
from app.shared.dependencies import CurrentUser, require_roles

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/orders", response_model=OrdersReport)
def orders_report(
    from_date: Annotated[date, Query(alias="from")],
    to_date: Annotated[date, Query(alias="to")],
    group_by: Annotated[str, Query(pattern=r"^(city|tailor|delivery_partner|customer)$")] = "city",
    _user: Annotated[CurrentUser, Depends(require_roles("admin"))] = None,  # type: ignore[assignment]
    db: Annotated[Session, Depends(get_db)] = None,  # type: ignore[assignment]
) -> OrdersReport:
    return ReportsService(db).orders(from_date=from_date, to_date=to_date, group_by=group_by)
