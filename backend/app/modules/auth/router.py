"""Auth HTTP routes."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.modules.auth.firebase_provider import verify_id_token
from app.modules.auth.schemas import (
    AuthResult,
    FirebaseLogin,
    OtpRequest,
    OtpVerify,
    RefreshRequest,
    TokenPair,
)
from app.modules.auth.service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/otp/request",
    status_code=status.HTTP_202_ACCEPTED,
    responses={202: {"description": "OTP dispatched (SMS in production, use 123456 in dev)"}},
)
def request_otp(body: OtpRequest, db: Annotated[Session, Depends(get_db)]) -> dict[str, str]:
    AuthService(db).request_otp(body.phone)
    mode = "sms" if settings.app_env == "production" else "dev"
    return {"status": "sent", "mode": mode}


@router.post("/otp/verify", response_model=AuthResult)
def verify_otp(body: OtpVerify, db: Annotated[Session, Depends(get_db)]) -> AuthResult:
    return AuthService(db).verify_and_login(body.phone, body.code)


@router.post("/firebase", response_model=AuthResult)
def firebase_login(body: FirebaseLogin, db: Annotated[Session, Depends(get_db)]) -> AuthResult:
    """Exchange a verified Firebase ID token for our own JWT pair.

    The app completes the phone OTP via Firebase (no DLT/GST), then posts the
    ID token here. We verify it and find-or-create the user by phone.
    """
    phone = verify_id_token(body.id_token)
    return AuthService(db).login_with_verified_phone(phone)


@router.post("/refresh", response_model=TokenPair)
def refresh(_body: RefreshRequest) -> TokenPair:
    # TODO: implement refresh-token rotation backed by Redis denylist
    raise NotImplementedError


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout() -> None:
    # TODO: add refresh token to revoke list
    return None
