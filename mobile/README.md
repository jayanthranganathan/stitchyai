# Mobile — Thugil Designers app

React Native + Expo app that serves all four user roles (customer, tailor, delivery, admin) from a
single binary. After OTP login the app picks the right navigation stack based on the user's role.

## Layout

```
mobile/
├── App.tsx
├── src/
│   ├── api/             axios client, endpoint helpers, types
│   ├── components/      reusable UI primitives
│   ├── features/        one folder per role
│   │   ├── auth/        OTP login + role select
│   │   ├── customer/    home, categories, designs, order create + track
│   │   ├── tailor/      dashboard, available orders, my orders
│   │   ├── delivery/    dashboard, active pickup, map
│   │   └── admin/       approvals, orders, reports, manage admins
│   ├── navigation/      root + per-role navigators
│   ├── store/           zustand stores (auth, ui)
│   ├── theme/           colors, typography, spacing tokens
│   ├── hooks/           cross-cutting hooks
│   ├── utils/           validators, formatters, storage
│   └── types/           shared TypeScript types
├── assets/
└── app.config.ts
```

Each feature folder follows the same shape:

```
features/<role>/
├── screens/   PascalCaseScreen.tsx
├── hooks/     useFooBar.ts — TanStack Query wrappers
└── api.ts     endpoint helpers for this role
```

## Running

```bash
cp .env.example .env
npm install
npx expo start
```

Press `i` for iOS simulator, `a` for Android, or scan the QR code with Expo Go.

## Lint, types, tests

```bash
npm run lint
npm run typecheck
npm test
```

## Building for stores

```bash
eas build --profile preview --platform ios       # TestFlight
eas build --profile production --platform all    # App Store + Play Store
```
