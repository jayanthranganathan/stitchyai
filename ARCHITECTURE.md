# Architecture

This document describes the system design for the Thugil Designers mobile platform: components,
modules, key flows, and the rationale behind the choices.

## 1. System context

```
                    ┌──────────────────────────────┐
                    │       React Native App        │
                    │  (Customer / Tailor /         │
                    │   Delivery / Admin role)      │
                    └──────────────┬───────────────┘
                                   │ HTTPS (JSON)
                                   ▼
┌──────────────┐         ┌────────────────────┐         ┌──────────────┐
│  MSG91 OTP   │◀────────│   FastAPI service  │────────▶│  Razorpay    │
└──────────────┘         │   (modular API)    │         └──────────────┘
                         │                    │
┌──────────────┐         │                    │         ┌──────────────┐
│ Google Maps  │◀────────│                    │────────▶│   FCM Push   │
└──────────────┘         └─────────┬──────────┘         └──────────────┘
                                   │
                  ┌────────────────┼─────────────────┐
                  ▼                ▼                 ▼
           ┌───────────┐    ┌───────────┐     ┌───────────┐
           │ Postgres  │    │   Redis   │     │    S3     │
           │ (primary) │    │ (cache,   │     │ (designs, │
           │           │    │  queues)  │     │  media)   │
           └───────────┘    └───────────┘     └───────────┘
```

The single mobile binary serves all four roles. After OTP login, the user picks a role (or is routed
based on what they're approved for) and is sent into that role's navigation stack.

## 2. Module map

The backend is a **modular monolith**: one deployable, many independent feature modules. Each
module follows the same internal layout (`router` → `service` → `repository` → `models`/`schemas`).
This keeps boundaries clean and makes it cheap to split a module out later if needed.

| Module | Responsibility |
| --- | --- |
| `auth` | OTP issue/verify, JWT issue/refresh, password-less login, role selection |
| `users` | Customer profile, addresses, KYC fields |
| `tailors` | Tailor profile, expertise tags, approval workflow, availability |
| `delivery` | Delivery partner profile, vehicle, approval workflow, online/offline status |
| `admin` | Admin user CRUD, approvals queue, audit log |
| `catalog` | Categories (Blouses, Kurtis, Shirts, Pants, Custom), design library, design proposals |
| `orders` | Order lifecycle, items, status history, expected delivery date, progress % |
| `payments` | Razorpay order creation, webhook verification, refunds |
| `tracking` | Live location pings from delivery partners, geocoded routes for the map |
| `notifications` | FCM tokens, templated push notifications, in-app inbox |
| `reports` | Aggregations: by period, customer, city, tailor, delivery partner |

All modules share `app/core` (config, db, security, logging, exceptions) and `app/shared` (base
SQLAlchemy model, pagination helper, common dependencies).

## 3. Key flows

### 3.1 Customer places an order

```
Customer            App                 API                 DB         Tailors
  │  pick design   │                    │                    │             │
  │ ──────────────▶│                    │                    │             │
  │  expected date │                    │                    │             │
  │ ──────────────▶│                    │                    │             │
  │  pay (Razorpay)│ POST /orders       │                    │             │
  │ ──────────────▶│ ──────────────────▶│  insert order      │             │
  │                │                    │ ──────────────────▶│             │
  │                │                    │  publish event     │             │
  │                │                    │ ─────────────────────────────────▶│
  │                │                    │                    │   notify    │
  │                │                    │                    │  matching   │
  │                │   201 Created      │                    │   tailors   │
  │                │◀───────────────────│                    │             │
```

### 3.2 Tailor accepts an order

1. Matching tailors receive an FCM push (`order.available`).
2. Tailor opens `Available Orders`, taps **Send Interest** → `POST /tailors/me/interests`.
3. Admin sees the interest in `Approvals → Order Assignments`, picks a tailor → `POST /admin/orders/{id}/assign`.
4. Tailor sees the order in `My Orders` with the agreed delivery date. Progress can be updated by
   the tailor (`measurement_done`, `cutting`, `stitching`, `finishing`, `ready_for_pickup`).

### 3.3 Delivery with live tracking

1. Admin or system triggers a pickup → `POST /delivery/assignments` with the assigned partner.
2. Delivery partner accepts → `PATCH /delivery/assignments/{id}` with status `accepted`.
3. App streams location every 10 s → `POST /tracking/pings` (batched).
4. Customer's `OrderTrack` screen polls `GET /tracking/orders/{id}` (or subscribes via SSE/WebSocket
   in a later iteration) and renders the partner's marker on Google Maps with directions.

