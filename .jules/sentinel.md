## 2024-03-30 - JWT Secret Key Hardcoded

**Vulnerability:** The application uses hardcoded JWT secrets in several files like `auth/route.ts` and `middleware/auth.ts`, providing a fallback to `'heinicus-mobile-mechanic-app-jwt-secret-key-2025-very-secure-and-long-at-least-64-chars'` when `process.env.JWT_SECRET` is not set. In other files (`reviews/route.ts`, `payments/route.ts`, `admin/route.ts`, `mechanic/route.ts`), it requires `process.env.NEXTAUTH_SECRET` but verifies the token with it even though tokens are signed with `JWT_SECRET`. This is a critical security vulnerability as it allows anyone with access to the source code to sign valid JWT tokens and bypass authentication, or in the case of different secrets being used for signing and verifying, breaks authentication entirely.

**Learning:** This likely existed to make local development easier without requiring developers to set up `.env` files, or as a leftover from an incomplete migration between authentication strategies (e.g. standard JWT to NextAuth).

**Prevention:** Never hardcode secrets in code, even as fallbacks. Instead, fail securely if the required environment variable is missing. This forces developers and operators to properly configure the application. Ensure the same secret is used for both signing and verifying tokens.
