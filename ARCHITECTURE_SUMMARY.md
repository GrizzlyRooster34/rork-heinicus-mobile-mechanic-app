# Heinicus Mobile Mechanic App - Architecture Summary

**Repository:** GrizzlyRooster34/rork-heinicus-mobile-mechanic-app  
**Platform:** React Native (Expo) + Node.js Backend  
**Status:** Production-Ready (v1.1.0)

---

## 🎯 Project Overview

**Heinicus Mobile Mechanic** is a full-stack mobile application that connects customers with mechanics for on-demand vehicle repair services. The app supports three user roles (Customer, Mechanic, Admin) with role-based dashboards, real-time job tracking, payments, and AI-powered customer support.

### Key Features
- ✅ Multi-role authentication (Customer, Mechanic, Admin)
- ✅ Real-time job tracking with WebSocket support
- ✅ Payment processing (Stripe integration)
- ✅ Two-factor authentication (2FA)
- ✅ Push notifications (Expo)
- ✅ In-app messaging and chat
- ✅ Location-based services (Google Maps)
- ✅ AI customer support assistant (Abacus AI)
- ✅ Photo uploads and storage (Cloudinary)
- ✅ VIN decoding for vehicle identification

---

## 📱 Platform Detection

| Platform | Status | Details |
|----------|--------|---------|
| **Android** | ✅ Primary | APK builds via EAS, min SDK 21, target SDK 35 |
| **iOS** | ✅ Supported | Bundle ID: `com.heinicus.mobilemechanic` |
| **Web** | ✅ Supported | React Native Web, Vite-based |

**Build System:** Expo Application Services (EAS) with local Gradle support

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    MOBILE FRONTEND (Expo)                   │
│  React Native + Expo Router + NativeWind (Tailwind CSS)     │
│  ├─ (admin) - Admin Dashboard                              │
│  ├─ (customer) - Customer Portal                           │
│  ├─ (mechanic) - Mechanic Dashboard                        │
│  └─ (auth) - Authentication Flows                          │
└──────────────────────┬──────────────────────────────────────┘
                       │ tRPC + React Query
                       │ WebSocket (Socket.io)
┌──────────────────────▼──────────────────────────────────────┐
│                   BACKEND (Node.js)                         │
│  ├─ Hono Server (HTTP API)                                 │
│  ├─ tRPC Router (Type-safe RPC)                            │
│  ├─ WebSocket Server (Real-time updates)                   │
│  └─ Middleware (Auth, Rate Limiting)                       │
└──────────────────────┬──────────────────────────────────────┘
                       │ Prisma ORM
┌──────────────────────▼──────────────────────────────────────┐
│              DATABASE (PostgreSQL)                          │
│  ├─ Users (Customer, Mechanic, Admin)                      │
│  ├─ Jobs & Quotes                                          │
│  ├─ Vehicles & Services                                    │
│  ├─ Payments & Transactions                                │
│  ├─ Messages & Notifications                               │
│  └─ Analytics & Audit Logs                                 │
└─────────────────────────────────────────────────────────────┘