## 4. State machines

### Order

```
draft ──▶ placed ──▶ assigned ──▶ in_progress ──▶ ready ──▶ out_for_delivery ──▶ delivered
              │           │             │            │             │
              ▼           ▼             ▼            ▼             ▼
           cancelled   cancelled    cancelled    cancelled     undeliverable
```

Progress percentage is derived from the active state plus tailor-reported sub-steps inside
`in_progress` (e.g., cutting = 40 %, stitching = 70 %, finishing = 90 %).

### Tailor / Delivery partner approval

```
registered ──▶ documents_uploaded ──▶ under_review ──▶ approved ─┬──▶ active
                                              │                  └──▶ suspended
                                              ▼
                                          rejected
```

## 5. Authentication and authorization

- **Login**: phone number → OTP via MSG91 → 6-digit code → JWT (access 15 min, refresh 30 days).
- **Roles**: a user can hold multiple role profiles (e.g., the same person could be a customer and
  a tailor). The JWT carries a `roles` array; the app picks the active role on launch.
- **Authorization**: FastAPI dependency `require_roles("admin")` etc. on each route. Admins have
  a sub-scope flag for "super admin" who can add other admins.

## 6. Reporting

`reports` module exposes parameterised endpoints, all backed by Postgres window functions and
materialized views for the heavy aggregates:

- `GET /reports/orders?from=&to=&group_by=city|tailor|delivery_partner|customer`
- `GET /reports/customers?from=&to=`
- `GET /reports/tailors/{id}/orders?from=&to=` (tailor's own report)
- `GET /reports/delivery/{id}/jobs?from=&to=`

Each endpoint supports `format=csv` for export.

## 7. Frontend architecture

```
mobile/src
├── api/             Single axios client + typed endpoints
├── components/      Reusable UI primitives (Button, Input, Card, …)
├── features/        One folder per role (auth, customer, tailor, delivery, admin)
│   └── <role>/
│       ├── screens/   Screens for the role's navigation stack
│       ├── hooks/     React Query hooks scoped to the role
│       └── api.ts     Endpoint helpers
├── navigation/      RootNavigator + per-role stacks
├── store/           Zustand stores (auth, ui)
├── theme/           Colors, typography, spacing tokens
├── hooks/           Cross-cutting hooks
├── utils/           Validators, formatters, storage helpers
└── types/           Shared TypeScript types
```

Networking uses **TanStack Query** for cache/retry/refresh; auth state lives in **Zustand** with
persistence to `expo-secure-store`. Navigation uses **React Navigation** with a top-level switch
between `AuthNavigator` and a role-specific navigator selected from the JWT.

## 8. Coding standards

See [docs/coding-standards.md](./docs/coding-standards.md). Highlights:

- Python: `ruff`, `black`, `mypy --strict` on `app/`. Function names `snake_case`, classes
  `PascalCase`, one module per responsibility.
- TypeScript: ESLint + Prettier, `tsconfig` strict, named exports, no default exports except for
  screen components and `App.tsx`.
- Commits: Conventional Commits (`feat:`, `fix:`, `chore:` …).
- Branching: `main` is always deployable, work in `feat/<short-name>`, PR with at least one review.

## 9. Roadmap

1. **Milestone 1 — Auth + Customer happy path.** OTP login, browse catalog, place order,
   Razorpay payment, see order list.
2. **Milestone 2 — Tailor onboarding + assignment.** Tailor self-registration, admin approval,
   interest → assignment flow, progress updates.
3. **Milestone 3 — Delivery + live tracking.** Delivery partner onboarding, assignment, location
   pings, customer-side map.
4. **Milestone 4 — Admin app + reports.** Approvals queues, order overview, reports with CSV
   export, admin user management.
5. **Milestone 5 — Polish.** Push notifications across all flows, in-app inbox, multi-language
   (Tamil + English), production hardening.
