"""OTP provider abstraction.

In production this wraps MSG91; in dev/tests we use the in-memory provider
that always returns "123456" so flows are easy to exercise without a real SIM.

Switch:  set APP_ENV=production in .env — the factory auto-selects MSG91.
"""

from __future__ import annotations

import logging
from typing import Protocol

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


# ── Protocol ──────────────────────────────────────────────────────────────────


class OtpProvider(Protocol):
    def send(self, phone: str) -> str: ...  # returns code only for dev/mock
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

    Required env vars (Railway Variables tab):
        MSG91_AUTH_KEY        — API auth key from MSG91 dashboard → Settings → API key
        MSG91_TEMPLATE_ID     — OTP template ID from MSG91 dashboard (NOT the DLT template ID)
        MSG91_SENDER_ID       — 6-character sender ID registered on DLT (e.g. THUGIL)

    MSG91 generates the OTP; we never see the code.
    verify() calls MSG91's verify endpoint with the code the user typed.
    """

    _SEND_URL = "https://control.msg91.com/api/v5/otp"
    _VERIFY_URL = "https://control.msg91.com/api/v5/otp/verify"

    def __init__(self) -> None:
        # Strip whitespace — a common Railway copy-paste issue
        self._auth_key = settings.msg91_auth_key.strip()
        self._template_id = settings.msg91_template_id.strip()

        if not self._auth_key:
            raise RuntimeError(
                "MSG91_AUTH_KEY is empty. Set it in Railway → your service → Variables."
            )
        if not self._template_id:
            raise RuntimeError(
                "MSG91_TEMPLATE_ID is empty. Set it in Railway → your service → Variables."
            )

        # Log masked credentials so Railway logs confirm they are loaded
        logger.info(
            "[MSG91] Provider initialised — auth_key=...%s template_id=%s",
            self._auth_key[-6:],
            self._template_id,
        )

    @staticmethod
    def _normalize(phone: str) -> str:
        """Convert +919876543210 → 919876543210 (MSG91 format, no + sign)."""
        return phone.lstrip("+")

    def send(self, phone: str) -> str:
        mobile = self._normalize(phone)
        payload = {
            "template_id": self._template_id,
            "mobile": mobile,
        }
        headers = {
            "authkey": self._auth_key,
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        # Log the outgoing request so Railway shows it even if MSG91 never responds
        logger.info(
            "[MSG91] Sending OTP → mobile=%s template_id=%s url=%s",
            mobile,
            self._template_id,
            self._SEND_URL,
        )

        try:
            resp = httpx.post(
                self._SEND_URL,
                json=payload,
                headers=headers,
                timeout=10,
            )
            logger.info("[MSG91] HTTP %s ← %s", resp.status_code, resp.text[:300])
            resp.raise_for_status()

            data = resp.json()

            # MSG91 returns HTTP 200 even for errors — check the body type field
            response_type = str(data.get("type", "")).lower()
            if response_type == "error":
                msg = data.get("message", "unknown error")
                logger.error("[MSG91] API error response: %s", data)
                raise RuntimeError(f"MSG91 rejected the request: {msg}")

            logger.info("[MSG91] OTP dispatched to %s — response: %s", phone, data)

        except httpx.HTTPStatusError as exc:
            logger.error(
                "[MSG91] HTTP error %s — body: %s",
                exc.response.status_code,
                exc.response.text[:300],
            )
            raise RuntimeError(
                f"MSG91 returned HTTP {exc.response.status_code}: {exc.response.text}"
            ) from exc
        except httpx.RequestError as exc:
            logger.error("[MSG91] Network error reaching %s: %s", self._SEND_URL, exc)
            raise RuntimeError(
                "Could not reach MSG91 — check Railway network and MSG91 status"
            ) from exc

        return ""

    def verify(self, phone: str, code: str) -> bool:
        mobile = self._normalize(phone)
        headers = {
            "authkey": self._auth_key,
            "Accept": "application/json",
        }
        params = {"otp": code, "mobile": mobile}
        logger.info("[MSG91] Verifying OTP → mobile=%s otp=%s", mobile, code)
        try:
            resp = httpx.get(
                self._VERIFY_URL,
                params=params,
                headers=headers,
                timeout=10,
            )
            data = resp.json()
            logger.info("[MSG91] Verify response for %s → %s", phone, data)
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
    env = (
        settings.app_env.strip().lower()
    )  # strip + lowercase — catches "Production", " production"
    logger.info(
        "[OTP] app_env=%r → using %s",
        settings.app_env,
        "MSG91" if env == "production" else "InMemory",
    )

    if env == "production":
        return Msg91OtpProvider()
    return InMemoryOtpProvider()
