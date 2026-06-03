"""Catalog module schemas."""

from __future__ import annotations

from pydantic import BaseModel


class CategoryPublic(BaseModel):
    id: str
    slug: str
    name: str
    icon_url: str | None
    sort_order: int


class DesignPublic(BaseModel):
    id: str
    category_id: str
    name: str
    description: str | None
    images: list[str]
    base_price: float
    tags: list[str]


class ProposalCreate(BaseModel):
    category_slug: str
    description: str
    reference_images: list[str] = []


class ProposalPublic(BaseModel):
    id: str
    category_id: str
    description: str
    reference_images: list[str]
