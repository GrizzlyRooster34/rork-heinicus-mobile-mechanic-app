# CLAUDE.md

Guidance for AI assistants (and humans) working in this repository. Read this
before making changes so your edits match the existing structure and conventions.

## What this is

**Heinicus Mobile Mechanic** — a cross-platform (iOS / Android / Web) mobile app
for an on-demand mobile-mechanic service. Customers request automotive and
motorcycle/scooter repair, get quotes, schedule jobs, pay, and review; mechanics
manage jobs, availability, and verification; admins manage users, quotes, jobs,
pricing, and settings.

It is an **Expo / React Native** front end (Expo Router, file-based routing) with
a **tRPC + Hono** TypeScript backend, **Prisma/PostgreSQL** data layer, **Zustand**
state, **NativeWind/Tailwind** styling, and integrations for **Stripe** (payments),
**Firebase** (push), **Twilio/Nodemailer** (SMS/email), and **WebSockets** (live
job tracking + chat).

- App display name: `Heinicus Mechanic` · slug: `heinicus-mobile-mechanic-app`
- URL scheme: `mobilemechanic` · version: `1.1.0` (see `app.json`)
- Package manager: **Bun** (`bun.lock` is the source of truth; `package-lock.json`
  also exists). Use `bun install`.

## Tech stack

| Area | Choice |
|------|--------|
| Framework | Expo SDK 53, React Native 0.79, React 18.2 |
| Routing | `expo-router` v5 (file-based, in `app/`) |
| Language | TypeScript (strict mode) |
| API | tRPC v11 served over Hono (`backend/`) |
| Data fetching | `@tanstack/react-query` v5 via `@trpc/react-query` |
| State | Zustand v5 (with `persist` + AsyncStorage) |
| Database | Prisma 5 + PostgreSQL |
| Styling | NativeWind v4 (Tailwind) + a `Colors` constant theme |
| Payments | Stripe (`@stripe/stripe-react-native`, `stripe` server SDK) |
| Push/Notifications | `expo-notifications`, `firebase-admin` |
| Realtime | `socket.io` / `ws` (`backend/websocket/`) |
| Validation | `zod` |
| Testing | Jest + `jest-expo` + Testing Library |
| Builds | EAS Build (Android-focused) |

## Repository layout

```
app/                  Expo Router screens (file-based routing)
  _layout.tsx         Root layout: providers (tRPC, React Query, Stores, ErrorBoundary)
  auth/               Login / auth entry (initialRouteName)
  (customer)/         Customer tab group: index, request, quotes, schedule, profile
  (mechanic)/         Mechanic tab group: index, jobs, customers, map, profile
  (admin)/            Admin tab group: index, users, quotes, jobs, settings
  dev-switcher.tsx    Dev-only role switcher
backend/
  hono.ts             Hono app, mounts tRPC + REST routes
  server.ts           Server entry
  trpc/
    app-router.ts     Root tRPC router (composes all sub-routers)
    create-context.ts tRPC context (auth, prisma, etc.)
    trpc.ts           publicProcedure / protectedProcedure helpers
    routes/<domain>/route.ts   One router per domain (auth, job, quote, payment, ...)
  services/           Server-side services (stripe, email, messaging, location, 2FA, ...)
  middleware/auth.ts  Auth middleware
  websocket/          socket.io server + events (job-tracking, messaging)
  routes/             Plain REST routes (e.g. Stripe webhooks)
components/           Reusable RN components (PascalCase .tsx) + subfolders
                      (chat/, forms/, payments/, reviews/, error-boundaries/)
stores/               Zustand stores (auth, app, settings, admin-settings, theme)
hooks/                React hooks (useWebSocket, useJobTracking, useStripePayment, ...)
lib/                  Client infra: trpc client, prisma, stripe, socket, storage,
                      mobile-database, notifications/, auth-token, api-base-url
services/             Client services (firebase-service, error-reporting)
utils/                Pure helpers: pricing, quote-generator, validation, logger,
                      vin/, parts/, dev (dev-auth)
constants/            colors, pricing, services, serviceAreas
types/                Shared TS types (auth, service, rating)
prisma/               schema.prisma + migrations
__tests__/            unit/, integration/, e2e/, utils/ (test helpers)
assets/  android/  ios/   Native + asset dirs
scripts/              Build/version/seed scripts (bumpVersion, seed, init-database, ...)
docs/                 Topic docs (ERROR_BOUNDARIES, FORM_VALIDATION, LOADING_STATES)
```

