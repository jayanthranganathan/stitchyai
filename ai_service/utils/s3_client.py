"""Lightweight S3 client for the AI inference service.

The AI service needs to:
  1. Download fabric images from S3 (uploaded by the mobile app)
  2. Upload generated designs and thumbnails to S3

Dev mode (S3_DEV_MODE=true):
  Reads/writes to LOCAL_STORAGE_DIR (default /tmp/thugil-dev) so the Celery
  worker can run without real AWS credentials during local development.
"""

from __future__ import annotations

import logging
from pathlib import Path

import boto3
from botocore.exceptions import ClientError

from ai_service.core.config import ai_settings

logger = logging.getLogger(__name__)

# Resolved via pydantic-settings (reads .env). NOT os.getenv — that ignores .env files.
def _dev_mode() -> bool:
    return ai_settings.s3_dev_mode

def _dev_storage_dir() -> Path:
    return Path(ai_settings.local_storage_dir)


# ─── local dev stub ───────────────────────────────────────────────────────────

class _LocalS3:
    def __init__(self, storage_dir: Path) -> None:
        self._dir = storage_dir
        self._dir.mkdir(parents=True, exist_ok=True)
        logger.warning(
            "AI service S3_DEV_MODE is ON — using local disk at %s", self._dir
        )

    def _path(self, key: str) -> Path:
        p = self._dir / key
        p.parent.mkdir(parents=True, exist_ok=True)
        return p

    def put_object(self, *, Bucket: str, Key: str, Body: bytes, **_: object) -> dict:
        self._path(Key).write_bytes(Body)
        return {}

    def get_object(self, *, Bucket: str, Key: str, **_: object) -> dict:
        return {"Body": _BytesBody(self._path(Key).read_bytes())}

    def generate_presigned_url(
        self, operation: str, *, Params: dict, ExpiresIn: int = 3600, **_: object
    ) -> str:
        return f"file://{self._dir / Params.get('Key', '')}"


class _BytesBody:
    def __init__(self, data: bytes) -> None:
        self._data = data

    def read(self) -> bytes:
        return self._data


# ─── main client ─────────────────────────────────────────────────────────────

class AIServiceS3Client:
    def __init__(self) -> None:
        if _dev_mode():
            self._client: boto3.client | _LocalS3 = _LocalS3(_dev_storage_dir())
        else:
            if not ai_settings.aws_access_key_id or not ai_settings.aws_secret_access_key:
                raise RuntimeError(
                    "AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be set. "
                    "Add S3_DEV_MODE=true to .env for local development without real S3."
                )
            kwargs: dict = {
                "region_name": ai_settings.s3_region,
                "aws_access_key_id": ai_settings.aws_access_key_id,
                "aws_secret_access_key": ai_settings.aws_secret_access_key,
            }
            if ai_settings.s3_endpoint_url:
                # Non-AWS provider (IONOS, Backblaze B2, MinIO, etc.)
                kwargs["endpoint_url"] = ai_settings.s3_endpoint_url
            self._client = boto3.client("s3", **kwargs)
        self.bucket = ai_settings.s3_bucket
        self.cdn_domain = ai_settings.cloudfront_domain

    def download(self, s3_key: str) -> bytes:
        """Fetch raw image bytes from S3 (or local disk in dev mode)."""
        try:
            resp = self._client.get_object(Bucket=self.bucket, Key=s3_key)
            data: bytes = resp["Body"].read()
            logger.debug("S3 download OK: %s (%d bytes)", s3_key, len(data))
            return data
        except (ClientError, OSError) as exc:
            logger.error("S3 download failed: %s — %s", s3_key, exc)
            raise

    def upload(
        self,
        s3_key: str,
        data: bytes,
        *,
        content_type: str = "image/jpeg",
    ) -> str:
        """Store bytes; return the CDN or signed URL."""
        self._client.put_object(
            Bucket=self.bucket,
            Key=s3_key,
            Body=data,
            ContentType=content_type,
            ServerSideEncryption="AES256",
        )
        logger.debug("S3 upload OK: %s (%d bytes)", s3_key, len(data))
        return self._cdn_url(s3_key)

    def _cdn_url(self, s3_key: str) -> str:
        if self.cdn_domain:
            return f"https://{self.cdn_domain}/{s3_key}"
        return self._client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket, "Key": s3_key},
            ExpiresIn=3600,
        )


# Singleton — initialised once on worker startup alongside model loading
_s3 = AIServiceS3Client()


def get_s3() -> AIServiceS3Client:
    return _s3
