"""Credits module schemas."""

from __future__ import annotations

from pydantic import BaseModel


class CreditBalance(BaseModel):
    balance: float


class CreditTransactionPublic(BaseModel):
    id: str
    amount: float
    kind: str
    balance_after: float
    reference_id: str | None
    note: str | None
    created_at: str
