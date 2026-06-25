"""Credits service — earn/redeem ledger + balance.

The running balance lives on ``CustomerProfile.credit_balance``; every change
is mirrored as an append-only ``CreditTransaction`` row. Callers within a
request share one Session, so award/redeem do NOT commit — the caller commits.
"""

from __future__ import annotations

import uuid
from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError
from app.core.plans import get_caps
from app.models.credit import CreditKind, CreditTransaction
from app.models.order import Order
from app.models.user import CustomerProfile
from app.modules.credits.schemas import CreditBalance, CreditTransactionPublic


class CreditsService:
    def __init__(self, db: Session) -> None:
        self.db = db

    # ── internal helpers ────────────────────────────────────────────────────

    def _resolve_customer(self, user_id: uuid.UUID) -> CustomerProfile:
        customer = self.db.query(CustomerProfile).filter(CustomerProfile.user_id == user_id).first()
        if customer is None:
            raise NotFoundError("Customer profile not found for this account")
        return customer

    def _post(
        self,
        customer: CustomerProfile,
        amount: Decimal,
        kind: CreditKind,
        reference_id: uuid.UUID | None = None,
        note: str | None = None,
    ) -> CreditTransaction:
        """Write a signed ledger entry and update the denormalised balance.

        Does not commit — the calling request handler owns the transaction.
        """
        new_balance = Decimal(customer.credit_balance) + amount
        if new_balance < 0:
            raise ConflictError("Insufficient credit balance")
        customer.credit_balance = new_balance
        txn = CreditTransaction(
            customer_id=customer.id,
            amount=amount,
            kind=kind,
            balance_after=new_balance,
            reference_id=reference_id,
            note=note,
        )
        self.db.add(txn)
        return txn

    # ── public API used by other services ────────────────────────────────────

    def award(
        self,
        customer: CustomerProfile,
        amount: Decimal,
        kind: CreditKind,
        reference_id: uuid.UUID | None = None,
        note: str | None = None,
    ) -> CreditTransaction:
        if amount <= 0:
            raise ConflictError("Award amount must be positive")
        return self._post(customer, amount, kind, reference_id, note)

    def redeem(
        self,
        customer: CustomerProfile,
        amount: Decimal,
        kind: CreditKind,
        reference_id: uuid.UUID | None = None,
        note: str | None = None,
    ) -> CreditTransaction:
        if amount <= 0:
            raise ConflictError("Redeem amount must be positive")
        return self._post(customer, -amount, kind, reference_id, note)

    def award_for_delivered_order(self, order: Order) -> CreditTransaction | None:
        """Credit a customer when one of their orders is delivered.

        Earn rate comes from the customer's current plan tier.
        Idempotent: skips if an earn entry already exists for this order.
        """
        customer = self.db.get(CustomerProfile, order.customer_id)
        if customer is None:
            return None

        already = (
            self.db.query(CreditTransaction)
            .filter(
                CreditTransaction.reference_id == order.id,
                CreditTransaction.kind == CreditKind.EARN_ORDER,
            )
            .first()
        )
        if already is not None:
            return None

        multiplier = get_caps(customer.plan_tier).credit_earn_multiplier
        amount = (Decimal(order.total_amount) * Decimal(str(multiplier))).quantize(Decimal("0.01"))
        if amount <= 0:
            return None
        return self.award(
            customer,
            amount,
            CreditKind.EARN_ORDER,
            reference_id=order.id,
            note=f"Earned on delivered order {str(order.id)[:8]}",
        )

    # ── endpoints ─────────────────────────────────────────────────────────────

    def balance(self, user_id: uuid.UUID) -> CreditBalance:
        customer = self._resolve_customer(user_id)
        return CreditBalance(balance=float(customer.credit_balance))

    def history(self, user_id: uuid.UUID) -> list[CreditTransactionPublic]:
        customer = self._resolve_customer(user_id)
        rows = (
            self.db.query(CreditTransaction)
            .filter(CreditTransaction.customer_id == customer.id)
            .order_by(CreditTransaction.created_at.desc())
            .all()
        )
        return [
            CreditTransactionPublic(
                id=str(t.id),
                amount=float(t.amount),
                kind=t.kind.value,
                balance_after=float(t.balance_after),
                reference_id=str(t.reference_id) if t.reference_id else None,
                note=t.note,
                created_at=t.created_at.isoformat(),
            )
            for t in rows
        ]
