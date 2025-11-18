import { TRPCError } from '@trpc/server';
import type { Context } from '../create-context';

/**
 * Rate Limiting Middleware
 * HEI-131: Prevents abuse by limiting request frequency
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limit configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // Max requests per window

// Cleanup interval to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, RATE_LIMIT_WINDOW_MS);

/**
 * Get client identifier for rate limiting
 */
function getClientId(req: Request): string {
  // Use IP address as identifier
  const ip = req.headers.get('x-forwarded-for') ||
             req.headers.get('x-real-ip') ||
             'unknown';

  // In production, consider using user ID if authenticated
  return ip;
}

/**
 * Check rate limit for a client
 */
export function checkRateLimit(ctx: Context): void {
  const clientId = getClientId(ctx.req);
  const now = Date.now();

  let entry = rateLimitStore.get(clientId);

  // Initialize or reset if window expired
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    };
    rateLimitStore.set(clientId, entry);
  }

  // Increment request count
  entry.count++;

  // Check if limit exceeded
  if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);

    console.warn('Rate limit exceeded:', {
      clientId,
      count: entry.count,
      limit: RATE_LIMIT_MAX_REQUESTS,
      retryAfter,
      timestamp: new Date().toISOString(),
    });

    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
    });
  }

  // Log warning if approaching limit
  if (entry.count > RATE_LIMIT_MAX_REQUESTS * 0.8) {
    console.warn('Client approaching rate limit:', {
      clientId,
      count: entry.count,
      limit: RATE_LIMIT_MAX_REQUESTS,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Custom rate limiter with configurable limits
 */
export function createRateLimiter(maxRequests: number, windowMs: number) {
  const store = new Map<string, RateLimitEntry>();

  // Cleanup
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetTime < now) {
        store.delete(key);
      }
    }
  }, windowMs);

  return (ctx: Context): void => {
    const clientId = getClientId(ctx.req);
    const now = Date.now();

    let entry = store.get(clientId);

    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime: now + windowMs,
      };
      store.set(clientId, entry);
    }

    entry.count++;

    if (entry.count > maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: `Rate limit exceeded. Retry after ${retryAfter}s.`,
      });
    }
  };
}
