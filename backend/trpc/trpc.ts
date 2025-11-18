import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { Context } from './create-context';
import { authenticate, type DecodedToken } from './middleware/auth';
import { checkRateLimit } from './middleware/rate-limit';
import { sanitizeInput } from './middleware/sanitization';

/**
 * HEI-131: Enhanced tRPC setup with security middleware
 * - JWT authentication
 * - Rate limiting
 * - Input sanitization
 */

// Extend context with authenticated user
export type AuthenticatedContext = Context & {
  user: DecodedToken;
};

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        // Add additional error context for debugging (remove in production)
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
    };
  },
});

export const router = t.router;

/**
 * Public procedure - no authentication required
 * Still applies rate limiting and input sanitization
 */
export const publicProcedure = t.procedure
  .use(async ({ ctx, next, input }) => {
    // Apply rate limiting
    checkRateLimit(ctx);

    // Sanitize input
    const sanitizedInput = sanitizeInput(input);

    // Log request for monitoring
    console.log('Public request:', {
      timestamp: new Date().toISOString(),
      ip: ctx.req.headers.get('x-forwarded-for') || 'unknown',
    });

    return next({
      ctx,
      input: sanitizedInput,
    });
  });

/**
 * Protected procedure - requires authentication
 * Applies JWT verification, rate limiting, and input sanitization
 */
export const protectedProcedure = t.procedure
  .use(async ({ ctx, next, input }) => {
    // Apply rate limiting first
    checkRateLimit(ctx);

    // Authenticate user
    const user = await authenticate(ctx);

    // Sanitize input
    const sanitizedInput = sanitizeInput(input);

    // Create authenticated context
    const authenticatedCtx: AuthenticatedContext = {
      ...ctx,
      user,
    };

    return next({
      ctx: authenticatedCtx,
      input: sanitizedInput,
    });
  });

/**
 * Admin-only procedure - requires admin role
 */
export const adminProcedure = protectedProcedure
  .use(async ({ ctx, next }) => {
    const authCtx = ctx as AuthenticatedContext;

    if (authCtx.user.role !== 'admin') {
      console.warn('Unauthorized admin access attempt:', {
        userId: authCtx.user.userId,
        role: authCtx.user.role,
        timestamp: new Date().toISOString(),
      });

      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Admin access required',
      });
    }

    return next({
      ctx: authCtx,
    });
  });

/**
 * Mechanic-only procedure - requires mechanic or admin role
 */
export const mechanicProcedure = protectedProcedure
  .use(async ({ ctx, next }) => {
    const authCtx = ctx as AuthenticatedContext;

    if (!['mechanic', 'admin'].includes(authCtx.user.role)) {
      console.warn('Unauthorized mechanic access attempt:', {
        userId: authCtx.user.userId,
        role: authCtx.user.role,
        timestamp: new Date().toISOString(),
      });

      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Mechanic access required',
      });
    }

    return next({
      ctx: authCtx,
    });
  });