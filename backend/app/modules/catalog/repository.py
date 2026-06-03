"""Catalog repository."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.catalog import Category, Design


class CatalogRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_categories(self) -> list[Category]:
        return (
            self.db.query(Category)
            .filter(Category.is_active.is_(True))
            .order_by(Category.sort_order)
            .all()
        )

    def find_category(self, slug: str) -> Category | None:
        return self.db.query(Category).filter(Category.slug == slug).one_or_none()

    def list_designs(self, category_id) -> list[Design]:
        return (
            self.db.query(Design)
            .filter(Design.category_id == category_id, Design.is_active.is_(True))
            .all()
        )
