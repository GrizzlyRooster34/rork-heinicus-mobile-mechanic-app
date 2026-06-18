# Rork Heinicus Mobile Mechanic App
## Project Specification, Tech Stack & Architecture

---

## 📋 Executive Summary

**Rork Heinicus** is a full-stack mobile mechanic marketplace platform connecting vehicle owners with certified mobile mechanics. The platform supports three user roles (Customer, Mechanic, Admin) with real-time job tracking, payments, notifications, and AI-powered assistance.

### Core Value Proposition
- **On-demand mobile mechanic services** - Request repairs at your location
- **Real-time tracking** - Monitor mechanic arrival and job progress
- **Secure payments** - Integrated Stripe payment processing
- **Multi-platform** - iOS, Android, and Web support via Expo
- **Offline-first** - Works with intermittent connectivity

---

## 🏗️ System Architecture

### High-Level Architecture (C4 System Context)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           RORK HEINICUS PLATFORM                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                  │
│  │   Customer   │     │   Mechanic   │     │    Admin     │                  │
│  │    Mobile    │     │    Mobile    │     │   Dashboard  │                  │
│  │     App      │     │     App      │     │              │                  │
│  └──────┬───────┘     └──────┬───────┘     └──────┬───────┘                  │
│         │                    │                    │                          │
│         └────────────────────┼────────────────────┘                          │
│                              │                                              │
│                              ▼                                              │
│         ┌─────────────────────────────────────────┐                         │
│         │         EXPO REACT NATIVE APP           │                         │
│         │  (Shared codebase, role-based routing)    │                         │
│         └──────────────────┬────────────────────────┘                         │
│                            │                                                │
│                            ▼                                                │
│         ┌─────────────────────────────────────────┐                         │
│         │           tRPC API LAYER                │                         │
│         │    (Type-safe API via Hono/Fetch)       │                         │
│         └──────────────────┬────────────────────────┘                         │
│                            │                                                │
│         ┌──────────────────┴────────────────────────┐                         │
│         │                                           │                         │
│         ▼                                           ▼                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  PostgreSQL │  │   Firebase  │  │   Stripe    │  │    AI/LLM   │         │
│  │   (Prisma)  │  │   (FCM/Auth)│  │  (Payments) │  │  (Abacus AI)│         │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend (Mobile App)
| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | Expo SDK | 53 | Cross-platform mobile development |
| UI Framework | React Native | 0.79.5 | Native mobile UI |
| Navigation | Expo Router | ^4.0.20 | File-based routing |
| State Management | Zustand | ^5.0.3 | Global state |
| Data Fetching | TanStack Query | ^5.80.7 | Server state management |
| API Client | tRPC Client | ^11.4.1 | Type-safe API calls |
| Styling | NativeWind | ^4.1.23 | Tailwind for React Native |
| Forms | React Hook Form | ^7.54.2 | Form management |
| Validation | Zod | ^3.24.2 | Schema validation |
| Maps | React Native Maps | ^1.20.1 | Location services |
| Camera | Expo Camera | ^16.0.18 | Photo capture |
| Notifications | Expo Notifications | ^0.29.14 | Push notifications |

### Backend
| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| API Framework | Hono | ^4.7.5 | Lightweight HTTP framework |
| RPC Layer | tRPC | ^11.4.1 | Type-safe procedures |
| Database ORM | Prisma | ^5.22.0 | Database access |
| Database | PostgreSQL | 14+ | Primary data store |
| Auth | JWT + bcryptjs | ^3.0.2 | Authentication |
| Push Notifications | Firebase Admin | ^12.7.0 | FCM for push |
| Payments | Stripe | ^18.0.0 | Payment processing |
| AI Integration | Abacus AI | Custom | Customer support bot |
| Real-time | WebSocket | Native | Live chat/updates |

### DevOps & Infrastructure
| Layer | Technology | Purpose |
|-------|-----------|---------|
| Build System | EAS (Expo Application Services) | CI/CD for mobile builds |
| Hosting | TBD (Vercel/Railway/Render) | Backend deployment |
| Database Hosting | TBD (Supabase/Railway/AWS RDS) | PostgreSQL hosting |
| Storage | Firebase Storage | Image/file storage |
| Analytics | Expo Analytics | Usage tracking |

