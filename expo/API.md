# Heinicus Mobile Mechanic App - API Documentation

Complete API reference for all tRPC endpoints.

## Table of Contents

1. [Authentication](#authentication)
2. [Two-Factor Authentication (2FA)](#two-factor-authentication-2fa)
3. [Password Reset](#password-reset)
4. [Admin Operations](#admin-operations)
5. [Request/Response Format](#requestresponse-format)
6. [Error Handling](#error-handling)

---

## Authentication

Base path: `/api/trpc/auth`

### signup

Create a new user account.

**Method:** `mutation`
**Authentication:** None (public)

**Request:**
```typescript
{
  email: string;        // Valid email address
  password: string;     // Min 6 characters
  firstName: string;    // Min 1 character
  lastName: string;     // Min 1 character
  phone?: string;       // Optional phone number
  role?: 'customer' | 'mechanic';  // Default: 'customer'
}
```

**Response:**
```typescript
{
  success: boolean;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'CUSTOMER' | 'MECHANIC' | 'ADMIN';
    phone: string | null;
    createdAt: Date;
  };
  token?: string;       // JWT access token
  error?: string;       // Error message if success = false
}
```

**Example:**
```typescript
const result = await trpcClient.auth.signup.mutate({
  email: 'john.doe@example.com',
  password: 'SecurePassword123!',
  firstName: 'John',
  lastName: 'Doe',
  phone: '555-1234',
  role: 'customer'
});
```

---

### signin

Authenticate existing user.

**Method:** `mutation`
**Authentication:** None (public)

**Request:**
```typescript
{
  email: string;
  password: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'CUSTOMER' | 'MECHANIC' | 'ADMIN';
    phone: string | null;
    createdAt: Date;
  };
  token?: string;           // JWT access token (7 day expiration)
  requiresTwoFactor?: boolean;  // True if 2FA is enabled
  tempToken?: string;       // Temporary token for 2FA verification
  error?: string;
}
```

**Example:**
```typescript
const result = await trpcClient.auth.signin.mutate({
  email: 'john.doe@example.com',
  password: 'SecurePassword123!'
});

if (result.requiresTwoFactor) {
  // Redirect to 2FA verification page with tempToken
} else if (result.success) {
  // Store token and authenticate user
}
```

---

### verifyToken

Verify JWT token validity and retrieve user data.

**Method:** `query`
**Authentication:** None (public)

**Request:**
```typescript
{
  token: string;  // JWT access token
}
```

**Response:**
```typescript
{
  valid: boolean;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'CUSTOMER' | 'MECHANIC' | 'ADMIN';
    phone: string | null;
    createdAt: Date;
  };
  error?: string;
}
```

**Example:**
```typescript
const result = await trpcClient.auth.verifyToken.query({
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
});

if (result.valid) {
  // Token is valid, user is authenticated
}
```

---

## Two-Factor Authentication (2FA)

Base path: `/api/trpc/twoFactor`

All endpoints require authentication via JWT token.

### generateSecret

Generate TOTP secret and QR code for 2FA setup.

**Method:** `mutation`
**Authentication:** Required (JWT token)

**Request:**
```typescript
{
  userId: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  secret?: string;      // TOTP secret (base32 encoded)
  qrCodeUri?: string;   // QR code data URI for authenticator apps
  error?: string;
}
```

**Example:**
```typescript
const result = await trpcClient.twoFactor.generateSecret.mutate({
  userId: currentUser.id
});

// Display QR code to user for scanning with authenticator app
```

---

### enable

Enable 2FA after verifying TOTP code.

**Method:** `mutation`
**Authentication:** Required (JWT token)

**Request:**
```typescript
{
  userId: string;
  secret: string;   // TOTP secret from generateSecret
  token: string;    // 6-digit code from authenticator app
}
```

**Response:**
```typescript
{
  success: boolean;
  backupCodes?: string[];  // 10 backup codes for recovery
  error?: string;
}
```

**Example:**
```typescript
const result = await trpcClient.twoFactor.enable.mutate({
  userId: currentUser.id,
  secret: 'JBSWY3DPEHPK3PXP',
  token: '123456'
});

if (result.success) {
  // Save backup codes securely
  console.log('Backup codes:', result.backupCodes);
}
```

---

### verify

Verify 2FA code during login.

**Method:** `mutation`
**Authentication:** Temporary token from signin

**Request:**
```typescript
{
  userId: string;
  token: string;    // 6-digit TOTP code or backup code
}
```

**Response:**
```typescript
{
  success: boolean;
  accessToken?: string;   // Full JWT access token (7 days)
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  error?: string;
}
```

**Example:**
```typescript
const result = await trpcClient.twoFactor.verify.mutate({
  userId: currentUser.id,
  token: '123456'
});

if (result.success) {
  // Store accessToken and complete authentication
}
```

---

### disable

Disable 2FA for user account.

**Method:** `mutation`
**Authentication:** Required (JWT token)

**Request:**
```typescript
{
  userId: string;
  password: string;  // Current password for confirmation
}
```

**Response:**
```typescript
{
  success: boolean;
  error?: string;
}
```

**Example:**
```typescript
const result = await trpcClient.twoFactor.disable.mutate({
  userId: currentUser.id,
  password: 'SecurePassword123!'
});
```

---

### getStatus

Get current 2FA status for user.

**Method:** `query`
**Authentication:** Required (JWT token)

**Request:**
```typescript
{
  userId: string;
}
```

**Response:**
```typescript
{
  enabled: boolean;
  backupCodesRemaining: number;
}
```

**Example:**
```typescript
const status = await trpcClient.twoFactor.getStatus.query({
  userId: currentUser.id
});

console.log('2FA enabled:', status.enabled);
console.log('Backup codes remaining:', status.backupCodesRemaining);
```

---

### regenerateBackupCodes

Generate new backup codes (invalidates old ones).

**Method:** `mutation`
**Authentication:** Required (JWT token)

**Request:**
```typescript
{
  userId: string;
  password: string;  // Current password for confirmation
}
```

**Response:**
```typescript
{
  success: boolean;
  backupCodes?: string[];  // 10 new backup codes
  error?: string;
}
```

---

### verifyBackupCode

Use a backup code for 2FA verification.

**Method:** `mutation`
**Authentication:** Temporary token from signin

**Request:**
```typescript
{
  userId: string;
  backupCode: string;  // One of the 10 backup codes
}
```

**Response:**
```typescript
{
  success: boolean;
  accessToken?: string;
  user?: { /* user data */ };
  codesRemaining?: number;
  error?: string;
}
```

---

## Password Reset

Base path: `/api/trpc/passwordReset`

### requestReset

Request password reset email.

**Method:** `mutation`
**Authentication:** None (public)

**Request:**
```typescript
{
  email: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  message?: string;  // Generic message (prevents email enumeration)
  error?: string;
}
```

**Rate Limiting:** 3 requests per 15 minutes per email

**Example:**
```typescript
const result = await trpcClient.passwordReset.requestReset.mutate({
  email: 'john.doe@example.com'
});

// Response is always the same regardless of email existence (security)
console.log(result.message);
// "If an account with that email exists, a reset link has been sent."
```

---

### validateToken

Validate password reset token.

**Method:** `query`
**Authentication:** None (public)

**Request:**
```typescript
{
  token: string;  // Reset token from email link
}
```

**Response:**
```typescript
{
  valid: boolean;
  userId?: string;
  error?: string;
}
```

---

### resetPassword

Reset password using reset token.

**Method:** `mutation`
**Authentication:** None (public, uses reset token)

**Request:**
```typescript
{
  token: string;      // Reset token from email
  newPassword: string;  // New password (validated for strength)
}
```

**Response:**
```typescript
{
  success: boolean;
  error?: string;
}
```

**Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character (!@#$%^&*)

**Example:**
```typescript
const result = await trpcClient.passwordReset.resetPassword.mutate({
  token: 'abc123...xyz',
  newPassword: 'NewSecurePass123!'
});
```

---

### changePassword

Change password for authenticated user.

**Method:** `mutation`
**Authentication:** Required (JWT token)

**Request:**
```typescript
{
  userId: string;
  currentPassword: string;
  newPassword: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  error?: string;
}
```

**Example:**
```typescript
const result = await trpcClient.passwordReset.changePassword.mutate({
  userId: currentUser.id,
  currentPassword: 'OldPassword123!',
  newPassword: 'NewSecurePass123!'
});
```

---

### validatePasswordStrength

Validate password strength without creating/changing password.

**Method:** `query`
**Authentication:** None (public)

**Request:**
```typescript
{
  password: string;
}
```

**Response:**
```typescript
{
  valid: boolean;
  errors: string[];  // List of validation errors
}
```

**Example:**
```typescript
const result = await trpcClient.passwordReset.validatePasswordStrength.query({
  password: 'test123'
});

if (!result.valid) {
  console.log('Password errors:', result.errors);
  // ["Password must be at least 8 characters", "Password must contain uppercase letter", ...]
}
```

---

## Admin Operations

Base path: `/api/trpc/admin`

### updateUserRole

Update user role (admin only).

**Method:** `mutation`
**Authentication:** Required (JWT token, ADMIN role)

**Request:**
```typescript
{
  userId: string;
  role: 'customer' | 'mechanic' | 'admin';
}
```

**Response:**
```typescript
{
  success: boolean;
  error?: string;
}
```

---

## Request/Response Format

### tRPC Client Setup

```typescript
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from './backend/trpc/app-router';

export const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:3000/api/trpc',
      headers: () => {
        const token = getStoredToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
});
```

### Authentication Header

For authenticated endpoints, include JWT token in Authorization header:

```typescript
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Error Handling

### Common Error Responses

**Validation Error:**
```typescript
{
  success: false,
  error: "Invalid email format"
}
```

**Authentication Error:**
```typescript
{
  success: false,
  error: "Invalid credentials"
}
```

**Rate Limit Error:**
```typescript
{
  success: false,
  error: "Too many password reset attempts. Please try again in 15 minutes."
}
```

**2FA Required:**
```typescript
{
  success: true,
  requiresTwoFactor: true,
  tempToken: "temp_token_for_2fa_verification"
}
```

### HTTP Status Codes

tRPC uses HTTP 200 for all responses. Check the `success` field in the response body to determine success/failure.

---

## Security Notes

1. **JWT Tokens:**
   - Access tokens expire in 7 days
   - Store securely in AsyncStorage (React Native) or localStorage (web)
   - Always send in Authorization header for authenticated requests

2. **Password Reset:**
   - Reset tokens expire in 1 hour
   - Tokens are single-use only
   - Rate limited to 3 attempts per 15 minutes

3. **2FA:**
   - TOTP codes are time-based (30-second window)
   - Backup codes are single-use only
   - 10 backup codes generated per setup/regeneration

4. **Email Enumeration Prevention:**
   - Password reset always returns success message
   - Timing attacks mitigated with constant-time responses

5. **Password Requirements:**
   - Minimum 8 characters
   - Must contain uppercase, lowercase, number, special character
   - Validated server-side on all password operations

---

## Testing

### Test Credentials (Development Only)

After running `npx tsx seed.ts`, use these credentials:

**Admin:**
- `matthew.heinen.2014@gmail.com` / `RoosTer669072!@`
- `cody@heinicus.com` / `RoosTer669072!@`

**Customers:**
- `customer1@example.com` / `TestPassword123!`
- `customer2@example.com` / `TestPassword123!`
- `customer3@example.com` / `TestPassword123!`

**Mechanics:**
- `mechanic1@heinicus.com` / `TestPassword123!`
- `mechanic2@heinicus.com` / `TestPassword123!`

---

**Last Updated:** November 2025
**Version:** 1.0.0
