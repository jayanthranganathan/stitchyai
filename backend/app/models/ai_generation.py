"""AI Design Generation — ORM models.

Two tables:
- ai_generation_jobs   : one row per generation request (1 fabric → 1 category → N designs)
- ai_generated_designs : individual generated images linked to a job

Lifecycle:
  queued → processing → completed | failed

Moderation:
  pending → approved | flagged | removed   (admin workflow)
"""

from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.base_model import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.user import UserAccount


# ─── enums ────────────────────────────────────────────────────────────────────


class JobStatus(enum.StrEnum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class GenerationStage(enum.StrEnum):
    """Granular pipeline stage for real-time progress UI."""

    UPLOADING = "uploading"
    SEGMENTING = "segmenting"  # SAM2 fabric isolation
    ANALYZING = "analyzing"  # Qwen2.5-VL fabric analysis
    PROMPTING = "prompting"  # Prompt engineering
    GENERATING = "generating"  # FLUX.1 + IP Adapter + ControlNet
    FINALIZING = "finalizing"  # S3 upload + DB write
    DONE = "done"


class ModerationStatus(enum.StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    FLAGGED = "flagged"
    REMOVED = "removed"


class FashionCategory(enum.StrEnum):
    SAREE = "Saree"
    HALF_SAREE = "Half Saree"
    LEHENGA = "Lehenga"
    CHURIDAR = "Churidar"
    SALWAR = "Salwar"
    BRIDAL_BLOUSE = "Bridal Blouse"
    DESIGNER_BLOUSE = "Designer Blouse"
    ANARKALI = "Anarkali"
    KIDS_SILK_SET = "Kids Silk Set"
    INDO_WESTERN = "Indo-Western"
    GOWN = "Gown"
    KURTI = "Kurti"


# ─── models ───────────────────────────────────────────────────────────────────


class AIGenerationJob(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """One generation request: 1 fabric upload × 1 category → up to 4 designs."""

    __tablename__ = "ai_generation_jobs"

    # Owner
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user_accounts.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    # Input
    category: Mapped[str] = mapped_column(
        Enum(FashionCategory, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    fabric_s3_key: Mapped[str] = mapped_column(String(512), nullable=False)
    fabric_s3_bucket: Mapped[str] = mapped_column(String(128), nullable=False)

    # AI analysis results (written by Qwen after analysis)
    fabric_analysis: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # {"fabric_type": "Silk", "texture": "smooth", "motifs": [...], "colors": [...],
    #  "embroidery": "gold zari", "material": "Kanchipuram silk", "generated_prompt": "..."}

    enhanced_prompt: Mapped[str | None] = mapped_column(Text, nullable=True)

    # State machine
    status: Mapped[JobStatus] = mapped_column(
        Enum(JobStatus, values_callable=lambda x: [e.value for e in x]),
        default=JobStatus.QUEUED,
        nullable=False,
        index=True,
    )
    stage: Mapped[GenerationStage] = mapped_column(
        Enum(GenerationStage, values_callable=lambda x: [e.value for e in x]),
        default=GenerationStage.UPLOADING,
        nullable=False,
    )
    progress_percent: Mapped[int] = mapped_column(Integer, default=0)
    queue_position: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Error info
    error_message: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    retry_count: Mapped[int] = mapped_column(Integer, default=0)

    # Celery task id (for revocation / monitoring)
    celery_task_id: Mapped[str | None] = mapped_column(String(128), nullable=True)

    # Timing
    queued_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Duration in seconds (for GPU cost analytics)
    inference_duration_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Admin moderation
    moderation_status: Mapped[ModerationStatus] = mapped_column(
        Enum(ModerationStatus, values_callable=lambda x: [e.value for e in x]),
        default=ModerationStatus.PENDING,
        nullable=False,
        index=True,
    )
    moderated_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    moderation_note: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Relationships
    designs: Mapped[list[AIGeneratedDesign]] = relationship(
        back_populates="job", cascade="all, delete-orphan", order_by="AIGeneratedDesign.index"
    )
    user: Mapped[UserAccount] = relationship(foreign_keys=[user_id])


class AIGeneratedDesign(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """One generated dress image. Each job produces up to 4 of these."""

    __tablename__ = "ai_generated_designs"

    job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("ai_generation_jobs.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    # Position within the job (0-3)
    index: Mapped[int] = mapped_column(Integer, nullable=False)

    # S3 storage
    image_s3_key: Mapped[str] = mapped_column(String(512), nullable=False)
    thumbnail_s3_key: Mapped[str] = mapped_column(String(512), nullable=False)
    s3_bucket: Mapped[str] = mapped_column(String(128), nullable=False)

    # CloudFront CDN URLs (cached after first signed-URL generation)
    cdn_image_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    cdn_thumbnail_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)

    # Generation metadata
    prompt_used: Mapped[str | None] = mapped_column(Text, nullable=True)
    seed: Mapped[int | None] = mapped_column(Integer, nullable=True)
    inference_steps: Mapped[int | None] = mapped_column(Integer, nullable=True)
    guidance_scale: Mapped[float | None] = mapped_column(Float, nullable=True)

    # User actions
    is_saved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    saved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Admin moderation at design level
    moderation_status: Mapped[ModerationStatus] = mapped_column(
        Enum(ModerationStatus, values_callable=lambda x: [e.value for e in x]),
        default=ModerationStatus.PENDING,
        nullable=False,
    )

    job: Mapped[AIGenerationJob] = relationship(back_populates="designs")
