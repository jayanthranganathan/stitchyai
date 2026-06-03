"""Auth business logic: OTP issue/verify + JWT issue."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.exceptions import UnauthorizedError
from app.core.security import create_access_token, create_refresh_token
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

        user = self.repo.find_by_phone(phone) or self.repo.create(phone)
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
    def _derive_roles(user) -> list[str]:
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
