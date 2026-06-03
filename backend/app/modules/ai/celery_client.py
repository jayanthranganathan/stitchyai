"""Celery client used by the FastAPI backend to enqueue AI tasks.

The actual Celery app lives in the ai_service (GPU workers).
This module only sends tasks — it does NOT import any AI libraries.
"""

from __future__ import annotations

import logging

from celery import Celery

from app.core.config import settings

logger = logging.getLogger(__name__)

# Connect to the same Redis broker the AI worker consumes from
celery_client = Celery(
    "thugil_ai_client",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

# Serialisation matching the worker side
celery_client.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    task_acks_late=True,
    task_reject_on_worker_lost=True,
)


def enqueue_generation(
    *,
    job_id: str,
    fabric_s3_key: str,
    fabric_s3_bucket: str,
    category: str,
    enhanced_style_notes: str | None,
    user_id: str,
) -> str:
    """Send `generate_dress_designs` task to the GPU worker queue.

    Returns the Celery task id (stored on the job row for monitoring).
    """
    result = celery_client.send_task(
        "ai_service.workers.tasks.generate_dress_designs",
        kwargs={
            "job_id": job_id,
            "fabric_s3_key": fabric_s3_key,
            "fabric_s3_bucket": fabric_s3_bucket,
            "category": category,
            "style_notes": enhanced_style_notes,
            "user_id": user_id,
        },
        queue="ai_generation",
        priority=5,
    )
    logger.info(
        "Enqueued generation task",
        extra={"job_id": job_id, "task_id": result.id, "category": category},
    )
    return result.id


def enqueue_regeneration(
    *,
    job_id: str,
    fabric_s3_key: str,
    fabric_s3_bucket: str,
    category: str,
    style_notes: str | None,
    design_index: int | None,
    user_id: str,
) -> str:
    """Enqueue a regeneration (uses same task, passes design_index)."""
    result = celery_client.send_task(
        "ai_service.workers.tasks.generate_dress_designs",
        kwargs={
            "job_id": job_id,
            "fabric_s3_key": fabric_s3_key,
            "fabric_s3_bucket": fabric_s3_bucket,
            "category": category,
            "style_notes": style_notes,
            "design_index": design_index,
            "user_id": user_id,
        },
        queue="ai_generation",
        priority=5,
    )
    return result.id
