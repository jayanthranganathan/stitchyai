"""Admin profile model."""

from __future__ import annotations

import enum
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import JSON, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.base_model import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.user import UserAccount


class AdminRole(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    OPS = "ops"
    SUPPORT = "support"


class AdminProfile(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "admin_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user_accounts.id", ondelete="CASCADE"),
        unique=True,
        index=True,
    )
    role: Mapped[AdminRole] = mapped_column(
        Enum(AdminRole, values_callable=lambda x: [e.value for e in x]), default=AdminRole.OPS
    )
    permissions: Mapped[list[str]] = mapped_column(JSON, default=list)

    user: Mapped[UserAccount] = relationship(back_populates="admin_profile")
