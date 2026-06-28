"""Firebase phone-auth verification.

The mobile app performs the SMS OTP via Firebase (Google sends the SMS — no
DLT/GST needed), then sends us the Firebase ID token. We verify it server-side
with the Firebase Admin SDK and extract the verified phone number.

Set ``FIREBASE_CREDENTIALS_JSON`` (the service-account JSON, as a string) in the
environment. The Admin app is initialised lazily on first use.
"""

from __future__ import annotations

import json
import logging
import threading
from typing import Any

from app.core.config import settings
from app.core.exceptions import UnauthorizedError

logger = logging.getLogger(__name__)

_lock = threading.Lock()
_initialised = False


def _ensure_initialised() -> None:
    """Initialise the Firebase Admin app once, from the service-account JSON."""
    global _initialised
    if _initialised:
        return
    with _lock:
        if _initialised:
            return
        raw = settings.firebase_credentials_json.strip()
        if not raw:
            raise UnauthorizedError(
                "Firebase auth is not configured (FIREBASE_CREDENTIALS_JSON is empty)."
            )
        # Tolerate a value accidentally wrapped in single/double quotes — a very
        # common mistake when pasting the service-account JSON into a host's env
        # variable UI.
        if len(raw) >= 2 and raw[0] == raw[-1] and raw[0] in ("'", '"'):
            raw = raw[1:-1].strip()

        import firebase_admin
        from firebase_admin import credentials

        try:
            cred_dict: dict[str, Any] = json.loads(raw)
        except json.JSONDecodeError as exc:
            # Don't leak the secret — log only length + first char for diagnosis.
            logger.error(
                "[Firebase] FIREBASE_CREDENTIALS_JSON is not valid JSON "
                "(length=%d, starts with %r). Paste the raw service-account JSON "
                "(starting with '{'), not a path or quoted string.",
                len(raw),
                raw[:1],
            )
            raise UnauthorizedError(
                "Firebase credentials are misconfigured on the server."
            ) from exc
        cred = credentials.Certificate(cred_dict)
        # Guard against double-init if another import path already did it
        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)
        _initialised = True
        logger.info("[Firebase] Admin SDK initialised")


def verify_identity(id_token: str) -> tuple[str | None, str | None]:
    """Verify a Firebase ID token and return ``(phone, email)``.

    Phone tokens come from phone-auth; email tokens from email/password sign-in.
    At least one of the two is always present. Raises UnauthorizedError if the
    token is invalid or carries neither identifier.
    """
    _ensure_initialised()
    from firebase_admin import auth as fb_auth

    try:
        decoded = fb_auth.verify_id_token(id_token)
    except Exception as exc:  # firebase raises various subclasses
        logger.warning("[Firebase] Token verification failed: %s", exc)
        raise UnauthorizedError("Invalid Firebase token") from exc

    phone = decoded.get("phone_number")
    email = decoded.get("email")
    if not phone and not email:
        raise UnauthorizedError("Firebase token has no phone number or email")
    return (str(phone) if phone else None, str(email).lower() if email else None)
