"""AI Generation — HTTP routes.

Follows the exact same pattern as orders/router.py.
All endpoints require a valid JWT (customer or admin).
"""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.ai.schemas import (
    FabricUploadResponse,
    GenerateDesignsRequest,
    GenerateDesignsResponse,
    GenerationJobPublic,
    ModerationAction,
    RegenerateRequest,
    SaveDesignRequest,
    UsageAnalytics,
)
from app.modules.ai.service import AIGenerationService
from app.shared.dependencies import CurrentUser, current_user, require_roles

router = APIRouter(prefix="/ai", tags=["ai-generation"])


# ─── fabric upload ─────────────────────────────────────────────────────────

@router.post(
    "/fabric-upload",
    response_model=FabricUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a fabric image; returns upload_id for use in /generate-designs",
)
async def upload_fabric(
    image: Annotated[UploadFile, File(description="JPEG/PNG/WebP fabric image, max 15 MB")],
    user: Annotated[CurrentUser, Depends(require_roles("customer"))],
    db: Annotated[Session, Depends(get_db)],
) -> FabricUploadResponse:
    file_data = await image.read()
    return AIGenerationService(db).upload_fabric(uuid.UUID(user.id), file_data)


# ─── generation ────────────────────────────────────────────────────────────

@router.post(
    "/generate-designs",
    response_model=GenerateDesignsResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Enqueue AI design generation. Returns job_id to poll for status.",
)
def generate_designs(
    body: GenerateDesignsRequest,
    user: Annotated[CurrentUser, Depends(require_roles("customer"))],
    db: Annotated[Session, Depends(get_db)],
) -> GenerateDesignsResponse:
    return AIGenerationService(db).generate_designs(uuid.UUID(user.id), body)


@router.get(
    "/generation-status/{job_id}",
    response_model=GenerationJobPublic,
    summary="Poll generation status. Poll every 3 s (processing) or 10 s (queued).",
)
def generation_status(
    job_id: uuid.UUID,
    user: Annotated[CurrentUser, Depends(current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> GenerationJobPublic:
    return AIGenerationService(db).get_status(uuid.UUID(user.id), job_id)


@router.get(
    "/results/{job_id}",
    response_model=GenerationJobPublic,
    summary="Fetch completed results (409 if still in progress).",
)
def get_results(
    job_id: uuid.UUID,
    user: Annotated[CurrentUser, Depends(current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> GenerationJobPublic:
    return AIGenerationService(db).get_results(uuid.UUID(user.id), job_id)


@router.post(
    "/regenerate",
    response_model=GenerateDesignsResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Re-run generation on an existing job (creates a new job).",
)
def regenerate(
    body: RegenerateRequest,
    user: Annotated[CurrentUser, Depends(require_roles("customer"))],
    db: Annotated[Session, Depends(get_db)],
) -> GenerateDesignsResponse:
    return AIGenerationService(db).regenerate(uuid.UUID(user.id), body)


# ─── save / history ────────────────────────────────────────────────────────

@router.post(
    "/save-design",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Save a generated design to the user's collection.",
)
def save_design(
    body: SaveDesignRequest,
    user: Annotated[CurrentUser, Depends(require_roles("customer"))],
    db: Annotated[Session, Depends(get_db)],
) -> None:
    AIGenerationService(db).save_design(uuid.UUID(user.id), uuid.UUID(body.design_id))


@router.delete(
    "/save-design/{design_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove a design from saved collection.",
)
def unsave_design(
    design_id: uuid.UUID,
    user: Annotated[CurrentUser, Depends(require_roles("customer"))],
    db: Annotated[Session, Depends(get_db)],
) -> None:
    AIGenerationService(db).unsave_design(uuid.UUID(user.id), design_id)


@router.get(
    "/history",
    response_model=list[GenerationJobPublic],
    summary="User's generation history (most recent first).",
)
def get_history(
    user: Annotated[CurrentUser, Depends(require_roles("customer"))],
    db: Annotated[Session, Depends(get_db)],
) -> list[GenerationJobPublic]:
    return AIGenerationService(db).get_history(uuid.UUID(user.id))


# ─── admin endpoints ───────────────────────────────────────────────────────

@router.get(
    "/admin/jobs",
    response_model=list[GenerationJobPublic],
    summary="[Admin] List all jobs with optional moderation / status filters.",
)
def admin_list_jobs(
    _user: Annotated[CurrentUser, Depends(require_roles("admin"))],
    db: Annotated[Session, Depends(get_db)],
    moderation: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    limit: int = Query(default=50, le=200),
    offset: int = Query(default=0),
) -> list[GenerationJobPublic]:
    return AIGenerationService(db).admin_list_jobs(
        limit=limit, offset=offset,
        moderation_filter=moderation,
        status_filter=status_filter,
    )


@router.post(
    "/admin/jobs/{job_id}/moderate",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="[Admin] Approve, flag, or remove a job and its designs.",
)
def moderate_job(
    job_id: uuid.UUID,
    body: ModerationAction,
    user: Annotated[CurrentUser, Depends(require_roles("admin"))],
    db: Annotated[Session, Depends(get_db)],
) -> None:
    AIGenerationService(db).admin_moderate(uuid.UUID(user.id), job_id, body)


@router.get(
    "/admin/analytics",
    response_model=UsageAnalytics,
    summary="[Admin] GPU usage and generation analytics.",
)
def admin_analytics(
    _user: Annotated[CurrentUser, Depends(require_roles("admin"))],
    db: Annotated[Session, Depends(get_db)],
) -> UsageAnalytics:
    return AIGenerationService(db).admin_analytics()
