"""AI Service configuration — GPU inference environment."""

from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class AISettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── App ────────────────────────────────────────────────────────────────
    app_env: str = "development"
    log_level: str = "INFO"
    num_generation_workers: int = 1  # increase for multi-GPU

    # ── Redis / Celery ─────────────────────────────────────────────────────
    redis_url: str = "redis://localhost:6379/0"
    celery_concurrency: int = 1  # 1 per GPU; scale via RunPod autoscale

    # ── S3 / S3-compatible object storage ─────────────────────────────────
    # Works with AWS S3 *and* any S3-compatible provider (IONOS, MinIO, etc.)
    s3_bucket: str = ""
    s3_region: str = "ap-south-1"
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    # Optional: override endpoint for non-AWS providers.
    # IONOS → https://s3-eu-central-1.ionoscloud.com  |  leave empty for AWS
    s3_endpoint_url: str = ""
    cloudfront_domain: str = ""
    # Set true to skip real S3 and use local disk — no credentials needed.
    s3_dev_mode: bool = False
    local_storage_dir: str = "/tmp/thugil-dev"

    # ── Back-channel to main API ───────────────────────────────────────────
    main_api_url: str = "http://api:8000/v1"
    ai_service_api_key: str = ""  # shared secret for service-to-service calls

    # ── Model paths (RunPod volume or HuggingFace cache) ──────────────────
    model_cache_dir: str = "/workspace/models"
    hf_token: str = ""  # HuggingFace token for gated models

    # SAM2
    sam2_checkpoint: str = "facebook/sam2-hiera-large"

    # Qwen2.5-VL
    qwen_model: str = "Qwen/Qwen2.5-VL-7B-Instruct"
    qwen_load_in_4bit: bool = True  # QLoRA 4-bit for VRAM efficiency

    # FLUX.1 Kontext Dev
    flux_model: str = "black-forest-labs/FLUX.1-dev"
    flux_variant: str = "bf16"

    # IP-Adapter (for fabric texture preservation)
    ip_adapter_model: str = "h94/IP-Adapter"
    ip_adapter_scale: float = 0.6

    # ControlNet (garment structure)
    controlnet_model: str = "lllyasviel/control_v11p_sd15_openpose"

    # ── Inference parameters ───────────────────────────────────────────────
    num_inference_steps: int = 28
    guidance_scale: float = 3.5
    num_designs: int = 4
    output_width: int = 768
    output_height: int = 1024
    thumbnail_width: int = 256
    thumbnail_height: int = 341

    # ── GPU ────────────────────────────────────────────────────────────────
    device: str = "cuda"
    torch_dtype: str = "bfloat16"
    enable_xformers: bool = True
    enable_model_cpu_offload: bool = False  # True if VRAM < 24 GB


@lru_cache(maxsize=1)
def get_ai_settings() -> AISettings:
    return AISettings()  # type: ignore[call-arg]


ai_settings = get_ai_settings()
