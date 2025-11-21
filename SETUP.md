# Heinicus Mobile Mechanic App - Setup Guide

Complete setup instructions for development and production environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Database Setup](#database-setup)
4. [Environment Configuration](#environment-configuration)
5. [Running the Application](#running-the-application)
6. [Testing](#testing)
7. [Production Deployment](#production-deployment)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js** v18+ or **Bun** v1.0+
- **PostgreSQL** v14+
- **npm** v8+ or **bun** (package manager)
- **Git** (for version control)

### Optional Tools

- **pgAdmin** or **TablePlus** (database GUI)
- **Postman** or **Insomnia** (API testing)
- **Expo Go** app (for mobile testing)

---

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/GrizzlyRooster34/rork-heinicus-mobile-mechanic-app.git
cd rork-heinicus-mobile-mechanic-app
```

### 2. Install Dependencies

```bash
# Using npm
npm install --legacy-peer-deps

# Or using bun
bun install
```

### 3. Set Up Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your actual credentials
nano .env  # or use your preferred editor
```

**Required environment variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secure random string (64+ characters)
- `FRONTEND_URL` - Your frontend URL
- `SMTP_*` - Email configuration for password resets

See [Environment Configuration](#environment-configuration) for details.

### 4. Set Up Database

```bash
# Start PostgreSQL (if not running)
sudo systemctl start postgresql

# Create database and user
sudo -u postgres psql <<EOF
CREATE USER heinicus_user WITH PASSWORD 'your_secure_password';
CREATE DATABASE heinicus_db OWNER heinicus_user;
GRANT ALL PRIVILEGES ON DATABASE heinicus_db TO heinicus_user;
ALTER USER heinicus_user CREATEDB;
EOF

# Run Prisma migrations
npx prisma migrate deploy

# Seed initial data
npx tsx seed.ts
```

### 5. Start the Application

```bash
# Start backend server
npm run start

# In another terminal, start mobile app
npm run start
```

---

## Database Setup

### PostgreSQL Installation

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### macOS (Homebrew)
```bash
brew install postgresql@16
brew services start postgresql@16
```

#### Windows
Download from [PostgreSQL.org](https://www.postgresql.org/download/windows/)

### Database Configuration

1. **Create Database User**

```bash
sudo -u postgres psql
```

```sql
-- Create user with password
CREATE USER heinicus_user WITH PASSWORD 'your_secure_password';

-- Create database
CREATE DATABASE heinicus_db OWNER heinicus_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE heinicus_db TO heinicus_user;

-- Allow user to create databases (required for Prisma shadow DB)
ALTER USER heinicus_user CREATEDB;

-- Connect to database
\c heinicus_db

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO heinicus_user;

-- Exit
\q
```

2. **Update DATABASE_URL in .env**

```bash
DATABASE_URL="postgresql://heinicus_user:your_secure_password@localhost:5432/heinicus_db"
```

3. **Run Migrations**

```bash
# Apply database migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

4. **Seed Initial Data**

```bash
# Populate database with sample data
npx tsx seed.ts
```

This creates:
- 16 services (oil change, brake repair, etc.)
- 7 test users (2 admin, 3 customers, 2 mechanics)
- 4 sample vehicles
- 5 sample jobs
- 3 sample quotes

### Test Credentials (After Seeding)

**Admin Users:**
- `matthew.heinen.2014@gmail.com` / `RoosTer669072!@`
- `cody@heinicus.com` / `RoosTer669072!@`

**Test Customers:**
- `customer1@example.com` / `TestPassword123!`
- `customer2@example.com` / `TestPassword123!`
- `customer3@example.com` / `TestPassword123!`

**Test Mechanics:**
- `mechanic1@heinicus.com` / `TestPassword123!`
- `mechanic2@heinicus.com` / `TestPassword123!`

---

## Environment Configuration

### Required Variables

#### 1. Database Configuration

```bash
# PostgreSQL connection string
DATABASE_URL="postgresql://heinicus_user:password@localhost:5432/heinicus_db"
```

#### 2. JWT Authentication

```bash
# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET="your-64-character-secure-random-string"
```

#### 3. Frontend URL

```bash
# Development
FRONTEND_URL="http://localhost:8081"

# Production
FRONTEND_URL="https://yourdomain.com"
```

#### 4. SMTP Email Configuration

For **Gmail**:
1. Enable 2FA on your Google account
2. Generate app-specific password: https://myaccount.google.com/apppasswords
3. Use app password (not your regular password)

```bash
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-specific-password"
SMTP_FROM="noreply@heinicus-mobile-mechanic.app"
```

For **Other Providers**:
- **SendGrid**: smtp.sendgrid.net:587
- **AWS SES**: email-smtp.region.amazonaws.com:587
- **Mailgun**: smtp.mailgun.org:587

### Optional Variables

```bash
# Additional CORS origins (comma-separated)
ADDITIONAL_CORS_ORIGINS="https://admin.example.com,https://api.example.com"

# Twilio SMS (for future SMS 2FA feature)
TWILIO_ACCOUNT_SID="your-account-sid"
TWILIO_AUTH_TOKEN="your-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"
```

---

## Running the Application

### Development Mode

```bash
# Start backend and frontend
npm run start

# Start with specific flags
npm run start-web        # Web only
npm run start-web-dev    # Web with debug logs

# Start on Android
npm run android

# Start on iOS
npm run ios
```

### Production Build

```bash
# Build Android APK
npm run build:android:production

# Build for preview
npm run build:android:preview

# Submit to Google Play
npm run submit:android
```

---

## Testing

### Run All Tests

```bash
# Database connection test
npx tsx test-db.ts

# Security features test
npx tsx test-security.ts

# E2E authentication test
npx tsx test-e2e-auth.ts
```

### Test Results

All test suites should pass:
- ✅ Database connectivity
- ✅ User authentication (JWT)
- ✅ 2FA functionality
- ✅ Password reset flow
- ✅ Token management

### Manual API Testing

Use the test credentials to verify:

1. **Signup Flow**
   - POST `/api/trpc/auth.signup`
   - Verify user creation in database

2. **Login Flow**
   - POST `/api/trpc/auth.signin`
   - Verify JWT token returned

3. **2FA Setup**
   - POST `/api/trpc/twoFactor.generateSecret`
   - Scan QR code with authenticator app
   - POST `/api/trpc/twoFactor.enable`

4. **Password Reset**
   - POST `/api/trpc/passwordReset.requestReset`
   - Check console for reset link
   - POST `/api/trpc/passwordReset.resetPassword`

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] Update `DATABASE_URL` with production database
- [ ] Generate new production `JWT_SECRET`
- [ ] Configure production SMTP credentials
- [ ] Set `FRONTEND_URL` to production domain
- [ ] Enable SSL/TLS on database connection
- [ ] Set up database backups
- [ ] Configure monitoring and logging
- [ ] Review and update CORS settings
- [ ] Test all authentication flows
- [ ] Run security audit

### Environment-Specific Configuration

**Staging:**
```bash
DATABASE_URL="postgresql://user:pass@staging-db.example.com:5432/heinicus_staging"
FRONTEND_URL="https://staging.heinicus.app"
NODE_ENV="staging"
```

**Production:**
```bash
DATABASE_URL="postgresql://user:pass@production-db.example.com:5432/heinicus_production"
FRONTEND_URL="https://heinicus.app"
NODE_ENV="production"
```

### Security Best Practices

1. **Never commit `.env` files**
   - Already in `.gitignore`
   - Use secret management services (AWS Secrets Manager, etc.)

2. **Rotate credentials regularly**
   - JWT secrets every 90 days
   - Database passwords every 90 days
   - API keys as needed

3. **Use strong passwords**
   - Minimum 16 characters
   - Mix of uppercase, lowercase, numbers, symbols

4. **Enable 2FA everywhere**
   - Database access
   - Email accounts
   - Cloud services
   - Admin accounts

5. **Monitor for security issues**
   - Set up logging and alerts
   - Monitor failed login attempts
   - Track API usage

---

## Troubleshooting

### Database Connection Issues

**Error:** `Can't reach database server at localhost:5432`

**Solutions:**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Check if port 5432 is listening
sudo netstat -plnt | grep 5432

# Test connection
psql -h localhost -U heinicus_user -d heinicus_db
```

### Prisma Migration Errors

**Error:** `P3014: Prisma Migrate could not create the shadow database`

**Solution:**
```sql
-- Grant CREATEDB permission
ALTER USER heinicus_user CREATEDB;
```

**Error:** `Migration failed to apply`

**Solution:**
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or apply specific migration
npx prisma migrate deploy
```

### Authentication Issues

**Error:** `Invalid credentials`

**Solutions:**
1. Verify user exists in database:
   ```sql
   SELECT email, role FROM "User";
   ```

2. Check password is hashed correctly
3. Verify JWT_SECRET matches in .env
4. Check token expiration (7 days default)

### SMTP Email Errors

**Error:** `Failed to send reset email`

**Solutions:**
1. Verify SMTP credentials
2. Check Gmail app password (not regular password)
3. Enable "Less secure app access" (if needed)
4. Check SMTP_PORT (587 for TLS, 465 for SSL)
5. Verify SMTP_SECURE setting matches port

### 2FA Issues

**Error:** `Invalid verification code`

**Solutions:**
1. Check device time is synchronized (NTP)
2. Verify authenticator app is set up correctly
3. Try backup code instead
4. Time drift tolerance is ±30 seconds

### Build Errors

**Error:** `Module not found` or `Cannot resolve module`

**Solutions:**
```bash
# Clear cache and reinstall
rm -rf node_modules
rm package-lock.json
npm install --legacy-peer-deps

# Clear Metro bundler cache
npx expo start --clear

# Reset Expo cache
npx expo start -c
```

---

## Additional Resources

- **Prisma Documentation**: https://www.prisma.io/docs
- **tRPC Documentation**: https://trpc.io/docs
- **Expo Documentation**: https://docs.expo.dev
- **PostgreSQL Documentation**: https://www.postgresql.org/docs

---

## Support

For issues and questions:
1. Check this documentation
2. Review error logs in console
3. Check database logs: `tail -f /var/log/postgresql/postgresql-*.log`
4. Create an issue on GitHub

---

**Last Updated:** November 2025
**Version:** 1.0.0
