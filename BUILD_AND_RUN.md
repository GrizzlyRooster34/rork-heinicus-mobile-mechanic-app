# Heinicus Mobile Mechanic - Build & Run Guide

Complete guide for building, testing, and deploying the Heinicus Mobile Mechanic application.

---

## Table of Contents

1. [Development Setup](#1-development-setup)
2. [Running Locally](#2-running-locally)
3. [Testing](#3-testing)
4. [Building for Production](#4-building-for-production)
5. [EAS Build Commands](#5-eas-build-commands)
6. [Local Gradle Builds](#6-local-gradle-builds)
7. [Version Management](#7-version-management)
8. [Database Management](#8-database-management)
9. [Troubleshooting](#9-troubleshooting)
10. [Security Checklist](#10-security-checklist)

---

## 1. Development Setup

### Prerequisites

- Node.js >= 16.0.0
- npm >= 8.0.0
- PostgreSQL 14+
- Android Studio (for Android builds)
- Xcode (for iOS builds, macOS only)
- EAS CLI: `npm install -g eas-cli`

### Step-by-Step Setup

```bash
# 1. Clone repository
git clone https://github.com/GrizzlyRooster34/rork-heinicus-mobile-mechanic-app.git
cd rork-heinicus-mobile-mechanic-app

# 2. Install dependencies (at ROOT level)
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your database, Stripe, Firebase, etc.

# 4. Setup database
npx prisma migrate deploy
npx prisma db seed

# 5. Verify setup
npm run type-check
npm run lint
```

---

## 2. Running Locally

### Development Mode (3 Terminals)

**Terminal 1 - Backend API:**
```bash
npm run backend:watch
```
- Hono + tRPC server
- Runs on: `http://localhost:3000`
- Auto-restarts on file changes

**Terminal 2 - WebSocket Server:**
```bash
npm run websocket
```
- Socket.io real-time server
- Runs on: `ws://localhost:3001`
- Handles live chat, location tracking, job updates

**Terminal 3 - Expo Dev Server:**
```bash
npm run start
```
- Metro bundler
- Default: `http://localhost:8081`
- Press `w` for web, `i` for iOS, `a` for Android

### Platform-Specific Commands

```bash
# Web only
npm run start-web

# Android emulator
npm run android

# iOS simulator (macOS only)
npm run ios

# With tunnel (for physical devices)
npm run start-tunnel
```

---

## 3. Testing

### Test Structure

Tests use **Jest + ts-jest** (NOT jest-expo, which is incompatible with Expo 53):

```
__tests__/
├── unit/                  # Unit tests
│   ├── auth.test.ts
│   ├── jobs.test.ts
│   └── payments.test.ts
├── integration/            # Integration tests
│   ├── api.test.ts
│   └── websocket.test.ts
└── e2e/                    # End-to-end tests
    └── mobile-flows.test.ts
```

### Running Tests

```bash
# Run all tests
npm run test

# Run with watch mode
npm run test:watch

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run with coverage
npm run test:coverage

# CI mode (no watch, exit on completion)
npm run test:ci

# Debug tests
npm run test:debug
```

### Coverage Thresholds

```javascript
// jest.config.js
coverageThreshold: {
  global: {
    branches: 70,
    functions: 70,
    lines: 70,
    statements: 70
  }
}
```

---

## 4. Building for Production

### Build Environments

| Environment | Use Case | API Endpoint |
|-------------|----------|--------------|
| **Development** | Local development | `http://localhost:3000` |
| **Preview** | Testing, QA | Staging API |
| **Production** | App Store / Play Store | Production API |

### Pre-build Checklist

```bash
# 1. Run all checks
npm run lint
npm run type-check
npm run test:ci

# 2. Update version
npm run bump:patch  # or :minor, :major

# 3. Verify app.json
# - version matches package.json
# - android.versionCode incremented
# - ios.buildNumber updated

# 4. Commit changes
git add .
git commit -m "chore: bump version for release"
```

---

## 5. EAS Build Commands

### Android Builds

```bash
# Development build (for testing)
npm run build:dev
# or: eas build -p android --profile development

# Preview build (for QA)
npm run build:preview
# or: eas build -p android --profile preview

# Production build (for Play Store)
npm run build:prod
# or: eas build -p android --profile production

# Standalone APK (no Play Store)
npm run build:standalone
# or: eas build -p android --profile standalone

# Local build (uses your machine)
npm run build:local
# or: eas build -p android --profile development --local

# Quick build (clears cache)
npm run build:quick
```

### iOS Builds

```bash
# Build for App Store
eas build -p ios --profile production

# Build for TestFlight
eas build -p ios --profile preview

# Local build (macOS + Xcode required)
eas build -p ios --local
```

### Web Build

```bash
# Build web bundle
npm run build-web
# or: expo build:web

# Export static files
npm run export
# or: expo export
```

### Submit to Stores

```bash
# Submit Android to Play Store
eas submit -p android

# Submit iOS to App Store
eas submit -p ios
```

### Build Profiles (eas.json)

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {
      "autoIncrement": true
    },
    "standalone": {
      "android": { "buildType": "apk" }
    }
  }
}
```

---

## 6. Local Gradle Builds

For Android builds without EAS cloud:

### Prerequisites

- Android Studio installed
- Android SDK configured
- `ANDROID_HOME` environment variable set

### Build Steps

```bash
# 1. Prebuild (generate native code)
npx expo prebuild --platform android

# 2. Open in Android Studio
# - Open the `android/` directory
# - Let Gradle sync

# 3. Build APK from command line
cd android
./gradlew assembleRelease

# 4. Find APK
# Output: android/app/build/outputs/apk/release/app-release.apk
```

### Alternative: Build Scripts

```bash
# Using provided scripts
./build-apk-manual.sh
./build-apk-termux.sh      # For Termux on Android
./create-basic-apk.sh
```

---

## 7. Version Management

### Version Bump Commands

```bash
# Patch (1.0.0 → 1.0.1) - bug fixes
npm run bump:patch

# Minor (1.0.0 → 1.1.0) - new features
npm run bump:minor

# Major (1.0.0 → 2.0.0) - breaking changes
npm run bump:major

# Build number only
npm run bump:build
```

### What Gets Updated

- `package.json` - version field
- `app.json` - version and android.versionCode
- `build-info.json` - build metadata

### Manual Version Update

```bash
# Edit package.json
"version": "1.2.3"

# Edit app.json
{
  "version": "1.2.3",
  "android": {
    "versionCode": 10
  },
  "ios": {
    "buildNumber": "1.2.3.10"
  }
}
```

---

## 8. Database Management

### Migrations

```bash
# Create new migration
npx prisma migrate dev --name add_user_preferences

# Apply migrations
npx prisma migrate deploy

# Reset database (WARNING: deletes data)
npx prisma migrate reset

# View migration status
npx prisma migrate status
```

### Seeding

```bash
# Seed database
npx prisma db seed

# Seed with specific environment
NODE_ENV=development npx prisma db seed
```

### Prisma Studio

```bash
# Open database GUI
npx prisma studio
# Runs on: http://localhost:5555
```

### Database Backup/Restore

```bash
# Backup
pg_dump mobile_mechanic_db > backup.sql

# Restore
psql mobile_mechanic_db < backup.sql
```

---

## 9. Troubleshooting

### Metro Bundler Issues

```bash
# Clear all caches
npx expo start --clear

# Or manually:
rm -rf node_modules/.cache
rm -rf .expo
npm run start
```

### Backend Won't Start

```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill process on port 3000
npx kill-port 3000

# Check environment variables
cat .env | grep DATABASE_URL
```

### WebSocket Connection Failed

```bash
# Check if port 3001 is in use
lsof -i :3001

# Verify WEBSOCKET_SECRET in .env
echo $WEBSOCKET_SECRET
```

### Database Connection Issues

```bash
# Test PostgreSQL connection
pg_isready -h localhost -p 5432

# Check Prisma client generation
npx prisma generate

# Verify connection string
npx prisma db pull
```

### Build Failures

```bash
# Clean build artifacts
rm -rf android/build
rm -rf ios/build
rm -rf .expo

# Reinstall dependencies
rm -rf node_modules
npm install

# Prebuild clean
npx expo prebuild --clean
```

### TypeScript Errors

```bash
# Regenerate Prisma client
npx prisma generate

# Run type check
npm run type-check

# Check for missing types
npm install --save-dev @types/node @types/react
```

### Node-Only Packages in Bundle

If Metro shows errors about `pg`, `bcryptjs`, `jsonwebtoken`, `prisma`, `nodemailer`:

**This is expected!** These packages are:
- **Blocked** by `metro.config.js` `blockList`
- **Server-side only** - they run in the backend, NOT in React Native
- **Intentionally excluded** from the mobile bundle

The backend API handles all database/auth operations. The mobile app communicates via tRPC/WebSocket.

---

## 10. Security Checklist

Before production deployment:

- [ ] **Environment Variables**
  - [ ] All secrets in `.env` (not committed)
  - [ ] `NEXTAUTH_SECRET` is strong (32+ chars)
  - [ ] `WEBSOCKET_SECRET` is unique
  - [ ] Stripe keys are production (not test)

- [ ] **Database**
  - [ ] Using production database (not local)
  - [ ] SSL enabled for connections
  - [ ] Backups configured

- [ ] **Authentication**
  - [ ] JWT tokens have expiry
  - [ ] 2FA enabled for admin accounts
  - [ ] Password policy enforced

- [ ] **API Security**
  - [ ] CORS configured for production domain
  - [ ] Rate limiting enabled
  - [ ] Input validation on all endpoints

- [ ] **Mobile App**
  - [ ] Certificate pinning configured
  - [ ] ProGuard/R8 enabled (Android)
  - [ ] App thinning enabled (iOS)

- [ ] **Payments**
  - [ ] Stripe webhook secrets configured
  - [ ] PCI compliance verified
  - [ ] Test mode disabled

- [ ] **Build**
  - [ ] No debug code in bundle
  - [ ] Source maps disabled
  - [ ] Minification enabled

---

## Quick Reference

### All npm Scripts

```bash
# Development
npm run start              # Expo dev server
npm run start-web          # Web only
npm run start-tunnel       # With ngrok tunnel
npm run android            # Android emulator
npm run ios                # iOS simulator

# Backend
npm run backend:watch      # Hono API (dev)
npm run websocket          # WebSocket server

# Testing
npm run test               # All tests
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage
npm run test:ci            # CI mode

# Code Quality
npm run lint               # ESLint
npm run lint:fix           # Fix issues
npm run type-check         # TypeScript

# Building
npm run build:dev          # EAS development
npm run build:preview      # EAS preview
npm run build:prod         # EAS production
npm run build:standalone   # EAS standalone APK
npm run build-web          # Web bundle

# Version
npm run bump:patch         # Patch version
npm run bump:minor         # Minor version
npm run bump:major         # Major version
```

---

## Support

- **Build Issues**: Check [Troubleshooting](#9-troubleshooting)
- **Architecture**: See [ARCHITECTURE_SUMMARY.md](./ARCHITECTURE_SUMMARY.md)
- **Quick Start**: See [QUICK_START.md](./QUICK_START.md)

---

**Ready to build!** 🔨
