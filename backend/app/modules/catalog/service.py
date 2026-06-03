"""Catalog service."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.modules.catalog.repository import CatalogRepository
from app.modules.catalog.schemas import CategoryPublic, DesignPublic


class CatalogService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = CatalogRepository(db)

    def categories(self) -> list[CategoryPublic]:
        return [
            CategoryPublic(
                id=str(c.id),
                slug=c.slug,
                name=c.name,
                icon_url=c.icon_url,
                sort_order=c.sort_order,
            )
            for c in self.repo.list_categories()
        ]

    def designs_in(self, slug: str) -> list[DesignPublic]:
        cat = self.repo.find_category(slug)
        if not cat:
            raise NotFoundError(f"Unknown category: {slug}")
        return [
            DesignPublic(
                id=str(d.id),
                category_id=str(d.category_id),
                name=d.name,
                description=d.description,
                images=list(d.images or []),
                base_price=float(d.base_price),
                tags=list(d.tags or []),
            )
            for d in self.repo.list_designs(cat.id)
        ]
