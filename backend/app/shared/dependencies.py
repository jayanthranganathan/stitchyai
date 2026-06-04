"""Common FastAPI dependencies — auth and role checks."""

from __future__ import annotations

from typing import Annotated

import jwt
from fastapi import Depends, Header

from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.security import decode_token


class CurrentUser:
    def __init__(self, user_id: str, roles: list[str]) -> None:
        self.id = user_id
        self.roles = roles

    def has_role(self, role: str) -> bool:
        return role in self.roles


def current_user(authorization: Annotated[str | None, Header()] = None) -> CurrentUser:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise UnauthorizedError("Missing or malformed Authorization header")
    token = authorization.split(" ", 1)[1]
    try:
        payload = decode_token(token)
    except jwt.PyJWTError as exc:
        raise UnauthorizedError(f"Invalid token: {exc}") from exc
    if payload.get("type") != "access":
        raise UnauthorizedError("Wrong token type")
    return CurrentUser(user_id=payload["sub"], roles=payload.get("roles", []))


def require_roles(*roles: str):
    def _checker(user: Annotated[CurrentUser, Depends(current_user)]) -> CurrentUser:
        if not any(user.has_role(r) for r in roles):
            raise ForbiddenError(f"Requires one of roles: {', '.join(roles)}")
        return user

    return _checker
