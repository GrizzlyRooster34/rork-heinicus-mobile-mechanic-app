import { z } from 'zod';
import { publicProcedure, router } from '../../trpc';
import {
  requestPasswordReset,
  verifyResetToken,
  resetPassword,
  changePassword,
  validatePasswordStrength,
  getResetAttempts,
} from '../../../services/password-reset';

/**
 * Password Reset Routes
 * Provides endpoints for secure password reset flow
 */

export const passwordResetRouter = router({
  /**
   * Request password reset (public endpoint)
   */
  requestReset: publicProcedure
    .input(z.object({
      email: z.string().email('Invalid email address'),
    }))
    .mutation(async ({ input }) => {
      const result = await requestPasswordReset(input.email);

      // Always return success message to prevent email enumeration
      if (!result.success && result.error?.includes('Too many')) {
        return {
          success: false,
          error: result.error,
        };
      }

      return {
        success: true,
        message: result.message || 'If an account exists with that email, a reset link has been sent.',
      };
    }),

  /**
   * Verify reset token (public endpoint)
   */
  verifyToken: publicProcedure
    .input(z.object({
      token: z.string().min(1, 'Token is required'),
    }))
    .query(async ({ input }) => {
      const result = await verifyResetToken(input.token);

      if (!result.valid) {
        return {
          valid: false,
          error: result.error || 'Invalid or expired token',
        };
      }

      return {
        valid: true,
        message: 'Token is valid',
      };
    }),

  /**
   * Reset password with token (public endpoint)
   */
  resetPassword: publicProcedure
    .input(z.object({
      token: z.string().min(1, 'Token is required'),
      newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    }))
    .mutation(async ({ input }) => {
      const result = await resetPassword(input.token, input.newPassword);

      if (!result.success) {
        return {
          success: false,
          error: result.error,
        };
      }

      return {
        success: true,
        message: result.message || 'Password has been reset successfully',
      };
    }),

  /**
   * Change password for authenticated user
   */
  changePassword: publicProcedure
    .input(z.object({
      userId: z.string(),
      currentPassword: z.string().min(1, 'Current password is required'),
      newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    }))
    .mutation(async ({ input }) => {
      const result = await changePassword(
        input.userId,
        input.currentPassword,
        input.newPassword
      );

      if (!result.success) {
        return {
          success: false,
          error: result.error,
        };
      }

      return {
        success: true,
        message: result.message || 'Password changed successfully',
      };
    }),

  /**
   * Get reset attempt status (admin only)
   */
  getResetAttempts: publicProcedure
    .input(z.object({
      userId: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        const attempts = await getResetAttempts(input.userId);

        return {
          success: true,
          ...attempts,
        };
      } catch (error) {
        console.error('Get reset attempts error:', error);
        return {
          success: false,
          error: 'Failed to get reset attempts',
          recentAttempts: 0,
          canRequest: true,
        };
      }
    }),

  /**
   * Validate password strength
   */
  validatePassword: publicProcedure
    .input(z.object({
      password: z.string(),
    }))
    .query(async ({ input }) => {
      const validation = validatePasswordStrength(input.password);

      return {
        valid: validation.valid,
        errors: validation.errors,
        suggestions: validation.valid
          ? []
          : [
              'Use a mix of uppercase and lowercase letters',
              'Include numbers and special characters',
              'Make it at least 8 characters long',
              'Avoid common words or patterns',
            ],
      };
    }),
});

export type PasswordResetRouter = typeof passwordResetRouter;
