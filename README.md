# rork-heinicus-mobile-mechanic-app

## Local development

This app now expects the mobile client and the Hono/tRPC API to be started explicitly.

1. Copy `.env.example` to `.env` and set `DATABASE_URL` and `JWT_SECRET`.
2. Start the API server with `npm run start:api`.
3. Start the Expo client with `npm run start`, `npm run android`, or `npm run ios`.

The API server mounts the app backend at `/api`, so the tRPC endpoint is `/api/trpc`.

Firebase environment variables are optional. If they are not configured, upload-dependent UI is hidden from the MVP surface instead of failing at runtime.
