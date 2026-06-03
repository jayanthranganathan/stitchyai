"""S3 service for AI-generated content.

Handles:
  - Fabric image uploads from mobile (signed PUT URLs or direct multipart)
  - Generated design / thumbnail storage
  - Signed GET URL generation with configurable TTL
  - Image validation (MIME type + magic bytes)

Dev mode (S3_DEV_MODE=true in .env):
  - Saves files to LOCAL_STORAGE_DIR (default: /tmp/thugil-dev)
  - Returns local file:// or data URIs instead of S3/CDN URLs
  - No AWS credentials required — use this for local development
"""

from __future__ import annotations

import io
import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path

import boto3
from botocore.exceptions import ClientError
from PIL import Image as PILImage

from app.core.config import settings
from app.core.exceptions import ValidationError

logger = logging.getLogger(__name__)

# ─── constants ────────────────────────────────────────────────────────────────

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_MAGIC_BYTES = {
    b"\xff\xd8\xff",       # JPEG
    b"\x89PNG\r\n\x1a\n",  # PNG
    b"RIFF",               # WebP (RIFF container)
}
MAX_UPLOAD_SIZE_BYTES = 15 * 1024 * 1024  # 15 MB
SIGNED_URL_EXPIRY_SECONDS = 3600          # 1 hour for results
FABRIC_UPLOAD_EXPIRY_SECONDS = 300        # 5 min (just for preview)

# Resolved via pydantic-settings (reads .env) — NOT os.getenv (which ignores .env).
# Evaluated lazily inside S3Service.__init__ so settings is fully loaded first.
def _dev_mode() -> bool:
    return settings.s3_dev_mode

def _dev_storage_dir() -> Path:
    return Path(settings.local_storage_dir)


# ─── dev-mode local storage (no AWS credentials needed) ───────────────────────

class _LocalS3:
    """Drop-in replacement for the boto3 client used in dev/test mode."""

    def __init__(self, storage_dir: Path) -> None:
        self._dir = storage_dir
        self._dir.mkdir(parents=True, exist_ok=True)
        logger.warning(
            "S3_DEV_MODE is ON — files written to %s, NOT to AWS S3. "
            "Set S3_DEV_MODE=false and fill in AWS credentials for production.",
            self._dir,
        )

    def _path(self, key: str) -> Path:
        p = self._dir / key
        p.parent.mkdir(parents=True, exist_ok=True)
        return p

    def put_object(self, *, Bucket: str, Key: str, Body: bytes, **_: object) -> dict:
        self._path(Key).write_bytes(Body)
        logger.debug("LocalS3 put_object: %s", Key)
        return {}

    def get_object(self, *, Bucket: str, Key: str, **_: object) -> dict:
        data = self._path(Key).read_bytes()
        return {"Body": _BytesBody(data)}

    def generate_presigned_url(
        self, operation: str, *, Params: dict, ExpiresIn: int = 3600, **_: object
    ) -> str:
        # Return a local file path as a pseudo-URL for dev tooling inspection.
        key = Params.get("Key", "")
        return f"file://{self._dir / key}"


class _BytesBody:
    def __init__(self, data: bytes) -> None:
        self._data = data

    def read(self) -> bytes:
        return self._data


# ─── service ──────────────────────────────────────────────────────────────────


