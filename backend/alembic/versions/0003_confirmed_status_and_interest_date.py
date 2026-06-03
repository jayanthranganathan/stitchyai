"""Add confirmed order status and expected_delivery_date to tailor_interests.

Revision ID: 0003_confirmed_status
Revises: 0002_ai_generation
Create Date: 2026-06-02
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0003_confirmed_status"
down_revision = "0002_ai_generation"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Add 'confirmed' to the orderstatus enum.
    #    PostgreSQL requires the value to be added BEFORE using it.
    op.execute("ALTER TYPE orderstatus ADD VALUE IF NOT EXISTS 'confirmed' BEFORE 'assigned'")

    # 2. Add expected_delivery_date column to tailor_interests.
    op.add_column(
        "tailor_interests",
        sa.Column("expected_delivery_date", sa.Date(), nullable=True),
    )


def downgrade() -> None:
    # Remove expected_delivery_date from tailor_interests.
    op.drop_column("tailor_interests", "expected_delivery_date")
    # Note: PostgreSQL does not support removing enum values directly.
    # To fully revert, recreate the enum without 'confirmed' (complex — skip for dev).