### Testing & Quality
| Tool | Purpose |
|------|---------|
| Jest | Unit & integration testing |
| React Native Testing Library | Component testing |
| TypeScript | Type safety |
| ESLint | Code linting |
| Prettier | Code formatting |

---

## 📁 Project Structure

```
rork-heinicus-mobile-mechanic-app/
├── 📱 app/                          # Expo Router file-based routing
│   ├── (admin)/                     # Admin role routes
│   │   ├── _layout.tsx              # Admin layout with navigation
│   │   ├── index.tsx                # Admin dashboard
│   │   ├── jobs.tsx                 # Job management
│   │   ├── users.tsx                # User management
│   │   ├── quotes.tsx               # Quote management
│   │   └── settings.tsx             # Admin settings
│   ├── (customer)/                  # Customer role routes
│   │   ├── _layout.tsx              # Customer layout
│   │   ├── index.tsx                # Customer home
│   │   ├── request.tsx              # Service request form
│   │   ├── schedule.tsx             # Scheduling
│   │   ├── quotes.tsx               # View quotes
│   │   └── profile.tsx              # Customer profile
│   ├── (mechanic)/                  # Mechanic role routes
│   │   ├── _layout.tsx              # Mechanic layout
│   │   ├── index.tsx                # Mechanic dashboard
│   │   ├── jobs.tsx                 # Job management
│   │   ├── customers.tsx            # Customer list
│   │   ├── map.tsx                  # Navigation/map view
│   │   └── profile.tsx              # Mechanic profile
│   ├── auth/                        # Authentication routes
│   │   └── index.tsx                # Login/register screen
│   ├── _layout.tsx                  # Root layout (auth provider)
│   ├── +not-found.tsx               # 404 page
│   └── dev-switcher.tsx             # Role switcher for dev
│
├── 🧩 components/                   # Reusable React components
│   ├── forms/                       # Form components
│   ├── payments/                    # Payment-related
│   ├── chat/                        # Chat components
│   ├── reviews/                     # Review components
│   └── error-boundaries/            # Error handling
│
├── 🎣 hooks/                        # Custom React hooks
│   ├── usePushNotifications.ts      # Push notification management
│   ├── useAuth.ts                   # Authentication state
│   └── useJobs.ts                   # Job data fetching
│
├── 🗄️ stores/                        # Zustand state stores
│   ├── authStore.ts                 # Auth state
│   ├── jobStore.ts                  # Job state
│   └── notificationStore.ts         # Notification state
│
├── 🔧 backend/                      # Backend API code
│   └── trpc/
│       ├── routes/                  # tRPC procedure routers
│       │   ├── auth/                # Authentication
│       │   ├── job/                 # Job CRUD + status
│       │   ├── mechanic/            # Mechanic profiles
│       │   ├── notifications/       # Push notifications
│       │   ├── payments/            # Stripe integration
│       │   ├── quote/               # Quote management
│       │   ├── reviews/             # Reviews & ratings
│       │   ├── admin/               # Admin operations
│       │   └── config/              # App configuration
│       ├── context.ts               # tRPC context (auth)
│       └── router.ts                # Main router composition
│
├── 📚 lib/                          # Shared utilities
│   ├── prisma.ts                    # Prisma client
│   ├── trpc.ts                      # tRPC client setup
│   ├── notifications/               # Notification services
│   │   ├── push-service.ts          # FCM push service
│   │   └── firebase-admin.ts        # Firebase admin setup
│   └── utils/                       # Helper functions
│
├── 🗃️ prisma/                       # Database schema
│   ├── schema.prisma                # Prisma schema definition
│   └── migrations/                  # Database migrations
│
├── 🧪 __tests__/                    # Test suites
│   ├── unit/                        # Unit tests
│   └── integration/                 # Integration tests
│
├── ⚙️ Configuration Files
│   ├── app.json                     # Expo configuration
│   ├── eas.json                     # EAS build profiles
│   ├── package.json                 # Dependencies
│   ├── tsconfig.json                # TypeScript config
│   ├── tailwind.config.js           # Tailwind styling
│   └── metro.config.js              # Metro bundler config
│
└── 📖 Documentation
    ├── README.md                    # Main documentation
    ├── PROJECT_SPEC.md              # This document
    ├── QUICK_START.md               # Quick start guide
    ├── ARCHITECTURE.md              # Architecture details
    └── API_DOCUMENTATION.md         # API reference
```

