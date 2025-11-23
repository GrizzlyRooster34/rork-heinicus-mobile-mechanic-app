# JWT Authentication Implementation - Example Usage

## Overview
This document demonstrates how JWT authentication has been implemented end-to-end in the Heinicus Mobile Mechanic app.

## Architecture

### Backend Components

1. **JWT Token Issuance** (`backend/trpc/routes/auth/route.ts`)
   - Login and signup routes now return real JWT tokens (7-day expiration)
   - Tokens include payload: `{ userId, email, role }`
   - Uses `jsonwebtoken` package with secret key

2. **Context with JWT Validation** (`backend/trpc/create-context.ts`)
   - Extracts JWT from `Authorization: Bearer <token>` header
   - Validates and decodes token on every request
   - Adds `user` object to context if token is valid

3. **Protected Procedure Middleware** (`backend/trpc/trpc.ts`)
   - `protectedProcedure` enforces authentication
   - Throws `UNAUTHORIZED` error if no valid token
   - Makes `ctx.user` non-null for protected routes

### Frontend Components

1. **Auth Store** (`stores/auth-store.ts`)
   - Stores JWT token in AsyncStorage on login/signup
   - Removes token on logout
   - Includes `initializeAuth()` to restore session on app restart

2. **tRPC Client** (`lib/trpc.ts`)
   - Reads JWT from AsyncStorage before each request
   - Injects token in `Authorization: Bearer <token>` header
   - All tRPC requests automatically include the token

## Example: Protected Admin Route

### Backend Route Definition
```typescript
// backend/trpc/routes/admin/route.ts
import { protectedProcedure, createTRPCRouter } from '../../create-context';
import { TRPCError } from '@trpc/server';

export const adminRouter = createTRPCRouter({
  getAllUsers: protectedProcedure
    .query(async ({ ctx }) => {
      // ctx.user is guaranteed to exist (enforced by protectedProcedure)

      // Additional role-based authorization
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can access this resource',
        });
      }

      return {
        users: [/* ... */]
      };
    }),
});
```

### Frontend Usage
```typescript
// In any component
import { trpc } from '@/lib/trpc';

const MyComponent = () => {
  // This request will automatically include the JWT token
  const { data, error } = trpc.admin.getAllUsers.useQuery();

  if (error?.data?.code === 'UNAUTHORIZED') {
    // User is not logged in - token is missing or expired
    // Redirect to login
  }

  if (error?.data?.code === 'FORBIDDEN') {
    // User is logged in but doesn't have permission
    // Show "access denied" message
  }

  return <div>{/* render data */}</div>;
};
```

## Authentication Flow

### 1. Login/Signup
```
User submits credentials
  ↓
Frontend: auth.signin/signup mutation
  ↓
Backend: Validates credentials
  ↓
Backend: Generates JWT with user payload
  ↓
Frontend: Receives { success, user, token }
  ↓
Frontend: Stores token in AsyncStorage
  ↓
Frontend: Updates Zustand store
```

### 2. Making Authenticated Requests
```
User action triggers tRPC query/mutation
  ↓
tRPC client reads token from AsyncStorage
  ↓
Request sent with Authorization: Bearer <token>
  ↓
Backend: createContext extracts and verifies token
  ↓
Backend: Sets ctx.user if token valid
  ↓
protectedProcedure middleware checks ctx.user
  ↓
Route handler executes with ctx.user available
```

### 3. App Restart / Session Persistence
```
App starts
  ↓
Call initializeAuth() (in App.tsx or similar)
  ↓
Read token from AsyncStorage
  ↓
Call verifyToken to check if still valid
  ↓
If valid: restore user session
If invalid: clear token, user logs in again
```

### 4. Logout
```
User clicks logout
  ↓
Clear token from AsyncStorage
  ↓
Clear user from Zustand store
  ↓
Subsequent requests have no token
  ↓
Protected routes return UNAUTHORIZED
```

## Testing Protected Routes

### Test Case 1: Unauthenticated Access
```typescript
// Don't log in, try to access protected route
const result = await trpc.admin.getAllUsers.query();
// Expected: TRPCError with code 'UNAUTHORIZED'
```

### Test Case 2: Authenticated Access (Admin)
```typescript
// Log in as admin
await authStore.login('admin@example.com', 'your-secure-password');

// Access admin route
const result = await trpc.admin.getAllUsers.query();
// Expected: Success, returns users array
```

### Test Case 3: Authenticated but Wrong Role
```typescript
// Log in as customer
await authStore.login('customer@example.com', 'password');

// Try to access admin route
const result = await trpc.admin.getAllUsers.query();
// Expected: TRPCError with code 'FORBIDDEN'
```

### Test Case 4: Token Expiration
```typescript
// Log in and get token
await authStore.login('user@example.com', 'password');

// Wait 7+ days or manually set expired token
// Try to access protected route
const result = await trpc.admin.getAllUsers.query();
// Expected: TRPCError with code 'UNAUTHORIZED'
// Token verification fails in createContext
```

## Security Considerations

1. **JWT Secret**: Currently using a default secret. In production, set `JWT_SECRET` environment variable.

2. **Token Expiration**: Set to 7 days. Adjust in `backend/trpc/routes/auth/route.ts` as needed.

3. **HTTPS**: Always use HTTPS in production to prevent token interception.

4. **Token Refresh**: Current implementation forces logout on expiration. Consider implementing refresh tokens for better UX.

5. **Role-Based Access**: Protected routes should always check `ctx.user.role` for authorization.

## Files Modified

### Backend
- ✅ `backend/trpc/routes/auth/route.ts` - JWT issuance
- ✅ `backend/trpc/create-context.ts` - JWT extraction/validation
- ✅ `backend/trpc/trpc.ts` - protectedProcedure middleware
- ✅ `backend/trpc/routes/admin/route.ts` - Example protected routes

### Frontend
- ✅ `stores/auth-store.ts` - Token storage/retrieval
- ✅ `lib/trpc.ts` - JWT header injection

## Next Steps

1. Initialize auth on app startup by calling `useAuthStore.getState().initializeAuth()`
2. Update all routes that need authentication to use `protectedProcedure`
3. Set `JWT_SECRET` environment variable in production
4. Consider implementing refresh tokens for longer sessions
5. Add rate limiting to auth endpoints to prevent brute force attacks
