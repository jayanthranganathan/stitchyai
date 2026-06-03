"""OTP provider abstraction.

In production this wraps MSG91; in dev/tests we use the in-memory provider
that always returns "123456" so flows are easy to exercise without a real SIM.

Switch:  set APP_ENV=production in .env — the factory auto-selects MSG91.
"""

from __future__ import annotations

import logging
import secrets
from typing import Protocol

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


# ── Protocol ──────────────────────────────────────────────────────────────────

class OtpProvider(Protocol):
    def send(self, phone: str) -> str: ...      # returns code only for dev/mock
    def verify(self, phone: str, code: str) -> bool: ...


# ── Dev / Test provider ───────────────────────────────────────────────────────

class InMemoryOtpProvider:
    """Generates and stores OTPs in-process. Dev and tests only.
    Always uses code 123456 so you never need a real phone in development.
    """

    def __init__(self) -> None:
        self._store: dict[str, str] = {}

    def send(self, phone: str) -> str:
        code = "123456"
        self._store[phone] = code
        logger.info("[InMemoryOTP] OTP for %s → %s", phone, code)
        return code

    def verify(self, phone: str, code: str) -> bool:
        return self._store.get(phone) == code


# ── MSG91 production provider ─────────────────────────────────────────────────

class Msg91OtpProvider:
    """Sends and verifies OTPs via MSG91 v5 API.

    Set these in .env:
        MSG91_AUTH_KEY        — API auth key from MSG91 dashboard
        MSG91_TEMPLATE_ID     — DLT-registered OTP template ID
        MSG91_SENDER_ID       — 6-character sender ID (e.g. THUGIL)

    MSG91 generates the OTP itself; we never see the code.
    verify() calls MSG91's verify endpoint with the code the user typed.
    """

    _SEND_URL   = "https://control.msg91.com/api/v5/otp"
    _VERIFY_URL = "https://control.msg91.com/api/v5/otp/verify"

    def __init__(self) -> None:
        if not settings.msg91_auth_key:
            raise RuntimeError("MSG91_AUTH_KEY is not set in .env")
        if not settings.msg91_template_id:
            raise RuntimeError("MSG91_TEMPLATE_ID is not set in .env")

    @staticmethod
    def _normalize(phone: str) -> str:
        """Convert +919876543210 → 919876543210 (MSG91 format, no + sign)."""
        return phone.lstrip("+")

    def send(self, phone: str) -> str:
        mobile = self._normalize(phone)
        payload = {
            "template_id": settings.msg91_template_id,
            "mobile":       mobile,
        }
        headers = {
            "authkey":      settings.msg91_auth_key,
            "Content-Type": "application/json",
            "Accept":       "application/json",
        }
        try:
            resp = httpx.post(
                self._SEND_URL,
                json=payload,
                headers=headers,
                timeout=10,
            )
            resp.raise_for_status()
            data = resp.json()
            logger.info("[MSG91] OTP sent to %s — response: %s", phone, data)
        except httpx.HTTPStatusError as exc:
            logger.error("[MSG91] Send failed: %s — %s", exc.response.status_code, exc.response.text)
            raise RuntimeError(f"MSG91 send failed: {exc.response.text}") from exc
        except httpx.RequestError as exc:
            logger.error("[MSG91] Network error: %s", exc)
            raise RuntimeError("Could not reach MSG91 — check network") from exc

        # MSG91 generates the OTP; we don't get it back.
        # Return empty string — the verify() call uses MSG91's verify API.
        return ""

    def verify(self, phone: str, code: str) -> bool:
        mobile = self._normalize(phone)
        headers = {
            "authkey": settings.msg91_auth_key,
            "Accept":  "application/json",
        }
        params = {"otp": code, "mobile": mobile}
        try:
            resp = httpx.get(
                self._VERIFY_URL,
                params=params,
                headers=headers,
                timeout=10,
            )
            data = resp.json()
            logger.info("[MSG91] Verify %s → %s", phone, data)
            # MSG91 returns {"type": "success"} on match
            return str(data.get("type", "")).lower() == "success"
        except Exception as exc:
            logger.error("[MSG91] Verify error: %s", exc)
            return False


# ── Factory ───────────────────────────────────────────────────────────────────

def get_otp_provider() -> OtpProvider:
    """Return the right provider based on APP_ENV.

    development / test  →  InMemoryOtpProvider (OTP = 123456, no SMS sent)
    production          →  Msg91OtpProvider    (real SMS via MSG91)
    """
    if settings.app_env == "production":
        return Msg91OtpProvider()
    return InMemoryOtpProvider()
