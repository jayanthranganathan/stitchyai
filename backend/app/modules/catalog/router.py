"""Catalog HTTP routes."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.catalog.schemas import (
    CategoryPublic,
    DesignPublic,
    ProposalCreate,
    ProposalPublic,
)
from app.modules.catalog.service import CatalogService
from app.shared.dependencies import CurrentUser, current_user

router = APIRouter(prefix="/catalog", tags=["catalog"])


@router.get("/categories", response_model=list[CategoryPublic])
def list_categories(db: Annotated[Session, Depends(get_db)]) -> list[CategoryPublic]:
    return CatalogService(db).categories()


@router.get("/categories/{slug}/designs", response_model=list[DesignPublic])
def list_designs(slug: str, db: Annotated[Session, Depends(get_db)]) -> list[DesignPublic]:
    return CatalogService(db).designs_in(slug)


@router.post("/proposals", response_model=ProposalPublic, status_code=status.HTTP_201_CREATED)
def create_proposal(
    _body: ProposalCreate,
    _user: Annotated[CurrentUser, Depends(current_user)],
    _db: Annotated[Session, Depends(get_db)],
) -> ProposalPublic:
    # TODO: implement
    raise NotImplementedError
