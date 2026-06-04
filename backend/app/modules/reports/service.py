"""Reports service."""

from __future__ import annotations

from datetime import date

from sqlalchemy.orm import Session

from app.modules.reports.repository import ReportsRepository
from app.modules.reports.schemas import OrdersByGroup, OrdersReport


class ReportsService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = ReportsRepository(db)

    def orders(self, *, from_date: date, to_date: date, group_by: str) -> OrdersReport:
        rows = self.repo.orders_grouped(from_date=from_date, to_date=to_date, group_by=group_by)
        groups = [OrdersByGroup(group=g, orders=o, revenue=r) for g, o, r in rows]
        return OrdersReport(
            from_date=from_date,
            to_date=to_date,
            group_by=group_by,
            rows=groups,
            total_orders=sum(g.orders for g in groups),
            total_revenue=sum(g.revenue for g in groups),
        )
