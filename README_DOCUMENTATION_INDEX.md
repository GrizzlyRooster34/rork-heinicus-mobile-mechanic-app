# Heinicus Mobile Mechanic - Documentation Index

Navigation guide for the complete documentation suite.

---

## 📚 Documentation Files

### 🚀 **PRIORITY 1: QUICK_START.md** — START HERE
**Purpose:** Get the app running in 5 minutes  
**Read Time:** 10 minutes  
**Contains:**
- Prerequisites (Node.js, npm, PostgreSQL)
- Installation: `npm install` at root level
- Environment setup: `cp .env.example .env`
- Database setup: `npx prisma migrate deploy && npx prisma db seed`
- Development workflow: 3 terminals
- Test credentials for all roles
- Common commands
- Quick troubleshooting

**→ Read this first if you're new to the project.**

---

### 🔨 **PRIORITY 2: BUILD_AND_RUN.md** — BUILD GUIDE
**Purpose:** Complete build, test, and deployment guide  
**Read Time:** 15 minutes  
**Contains:**
- Step-by-step development setup
- Running locally (3 terminals)
- Testing with Jest + ts-jest
- EAS build commands:
  - Android: dev, preview, production, standalone
  - iOS: build, submit
  - Web: build, deploy
- Local Gradle builds
- Version management
- Database management
- Troubleshooting guide
- Security checklist

**→ Read this when you're ready to build or deploy.**

---

### 🏗️ **REFERENCE: ARCHITECTURE_SUMMARY.md** — SYSTEM DESIGN
**Purpose:** Complete system architecture  
**Read Time:** 20 minutes  
**Contains:**
- System overview
- Project structure (root level)
- Frontend architecture (Expo Router, Zustand, tRPC)
- Backend architecture (Hono, tRPC, Prisma)
- Database schema (20+ models)
- Real-time communication (Socket.io)
- Security architecture (JWT, 2FA)
- External integrations (Stripe, Firebase, Twilio)
- **Metro blockList documentation** (critical!)
- Development workflow

**→ Read this to understand how the system works.**

---

### 📦 **REFERENCE: MODULES_AND_PACKAGES.md** — CODE STRUCTURE
**Purpose:** Module breakdown and package dependencies  
**Read Time:** 15 minutes  
**Contains:**
- Frontend modules (app, components, hooks, stores, lib)
- Backend modules (hono, tRPC routes, WebSocket)
- Database models
- Package dependencies (all 50+ packages)
- Service dependencies (Stripe, Firebase, etc.)
- Module interaction diagrams
- Package installation guide

**→ Read this to understand the codebase structure.**

---

### 📖 **REFERENCE: IMPORT_SUMMARY.md** — PROJECT OVERVIEW
**Purpose:** Quick project overview  
**Read Time:** 5 minutes  
**Contains:**
- Platform detection
- Tech stack summary
- Project structure at a glance
- Quick commands
- Key features
- Environment variables
- Database models overview

**→ Read this for a quick overview of the project.**

---

## 🎓 Learning Paths

### Beginner Path (New to Project)

1. **[QUICK_START.md](./QUICK_START.md)** (10 min)
   - Get the app running locally
   - Understand basic setup

2. **[IMPORT_SUMMARY.md](./IMPORT_SUMMARY.md)** (5 min)
   - Understand what the project is
   - See tech stack and features

3. **Explore the code:**
   - `app/` — See the UI screens
   - `backend/trpc/routes/` — See the API
   - `components/` — See reusable components

### Intermediate Path (Want to Contribute)

1. **[QUICK_START.md](./QUICK_START.md)** (10 min)
   - Set up development environment

2. **[ARCHITECTURE_SUMMARY.md](./ARCHITECTURE_SUMMARY.md)** (20 min)
   - Understand system design
   - Learn about tRPC, Prisma, WebSocket

3. **[MODULES_AND_PACKAGES.md](./MODULES_AND_PACKAGES.md)** (15 min)
   - Understand module structure
   - Learn about dependencies

4. **Read source code:**
   - `stores/` — State management patterns
   - `hooks/` — Custom hook patterns
   - `backend/trpc/` — API route patterns

### Advanced Path (Want to Deploy)

1. **[QUICK_START.md](./QUICK_START.md)** (10 min)
   - Verify local setup works

2. **[BUILD_AND_RUN.md](./BUILD_AND_RUN.md)** (15 min)
   - Learn build commands
   - Understand EAS profiles

3. **[ARCHITECTURE_SUMMARY.md](./ARCHITECTURE_SUMMARY.md)** → Security section
   - Review security checklist
   - Configure production environment

4. **Follow platform-specific steps:**
   - Android: EAS build or Gradle
   - iOS: EAS build + App Store
   - Web: Static export + hosting

---

## 🗂️ Document Organization

```
Documentation Structure:
│
├── 🚀 QUICK_START.md              # Priority 1: Setup (10 min)
├── 🔨 BUILD_AND_RUN.md            # Priority 2: Build (15 min)
│
├── 🏗️ ARCHITECTURE_SUMMARY.md     # Reference: Architecture (20 min)
├── 📦 MODULES_AND_PACKAGES.md     # Reference: Code structure (15 min)
├── 📖 IMPORT_SUMMARY.md           # Reference: Overview (5 min)
│
└── 📚 README_DOCUMENTATION_INDEX.md  # This file (5 min)
```

