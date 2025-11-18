/**
 * Tests for Rate Limiting Middleware
 * HEI-131: Verify rate limiting functionality
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { TRPCError } from '@trpc/server';
import { checkRateLimit, createRateLimiter } from '../rate-limit';
import type { Context } from '../../create-context';

describe('Rate Limiting Middleware', () => {
  beforeEach(() => {
    // Reset time
    jest.clearAllMocks();
  });

  const createMockContext = (ip: string = '127.0.0.1'): Context => ({
    req: {
      headers: new Headers({
        'x-forwarded-for': ip,
      }),
    } as Request,
    environment: 'development',
    isProduction: false,
  });

  describe('checkRateLimit', () => {
    it('should allow requests within limit', () => {
      const ctx = createMockContext();

      // Should not throw for first few requests
      expect(() => checkRateLimit(ctx)).not.toThrow();
      expect(() => checkRateLimit(ctx)).not.toThrow();
      expect(() => checkRateLimit(ctx)).not.toThrow();
    });

    it('should block requests after exceeding limit', () => {
      const ctx = createMockContext('192.168.1.100');

      // Make 100 requests (the limit)
      for (let i = 0; i < 100; i++) {
        expect(() => checkRateLimit(ctx)).not.toThrow();
      }

      // 101st request should be blocked
      expect(() => checkRateLimit(ctx)).toThrow(TRPCError);
      expect(() => checkRateLimit(ctx)).toThrow(
        expect.objectContaining({ code: 'TOO_MANY_REQUESTS' })
      );
    });

    it('should track different IPs separately', () => {
      const ctx1 = createMockContext('192.168.1.1');
      const ctx2 = createMockContext('192.168.1.2');

      // Make 50 requests from each IP
      for (let i = 0; i < 50; i++) {
        expect(() => checkRateLimit(ctx1)).not.toThrow();
        expect(() => checkRateLimit(ctx2)).not.toThrow();
      }

      // Both should still be allowed
      expect(() => checkRateLimit(ctx1)).not.toThrow();
      expect(() => checkRateLimit(ctx2)).not.toThrow();
    });

    it('should use x-real-ip header as fallback', () => {
      const ctx: Context = {
        req: {
          headers: new Headers({
            'x-real-ip': '10.0.0.1',
          }),
        } as Request,
        environment: 'development',
        isProduction: false,
      };

      expect(() => checkRateLimit(ctx)).not.toThrow();
    });
  });

  describe('createRateLimiter', () => {
    it('should create custom rate limiter with specified limits', () => {
      const rateLimiter = createRateLimiter(5, 1000); // 5 requests per second
      const ctx = createMockContext('10.0.0.2');

      // Should allow 5 requests
      for (let i = 0; i < 5; i++) {
        expect(() => rateLimiter(ctx)).not.toThrow();
      }

      // 6th request should be blocked
      expect(() => rateLimiter(ctx)).toThrow(TRPCError);
    });

    it('should reset after window expires', async () => {
      const rateLimiter = createRateLimiter(2, 100); // 2 requests per 100ms
      const ctx = createMockContext('10.0.0.3');

      // Use up the limit
      rateLimiter(ctx);
      rateLimiter(ctx);

      // Should be blocked
      expect(() => rateLimiter(ctx)).toThrow(TRPCError);

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should be allowed again
      expect(() => rateLimiter(ctx)).not.toThrow();
    }, 10000);

    it('should handle multiple IPs independently', () => {
      const rateLimiter = createRateLimiter(3, 1000);
      const ctx1 = createMockContext('10.0.0.4');
      const ctx2 = createMockContext('10.0.0.5');

      // Use up limit for first IP
      rateLimiter(ctx1);
      rateLimiter(ctx1);
      rateLimiter(ctx1);
      expect(() => rateLimiter(ctx1)).toThrow(TRPCError);

      // Second IP should still be allowed
      expect(() => rateLimiter(ctx2)).not.toThrow();
      expect(() => rateLimiter(ctx2)).not.toThrow();
    });
  });
});
