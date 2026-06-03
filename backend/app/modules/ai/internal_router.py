"""Internal service-to-service endpoint called by the AI worker.

This route is NOT exposed to the mobile app.
It is called by the Celery task to update job status and save generated designs.
Protected by a shared API key header (X-AI-Service-Key).
"""

from __future__ import annotations

import uuid
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.ai_generation import GenerationStage, JobStatus
from app.modules.ai.repository import AIGenerationRepository
from app.modules.notifications.service import NotificationsService

router = APIRouter(prefix="/ai/internal", tags=["ai-internal"])


def _verify_service_key(x_ai_service_key: Annotated[str | None, Header()] = None) -> None:
    if not settings.ai_service_api_key:
        return  # disabled in dev
    if x_ai_service_key != settings.ai_service_api_key:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid service key")


class JobPatchBody(BaseModel):
    status: str | None = None
    stage: str | None = None
    progress_percent: int | None = None
    fabric_analysis: dict[str, Any] | None = None
    enhanced_prompt: str | None = None
    error_message: str | None = None
    inference_duration_seconds: float | None = None
    designs: list[dict[str, Any]] | None = None


@router.patch(
    "/jobs/{job_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(_verify_service_key)],
    summary="[Internal] AI worker updates job status and saves design results.",
)
def patch_job(
    job_id: uuid.UUID,
    body: JobPatchBody,
    db: Annotated[Session, Depends(get_db)],
) -> None:
    repo = AIGenerationRepository(db)
    job = repo.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Update status fields
    repo.update_job_status(
        job_id,
        status=JobStatus(body.status) if body.status else job.status,
        stage=GenerationStage(body.stage) if body.stage else job.stage,
        progress_percent=body.progress_percent if body.progress_percent is not None else job.progress_percent,
        error_message=body.error_message,
        fabric_analysis=body.fabric_analysis,
        enhanced_prompt=body.enhanced_prompt,
        inference_duration_seconds=body.inference_duration_seconds,
    )

    # Persist generated designs
    if body.designs:
        repo.save_generated_designs(
            job_id,
            body.designs,
            s3_bucket=job.fabric_s3_bucket,
        )

    # Send push notification on terminal states
    if body.status in ("completed", "failed"):
        _send_completion_notification(db, job, body.status == "completed")


def _send_completion_notification(db: Session, job, success: bool) -> None:
    """Fire-and-forget FCM push to the user who owns this job."""
    try:
        notif_service = NotificationsService(db)
        title = "✦ Your AI designs are ready!" if success else "AI generation failed"
        body_text = (
            "Tap to see your 4 generated outfit designs."
            if success
            else "Something went wrong. Please try again."
        )
        # Push to all devices registered to this user
        notif_service.send_to_user(
            user_id=job.user_id,
            title=title,
            body=body_text,
            payload={
                "type": "ai_generation",
                "job_id": str(job.id),
                "status": "completed" if success else "failed",
            },
        )
    except Exception as exc:
        import logging
        logging.getLogger(__name__).warning(
            "Push notification failed", extra={"job_id": str(job.id), "error": str(exc)}
        )
