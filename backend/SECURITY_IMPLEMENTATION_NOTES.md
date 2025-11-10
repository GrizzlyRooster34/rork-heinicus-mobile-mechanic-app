# Security Implementation Notes

## Overview
This document outlines the security features implemented, required dependencies, and database schema changes needed for full functionality.

## ✅ Completed Implementations

### 1. Security Middleware Suite

#### Input Sanitization (`middleware/input-sanitization.ts`)
- ✅ HTML sanitization to prevent XSS attacks
- ✅ String sanitization with configurable options
- ✅ File upload validation (10MB max, jpg/png/pdf only)
- ✅ Zod schema helpers for common input types (email, phone, URL)
- ✅ tRPC and Express middleware for automatic sanitization
- ✅ Validation error formatting

**Usage:**
```typescript
import { createSanitizationMiddleware, sanitizedStringSchema } from './middleware/input-sanitization';

// In tRPC router
const procedure = publicProcedure.use(createSanitizationMiddleware());

// In input validation
const schema = z.object({
  name: sanitizedStringSchema({ maxLength: 100 }),
  description: sanitizedStringSchema({ maxLength: 500, allowNewlines: true }),
});
```

#### CORS Configuration (`middleware/cors.ts`)
- ✅ Environment-aware origin whitelisting
- ✅ Development: Allow all localhost and Expo origins
- ✅ Production: Strict domain whitelisting
- ✅ Preflight request handling
- ✅ Rate limit header exposure
- ✅ Startup logging for visibility

**Configuration:**
- Development: All localhost:*, 192.168.*, exp://* allowed
- Production: Configure FRONTEND_URL and ADDITIONAL_CORS_ORIGINS env variables

#### API Authentication (`middleware/auth.ts`)
- ✅ JWT token generation and verification
- ✅ Access token (7 days) and refresh token (30 days)
- ✅ Token blacklisting for logout/revocation
- ✅ Role-based access control (RBAC)
- ✅ User status verification (active check)
- ✅ Token refresh mechanism
- ✅ Session invalidation support
- ✅ tRPC and Express middleware
- ✅ Token expiration checking

**Usage:**
```typescript
import { createAuthMiddleware, requireRole } from './middleware/auth';

// Require authentication
const authedProcedure = publicProcedure.use(createAuthMiddleware());

// Require specific role
const adminProcedure = authedProcedure.use(requireRole('ADMIN'));
```

#### Security Headers (`middleware/security-headers.ts`)
- ✅ X-Frame-Options (clickjacking protection)
- ✅ X-Content-Type-Options (MIME sniffing protection)
- ✅ X-XSS-Protection (legacy browser protection)
- ✅ Strict-Transport-Security (HSTS)
- ✅ Referrer-Policy
- ✅ Permissions-Policy (feature control)
- ✅ Content-Security-Policy (CSP)
- ✅ Environment-aware CSP directives
- ✅ HSTS preload configuration helper
- ✅ Separate API-only headers middleware

### 2. Two-Factor Authentication

#### 2FA Service (`services/two-factor-auth.ts`)
- ✅ TOTP generation and verification
- ✅ QR code URI generation for authenticator apps
- ✅ Backup codes generation and verification
- ✅ Enable/disable 2FA
- ✅ SMS code generation (placeholder for Twilio)
- ✅ Backup code regeneration
- ✅ 2FA status checking

#### 2FA tRPC Routes (`trpc/routes/two-factor/route.ts`)
- ✅ `getStatus` - Get 2FA status for current user
- ✅ `generateSecret` - Generate TOTP secret for setup
- ✅ `enable` - Verify token and enable 2FA
- ✅ `disable` - Verify token and disable 2FA
- ✅ `verify` - Verify 2FA token (TOTP or backup)
- ✅ `getBackupCodesCount` - Get remaining backup codes
- ✅ `regenerateBackupCodes` - Generate new backup codes
- ✅ `sendSMSCode` - Send SMS verification (placeholder)
- ✅ `verifySMSCode` - Verify SMS code

### 3. Password Reset Flow

#### Password Reset Service (`services/password-reset.ts`)
- ✅ Secure password reset token generation
- ✅ Email sending with HTML templates
- ✅ Rate limiting and cooldown (3 attempts, 15 min cooldown)
- ✅ Token expiration (1 hour)
- ✅ Email enumeration prevention
- ✅ Automatic cleanup of expired tokens
- ✅ Password strength validation
- ✅ Session invalidation after password reset

#### Password Reset tRPC Routes (`trpc/routes/password-reset/route.ts`)
- ✅ `requestReset` - Request password reset email (public)
- ✅ `verifyToken` - Verify reset token validity (public)
- ✅ `resetPassword` - Reset password with token (public)
- ✅ `changePassword` - Change password for authenticated users
- ✅ `getResetAttempts` - Get reset attempt status (admin only)
- ✅ `validatePassword` - Real-time password strength validation

