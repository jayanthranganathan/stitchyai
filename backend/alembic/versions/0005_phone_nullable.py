"""Make user_accounts.phone nullable (email-only Firebase accounts).

Revision ID: 0005_phone_nullable
Revises: 0004_subscriptions_credits
Create Date: 2026-06-26
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0005_phone_nullable"
down_revision = "0004_subscriptions_credits"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("user_accounts", "phone", existing_type=sa.String(20), nullable=True)


def downgrade() -> None:
    op.alter_column("user_accounts", "phone", existing_type=sa.String(20), nullable=False)