EXTERNAL SERVICES:
├─ Firebase (Push Notifications)
├─ Stripe (Payments)
├─ Google Maps API (Location)
├─ Cloudinary (Image Storage)
├─ Abacus AI (Customer Support)
└─ Nodemailer (Email)
```

---

## 📦 Tech Stack

### Frontend (Mobile)
| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | React Native | 0.81.5 |
| **Runtime** | Expo | ~54.0.0 |
| **Router** | Expo Router | ~6.0.14 |
| **Styling** | NativeWind + Tailwind | 4.1.23 |
| **Icons** | Lucide React Native | 0.552.0 |
| **State** | Zustand | 5.0.2 |
| **Data Fetching** | TanStack React Query | 5.90.5 |
| **Maps** | React Native Maps | 1.20.1 |
| **Camera** | Expo Camera | ~17.0.8 |
| **Chat** | React Native Gifted Chat | 2.8.1 |
| **Payments** | Stripe React Native | 0.57.0 |

### Backend (Server)
| Layer | Technology | Version |
|-------|-----------|---------|
| **Runtime** | Node.js | 16+ |
| **Server** | Hono | 4.7.11 |
| **RPC** | tRPC | 11.6.0 |
| **ORM** | Prisma | 6.19.0 |
| **Database** | PostgreSQL | 14+ |
| **WebSocket** | Socket.io | 4.8.1 |
| **Auth** | JWT + bcryptjs | 9.0.2 / 3.0.3 |
| **Validation** | Zod | 3.25.64 |
| **Email** | Nodemailer | 7.0.10 |
| **2FA** | otplib | 12.0.1 |

### DevOps & Build
| Tool | Purpose |
|------|---------|
| **Package Manager** | Bun (primary), npm (fallback) |
| **Build System** | EAS (Expo Application Services) |
| **Android Build** | Gradle (local or EAS) |
| **Testing** | Jest + React Testing Library |
| **Linting** | ESLint + TypeScript |
| **Type Checking** | TypeScript 5.9.2 |

---

## 📂 Project Structure

```
expo/
├── app/                          # Expo Router pages (file-based routing)
│   ├── (admin)/                  # Admin role routes
│   │   ├── dashboard.tsx         # Admin dashboard
│   │   ├── jobs.tsx              # Job management
│   │   ├── quotes.tsx            # Quote management
│   │   ├── users.tsx             # User management
│   │   └── settings.tsx          # Admin settings
│   ├── (customer)/               # Customer role routes
│   │   ├── home.tsx              # Customer home
│   │   ├── request.tsx           # Request service
│   │   ├── schedule.tsx          # View scheduled jobs
│   │   ├── quotes.tsx            # View quotes
│   │   └── profile.tsx           # Customer profile
│   ├── (mechanic)/               # Mechanic role routes
│   │   ├── dashboard.tsx         # Mechanic dashboard
│   │   ├── jobs.tsx              # Available jobs
│   │   ├── map.tsx               # Location map
│   │   ├── customers.tsx         # Customer list
│   │   └── profile.tsx           # Mechanic profile
│   ├── auth/                     # Authentication flows
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── 2fa.tsx
│   └── _layout.tsx               # Root layout
│
├── backend/                      # Node.js backend server
│   ├── index.ts                  # Server entry point
│   ├── hono.ts                   # Hono server setup
│   ├── env-validation.ts         # Environment validation
│   ├── middleware/
│   │   ├── auth.ts               # JWT authentication
│   │   └── rate-limit.ts         # Rate limiting
│   ├── routes/
│   │   └── payment.ts            # Stripe webhook routes
│   ├── services/
│   │   ├── location.ts           # Google Maps integration
│   │   ├── messaging.ts          # In-app messaging
│   │   ├── notifications.ts      # Push notifications
│   │   ├── password-reset.ts     # Password reset flow
│   │   ├── storage.ts            # File upload (Cloudinary)
│   │   ├── stripe.ts             # Stripe payment service
│   │   └── two-factor-auth.ts    # 2FA logic
│   ├── trpc/
│   │   ├── app-router.ts         # Main tRPC router
│   │   ├── create-context.ts     # tRPC context
│   │   ├── middleware/
│   │   │   └── auth.ts           # tRPC auth middleware
│   │   └── routes/
│   │       ├── admin/            # Admin procedures
│   │       ├── analytics/        # Analytics queries
│   │       ├── auth/             # Auth procedures
│   │       ├── config/           # Config queries
│   │       ├── customer/         # Customer procedures
│   │       ├── jobs/             # Job procedures
│   │       ├── mechanic/         # Mechanic procedures
│   │       ├── messages/         # Messaging procedures
│   │       ├── notifications/    # Notification procedures
│   │       ├── payments/         # Payment procedures
│   │       ├── quotes/           # Quote procedures
│   │       ├── services/         # Service procedures
│   │       ├── twoFactor/        # 2FA procedures
│   │       ├── users/            # User procedures
│   │       └── vehicles/         # Vehicle procedures
│   └── websocket/
│       └── index.ts              # WebSocket server (Socket.io)
│
├── components/                   # Reusable React components
│   ├── chat/                     # Chat UI components
│   ├── error-boundaries/         # Error handling
│   ├── forms/                    # Form components
│   ├── payments/                 # Payment UI
│   └── reviews/                  # Review components
│
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts                # Authentication hook
│   ├── useLocation.ts            # Location tracking
│   └── useNotifications.ts       # Notification handling
│
├── stores/                       # Zustand state stores
│   ├── authStore.ts              # Auth state
│   ├── jobStore.ts               # Job state
│   └── userStore.ts              # User state
│
├── services/                     # Business logic services
│   └── seven-consciousness/      # AI integration
│
├── lib/                          # Utility libraries
│   └── notifications/            # Notification utilities
│
├── utils/                        # Helper functions
│   ├── parts/                    # Vehicle parts utilities
│   └── vin/                      # VIN decoding utilities
│
├── types/                        # TypeScript type definitions
│   ├── api.ts                    # API types
│   ├── auth.ts                   # Auth types
│   └── models.ts                 # Data model types
│
├── prisma/                       # Database schema & migrations
│   ├── schema.prisma             # Prisma schema
│   └── migrations/               # Migration files
│
├── __tests__/                    # Test files
│   ├── unit/                     # Unit tests
│   ├── integration/              # Integration tests
│   ├── e2e/                      # End-to-end tests
│   └── utils/                    # Test utilities
│
├── assets/                       # Static assets
│   ├── images/                   # App icons, splash screens
│   ├── sounds/                   # Audio files
│   └── seven-models/             # AI model assets
│
├── scripts/                      # Build & utility scripts
│   ├── bumpVersion.js            # Version bumping
│   ├── check-build-status.js     # Build status checker
│   ├── build-android.sh          # Android build script
│   └── setup-ci.sh               # CI setup
│
├── basic-android/                # Native Android module (optional)
├── ios/                          # Native iOS module (optional)
│
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # TypeScript config
├── babel.config.js               # Babel config
├── app.json.backup               # Expo config backup
├── eas.json                      # EAS build config
└── .env.example                  # Environment template
```

---

## 🗄️ Database Schema (Prisma)

### Core Models

**User** (Authentication & Profiles)
- Roles: CUSTOMER, MECHANIC, ADMIN
- Status: ACTIVE, INACTIVE, SUSPENDED
- 2FA support with backup codes
- Password reset tokens

**Vehicle** (Customer Assets)
- VIN, make, model, year
- License plate
- Service history

**Job** (Service Requests)
- Status: PENDING, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED
- Customer & Mechanic assignment
- Location & service type
- Photos & notes

**Quote** (Service Pricing)
- Linked to jobs
- Parts & labor costs
- Status: PENDING, ACCEPTED, REJECTED

**Payment** (Transactions)
- Stripe integration
- Status: PENDING, COMPLETED, FAILED, REFUNDED
- Invoice tracking

**Message** (In-App Chat)
- User-to-user messaging
- Timestamps & read status

**Notification** (Push & In-App)
- Type: JOB_UPDATE, PAYMENT, MESSAGE, etc.
- Read status & delivery tracking

**Availability** (Mechanic Scheduling)
- Day of week & time slots
- Linked to mechanic user

**Tool** (Mechanic Equipment)
- Tool name & category
- Mechanic ownership

**PricingProfile** (Service Rates)
- Mechanic-specific pricing
- Service type rates

**AnalyticsSnapshot** (Metrics)
- Jobs completed, revenue, ratings
- Daily/weekly/monthly snapshots

---

## 🔐 Authentication & Security

### Authentication Flow
1. **Signup/Login** → JWT token issued
2. **Token Storage** → AsyncStorage (mobile)
3. **Token Refresh** → 7-day expiration, 30-day refresh
4. **2FA** → TOTP (Time-based One-Time Password)
5. **Backup Codes** → Recovery codes for 2FA

### Security Features
- ✅ bcryptjs password hashing
- ✅ JWT token-based auth
- ✅ 2FA with TOTP (Google Authenticator, Authy)
- ✅ Backup codes for account recovery
- ✅ Password reset via email
- ✅ Rate limiting on auth endpoints
- ✅ CORS protection
- ✅ Input validation (Zod)

### Protected Routes
- Admin routes require ADMIN role
- Mechanic routes require MECHANIC role
- Customer routes require CUSTOMER role
- All protected by JWT middleware

---

## 🔌 API Architecture (tRPC)

### tRPC Router Structure
```
router
├── admin.*              # Admin-only procedures
├── analytics.*          # Analytics queries
├── auth.*               # Authentication (signup, signin, 2FA)
├── config.*             # App configuration
├── customer.*           # Customer-specific procedures
├── jobs.*               # Job management
├── mechanic.*           # Mechanic-specific procedures
├── messages.*           # Messaging
├── notifications.*      # Push notifications
├── payments.*           # Stripe payments
├── quotes.*             # Quote management
├── services.*           # Service catalog
├── twoFactor.*          # 2FA setup & verification
├── users.*              # User management
└── vehicles.*           # Vehicle management
```

### API Endpoints (HTTP)
- **Base URL:** `http://localhost:3000/api` (dev)
- **tRPC Endpoint:** `/api/trpc`
- **WebSocket:** `ws://localhost:3001`

