# Heinicus Mobile Mechanic - Architecture Summary

Complete system architecture for the Heinicus Mobile Mechanic application.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Project Structure](#2-project-structure)
3. [Frontend Architecture](#3-frontend-architecture)
4. [Backend Architecture](#4-backend-architecture)
5. [Database Schema](#5-database-schema)
6. [Real-Time Communication](#6-real-time-communication)
7. [Security Architecture](#7-security-architecture)
8. [External Integrations](#8-external-integrations)
9. [Metro Configuration](#9-metro-configuration)
10. [Development Workflow](#10-development-workflow)

---

## 1. System Overview

### Platform
- **Framework**: React Native with Expo SDK 53
- **Router**: Expo Router v4 (file-based routing)
- **State**: Zustand + React Query (TanStack)
- **Styling**: NativeWind (Tailwind for RN)

### Backend
- **Framework**: Hono 4.7.11 (lightweight, fast)
- **API**: tRPC v11 (type-safe RPC)
- **Database**: PostgreSQL 14+ with Prisma ORM
- **Real-time**: Socket.io WebSocket server

### Build System
- **Bundler**: Metro (React Native)
- **Build**: EAS (Expo Application Services)
- **Testing**: Jest + ts-jest (NOT jest-expo)

---

## 2. Project Structure

```
rork-heinicus-mobile-mechanic-app/
│
├── 📱 Frontend (React Native)
│   ├── app/                    # Expo Router screens
│   │   ├── (admin)/           # Admin routes (grouped)
│   │   ├── (customer)/        # Customer routes
│   │   ├── (mechanic)/        # Mechanic routes
│   │   ├── auth/              # Authentication screens
│   │   ├── _layout.tsx        # Root layout
│   │   └── dev-switcher.tsx   # Dev role switcher
│   │
│   ├── components/            # React components (~50)
│   │   ├── chat/             # Chat-related
│   │   ├── forms/            # Form components
│   │   ├── payments/         # Payment UI
│   │   └── reviews/          # Review components
│   │
│   ├── hooks/                 # Custom React hooks
│   │   ├── use-firebase.ts
│   │   ├── usePushNotifications.ts
│   │   ├── useStripePayment.ts
│   │   ├── useWebSocket.ts
│   │   └── useFormValidation.ts
│   │
│   ├── stores/                # Zustand state stores
│   │   ├── auth-store.ts     # Authentication state
│   │   ├── app-store.ts      # App-wide state
│   │   └── settings-store.ts # User settings
│   │
│   ├── lib/                   # Utilities & clients
│   │   ├── trpc.ts           # tRPC client setup
│   │   ├── prisma.ts         # Prisma client
│   │   └── stripe-config.ts  # Stripe configuration
│   │
│   ├── constants/             # App constants
│   │   └── colors.ts         # Theme colors
│   │
│   ├── types/                 # TypeScript types
│   ├── utils/                 # Utility functions
│   └── services/              # Service integrations
│       ├── firebase-service.ts
│       └── error-reporting.ts
│
├── 🔧 Backend (Node.js)
│   ├── backend/
│   │   ├── hono.ts           # Hono app entry point
│   │   ├── env-validation.ts # Environment validation
│   │   ├── routes/
│   │   │   └── payment.ts    # Payment routes
│   │   │
│   │   ├── trpc/             # tRPC setup
│   │   │   ├── trpc.ts       # tRPC initialization
│   │   │   ├── app-router.ts # Main router
│   │   │   ├── create-context.ts # Context factory
│   │   │   └── routes/       # API routes
│   │   │       ├── auth/     # Authentication
│   │   │       ├── job/      # Job management
│   │   │       ├── mechanic/ # Mechanic operations
│   │   │       ├── payments/ # Payment processing
│   │   │       ├── quote/    # Quote system
│   │   │       └── ...
│   │   │
│   │   └── websocket/        # Socket.io server
│   │       └── server.ts     # WebSocket entry
│   │
│   └── prisma/
│       └── schema.prisma     # Database schema
│
├── 🧪 Testing
│   └── __tests__/
│       ├── unit/             # Unit tests (ts-jest)
│       ├── integration/      # Integration tests
│       └── e2e/              # End-to-end tests
│
└── ⚙️ Configuration
    ├── package.json          # Root-level dependencies
    ├── app.json              # Expo configuration
    ├── metro.config.js       # Metro bundler config
    ├── jest.config.js        # Jest configuration
    ├── tailwind.config.js    # Tailwind config
    ├── tsconfig.json         # TypeScript config
    └── .env.example          # Environment template
```

---

## 3. Frontend Architecture

### Navigation (Expo Router v4)

File-based routing with route groups:

```
app/
├── (admin)/          # Group: Admin routes
│   ├── dashboard.tsx
│   ├── users.tsx
│   └── settings.tsx
│
├── (customer)/       # Group: Customer routes
│   ├── home.tsx
│   ├── jobs/
│   │   ├── index.tsx
│   │   └── [id].tsx
│   └── profile.tsx
│
├── (mechanic)/       # Group: Mechanic routes
│   ├── dashboard.tsx
│   ├── jobs.tsx
│   └── availability.tsx
│
├── auth/             # Auth routes (ungrouped)
│   ├── login.tsx
│   ├── register.tsx
│   └── forgot-password.tsx
│
├── _layout.tsx       # Root layout with providers
└── +not-found.tsx    # 404 page
```

### State Management

**Zustand Stores:**

```typescript
// stores/auth-store.ts
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  role: 'CUSTOMER' | 'MECHANIC' | 'ADMIN';
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// stores/app-store.ts
interface AppState {
  currentJob: Job | null;
  notifications: Notification[];
  unreadCount: number;
  socket: Socket | null;
}
```

**React Query (TanStack):**

```typescript
// lib/trpc.ts
import { createTRPCReact } from '@trpc/react-query';

export const trpc = createTRPCReact<AppRouter>();

// Usage in components
const { data: jobs } = trpc.job.getAll.useQuery();
const mutation = trpc.job.create.useMutation();
```

### Component Architecture

```typescript
// Example: JobCard component
interface JobCardProps {
  job: Job;
  onPress: (jobId: string) => void;
  showActions?: boolean;
}

export function JobCard({ job, onPress, showActions }: JobCardProps) {
  const { user } = useAuthStore();
  const { mutate: updateStatus } = trpc.job.updateStatus.useMutation();

  return (
    <Pressable onPress={() => onPress(job.id)}>
      <View className="p-4 bg-white rounded-lg shadow">
        <Text className="text-lg font-bold">{job.title}</Text>
        <StatusBadge status={job.status} />
        {showActions && <ActionButtons job={job} />}
      </View>
    </Pressable>
  );
}
```

---

## 4. Backend Architecture

### Hono + tRPC Setup

```typescript
// backend/hono.ts
import { Hono } from 'hono';
import { trpcServer } from '@hono/trpc-server';
import { cors } from 'hono/cors';
import { appRouter } from './trpc/app-router';

const app = new Hono();

// CORS for all routes
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Health check
app.get('/', (c) => c.json({ status: 'ok' }));

// Mount tRPC at /trpc
app.use('/trpc/*', trpcServer({
  router: appRouter,
  createContext,
}));

// Payment routes
app.route('/payment', paymentRouter);

export default app;
```

### tRPC Router Structure

```typescript
// backend/trpc/app-router.ts
import { router } from './trpc';
import { authRouter } from './routes/auth/route';
import { jobRouter } from './routes/job/route';
import { mechanicRouter } from './routes/mechanic/route';
import { paymentRouter } from './routes/payments/route';

export const appRouter = router({
  auth: authRouter,
  job: jobRouter,
  mechanic: mechanicRouter,
  payment: paymentRouter,
  quote: quoteRouter,
  review: reviewRouter,
  admin: adminRouter,
  notification: notificationRouter,
  vin: vinRouter,
  diagnosis: diagnosisRouter,
});

export type AppRouter = typeof appRouter;
```

### Protected Procedures

```typescript
// backend/trpc/trpc.ts
import { initTRPC } from '@trpc/server';
import { verifyToken } from '../utils/jwt';

const t = initTRPC.create();

export const middleware = t.middleware;
export const router = t.router;
export const publicProcedure = t.procedure;

// Auth middleware
const isAuthed = middleware(async ({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
  return next({ ctx: { ...ctx, user: ctx.user } });
});

// Role middleware
const isMechanic = middleware(async ({ ctx, next }) => {
  if (ctx.user?.role !== 'MECHANIC') {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  return next({ ctx });
});

export const protectedProcedure = t.procedure.use(isAuthed);
export const mechanicProcedure = protectedProcedure.use(isMechanic);
```

---

## 5. Database Schema

### Core Models

```prisma
// User & Profiles
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  firstName String
  lastName  String
  role      UserRole @default(CUSTOMER)
  isActive  Boolean  @default(true)

  customerProfile CustomerProfile?
  mechanicProfile MechanicProfile?
  adminProfile    AdminProfile?

  customerJobs Job[] @relation("CustomerJobs")
  mechanicJobs Job[] @relation("MechanicJobs")
}

model CustomerProfile {
  id     String @id @default(cuid())
  userId String @unique
  user   User   @relation(fields: [userId], references: [id])

  vehicles Vehicle[]
}

model MechanicProfile {
  id                 String @id @default(cuid())
  userId             String @unique
  user               User   @relation(fields: [userId], references: [id])

  licenseNumber      String?
  yearsExperience    Int?
  specializations    String[]
  serviceRadius      Float? @default(25.0)
  hourlyRate         Float?
  isAvailable        Boolean @default(true)
  verificationStatus VerificationStatus @default(PENDING)
  averageRating      Float? @default(0.0)
  totalJobsCompleted Int @default(0)
}
```

### Job Lifecycle

```prisma
model Job {
  id          String    @id @default(cuid())
  customerId  String
  customer    User      @relation("CustomerJobs", fields: [customerId], references: [id])
  mechanicId  String?
  mechanic    User?     @relation("MechanicJobs", fields: [mechanicId], references: [id])
  vehicleId   String
  vehicle     Vehicle   @relation(fields: [vehicleId], references: [id])

  title       String
  description String
  category    ServiceType
  urgency     UrgencyLevel @default(NORMAL)
  status      JobStatus @default(PENDING)

  location    String
  latitude    Float?
  longitude   Float?
  scheduledDate DateTime?

  totalCost   Float?
  laborCost   Float?
  partsCost   Float?

  quotes      Quote[]
  payments    Payment[]
  reviews     Review[]
  timeline    JobTimeline[]
  chatMessages ChatMessage[]
}
```

### Payments & Quotes

```prisma
model Quote {
  id                String      @id @default(cuid())
  jobId             String
  job               Job         @relation(fields: [jobId], references: [id])

  laborCost         Float
  partsCost         Float
  totalCost         Float
  estimatedDuration Int
  validUntil        DateTime
  status            QuoteStatus @default(PENDING)

  parts             QuotePart[]
}

model Payment {
  id              String        @id @default(cuid())
  userId          String
  user            User          @relation(fields: [userId], references: [id])
  jobId           String
  job             Job           @relation(fields: [jobId], references: [id])

  amount          Float
  currency        String        @default("USD")
  status          PaymentStatus @default(PENDING)
  paymentMethod   String
  stripePaymentId String?
  stripeIntentId  String?
}
```

### Enums

```prisma
enum UserRole {
  CUSTOMER
  MECHANIC
  ADMIN
}

enum JobStatus {
  PENDING      // Job created, awaiting quotes
  QUOTED       // Quote received from mechanic
  ACCEPTED     // Customer accepted quote
  ASSIGNED     // Mechanic assigned
  IN_PROGRESS  // Service started
  COMPLETED    // Service finished
  CANCELLED    // Job cancelled
  DISPUTED     // Dispute raised
}

enum ServiceType {
  TIRE_REPAIR
  TIRE_REPLACEMENT
  BATTERY_SERVICE
  BRAKE_REPAIR
  ENGINE_DIAGNOSIS
  OIL_CHANGE
  TRANSMISSION_SERVICE
  ELECTRICAL_REPAIR
  SUSPENSION_REPAIR
  COOLING_SYSTEM
  EMERGENCY_ROADSIDE
  GENERAL_MAINTENANCE
}
```

---

## 6. Real-Time Communication

### WebSocket Server (Socket.io)

```typescript
// backend/websocket/server.ts
import { createServer } from 'http';
import { Server } from 'socket.io';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

// Auth middleware
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  const user = await verifyToken(token);
  if (!user) return next(new Error('Auth failed'));
  socket.data.user = user;
  next();
});

io.on('connection', (socket) => {
  const user = socket.data.user;

  // Join rooms
  socket.join(`user:${user.id}`);
  socket.join(`role:${user.role.toLowerCase()}`);

  // Handle events
  socket.on('join-job', (jobId) => socket.join(`job:${jobId}`));
  socket.on('send-message', handleMessage);
  socket.on('update-location', handleLocationUpdate);
  socket.on('update-job-status', handleJobStatusUpdate);
});
```

### Event Types

| Event | Direction | Description |
|-------|-----------|-------------|
| `join-job` | Client → Server | Subscribe to job updates |
| `send-message` | Client → Server | Send chat message |
| `update-location` | Client → Server | Mechanic location update |
| `update-job-status` | Client → Server | Update job status |
| `new-message` | Server → Client | New chat message received |
| `mechanic-location` | Server → Client | Mechanic location update |
| `job-status-updated` | Server → Client | Job status changed |
| `quote-received` | Server → Client | New quote received |

---

## 7. Security Architecture

### Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   Backend   │────▶│  Database   │
└─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │
      │ 1. POST /login    │                   │
      │──────────────────▶│                   │
      │                   │ 2. Verify creds   │
      │                   │──────────────────▶│
      │                   │                   │
      │                   │ 3. Return user    │
      │                   │◀──────────────────│
      │                   │                   │
      │ 4. Generate JWT   │                   │
      │                   │                   │
      │ 5. Return token   │                   │
      │◀──────────────────│                   │
      │                   │                   │
      │ 6. Store in Zustand                   │
      │                   │                   │
      │ 7. Use in tRPC/WebSocket              │
      │   (Authorization header)              │
```

### JWT Implementation

```typescript
// Token generation
const token = jwt.sign(
  { userId: user.id, email: user.email, role: user.role },
  process.env.NEXTAUTH_SECRET,
  { expiresIn: '7d' }
);

// Token verification (tRPC context)
const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, process.env.NEXTAUTH_SECRET);
  } catch {
    return null;
  }
};
```

### Two-Factor Authentication (2FA)

```typescript
// 2FA with TOTP
import { authenticator } from 'otplib';

// Generate secret
const secret = authenticator.generateSecret();

// Generate QR code for setup
const otpauth = authenticator.keyuri(user.email, 'Heinicus', secret);

// Verify token
const isValid = authenticator.verify({ token, secret });
```

### Password Security

```typescript
import bcrypt from 'bcryptjs';

// Hash password (server-side only)
const hashedPassword = await bcrypt.hash(password, 12);

// Verify password
const isValid = await bcrypt.compare(password, hashedPassword);
```

---

## 8. External Integrations

### Stripe (Payments)

```typescript
// lib/stripe-config.ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

// Payment intent
const paymentIntent = await stripe.paymentIntents.create({
  amount: 5000, // $50.00 in cents
  currency: 'usd',
  customer: customerId,
  metadata: { jobId: job.id },
});
```

### Firebase (Storage & Push)

```typescript
// services/firebase-service.ts
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes } from 'firebase/storage';

// Upload job photos
const storageRef = ref(storage, `jobs/${jobId}/photos/${filename}`);
await uploadBytes(storageRef, file);

// Push notifications via FCM
await admin.messaging().send({
  token: deviceToken,
  notification: {
    title: 'Job Update',
    body: 'Your mechanic is on the way!',
  },
  data: { jobId, type: 'MECHANIC_EN_ROUTE' },
});
```

### Google Maps (Location)

```typescript
// hooks/useLocation.ts
import * as Location from 'expo-location';

// Get current position
const { coords } = await Location.getCurrentPositionAsync({
  accuracy: Location.Accuracy.High,
});

// Calculate distance
const distance = calculateDistance(
  mechanicLat, mechanicLng,
  customerLat, customerLng
);
```

### Twilio (SMS/2FA)

```typescript
// Backend SMS service
import twilio from 'twilio';

const client = twilio(accountSid, authToken);

// Send 2FA code
await client.messages.create({
  body: `Your Heinicus verification code: ${code}`,
  from: twilioPhoneNumber,
  to: userPhoneNumber,
});
```

### Abacus AI (Customer Support)

```typescript
// AI chat integration
const response = await fetch('https://api.abacus.ai/v1/chat', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.ABACUS_AI_API_KEY}`,
  },
  body: JSON.stringify({
    agentId: process.env.CUSTOMER_SUPPORT_AGENT_ID,
    message: userMessage,
    context: { userId, jobId },
  }),
});
```

---

## 9. Metro Configuration

### Critical: Node-Only Package Blocking

The `metro.config.js` uses a `blockList` to prevent Node-only packages from being bundled into the React Native app:

```javascript
// metro.config.js
const config = getDefaultConfig(__dirname);

// Block Node-only packages from mobile bundle
config.resolver.blockList = [
  // Native modules we don't need in RN
  /node_modules\/.*\/android\/.*/,
  /node_modules\/.*\/ios\/.*/,
  /node_modules\/.*\/gradle\/.*/,
  /node_modules\/.*\/kotlin\/.*/,
  /node_modules\/.*\/java\/.*/,
  
  // Server-side only packages
  /node_modules\/pg\/.*/,           // PostgreSQL driver
  /node_modules\/bcryptjs\/.*/,      // Password hashing
  /node_modules\/jsonwebtoken\/.*/,  // JWT (server-side)
  /node_modules\/nodemailer\/.*/,    // Email service
  /node_modules\/@prisma\/client\/.*/, // Prisma ORM
  /node_modules\/otplib\/.*/,        // 2FA/TOTP
];

// These packages run on the BACKEND ONLY
// The mobile app communicates via tRPC/WebSocket
```

### Why This Matters

| Package | Purpose | Runs On |
|---------|---------|---------|
| `pg` | PostgreSQL driver | Backend only |
| `bcryptjs` | Password hashing | Backend only |
| `jsonwebtoken` | JWT signing/verify | Backend only |
| `nodemailer` | SMTP email | Backend only |
| `prisma` | Database ORM | Backend only |
| `otplib` | 2FA/TOTP | Backend only |

**If Metro shows errors about these packages, it's working correctly!** They should NOT be in the mobile bundle.

---

## 10. Development Workflow

### Daily Development

```bash
# Terminal 1: Backend
npm run backend:watch

# Terminal 2: WebSocket
npm run websocket

# Terminal 3: Expo
npm run start
```

### Code Quality Checks

```bash
# Before committing
npm run lint
npm run type-check
npm run test:unit
```

### Database Changes

```bash
# 1. Update schema.prisma
# 2. Create migration
npx prisma migrate dev --name add_feature

# 3. Regenerate client
npx prisma generate

# 4. Update types in frontend
```

### Adding New tRPC Routes

```typescript
// 1. Create route file
// backend/trpc/routes/feature/route.ts
import { router, protectedProcedure } from '../../trpc';

export const featureRouter = router({
  getAll: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.prisma.feature.findMany();
    }),
  
  create: protectedProcedure
    .input(createSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.feature.create({ data: input });
    }),
});

// 2. Add to app router
// backend/trpc/app-router.ts
import { featureRouter } from './routes/feature/route';

export const appRouter = router({
  // ...existing routers
  feature: featureRouter,
});
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  React Native │  │   Zustand   │  │    React Query          │ │
│  │   (Expo 53)   │  │   Stores    │  │   (TanStack)            │ │
│  └──────┬────────┘  └─────────────┘  └─────────────────────────┘ │
│         │                                                        │
│         │ tRPC / WebSocket                                       │
│         ▼                                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API LAYER (Hono)                          │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  tRPC Router                                                ││
│  │  ├── auth (login, register, 2FA)                           ││
│  │  ├── job (CRUD, status updates)                            ││
│  │  ├── mechanic (availability, verification)                   ││
│  │  ├── payment (Stripe integration)                          ││
│  │  ├── quote (create, accept, reject)                        ││
│  │  └── ...                                                    ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  WebSocket Server (Socket.io)                              ││
│  │  ├── Chat messages                                         ││
│  │  ├── Location tracking                                    ││
│  │  └── Real-time job updates                                 ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER (Prisma)                         │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  PostgreSQL 14+                                            ││
│  │  ├── Users (Customer, Mechanic, Admin)                     ││
│  │  ├── Jobs, Quotes, Payments                                ││
│  │  ├── Reviews, Notifications                                ││
│  │  └── Chat, Timeline, Vehicles                              ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │  Stripe  │ │ Firebase │ │  Google  │ │  Twilio  │           │
│  │ Payments │ │ Storage  │ │   Maps   │ │  SMS/2FA │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Support

- **Quick Start**: [QUICK_START.md](./QUICK_START.md)
- **Build Guide**: [BUILD_AND_RUN.md](./BUILD_AND_RUN.md)
- **Module Details**: [MODULES_AND_PACKAGES.md](./MODULES_AND_PACKAGES.md)

---

**Architecture documented!** 🏗️
