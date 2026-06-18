# Heinicus Mobile Mechanic - Quick Start Guide

## 🚀 5-Minute Setup

### Prerequisites
- Node.js 16+ or Bun 1.0+
- PostgreSQL 14+
- Git

### Step 1: Clone & Install
```bash
cd /workspace
git clone https://github.com/GrizzlyRooster34/rork-heinicus-mobile-mechanic-app.git
cd rork-heinicus-mobile-mechanic-app/expo
bun install
```

### Step 2: Setup Database
```bash
# Create database
createdb heinicus_db

# Copy environment file
cp .env.example .env

# Edit .env with your database URL:
# DATABASE_URL="postgresql://username:password@localhost:5432/heinicus_db"

# Run migrations
bunx prisma migrate deploy

# Seed sample data
bunx prisma db seed
```

### Step 3: Start Development
```bash
# Terminal 1: Backend API
npm run backend:watch

# Terminal 2: WebSocket Server (new terminal)
npm run websocket

# Terminal 3: Mobile App (new terminal)
npm run start
```

**App is ready at:** `http://localhost:19006` (web) or Expo Go app (mobile)

---

## 📱 Platform-Specific Commands

### Android Development
```bash
npm run android              # Start on Android emulator
npm run build:android:dev    # Build development APK
npm run build:android:preview # Build preview APK
npm run build:android:production # Build production APK
npm run install:android      # Install APK on device
```

### iOS Development
```bash
npm run ios                  # Start on iOS simulator
npm run build:ios            # Build iOS app
```

### Web Development
```bash
npm run web                  # Start web version
npm run build-web            # Build web bundle
npm run start-web            # Start web with tunnel
npm run start-web-dev        # Start web with debug logs
```

---

## 🔑 Test Credentials (After Seeding)

### Admin Users
- Email: `matthew.heinen.2014@gmail.com`
- Password: `RoosTer669072!@`

### Customer User
- Email: `customer1@example.com`
- Password: `TestPassword123!`

### Mechanic User
- Email: `mechanic1@heinicus.com`
- Password: `TestPassword123!`

---

## 🧪 Testing & Validation

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix
```

---

## 🏗️ Build & Deployment

### Local Android Build (Gradle)
```bash
# Prebuild native modules
npm run prebuild:android

# Build APK
npm run build:android

# Install on connected device
npm run install:android
```

### EAS Cloud Build
```bash
# Development build
npm run build:dev

# Preview build
npm run build:preview

# Production build
npm run build:prod

# Standalone APK
npm run build:apk

# Quick build (clears cache)
npm run build:quick
```

### Version Management
```bash
# Bump patch version (1.0.0 → 1.0.1)
npm run bump:patch

# Bump minor version (1.0.0 → 1.1.0)
npm run bump:minor

# Bump major version (1.0.0 → 2.0.0)
npm run bump:major

# Bump build number
npm run bump:build
```

---

## 🗄️ Database Commands

```bash
# Open Prisma Studio (GUI)
bunx prisma studio

# Run migrations
bunx prisma migrate deploy

# Create new migration
bunx prisma migrate dev --name <migration_name>

# Reset database (WARNING: deletes all data)
bunx prisma migrate reset

# Generate Prisma Client
bunx prisma generate

# Seed database
bunx prisma db seed
```

---

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
fuser -k 3000/tcp

# Kill process on port 3001
fuser -k 3001/tcp

# Kill process on port 19006
fuser -k 19006/tcp
```

### Database Connection Error
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Test connection
psql -h localhost -U heinicus_user -d heinicus_db
```

### Module Not Found
```bash
# Clear node_modules and reinstall
rm -rf node_modules
bun install

# Clear Expo cache
npx expo start -c
```

### Build Failures
```bash
# Clear all caches
rm -rf node_modules .expo dist build

# Reinstall and rebuild
bun install
npm run type-check
npm run lint
```

---

## 📊 Project Structure

```
expo/
├── app/              # Expo Router pages (file-based routing)
├── backend/          # Node.js API server
├── components/       # Reusable React components
├── hooks/            # Custom React hooks
├── stores/           # Zustand state management
├── services/         # Business logic
├── lib/              # Utility libraries
├── utils/            # Helper functions
├── types/            # TypeScript definitions
├── prisma/           # Database schema
├── __tests__/        # Test files
├── assets/           # Images, sounds, icons
├── scripts/          # Build scripts
├── package.json      # Dependencies
├── tsconfig.json     # TypeScript config
├── babel.config.js   # Babel config
├── eas.json          # EAS build config
└── .env.example      # Environment template
```

---

## 🌐 API Endpoints

### Base URLs
- **Development:** `http://localhost:3000/api`
- **Production:** `https://api.heinicus.app`

### tRPC Endpoints
- **HTTP:** `/api/trpc`
- **WebSocket:** `ws://localhost:3001`

### Example Requests
```bash
# Get user profile
curl http://localhost:3000/api/trpc/users.getProfile

# Create job
curl -X POST http://localhost:3000/api/trpc/jobs.createJob \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{"customerId":"...","serviceType":"oil-change"}'
```

---

## 📦 Environment Variables

### Required
```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/heinicus_db
JWT_SECRET=<64-character-random-string>
NODE_ENV=development
API_PORT=3000
WEBSOCKET_PORT=3001
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

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

---

## 🎯 Common Workflows

### Add New Feature
1. Create route in `app/` directory
2. Create components in `components/`
3. Add tRPC procedure in `backend/trpc/routes/`
4. Add database model in `prisma/schema.prisma`
5. Run `bunx prisma migrate dev`
6. Test with `npm run test`

### Fix Bug
1. Identify issue in code
2. Write test case
3. Fix the bug
4. Run `npm run test` to verify
5. Commit with `git commit -m "fix: description"`

### Deploy to Production
1. Update version: `npm run bump:minor`
2. Run tests: `npm run test:ci`
3. Build: `npm run build:prod`
4. Submit: `npm run submit:android`

---

## 📚 Documentation

- **Full Architecture:** `ARCHITECTURE_SUMMARY.md`
- **Setup Guide:** `SETUP.md`
- **APK Build Guide:** `README_APK_BUILDS.md`
- **Prisma Docs:** https://www.prisma.io/docs
- **tRPC Docs:** https://trpc.io/docs
- **Expo Docs:** https://docs.expo.dev

---

## 🔗 Useful Links

| Resource | URL |
|----------|-----|
| GitHub Repo | https://github.com/GrizzlyRooster34/rork-heinicus-mobile-mechanic-app |
| Expo Project | https://expo.dev/@heinicus1/heinicus-mobile-mechanic-app |
| EAS Dashboard | https://expo.dev/accounts/heinicus1/projects/heinicus-mobile-mechanic-app |
| Prisma Studio | `bunx prisma studio` |
| API Docs | `http://localhost:3000/api` |

---

## ⚡ Performance Tips

- Use `npm run test:watch` during development
- Use `npm run lint:fix` to auto-fix linting issues
- Use `bunx prisma studio` to inspect database
- Use `npm run type-check` before committing
- Use `npm run build:quick` for fast local builds

---

## 🆘 Getting Help

1. Check `SETUP.md` for detailed setup instructions
2. Check `ARCHITECTURE_SUMMARY.md` for architecture details
3. Review error logs in console
4. Check database logs: `tail -f /var/log/postgresql/postgresql-*.log`
5. Create GitHub issue with error details

---

**Version:** 1.1.0  
**Last Updated:** March 29, 2025  
**Maintained By:** Rork Development Team
