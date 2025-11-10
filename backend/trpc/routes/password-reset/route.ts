import { z } from 'zod';
import { publicProcedure, router } from '../../trpc';
import { TRPCError } from '@trpc/server';
import {
  sendPasswordResetEmail,
  verifyResetToken,
  resetPassword,
  getResetAttemptStatus,
} from '../../../services/password-reset';
import { createAuthMiddleware, requireRole } from '../../../middleware/auth';

/**
 * Password Reset Router
 * Handles secure password reset flow with email verification
 */

const authedProcedure = publicProcedure.use(createAuthMiddleware());

export const passwordResetRouter = router({
  /**
   * Request password reset email
   * Public endpoint - no authentication required
   */
  requestReset: publicProcedure
    .input(z.object({
      email: z.string().email('Invalid email address').toLowerCase(),
    }))
    .mutation(async ({ input }) => {
      try {
        const result = await sendPasswordResetEmail(input.email);

        // Always return success to prevent email enumeration
        // Actual success/failure is handled internally
        return {
          success: true,
          message: result.message,
        };
      } catch (error: any) {
        // Still return success to prevent email enumeration
        console.error('Password reset request error:', error);
        return {
          success: true,
          message: 'If an account exists with that email, a password reset link has been sent.',
        };
      }
    }),

  /**
   * Verify reset token validity
   * Public endpoint - validates token without authentication
   */
  verifyToken: publicProcedure
    .input(z.object({
      token: z.string().min(1, 'Token is required'),
    }))
    .query(async ({ input }) => {
      try {
        const verification = await verifyResetToken(input.token);

        if (!verification.valid) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: verification.error || 'Invalid or expired reset token',
          });
        }

        return {
          valid: true,
          message: 'Token is valid',
        };
      } catch (error: any) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid or expired reset token',
        });
      }
    }),

  /**
   * Reset password with token
   * Public endpoint - uses token for authentication
   */
  resetPassword: publicProcedure
    .input(z.object({
      token: z.string().min(1, 'Token is required'),
      newPassword: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(128, 'Password must be less than 128 characters')
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
          'Password must contain at least one uppercase letter, one lowercase letter, and one number'
        ),
      confirmPassword: z.string().min(1, 'Password confirmation is required'),
    }))
    .mutation(async ({ input }) => {
      try {
        // Validate password match
        if (input.newPassword !== input.confirmPassword) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Passwords do not match',
          });
        }

        const result = await resetPassword(input.token, input.newPassword);

        if (!result.success) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: result.message,
          });
        }

        return {
          success: true,
          message: result.message,
        };
      } catch (error: any) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to reset password. Please try again.',
        });
      }
    }),

  /**
   * Change password (for authenticated users)
   * Requires current password for verification
   */
  changePassword: authedProcedure
    .input(z.object({
      currentPassword: z.string().min(1, 'Current password is required'),
      newPassword: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(128, 'Password must be less than 128 characters')
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
          'Password must contain at least one uppercase letter, one lowercase letter, and one number'
        ),
      confirmPassword: z.string().min(1, 'Password confirmation is required'),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const bcrypt = require('bcryptjs');

        // Validate password match
        if (input.newPassword !== input.confirmPassword) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'New passwords do not match',
          });
        }

        // Get user with password hash
        const { prisma } = require('../../../../lib/prisma');
        const user = await prisma.user.findUnique({
          where: { id: ctx.user.id },
          select: { passwordHash: true },
        });

        if (!user) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found',
          });
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(
          input.currentPassword,
          user.passwordHash
        );

        if (!isValidPassword) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Current password is incorrect',
          });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(input.newPassword, 12);

        // Update password
        await prisma.user.update({
          where: { id: ctx.user.id },
          data: { passwordHash: hashedPassword },
        });

        // TODO: Invalidate all other sessions (requires proper session management)

        return {
          success: true,
          message: 'Password changed successfully',
        };
      } catch (error: any) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to change password. Please try again.',
        });
      }
    }),

  /**
   * Get reset attempt status (admin only)
   */
  getResetAttempts: authedProcedure
    .use(requireRole('ADMIN'))
    .query(async () => {
      try {
        const attempts = getResetAttemptStatus();
        return { attempts };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get reset attempt status',
        });
      }
    }),

  /**
   * Validate password strength
   * Helper endpoint for real-time password validation
   */
  validatePassword: publicProcedure
    .input(z.object({
      password: z.string(),
    }))
    .query(({ input }) => {
      const password = input.password;
      const checks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      };

      const strength = Object.values(checks).filter(Boolean).length;

      return {
        valid: checks.length && checks.uppercase && checks.lowercase && checks.number,
        checks,
        strength: strength <= 2 ? 'weak' : strength === 3 ? 'medium' : strength === 4 ? 'strong' : 'very strong',
        suggestions: [
          !checks.length && 'Use at least 8 characters',
          !checks.uppercase && 'Include at least one uppercase letter',
          !checks.lowercase && 'Include at least one lowercase letter',
          !checks.number && 'Include at least one number',
          !checks.special && 'Consider adding special characters for extra security',
        ].filter(Boolean),
      };
    }),
});
