"""Domain exceptions and the global FastAPI exception handler.

Domain code raises ``DomainError`` (or a subclass). The handler converts them to RFC 7807
problem details so clients see a consistent error shape.
"""

from __future__ import annotations

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse


class DomainError(Exception):
    """Base class for all expected application errors."""

    status_code: int = status.HTTP_400_BAD_REQUEST
    title: str = "Bad request"

    def __init__(self, detail: str = "") -> None:
        super().__init__(detail or self.title)
        self.detail = detail or self.title


class NotFoundError(DomainError):
    status_code = status.HTTP_404_NOT_FOUND
    title = "Not found"


class UnauthorizedError(DomainError):
    status_code = status.HTTP_401_UNAUTHORIZED
    title = "Unauthorized"


class ForbiddenError(DomainError):
    status_code = status.HTTP_403_FORBIDDEN
    title = "Forbidden"


class ConflictError(DomainError):
    status_code = status.HTTP_409_CONFLICT
    title = "Conflict"


class ValidationError(DomainError):
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    title = "Validation failed"


def install_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(DomainError)
    async def _handle_domain_error(_: Request, exc: DomainError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "type": f"about:blank#{exc.__class__.__name__}",
                "title": exc.title,
                "status": exc.status_code,
                "detail": exc.detail,
            },
            media_type="application/problem+json",
        )
