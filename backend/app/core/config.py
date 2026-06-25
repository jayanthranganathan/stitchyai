"""Application configuration, loaded from environment variables."""

from __future__ import annotations

from functools import lru_cache

from pydantic import Field, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- App ---
    app_env: str = "development"
    app_name: str = "thugil-api"
    log_level: str = "INFO"

    # --- Database / cache ---
    database_url: str
    redis_url: str = "redis://localhost:6379/0"

    # --- Security ---
    jwt_secret: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhMTAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMzEiLCJyb2xlcyI6WyJhZG1pbiJdLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzc5ODQwNTc2LCJleHAiOjE4MTEzNzY1NzZ9.BwFaZH2od7i2ORLPznsUVFqIovw7txd39y_hnD7PfpQ"
    jwt_access_minutes: int = 15
    jwt_refresh_days: int = 30
    jwt_algorithm: str = "HS256"

    # --- OTP (MSG91) ---
    msg91_auth_key: str = ""
    msg91_template_id: str = ""
    msg91_sender_id: str = "THUGIL"

    # --- Firebase phone auth (no GST/DLT needed) ---
    # Service-account JSON as a single-line string. Empty = Firebase auth disabled.
    firebase_credentials_json: str = ""

    # --- Razorpay ---
    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""
    razorpay_webhook_secret: str = ""

    # --- FCM ---
    fcm_server_key: str = ""

    # --- Google Maps ---
    google_maps_api_key: str = ""

    # --- S3 / S3-compatible object storage ---
    # Works with AWS S3 *and* any S3-compatible provider (IONOS, MinIO, Backblaze B2, etc.)
    s3_bucket: str = ""
    s3_region: str = "ap-south-1"
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    # Optional: override the S3 endpoint for non-AWS providers.
    # AWS S3       → leave empty (default)
    # IONOS        → https://s3-eu-central-1.ionoscloud.com
    # Backblaze B2 → https://s3.us-west-004.backblazeb2.com
    # MinIO local  → http://localhost:9000
    s3_endpoint_url: str = ""
    # Set true in .env to skip real S3 and write to local_storage_dir instead.
    # Useful for local development without any object storage credentials.
    s3_dev_mode: bool = False
    local_storage_dir: str = "/tmp/thugil-dev"

    # --- CDN ---
    # Optional: set your CDN domain (CloudFront, IONOS CDN, Cloudflare, etc.)
    # Leave empty to serve images via signed S3 URLs instead.
    cloudfront_domain: str = ""  # e.g. "cdn.thugil.in"

    # --- AI inference service ---
    ai_service_url: str = "http://ai-service:8001"  # internal docker network URL
    ai_service_api_key: str = ""  # shared secret for service-to-service calls

    # --- Celery / AI queue ---
    # Redis url is already defined above (shared broker)
    ai_generation_queue: str = "ai_generation"

    # --- CORS ---
    cors_origins_str: str = Field(default="*")

    @computed_field  # type: ignore[prop-decorator]
    @property
    def cors_origins(self) -> list[str]:
        """Parse comma-separated origins into a list."""
        return [origin.strip() for origin in self.cors_origins_str.split(",")]

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
