# Deployment

Reference setup. Adjust to whichever cloud provider you choose.

## Environments

| Env | Purpose | Branch | API URL |
| --- | --- | --- | --- |
| `dev` | Local development on each engineer's machine | any | `http://localhost:8000` |
| `staging` | Internal QA, demo to stakeholders | `main` | `https://api.staging.thugildesigners.com` |
| `prod` | Live customers | tagged release | `https://api.thugildesigners.com` |

## Backend deployment

Build a container from `backend/Dockerfile` and deploy it to a container runtime (AWS ECS, Fly.io,
Render, etc.). The container reads its config from environment variables.

Required environment variables — see `backend/.env.example` for the full list. Highlights:

- `DATABASE_URL` — Postgres connection string.
- `REDIS_URL` — Redis connection string.
- `JWT_SECRET` — symmetric key for access/refresh tokens.
- `MSG91_AUTH_KEY`, `MSG91_TEMPLATE_ID` — OTP provider.
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`.
- `FCM_SERVER_KEY` — Firebase Cloud Messaging.
- `GOOGLE_MAPS_API_KEY` — server-side, for geocoding / route ETA. The mobile app uses its own
  separate, restricted key.
- `S3_BUCKET`, `S3_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`.

Database migrations run as a pre-deploy step (`alembic upgrade head`).

## Mobile deployment

Use EAS Build for store builds:

```bash
cd mobile
eas build --profile preview --platform ios       # TestFlight
eas build --profile production --platform all    # App Store + Play Store
```

App configuration is in `mobile/app.config.ts`; environment variables come from `eas.json` per
profile. The mobile app reads `API_BASE_URL` and `GOOGLE_MAPS_KEY` from `expo-constants`.

## Release process

1. Cut a release branch from `main`: `release/2026.06.01`.
2. Bump versions (`pyproject.toml`, `app.config.ts`).
3. Run the full test suite + manual smoke on staging.
4. Tag `v2026.06.01` and push.
5. CI builds backend image and EAS builds for mobile.
6. Promote backend image to prod; submit mobile to TestFlight / Play internal.

## Observability

- **Logs**: structured JSON to stdout, shipped to CloudWatch / Loki.
- **Metrics**: Prometheus scrape of `/metrics` (FastAPI middleware).
- **Errors**: Sentry, with separate DSNs for backend and mobile.
- **Uptime**: external monitor on `/health`.
