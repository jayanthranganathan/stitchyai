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
        if not settings.firebase_credentials_json.strip():
            raise UnauthorizedError(
                "Firebase auth is not configured (FIREBASE_CREDENTIALS_JSON is empty)."
            )
        import firebase_admin
        from firebase_admin import credentials

        cred_dict: dict[str, Any] = json.loads(settings.firebase_credentials_json)
        cred = credentials.Certificate(cred_dict)
        # Guard against double-init if another import path already did it
        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)
        _initialised = True
        logger.info("[Firebase] Admin SDK initialised")


def verify_id_token(id_token: str) -> str:
    """Verify a Firebase ID token and return the verified E.164 phone number.

    Raises UnauthorizedError if the token is invalid or carries no phone number.
    """
    _ensure_initialised()
    from firebase_admin import auth as fb_auth

    try:
        decoded = fb_auth.verify_id_token(id_token)
    except Exception as exc:  # firebase raises various subclasses
        logger.warning("[Firebase] Token verification failed: %s", exc)
        raise UnauthorizedError("Invalid Firebase token") from exc

    phone = decoded.get("phone_number")
    if not phone:
        raise UnauthorizedError("Firebase token has no phone number")
    return str(phone)
