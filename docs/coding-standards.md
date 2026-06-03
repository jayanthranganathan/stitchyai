# Coding standards

Conventions that apply to every file in this repository. Keep this short — the goal is consistency,
not exhaustiveness.

## Python (backend)

- **Versions**: Python 3.12, FastAPI ≥ 0.110, SQLAlchemy 2.x, Pydantic v2.
- **Formatting**: `ruff format` (Black-compatible). 100-char lines.
- **Linting**: `ruff check` with the rule set in `pyproject.toml`.
- **Typing**: `mypy --strict` on `app/`. Public functions must have full type annotations.
- **Module layout** — every feature module has:
  ```
  modules/<feature>/
  ├── __init__.py
  ├── router.py     # FastAPI APIRouter, thin: validate, delegate, serialize
  ├── schemas.py    # Pydantic models for request/response
  ├── service.py    # Business logic, depends on repository + integrations
  └── repository.py # SQLAlchemy queries; no business rules
  ```
- **Naming**: `snake_case` for functions/variables, `PascalCase` for classes, module names are
  short nouns (`orders`, not `order_management`).
- **Imports**: absolute (`from app.modules.orders import service`), grouped by stdlib / third-party
  / first-party with one blank line between groups.
- **Error handling**: raise domain exceptions from `app.core.exceptions`; FastAPI converts them
  to RFC 7807 problem details via the global exception handler.
- **Logging**: `logging.getLogger(__name__)`, no `print`. Structured logs via `structlog`.
- **Tests**: pytest, one test module per source module, `tests/modules/<feature>/test_*.py`.

## TypeScript (mobile)

- **Versions**: TypeScript ≥ 5.4, React Native via Expo SDK 51.
- **Formatting**: Prettier with the config in `mobile/.prettierrc`.
- **Linting**: ESLint with `@typescript-eslint`, `react`, `react-native` plugins.
- **Strictness**: `tsconfig` `strict: true`, `noUncheckedIndexedAccess: true`.
- **File names**:
  - Screens: `PascalCaseScreen.tsx` (e.g., `CreateOrderScreen.tsx`).
  - Components: `PascalCase.tsx` (e.g., `Button.tsx`).
  - Hooks: `useCamelCase.ts` (e.g., `useOrder.ts`).
  - Everything else: `camelCase.ts`.
- **Exports**: prefer named exports. Default export is allowed only for screen components and
  the root `App.tsx`.
- **Folder layout** — see `mobile/README.md`. Cross-feature code lives in `src/components`,
  `src/hooks`, `src/utils`. Feature-specific code stays inside `src/features/<role>/`.
- **State**: server state via TanStack Query; client state via Zustand. No Redux unless we hit a
  real ceiling on Zustand.
- **Styling**: StyleSheet objects, theme tokens from `src/theme`. No inline magic numbers.
- **Tests**: Jest + React Native Testing Library. Co-locate tests next to the source file as
  `Component.test.tsx`.

## Git

- **Branching**: `main` is always deployable. Work on `feat/<short-name>`, `fix/<short-name>`,
  `chore/<short-name>`.
- **Commits**: Conventional Commits. Examples:
  - `feat(orders): add cancel endpoint`
  - `fix(mobile/auth): clear OTP input on resend`
  - `chore: bump expo to sdk 51`
- **PRs**: at least one reviewer. Squash-merge. PR title = commit title.

## API design

- REST. Use plural kebab-case nouns.
- Return `201 Created` on resource creation with the resource body and a `Location` header.
- Pagination: `?page=` `?page_size=`, max page size 100.
- Filtering: explicit query parameters, never `?filter[...]`.
- Always include `created_at`, `updated_at` in resource responses.
- Versioning: URL prefix `/v1`. Breaking changes go to `/v2`.

## Database

- Migrations: every schema change ships an Alembic revision. No `Base.metadata.create_all()` in
  production.
- Naming: tables `snake_case` plural (`order_items`), columns `snake_case`, FKs `<table>_id`.
- Booleans default to `false`; nullable columns must be justified in the PR description.
- Money columns use `numeric(12, 2)` with a `currency` column. Never store money in floats.

## Secrets

- Never commit secrets. `.env` is git-ignored; `.env.example` is the canonical template.
- Production secrets live in the cloud secret manager (AWS Secrets Manager / SSM).
