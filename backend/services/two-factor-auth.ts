import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma';

/**
 * Two-Factor Authentication Service
 * Provides TOTP-based 2FA functionality with backup codes
 */

export interface TwoFactorSecret {
  secret: string;
  qrCodeUri: string;
  backupCodes?: string[];
}

/**
 * Generate a new TOTP secret for a user
 */
export async function generateTOTPSecret(
  userId: string,
  userEmail: string
): Promise<TwoFactorSecret> {
  // Generate secret
  const secret = authenticator.generateSecret();

  // Generate QR code URI for authenticator apps
  const appName = 'Heinicus Mobile Mechanic';
  const qrCodeUri = authenticator.keyuri(userEmail, appName, secret);

  return {
    secret,
    qrCodeUri,
  };
}

/**
 * Generate QR code data URL from URI
 */
export async function generateQRCodeDataURL(uri: string): Promise<string> {
  try {
    return await QRCode.toDataURL(uri);
  } catch (error) {
    console.error('QR code generation error:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Verify a TOTP token against a secret
 */
export function verifyTOTPToken(token: string, secret: string): boolean {
  try {
    // Allow a window of ±1 time step (30 seconds each) for clock drift
    return authenticator.verify({ token, secret });
  } catch (error) {
    console.error('TOTP verification error:', error);
    return false;
  }
}

/**
 * Generate backup codes for 2FA
 * Returns 10 backup codes that can be used once each
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
  }

  return codes;
}

/**
 * Hash backup codes before storing in database
 */
export async function hashBackupCodes(codes: string[]): Promise<string[]> {
  const hashedCodes = await Promise.all(
    codes.map(code => bcrypt.hash(code, 10))
  );
  return hashedCodes;
}

/**
 * Save backup codes to database for a user
 */
export async function saveBackupCodes(
  userId: string,
  codes: string[]
): Promise<void> {
  const hashedCodes = await hashBackupCodes(codes);

  await prisma.twoFactorBackupCode.createMany({
    data: hashedCodes.map(hashedCode => ({
      userId,
      code: hashedCode,
      used: false,
    })),
  });
}

/**
 * Enable 2FA for a user
 */
export async function enableTwoFactor(
  userId: string,
  secret: string,
  token: string
): Promise<{ success: boolean; backupCodes?: string[]; error?: string }> {
  // Verify the token before enabling
  if (!verifyTOTPToken(token, secret)) {
    return {
      success: false,
      error: 'Invalid verification code. Please try again.',
    };
  }

  try {
    // Generate backup codes
    const backupCodes = generateBackupCodes(10);

    // Update user and save backup codes in a transaction
    await prisma.$transaction(async (tx) => {
      // Update user
      await tx.user.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: true,
          twoFactorSecret: secret,
        },
      });

      // Save hashed backup codes
      const hashedCodes = await hashBackupCodes(backupCodes);
      await tx.twoFactorBackupCode.createMany({
        data: hashedCodes.map(hashedCode => ({
          userId,
          code: hashedCode,
          used: false,
        })),
      });
    });

    console.log(`2FA enabled for user ${userId}`);

    return {
      success: true,
      backupCodes,
    };
  } catch (error) {
    console.error('Enable 2FA error:', error);
    return {
      success: false,
      error: 'Failed to enable two-factor authentication',
    };
  }
}

/**
 * Disable 2FA for a user
 */
export async function disableTwoFactor(
  userId: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get user's 2FA secret
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return {
        success: false,
        error: 'Two-factor authentication is not enabled',
      };
    }

    // Verify the token before disabling
    if (!verifyTOTPToken(token, user.twoFactorSecret)) {
      return {
        success: false,
        error: 'Invalid verification code',
      };
    }

    // Disable 2FA and delete backup codes in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
        },
      });

      // Delete all backup codes
      await tx.twoFactorBackupCode.deleteMany({
        where: { userId },
      });
    });

    console.log(`2FA disabled for user ${userId}`);

    return { success: true };
  } catch (error) {
    console.error('Disable 2FA error:', error);
    return {
      success: false,
      error: 'Failed to disable two-factor authentication',
    };
  }
}

/**
 * Verify a 2FA code (TOTP or backup code)
 */
export async function verifyTwoFactorCode(
  userId: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        twoFactorSecret: true,
        twoFactorEnabled: true,
        backupCodes: {
          where: { used: false },
        },
      },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return {
        success: false,
        error: 'Two-factor authentication is not enabled',
      };
    }

    // First, try TOTP verification
    if (verifyTOTPToken(code, user.twoFactorSecret)) {
      return { success: true };
    }

    // If TOTP fails, try backup codes
    for (const backupCode of user.backupCodes) {
      const isValid = await bcrypt.compare(code, backupCode.code);

      if (isValid) {
        // Mark backup code as used
        await prisma.twoFactorBackupCode.update({
          where: { id: backupCode.id },
          data: {
            used: true,
            usedAt: new Date(),
          },
        });

        console.log(`Backup code used for user ${userId}`);
        return { success: true };
      }
    }

    return {
      success: false,
      error: 'Invalid verification code',
    };
  } catch (error) {
    console.error('Verify 2FA code error:', error);
    return {
      success: false,
      error: 'Failed to verify code',
    };
  }
}

/**
 * Get remaining backup codes count for a user
 */
export async function getBackupCodesCount(userId: string): Promise<number> {
  const count = await prisma.twoFactorBackupCode.count({
    where: {
      userId,
      used: false,
    },
  });

  return count;
}

/**
 * Regenerate backup codes for a user
 */
export async function regenerateBackupCodes(
  userId: string,
  token: string
): Promise<{ success: boolean; backupCodes?: string[]; error?: string }> {
  try {
    // Verify user has 2FA enabled
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return {
        success: false,
        error: 'Two-factor authentication is not enabled',
      };
    }

    // Verify the token
    if (!verifyTOTPToken(token, user.twoFactorSecret)) {
      return {
        success: false,
        error: 'Invalid verification code',
      };
    }

    // Generate new backup codes
    const newBackupCodes = generateBackupCodes(10);

    // Delete old codes and save new ones in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete all existing backup codes
      await tx.twoFactorBackupCode.deleteMany({
        where: { userId },
      });

      // Save new hashed backup codes
      const hashedCodes = await hashBackupCodes(newBackupCodes);
      await tx.twoFactorBackupCode.createMany({
        data: hashedCodes.map(hashedCode => ({
          userId,
          code: hashedCode,
          used: false,
        })),
      });
    });

    console.log(`Backup codes regenerated for user ${userId}`);

    return {
      success: true,
      backupCodes: newBackupCodes,
    };
  } catch (error) {
    console.error('Regenerate backup codes error:', error);
    return {
      success: false,
      error: 'Failed to regenerate backup codes',
    };
  }
}

/**
 * Get 2FA status for a user
 */
export async function getTwoFactorStatus(userId: string): Promise<{
  enabled: boolean;
  backupCodesRemaining?: number;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      twoFactorEnabled: true,
      backupCodes: {
        where: { used: false },
      },
    },
  });

  if (!user) {
    return { enabled: false };
  }

  return {
    enabled: user.twoFactorEnabled,
    backupCodesRemaining: user.backupCodes.length,
  };
}

/**
 * Send SMS code (placeholder for future Twilio integration)
 */
export async function sendSMSCode(
  phoneNumber: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  // TODO: Integrate with Twilio or other SMS provider
  console.log(`SMS code would be sent to ${phoneNumber}: ${code}`);

  return {
    success: false,
    error: 'SMS 2FA not yet implemented. Please use authenticator app.',
  };
}
