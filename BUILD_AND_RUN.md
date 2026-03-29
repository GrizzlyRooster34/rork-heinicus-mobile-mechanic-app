# Heinicus Mobile Mechanic - Build & Run Instructions

## 🚀 Development Environment Setup

### Prerequisites
- **Node.js:** 16.0.0 or higher
- **Bun:** 1.0.0 or higher (recommended) OR npm 8.0.0+
- **PostgreSQL:** 14.0 or higher
- **Git:** Latest version
- **Android Studio:** (for Android development)
- **Xcode:** (for iOS development on macOS)

### Verify Installation
```bash
node --version      # Should be v16+
bun --version       # Should be v1.0+
psql --version      # Should be 14+
git --version       # Latest
```

---

## 📥 Installation Steps

### 1. Clone Repository
```bash
cd /workspace
git clone https://github.com/GrizzlyRooster34/rork-heinicus-mobile-mechanic-app.git
cd rork-heinicus-mobile-mechanic-app
```

### 2. Install Dependencies
```bash
cd expo
bun install
# OR if using npm:
# npm install --legacy-peer-deps
```

### 3. Setup Environment Variables
```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your configuration
nano .env  # or use your preferred editor
```

**Minimum required variables:**
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/heinicus_db
JWT_SECRET=your-64-character-random-string
NODE_ENV=development
API_PORT=3000
WEBSOCKET_PORT=3001
```

### 4. Setup PostgreSQL Database
```bash
# Create database user
sudo -u postgres psql <<EOF
CREATE USER heinicus_user WITH PASSWORD 'your_secure_password';
CREATE DATABASE heinicus_db OWNER heinicus_user;
GRANT ALL PRIVILEGES ON DATABASE heinicus_db TO heinicus_user;
ALTER USER heinicus_user CREATEDB;
\q
EOF

# Update DATABASE_URL in .env
DATABASE_URL="postgresql://heinicus_user:your_secure_password@localhost:5432/heinicus_db"
```

### 5. Run Database Migrations
```bash
# Apply migrations
bunx prisma migrate deploy

# Generate Prisma Client
bunx prisma generate

# Seed sample data
bunx prisma db seed
```

---

## 🏃 Running the Application

### Development Mode (All Platforms)

**Terminal 1: Backend API Server**
```bash
cd expo
npm run backend:watch
# Listens on http://localhost:3000
```

**Terminal 2: WebSocket Server**
```bash
cd expo
npm run websocket
# Listens on ws://localhost:3001
```

**Terminal 3: Mobile App**
```bash
cd expo
npm run start
# Opens Expo dev menu
# Press 'w' for web
# Press 'a' for Android
# Press 'i' for iOS
```

### Web Development
```bash
npm run start-web
# Opens http://localhost:19006 in browser
```

### Android Development
```bash
# Start on Android emulator
npm run android

# OR start with Expo Go app
npm run start
# Then scan QR code with Expo Go
```

### iOS Development (macOS only)
```bash
npm run ios
# Opens iOS simulator
```

---

## 🏗️ Building for Production

### Android Build (EAS Cloud)

#### Development Build
```bash
npm run build:android:dev
# Creates debug APK
# Distribution: Internal
# Channel: development
```

#### Preview Build
```bash
npm run build:android:preview
# Creates release APK for testing
# Distribution: Internal
# Channel: preview
```

#### Production Build
```bash
npm run build:android:production
# Creates production APK
# Distribution: Store
# Channel: production
```

#### Standalone APK (Local)
```bash
npm run build:android:apk
# Builds APK locally using Gradle
# Requires Android SDK
```

### Android Build (Local Gradle)

#### Prerequisites
```bash
# Install Android SDK
# Set ANDROID_HOME environment variable
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

#### Build Steps
```bash
# Prebuild native modules
npm run prebuild:android

# Build APK
npm run build:android

# Install on connected device
npm run install:android
```

### iOS Build (EAS Cloud)
```bash
npm run build:ios
# Creates iOS app for App Store
# Requires Apple Developer account
```

### Web Build
```bash
npm run build-web
# Creates static web bundle
# Output: dist/
```

---

## 📦 Version Management

### Bump Version
```bash
# Patch version (1.0.0 → 1.0.1)
npm run bump:patch

# Minor version (1.0.0 → 1.1.0)
npm run bump:minor

# Major version (1.0.0 → 2.0.0)
npm run bump:major

# Build number (for internal builds)
npm run bump:build
```