### Request/Response Format
```typescript
// tRPC Query
const user = await trpc.users.getProfile.query();

// tRPC Mutation
const result = await trpc.jobs.createJob.mutate({
  customerId: "...",
  serviceType: "oil-change",
  location: { lat: 0, lng: 0 }
});

// Subscription (WebSocket)
trpc.jobs.onJobUpdate.subscribe(
  { jobId: "..." },
  { onData: (job) => console.log(job) }
);
```

---

## 🔄 Real-Time Features (WebSocket)

### Socket.io Server
- **Port:** 3001 (default)
- **Namespace:** `/` (default)
- **Events:**
  - `job:update` - Job status changes
  - `job:assigned` - New job assignment
  - `message:new` - New message
  - `notification:push` - Push notification
  - `location:update` - Mechanic location update

### Client Connection
```typescript
import { io } from 'socket.io-client';

const socket = io('ws://localhost:3001', {
  auth: { token: jwtToken }
});

socket.on('job:update', (job) => {
  // Handle job update
});
```

---

## 💳 Payment Integration (Stripe)

### Stripe Setup
- **Publishable Key:** `pk_test_...` (from .env)
- **Secret Key:** `sk_test_...` (backend only)
- **Webhook Secret:** `whsec_...` (for payment events)

### Payment Flow
1. Customer initiates payment
2. Stripe React Native creates payment method
3. Backend creates Stripe charge
4. Webhook confirms payment
5. Job marked as paid

