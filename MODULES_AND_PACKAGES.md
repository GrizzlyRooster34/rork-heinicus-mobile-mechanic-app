# Heinicus Mobile Mechanic - Modules & Packages Reference

## 📦 Core Modules

### Frontend Modules (React Native)

#### 1. **App Router** (`app/`)
- **Purpose:** File-based routing using Expo Router
- **Key Files:**
  - `_layout.tsx` - Root layout wrapper
  - `(admin)/_layout.tsx` - Admin role layout
  - `(customer)/_layout.tsx` - Customer role layout
  - `(mechanic)/_layout.tsx` - Mechanic role layout
  - `auth/` - Authentication flows
- **Dependencies:** `expo-router`, `react-navigation`
- **Status:** ✅ Production

#### 2. **Components** (`components/`)
- **Purpose:** Reusable UI components
- **Subdirectories:**
  - `chat/` - Chat UI components
  - `error-boundaries/` - Error handling
  - `forms/` - Form components
  - `payments/` - Payment UI
  - `reviews/` - Review components
- **Dependencies:** `nativewind`, `lucide-react-native`, `react-native-svg`
- **Status:** ✅ Production

#### 3. **Hooks** (`hooks/`)
- **Purpose:** Custom React hooks
- **Key Hooks:**
  - `useAuth()` - Authentication state
  - `useLocation()` - Location tracking
  - `useNotifications()` - Notification handling
  - `useJob()` - Job state management
  - `usePayment()` - Payment processing
- **Dependencies:** `react`, `zustand`, `@tanstack/react-query`
- **Status:** ✅ Production

#### 4. **State Management** (`stores/`)
- **Purpose:** Zustand state stores
- **Key Stores:**
  - `authStore.ts` - Auth state (user, token, role)
  - `jobStore.ts` - Job state (current job, list)
  - `userStore.ts` - User profile state
  - `notificationStore.ts` - Notification state
  - `locationStore.ts` - Location state
- **Dependencies:** `zustand`
- **Status:** ✅ Production

#### 5. **Services** (`services/`)
- **Purpose:** Business logic & API integration
- **Key Services:**
  - `seven-consciousness/` - AI integration
  - `authService.ts` - Auth logic
  - `jobService.ts` - Job operations
  - `paymentService.ts` - Payment processing
- **Dependencies:** `@trpc/react-query`, `axios`
- **Status:** ✅ Production

#### 6. **Utilities** (`utils/`)
- **Purpose:** Helper functions
- **Key Utilities:**
  - `parts/` - Vehicle parts utilities
  - `vin/` - VIN decoding
  - `validation.ts` - Input validation
  - `formatting.ts` - Data formatting
  - `constants.ts` - App constants
- **Dependencies:** `zod`, `date-fns`
- **Status:** ✅ Production

#### 7. **Types** (`types/`)
- **Purpose:** TypeScript type definitions
- **Key Types:**
  - `api.ts` - API response types
  - `auth.ts` - Auth types
  - `models.ts` - Data model types
  - `common.ts` - Common types
- **Dependencies:** None (pure TypeScript)
- **Status:** ✅ Production

#### 8. **Assets** (`assets/`)
- **Purpose:** Static resources
- **Subdirectories:**
  - `images/` - App icons, splash screens
  - `sounds/` - Audio files
  - `seven-models/` - AI model assets
- **Status:** ✅ Production

---

### Backend Modules (Node.js)

#### 1. **Server Setup** (`backend/index.ts`)
- **Purpose:** Main server entry point
- **Responsibilities:**
  - Initialize Hono server
  - Setup middleware
  - Mount tRPC router
  - Start listening on port 3000
- **Dependencies:** `hono`, `@trpc/hono`
- **Status:** ✅ Production

#### 2. **Hono Server** (`backend/hono.ts`)
- **Purpose:** HTTP server configuration
- **Features:**
  - CORS setup
  - Request logging
  - Error handling
  - Static file serving
- **Dependencies:** `hono`, `cors`
- **Status:** ✅ Production

#### 3. **Environment Validation** (`backend/env-validation.ts`)
- **Purpose:** Validate environment variables at startup
- **Validates:**
  - Database URL
  - JWT secret
  - API port
  - External service keys
- **Dependencies:** `zod`
- **Status:** ✅ Production

#### 4. **Middleware** (`backend/middleware/`)
- **Purpose:** Request processing middleware
- **Key Middleware:**
  - `auth.ts` - JWT authentication
  - `rate-limit.ts` - Rate limiting
  - `cors.ts` - CORS handling
  - `logging.ts` - Request logging
