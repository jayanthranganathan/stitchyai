"""AI Generation module — business logic / orchestration layer.

This service:
1. Validates and stores fabric uploads (S3)
2. Creates job rows, enqueues Celery tasks
3. Serves status and results (signed URLs on the fly)
4. Handles save/history
5. Rate-limiting enforcement
6. Admin moderation

It intentionally has NO AI model imports — all inference is in ai_service/.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import TYPE_CHECKING

from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, ValidationError
from app.models.ai_generation import AIGenerationJob, AIGeneratedDesign, JobStatus, ModerationStatus
from app.modules.ai.celery_client import enqueue_generation, enqueue_regeneration
from app.modules.ai.repository import AIGenerationRepository
from app.modules.ai.s3_service import S3Service, get_s3_service
from app.modules.ai.schemas import (
    DesignHistoryItem,
    FabricUploadResponse,
    GenerateDesignsRequest,
    GenerateDesignsResponse,
    GeneratedDesignPublic,
    GenerationJobPublic,
    ModerationAction,
    RegenerateRequest,
    UsageAnalytics,
    FabricAnalysisSchema,
)
from app.core.config import settings

logger = logging.getLogger(__name__)

# Rate limit: max 10 generation jobs per user per 24 hours
RATE_LIMIT_JOBS_PER_DAY = 10
# Average GPU generation time (seconds) — used for ETA estimate
AVG_GENERATION_SECONDS = 45


class AIGenerationService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = AIGenerationRepository(db)
        self.s3 = get_s3_service()

    # ── upload ──────────────────────────────────────────────────────────────

    def upload_fabric(self, user_id: uuid.UUID, file_data: bytes) -> FabricUploadResponse:
        """Validate, compress if needed, and store fabric image. Returns upload_id."""
        s3_key, signed_url = self.s3.upload_fabric(file_data, str(user_id))
        return FabricUploadResponse(upload_id=s3_key, fabric_url=signed_url)

    # ── generate ────────────────────────────────────────────────────────────

    def generate_designs(
        self, user_id: uuid.UUID, body: GenerateDesignsRequest
    ) -> GenerateDesignsResponse:
        """Create a job, enqueue to Celery, return job_id + queue position."""
        self._enforce_rate_limit(user_id)
        self._validate_category(body.category)

        job = self.repo.create_job(
            user_id=user_id,
            category=body.category,
            fabric_s3_key=body.upload_id,
            fabric_s3_bucket=settings.s3_bucket,
        )

        task_id = enqueue_generation(
            job_id=str(job.id),
            fabric_s3_key=body.upload_id,
            fabric_s3_bucket=settings.s3_bucket,
            category=body.category,
            enhanced_style_notes=body.style_notes,
            user_id=str(user_id),
        )

        self.repo.update_job_status(
            job.id,
            status=JobStatus.QUEUED,
            stage=job.stage,
            progress_percent=5,
            celery_task_id=task_id,
        )

        queue_pos = self.repo.get_queue_position(job.id)
        estimated_wait = queue_pos * AVG_GENERATION_SECONDS + AVG_GENERATION_SECONDS

        return GenerateDesignsResponse(
            job_id=str(job.id),
            status=job.status.value,
            queue_position=queue_pos if queue_pos > 0 else None,
            estimated_wait_seconds=estimated_wait,
        )

    # ── status ──────────────────────────────────────────────────────────────

    def get_status(self, user_id: uuid.UUID, job_id: uuid.UUID) -> GenerationJobPublic:
        job = self.repo.get_job_for_user(job_id, user_id)
        if not job:
            raise NotFoundError("Generation job not found")
        return self._to_public(job)

    def get_results(self, user_id: uuid.UUID, job_id: uuid.UUID) -> GenerationJobPublic:
        job = self.repo.get_job_for_user(job_id, user_id)
        if not job:
            raise NotFoundError("Generation job not found")
        if job.status not in (JobStatus.COMPLETED, JobStatus.FAILED):
            raise ConflictError("Generation is not yet complete")
        return self._to_public(job)

    # ── regenerate ──────────────────────────────────────────────────────────

    def regenerate(
        self, user_id: uuid.UUID, body: RegenerateRequest
    ) -> GenerateDesignsResponse:
        original = self.repo.get_job_for_user(uuid.UUID(body.job_id), user_id)
        if not original:
            raise NotFoundError("Original generation job not found")
        self._enforce_rate_limit(user_id)

        # Create a new job inheriting the original's fabric and category
        new_job = self.repo.create_job(
            user_id=user_id,
            category=original.category.value,
            fabric_s3_key=original.fabric_s3_key,
            fabric_s3_bucket=original.fabric_s3_bucket,
        )

        task_id = enqueue_regeneration(
            job_id=str(new_job.id),
            fabric_s3_key=original.fabric_s3_key,
            fabric_s3_bucket=original.fabric_s3_bucket,
            category=original.category.value,
            style_notes=body.style_notes,
            design_index=body.design_index,
            user_id=str(user_id),
        )

        self.repo.update_job_status(
            new_job.id,
            status=JobStatus.QUEUED,
            stage=new_job.stage,
            progress_percent=5,
            celery_task_id=task_id,
        )

        queue_pos = self.repo.get_queue_position(new_job.id)
        return GenerateDesignsResponse(
            job_id=str(new_job.id),
            status=new_job.status.value,
            queue_position=queue_pos if queue_pos > 0 else None,
            estimated_wait_seconds=queue_pos * AVG_GENERATION_SECONDS + AVG_GENERATION_SECONDS,
        )

    # ── save / history ──────────────────────────────────────────────────────

    def save_design(self, user_id: uuid.UUID, design_id: uuid.UUID) -> None:
        result = self.repo.toggle_save(design_id, user_id, save=True)
        if not result:
            raise NotFoundError("Design not found or access denied")

    def unsave_design(self, user_id: uuid.UUID, design_id: uuid.UUID) -> None:
        result = self.repo.toggle_save(design_id, user_id, save=False)
        if not result:
            raise NotFoundError("Design not found or access denied")

    def get_history(self, user_id: uuid.UUID) -> list[GenerationJobPublic]:
        jobs = self.repo.list_jobs_for_user(user_id, limit=30)
        return [self._to_public(j) for j in jobs]

    # ── admin ───────────────────────────────────────────────────────────────

    def admin_list_jobs(
        self,
        *,
        limit: int = 50,
        offset: int = 0,
        moderation_filter: str | None = None,
        status_filter: str | None = None,
    ) -> list[GenerationJobPublic]:
        mod = ModerationStatus(moderation_filter) if moderation_filter else None
        st = JobStatus(status_filter) if status_filter else None
        jobs = self.repo.list_all_jobs(
            limit=limit, offset=offset,
            moderation_filter=mod, status_filter=st,
        )
        return [self._to_public(j) for j in jobs]

    def admin_moderate(
        self,
        admin_id: uuid.UUID,
        job_id: uuid.UUID,
        action: ModerationAction,
    ) -> None:
        job = self.repo.get_job(job_id)
        if not job:
            raise NotFoundError("Job not found")
        self.repo.moderate_job(
            job_id,
            admin_id,
            status=ModerationStatus(action.status),
            note=action.note,
        )

    def admin_analytics(self) -> UsageAnalytics:
        raw = self.repo.get_usage_analytics()
        return UsageAnalytics(**raw, jobs_by_category={}, jobs_last_7_days=0)

    # ── private helpers ─────────────────────────────────────────────────────

    def _enforce_rate_limit(self, user_id: uuid.UUID) -> None:
        since = datetime.now(timezone.utc) - timedelta(hours=24)
        count = self.db.scalar(
            select(func.count())
            .select_from(AIGenerationJob)
            .where(
                AIGenerationJob.user_id == user_id,
                AIGenerationJob.created_at >= since,
            )
        ) or 0
        if count >= RATE_LIMIT_JOBS_PER_DAY:
            raise ConflictError(
                f"Daily generation limit reached ({RATE_LIMIT_JOBS_PER_DAY} per 24 h). "
                "Please try again tomorrow."
            )

    @staticmethod
    def _validate_category(category: str) -> None:
        from app.models.ai_generation import FashionCategory
        valid = {e.value for e in FashionCategory}
        if category not in valid:
            raise ValidationError(f"Invalid category '{category}'. Valid: {sorted(valid)}")

    def _to_public(self, job: AIGenerationJob) -> GenerationJobPublic:
        return GenerationJobPublic(
            job_id=str(job.id),
            status=job.status.value,
            stage=job.stage.value,
            progress_percent=job.progress_percent,
            queue_position=self.repo.get_queue_position(job.id) if job.status == JobStatus.QUEUED else None,
            category=job.category.value,
            fabric_analysis=FabricAnalysisSchema(**job.fabric_analysis) if job.fabric_analysis else None,
            enhanced_prompt=job.enhanced_prompt,
            designs=[self._design_to_public(d) for d in job.designs],
            error_message=job.error_message,
            created_at=job.created_at,
            completed_at=job.completed_at,
        )

    def _design_to_public(self, design: AIGeneratedDesign) -> GeneratedDesignPublic:
        image_url = design.cdn_image_url or self.s3.get_cdn_url(design.image_s3_key)
        thumb_url = design.cdn_thumbnail_url or self.s3.get_cdn_url(design.thumbnail_s3_key)
        return GeneratedDesignPublic(
            id=str(design.id),
            index=design.index,
            image_url=image_url,
            thumbnail_url=thumb_url,
            prompt_used=design.prompt_used,
            seed=design.seed,
            is_saved=design.is_saved,
        )
