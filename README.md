# Heinicus Mobile Mechanic App

A comprehensive mobile mechanic service platform built with React Native, Expo, and PostgreSQL. Connects customers with mobile mechanics for on-demand vehicle repair and maintenance services.

![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android%20%7C%20Web-blue)
![License](https://img.shields.io/badge/License-Proprietary-red)
![Status](https://img.shields.io/badge/Status-Active%20Development-green)

---

## Features

### Customer Features
- **On-Demand Service Requests** - Request mobile mechanic services from your location
- **Real-Time Job Tracking** - Track mechanic location and job status in real-time
- **Vehicle Management** - Store multiple vehicles with complete service history
- **Service Catalog** - Browse 16+ available services across 5 categories
- **Quote System** - Receive and accept quotes before service begins
- **Secure Authentication** - Email/password login with optional 2FA
- **Service History** - View past jobs, invoices, and service records

### Mechanic Features
- **Job Management** - Accept, track, and complete service requests
- **Location Services** - GPS navigation to customer locations
- **Service Catalog** - Access to complete service definitions and pricing
- **Job Status Updates** - Update customers on progress in real-time
- **Quote Generation** - Create and send quotes to customers
- **Earnings Dashboard** - Track completed jobs and earnings

### Admin Features
- **User Management** - Manage customers, mechanics, and admin accounts
- **Service Management** - Create and update service offerings
- **Analytics Dashboard** - Monitor platform usage and performance
- **Role Management** - Assign and update user roles

### Security Features
- **JWT Authentication** - Secure token-based authentication (7-day expiration)
- **Two-Factor Authentication (2FA)** - TOTP-based 2FA with backup codes
- **Password Reset** - Secure email-based password reset with rate limiting
- **Password Strength Validation** - Enforced strong password requirements
- **Email Enumeration Prevention** - Security against user discovery attacks
- **Rate Limiting** - Protection against brute force attacks
- **Encrypted Passwords** - bcrypt hashing with 10 salt rounds

---

## Technology Stack

### Frontend
- **React Native** - Cross-platform mobile development
- **Expo** - Development and build tooling
- **TypeScript** - Type-safe JavaScript
- **Zustand** - Lightweight state management
- **React Navigation** - Navigation framework
- **AsyncStorage** - Persistent local storage

### Backend
- **tRPC** - End-to-end type-safe API
- **Node.js** - JavaScript runtime
- **Express** - Web application framework
- **PostgreSQL** - Relational database
- **Prisma** - Type-safe ORM

### Authentication & Security
- **JWT (jsonwebtoken)** - Token-based authentication
- **bcrypt** - Password hashing
- **otplib** - TOTP 2FA implementation
- **qrcode** - QR code generation for 2FA setup
- **nodemailer** - Email service integration

### Development Tools
- **tsx** - TypeScript execution
- **dotenv** - Environment variable management
- **ESLint** - Code linting
- **Prettier** - Code formatting

---

## Quick Start

### Prerequisites
- Node.js v18+ or Bun v1.0+
- PostgreSQL v14+
- npm v8+ or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/GrizzlyRooster34/rork-heinicus-mobile-mechanic-app.git
cd rork-heinicus-mobile-mechanic-app

# Install dependencies
npm install --legacy-peer-deps

# Set up environment variables
cp .env.example .env
# Edit .env with your actual credentials

# Start PostgreSQL
sudo systemctl start postgresql

# Create database
sudo -u postgres psql <<EOF
CREATE USER heinicus_user WITH PASSWORD 'your_secure_password';
CREATE DATABASE heinicus_db OWNER heinicus_user;
GRANT ALL PRIVILEGES ON DATABASE heinicus_db TO heinicus_user;
ALTER USER heinicus_user CREATEDB;
EOF

# Run migrations
npx prisma migrate deploy

# Seed database
npx tsx seed.ts

# Start the application
npm run start
```

For detailed setup instructions, see **[SETUP.md](SETUP.md)**.

---

## Documentation

- **[SETUP.md](SETUP.md)** - Complete setup and installation guide
- **[API.md](API.md)** - API endpoint documentation
- **[DATABASE_ANALYSIS_AND_PATH_FORWARD.md](DATABASE_ANALYSIS_AND_PATH_FORWARD.md)** - Database architecture analysis

---

## Database Schema

### Core Models

**User** - Customer, mechanic, and admin accounts
- Authentication (email, password hash, 2FA)
- Profile information (name, phone, address)
- Role-based access control (CUSTOMER, MECHANIC, ADMIN)
- Account status tracking

**Service** - Available mechanic services
- 16 pre-defined services across 5 categories
- Pricing and time estimates
- Categories: MAINTENANCE, REPAIR, INSPECTION, DIAGNOSTIC, EMERGENCY

**Vehicle** - Customer vehicles
- Make, model, year, VIN
- License plate and color
- Linked to customer accounts

**Job** - Service requests
- Job details and description
- Status tracking (PENDING, ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED)
- Location and scheduling
- Mechanic assignment
- Priority levels (LOW, MEDIUM, HIGH, URGENT)

**Quote** - Service quotes
- Pricing estimates
- Status (PENDING, ACCEPTED, REJECTED, EXPIRED)
- Validity period
- Currency support

### Security Models

**TwoFactorBackupCode** - 2FA backup codes
- 10 codes per user
- Single-use with tracking
- Hashed storage

**PasswordReset** - Password reset tokens
- Token generation and validation
- Expiration tracking (1 hour)
- Single-use enforcement

### Schema Diagram

```
┌─────────────┐         ┌──────────────┐
│    User     │────────▶│   Vehicle    │
│ (Customer)  │         │              │
└─────────────┘         └──────────────┘
       │                       │
       │                       │
       ▼                       ▼
┌─────────────┐         ┌──────────────┐
│     Job     │────────▶│   Service    │
│             │         │              │
└─────────────┘         └──────────────┘
       │
       │
       ▼
┌─────────────┐
│    Quote    │
│             │
└─────────────┘
```

---

## API Overview

### Authentication Endpoints
- `auth.signup` - Create new user account
- `auth.signin` - Authenticate user
- `auth.verifyToken` - Validate JWT token

### Two-Factor Authentication
- `twoFactor.generateSecret` - Generate TOTP secret and QR code
- `twoFactor.enable` - Enable 2FA with backup codes
- `twoFactor.verify` - Verify 2FA code during login
- `twoFactor.disable` - Disable 2FA
- `twoFactor.getStatus` - Check 2FA status
- `twoFactor.regenerateBackupCodes` - Generate new backup codes
- `twoFactor.verifyBackupCode` - Verify backup code

### Password Reset
- `passwordReset.requestReset` - Request password reset email
- `passwordReset.validateToken` - Validate reset token
- `passwordReset.resetPassword` - Reset password with token
- `passwordReset.changePassword` - Change password (authenticated)
- `passwordReset.validatePasswordStrength` - Validate password strength

### Admin Operations
- `admin.updateUserRole` - Update user roles

For complete API documentation, see **[API.md](API.md)**.

---

## Testing

### Database Tests
```bash
npx tsx test-db.ts
```
Tests database connectivity, user operations, and data integrity.

### Security Tests
```bash
npx tsx test-security.ts
```
Tests JWT tokens, password validation, 2FA, and password reset.

### E2E Authentication Tests
```bash
npx tsx test-e2e-auth.ts
```
Comprehensive end-to-end authentication flow testing (32 test scenarios).

### Test Results
- ✅ Database connectivity - **PASSED**
- ✅ User authentication (JWT) - **PASSED**
- ✅ 2FA functionality - **PASSED**
- ✅ Password reset flow - **PASSED**
- ✅ Token management - **PASSED**
- ✅ E2E authentication - **PASSED (32/32)**

---

## Security

### Authentication
- JWT tokens with 7-day expiration
- Secure token storage in AsyncStorage
- Token verification on protected routes
- Automatic token refresh (coming soon)

### Password Security
- bcrypt hashing with 10 salt rounds
- Strong password requirements enforced
- Secure password reset with email verification
- Rate limiting on password reset (3 attempts per 15 min)

### Two-Factor Authentication
- TOTP-based (Time-based One-Time Password)
- QR code generation for authenticator apps
- 10 backup codes for account recovery
- Backup code regeneration available

### Additional Security Measures
- Email enumeration prevention
- Rate limiting on authentication endpoints
- SQL injection prevention via Prisma ORM
- XSS protection
- CSRF protection (coming soon)
- Constant-time password comparisons

---

## Environment Variables

Required environment variables (see `.env.example`):

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/heinicus_db"

# JWT Authentication
JWT_SECRET="your-64-character-secure-random-string"

# Frontend
FRONTEND_URL="http://localhost:8081"

# Email (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-specific-password"
SMTP_FROM="noreply@heinicus-mobile-mechanic.app"
```

For complete environment configuration, see **[SETUP.md](SETUP.md)**.

---

## Project Structure

```
rork-heinicus-mobile-mechanic-app/
├── backend/
│   ├── middleware/
│   │   └── auth.ts              # JWT authentication middleware
│   ├── services/
│   │   ├── two-factor-auth.ts   # 2FA service
│   │   └── password-reset.ts    # Password reset service
│   └── trpc/
│       ├── routes/
│       │   ├── auth/            # Authentication endpoints
│       │   ├── two-factor/      # 2FA endpoints
│       │   └── password-reset/  # Password reset endpoints
│       └── app-router.ts        # Main tRPC router
├── lib/
│   ├── prisma.ts               # Prisma client instance
│   └── trpc.ts                 # tRPC client configuration
├── stores/
│   └── auth-store.ts           # Authentication state management
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── migrations/             # Database migrations
├── seed.ts                     # Database seeding script
├── test-db.ts                  # Database tests
├── test-security.ts            # Security feature tests
├── test-e2e-auth.ts           # E2E authentication tests
├── .env                        # Environment variables (not in git)
├── .env.example                # Environment variable template
├── SETUP.md                    # Setup documentation
├── API.md                      # API documentation
└── README.md                   # This file
```

---

## Development Workflow

### Database Migrations

```bash
# Create a new migration
npx prisma migrate dev --name migration_name

# Apply migrations to production
npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Generate Prisma Client after schema changes
npx prisma generate
```

### Running the Application

```bash
# Development mode
npm run start

# Web only
npm run start-web

# Android
npm run android

# iOS
npm run ios
```

### Building for Production

```bash
# Android APK
npm run build:android:production

# Android Preview
npm run build:android:preview

# Submit to Google Play
npm run submit:android
```

---

## Test Credentials (Development)

After running `npx tsx seed.ts`:

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

## Roadmap

### Phase 1 - Database & Authentication ✅
- [x] PostgreSQL database setup
- [x] Prisma ORM integration
- [x] User authentication (JWT)
- [x] Two-factor authentication (2FA)
- [x] Password reset functionality
- [x] Database seeding
- [x] E2E authentication tests

### Phase 2 - Core Features (In Progress)
- [ ] Real-time job tracking
- [ ] GPS location services
- [ ] Payment integration (Stripe)
- [ ] Push notifications
- [ ] In-app messaging
- [ ] Photo uploads for jobs

### Phase 3 - Advanced Features
- [ ] Analytics dashboard
- [ ] Rating and review system
- [ ] Mechanic verification system
- [ ] Service area management
- [ ] Advanced search and filtering
- [ ] Appointment scheduling

### Phase 4 - Production
- [ ] Production SMTP integration
- [ ] SMS 2FA via Twilio
- [ ] Token refresh mechanism
- [ ] Performance optimization
- [ ] Load testing
- [ ] Production deployment

---

## Contributing

This is a proprietary project. For issues or questions, please contact the development team.

---

## License

Proprietary - All Rights Reserved

Copyright (c) 2025 Heinicus Mobile Mechanic

---

## Support

For setup issues, troubleshooting, or questions:
1. Check **[SETUP.md](SETUP.md)** for detailed setup instructions
2. Review **[API.md](API.md)** for API endpoint documentation
3. Check error logs in console
4. Review database logs: `tail -f /var/log/postgresql/postgresql-*.log`
5. Create an issue on GitHub (if applicable)

---

## Authors

- **Rork** - Initial work and project lead
- **Development Team** - Backend, frontend, and security implementation

---

**Last Updated:** November 2025
**Version:** 1.0.0
**Node Version:** v18+
**PostgreSQL Version:** v14+