## 📦 Required Dependencies

### To Install

Run the following command to install missing dependencies:

```bash
npm install otplib qrcode @types/qrcode
```

Or with bun:
```bash
bun add otplib qrcode @types/qrcode
```

#### Package Details:

1. **otplib** (^12.0.1)
   - TOTP/HOTP library for 2FA
   - Used in: `services/two-factor-auth.ts`
   - Purpose: Generate and verify time-based one-time passwords

2. **qrcode** (^1.5.3)
   - QR code generation
   - Used in: `services/two-factor-auth.ts`
   - Purpose: Generate QR codes for authenticator app setup

3. **@types/qrcode** (^1.5.5)
   - TypeScript types for qrcode
   - DevDependency

### Already Installed ✅

- ✅ jsonwebtoken (^9.0.2)
- ✅ @types/jsonwebtoken (^9.0.10)
- ✅ bcryptjs (^3.0.3)
- ✅ @types/bcryptjs (^2.4.6)
- ✅ nodemailer (^7.0.10)
- ✅ @types/nodemailer (^7.0.3)
- ✅ zod (^4.1.12)

## 🗄️ Database Schema Changes Required

⚠️ **BLOCKED**: PostgreSQL is not currently running. These changes need to be applied once the database is set up.

Add the following models to `prisma/schema.prisma`:

```prisma
// Add to User model
model User {
  // ... existing fields ...

  // Password authentication
  passwordHash      String?

  // Two-factor authentication
  twoFactorEnabled  Boolean @default(false)
  twoFactorSecret   String? // Encrypted TOTP secret
  backupCodes       TwoFactorBackupCode[]

  // Password reset
  passwordResets    PasswordReset[]

  // ... existing relations ...
}

// New model for 2FA backup codes
model TwoFactorBackupCode {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  code      String   // Hashed backup code
  used      Boolean  @default(false)
  usedAt    DateTime?
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([used])
}

// New model for password reset tokens
model PasswordReset {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String   @unique // Hashed reset token
  used      Boolean  @default(false)
  usedAt    DateTime?
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([token])
  @@index([expiresAt])
}
```

### Migration Steps (When PostgreSQL is Running)

1. **Update schema**:
   ```bash
   # Add the models above to prisma/schema.prisma
   ```

2. **Create migration**:
   ```bash
   npx prisma migrate dev --name add_security_features
   ```

3. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

4. **Verify migration**:
   ```bash
   npx prisma migrate status
   ```

## 🔐 Environment Variables Required

Add these to your `.env` file:

```bash
# JWT Configuration
JWT_SECRET="your-very-long-and-secure-secret-key-at-least-64-characters-long"

# Frontend URL (for password reset links)
FRONTEND_URL="http://localhost:3000"  # Development
# FRONTEND_URL="https://heinicus-mobile-mechanic.app"  # Production

# SMTP Configuration (for password reset emails)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-specific-password"
SMTP_FROM="noreply@heinicus-mobile-mechanic.app"

# Optional: Additional CORS origins (comma-separated)
ADDITIONAL_CORS_ORIGINS="https://admin.heinicus.app,https://api.heinicus.app"

# Optional: Twilio (for SMS 2FA - future feature)
# TWILIO_ACCOUNT_SID="your-twilio-account-sid"
# TWILIO_AUTH_TOKEN="your-twilio-auth-token"
# TWILIO_PHONE_NUMBER="+1234567890"
```

## 🚀 Integration Steps

### 1. Add Routes to App Router

Update `backend/trpc/app-router.ts`:

```typescript
import { twoFactorRouter } from './routes/two-factor/route';
import { passwordResetRouter } from './routes/password-reset/route';

export const appRouter = router({
  // ... existing routes ...
  twoFactor: twoFactorRouter,
  passwordReset: passwordResetRouter,
});
```

### 2. Apply Middleware to Express Server

Update your Express server setup:

```typescript
import { corsMiddleware } from './backend/middleware/cors';
import { securityHeadersMiddleware } from './backend/middleware/security-headers';
import { sanitizeRequestBody } from './backend/middleware/input-sanitization';
import { createRateLimiter } from './backend/middleware/rate-limit';

const app = express();

// Apply security middleware (order matters!)
app.use(securityHeadersMiddleware);
app.use(corsMiddleware);
app.use(sanitizeRequestBody);

// Rate limiting for auth routes
app.use('/api/auth', createRateLimiter('auth'));

// Rate limiting for write operations
app.use('/api/trpc', createRateLimiter('write'));

// ... rest of your Express setup
```

### 3. Apply Middleware to tRPC Procedures

Update your tRPC setup:

