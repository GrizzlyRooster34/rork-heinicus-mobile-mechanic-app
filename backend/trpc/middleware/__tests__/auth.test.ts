/**
 * Tests for JWT Authentication Middleware
 * HEI-131: Verify authentication and authorization logic
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { TRPCError } from '@trpc/server';
import { verifyToken, extractToken, authenticate, requireRole, type DecodedToken } from '../auth';
import type { Context } from '../../create-context';

describe('Authentication Middleware', () => {
  describe('verifyToken', () => {
    it('should accept mock tokens in development', () => {
      const token = 'mock-jwt-token';
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe('dev-user');
      expect(decoded.role).toBe('customer');
    });

    it('should accept dev- prefixed tokens', () => {
      const token = 'dev-test-token';
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe('dev-user');
    });

    it('should throw error for invalid tokens', () => {
      const invalidToken = 'invalid-token-format';

      expect(() => verifyToken(invalidToken)).toThrow(TRPCError);
    });

    it('should decode valid JWT-like tokens', () => {
      // Create a simple base64-encoded payload
      const payload = { userId: 'test-123', email: 'test@example.com', role: 'customer' };
      const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
      const token = `header.${encodedPayload}.signature`;

      const decoded = verifyToken(token);

      expect(decoded.userId).toBe('test-123');
      expect(decoded.email).toBe('test@example.com');
      expect(decoded.role).toBe('customer');
    });
  });

  describe('extractToken', () => {
    it('should extract Bearer token from Authorization header', () => {
      const mockReq = {
        headers: new Headers({
          'authorization': 'Bearer test-token-123',
        }),
      } as Request;

      const token = extractToken(mockReq);
      expect(token).toBe('test-token-123');
    });

    it('should extract plain token from Authorization header', () => {
      const mockReq = {
        headers: new Headers({
          'authorization': 'test-token-456',
        }),
      } as Request;

      const token = extractToken(mockReq);
      expect(token).toBe('test-token-456');
    });

    it('should return null if no Authorization header', () => {
      const mockReq = {
        headers: new Headers(),
      } as Request;

      const token = extractToken(mockReq);
      expect(token).toBeNull();
    });
  });

  describe('authenticate', () => {
    it('should authenticate valid token', async () => {
      const mockContext: Context = {
        req: {
          headers: new Headers({
            'authorization': 'Bearer mock-jwt-token',
          }),
        } as Request,
        environment: 'development',
        isProduction: false,
      };

      const decoded = await authenticate(mockContext);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe('dev-user');
    });

    it('should throw error if no token provided', async () => {
      const mockContext: Context = {
        req: {
          headers: new Headers(),
        } as Request,
        environment: 'development',
        isProduction: false,
      };

      await expect(authenticate(mockContext)).rejects.toThrow(TRPCError);
      await expect(authenticate(mockContext)).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });

    it('should throw error for invalid token', async () => {
      const mockContext: Context = {
        req: {
          headers: new Headers({
            'authorization': 'invalid-token',
          }),
        } as Request,
        environment: 'development',
        isProduction: false,
      };

      await expect(authenticate(mockContext)).rejects.toThrow(TRPCError);
    });
  });

  describe('requireRole', () => {
    it('should allow user with correct role', () => {
      const user: DecodedToken = {
        userId: 'admin-1',
        email: 'admin@example.com',
        role: 'admin',
      };

      expect(() => requireRole(user, ['admin'])).not.toThrow();
    });

    it('should allow user with any of the allowed roles', () => {
      const user: DecodedToken = {
        userId: 'mechanic-1',
        email: 'mechanic@example.com',
        role: 'mechanic',
      };

      expect(() => requireRole(user, ['admin', 'mechanic'])).not.toThrow();
    });

    it('should throw error for unauthorized role', () => {
      const user: DecodedToken = {
        userId: 'customer-1',
        email: 'customer@example.com',
        role: 'customer',
      };

      expect(() => requireRole(user, ['admin'])).toThrow(TRPCError);
      expect(() => requireRole(user, ['admin'])).toThrow(
        expect.objectContaining({ code: 'FORBIDDEN' })
      );
    });

    it('should throw error if role is not in allowed list', () => {
      const user: DecodedToken = {
        userId: 'customer-1',
        email: 'customer@example.com',
        role: 'customer',
      };

      expect(() => requireRole(user, ['admin', 'mechanic'])).toThrow(TRPCError);
    });
  });
});