### Automated Build with Version Bump
```bash
# Development build with build number bump
npm run build:dev

# Preview build with patch version bump
npm run build:preview

# Production build with minor version bump
npm run build:prod

# Standalone APK with build number bump
npm run build:apk
```

---

## 🧪 Testing

### Run All Tests
```bash
npm run test
# Runs Jest test suite
```

### Watch Mode
```bash
npm run test:watch
# Re-runs tests on file changes
```

### Coverage Report
```bash
npm run test:coverage
# Generates coverage report
# Output: coverage/
```

### Specific Test Suites
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# E2E tests only
npm run test:e2e

# AI-related tests
npm run test:ai
```

### CI Mode (No Watch)
```bash
npm run test:ci
# Runs once with coverage
# Used in CI/CD pipelines
```

### Debug Tests
```bash
npm run test:debug
# Runs with Node debugger
# Connect with chrome://inspect
```

---

## 🔍 Code Quality

### Type Checking
```bash
npm run type-check
# Runs TypeScript compiler
# No emit, just type checking
```

### Linting
```bash
# Check for linting issues
npm run lint

# Auto-fix linting issues
npm run lint:fix
```

### Full Quality Check
```bash
npm run type-check && npm run lint && npm run test:ci
# Runs all quality checks
```

---

## 🗄️ Database Management

### Prisma Studio (GUI)
```bash
bunx prisma studio
# Opens http://localhost:5555
# Visual database editor
```

### Database Migrations

#### View Migration Status
```bash
bunx prisma migrate status
```

#### Create New Migration
```bash
bunx prisma migrate dev --name <migration_name>
# Example: bunx prisma migrate dev --name add_user_phone
```

#### Apply Migrations
```bash
bunx prisma migrate deploy
# Applies pending migrations
```

#### Reset Database (WARNING: Deletes All Data)
```bash
bunx prisma migrate reset
# Resets database to initial state
# Runs all migrations from scratch
# Seeds database
```

### Database Seeding
```bash
bunx prisma db seed
# Runs seed.ts script
# Populates with sample data
```

### Generate Prisma Client
```bash
bunx prisma generate
# Regenerates Prisma Client
# Run after schema changes
```

---

## 🔧 Troubleshooting

### Port Already in Use

#### Kill Process on Port
```bash
# Port 3000 (API)
fuser -k 3000/tcp

# Port 3001 (WebSocket)
fuser -k 3001/tcp

# Port 19006 (Web)
fuser -k 19006/tcp

# Port 5555 (Prisma Studio)
fuser -k 5555/tcp
```

#### Find Process Using Port
```bash
lsof -i :3000
# Shows process using port 3000
```

### Database Connection Issues

#### Check PostgreSQL Status
```bash
# Linux
sudo systemctl status postgresql

# macOS
brew services list | grep postgresql

# Windows
# Check Services app
```

#### Start PostgreSQL
```bash
# Linux
sudo systemctl start postgresql

# macOS
brew services start postgresql@16

# Windows
# Start from Services app
```

#### Test Connection
```bash
psql -h localhost -U heinicus_user -d heinicus_db
# Should connect successfully
```

### Module Not Found Errors

#### Clear Cache and Reinstall
```bash
# Remove node_modules
rm -rf node_modules

# Clear Bun cache
bun cache clean

# Reinstall
bun install
```

#### Clear Expo Cache
```bash
npx expo start -c
# Clears Expo cache
```

### Build Failures

#### Clear All Caches
```bash
rm -rf node_modules .expo dist build
bun install
```

#### Check TypeScript
```bash
npm run type-check
# Shows type errors
```

#### Check Linting
```bash
npm run lint
# Shows linting errors
```

### WebSocket Connection Issues

#### Verify WebSocket Server Running
```bash
# Check if port 3001 is listening
lsof -i :3001

# Or use netstat
netstat -an | grep 3001
```

#### Check WebSocket Logs
```bash
# Look for connection errors in console
# Verify JWT token is valid
# Check firewall allows port 3001
```

### Android Build Issues

#### Check Android SDK
```bash
# Verify ANDROID_HOME is set
echo $ANDROID_HOME

# List installed SDK versions
$ANDROID_HOME/tools/bin/sdkmanager --list
```

#### Clear Gradle Cache
```bash
cd expo/basic-android
./gradlew clean
cd ..
```

#### Rebuild
```bash
npm run prebuild:android
npm run build:android
```

---

## 📊 Development Workflow

### 1. Start Development Environment
```bash
# Terminal 1
cd expo
npm run backend:watch

