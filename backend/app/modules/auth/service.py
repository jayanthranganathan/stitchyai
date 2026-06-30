"""Auth business logic: OTP issue/verify + JWT issue."""

from __future__ import annotations

from typing import Any

import jwt
from sqlalchemy.orm import Session

from app.core.exceptions import UnauthorizedError
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.models.user import UserAccount
from app.modules.auth.otp_provider import OtpProvider, get_otp_provider
from app.modules.auth.repository import AuthRepository
from app.modules.auth.schemas import AuthResult, TokenPair, UserPublic


class AuthService:
    def __init__(self, db: Session, otp: OtpProvider | None = None) -> None:
        self.repo = AuthRepository(db)
        self.otp = otp or get_otp_provider()

    def request_otp(self, phone: str) -> None:
        self.otp.send(phone)

    def verify_and_login(self, phone: str, code: str) -> AuthResult:
        if not self.otp.verify(phone, code):
            raise UnauthorizedError("Invalid OTP")
        return self.login_with_verified_phone(phone)

    def login_with_verified_phone(self, phone: str) -> AuthResult:
        """Find-or-create the user for an already-verified phone, issue JWTs.

        Used by both the OTP flow and the Firebase phone-auth flow — the phone
        is trusted by the time we reach here.
        """
        user = self.repo.find_by_phone(phone) or self.repo.create(phone=phone)
        return self._issue(user)

    def login_with_firebase(self, phone: str | None, email: str | None) -> AuthResult:
        """Find-or-create a user from a verified Firebase identity (phone or email)."""
        user = None
        if phone:
            user = self.repo.find_by_phone(phone)
        if user is None and email:
            user = self.repo.find_by_email(email)
        if user is None:
            user = self.repo.create(phone=phone, email=email)
        return self._issue(user)

    def refresh(self, refresh_token: str) -> TokenPair:
        """Validate a refresh JWT and mint a fresh access+refresh pair (rotation).

        Lets the mobile app keep a session alive silently after the short-lived
        access token expires — the user stays logged in until they sign out.
        """
        try:
            payload = decode_token(refresh_token)
        except jwt.PyJWTError as exc:
            raise UnauthorizedError("Invalid or expired refresh token") from exc
        if payload.get("type") != "refresh":
            raise UnauthorizedError("Not a refresh token")
        user_id = payload.get("sub")
        user = self.repo.get(user_id) if user_id else None
        if user is None or not user.is_active:
            raise UnauthorizedError("Account no longer active")
        roles = self._derive_roles(user)
        return TokenPair(
            access=create_access_token(subject=str(user.id), roles=roles),
            refresh=create_refresh_token(subject=str(user.id)),
        )

    def _issue(self, user: UserAccount) -> AuthResult:
        roles = self._derive_roles(user)
        return AuthResult(
            user=UserPublic(
                id=str(user.id),
                phone=user.phone,
                email=user.email,
                full_name=user.full_name,
                roles=roles,
            ),
            tokens=TokenPair(
                access=create_access_token(subject=str(user.id), roles=roles),
                refresh=create_refresh_token(subject=str(user.id)),
            ),
        )

    @staticmethod
    def _derive_roles(user: Any) -> list[str]:
        roles = []
        if user.customer_profile:
            roles.append("customer")
        if user.tailor_profile:
            roles.append("tailor")
        if user.delivery_profile:
            roles.append("delivery")
        if user.admin_profile:
            roles.append("admin")
        if not roles:
            roles.append("customer")  # default first-time role
        return roles
