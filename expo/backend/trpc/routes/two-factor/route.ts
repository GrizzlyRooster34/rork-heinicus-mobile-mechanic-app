import { z } from 'zod';
import { publicProcedure, router } from '../../trpc';
import {
  generateTOTPSecret,
  generateQRCodeDataURL,
  enableTwoFactor,
  disableTwoFactor,
  verifyTwoFactorCode,
  getBackupCodesCount,
  regenerateBackupCodes,
  getTwoFactorStatus,
  sendSMSCode,
} from '../../../services/two-factor-auth';

/**
 * Two-Factor Authentication Routes
 * Provides endpoints for 2FA setup, verification, and management
 */

export const twoFactorRouter = router({
  /**
   * Get 2FA status for current user
   */
  getStatus: publicProcedure
    .input(z.object({
      userId: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        const status = await getTwoFactorStatus(input.userId);
        return {
          success: true,
          ...status,
        };
      } catch (error) {
        console.error('Get 2FA status error:', error);
        return {
          success: false,
          error: 'Failed to get 2FA status',
          enabled: false,
        };
      }
    }),

  /**
   * Generate TOTP secret for 2FA setup
   */
  generateSecret: publicProcedure
    .input(z.object({
      userId: z.string(),
      email: z.string().email(),
    }))
    .mutation(async ({ input }) => {
      try {
        const secretData = await generateTOTPSecret(input.userId, input.email);
        const qrCodeDataURL = await generateQRCodeDataURL(secretData.qrCodeUri);

        return {
          success: true,
          secret: secretData.secret,
          qrCodeUri: secretData.qrCodeUri,
          qrCodeDataURL,
        };
      } catch (error) {
        console.error('Generate 2FA secret error:', error);
        return {
          success: false,
          error: 'Failed to generate 2FA secret',
        };
      }
    }),

  /**
   * Enable 2FA for user
   */
  enable: publicProcedure
    .input(z.object({
      userId: z.string(),
      secret: z.string(),
      token: z.string().length(6, '2FA code must be 6 digits'),
    }))
    .mutation(async ({ input }) => {
      const result = await enableTwoFactor(input.userId, input.secret, input.token);

      if (!result.success) {
        return {
          success: false,
          error: result.error,
        };
      }

      return {
        success: true,
        backupCodes: result.backupCodes,
        message: '2FA has been enabled successfully. Save your backup codes in a safe place.',
      };
    }),

  /**
   * Disable 2FA for user
   */
  disable: publicProcedure
    .input(z.object({
      userId: z.string(),
      token: z.string().length(6, '2FA code must be 6 digits'),
    }))
    .mutation(async ({ input }) => {
      const result = await disableTwoFactor(input.userId, input.token);

      if (!result.success) {
        return {
          success: false,
          error: result.error,
        };
      }

      return {
        success: true,
        message: '2FA has been disabled successfully.',
      };
    }),

  /**
   * Verify 2FA token (TOTP or backup code)
   */
  verify: publicProcedure
    .input(z.object({
      userId: z.string(),
      code: z.string().min(6, 'Code must be at least 6 characters'),
    }))
    .mutation(async ({ input }) => {
      const result = await verifyTwoFactorCode(input.userId, input.code);

      if (!result.success) {
        return {
          success: false,
          error: result.error,
        };
      }

      return {
        success: true,
        message: 'Code verified successfully',
      };
    }),

  /**
   * Get remaining backup codes count
   */
  getBackupCodesCount: publicProcedure
    .input(z.object({
      userId: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        const count = await getBackupCodesCount(input.userId);
        return {
          success: true,
          count,
        };
      } catch (error) {
        console.error('Get backup codes count error:', error);
        return {
          success: false,
          error: 'Failed to get backup codes count',
          count: 0,
        };
      }
    }),

  /**
   * Regenerate backup codes
   */
  regenerateBackupCodes: publicProcedure
    .input(z.object({
      userId: z.string(),
      token: z.string().length(6, '2FA code must be 6 digits'),
    }))
    .mutation(async ({ input }) => {
      const result = await regenerateBackupCodes(input.userId, input.token);

      if (!result.success) {
        return {
          success: false,
          error: result.error,
        };
      }

      return {
        success: true,
        backupCodes: result.backupCodes,
        message: 'Backup codes regenerated successfully. Save these in a safe place.',
      };
    }),

  /**
   * Send SMS code (placeholder for future Twilio integration)
   */
  sendSMSCode: publicProcedure
    .input(z.object({
      phoneNumber: z.string(),
    }))
    .mutation(async ({ input }) => {
      // Generate a 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      const result = await sendSMSCode(input.phoneNumber, code);

      if (!result.success) {
        return {
          success: false,
          error: result.error,
        };
      }

      return {
        success: true,
        message: 'SMS code sent successfully',
      };
    }),

  /**
   * Verify SMS code (placeholder)
   */
  verifySMSCode: publicProcedure
    .input(z.object({
      userId: z.string(),
      code: z.string().length(6),
    }))
    .mutation(async ({ input }) => {
      // TODO: Implement SMS code verification with actual storage
      return {
        success: false,
        error: 'SMS verification not yet implemented',
      };
    }),
});

export type TwoFactorRouter = typeof twoFactorRouter;
