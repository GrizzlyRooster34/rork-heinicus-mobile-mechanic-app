import { z } from 'zod';
import { publicProcedure, router } from '../../trpc';
import { TRPCError } from '@trpc/server';
import {
  generateTOTPSecret,
  generateTOTPUri,
  generateQRCodeDataURL,
  enableTwoFactorAuth,
  disableTwoFactorAuth,
  verify2FAToken,
  get2FAStatus,
  getRemainingBackupCodesCount,
  regenerateBackupCodes,
  verifyTOTPToken,
  sendSMSVerificationCode,
  verifySMSCode,
} from '../../../services/two-factor-auth';
import { createAuthMiddleware } from '../../../middleware/auth';

/**
 * Two-Factor Authentication Router
 * Handles TOTP-based 2FA setup, verification, and management
 */

const authedProcedure = publicProcedure.use(createAuthMiddleware());

export const twoFactorRouter = router({
  /**
   * Get 2FA status for current user
   */
  getStatus: authedProcedure.query(async ({ ctx }) => {
    try {
      const status = await get2FAStatus(ctx.user.id);
      return status;
    } catch (error: any) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to get 2FA status: ${error.message}`,
      });
    }
  }),

  /**
   * Generate TOTP secret for 2FA setup
   */
  generateSecret: authedProcedure
    .mutation(async ({ ctx }) => {
      try {
        const secret = generateTOTPSecret();
        const uri = generateTOTPUri(ctx.user.email, secret);
        const qrCodeDataUrl = await generateQRCodeDataURL(uri);

        return {
          secret,
          qrCodeUri: uri,
          qrCodeDataUrl,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to generate 2FA secret: ${error.message}`,
        });
      }
    }),

  /**
   * Verify TOTP token and enable 2FA
   */
  enable: authedProcedure
    .input(z.object({
      secret: z.string().min(16, 'Invalid secret'),
      token: z.string().length(6, 'Token must be 6 digits'),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify the token before enabling
        const isValid = verifyTOTPToken(input.token, input.secret);

        if (!isValid) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid verification code. Please try again.',
          });
        }

        // Enable 2FA and generate backup codes
        const { backupCodes } = await enableTwoFactorAuth(ctx.user.id, input.secret);

        return {
          success: true,
          backupCodes,
          message: '2FA has been enabled successfully. Save your backup codes in a secure location.',
        };
      } catch (error: any) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to enable 2FA: ${error.message}`,
        });
      }
    }),

  /**
   * Disable 2FA for current user
   */
  disable: authedProcedure
    .input(z.object({
      token: z.string().min(1, 'Token is required'),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify token before disabling
        const result = await verify2FAToken(ctx.user.id, input.token);

        if (!result.verified) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid verification code. Cannot disable 2FA.',
          });
        }

        await disableTwoFactorAuth(ctx.user.id);

        return {
          success: true,
          message: '2FA has been disabled successfully.',
        };
      } catch (error: any) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to disable 2FA: ${error.message}`,
        });
      }
    }),

  /**
   * Verify 2FA token (TOTP or backup code)
   */
  verify: authedProcedure
    .input(z.object({
      token: z.string().min(1, 'Token is required'),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await verify2FAToken(ctx.user.id, input.token);

        if (!result.verified) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid verification code. Please try again.',
          });
        }

        return {
          success: true,
          method: result.method,
          message: result.method === 'backup'
            ? 'Verified using backup code. Consider regenerating your backup codes.'
            : 'Verification successful.',
        };
      } catch (error: any) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to verify token: ${error.message}`,
        });
      }
    }),

  /**
   * Get remaining backup codes count
   */
  getBackupCodesCount: authedProcedure.query(async ({ ctx }) => {
    try {
      const count = await getRemainingBackupCodesCount(ctx.user.id);
      return { count };
    } catch (error: any) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to get backup codes count: ${error.message}`,
      });
    }
  }),

  /**
   * Regenerate backup codes
   */
  regenerateBackupCodes: authedProcedure
    .input(z.object({
      token: z.string().min(1, 'Token is required for verification'),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify token before regenerating
        const result = await verify2FAToken(ctx.user.id, input.token);

        if (!result.verified) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid verification code. Cannot regenerate backup codes.',
          });
        }

        const backupCodes = await regenerateBackupCodes(ctx.user.id);

        return {
          success: true,
          backupCodes,
          message: 'New backup codes generated. Save them in a secure location.',
        };
      } catch (error: any) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to regenerate backup codes: ${error.message}`,
        });
      }
    }),

  /**
   * Send SMS verification code (for future Twilio integration)
   */
  sendSMSCode: authedProcedure
    .input(z.object({
      phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await sendSMSVerificationCode(ctx.user.id, input.phoneNumber);

        return {
          success: result.success,
          expiresAt: result.expiresAt,
          message: `Verification code sent to ${input.phoneNumber}. Valid for 10 minutes.`,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to send SMS code: ${error.message}`,
        });
      }
    }),

  /**
   * Verify SMS code
   */
  verifySMSCode: authedProcedure
    .input(z.object({
      code: z.string().length(6, 'Code must be 6 digits'),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const isValid = verifySMSCode(ctx.user.id, input.code);

        if (!isValid) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid or expired verification code.',
          });
        }

        return {
          success: true,
          message: 'SMS verification successful.',
        };
      } catch (error: any) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to verify SMS code: ${error.message}`,
        });
      }
    }),
});
