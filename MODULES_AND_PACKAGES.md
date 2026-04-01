# Heinicus Mobile Mechanic - Modules & Packages

Complete breakdown of all modules, packages, and their interactions.

---

## Table of Contents

1. [Frontend Modules](#1-frontend-modules)
2. [Backend Modules](#2-backend-modules)
3. [Package Dependencies](#3-package-dependencies)
4. [Service Dependencies](#4-service-dependencies)
5. [Module Interactions](#5-module-interactions)

---

## 1. Frontend Modules

### App (Expo Router)

**Location:** `app/`

**Purpose:** File-based routing with role-based route groups

**Structure:**
```
app/
├── (admin)/               # Admin route group
│   ├── dashboard.tsx      # Admin dashboard
│   ├── users.tsx          # User management
│   ├── mechanics.tsx      # Mechanic verification
│   ├── jobs.tsx           # All jobs overview
│   ├── payments.tsx       # Payment management
│   ├── disputes.tsx       # Dispute resolution
│   ├── reports.tsx        # Analytics & reports
│   └── settings.tsx       # System settings
│
├── (customer)/            # Customer route group
│   ├── home.tsx           # Customer home
│   ├── jobs/
│   │   ├── index.tsx      # My jobs list
│   │   └── [id].tsx       # Job detail
│   ├── request.tsx        # Request new service
│   ├── quotes.tsx         # View quotes
│   ├── vehicles.tsx       # My vehicles
│   ├── payments.tsx       # Payment methods
│   └── profile.tsx        # Profile settings
│
├── (mechanic)/            # Mechanic route group
│   ├── dashboard.tsx      # Mechanic dashboard
│   ├── jobs.tsx           # Available/assigned jobs
│   ├── availability.tsx   # Set availability
│   ├── earnings.tsx       # Earnings & payouts
│   ├── tools.tsx          # Tools & equipment
│   └── profile.tsx        # Mechanic profile
│
├── auth/                  # Auth routes (ungrouped)
│   ├── login.tsx          # Login screen
│   ├── register.tsx       # Registration
│   ├── forgot-password.tsx # Password reset
│   └── verify-2fa.tsx     # 2FA verification
│
├── _layout.tsx            # Root layout with providers
├── +not-found.tsx         # 404 page
└── dev-switcher.tsx       # Dev role switcher
```

**Key Features:**
- Role-based access control
- Deep linking support
- Typed routes (Expo Router v4)

---

### Components

**Location:** `components/`

**Purpose:** Reusable React components

**Structure:**
```
components/
├── AIAssistant.tsx              # AI chat support
├── AvailabilityCalendar.tsx     # Mechanic availability
├── AvailabilitySettings.tsx     # Availability config
├── Button.tsx                   # Base button
├── ChatComponent.tsx            # Real-time chat
├── DatabaseStatus.tsx           # DB connection status
├── ErrorBoundary.tsx            # Error handling
├── JobPhotoUpload.tsx           # Photo upload UI
├── JobTimeline.tsx              # Job status timeline
├── LicensePlateScanner.tsx      # OCR license plate
├── LoadingManager.tsx           # Loading states
├── LoadingSkeleton.tsx          # Skeleton loaders
├── LoadingSpinner.tsx           # Spinner component
├── LoadingState.tsx             # State-based loading
├── MaintenanceReminderEngine.tsx # Maintenance logic
├── MaintenanceReminders.tsx     # Reminder UI
├── MaintenanceSuggestions.tsx   # Suggestion engine
├── MechanicSelfSwitch.tsx       # Role switcher
├── MechanicVerificationPanel.tsx # Verification UI
├── NotificationSettings.tsx     # Push notif settings
├── OfflineIndicator.tsx         # Offline status
├── PaymentMethodSelector.tsx    # Payment methods
├── PaymentModal.tsx             # Payment flow
├── PhotoUpload.tsx              # Generic upload
├── PushNotificationConfig.tsx   # PN configuration
├── QuoteDispatcher.tsx          # Quote management
├── ReportsAnalytics.tsx         # Analytics dashboard
├── ScooterServiceSelector.tsx   # Scooter-specific
├── ServiceCard.tsx              # Service display
├── ServicePricingSettings.tsx   # Pricing config
├── SignatureCapture.tsx         # Digital signature
├── StripePayment.tsx            # Stripe integration
├── ThemeToggle.tsx              # Dark/light mode
├── ToolsEquipmentSettings.tsx   # Tools management
├── TwoFactorGate.tsx            # 2FA prompt
├── VINCheckerMotorcycle.tsx     # VIN for motorcycles
├── VinScanner.tsx               # VIN scanner
├── WorkTimer.tsx                # Job timer
│
├── chat/                        # Chat sub-components
├── error-boundaries/            # Error boundary variants
├── forms/                       # Form components
├── payments/                    # Payment components
└── reviews/                     # Review components
```

---

### Hooks

**Location:** `hooks/`

**Purpose:** Custom React hooks for reusable logic

| Hook | Purpose | Dependencies |
|------|---------|--------------|
| `use-firebase.ts` | Firebase integration | `firebase/app`, `firebase/storage` |
| `useAsyncState.ts` | Async state management | React |
| `useDatabase.ts` | Database connection | `lib/prisma` |
| `useErrorHandler.ts` | Error handling | React |
| `useFormValidation.ts` | Form validation | `zod` |
| `useHydrateConfig.ts` | Config hydration | `stores/*` |
| `useNetworkState.ts` | Network status | `@react-native-community/netinfo` |
| `usePushNotifications.ts` | Push notifications | `expo-notifications` |
| `useStripePayment.ts` | Stripe payments | `@stripe/stripe-react-native` |
| `useWebSocket.ts` | WebSocket client | `socket.io-client` |

---

### Stores (Zustand)

**Location:** `stores/`

**Purpose:** Global state management

| Store | Purpose | Key State |
|-------|---------|-----------|
| `auth-store.ts` | Authentication | `user`, `isAuthenticated`, `role` |
| `app-store.ts` | App-wide state | `currentJob`, `notifications`, `socket` |
| `settings-store.ts` | User settings | `theme`, `notifications`, `language` |
| `admin-settings-store.ts` | Admin config | `systemSettings`, `featureFlags` |
| `theme-store.ts` | Theme state | `isDark`, `colors` |

**Store Pattern:**
```typescript
// stores/auth-store.ts
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  role: null,
  login: async (email, password) => { /* ... */ },
  logout: () => set({ user: null, isAuthenticated: false }),
  setUser: (user) => set({ user, isAuthenticated: true }),
}));
```

---

### Lib (Utilities)

**Location:** `lib/`

**Purpose:** Core utilities and client configurations

| File | Purpose | Exports |
|------|---------|---------|
| `trpc.ts` | tRPC client setup | `trpc`, `TrpcProvider` |
| `prisma.ts` | Prisma client | `prisma` |
| `stripe-config.ts` | Stripe config | `stripe`, `initStripe` |
| `stripe-init.ts` | Stripe initialization | `initializeStripe` |
| `stripe-service.ts` | Stripe helpers | `createPaymentIntent`, `confirmPayment` |
| `configStore.ts` | Config storage | `getConfig`, `setConfig` |
| `mobile-database.ts` | Mobile DB | `mobileDb`, `syncData` |
| `notifications/` | Notification utils | `scheduleNotification` |

---

### Services

**Location:** `services/`

**Purpose:** External service integrations

| Service | Purpose | External API |
|---------|---------|--------------|
| `firebase-service.ts` | Firebase Storage | Firebase SDK |
| `error-reporting.ts` | Error tracking | Sentry/LogRocket |

---

### Constants

**Location:** `constants/`

**Purpose:** App constants and configuration

| File | Purpose |
|------|---------|
| `colors.ts` | Theme colors |
| `theme.ts` | Theme configuration |

---

## 2. Backend Modules

### Hono API

**Location:** `backend/`

**Purpose:** HTTP API server with tRPC integration

**Structure:**
```
backend/
├── hono.ts                    # Hono app entry
├── env-validation.ts          # Environment validation
├── routes/
│   └── payment.ts             # Payment routes
├── trpc/
│   ├── trpc.ts                # tRPC initialization
│   ├── app-router.ts          # Main router
│   ├── create-context.ts      # Context factory
│   ├── test.ts                # Test utilities
│   └── routes/
│       ├── admin/             # Admin operations
│       ├── auth/              # Authentication
│       ├── config/            # Configuration
│       ├── diagnosis/         # AI diagnosis
│       ├── example/           # Example routes
│       ├── job/               # Job management
│       ├── mechanic/          # Mechanic operations
│       ├── notifications/     # Push notifications
│       ├── payments/          # Payment processing
│       ├── quote/             # Quote system
│       ├── reviews/           # Reviews & ratings
│       └── vin/               # VIN decoding
└── websocket/
    └── server.ts              # Socket.io server
```

---

### tRPC Routes

| Route | Purpose | Procedures |
|-------|---------|------------|
| `auth` | Authentication | `login`, `register`, `logout`, `refresh`, `verify2FA` |
| `job` | Job management | `getAll`, `getById`, `create`, `update`, `cancel` |
| `mechanic` | Mechanic ops | `getAvailable`, `updateAvailability`, `verify` |
| `quote` | Quote system | `create`, `accept`, `reject`, `getByJob` |
| `payment` | Payments | `createIntent`, `confirm`, `refund`, `getHistory` |
| `review` | Reviews | `create`, `getByMechanic`, `report` |
| `admin` | Admin ops | `getUsers`, `verifyMechanic`, `resolveDispute` |
| `notification` | Notifications | `getAll`, `markRead`, `updatePreferences` |
| `vin` | VIN lookup | `decode`, `getHistory` |
| `diagnosis` | AI diagnosis | `analyze`, `getSuggestions` |

---

### WebSocket Server

**Location:** `backend/websocket/server.ts`

**Purpose:** Real-time communication

**Events:**

| Event | Direction | Handler |
|-------|-----------|---------|
| `connection` | Server | Authenticate & setup |
| `join-job` | Client → Server | Subscribe to job room |
| `leave-job` | Client → Server | Unsubscribe from job |
| `send-message` | Client → Server | Handle chat message |
| `update-location` | Client → Server | Update mechanic location |
| `update-job-status` | Client → Server | Change job status |
| `new-message` | Server → Client | Broadcast chat |
| `mechanic-location` | Server → Client | Broadcast location |
| `job-status-updated` | Server → Client | Broadcast status |
| `quote-received` | Server → Client | Notify customer |

---

### Database (Prisma)

**Location:** `prisma/schema.prisma`

**Models:**

| Model | Purpose | Relations |
|-------|---------|-----------|
| `User` | Core user data | `customerProfile`, `mechanicProfile`, `adminProfile` |
| `CustomerProfile` | Customer-specific | `vehicles`, `user` |
| `MechanicProfile` | Mechanic-specific | `tools`, `availability`, `verifications` |
| `AdminProfile` | Admin-specific | `user` |
| `Vehicle` | Vehicle data | `customer`, `jobs` |
| `Job` | Service request | `customer`, `mechanic`, `vehicle`, `quotes`, `payments` |
| `Quote` | Price quote | `job`, `parts` |
| `QuotePart` | Parts breakdown | `quote` |
| `Payment` | Payment record | `user`, `job` |
| `Review` | User review | `job`, `reviewer`, `reviewee` |
| `ChatMessage` | Chat message | `job`, `sender` |
| `Notification` | Push notification | `user` |
| `JobTimeline` | Job history | `job` |
| `MechanicVerification` | Verification docs | `mechanic` |
| `MechanicTool` | Tool inventory | `mechanic` |
| `MechanicAvailability` | Schedule | `mechanic` |

---

## 3. Package Dependencies

### Core Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `expo` | ^53.0.19 | Expo SDK |
| `react` | 18.2.0 | React |
| `react-native` | ^0.79.5 | React Native |
| `expo-router` | ~5.1.3 | File-based routing |

### State Management

| Package | Version | Purpose |
|---------|---------|---------|
| `zustand` | ^5.0.2 | Global state |
| `@tanstack/react-query` | ^5.80.7 | Server state |
| `superjson` | ^2.2.2 | Serialization |

### Backend

| Package | Version | Purpose |
|---------|---------|---------|
| `hono` | ^4.7.11 | HTTP framework |
| `@hono/trpc-server` | ^0.3.4 | tRPC integration |
| `@trpc/server` | ^11.4.1 | tRPC server |
| `@trpc/client` | ^11.4.1 | tRPC client |
| `@trpc/react-query` | ^11.4.1 | tRPC + React Query |

### Database

| Package | Version | Purpose |
|---------|---------|---------|
| `@prisma/client` | ^5.22.0 | Prisma ORM |
| `prisma` | ^5.22.0 | Prisma CLI |

### Authentication

| Package | Version | Purpose |
|---------|---------|---------|
| `jsonwebtoken` | ^9.0.2 | JWT tokens |
| `bcryptjs` | ^2.4.3 | Password hashing |
| `zod` | ^3.25.64 | Validation |

### Real-Time

| Package | Version | Purpose |
|---------|---------|---------|
| `socket.io` | ^4.8.1 | WebSocket server |
| `socket.io-client` | ^4.8.1 | WebSocket client |
| `ws` | ^8.18.3 | WebSocket native |

### Payments

| Package | Version | Purpose |
|---------|---------|---------|
| `stripe` | ^14.21.0 | Stripe server |
| `@stripe/stripe-react-native` | ^0.45.0 | Stripe mobile |

### Storage & Notifications

| Package | Version | Purpose |
|---------|---------|---------|
| `firebase-admin` | ^12.7.0 | Firebase server |
| `expo-notifications` | ^0.31.4 | Push notifications |
| `expo-image-picker` | ~16.1.4 | Photo selection |
| `expo-camera` | ~16.1.10 | Camera access |

### Email & SMS

| Package | Version | Purpose |
|---------|---------|---------|
| `nodemailer` | ^6.9.8 | SMTP email |
| `twilio` | ^3.x | SMS/2FA |

### UI & Styling

| Package | Version | Purpose |
|---------|---------|---------|
| `nativewind` | ^4.1.23 | Tailwind for RN |
| `tailwindcss` | ^3.x | Tailwind CSS |
| `lucide-react-native` | ^0.475.0 | Icons |
| `react-native-reanimated` | ^3.18.0 | Animations |
| `react-native-gesture-handler` | ~2.24.0 | Gestures |

### Testing

| Package | Version | Purpose |
|---------|---------|---------|
| `jest` | ^29.7.0 | Test runner |
| `ts-jest` | ^29.x | TypeScript Jest |
| `@types/jest` | ^29.5.5 | Jest types |
| `jest-expo` | ~53.0.9 | Expo Jest (limited use) |

### Utilities

| Package | Version | Purpose |
|---------|---------|---------|
| `date-fns` | ^4.1.0 | Date formatting |
| `ajv` | ^8.17.1 | JSON validation |

---

## 4. Service Dependencies

### External Services

| Service | Purpose | Environment Variables |
|---------|---------|----------------------|
| **PostgreSQL** | Primary database | `DATABASE_URL` |
| **Stripe** | Payment processing | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY` |
| **Firebase** | Storage, Push notifications | `EXPO_PUBLIC_FIREBASE_*` |
| **Google Maps** | Location services | `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` |
| **Twilio** | SMS, 2FA | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` |
| **SMTP** | Email | `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD` |
| **Abacus AI** | Customer support AI | `ABACUS_AI_API_KEY` |

### Service Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Heinicus App                         │
├─────────────────────────────────────────────────────────┤
│  Frontend (React Native)                                │
│  ├── tRPC Client ───────▶ Backend API                  │
│  ├── Socket.io Client ──▶ WebSocket Server             │
│  ├── Stripe SDK ────────▶ Stripe API                    │
│  ├── Firebase SDK ─────▶ Firebase Storage/FCM          │
│  └── Google Maps SDK ───▶ Google Maps API              │
├─────────────────────────────────────────────────────────┤
│  Backend (Node.js)                                      │
│  ├── Prisma ────────────▶ PostgreSQL                   │
│  ├── Stripe SDK ────────▶ Stripe API                    │
│  ├── Nodemailer ────────▶ SMTP Server                  │
│  ├── Twilio SDK ────────▶ Twilio API                   │
│  ├── Firebase Admin ────▶ Firebase                     │
│  └── HTTP Client ───────▶ Abacus AI                   │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Module Interactions

### Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Login UI  │────▶│  Auth Store │────▶│ tRPC Client │
│  (app/auth) │     │  (stores)   │     │   (lib)     │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │   Backend   │
                                        │  (backend)  │
                                        │  auth route │
                                        └──────┬──────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │   Prisma    │
                                        │   (prisma)  │
                                        └─────────────┘
```

### Job Creation Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Request UI │────▶│   App Store │────▶│ tRPC Client │
│ (app/customer)    │  (stores)   │     │   (lib)     │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │   Backend   │
                                        │  job route  │
                                        └──────┬──────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │   Prisma    │
                                        │  Job model  │
                                        └──────┬──────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │  WebSocket  │
                                        │  Broadcast  │
                                        └─────────────┘
```

### Payment Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ PaymentModal│────▶│ useStripe   │────▶│ Stripe SDK  │
│(components) │     │   (hooks)   │     │  (mobile)   │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │   Stripe    │
                                        │    API      │
                                        └──────┬──────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │   Backend   │
                                        │payment route│
                                        └─────────────┘
```

### Real-Time Chat Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ ChatComponent│────▶│ useWebSocket│────▶│ Socket.io   │
│(components)  │     │   (hooks)   │     │   Client    │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │  WebSocket  │
                                        │   Server    │
                                        │  (backend)  │
                                        └──────┬──────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │   Prisma    │
                                        │ ChatMessage │
                                        └─────────────┘
```

### File Upload Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│JobPhotoUpload│────▶│ useFirebase │────▶│ Firebase    │
│(components)  │     │   (hooks)   │     │   Storage   │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │   Backend   │
                                        │  job route  │
                                        │ (save URL)  │
                                        └─────────────┘
```

---

## Package Installation Guide

### Adding New Dependencies

```bash
# Frontend package (included in bundle)
npm install package-name

# Backend-only package (blocked from bundle)
npm install package-name
# Add to metro.config.js blockList if needed

# Dev dependency
npm install --save-dev package-name
```

### Metro Configuration for New Packages

If a package causes Metro bundling errors:

```javascript
// metro.config.js
config.resolver.blockList = [
  // ...existing blocks
  /node_modules\/package-name\/.*/,
];
```

**Note:** Only block packages that are truly server-side only (database drivers, email servers, etc.)

---

## Support

- **Quick Start**: [QUICK_START.md](./QUICK_START.md)
- **Build Guide**: [BUILD_AND_RUN.md](./BUILD_AND_RUN.md)
- **Architecture**: [ARCHITECTURE_SUMMARY.md](./ARCHITECTURE_SUMMARY.md)

---

**Modules documented!** 📦