class S3Service:
    """Thin wrapper around boto3 (or local dev stub) with domain-specific helpers."""

    def __init__(self) -> None:
        if _dev_mode():
            self._client: boto3.client | _LocalS3 = _LocalS3(_dev_storage_dir())
        else:
            if not settings.aws_access_key_id or not settings.aws_secret_access_key:
                raise RuntimeError(
                    "AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be set in .env. "
                    "To run locally without real S3, add S3_DEV_MODE=true to .env."
                )
            kwargs: dict = {
                "region_name": settings.s3_region,
                "aws_access_key_id": settings.aws_access_key_id,
                "aws_secret_access_key": settings.aws_secret_access_key,
            }
            if settings.s3_endpoint_url:
                # Non-AWS provider (IONOS, Backblaze B2, MinIO, etc.)
                kwargs["endpoint_url"] = settings.s3_endpoint_url
            self._client = boto3.client("s3", **kwargs)
        self.bucket = settings.s3_bucket
        self.cdn_domain = settings.cloudfront_domain

    # ── upload ─────────────────────────────────────────────────────────────

    def upload_fabric(self, file_data: bytes, user_id: str) -> tuple[str, str]:
        """
        Validate and store a raw fabric image.

        Returns:
            (s3_key, signed_url)  — signed_url is short-lived (5 min), for preview only.
        """
        self._validate_image_bytes(file_data)

        key = f"fabric-uploads/{user_id}/{uuid.uuid4()}.jpg"
        self._put_object(key, file_data, content_type="image/jpeg")
        signed_url = self._presign_get(key, expiry=FABRIC_UPLOAD_EXPIRY_SECONDS)
        logger.info("Fabric uploaded", extra={"key": key, "user_id": user_id})
        return key, signed_url

    def upload_generated_design(
        self,
        image_data: bytes,
        job_id: str,
        index: int,
        *,
        is_thumbnail: bool = False,
    ) -> str:
        """Store a generated design image; return the S3 key."""
        suffix = "thumb" if is_thumbnail else "full"
        key = f"ai-designs/{job_id}/{index}_{suffix}.jpg"
        self._put_object(key, image_data, content_type="image/jpeg")
        return key

    # ── URL generation ─────────────────────────────────────────────────────

    def get_signed_url(self, s3_key: str, expiry: int = SIGNED_URL_EXPIRY_SECONDS) -> str:
        """Return a signed S3 URL (fallback when CloudFront is not configured)."""
        return self._presign_get(s3_key, expiry=expiry)

    def get_cdn_url(self, s3_key: str) -> str:
        """Return a CloudFront URL (preferred for generated results)."""
        if self.cdn_domain:
            return f"https://{self.cdn_domain}/{s3_key}"
        # Graceful fallback: signed S3 URL
        return self.get_signed_url(s3_key)

    # ── download (AI service fetches fabric for inference) ─────────────────

    def download_fabric(self, s3_key: str) -> bytes:
        """Download fabric image bytes for the AI inference worker."""
        try:
            resp = self._client.get_object(Bucket=self.bucket, Key=s3_key)
            return resp["Body"].read()
        except (ClientError, OSError) as exc:
            logger.error("S3 download failed", extra={"key": s3_key, "error": str(exc)})
            raise

    # ── internals ──────────────────────────────────────────────────────────

    def _put_object(self, key: str, data: bytes, *, content_type: str) -> None:
        self._client.put_object(
            Bucket=self.bucket,
            Key=key,
            Body=data,
            ContentType=content_type,
            ServerSideEncryption="AES256",
            Metadata={"uploaded_at": datetime.now(timezone.utc).isoformat()},
        )

    def _presign_get(self, key: str, *, expiry: int) -> str:
        return self._client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket, "Key": key},
            ExpiresIn=expiry,
        )

    @staticmethod
    def _validate_image_bytes(data: bytes) -> None:
        """Reject oversized files and non-image content via magic bytes."""
        if len(data) > MAX_UPLOAD_SIZE_BYTES:
            raise ValidationError(
                f"Image too large ({len(data) // 1024 // 1024} MB). Maximum is 15 MB."
            )
        # Magic-byte check — faster & more reliable than trusting MIME header
        magic = data[:8]
        if not any(magic.startswith(m) for m in ALLOWED_MAGIC_BYTES):
            raise ValidationError("Unsupported image format. Please upload JPEG, PNG, or WebP.")
        # Attempt to open with Pillow as a final sanity check
        try:
            img = PILImage.open(io.BytesIO(data))
            img.verify()
        except Exception as exc:
            raise ValidationError(f"Corrupted or invalid image: {exc}") from exc


def get_s3_service() -> S3Service:
    """FastAPI dependency factory (cached singleton per process)."""
    return _s3_singleton


_s3_singleton = S3Service()
