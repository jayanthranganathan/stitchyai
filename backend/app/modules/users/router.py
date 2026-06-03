"""Users HTTP routes."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.users.schemas import UserMe, UserUpdate
from app.modules.users.service import UsersService
from app.shared.dependencies import CurrentUser, current_user

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserMe)
def get_me(
    user: Annotated[CurrentUser, Depends(current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> UserMe:
    return UsersService(db).me(uuid.UUID(user.id))


@router.patch("/me", response_model=UserMe)
def update_me(
    body: UserUpdate,
    user: Annotated[CurrentUser, Depends(current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> UserMe:
    return UsersService(db).update(uuid.UUID(user.id), body)