- **Dependencies:** `jsonwebtoken`, `express-rate-limit`
- **Status:** ✅ Production

#### 5. **Routes** (`backend/routes/`)
- **Purpose:** HTTP route handlers
- **Key Routes:**
  - `payment.ts` - Stripe webhook routes
  - `health.ts` - Health check endpoint
  - `metrics.ts` - Metrics endpoint
- **Dependencies:** `hono`, `stripe`
- **Status:** ✅ Production

#### 6. **Services** (`backend/services/`)
- **Purpose:** Business logic & external integrations
- **Key Services:**
  - `location.ts` - Google Maps integration
  - `messaging.ts` - In-app messaging
  - `notifications.ts` - Push notifications
  - `password-reset.ts` - Password reset flow
  - `storage.ts` - File upload (Cloudinary)
  - `stripe.ts` - Stripe payment service
  - `two-factor-auth.ts` - 2FA logic
  - `email.ts` - Email sending (Nodemailer)
- **Dependencies:** Various (see below)
- **Status:** ✅ Production

#### 7. **tRPC Router** (`backend/trpc/`)
- **Purpose:** Type-safe RPC API
- **Structure:**
  - `app-router.ts` - Main router
  - `create-context.ts` - Request context
  - `middleware/auth.ts` - Auth middleware
  - `routes/` - Procedure definitions
- **Dependencies:** `@trpc/server`, `@trpc/react-query`
- **Status:** ✅ Production

#### 8. **tRPC Routes** (`backend/trpc/routes/`)
- **Purpose:** API procedure definitions
- **Route Groups:**
  - `admin/` - Admin procedures
  - `analytics/` - Analytics queries
  - `auth/` - Authentication (signup, signin, 2FA)
  - `config/` - Configuration queries
  - `customer/` - Customer procedures
  - `jobs/` - Job management
  - `mechanic/` - Mechanic procedures
  - `messages/` - Messaging
  - `notifications/` - Push notifications
  - `payments/` - Payment procedures
  - `quotes/` - Quote management
  - `services/` - Service catalog
  - `twoFactor/` - 2FA setup
  - `users/` - User management
  - `vehicles/` - Vehicle management
- **Dependencies:** `@trpc/server`, `prisma`
- **Status:** ✅ Production

#### 9. **WebSocket Server** (`backend/websocket/`)
- **Purpose:** Real-time communication
- **Features:**
  - Job updates
  - Message notifications
  - Location tracking
  - Presence tracking
- **Dependencies:** `socket.io`, `socket.io-client`
- **Status:** ✅ Production

#### 10. **Database** (`prisma/`)
- **Purpose:** Database schema & migrations
- **Key Files:**
  - `schema.prisma` - Data model definitions
  - `migrations/` - Migration history
  - `seed.ts` - Database seeding
- **Dependencies:** `@prisma/client`, `prisma`
- **Status:** ✅ Production

---

## 🔗 Service Dependencies

### Location Service
```
location.ts
├── @googlemaps/google-maps-services-js
├── prisma (User, Job models)
└── types (Location types)
```

### Messaging Service
```
messaging.ts
├── prisma (Message model)
├── socket.io (WebSocket)
└── notifications.ts (notify users)
```

### Notification Service
```
notifications.ts
├── expo-server-sdk (Push notifications)
├── firebase-admin (FCM)
├── prisma (Notification, PushToken models)
└── socket.io (WebSocket)
```

### Payment Service (Stripe)
```
stripe.ts
├── stripe (Stripe SDK)
├── prisma (Payment, Job models)
├── notifications.ts (payment notifications)
└── email.ts (payment receipts)
```

### Two-Factor Auth Service
```
two-factor-auth.ts
├── otplib (TOTP generation)
├── qrcode (QR code generation)
├── bcryptjs (backup code hashing)
└── prisma (TwoFactorBackupCode model)
```

### Password Reset Service
```
password-reset.ts
├── jsonwebtoken (reset token)
├── email.ts (send reset link)
├── bcryptjs (password hashing)
└── prisma (PasswordReset, User models)
```

### Storage Service
```
storage.ts
├── cloudinary (image upload)
├── react-native-fs (local storage)
└── prisma (JobPhoto model)
```

---

## 📊 Package Dependencies