---

## 🗄️ Database Schema (Prisma)

### Core Entities

```prisma
// User & Authentication
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  firstName String
  lastName  String
  phone     String?
  role      UserRole @default(CUSTOMER)
  isActive  Boolean  @default(true)
  
  // Relations
  customerProfile CustomerProfile?
  mechanicProfile MechanicProfile?
  adminProfile    AdminProfile?
  customerJobs    Job[] @relation("CustomerJobs")
  mechanicJobs    Job[] @relation("MechanicJobs")
  pushTokens      PushToken[]
  notificationPreferences NotificationPreference?
}

// Job Management
model Job {
  id              String    @id @default(cuid())
  customerId      String
  mechanicId      String?
  status          JobStatus @default(PENDING)
  serviceType     String
  description     String
  location        Json      // { lat, lng, address }
  estimatedCost   Float?
  finalCost       Float?
  scheduledDate   DateTime?
  completedAt     DateTime?
  
  // Relations
  customer        User @relation("CustomerJobs", fields: [customerId], references: [id])
  mechanic        User? @relation("MechanicJobs", fields: [mechanicId], references: [id])
  payments        Payment[]
  photos          JobPhoto[]
  timeline        JobTimeline[]
}

// Push Notifications
model PushToken {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  platform  String   // ios, android, web
  deviceId  String?
  isActive  Boolean  @default(true)
  lastUsed  DateTime @updatedAt
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model NotificationPreference {
  id                    String  @id @default(cuid())
  userId                String  @unique
  
  // Preferences
  jobUpdates            Boolean @default(true)
  paymentNotifications  Boolean @default(true)
  marketingEmails       Boolean @default(false)
  mechanicAlerts        Boolean @default(true)
  
  user                  User    @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### Enum Types
```prisma
enum UserRole {
  CUSTOMER
  MECHANIC
  ADMIN
}

