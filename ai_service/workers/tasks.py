"""Celery tasks — AI generation pipeline.

Each task corresponds to one generation job.
The task:
1. Downloads fabric from S3
2. Runs SAM2 segmentation
3. Runs Qwen2.5-VL analysis
4. Engineers the prompt
5. Generates 4 designs via FLUX.1 + IP-Adapter + ControlNet
6. Uploads results to S3
7. Updates the main API (via HTTP callback) with results
8. Sends FCM push notification to the user
"""

from __future__ import annotations

import logging
import time
import uuid
from typing import Any

import httpx
from celery import Task
from celery.exceptions import SoftTimeLimitExceeded

from ai_service.workers.celery_app import celery_app
from ai_service.core.config import ai_settings
from ai_service.services.controlnet_service import get_controlnet_service
from ai_service.services.flux_service import get_flux_service
from ai_service.services.ip_adapter_service import get_ip_adapter_service
from ai_service.services.prompt_engineering_service import build_generation_prompt
from ai_service.services.qwen_service import get_qwen_service
from ai_service.services.sam2_service import get_sam2_service
from ai_service.utils.image_utils import pil_to_bytes
from ai_service.utils.s3_client import get_s3

logger = logging.getLogger(__name__)


# ─── API callback client ──────────────────────────────────────────────────────

def _api_patch(job_id: str, payload: dict[str, Any]) -> None:
    """
    Send a status update to the main FastAPI backend.
    Uses a shared API key for service-to-service auth.
    """
    url = f"{ai_settings.main_api_url}/ai/internal/jobs/{job_id}"
    headers = {"X-AI-Service-Key": ai_settings.ai_service_api_key}
    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.patch(url, json=payload, headers=headers)
            resp.raise_for_status()
    except Exception as exc:
        logger.error("API callback failed", extra={"job_id": job_id, "error": str(exc)})
        # Non-fatal: the task continues; status will be updated at completion


# ─── main task ────────────────────────────────────────────────────────────────


@celery_app.task(
    bind=True,
    name="ai_service.workers.tasks.generate_dress_designs",
    max_retries=2,
    default_retry_delay=30,
    acks_late=True,
)
def generate_dress_designs(
    self: Task,
    *,
    job_id: str,
    fabric_s3_key: str,
    fabric_s3_bucket: str,
    category: str,
    style_notes: str | None,
    user_id: str,
    design_index: int | None = None,  # None = generate all 4
) -> dict[str, Any]:
    """
    Full AI pipeline: fabric → segmentation → analysis → generation → S3 → notify.

    Returns a summary dict (stored as Celery result, also sent to main API).
    """
    start_time = time.monotonic()
    s3 = get_s3()
    num_designs = 1 if design_index is not None else ai_settings.num_designs

    logger.info(
        "Starting generation",
        extra={"job_id": job_id, "category": category, "user_id": user_id},
    )

    try:
        # ── Step 1: Update status → processing / segmenting ──────────────
        _api_patch(job_id, {
            "status": "processing",
            "stage": "segmenting",
            "progress_percent": 15,
        })

        # ── Step 2: Download fabric ───────────────────────────────────────
        fabric_bytes = s3.download(fabric_s3_key)
        logger.info("Fabric downloaded", extra={"key": fabric_s3_key, "size": len(fabric_bytes)})

        # ── Step 3: SAM2 segmentation ─────────────────────────────────────
        segmented_image = get_sam2_service().segment_fabric(fabric_bytes)

        # ── Step 4: Qwen2.5-VL analysis ──────────────────────────────────
        _api_patch(job_id, {"stage": "analyzing", "progress_percent": 35})
        fabric_analysis = get_qwen_service().analyse_fabric(segmented_image)
        logger.info("Fabric analysis", extra={"analysis": fabric_analysis})

        # ── Step 5: Prompt engineering ────────────────────────────────────
        _api_patch(job_id, {"stage": "prompting", "progress_percent": 50})
        positive_prompt, negative_prompt = build_generation_prompt(
            fabric_analysis, category, style_notes
        )

        # ── Step 6: IP-Adapter encoding ───────────────────────────────────
        ip_embeds = get_ip_adapter_service().encode_reference_image(segmented_image)

        # ── Step 7: ControlNet reference image ────────────────────────────
        control_image = get_controlnet_service().get_control_image(category)

        # ── Step 8: FLUX.1 generation ─────────────────────────────────────
        _api_patch(job_id, {"stage": "generating", "progress_percent": 55})
        generated_list = get_flux_service().generate(
            positive_prompt=positive_prompt,
            negative_prompt=negative_prompt,
            fabric_image=segmented_image,
            control_image=control_image,
            ip_adapter_image_embeds=ip_embeds,
            num_designs=num_designs,
        )

        # ── Step 9: Upload results to S3 ─────────────────────────────────
        _api_patch(job_id, {"stage": "finalizing", "progress_percent": 90})
        saved_designs: list[dict[str, Any]] = []

        for gen in generated_list:
            idx = design_index if design_index is not None else len(saved_designs)
            img_key = f"ai-designs/{job_id}/{idx}_full.jpg"
            thumb_key = f"ai-designs/{job_id}/{idx}_thumb.jpg"

            cdn_image_url = s3.upload(img_key, pil_to_bytes(gen["image"]))
            cdn_thumb_url = s3.upload(thumb_key, pil_to_bytes(gen["thumbnail"]))

            saved_designs.append({
                "index": idx,
                "image_s3_key": img_key,
                "thumbnail_s3_key": thumb_key,
                "cdn_image_url": cdn_image_url,
                "cdn_thumbnail_url": cdn_thumb_url,
                "prompt_used": gen["prompt_used"],
                "seed": gen["seed"],
                "inference_steps": gen["inference_steps"],
                "guidance_scale": gen["guidance_scale"],
            })

        # ── Step 10: Final callback → completed ──────────────────────────
        duration = time.monotonic() - start_time
        _api_patch(job_id, {
            "status": "completed",
            "stage": "done",
            "progress_percent": 100,
            "fabric_analysis": fabric_analysis,
            "enhanced_prompt": positive_prompt,
            "designs": saved_designs,
            "inference_duration_seconds": duration,
        })

        logger.info(
            "Generation complete",
            extra={"job_id": job_id, "num_designs": len(saved_designs), "duration_s": f"{duration:.1f}"},
        )
        return {
            "job_id": job_id,
            "status": "completed",
            "designs": len(saved_designs),
            "duration_s": duration,
        }

    except SoftTimeLimitExceeded:
        logger.error("Task timed out (soft limit)", extra={"job_id": job_id})
        _api_patch(job_id, {
            "status": "failed",
            "stage": "generating",
            "error_message": "Generation timed out. Please try again.",
        })
        raise

    except Exception as exc:
        logger.error("Generation task failed", extra={"job_id": job_id, "error": str(exc)})
        # Retry on transient errors
        try:
            raise self.retry(exc=exc)
        except self.MaxRetriesExceededError:
            _api_patch(job_id, {
                "status": "failed",
                "stage": "generating",
                "error_message": f"Generation failed after retries: {exc}",
            })
            raise
