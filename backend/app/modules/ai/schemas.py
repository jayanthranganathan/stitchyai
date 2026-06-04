"""AI Generation module — Pydantic schemas (request / response bodies)."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

# ─── shared ───────────────────────────────────────────────────────────────────


class FabricAnalysisSchema(BaseModel):
    fabric_type: str
    texture: str
    motifs: list[str]
    colors: list[str]
    embroidery: str | None
    material: str
    generated_prompt: str


class GeneratedDesignPublic(BaseModel):
    id: str
    index: int
    image_url: str
    thumbnail_url: str
    prompt_used: str | None
    seed: int | None
    is_saved: bool


# ─── requests ─────────────────────────────────────────────────────────────────


class GenerateDesignsRequest(BaseModel):
    upload_id: str = Field(description="S3 key returned by the fabric-upload endpoint")
    category: str = Field(description="One of the 12 supported FashionCategory values")
    style_notes: str | None = Field(
        default=None,
        max_length=500,
        description="Optional free-text style guidance from the customer",
    )


class RegenerateRequest(BaseModel):
    job_id: str
    design_index: int | None = Field(
        default=None,
        ge=0,
        le=3,
        description="If omitted all 4 designs are regenerated",
    )
    style_notes: str | None = Field(default=None, max_length=500)


class SaveDesignRequest(BaseModel):
    design_id: str


class ModerationAction(BaseModel):
    """Admin-only: update moderation status of a job or design."""

    status: str = Field(description="approved | flagged | removed")
    note: str | None = Field(default=None, max_length=500)


# ─── responses ────────────────────────────────────────────────────────────────


class FabricUploadResponse(BaseModel):
    upload_id: str
    fabric_url: str  # short-lived signed URL for preview only


class GenerateDesignsResponse(BaseModel):
    job_id: str
    status: str
    queue_position: int | None
    estimated_wait_seconds: int | None


class GenerationJobPublic(BaseModel):
    job_id: str
    status: str
    stage: str
    progress_percent: int
    queue_position: int | None
    category: str
    fabric_analysis: FabricAnalysisSchema | None
    enhanced_prompt: str | None
    designs: list[GeneratedDesignPublic]
    error_message: str | None
    created_at: datetime
    completed_at: datetime | None


class DesignHistoryItem(BaseModel):
    job_id: str
    category: str
    status: str
    thumbnail_url: str | None  # first design's thumbnail, or None
    design_count: int
    created_at: datetime


class AdminJobSummary(BaseModel):
    job_id: str
    user_id: str
    category: str
    status: str
    moderation_status: str
    design_count: int
    inference_duration_seconds: float | None
    created_at: datetime


class UsageAnalytics(BaseModel):
    total_jobs: int
    completed_jobs: int
    failed_jobs: int
    total_designs_generated: int
    total_saved_designs: int
    avg_inference_duration_seconds: float | None
    jobs_by_category: dict[str, int]
    jobs_last_7_days: int
