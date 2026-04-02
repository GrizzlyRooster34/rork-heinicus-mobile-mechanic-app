# Heinicus Mobile Mechanic - Import Summary

Project overview and quick reference for the Heinicus Mobile Mechanic application.

---

## Platform Detection

| Attribute | Value |
|-----------|-------|
| **Platform** | React Native (Expo) |
| **Expo SDK** | 53.0.19 |
| **React Native** | 0.79.5 |
| **Router** | Expo Router v4 |
| **Backend** | Node.js + Hono |
| **Database** | PostgreSQL 14+ |

---

## Project Overview

**Heinicus Mobile Mechanic** is a full-stack mobile application connecting vehicle owners with mobile mechanics for on-demand automotive services.

### Core Features

- **Multi-role system**: Customers, Mechanics, Admins
- **Real-time tracking**: Live mechanic location, job status updates
- **In-app payments**: Stripe integration for secure transactions
- **Quote system**: Mechanics bid on jobs with transparent pricing
- **Chat & notifications**: Real-time communication between users
- **2FA security**: Two-factor authentication for account protection
- **Photo documentation**: Before/during/after service photos
- **AI support**: Abacus AI for customer assistance

---

## Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND                                │
│  React Native + Expo 53 + Expo Router v4                    │
│  ├── Zustand (state)                                        │
│  ├── React Query (server state)                             │
│  ├── tRPC client (type-safe API)                            │
│  ├── Socket.io client (real-time)                           │
│  └── NativeWind (Tailwind styling)                          │
└────────────────────────┬────────────────────────────────────┘
                         │ tRPC / WebSocket
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND                                 │
│  Hono 4.7.11 + tRPC v11 + Prisma ORM                        │
│  ├── REST API (Hono)                                        │
│  ├── tRPC routes (type-safe)                                │
│  ├── WebSocket server (Socket.io)                           │
│  └── JWT authentication                                     │
└────────────────────────┬────────────────────────────────────┘
                         │ Prisma
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATABASE                                │
│  PostgreSQL 14+                                             │
│  ├── 20+ models (Users, Jobs, Payments, etc.)                │
│  └── Full type safety with Prisma                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack Summary

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Expo SDK | 53.0.19 | React Native framework |
| React Native | 0.79.5 | Mobile UI |
| Expo Router | v4 | File-based routing |
| Zustand | 5.0.2 | State management |
| React Query | 5.80.7 | Server state |
| NativeWind | 4.1.23 | Tailwind for RN |
| tRPC Client | 11.4.1 | Type-safe API |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Hono | 4.7.11 | HTTP framework |
| tRPC | 11.4.1 | Type-safe RPC |
| Prisma | 5.22.0 | ORM |
| Socket.io | 4.8.1 | WebSocket |
| JWT | 9.0.2 | Authentication |
| bcryptjs | 2.4.3 | Password hashing |

### External Services

| Service | Purpose |
|---------|---------|
| PostgreSQL | Primary database |
| Stripe | Payment processing |
| Firebase | Storage, Push notifications |
| Google Maps | Location services |
| Twilio | SMS, 2FA |
| SMTP | Email |
| Abacus AI | Customer support |

---

## Project Structure (Root Level)

```
rork-heinicus-mobile-mechanic-app/
│
├── 📱 Frontend
│   ├── app/                    # Expo Router screens (~30)
│   ├── components/             # React components (~50)
│   ├── hooks/                  # Custom hooks (~15)
│   ├── stores/                 # Zustand stores (~8)
│   ├── lib/                    # Utilities & clients
│   ├── services/               # External services
│   ├── constants/              # App constants
│   └── types/                  # TypeScript types
│
├── 🔧 Backend
│   ├── backend/
│   │   ├── hono.ts            # API entry point
│   │   ├── trpc/              # tRPC routes (~12)
│   │   └── websocket/         # Socket.io server
│   └── prisma/
│       └── schema.prisma      # Database schema
│
├── 🧪 Testing
│   └── __tests__/
│       ├── unit/              # Unit tests (ts-jest)
│       ├── integration/       # Integration tests
│       └── e2e/               # End-to-end tests
│
└── ⚙️ Configuration
    ├── package.json           # Root dependencies
    ├── app.json               # Expo config
    ├── metro.config.js        # Metro bundler
    ├── jest.config.js         # Jest config
    ├── tailwind.config.js     # Tailwind config
    └── .env.example           # Environment template
```