```typescript
import { createSanitizationMiddleware } from './backend/middleware/input-sanitization';
import { createCORSMiddleware } from './backend/middleware/cors';
import { createSecurityHeadersMiddleware } from './backend/middleware/security-headers';
import { createTRPCRateLimiter } from './backend/middleware/rate-limit';

// Global middleware (applied to all procedures)
const globalMiddleware = t.middleware(async ({ ctx, next }) => {
  const sanitization = createSanitizationMiddleware();
  const cors = createCORSMiddleware();
  const headers = createSecurityHeadersMiddleware();

  return sanitization({ ctx, next: () =>
    cors({ ctx, next: () =>
      headers({ ctx, next })
    })
  });
});

export const publicProcedure = t.procedure.use(globalMiddleware);
```

### 4. Update Auth Routes

Integrate JWT authentication with your existing auth router:

```typescript
import {
  generateAccessToken,
  generateRefreshToken,
  refreshAccessToken,
  logout,
} from './backend/middleware/auth';

// In your login endpoint
const accessToken = generateAccessToken({
  userId: user.id,
  email: user.email,
  role: user.role,
});

const refreshToken = generateRefreshToken(user.id);

return { accessToken, refreshToken, user };
```

## 🧪 Testing Checklist

### Middleware Testing

- [ ] Test input sanitization with XSS payloads
- [ ] Test CORS with different origins
- [ ] Test authentication with valid/invalid tokens
- [ ] Test rate limiting by making multiple requests
- [ ] Test security headers are present in responses

### 2FA Testing

- [ ] Generate TOTP secret and QR code
- [ ] Verify TOTP tokens from authenticator app
- [ ] Enable 2FA and receive backup codes
- [ ] Disable 2FA with valid token
- [ ] Test backup code verification
- [ ] Regenerate backup codes

### Password Reset Testing

- [ ] Request password reset for existing email
- [ ] Request password reset for non-existent email (should not reveal)
- [ ] Verify reset token validity
- [ ] Reset password with valid token
- [ ] Attempt reset with expired token
- [ ] Test rate limiting (3 attempts, then cooldown)
- [ ] Change password while authenticated

## 📝 Additional Notes

### Security Best Practices Implemented

1. **Defense in Depth**: Multiple layers of security (sanitization, validation, rate limiting)
2. **Principle of Least Privilege**: Role-based access control
3. **Secure by Default**: Restrictive defaults, opt-in for permissive settings
4. **Fail Securely**: Errors don't reveal sensitive information
5. **No Security by Obscurity**: Clear, well-documented security measures

### Production Considerations

1. **Token Blacklisting**: Currently in-memory. For distributed systems, use Redis:
   ```typescript
   // Replace in-memory Set with Redis
   const redis = new Redis(process.env.REDIS_URL);
   await redis.sadd('token_blacklist', token);
   await redis.expire(`token_blacklist:${token}`, 7 * 24 * 60 * 60);
   ```

2. **Session Management**: Consider using Redis for session storage:
   ```typescript
   // Store session in Redis
   await redis.setex(`session:${userId}`, 7 * 24 * 60 * 60, JSON.stringify(session));
   ```

3. **Email Service**: Replace console logging with actual SMTP service:
   - SendGrid
   - AWS SES
   - Mailgun
   - Postmark

4. **SMS Service**: Integrate Twilio for SMS 2FA:
   ```typescript
   const twilioClient = twilio(accountSid, authToken);
   await twilioClient.messages.create({
     body: `Your code: ${code}`,
     from: twilioPhoneNumber,
     to: userPhoneNumber,
   });
   ```

5. **Monitoring**: Add logging and monitoring for security events:
   - Failed login attempts
   - Password reset requests
   - 2FA enable/disable events
   - Rate limit violations

### Known Limitations

1. **JWT Revocation**: JWT tokens cannot be revoked without blacklisting. Consider using short-lived tokens with refresh mechanism.

2. **Session Management**: Current implementation uses in-memory stores. Use Redis for production.

3. **Email Enumeration**: While we prevent direct enumeration, timing attacks may still be possible. Consider adding artificial delays.

4. **QR Code Generation**: Currently returns URI only. Frontend needs to generate actual QR code using a library like `react-native-qrcode-svg`.

## 🔄 Next Steps

1. ✅ Install required dependencies (`otplib`, `qrcode`)
2. ⏸️ Set up PostgreSQL (blocked)
3. ⏸️ Apply database migrations (blocked by #2)
4. ⏸️ Add routes to app router (blocked by #3)
5. ⏸️ Apply middleware to Express/tRPC
6. ⏸️ Configure environment variables
7. ⏸️ Test all security features
8. ⏸️ Deploy to staging environment
9. ⏸️ Security audit
10. ⏸️ Deploy to production

## 📚 References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [TOTP RFC 6238](https://tools.ietf.org/html/rfc6238)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [HSTS Preload](https://hstspreload.org/)