### Frontend Dependencies (Top 20)

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | 19.1.0 | UI framework |
| `react-native` | 0.81.5 | Mobile framework |
| `expo` | ~54.0.0 | React Native runtime |
| `expo-router` | ~6.0.14 | File-based routing |
| `nativewind` | 4.1.23 | Tailwind CSS for RN |
| `@tanstack/react-query` | 5.90.5 | Data fetching |
| `@trpc/react-query` | 11.6.0 | tRPC client |
| `zustand` | 5.0.2 | State management |
| `react-native-maps` | 1.20.1 | Maps integration |
| `@stripe/stripe-react-native` | 0.57.0 | Payment UI |
| `expo-camera` | ~17.0.8 | Camera access |
| `expo-image-picker` | ~17.0.8 | Image selection |
| `expo-location` | ~19.0.7 | Location tracking |
| `expo-notifications` | ~0.32.12 | Push notifications |
| `react-native-gifted-chat` | 2.8.1 | Chat UI |
| `lucide-react-native` | 0.552.0 | Icons |
| `date-fns` | 4.1.0 | Date utilities |
| `zod` | 3.25.64 | Schema validation |
| `socket.io-client` | 4.8.1 | WebSocket client |
| `@react-native-async-storage/async-storage` | 2.2.0 | Local storage |

### Backend Dependencies (Top 20)

| Package | Version | Purpose |
|---------|---------|---------|
| `@trpc/server` | 11.6.0 | tRPC server |
| `hono` | 4.7.11 | Web framework |
| `@prisma/client` | 6.19.0 | Database ORM |
| `prisma` | 6.19.0 | Database tools |
| `zod` | 3.25.64 | Schema validation |
| `jsonwebtoken` | 9.0.2 | JWT tokens |
| `bcryptjs` | 3.0.3 | Password hashing |
| `socket.io` | 4.8.1 | WebSocket server |
| `stripe` | 19.2.1 | Payment processing |
| `nodemailer` | 7.0.10 | Email sending |
| `otplib` | 12.0.1 | 2FA TOTP |
| `qrcode` | 1.5.4 | QR code generation |
| `cloudinary` | 2.8.0 | Image storage |
| `firebase-admin` | 13.5.0 | Firebase integration |
| `expo-server-sdk` | 4.0.0 | Push notifications |
| `@googlemaps/google-maps-services-js` | 3.4.2 | Maps API |
| `@hono/node-server` | 1.13.7 | Hono Node adapter |
| `@hono/trpc-server` | 0.4.0 | Hono tRPC adapter |
| `@hono/zod-validator` | 0.7.4 | Zod validation |
| `superjson` | 2.2.2 | JSON serialization |

### Development Dependencies (Top 15)

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ~5.9.2 | Type checking |
| `@types/node` | 20.8.0 | Node.js types |
| `@types/react` | ~19.1.0 | React types |
| `jest` | 30.2.0 | Testing framework |
| `jest-expo` | ~54.0.0 | Expo test setup |
| `@testing-library/react-native` | 13.3.3 | Testing utilities |
| `eslint` | 9.39.1 | Linting |
| `@typescript-eslint/eslint-plugin` | 8.46.3 | TS linting |
| `tsx` | 4.20.6 | TypeScript executor |
| `ts-node` | 10.9.2 | TypeScript runner |
| `babel` | 7.25.2 | Code transpiler |
| `concurrently` | 9.1.0 | Run multiple commands |
| `@expo/cli` | 0.24.18 | Expo CLI |
| `react-test-renderer` | 19.1.0 | React testing |
| `@babel/core` | 7.25.2 | Babel core |

---

## 🔄 Module Interaction Flow

### Authentication Flow
```
Frontend (auth/login.tsx)
    ↓
useAuth hook
    ↓
tRPC auth.signin
    ↓
Backend auth route
    ↓
Prisma User model
    ↓
JWT token generated
    ↓
Zustand authStore updated
    ↓
Protected routes accessible
```

### Job Creation Flow
```
Frontend (customer/request.tsx)
    ↓
useJob hook
    ↓
tRPC jobs.createJob
    ↓
Backend jobs route
    ↓
Prisma Job model
    ↓
WebSocket job:created event
    ↓
Mechanic notified
    ↓
Real-time update via Socket.io
```

### Payment Flow
```
Frontend (components/payments/PaymentForm.tsx)
    ↓
Stripe React Native
    ↓
tRPC payments.createPayment
    ↓
Backend stripe service
    ↓
Stripe API
    ↓
Webhook received
    ↓
Backend payment route
    ↓
Prisma Payment model updated
    ↓
Notification sent
```

### Real-Time Updates
```
Backend WebSocket server
    ↓
Socket.io namespace
    ↓
Event emitted (job:update, message:new, etc.)
    ↓
Frontend Socket.io client
    ↓
Zustand store updated
    ↓
React component re-renders
```

