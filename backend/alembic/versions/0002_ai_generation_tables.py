"""Add AI generation tables.

Revision ID: 0002_ai_generation
Revises: (set to previous migration id in your project)
Create Date: 2025-01-01 00:00:00.000000
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0002_ai_generation"
down_revision = None   # ← Replace with the id of your latest existing migration
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── ai_generation_jobs ────────────────────────────────────────────────
    op.create_table(
        "ai_generation_jobs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("user_accounts.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("category", sa.String(64), nullable=False),
        sa.Column("fabric_s3_key", sa.String(512), nullable=False),
        sa.Column("fabric_s3_bucket", sa.String(128), nullable=False),
        sa.Column("fabric_analysis", postgresql.JSONB, nullable=True),
        sa.Column("enhanced_prompt", sa.Text, nullable=True),
        sa.Column("status", sa.String(32), nullable=False, server_default="queued", index=True),
        sa.Column("stage", sa.String(32), nullable=False, server_default="uploading"),
        sa.Column("progress_percent", sa.Integer, nullable=False, server_default="0"),
        sa.Column("queue_position", sa.Integer, nullable=True),
        sa.Column("error_message", sa.String(1000), nullable=True),
        sa.Column("retry_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("celery_task_id", sa.String(128), nullable=True),
        sa.Column("queued_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("inference_duration_seconds", sa.Float, nullable=True),
        sa.Column("moderation_status", sa.String(32), nullable=False, server_default="pending", index=True),
        sa.Column("moderated_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("moderation_note", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    # ── ai_generated_designs ──────────────────────────────────────────────
    op.create_table(
        "ai_generated_designs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("job_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("ai_generation_jobs.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("index", sa.Integer, nullable=False),
        sa.Column("image_s3_key", sa.String(512), nullable=False),
        sa.Column("thumbnail_s3_key", sa.String(512), nullable=False),
        sa.Column("s3_bucket", sa.String(128), nullable=False),
        sa.Column("cdn_image_url", sa.String(2048), nullable=True),
        sa.Column("cdn_thumbnail_url", sa.String(2048), nullable=True),
        sa.Column("prompt_used", sa.Text, nullable=True),
        sa.Column("seed", sa.Integer, nullable=True),
        sa.Column("inference_steps", sa.Integer, nullable=True),
        sa.Column("guidance_scale", sa.Float, nullable=True),
        sa.Column("is_saved", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("saved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("moderation_status", sa.String(32), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    # ── indices ───────────────────────────────────────────────────────────
    op.create_index("ix_ai_jobs_user_created", "ai_generation_jobs", ["user_id", sa.text("created_at DESC")])
    op.create_index("ix_ai_jobs_status_queued_at", "ai_generation_jobs", ["status", "queued_at"])
    op.create_index("ix_ai_designs_job_index", "ai_generated_designs", ["job_id", "index"], unique=True)
    op.create_index("ix_ai_designs_saved", "ai_generated_designs", ["is_saved"])


def downgrade() -> None:
    op.drop_table("ai_generated_designs")
    op.drop_table("ai_generation_jobs")
