# Thugil Designers — Mobile Platform

End-to-end mobile platform for the Thugil Designers boutique and customized tailoring business
([thugildesigners.com](https://thugildesigners.com/)). The platform connects customers, freelance
tailors, delivery partners, and administrators in a single app, backed by a modular Python API.

## Repository layout

```
Stitchy.ai/
├── backend/           FastAPI service (API, auth, admin, reports)
├── mobile/            React Native + Expo app (all 4 user roles)
├── docs/              Architecture, data model, API contracts, standards
├── .github/workflows  CI starter
├── ARCHITECTURE.md    System architecture overview
└── README.md
```

## User roles

| Role | What they do |
| --- | --- |
| **Customer** | Browse categories (Blouses, Kurtis, Shirts, Pants, Custom), pick a design or propose one, place an order with an expected delivery date, track progress, and watch the delivery partner on a live map. |
| **Tailor** | Self-register as a freelance tailor, select areas of expertise, get notified of matching orders, send interest, and (once an admin approves) fulfil the order. |
| **Delivery partner** | Self-register, get approved by an admin, then handle three flows: pick up from customer → drop to tailor, pick up from tailor → drop to customer, and office ↔ customer. |
| **Administrator** | Approve customers, tailors, delivery partners and order assignments. View live progress on all orders. Add other admins. Generate reports (by period, customer, city, tailor, delivery partner). |

## Tech stack

- **Mobile**: React Native + Expo (SDK 51), TypeScript, React Navigation, Zustand, TanStack Query.
- **Backend**: Python 3.12, FastAPI, SQLAlchemy 2.x, Alembic, Pydantic v2, PostgreSQL 16, Redis.
- **Integrations**: MSG91 (OTP), Razorpay (payments), Google Maps (tracking), Firebase Cloud Messaging (push).
- **Infra**: Docker Compose for local dev; production target — containerized API on AWS ECS/Fly.io,
  RDS Postgres, S3 for media, CloudFront for CDN.

## Quick start

### Backend

```bash
cd backend
cp .env.example .env             # fill in the secrets
docker compose up -d postgres redis
pip install -e ".[dev]"
alembic upgrade head
uvicorn app.main:app --reload
```

Open <http://localhost:8000/docs> for the auto-generated OpenAPI UI.

### Mobile

```bash
cd mobile
cp .env.example .env
npm install
npx expo start
```

Scan the QR code with the Expo Go app on your phone, or press `i` / `a` to launch a simulator.

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — system overview, modules, sequence diagrams
- [docs/data-model.md](./docs/data-model.md) — entities, relationships, ER notes
- [docs/api-contracts.md](./docs/api-contracts.md) — REST endpoints by module
- [docs/coding-standards.md](./docs/coding-standards.md) — conventions, lint, commit style
- [docs/deployment.md](./docs/deployment.md) — environments, secrets, release process

## Status

Scaffolded — module folders, models, route stubs, and screen skeletons are in place. Each module is
ready to be filled in feature by feature. See `ARCHITECTURE.md` for the implementation roadmap.
