"""FastAPI application factory."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.exceptions import install_exception_handlers
from app.core.logging import configure_logging
from app.modules.admin.router import router as admin_router
from app.modules.ai.internal_router import router as ai_internal_router
from app.modules.ai.router import router as ai_router
from app.modules.auth.router import router as auth_router
from app.modules.catalog.router import router as catalog_router
from app.modules.credits.router import router as credits_router
from app.modules.delivery.router import router as delivery_router
from app.modules.notifications.router import router as notifications_router
from app.modules.orders.router import router as orders_router
from app.modules.payments.router import router as payments_router
from app.modules.reports.router import router as reports_router
from app.modules.subscriptions.router import router as subscriptions_router
from app.modules.tailors.router import router as tailors_router
from app.modules.tracking.router import router as tracking_router
from app.modules.users.router import router as users_router

API_PREFIX = "/v1"


def create_app() -> FastAPI:
    configure_logging()

    app = FastAPI(
        title="Thugil Designers API",
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url=f"{API_PREFIX}/openapi.json",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    install_exception_handlers(app)

    # Module routers
    for router in (
        auth_router,
        users_router,
        tailors_router,
        delivery_router,
        admin_router,
        catalog_router,
        orders_router,
        payments_router,
        tracking_router,
        notifications_router,
        reports_router,
        subscriptions_router,  # ← plan tiers + upgrades
        credits_router,  # ← credit balance + history
        ai_router,  # ← AI generation endpoints (public, JWT required)
        ai_internal_router,  # ← AI worker callbacks (service-key required)
    ):
        app.include_router(router, prefix=API_PREFIX)

    @app.get("/health", tags=["meta"])
    def health() -> dict[str, str]:
        return {"status": "ok", "env": settings.app_env}

    return app


app = create_app()
