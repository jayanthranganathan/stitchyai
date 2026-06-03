# Backend — Thugil API

FastAPI service that powers the mobile app and admin operations.

## Layout

```
backend/
├── app/
│   ├── main.py              FastAPI app factory, router registration
│   ├── core/                Config, DB, security, logging, exceptions
│   ├── shared/              Base model, pagination, common dependencies
│   ├── models/              SQLAlchemy ORM models
│   └── modules/
│       ├── auth/            OTP + JWT
│       ├── users/           Customer profile
│       ├── tailors/         Tailor profile, approvals, interest, orders
│       ├── delivery/        Delivery partner profile, assignments
│       ├── admin/           Approvals queue, admin user CRUD
│       ├── catalog/         Categories, designs, proposals
│       ├── orders/          Order lifecycle
│       ├── payments/        Razorpay integration
│       ├── tracking/        Live location pings
│       ├── notifications/   FCM + in-app inbox
│       └── reports/         Aggregations
├── alembic/                 DB migrations
├── tests/
├── pyproject.toml
├── docker-compose.yml
└── Dockerfile
```

Every module follows the same internal pattern:

```
modules/<feature>/
├── __init__.py
├── router.py     # FastAPI APIRouter — thin
├── schemas.py    # Pydantic request/response
├── service.py    # Business logic
└── repository.py # SQLAlchemy queries
```

## Local development

```bash
cp .env.example .env
docker compose up -d postgres redis
pip install -e ".[dev]"
alembic upgrade head
uvicorn app.main:app --reload
```

OpenAPI UI: <http://localhost:8000/docs>.

## Tests, lint, types

```bash
ruff check app tests
ruff format --check app tests
mypy app
pytest
```

## Migrations

```bash
alembic revision --autogenerate -m "add tailor_expertise"
alembic upgrade head
```
