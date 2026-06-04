"""Pytest configuration — set safe defaults for CI where no real services are available."""

from __future__ import annotations

import os

# Set these BEFORE any app module is imported so pydantic-settings picks them up.
# S3_DEV_MODE=true  → uses local file stub, no real S3 credentials required
# DATABASE_URL       → points to SQLite in-memory so tests don't need Postgres
# REDIS_URL          → fake URL; tests that don't hit Redis won't fail
os.environ.setdefault("S3_DEV_MODE", "true")
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")
os.environ.setdefault("JWT_SECRET", "test-secret-key-not-for-production-use-only")
os.environ.setdefault("APP_ENV", "test")