---

## 🔍 Find Information By Topic

### Setup & Installation
→ [QUICK_START.md](./QUICK_START.md)

### Building & Deploying
→ [BUILD_AND_RUN.md](./BUILD_AND_RUN.md)

### Architecture & Design
→ [ARCHITECTURE_SUMMARY.md](./ARCHITECTURE_SUMMARY.md)

### Database Schema
→ [ARCHITECTURE_SUMMARY.md](./ARCHITECTURE_SUMMARY.md) → Database Schema section

### API Routes (tRPC)
→ [ARCHITECTURE_SUMMARY.md](./ARCHITECTURE_SUMMARY.md) → Backend Architecture
→ [MODULES_AND_PACKAGES.md](./MODULES_AND_PACKAGES.md) → tRPC Routes

### State Management
→ [ARCHITECTURE_SUMMARY.md](./ARCHITECTURE_SUMMARY.md) → Frontend Architecture
→ [MODULES_AND_PACKAGES.md](./MODULES_AND_PACKAGES.md) → Stores

### Package Dependencies
→ [MODULES_AND_PACKAGES.md](./MODULES_AND_PACKAGES.md) → Package Dependencies

### Testing
→ [BUILD_AND_RUN.md](./BUILD_AND_RUN.md) → Testing section

### Troubleshooting
→ [QUICK_START.md](./QUICK_START.md) → Troubleshooting
→ [BUILD_AND_RUN.md](./BUILD_AND_RUN.md) → Troubleshooting

### Security
→ [BUILD_AND_RUN.md](./BUILD_AND_RUN.md) → Security Checklist
→ [ARCHITECTURE_SUMMARY.md](./ARCHITECTURE_SUMMARY.md) → Security Architecture

### Metro BlockList
→ [ARCHITECTURE_SUMMARY.md](./ARCHITECTURE_SUMMARY.md) → Metro Configuration

---

## 🚀 Quick Commands Reference

### Development

```bash
# Setup
npm install
cp .env.example .env
npx prisma migrate deploy
npx prisma db seed

# Dev (3 terminals)
npm run backend:watch    # API server
npm run websocket        # WebSocket server
npm run start            # Expo dev server
```

### Testing

```bash
npm run test             # All tests
npm run test:unit        # Unit tests
npm run test:coverage    # With coverage
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

### Database

```bash
npx prisma migrate dev     # Create migration
npx prisma migrate deploy  # Apply migrations
npx prisma db seed         # Seed data
npx prisma studio          # Open GUI
```

---

## 📊 Documentation Statistics

| Document | Size | Lines | Read Time | Priority |
|----------|------|-------|-----------|----------|
| QUICK_START.md | 8 KB | ~400 | 10 min | ⭐⭐⭐ |
| BUILD_AND_RUN.md | 13 KB | ~750 | 15 min | ⭐⭐⭐ |
| ARCHITECTURE_SUMMARY.md | 24 KB | ~850 | 20 min | ⭐⭐ |
| MODULES_AND_PACKAGES.md | 16 KB | ~600 | 15 min | ⭐⭐ |
| IMPORT_SUMMARY.md | 11 KB | ~400 | 5 min | ⭐ |
| README_DOCUMENTATION_INDEX.md | 12 KB | ~450 | 5 min | ⭐ |

**Total:** 82 KB, ~3,400 lines

---

## 🎯 Next Steps

### For New Developers

1. Read [QUICK_START.md](./QUICK_START.md)
2. Set up your development environment
3. Run the app locally
4. Explore the codebase

### For Builders

1. Read [BUILD_AND_RUN.md](./BUILD_AND_RUN.md)
2. Choose your platform (Android/iOS/Web)
3. Run the appropriate build command
4. Deploy to app stores

### For Contributors

1. Read [ARCHITECTURE_SUMMARY.md](./ARCHITECTURE_SUMMARY.md)
2. Read [MODULES_AND_PACKAGES.md](./MODULES_AND_PACKAGES.md)
3. Understand the coding patterns
4. Make your contribution

---

## 🔗 External Resources

- **GitHub Repository**: https://github.com/GrizzlyRooster34/rork-heinicus-mobile-mechanic-app
- **Expo Project**: https://expo.dev/@heinicus1/heinicus-mobile-mechanic-app
- **EAS Dashboard**: https://expo.dev/accounts/heinicus1/projects/heinicus-mobile-mechanic-app

---

## 💡 Tips

1. **Start with QUICK_START.md** — It has everything you need to get running
2. **Use the search** — Each doc has a table of contents
3. **Follow learning paths** — They're designed for your experience level
4. **Check troubleshooting** — Common issues are documented
5. **Read architecture before major changes** — Understand the system first

---

**Happy coding!** 🚀

→ Start with [QUICK_START.md](./QUICK_START.md)
