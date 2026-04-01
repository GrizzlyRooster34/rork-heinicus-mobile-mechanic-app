# Heinicus Mobile Mechanic - Quick Start Guide

**Get the app running in 5 minutes.**

---

## Prerequisites

- **Node.js** >= 16.0.0
- **npm** >= 8.0.0
- **PostgreSQL** 14+ (local or cloud)
- **Git**

---

## 1. Clone & Install (2 minutes)

```bash
# Clone the repository
git clone https://github.com/GrizzlyRooster34/rork-heinicus-mobile-mechanic-app.git
cd rork-heinicus-mobile-mechanic-app

# Install dependencies (at ROOT level)
npm install
```

---

## 2. Configure Environment (2 minutes)

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your values
nano .env  # or use your preferred editor
```

### Required Environment Variables

```bash
# Database (PostgreSQL)
DATABASE_URL="postgresql://username:password@localhost:5432/mobile_mechanic_db"

# Authentication
NEXTAUTH_SECRET="your-secret-key-here-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# WebSocket Server
WEBSOCKET_PORT=3001
WEBSOCKET_SECRET="your-websocket-secret"

# Stripe (for payments)
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# Firebase (for storage & push notifications)
EXPO_PUBLIC_FIREBASE_API_KEY="your_firebase_api_key"
EXPO_PUBLIC_FIREBASE_PROJECT_ID="your_project_id"

# Email (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"

# Twilio (for SMS/2FA)
TWILIO_ACCOUNT_SID="your_twilio_account_sid"
TWILIO_AUTH_TOKEN="your_twilio_auth_token"
TWILIO_PHONE_NUMBER="your_twilio_phone_number"

# Google Maps (for location services)
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY="your_google_maps_api_key"

# AI Support
ABACUS_AI_API_KEY="your-abacus-ai-key"
CUSTOMER_SUPPORT_AGENT_ID="c816aa206"
```

---

## 3. Setup Database (1 minute)

```bash
# Run Prisma migrations
npx prisma migrate deploy

# Seed the database with test data
npx prisma db seed
```

---

## 4. Start Development (3 terminals)

Open **3 separate terminal windows/tabs**:

### Terminal 1: Backend API
```bash
npm run backend:watch
```
Runs Hono + tRPC server on `http://localhost:3000`

### Terminal 2: WebSocket Server
```bash
npm run websocket
```
Runs Socket.io server on port `3001`

### Terminal 3: Expo Dev Server
```bash
npm run start
```
Starts the Expo development server.

---

## 5. Access the App

Once running, you can access the app via:

| Platform | URL / Command |
|----------|---------------|
| **Web** | http://localhost:8081 |
| **iOS Simulator** | Press `i` in Terminal 3 |
| **Android Emulator** | Press `a` in Terminal 3 |
| **Physical Device** | Scan QR code with Expo Go app |

---

## Test Credentials (Development Only)

After seeding, these accounts are available:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@heinicus.com | Set in `EXPO_PUBLIC_ADMIN_PASSWORD` |
| **Mechanic** | mechanic@heinicus.com | Set in `EXPO_PUBLIC_MECHANIC_PASSWORD` |
| **Customer** | customer@heinicus.com | Set in `EXPO_PUBLIC_CUSTOMER_PASSWORD` |

---

## Project Structure (Root Level)

```
rork-heinicus-mobile-mechanic-app/
├── app/                    # Expo Router screens (~30 routes)
├── backend/                # Hono + tRPC API
│   ├── hono.ts            # API entry point
│   ├── trpc/              # tRPC routes
│   └── websocket/         # Socket.io server
├── components/            # React components (~50)
├── constants/             # Colors, theme, config
├── hooks/                 # Custom React hooks
├── lib/                   # tRPC client, utilities
├── stores/                # Zustand state management
├── services/              # Firebase, error reporting
├── prisma/                # Database schema
├── __tests__/             # Jest + ts-jest tests
├── package.json           # Root-level dependencies
├── metro.config.js        # Metro bundler config
├── app.json               # Expo configuration
└── .env.example           # Environment template
```

---

## Common Commands

```bash
# Development
npm run start              # Start Expo dev server
npm run start-web          # Start web only
npm run android            # Run on Android
npm run ios                # Run on iOS

# Backend
npm run backend:watch      # Start Hono API (dev mode)
npm run websocket          # Start WebSocket server

# Testing
npm run test               # Run all tests
npm run test:unit          # Run unit tests only
npm run test:coverage      # Run with coverage

# Code Quality
npm run lint               # Run ESLint
npm run lint:fix           # Fix ESLint issues
npm run type-check         # TypeScript check

# Database
npx prisma migrate dev     # Create migration
npx prisma migrate deploy  # Apply migrations
npx prisma db seed         # Seed database
npx prisma studio          # Open Prisma Studio

# Building
npm run build:android      # Build Android (EAS)
npm run build:ios          # Build iOS (EAS)
npm run build-web          # Build web bundle
```

---

## Troubleshooting

### Port Already in Use
```bash
# Kill processes on ports 3000, 3001, 8081
npx kill-port 3000 3001 8081
```

### Database Connection Failed
```bash
# Verify PostgreSQL is running
pg_isready

# Check connection string in .env
echo $DATABASE_URL
```

### Metro Bundler Issues
```bash
# Clear Metro cache
npx expo start --clear

# Or manually:
rm -rf node_modules/.cache
npm run start
```

### TypeScript Errors
```bash
# Regenerate Prisma client
npx prisma generate

# Type check
npm run type-check
```

### Node-only Packages in Bundle
If you see errors about `pg`, `bcryptjs`, `jsonwebtoken`, `prisma`:
- These are **intentionally blocked** by `metro.config.js`
- They run on the **backend only**, not in React Native
- The `blockList` in metro config prevents them from being bundled

---

## Next Steps

1. **Read** [BUILD_AND_RUN.md](./BUILD_AND_RUN.md) for production builds
2. **Read** [ARCHITECTURE_SUMMARY.md](./ARCHITECTURE_SUMMARY.md) for system overview
3. **Explore** the `app/` directory to see the UI
4. **Explore** the `backend/` directory to see the API

---

## Support

- **Setup Issues**: Check [BUILD_AND_RUN.md](./BUILD_AND_RUN.md) → Troubleshooting
- **Architecture Questions**: See [ARCHITECTURE_SUMMARY.md](./ARCHITECTURE_SUMMARY.md)
- **Module Details**: See [MODULES_AND_PACKAGES.md](./MODULES_AND_PACKAGES.md)

---

**You're ready to code!** 🚀