---

## 🎯 Module Responsibilities

### Frontend Modules
| Module | Responsibility |
|--------|-----------------|
| `app/` | Routing & page structure |
| `components/` | UI rendering |
| `hooks/` | State & side effects |
| `stores/` | Global state |
| `services/` | API calls & business logic |
| `utils/` | Helper functions |
| `types/` | Type definitions |
| `assets/` | Static resources |

### Backend Modules
| Module | Responsibility |
|--------|-----------------|
| `index.ts` | Server startup |
| `hono.ts` | HTTP server setup |
| `middleware/` | Request processing |
| `routes/` | HTTP endpoints |
| `services/` | Business logic |
| `trpc/` | Type-safe API |
| `websocket/` | Real-time communication |
| `prisma/` | Database schema |

---

## 🔐 Security Modules

### Authentication
- `backend/middleware/auth.ts` - JWT verification
- `backend/services/two-factor-auth.ts` - 2FA logic
- `backend/services/password-reset.ts` - Password reset
- `hooks/useAuth.ts` - Frontend auth state

### Validation
- `zod` - Schema validation (frontend & backend)
- `backend/env-validation.ts` - Environment validation
- `types/` - Type safety

### Encryption
- `bcryptjs` - Password hashing
- `jsonwebtoken` - Token signing
- `otplib` - TOTP generation

---

## 📈 Performance Modules

### Data Fetching
- `@tanstack/react-query` - Caching & synchronization
- `@trpc/react-query` - Type-safe queries
- `socket.io-client` - Real-time updates

### State Management
- `zustand` - Lightweight state
- `@tanstack/react-query` - Server state

### Optimization
- `nativewind` - CSS-in-JS optimization
- `expo-image` - Image optimization
- `react-native-reanimated` - Animation performance

---

## 🧪 Testing Modules

### Test Framework
- `jest` - Test runner
- `jest-expo` - Expo test setup
- `@testing-library/react-native` - Component testing
- `react-test-renderer` - Snapshot testing

### Test Structure
```
__tests__/
├── unit/              # Component & function tests
├── integration/       # API & database tests
├── e2e/              # End-to-end flows
└── utils/            # Test helpers
```

---

## 📚 Documentation Modules

### Generated Documentation
- `ARCHITECTURE_SUMMARY.md` - Full architecture
- `QUICK_START.md` - Quick reference
- `SETUP.md` - Setup instructions
- `README_APK_BUILDS.md` - Build guide
- `MODULES_AND_PACKAGES.md` - This file

---

## 🔗 External Service Integrations

### Firebase
- **Module:** `backend/services/notifications.ts`
- **Purpose:** Push notifications
- **SDK:** `firebase-admin`

### Stripe
- **Module:** `backend/services/stripe.ts`
- **Purpose:** Payment processing
- **SDK:** `stripe`, `@stripe/stripe-react-native`

### Google Maps
- **Module:** `backend/services/location.ts`
- **Purpose:** Location services
- **SDK:** `@googlemaps/google-maps-services-js`, `react-native-maps`

### Cloudinary
- **Module:** `backend/services/storage.ts`
- **Purpose:** Image storage
- **SDK:** `cloudinary`

### Abacus AI
- **Module:** `services/seven-consciousness/`
- **Purpose:** AI customer support
- **SDK:** Custom wrapper

### Nodemailer
- **Module:** `backend/services/email.ts`
- **Purpose:** Email sending
- **SDK:** `nodemailer`

---

## 🚀 Deployment Modules

### Build Scripts
- `scripts/bumpVersion.js` - Version management
- `scripts/check-build-status.js` - Build status
- `scripts/build-android.sh` - Android build
- `scripts/setup-ci.sh` - CI setup

### Configuration
- `eas.json` - EAS build profiles
- `app.json.backup` - Expo config
- `tsconfig.json` - TypeScript config
- `babel.config.js` - Babel config

---

## 📊 Module Statistics

### Frontend
- **Total Files:** ~150+
- **Components:** ~50+
- **Hooks:** ~15+
- **Stores:** ~5+
- **Services:** ~10+
- **Lines of Code:** ~15,000+

### Backend
- **Total Files:** ~42
- **Routes:** ~15+
- **Services:** ~8+
- **Middleware:** ~3+
- **Lines of Code:** ~8,000+

### Database
- **Models:** ~20+
- **Migrations:** ~30+
- **Relations:** ~50+

---

**Last Updated:** March 29, 2025  
**Version:** 1.1.0  
**Maintained By:** Rork Development Team