> The repo root also contains many build/architecture markdown files
> (`ARCHITECTURE_SUMMARY.md`, `BUILD_AND_RUN.md`, `MODULES_AND_PACKAGES.md`,
> `QUICK_START.md`, APK guides, etc.) and assorted log files
> (`lint-errors.log`, `typescript-errors.log`). Treat the logs as stale
> artifacts, not requirements.

## Core domain model (Prisma)

Key models in `prisma/schema.prisma`: `User` (with `CustomerProfile`,
`MechanicProfile`, `AdminProfile`), `Vehicle`, `Job`, `Quote` + `QuotePart`,
`Payment`, `Review`, `MechanicVerification`, `MechanicTool`,
`MechanicAvailability`, `JobTimeline`, `ChatMessage`, `Notification`.

Important enums: `UserRole` (CUSTOMER / MECHANIC / ADMIN), `VehicleType`,
`ServiceType`, `UrgencyLevel`, `JobStatus`, `QuoteStatus`, `PaymentStatus`,
`VerificationStatus`, `JobTimelineEvent`, `MessageType`, `NotificationType`.

When changing the schema: edit `schema.prisma`, then `npx prisma migrate dev`
(or `prisma generate`). `postinstall` runs `prisma generate` automatically.

## Three-role architecture

The app has three distinct user experiences, mirrored across the stack:

- **UI**: route groups `app/(customer)/`, `app/(mechanic)/`, `app/(admin)/`,
  each with its own `_layout.tsx` tab navigator.
- **Backend**: domain routers under `backend/trpc/routes/` (`customer`,
  `mechanic`, `admin`, plus shared `auth`, `job`, `quote`, `payment(s)`,
  `vin`, `diagnosis`, `reviews`, `notifications`, `chat`, `config`, `photos`).
- **Auth**: role lives on `User.role`; the client stores it in `auth-store`
  and routes the user to the correct group after login.

## Conventions

- **Path alias**: `@/*` maps to repo root (see `tsconfig.json`). Import as
  `@/components/Button`, `@/lib/trpc`, `@/stores`, etc. — not long relative paths.
- **tRPC client**: use the typed `trpc` from `@/lib/trpc` inside React
  (`trpc.<domain>.<proc>.useQuery/useMutation`); use `trpcClient` for imperative
  calls (e.g. inside stores). `AppRouter` type is exported from
  `backend/trpc/app-router.ts`.
- **Adding an API endpoint**: add a procedure in the relevant
  `backend/trpc/routes/<domain>/route.ts`, validate input with `zod`, use
  `publicProcedure`/`protectedProcedure`, then ensure the domain router is wired
  into `app-router.ts`. Types flow to the client automatically.
- **State**: Zustand stores live in `stores/` and are exported from
  `stores/index.ts`. Persisted stores use `persist` + `createJSONStorage(() =>
  AsyncStorage)`. Wrap store actions with the helpers in `store-utils.ts`
  (`withErrorHandling`, `withAsyncErrorHandling`, `logStoreAction`). Providers
  are mounted via `StoreProvider` in `app/_layout.tsx`.
- **Components**: PascalCase files in `components/`. Prefer the shared `Button`,
  `LoadingSpinner`/`LoadingState`, `ErrorBoundary`, and form components over
  re-implementing. Styling via NativeWind classes and/or `Colors` from
  `@/constants/colors`.
- **Validation**: `zod` on the backend; client form validation via
  `hooks/useFormValidation.ts` and `utils/validation.ts`.
- **Logging**: use `utils/logger.ts` rather than raw `console.*` (ESLint warns on
  `no-console`).
- **Pricing/quotes**: business logic lives in `utils/pricing.ts`,
  `utils/quote-generator.ts`, `utils/parts/`, and `constants/pricing.ts` /
  `constants/services.ts`. Keep service definitions and tool lists in `constants/`.
