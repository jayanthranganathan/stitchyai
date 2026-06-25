"""Subscriptions (plan tiers) + credits.

Revision ID: 0004_subscriptions_credits
Revises: 0003_confirmed_status
Create Date: 2026-06-13
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0004_subscriptions_credits"
down_revision = "0003_confirmed_status"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # create_type=False so referencing these in columns does NOT re-emit
    # CREATE TYPE — we create them once explicitly (checkfirst) below.
    plantier = postgresql.ENUM(
        "standard", "gold", "platinum", name="plantier", create_type=False
    )
    creditkind = postgresql.ENUM(
        "earn_order",
        "redeem_order",
        "redeem_upgrade",
        "promo",
        "refund",
        name="creditkind",
        create_type=False,
    )
    bind = op.get_bind()
    postgresql.ENUM("standard", "gold", "platinum", name="plantier").create(
        bind, checkfirst=True
    )
    postgresql.ENUM(
        "earn_order",
        "redeem_order",
        "redeem_upgrade",
        "promo",
        "refund",
        name="creditkind",
    ).create(bind, checkfirst=True)

    # ── customer_profiles: subscription + credit balance ─────────────────────
    op.add_column(
        "customer_profiles",
        sa.Column(
            "plan_tier",
            plantier,
            nullable=False,
            server_default="standard",
        ),
    )
    op.add_column(
        "customer_profiles",
        sa.Column("plan_expires_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "customer_profiles",
        sa.Column(
            "credit_balance",
            sa.Numeric(12, 2),
            nullable=False,
            server_default="0",
        ),
    )
    op.create_index(
        "ix_customer_profiles_plan_tier", "customer_profiles", ["plan_tier"]
    )

    # ── orders: credits redeemed on this order ───────────────────────────────
    op.add_column(
        "orders",
        sa.Column(
            "credits_redeemed",
            sa.Numeric(12, 2),
            nullable=False,
            server_default="0",
        ),
    )

    # ── credit_transactions ledger ───────────────────────────────────────────
    op.create_table(
        "credit_transactions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "customer_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("customer_profiles.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("kind", creditkind, nullable=False),
        sa.Column("balance_after", sa.Numeric(12, 2), nullable=False),
        sa.Column("reference_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("note", sa.String(255), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index(
        "ix_credit_transactions_customer_id", "credit_transactions", ["customer_id"]
    )
    op.create_index(
        "ix_credit_transactions_created_at", "credit_transactions", ["created_at"]
    )


def downgrade() -> None:
    op.drop_index("ix_credit_transactions_created_at", table_name="credit_transactions")
    op.drop_index("ix_credit_transactions_customer_id", table_name="credit_transactions")
    op.drop_table("credit_transactions")

    op.drop_column("orders", "credits_redeemed")

    op.drop_index("ix_customer_profiles_plan_tier", table_name="customer_profiles")
    op.drop_column("customer_profiles", "credit_balance")
    op.drop_column("customer_profiles", "plan_expires_at")
    op.drop_column("customer_profiles", "plan_tier")

    bind = op.get_bind()
    postgresql.ENUM(name="creditkind").drop(bind, checkfirst=True)
    postgresql.ENUM(name="plantier").drop(bind, checkfirst=True)
