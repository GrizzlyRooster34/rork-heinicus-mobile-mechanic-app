/**
 * Rate Limiting Middleware
 *
 * Protects API endpoints from abuse by limiting the number of requests
 * from a single IP address or user within a time window.
 */

import { validatedEnv } from '../env-validation';

// Simple in-memory rate limiter (use Redis for distributed systems)
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Configuration
const RATE_LIMIT_CONFIG = {
  // Authentication endpoints (stricter limits)
  auth: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 requests per minute
    message: 'Too many authentication attempts. Please try again later.',
  },

  // Write endpoints (moderate limits)
  write: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute
    message: 'Too many requests. Please slow down.',
  },

  // Read endpoints (generous limits)
  read: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    message: 'Too many requests. Please slow down.',
  },

  // File upload endpoints (very strict)
  upload: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 uploads per minute
    message: 'Too many file uploads. Please wait before uploading more.',
  },

  // Default for unspecified endpoints
  default: {
    windowMs: parseInt(validatedEnv.RATE_LIMIT_WINDOW_MS),
    maxRequests: parseInt(validatedEnv.RATE_LIMIT_MAX_REQUESTS),
    message: 'Too many requests. Please try again later.',
  },
};

export type RateLimitType = keyof typeof RATE_LIMIT_CONFIG;

/**
 * Clean up expired entries from the rate limit store
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredEntries, 5 * 60 * 1000);

/**
 * Get client identifier from request
 * Uses IP address or user ID if authenticated
 */
function getClientId(req: any): string {
  // Use user ID if authenticated
  if (req.user?.id) {
    return `user:${req.user.id}`;
  }

  // Otherwise use IP address
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    'unknown';

  return `ip:${ip}`;
}

/**
 * Rate limiting middleware factory
 */
export function createRateLimiter(type: RateLimitType = 'default') {
  const config = RATE_LIMIT_CONFIG[type];

  return (req: any, res: any, next: any) => {
    const clientId = getClientId(req);
    const key = `${type}:${clientId}`;
    const now = Date.now();

    let entry = rateLimitStore.get(key);

    // Create new entry if doesn't exist or expired
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
      };
      rateLimitStore.set(key, entry);
    }

    // Increment request count
    entry.count++;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, config.maxRequests - entry.count));
    res.setHeader('X-RateLimit-Reset', new Date(entry.resetTime).toISOString());

    // Check if limit exceeded
    if (entry.count > config.maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter);

      return res.status(429).json({
        error: 'Too Many Requests',
        message: config.message,
        retryAfter: retryAfter,
      });
    }

    next();
  };
}

/**
 * tRPC-compatible rate limiter middleware
 */
export function createTRPCRateLimiter(type: RateLimitType = 'default') {
  const config = RATE_LIMIT_CONFIG[type];

  return ({ ctx, next }: any) => {
    // Extract client identifier
    const clientId = ctx.user?.id ? `user:${ctx.user.id}` : `ip:${ctx.req?.ip || 'unknown'}`;
    const key = `${type}:${clientId}`;
    const now = Date.now();

    let entry = rateLimitStore.get(key);

    // Create new entry if doesn't exist or expired
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
      };
      rateLimitStore.set(key, entry);
    }

    // Increment request count
    entry.count++;

    // Check if limit exceeded
    if (entry.count > config.maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);

      throw new Error(`${config.message} Please try again in ${retryAfter} seconds.`);
    }

    return next();
  };
}

/**
 * Reset rate limit for a specific client
 * Useful for manual intervention or testing
 */
export function resetRateLimit(clientId: string, type?: RateLimitType): void {
  if (type) {
    const key = `${type}:${clientId}`;
    rateLimitStore.delete(key);
  } else {
    // Reset all rate limits for this client
    for (const key of rateLimitStore.keys()) {
      if (key.endsWith(`:${clientId}`)) {
        rateLimitStore.delete(key);
      }
    }
  }
}

/**
 * Get current rate limit status for a client
 */
export function getRateLimitStatus(
  clientId: string,
  type: RateLimitType = 'default'
): {
  remaining: number;
  resetAt: Date;
  limited: boolean;
} {
  const config = RATE_LIMIT_CONFIG[type];
  const key = `${type}:${clientId}`;
  const entry = rateLimitStore.get(key);
  const now = Date.now();

  if (!entry || now > entry.resetTime) {
    return {
      remaining: config.maxRequests,
      resetAt: new Date(now + config.windowMs),
      limited: false,
    };
  }

  return {
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetAt: new Date(entry.resetTime),
    limited: entry.count > config.maxRequests,
  };
}

/**
 * Get rate limit statistics
 * Useful for monitoring and debugging
 */
export function getRateLimitStats(): {
  totalClients: number;
  limitedClients: number;
  entriesByType: Record<string, number>;
} {
  const entriesByType: Record<string, number> = {};
  let limitedClients = 0;
  const now = Date.now();

  for (const [key, entry] of rateLimitStore.entries()) {
    const type = key.split(':')[0];
    entriesByType[type] = (entriesByType[type] || 0) + 1;

    const config = RATE_LIMIT_CONFIG[type as RateLimitType] || RATE_LIMIT_CONFIG.default;
    if (entry.count > config.maxRequests && now < entry.resetTime) {
      limitedClients++;
    }
  }

  return {
    totalClients: rateLimitStore.size,
    limitedClients,
    entriesByType,
  };
}

// Export preconfig ured rate limiters
export const authRateLimit = createRateLimiter('auth');
export const writeRateLimit = createRateLimiter('write');
export const readRateLimit = createRateLimiter('read');
export const uploadRateLimit = createRateLimiter('upload');
export const defaultRateLimit = createRateLimiter('default');

export default createRateLimiter;
