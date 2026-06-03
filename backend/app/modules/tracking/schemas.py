"""Tracking module schemas."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class Ping(BaseModel):
    assignment_id: str
    lat: float
    lng: float
    accuracy_m: float | None = None
    recorded_at: datetime


class PingBatch(BaseModel):
    pings: list[Ping] = Field(min_length=1, max_length=200)


class TrackingSnapshot(BaseModel):
    order_id: str
    assignment_id: str | None
    state: str | None
    lat: float | None
    lng: float | None
    last_updated: datetime | None
    eta_minutes: int | None