enum JobStatus {
  PENDING
  QUOTED
  ACCEPTED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum VerificationStatus {
  PENDING
  VERIFIED
  REJECTED
}
```

---

## 🔌 API Architecture (tRPC)

### Router Structure

```typescript
// Main Router Composition
appRouter
├── authRouter
│   ├── login(input: LoginInput) => User
│   ├── register(input: RegisterInput) => User
│   ├── logout() => void
│   └── refreshToken() => AuthTokens
│
├── jobRouter
│   ├── create(input: CreateJobInput) => Job
│   ├── getById(id: string) => Job
│   ├── list(filters: JobFilters) => Job[]
│   ├── updateStatus(input: UpdateStatusInput) => Job
│   │   └── Triggers push notifications
│   └── assignMechanic(input: AssignInput) => Job
│
├── mechanicRouter
│   ├── getProfile() => MechanicProfile
│   ├── updateProfile(input: ProfileInput) => MechanicProfile
│   ├── setAvailability(input: AvailabilityInput) => void
│   └── getNearbyMechanics(location: GeoPoint) => MechanicProfile[]
│
├── notificationRouter
│   ├── registerPushToken(input: TokenInput) => PushToken
│   ├── updatePreferences(input: PreferencesInput) => NotificationPreference
│   ├── getPreferences() => NotificationPreference
│   └── sendTestNotification() => void
│
├── paymentRouter
│   ├── createPaymentIntent(input: PaymentInput) => PaymentIntent
│   ├── confirmPayment(paymentId: string) => Payment
│   └── getPaymentHistory() => Payment[]
│
├── quoteRouter
│   ├── createQuote(input: QuoteInput) => Quote
│   ├── respondToQuote(input: ResponseInput) => Quote
│   └── getQuotesForJob(jobId: string) => Quote[]
│
├── reviewRouter
│   ├── createReview(input: ReviewInput) => Review
│   ├── getReviewsForMechanic(mechanicId: string) => Review[]
│   └── getAverageRating(mechanicId: string) => number
│
└── adminRouter
    ├── getDashboardStats() => DashboardStats
    ├── listUsers(filters: UserFilters) => User[]
    ├── verifyMechanic(mechanicId: string) => MechanicProfile
    └── manageSettings(input: SettingsInput) => AppConfig
```

### Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│  tRPC API   │────▶│   Prisma    │
│             │     │             │     │             │
│ 1. Login    │     │ 2. Validate │     │ 3. Fetch    │
│    Request  │     │    Credentials│   │    User     │
│             │     │             │     │             │
│◀────────────│     │◀────────────│     │◀────────────│
│ 4. JWT      │     │ 5. Generate │     │             │
│    Tokens   │     │    Tokens   │     │             │
└─────────────┘     └─────────────┘     └─────────────┘

Subsequent Requests:
┌─────────────┐     ┌─────────────┐
│   Client    │────▶│  tRPC API   │
│             │     │             │
│ Authorization│    │ 1. Verify   │
│: Bearer JWT │     │    JWT      │
│             │     │ 2. Set ctx.user│
│◀────────────│     │◀────────────│
│ Response    │     │ 3. Execute  │
│             │     │    Procedure│
└─────────────┘     └─────────────┘
```

---

## 🔔 Push Notification System

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PUSH NOTIFICATION FLOW                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐                                          │
│  │   Expo App   │                                          │
│  │              │  1. Request permission                   │
│  │  usePushNotifications  ◀──────────────────────┐         │
│  │              │  2. Get Expo push token        │         │
│  │              │  3. Register with backend       │         │
│  └──────┬───────┘                                  │         │
│         │                                         │         │
│         │ POST /api/trpc/notifications.registerPushToken   │
│         ▼                                         │         │
│  ┌──────────────┐                                │         │
│  │   Backend    │                                │         │
│  │              │  4. Store in PushToken table   │         │
│  │  tRPC Router │◀───────────────────────────────┘         │
│  │              │                                           │
│  └──────┬───────┘                                           │
│         │                                                    │
│         │ 5. Job status change triggers notification         │
│         ▼                                                    │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐│
│  │  Job Router  │────▶│ Push Service │────▶│   Firebase   ││
│  │              │     │              │     │    FCM       ││
│  │ updateStatus │     │ sendToUser() │     │              ││
│  └──────────────┘     └──────────────┘     └──────┬───────┘│
│                                                    │        │
│                              6. Deliver to device  │        │
│                                                    ▼        │
│                                             ┌──────────────┐│
│                                             │  User Device ││
│                                             │              ││
│                                             │  Notification││
│                                             │  Displayed   ││
│                                             └──────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Notification Triggers

| Event | Recipient | Message |
|-------|-----------|---------|
| Job Accepted | Customer | "Your service request has been accepted by [Mechanic]" |
| Mechanic En Route | Customer | "[Mechanic] is on the way to your location" |
| Job Started | Customer | "Your vehicle service has begun" |
| Job Completed | Customer | "Service complete! Please review and pay" |
| Payment Received | Mechanic | "Payment confirmed for job #[ID]" |
| New Job Nearby | Mechanic | "New service request within your service area" |
| Quote Received | Customer | "You have a new quote for your service request" |

---

## 📅 Development Roadmap

### Phase 1: Foundation ✅ COMPLETE
**Timeline: Weeks 1-4**

| Feature | Status | Notes |
|---------|--------|-------|
| Project scaffolding | ✅ | Expo SDK 53, React Native 0.79 |
| Database schema | ✅ | Prisma + PostgreSQL |
| Authentication system | ✅ | JWT-based, role-based access |
| Basic UI framework | ✅ | NativeWind, Expo Router |
| tRPC API setup | ✅ | Hono + tRPC v11 |
| User registration/login | ✅ | All three roles |

### Phase 2: Core Features ✅ COMPLETE
**Timeline: Weeks 5-8**

| Feature | Status | Notes |
|---------|--------|-------|
| Job request flow | ✅ | Customer creates service request |
| Mechanic assignment | ✅ | Admin assigns or auto-assign |
| Job status tracking | ✅ | Full status lifecycle |
| Real-time location | ✅ | Map integration |
| Photo upload | ✅ | Job documentation |
| Basic notifications | ✅ | In-app notifications |

### Phase 3: Payments & Notifications 🔄 IN PROGRESS
**Timeline: Weeks 9-12**

| Feature | Status | Notes |
|---------|--------|-------|
| Stripe integration | ✅ | Payment intents, confirmations |
| Push notifications | ✅ | Expo + Firebase FCM |
| Push token management | ✅ | PR #35 |
| Job status notifications | ✅ | PR #35 |
| Payment notifications | 🔄 | Pending |
| Quote notifications | 🔄 | Pending |

### Phase 4: Advanced Features 📋 PLANNED
**Timeline: Weeks 13-16**

| Feature | Status | Priority |
|---------|--------|----------|
| AI customer support | 🔄 | High |
| Maintenance reminders | 📋 | Medium |
| Mechanic verification | ✅ | Complete |
| Review & rating system | 🔄 | High |
| Advanced analytics | 📋 | Low |
| Offline mode improvements | 🔄 | High |

### Phase 5: Production & Scale 📋 PLANNED
**Timeline: Weeks 17-20**

| Feature | Status | Priority |
|---------|--------|----------|
| Performance optimization | 📋 | High |
| Security audit | 📋 | High |
| App store submission | 📋 | Critical |
| CI/CD pipeline | 🔄 | In progress |
| Monitoring & alerting | 📋 | Medium |
| Load testing | 📋 | Medium |

---

## 🔐 Security Considerations

### Authentication & Authorization
- JWT tokens with refresh token rotation
- Role-based access control (RBAC)
- Password hashing with bcrypt (10+ rounds)
- Rate limiting on auth endpoints

### Data Protection
- PostgreSQL SSL connections
- Environment variable isolation
- No sensitive data in client bundles
- Input validation with Zod schemas

### API Security
- tRPC procedure-level auth middleware
- CORS configuration for mobile origins
- Request payload size limits
- SQL injection prevention (Prisma ORM)

### Mobile Security
- Certificate pinning for API calls
- Secure storage for auth tokens (Keychain/Keystore)
- Biometric authentication option
- Screenshot prevention on sensitive screens

---

## 📊 Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| App launch time | < 3s | TBD |
| API response time (p95) | < 200ms | TBD |
| Time to interactive | < 5s | TBD |
| Bundle size (Android) | < 50MB | TBD |
| Offline capability | Core flows | Partial |
| Push notification delivery | < 5s | ✅ |

---

## 🚀 Deployment Strategy

### Mobile App (EAS)
```bash
# Development builds
eas build --profile development --platform android
eas build --profile development --platform ios

# Preview builds (internal testing)
eas build --profile preview --platform android

# Production builds (app stores)
eas build --profile production --platform android
eas build --profile production --platform ios
```

### Backend Deployment
- **Option A**: Vercel (serverless functions)
- **Option B**: Railway (containerized)
- **Option C**: Render (full-stack)

### Database
- **Development**: Local PostgreSQL or Docker
- **Staging**: Railway PostgreSQL
- **Production**: AWS RDS or Supabase

---

## 📚 Documentation Index

| Document | Purpose |
|----------|---------|
| `README.md` | Project overview, quick links |
| `PROJECT_SPEC.md` | This document - comprehensive spec |
| `QUICK_START.md` | Developer onboarding |
| `ARCHITECTURE.md` | Detailed architecture decisions |
| `API_DOCUMENTATION.md` | API endpoint reference |
| `BUILD_AND_RUN.md` | Build instructions |
| `IMPORT_AND_OVERVIEW.md` | Module dependencies |

---

## 🤝 Contributing Guidelines

### Branch Strategy
- `main` - Production-ready code
- `main-v2` - Active development branch
- `feature/*` - Feature branches
- `fix/*` - Bug fix branches

### Commit Convention
```
feat: add new feature
fix: resolve bug
docs: update documentation
refactor: code restructuring
test: add/update tests
chore: maintenance tasks
```

### PR Requirements
- TypeScript type checking passes
- Tests pass (`npm test`)
- Linting passes (`npm run lint`)
- PR description includes:
  - What changed
  - Why it changed
  - Testing performed

---

## 📞 Support & Contact

- **Project Owner**: Heinicus
- **Repository**: https://github.com/GrizzlyRooster34/rork-heinicus-mobile-mechanic-app
- **Issues**: Use GitHub Issues for bug reports
- **Discussions**: Use GitHub Discussions for questions

---

*Last Updated: April 2026*
*Version: 1.1.0*