# Terminal 2
npm run websocket

# Terminal 3
npm run start
```

### 2. Make Code Changes
```bash
# Edit files in your IDE
# Changes auto-reload via HMR
```

### 3. Run Tests
```bash
npm run test:watch
# Tests re-run on file changes
```

### 4. Check Quality
```bash
npm run type-check
npm run lint
```

### 5. Commit Changes
```bash
git add .
git commit -m "feat: description of changes"
git push origin branch-name
```

### 6. Build for Testing
```bash
npm run build:android:preview
```

### 7. Deploy to Production
```bash
npm run bump:minor
npm run build:android:production
npm run submit:android
```

---

## 🔐 Security Checklist

### Before Production Deployment
- [ ] Update `DATABASE_URL` with production database
- [ ] Generate new `JWT_SECRET` (64+ characters)
- [ ] Configure production SMTP credentials
- [ ] Set `FRONTEND_URL` to production domain
- [ ] Enable SSL/TLS on database
- [ ] Setup database backups
- [ ] Configure monitoring & logging
- [ ] Review CORS settings
- [ ] Test all authentication flows
- [ ] Run security audit
- [ ] Update environment variables in EAS
- [ ] Test payment processing
- [ ] Verify push notifications
- [ ] Test 2FA functionality

### Environment Variables for Production
```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-db:5432/heinicus_prod
JWT_SECRET=<new-64-char-secret>
FRONTEND_URL=https://heinicus.app
EXPO_PUBLIC_API_URL=https://api.heinicus.app
EXPO_PUBLIC_BACKEND_URL=https://api.heinicus.app
STRIPE_SECRET_KEY=sk_live_...
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## 📈 Performance Optimization

### Frontend Optimization
```bash
# Build optimized bundle
npm run build-web

# Check bundle size
npm run build-web -- --analyze
```

### Database Optimization
```bash
# Create indexes
bunx prisma db execute --stdin < optimize.sql

# Analyze query performance
EXPLAIN ANALYZE SELECT * FROM "Job" WHERE status = 'PENDING';
```

### API Optimization
- Use tRPC batching
- Implement caching with React Query
- Use WebSocket for real-time updates
- Optimize database queries

---

## 🚀 Deployment Platforms

### EAS (Expo Application Services)
```bash
# Login to EAS
eas login

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

### Google Play Store
```bash
# Prerequisites
# - Google Play Developer account
# - Signed APK/AAB
# - App listing created

# Submit
npm run submit:android
```

### App Store (iOS)
```bash
# Prerequisites
# - Apple Developer account
# - Signed IPA
# - App listing created

# Submit via Xcode or Transporter
```

### Web Hosting
```bash
# Build web bundle
npm run build-web

# Deploy to Vercel
vercel deploy dist/

# Deploy to Netlify
netlify deploy --prod --dir=dist/
```

---

## 📚 Additional Resources

- **Expo Docs:** https://docs.expo.dev
- **React Native Docs:** https://reactnative.dev
- **Prisma Docs:** https://www.prisma.io/docs
- **tRPC Docs:** https://trpc.io/docs
- **Hono Docs:** https://hono.dev
- **PostgreSQL Docs:** https://www.postgresql.org/docs

---

## 🆘 Getting Help

1. Check this documentation
2. Review error logs in console
3. Check database logs: `tail -f /var/log/postgresql/postgresql-*.log`
4. Check Expo logs: `npx expo start --verbose`
5. Create GitHub issue with error details and logs

---

## 📝 Common Commands Reference

```bash
# Development
npm run start              # Start dev server
npm run backend:watch     # Start backend with watch
npm run websocket         # Start WebSocket server
npm run test:watch        # Run tests in watch mode

# Building
npm run build:android:dev        # Build dev APK
npm run build:android:production # Build prod APK
npm run build-web                # Build web bundle

# Database
bunx prisma studio       # Open Prisma Studio
bunx prisma migrate dev  # Create migration
bunx prisma db seed      # Seed database

# Quality
npm run type-check       # Type checking
npm run lint             # Linting
npm run test:ci          # Run tests once

# Deployment
npm run bump:minor       # Bump version
npm run submit:android   # Submit to Play Store
```

---

**Version:** 1.1.0  
**Last Updated:** March 29, 2025  
**Maintained By:** Rork Development Team