---

## Quick Commands

### Development

```bash
# Install dependencies (at ROOT)
npm install

# Setup environment
cp .env.example .env
# Edit .env with your values

# Setup database
npx prisma migrate deploy
npx prisma db seed

# Start development (3 terminals)
npm run backend:watch    # Terminal 1: API
npm run websocket        # Terminal 2: WebSocket
npm run start            # Terminal 3: Expo
```

### Building

```bash
# Android
npm run build:dev        # Development
npm run build:preview    # Preview/APK
npm run build:prod       # Production

# iOS
eas build -p ios --profile production

# Web
npm run build-web
```

### Testing

```bash
npm run test             # All tests
npm run test:unit        # Unit only
npm run test:coverage    # With coverage
```

---

## Key Features

### Multi-Role System

| Role | Capabilities |
|------|-------------|
| **Customer** | Request services, track mechanics, pay, review |
| **Mechanic** | Accept jobs, navigate, update status, earn |
| **Admin** | Manage users, verify mechanics, handle disputes |

### Real-Time Features

- Live mechanic location tracking
- In-app chat between customer & mechanic
- Instant job status updates
- Push notifications

### Payment System

- Stripe integration
- Quote acceptance workflow
- Secure payment processing
- Refund support

### Security

- JWT authentication
- Two-factor authentication (2FA)
- Role-based access control
- Password hashing (bcrypt)

---

## Environment Variables

### Required

```bash
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
WEBSOCKET_PORT=3001
```

### Optional

```bash
# Firebase
EXPO_PUBLIC_FIREBASE_API_KEY="..."
EXPO_PUBLIC_FIREBASE_PROJECT_ID="..."

# Google Maps
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY="..."

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_USER="..."
SMTP_PASSWORD="..."

# Twilio
TWILIO_ACCOUNT_SID="..."
TWILIO_AUTH_TOKEN="..."

# AI
ABACUS_AI_API_KEY="..."
```

---

## Database Models

### Core Entities

| Model | Description |
|-------|-------------|
| `User` | Base user (Customer, Mechanic, Admin) |
| `CustomerProfile` | Customer-specific data |
| `MechanicProfile` | Mechanic-specific data |
| `Vehicle` | Customer vehicles |
| `Job` | Service requests |
| `Quote` | Price quotes from mechanics |
| `Payment` | Payment records |
| `Review` | User reviews |
| `ChatMessage` | In-app messages |
| `Notification` | Push notifications |

### Job Status Flow

```
PENDING → QUOTED → ACCEPTED → ASSIGNED → IN_PROGRESS → COMPLETED
   ↓         ↓          ↓
CANCELLED  REJECTED   DISPUTED
```

---

## Important: Metro BlockList

The `metro.config.js` intentionally blocks Node-only packages from the mobile bundle:

```javascript
config.resolver.blockList = [
  /node_modules\/pg\/.*/,           // PostgreSQL
  /node_modules\/bcryptjs\/.*/,      // Password hashing
  /node_modules\/jsonwebtoken\/.*/,  // JWT
  /node_modules\/nodemailer\/.*/,    // Email
  /node_modules\/@prisma\/client\/.*/, // Prisma
];
```

**These packages run on the BACKEND ONLY.** The mobile app communicates via tRPC/WebSocket.

---

## Documentation

| Document | Purpose | Read Time |
|----------|---------|-----------|
| [QUICK_START.md](./QUICK_START.md) | 5-minute setup | 10 min |
| [BUILD_AND_RUN.md](./BUILD_AND_RUN.md) | Build & deploy | 15 min |
| [ARCHITECTURE_SUMMARY.md](./ARCHITECTURE_SUMMARY.md) | System design | 20 min |
| [MODULES_AND_PACKAGES.md](./MODULES_AND_PACKAGES.md) | Code structure | 15 min |
| [IMPORT_SUMMARY.md](./IMPORT_SUMMARY.md) | This file | 5 min |

---

## External Links

- **GitHub**: https://github.com/GrizzlyRooster34/rork-heinicus-mobile-mechanic-app
- **Expo**: https://expo.dev/@heinicus1/heinicus-mobile-mechanic-app
- **EAS Dashboard**: https://expo.dev/accounts/heinicus1/projects/heinicus-mobile-mechanic-app

---

**Ready to start!** 🚀

→ Read [QUICK_START.md](./QUICK_START.md) for setup instructions.