- **Offline / standalone mode**: the tRPC client (`lib/trpc.ts`) returns `null`
  base URL when `EXPO_PUBLIC_API_URL`/`EXPO_PUBLIC_BASE_URL` is `disabled`, and
  there is a local `mobile-database` fallback. Don't assume the backend is always
  reachable on the client.

## Dev auth / demo accounts

Dev login is **opt-in** and only active in development builds: `devMode =
__DEV__ && EXPO_PUBLIC_ENABLE_DEV_AUTH === 'true'` (see `utils/dev.ts`).
Credentials come from `EXPO_PUBLIC_DEV_{ADMIN,MECHANIC,CUSTOMER}_{EMAIL,PASSWORD}`
env vars (empty password ⇒ disabled). Never hard-code real secrets; never enable
dev auth in production builds. `app/dev-switcher.tsx` lets you switch roles in dev.

## Commands

```bash
bun install              # install deps (runs prisma generate via postinstall)

# Run
bun run start            # expo start (dev)
bun run start-web        # expo start --web
bun run android          # expo run:android
bun run ios              # expo run:ios

# Quality gates
bun run type-check       # tsc --noEmit
bun run lint             # eslint . --ext .js,.jsx,.ts,.tsx
bun run lint:fix
bun run test             # jest
bun run test:unit        # jest __tests__/unit
bun run test:integration # jest __tests__/integration
bun run test:coverage
bun run test:ci          # coverage, no watch, passWithNoTests

# Database
npx prisma migrate dev   # apply/create migrations
npx prisma generate
bun run scripts/seed.ts  # seed (see scripts/)

# Builds (EAS, Android-focused; profiles in eas.json)
bun run build:dev        # development profile
bun run build:preview    # preview
bun run build:prod       # production
bun run build:standalone # standalone APK
bun run bump[:patch|:minor|:major|:build]   # version bump (scripts/bumpVersion.js)
```

EAS profiles (`eas.json`): `development`, `preview`, `standalone`, `production`.
Build scripts auto-bump the version before building.

## Environment

Copy `.env.example` to `.env` and fill values. Notable groups: `DATABASE_URL`
(PostgreSQL), Stripe (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, public key),
Firebase, SMTP email, WebSocket (`WEBSOCKET_PORT`/`WEBSOCKET_SECRET`), Google Maps,
push keys, AI agent IDs, and the `EXPO_PUBLIC_*` client vars. `EXPO_PUBLIC_*`
variables are exposed to the client bundle — never put secrets there.
Backend env is validated in `backend/env-validation.ts`.

## Testing

Jest config in `jest.config.js`, setup in `jest.setup.js`, preset `jest-expo`.
Tests live in `__tests__/{unit,integration,e2e}` with shared helpers in
`__tests__/utils/` (`test-utils.tsx`, `auth-test-utils.ts`,
`database-test-utils.ts`). Mirror the existing structure: unit tests next to the
layer they cover (`components/`, `stores/`, `services/`, `lib/`, `utils/`),
integration tests under `workflows/`. See `__tests__/README.md`.

## Working agreements for AI assistants

1. **Match existing patterns** — file-based routes, tRPC routers per domain,
   Zustand stores via `stores/index.ts`, `@/` imports, NativeWind + `Colors`.
2. **Keep types end-to-end** — add backend procedures so types propagate to the
   client; avoid `any` (ESLint warns).
3. **Run the gates** before declaring done: `type-check`, `lint`, and the
   relevant `test:*`. Report failures honestly with output.
4. **Don't break the three-role separation** — put role-specific UI in the right
   `app/(role)/` group and the logic in the matching router.
5. **Be careful with secrets and dev auth** — they are env-driven by design.
6. **Schema changes go through Prisma migrations**, not manual edits to generated
   client code.
7. **Note pre-existing breakage when relevant** — there are known historical
   TypeScript/lint issues captured in `*-errors.log`, and `app-router.ts` has a
   duplicate `diagnosis` router import/key. Don't assume a red type-check is
   something you introduced, but do fix what you touch.

---

_Last updated: 2026-06-07. Keep this file current when the structure, stack, or
workflows change._