### Webhook Events
- `payment_intent.succeeded` - Payment completed
- `payment_intent.payment_failed` - Payment failed
- `charge.refunded` - Refund processed

---

## 📲 Push Notifications

### Firebase Setup
- **Service:** Firebase Cloud Messaging (FCM)
- **Expo Integration:** Expo Notifications SDK
- **Token Storage:** PushToken model in database

### Notification Types
- Job updates (assigned, started, completed)
- Payment confirmations
- New messages
- Admin alerts
- Promotional messages

---

## 📍 Location Services

### Google Maps Integration
- **API Key:** `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`
- **Features:**
  - Mechanic location tracking
  - Job location display
  - Route optimization
  - Geocoding (address ↔ coordinates)

### Permissions
- `ACCESS_FINE_LOCATION` - Precise location
- `ACCESS_COARSE_LOCATION` - Approximate location
- `CAMERA` - Photo capture
- `READ_EXTERNAL_STORAGE` - File access

---

## 🤖 AI Integration (Abacus AI)

### Customer Support Agent
- **Agent ID:** `c816aa206`
- **Purpose:** Answer customer questions about services
- **Integration:** Backend service wrapper

### Mechanic Assistant
- **Purpose:** Help mechanics with diagnostics
- **Status:** Configured, ready for integration

---

## 📊 Analytics & Monitoring

### Metrics Tracked
- Jobs completed per mechanic
- Revenue per mechanic
- Customer ratings & reviews
- Response times
- Payment success rates

### Analytics Snapshots
- Daily/weekly/monthly aggregations
- Stored in `AnalyticsSnapshot` model
- Used for dashboards & reports

---

## 🧪 Testing

### Test Structure
```
__tests__/
├── unit/              # Component & function tests
├── integration/       # API & database tests
├── e2e/              # End-to-end user flows
└── utils/            # Test helpers
```

### Test Commands
```bash
npm run test              # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests
npm run test:ci          # CI mode (no watch)
```

### Test Coverage
- Unit tests for utilities & hooks
- Integration tests for API endpoints
- E2E tests for auth flows

---

## 🚀 Build & Deployment

### Development Build
```bash
cd expo
npm install
npm run start              # Start dev server
npm run backend            # Start backend (separate terminal)
npm run websocket          # Start WebSocket (separate terminal)
```

### Android Build (EAS)
```bash
# Development APK
npm run build:android:dev

# Preview APK
npm run build:android:preview

# Production APK
npm run build:android:production

# Standalone APK (local)
npm run build:android:apk

# Submit to Play Store
npm run submit:android
```

### iOS Build (EAS)
```bash
npm run build:ios
```

### Web Build
```bash
npm run build-web
```

