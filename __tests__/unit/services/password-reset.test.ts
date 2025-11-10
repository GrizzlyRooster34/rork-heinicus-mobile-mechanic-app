/**
 * Unit Tests for Password Reset Service
 */

import {
  sendPasswordResetEmail,
  verifyResetToken,
  resetPassword,
  cleanupExpiredResetTokens,
  getResetAttemptStatus,
} from '../../../backend/services/password-reset';
import { prisma } from '../../../lib/prisma';
import { generateResetToken } from '../../../backend/middleware/auth';
import * as crypto from 'crypto';

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn((password) => Promise.resolve(`hashed_${password}`)),
  compare: jest.fn(() => Promise.resolve(true)),
}));

describe('Password Reset Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendPasswordResetEmail', () => {
    it('should send reset email for existing active user', async () => {
      const mockUser = {
        id: 'user-123',
        firstName: 'John',
        email: 'john@example.com',
        isActive: true,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.passwordReset.create as jest.Mock).mockResolvedValue({
        id: 'reset-123',
        userId: mockUser.id,
      });

      const result = await sendPasswordResetEmail('john@example.com');

      expect(result.success).toBe(true);
      expect(result.message).toContain('password reset link has been sent');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'john@example.com' },
        select: { id: true, firstName: true, email: true, isActive: true },
      });
      expect(prisma.passwordReset.create).toHaveBeenCalled();
    });

    it('should not reveal non-existent user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await sendPasswordResetEmail('nonexistent@example.com');

      expect(result.success).toBe(true);
      expect(result.message).toContain('If an account exists');
      expect(prisma.passwordReset.create).not.toHaveBeenCalled();
    });

    it('should not reveal inactive user', async () => {
      const mockUser = {
        id: 'user-123',
        firstName: 'John',
        email: 'john@example.com',
        isActive: false,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await sendPasswordResetEmail('john@example.com');

      expect(result.success).toBe(true);
      expect(result.message).toContain('If an account exists');
      expect(prisma.passwordReset.create).not.toHaveBeenCalled();
    });

    it('should enforce rate limiting after max attempts', async () => {
      const mockUser = {
        id: 'user-123',
        firstName: 'John',
        email: 'ratelimit@example.com',
        isActive: true,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.passwordReset.create as jest.Mock).mockResolvedValue({});

      // Make 3 attempts (max)
      await sendPasswordResetEmail('ratelimit@example.com');
      await sendPasswordResetEmail('ratelimit@example.com');
      await sendPasswordResetEmail('ratelimit@example.com');

      // 4th attempt should be rate limited
      const result = await sendPasswordResetEmail('ratelimit@example.com');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Too many reset attempts');
    });
  });

  describe('verifyResetToken', () => {
    it('should verify valid reset token', async () => {
      const token = 'valid-reset-token';
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      // Mock JWT verification (returns valid payload)
      jest.mock('../../../backend/middleware/auth', () => ({
        ...jest.requireActual('../../../backend/middleware/auth'),
        verifyToken: jest.fn(() => ({
          email: 'test@example.com',
          type: 'reset',
        })),
      }));

      (prisma.passwordReset.findFirst as jest.Mock).mockResolvedValue({
        id: 'reset-123',
        token: hashedToken,
        used: false,
        expiresAt: new Date(Date.now() + 3600000), // 1 hour in future
        user: {
          id: 'user-123',
          isActive: true,
        },
      });

      const result = await verifyResetToken(token);

      expect(result.valid).toBe(true);
      expect(result.userId).toBe('user-123');
    });

    it('should reject expired token', async () => {
      (prisma.passwordReset.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await verifyResetToken('expired-token');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid or expired');
    });

    it('should reject already used token', async () => {
      (prisma.passwordReset.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await verifyResetToken('used-token');

      expect(result.valid).toBe(false);
    });

    it('should reject token for inactive user', async () => {
      const token = 'token-for-inactive-user';
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      (prisma.passwordReset.findFirst as jest.Mock).mockResolvedValue({
        id: 'reset-123',
        token: hashedToken,
        used: false,
        expiresAt: new Date(Date.now() + 3600000),
        user: {
          id: 'user-123',
          isActive: false,
        },
      });

      const result = await verifyResetToken(token);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('inactive');
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      const token = 'valid-token';
      const newPassword = 'NewSecurePass123!';
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      // Mock verification
      jest.mock('../../../backend/middleware/auth', () => ({
        ...jest.requireActual('../../../backend/middleware/auth'),
        verifyToken: jest.fn(() => ({
          email: 'test@example.com',
          type: 'reset',
        })),
      }));

      (prisma.passwordReset.findFirst as jest.Mock).mockResolvedValue({
        id: 'reset-123',
        token: hashedToken,
        used: false,
        expiresAt: new Date(Date.now() + 3600000),
        user: {
          id: 'user-123',
          isActive: true,
        },
      });

      (prisma.$transaction as jest.Mock).mockResolvedValue([
        { id: 'user-123' },
        { count: 1 },
      ]);

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
      });

      const result = await resetPassword(token, newPassword);

      expect(result.success).toBe(true);
      expect(result.message).toContain('successfully');
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should reject invalid token', async () => {
      (prisma.passwordReset.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await resetPassword('invalid-token', 'NewPass123!');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid or expired');
    });

    it('should hash password before storing', async () => {
      const bcrypt = require('bcryptjs');
      const newPassword = 'NewSecurePass123!';

      const hashedToken = crypto.createHash('sha256').update('token').digest('hex');

      (prisma.passwordReset.findFirst as jest.Mock).mockResolvedValue({
        id: 'reset-123',
        token: hashedToken,
        used: false,
        expiresAt: new Date(Date.now() + 3600000),
        user: {
          id: 'user-123',
          isActive: true,
        },
      });

      (prisma.$transaction as jest.Mock).mockResolvedValue([
        { id: 'user-123' },
        { count: 1 },
      ]);

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
      });

      await resetPassword('token', newPassword);

      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 12);
    });
  });

  describe('cleanupExpiredResetTokens', () => {
    it('should delete expired tokens', async () => {
      (prisma.passwordReset.deleteMany as jest.Mock).mockResolvedValue({ count: 5 });

      const count = await cleanupExpiredResetTokens();

      expect(count).toBe(5);
      expect(prisma.passwordReset.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: {
            lt: expect.any(Date),
          },
        },
      });
    });

    it('should handle cleanup errors gracefully', async () => {
      (prisma.passwordReset.deleteMany as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const count = await cleanupExpiredResetTokens();

      expect(count).toBe(0);
    });
  });

  describe('getResetAttemptStatus', () => {
    it('should return reset attempt status', async () => {
      // Make some attempts first
      const mockUser = {
        id: 'user-123',
        firstName: 'John',
        email: 'test@example.com',
        isActive: true,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.passwordReset.create as jest.Mock).mockResolvedValue({});

      await sendPasswordResetEmail('test@example.com');

      const status = getResetAttemptStatus();

      expect(Array.isArray(status)).toBe(true);
      if (status.length > 0) {
        expect(status[0]).toHaveProperty('email');
        expect(status[0]).toHaveProperty('attempts');
        expect(status[0]).toHaveProperty('lastAttempt');
      }
    });
  });
});
