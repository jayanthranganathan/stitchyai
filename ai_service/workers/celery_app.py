"""Celery application factory for the AI generation workers.

Worker startup:
    celery -A ai_service.workers.celery_app worker \
        --queues ai_generation \
        --concurrency 1 \
        --pool solo \
        --loglevel INFO
"""

from __future__ import annotations

import logging

from celery import Celery
from celery.signals import worker_init, worker_ready, worker_shutdown

from ai_service.core.config import ai_settings

logger = logging.getLogger(__name__)

# ─── app ──────────────────────────────────────────────────────────────────────

celery_app = Celery(
    "ai_service",
    broker=ai_settings.redis_url,
    backend=ai_settings.redis_url,
    include=["ai_service.workers.tasks"],
)

celery_app.conf.update(
    # Serialization
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],

    # Routing
    task_routes={"ai_service.workers.tasks.*": {"queue": "ai_generation"}},
    task_default_queue="ai_generation",

    # Reliability
    task_acks_late=True,               # ack after completion (not on receipt)
    task_reject_on_worker_lost=True,   # re-queue if worker crashes
    worker_prefetch_multiplier=1,      # only fetch 1 task at a time (GPU jobs are heavy)

    # Retries
    task_max_retries=2,
    task_default_retry_delay=30,       # seconds

    # Result TTL
    result_expires=86400,              # 24 hours

    # Time limits (GPU generation should not exceed 5 min)
    task_soft_time_limit=240,          # 4 min — triggers SoftTimeLimitExceeded
    task_time_limit=300,               # 5 min — hard kill

    # Monitoring
    worker_send_task_events=True,
    task_send_sent_event=True,
)


# ─── signals — warm-up models on worker start ─────────────────────────────────

@worker_init.connect
def on_worker_init(**kwargs) -> None:
    logger.info("AI worker initialising — warming up models…")


@worker_ready.connect
def on_worker_ready(**kwargs) -> None:
    """Pre-load all AI models so the first task doesn't pay cold-start latency."""
    from ai_service.services.sam2_service import get_sam2_service
    from ai_service.services.qwen_service import get_qwen_service
    from ai_service.services.flux_service import get_flux_service
    from ai_service.services.ip_adapter_service import get_ip_adapter_service
    from ai_service.services.controlnet_service import get_controlnet_service

    logger.info("Pre-loading AI models…")
    try:
        # Load in reverse VRAM priority order (largest last)
        get_controlnet_service()._load()
        get_ip_adapter_service()._load()
        get_sam2_service()._load()
        get_qwen_service()._load()
        get_flux_service()._load()    # Largest — FLUX loads last
        logger.info("All models pre-loaded and ready")
    except Exception as exc:
        logger.error("Model pre-load failed — will lazy-load on first task", extra={"error": str(exc)})


@worker_shutdown.connect
def on_worker_shutdown(**kwargs) -> None:
    import torch
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    logger.info("AI worker shut down cleanly")
