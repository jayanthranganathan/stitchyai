"""Reports module schemas."""

from __future__ import annotations

from datetime import date

from pydantic import BaseModel


class DateRange(BaseModel):
    from_date: date
    to_date: date


class OrdersByGroup(BaseModel):
    group: str
    orders: int
    revenue: float


class OrdersReport(BaseModel):
    from_date: date
    to_date: date
    group_by: str
    rows: list[OrdersByGroup]
    total_orders: int
    total_revenue: float
