"""Auth HTTP routes."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.auth.schemas import AuthResult, OtpRequest, OtpVerify, RefreshRequest, TokenPair
from app.modules.auth.service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/otp/request", status_code=status.HTTP_202_ACCEPTED)
def request_otp(body: OtpRequest, db: Annotated[Session, Depends(get_db)]) -> dict[str, str]:
    AuthService(db).request_otp(body.phone)
    return {"status": "sent"}


@router.post("/otp/verify", response_model=AuthResult)
def verify_otp(body: OtpVerify, db: Annotated[Session, Depends(get_db)]) -> AuthResult:
    return AuthService(db).verify_and_login(body.phone, body.code)


@router.post("/refresh", response_model=TokenPair)
def refresh(_body: RefreshRequest) -> TokenPair:
    # TODO: implement refresh-token rotation backed by Redis denylist
    raise NotImplementedError


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout() -> None:
    # TODO: add refresh token to revoke list
    return None