### Local Android Build (Gradle)
```bash
npm run prebuild:android
npm run build:android
npm run install:android    # Install on connected device
```

---

## 📋 Build Profiles (EAS)

### Development
- Distribution: Internal
- Channel: development
- Build Type: APK (debug)
- Environment: development

### Preview
- Distribution: Internal
- Channel: preview
- Build Type: APK (release)
- Environment: production

### Standalone
- Distribution: Internal
- Channel: standalone
- Build Type: APK (release)
- Environment: production

### Production
- Distribution: Store (Google Play)
- Channel: production
- Build Type: App Bundle
- Environment: production

---

## 🔧 Environment Variables

### Required (Development)
```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/heinicus_db
JWT_SECRET=<64-char-random-string>
NODE_ENV=development
API_PORT=3000
WEBSOCKET_PORT=3001
```

### Required (Production)
```bash
DATABASE_URL=postgresql://user:pass@prod-db:5432/heinicus_prod
JWT_SECRET=<64-char-random-string>
FRONTEND_URL=https://heinicus.app
EXPO_PUBLIC_API_URL=https://api.heinicus.app
EXPO_PUBLIC_BACKEND_URL=https://api.heinicus.app
```

### Optional (External Services)
```bash
# Firebase
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...

# Stripe
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Google Maps
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=...

# Cloudinary
CLOUDINARY_URL=cloudinary://...

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASSWORD=...

# Abacus AI
ABACUS_AI_API_KEY=...
```

---

## 📦 Key Dependencies

### Frontend
- `expo` - React Native framework
- `expo-router` - File-based routing
- `nativewind` - Tailwind CSS for React Native
- `@tanstack/react-query` - Data fetching & caching
- `zustand` - State management
- `@trpc/react-query` - tRPC client
- `react-native-maps` - Maps integration
- `@stripe/stripe-react-native` - Payment UI

### Backend
- `hono` - Lightweight web framework
- `@trpc/server` - Type-safe RPC
- `prisma` - ORM
- `zod` - Schema validation
- `jsonwebtoken` - JWT auth
- `bcryptjs` - Password hashing
- `socket.io` - WebSocket server
- `stripe` - Payment processing
- `nodemailer` - Email sending

---

## 🎯 Development Workflow

### 1. Setup
```bash
cd expo
bun install
cp .env.example .env
# Edit .env with your credentials
```

### 2. Database
```bash
# Create PostgreSQL database
createdb heinicus_db

# Run migrations
bunx prisma migrate deploy

# Seed data
bunx prisma db seed
```

### 3. Development
```bash
# Terminal 1: Backend
npm run backend:watch

# Terminal 2: WebSocket
npm run websocket

# Terminal 3: Frontend
npm run start
```

### 4. Testing
```bash
npm run test:watch
npm run lint
npm run type-check
```

### 5. Build & Deploy
```bash
# Build for Android
npm run build:android:production

# Submit to Play Store
npm run submit:android
```

---

## 🐛 Common Issues & Solutions

### Database Connection
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -h localhost -U heinicus_user -d heinicus_db
```

### Prisma Errors
```bash
# Reset database (WARNING: deletes data)
npx prisma migrate reset

# Generate Prisma Client
npx prisma generate
```

### Build Errors
```bash
# Clear cache
rm -rf node_modules
bun install

# Clear Expo cache
npx expo start -c
```

### WebSocket Connection
- Ensure WebSocket server is running on port 3001
- Check firewall allows port 3001
- Verify JWT token is valid

---

## 📚 Documentation

- **Setup Guide:** `expo/SETUP.md`
- **APK Build Guide:** `expo/README_APK_BUILDS.md`
- **Prisma Docs:** https://www.prisma.io/docs
- **tRPC Docs:** https://trpc.io/docs
- **Expo Docs:** https://docs.expo.dev

---

## 🔗 Quick Links

| Resource | URL |
|----------|-----|
| GitHub | https://github.com/GrizzlyRooster34/rork-heinicus-mobile-mechanic-app |
| Expo Project | https://expo.dev/@heinicus1/heinicus-mobile-mechanic-app |
| EAS Dashboard | https://expo.dev/accounts/heinicus1/projects/heinicus-mobile-mechanic-app |
| Prisma Studio | `npx prisma studio` |

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.1.0 | Current | Production release |
| 1.0.0 | Initial | MVP release |

---

**Last Updated:** March 29, 2025  
**Maintained By:** Rork Development Team  
**License:** Proprietary
