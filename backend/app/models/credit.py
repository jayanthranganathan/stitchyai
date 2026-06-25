"""Credit ledger — append-only record of every credit earn/spend.

The running balance is denormalised onto ``CustomerProfile.credit_balance``;
this table is the audit trail and the source of truth for history.
"""

from __future__ import annotations

import enum
import uuid
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.base_model import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.user import CustomerProfile


class CreditKind(enum.StrEnum):
    EARN_ORDER = "earn_order"  # credited when an order is delivered
    REDEEM_ORDER = "redeem_order"  # spent as a discount on an order
    REDEEM_UPGRADE = "redeem_upgrade"  # spent to upgrade plan tier
    PROMO = "promo"  # promotional / referral grant
    REFUND = "refund"  # reversal


class CreditTransaction(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "credit_transactions"

    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("customer_profiles.id", ondelete="CASCADE"),
        index=True,
    )
    # Signed: positive = credited, negative = debited
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    kind: Mapped[CreditKind] = mapped_column(
        Enum(CreditKind, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    balance_after: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    reference_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )  # e.g. the order id this relates to
    note: Mapped[str | None] = mapped_column(String(255), nullable=True)

    customer: Mapped[CustomerProfile] = relationship(back_populates="credit_transactions")
