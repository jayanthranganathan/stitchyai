"""Users service — customer self-service operations."""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.modules.users.repository import UsersRepository
from app.modules.users.schemas import Address, UserMe, UserUpdate


def _to_address(a: dict[str, Any]) -> Address:
    """Build an Address from a stored dict, tolerating the legacy ``street`` key
    (older saved addresses used ``street`` instead of ``line1``)."""
    return Address(
        label=a.get("label") or "Home",
        line1=a.get("line1") or a.get("street") or "",
        line2=a.get("line2"),
        city=a.get("city") or "",
        state=a.get("state") or "",
        pincode=a.get("pincode") or "",
        landmark=a.get("landmark"),
        lat=a.get("lat"),
        lng=a.get("lng"),
    )


class UsersService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = UsersRepository(db)

    def me(self, user_id: uuid.UUID) -> UserMe:
        user = self.repo.get(user_id)
        if not user:
            raise NotFoundError("User not found")
        addresses = []
        if user.customer_profile:
            addresses = [_to_address(a) for a in user.customer_profile.addresses]
        roles = []
        if user.customer_profile:
            roles.append("customer")
        if user.tailor_profile:
            roles.append("tailor")
        if user.delivery_profile:
            roles.append("delivery")
        if user.admin_profile:
            roles.append("admin")
        return UserMe(
            id=str(user.id),
            phone=user.phone,
            email=user.email,
            full_name=user.full_name,
            roles=roles,
            addresses=addresses,
        )

    def update(self, user_id: uuid.UUID, body: UserUpdate) -> UserMe:
        user = self.repo.get(user_id)
        if not user:
            raise NotFoundError("User not found")
        if body.full_name is not None:
            user.full_name = body.full_name
        if body.email is not None:
            user.email = body.email
        if body.addresses is not None:
            if user.customer_profile is None:
                raise NotFoundError("Customer profile not found for this account")
            user.customer_profile.addresses = [a.model_dump() for a in body.addresses]
        self.db.commit()
        return self.me(user_id)
