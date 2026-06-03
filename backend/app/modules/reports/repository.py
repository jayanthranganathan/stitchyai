"""Reports repository — heavy aggregates."""

from __future__ import annotations

from datetime import date

from sqlalchemy.orm import Session


class ReportsRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def orders_grouped(
        self, *, from_date: date, to_date: date, group_by: str
    ) -> list[tuple[str, int, float]]:
        """Return rows of (group_key, order_count, revenue).

        TODO: implement using SQL — group by city / tailor / delivery_partner / customer.
        """
        return []
