"""AI Generation module — database repository layer."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session, selectinload

from app.models.ai_generation import (
    AIGeneratedDesign,
    AIGenerationJob,
    FashionCategory,
    GenerationStage,
    JobStatus,
    ModerationStatus,
)


class AIGenerationRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    # ── jobs ───────────────────────────────────────────────────────────────

    def create_job(
        self,
        user_id: uuid.UUID,
        category: str,
        fabric_s3_key: str,
        fabric_s3_bucket: str,
    ) -> AIGenerationJob:
        job = AIGenerationJob(
            user_id=user_id,
            category=FashionCategory(category),
            fabric_s3_key=fabric_s3_key,
            fabric_s3_bucket=fabric_s3_bucket,
            status=JobStatus.QUEUED,
            stage=GenerationStage.UPLOADING,
            progress_percent=5,
            queued_at=datetime.now(timezone.utc),
        )
        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)
        return job

    def get_job(self, job_id: uuid.UUID) -> AIGenerationJob | None:
        return self.db.scalar(
            select(AIGenerationJob)
            .where(AIGenerationJob.id == job_id)
            .options(selectinload(AIGenerationJob.designs))
        )

    def get_job_for_user(
        self, job_id: uuid.UUID, user_id: uuid.UUID
    ) -> AIGenerationJob | None:
        return self.db.scalar(
            select(AIGenerationJob)
            .where(
                AIGenerationJob.id == job_id,
                AIGenerationJob.user_id == user_id,
            )
            .options(selectinload(AIGenerationJob.designs))
        )

    def list_jobs_for_user(
        self,
        user_id: uuid.UUID,
        *,
        limit: int = 20,
        offset: int = 0,
        status_filter: JobStatus | None = None,
    ) -> list[AIGenerationJob]:
        q = (
            select(AIGenerationJob)
            .where(AIGenerationJob.user_id == user_id)
            .options(selectinload(AIGenerationJob.designs))
            .order_by(desc(AIGenerationJob.created_at))
            .limit(limit)
            .offset(offset)
        )
        if status_filter:
            q = q.where(AIGenerationJob.status == status_filter)
        return list(self.db.scalars(q).all())

    def update_job_status(
        self,
        job_id: uuid.UUID,
        *,
        status: JobStatus,
        stage: GenerationStage,
        progress_percent: int,
        celery_task_id: str | None = None,
        error_message: str | None = None,
        fabric_analysis: dict | None = None,
        enhanced_prompt: str | None = None,
        inference_duration_seconds: float | None = None,
    ) -> None:
        job = self.db.get(AIGenerationJob, job_id)
        if not job:
            return
        job.status = status
        job.stage = stage
        job.progress_percent = progress_percent
        if celery_task_id is not None:
            job.celery_task_id = celery_task_id
        if error_message is not None:
            job.error_message = error_message
        if fabric_analysis is not None:
            job.fabric_analysis = fabric_analysis
        if enhanced_prompt is not None:
            job.enhanced_prompt = enhanced_prompt
        if inference_duration_seconds is not None:
            job.inference_duration_seconds = inference_duration_seconds
        if status == JobStatus.PROCESSING and not job.started_at:
            job.started_at = datetime.now(timezone.utc)
        if status in (JobStatus.COMPLETED, JobStatus.FAILED):
            job.completed_at = datetime.now(timezone.utc)
        self.db.commit()

    def increment_retry(self, job_id: uuid.UUID) -> None:
        job = self.db.get(AIGenerationJob, job_id)
        if job:
            job.retry_count += 1
            self.db.commit()

    # ── designs ─────────────────────────────────────────────────────────────

    def save_generated_designs(
        self,
        job_id: uuid.UUID,
        designs: list[dict],
        s3_bucket: str,
    ) -> list[AIGeneratedDesign]:
        """
        Bulk-insert generated design rows.

        Each dict in `designs`:
          {index, image_s3_key, thumbnail_s3_key, prompt_used, seed,
           inference_steps, guidance_scale, cdn_image_url, cdn_thumbnail_url}
        """
        rows = [
            AIGeneratedDesign(
                job_id=job_id,
                s3_bucket=s3_bucket,
                **d,
            )
            for d in designs
        ]
        self.db.add_all(rows)
        self.db.commit()
        return rows

    def get_design(self, design_id: uuid.UUID) -> AIGeneratedDesign | None:
        return self.db.get(AIGeneratedDesign, design_id)

    def toggle_save(
        self, design_id: uuid.UUID, user_id: uuid.UUID, *, save: bool
    ) -> AIGeneratedDesign | None:
        design = self.db.scalar(
            select(AIGeneratedDesign)
            .join(AIGenerationJob)
            .where(
                AIGeneratedDesign.id == design_id,
                AIGenerationJob.user_id == user_id,
            )
        )
        if not design:
            return None
        design.is_saved = save
        design.saved_at = datetime.now(timezone.utc) if save else None
        self.db.commit()
        self.db.refresh(design)
        return design

    def list_saved_designs(self, user_id: uuid.UUID) -> list[AIGeneratedDesign]:
        return list(
            self.db.scalars(
                select(AIGeneratedDesign)
                .join(AIGenerationJob)
                .where(
                    AIGenerationJob.user_id == user_id,
                    AIGeneratedDesign.is_saved == True,  # noqa: E712
                )
                .order_by(desc(AIGeneratedDesign.saved_at))
            ).all()
        )

    # ── queue position helper ───────────────────────────────────────────────

    def get_queue_position(self, job_id: uuid.UUID) -> int:
        """How many QUEUED jobs were created before this one."""
        job = self.db.get(AIGenerationJob, job_id)
        if not job:
            return 0
        count = self.db.scalar(
            select(func.count())
            .select_from(AIGenerationJob)
            .where(
                AIGenerationJob.status == JobStatus.QUEUED,
                AIGenerationJob.queued_at < job.queued_at,
            )
        )
        return int(count or 0)

    # ── admin ──────────────────────────────────────────────────────────────

    def list_all_jobs(
        self,
        *,
        limit: int = 50,
        offset: int = 0,
        moderation_filter: ModerationStatus | None = None,
        status_filter: JobStatus | None = None,
    ) -> list[AIGenerationJob]:
        q = (
            select(AIGenerationJob)
            .options(selectinload(AIGenerationJob.designs))
            .order_by(desc(AIGenerationJob.created_at))
            .limit(limit)
            .offset(offset)
        )
        if moderation_filter:
            q = q.where(AIGenerationJob.moderation_status == moderation_filter)
        if status_filter:
            q = q.where(AIGenerationJob.status == status_filter)
        return list(self.db.scalars(q).all())

    def moderate_job(
        self,
        job_id: uuid.UUID,
        moderator_id: uuid.UUID,
        *,
        status: ModerationStatus,
        note: str | None,
    ) -> None:
        job = self.db.get(AIGenerationJob, job_id)
        if job:
            job.moderation_status = status
            job.moderated_by = moderator_id
            job.moderation_note = note
            # Cascade to designs
            for design in job.designs:
                design.moderation_status = status
            self.db.commit()

    def get_usage_analytics(self) -> dict:
        total = self.db.scalar(select(func.count()).select_from(AIGenerationJob)) or 0
        completed = self.db.scalar(
            select(func.count()).select_from(AIGenerationJob)
            .where(AIGenerationJob.status == JobStatus.COMPLETED)
        ) or 0
        failed = self.db.scalar(
            select(func.count()).select_from(AIGenerationJob)
            .where(AIGenerationJob.status == JobStatus.FAILED)
        ) or 0
        total_designs = self.db.scalar(
            select(func.count()).select_from(AIGeneratedDesign)
        ) or 0
        saved_designs = self.db.scalar(
            select(func.count()).select_from(AIGeneratedDesign)
            .where(AIGeneratedDesign.is_saved == True)  # noqa: E712
        ) or 0
        avg_duration = self.db.scalar(
            select(func.avg(AIGenerationJob.inference_duration_seconds))
            .where(AIGenerationJob.inference_duration_seconds.isnot(None))
        )
        return {
            "total_jobs": total,
            "completed_jobs": completed,
            "failed_jobs": failed,
            "total_designs_generated": total_designs,
            "total_saved_designs": saved_designs,
            "avg_inference_duration_seconds": float(avg_duration) if avg_duration else None,
        }
