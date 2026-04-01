import * as crypto from 'crypto';
import { authenticator } from 'otplib';
import { prisma } from '../../lib/prisma';
import { validatedEnv } from '../env-validation';
import twilio from 'twilio';

/**
 * Two-Factor Authentication Service
 * Implements TOTP-based 2FA with backup codes and SMS delivery via Twilio
 */

/**
 * 2FA configuration
 */
export const TWO_FACTOR_CONFIG = {
  // TOTP settings
  totp: {
    issuer: 'Heinicus Mobile Mechanic',
    algorithm: 'sha1' as const,
    digits: 6,
    period: 30, // seconds
    window: 1, // Allow 1 step before/after for clock drift
  },

  // Backup codes
  backupCodes: {
    count: 10,
    length: 8,
    charset: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  },

  // SMS
  sms: {
    codeLength: 6,
    expirationMinutes: 10,
    maxAttempts: 3,
  },
};

/**
 * Configure otplib with our settings
 */
authenticator.options = {
  digits: TWO_FACTOR_CONFIG.totp.digits,
  step: TWO_FACTOR_CONFIG.totp.period,
  window: TWO_FACTOR_CONFIG.totp.window,
};

/**
 * Generate a secret key for TOTP
 */
export function generateTOTPSecret(): string {
  return authenticator.generateSecret();
}

/**
 * Generate TOTP URI for QR code generation
 */
export function generateTOTPUri(
  email: string,
  secret: string,
  issuer: string = TWO_FACTOR_CONFIG.totp.issuer
): string {
  return authenticator.keyuri(email, issuer, secret);
}

/**
 * Generate QR code data URL for TOTP setup
 * Returns a data URL that can be displayed as an image
 */
export async function generateQRCodeDataURL(uri: string): Promise<string> {
  // In production, use qrcode library to generate actual QR code
  // This is a placeholder for development
  return uri;
}

/**
 * Verify TOTP token
 */
export function verifyTOTPToken(token: string, secret: string): boolean {
  try {
    return authenticator.verify({
      token: token.replace(/\s/g, ''), // Remove any spaces
      secret,
    });
  } catch (error) {
    console.error('TOTP verification error:', error);
    return false;
  }
}

/**
 * Generate backup codes
 */
export function generateBackupCodes(
  count: number = TWO_FACTOR_CONFIG.backupCodes.count
): string[] {
  const codes: string[] = [];
  const { length, charset } = TWO_FACTOR_CONFIG.backupCodes;

  for (let i = 0; i < count; i++) {
    let code = '';
    for (let j = 0; j < length; j++) {
      const randomIndex = crypto.randomInt(0, charset.length);
      code += charset[randomIndex];
    }
    // Format as XXXX-XXXX for readability
    const formatted = `${code.slice(0, 4)}-${code.slice(4)}`;
    codes.push(formatted);
  }

  return codes;
}

/**
 * Hash backup code for storage
 */
export function hashBackupCode(code: string): string {
  // Remove hyphens before hashing
  const normalized = code.replace(/-/g, '');
  return crypto
    .createHash('sha256')
    .update(normalized)
    .digest('hex');
}

/**
 * Verify backup code
 */
export async function verifyBackupCode(
  userId: string,
  code: string
): Promise<boolean> {
  const hashedCode = hashBackupCode(code);

  // Find the backup code in database
  const backupCode = await prisma.twoFactorBackupCode.findFirst({
    where: {
      userId,
      code: hashedCode,
      used: false,
    },
  });

  if (!backupCode) {
    return false;
  }

  // Mark as used
  await prisma.twoFactorBackupCode.update({
    where: { id: backupCode.id },
    data: { used: true, usedAt: new Date() },
  });

  return true;
}

/**
 * Enable 2FA for user
 */
export async function enableTwoFactorAuth(
  userId: string,
  secret: string
): Promise<{ backupCodes: string[] }> {
  // Generate backup codes
  const backupCodes = generateBackupCodes();
  const hashedCodes = backupCodes.map(code => ({
    userId,
    code: hashBackupCode(code),
    used: false,
  }));

  // Update user and save backup codes in transaction
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: secret,
      },
    }),
    prisma.twoFactorBackupCode.createMany({
      data: hashedCodes,
    }),
  ]);

  return { backupCodes };
}

/**
 * Disable 2FA for user
 */
export async function disableTwoFactorAuth(userId: string): Promise<void> {
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    }),
    prisma.twoFactorBackupCode.deleteMany({
      where: { userId },
    }),
  ]);
}

/**
 * Verify 2FA token (TOTP or backup code)
 */
export async function verify2FAToken(
  userId: string,
  token: string
): Promise<{ verified: boolean; method: 'totp' | 'backup' | null }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorEnabled: true, twoFactorSecret: true },
  });

  if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
    return { verified: false, method: null };
  }

  // Try TOTP verification first
  if (verifyTOTPToken(token, user.twoFactorSecret)) {
    return { verified: true, method: 'totp' };
  }

  // Try backup code verification
  const backupVerified = await verifyBackupCode(userId, token);
  if (backupVerified) {
    return { verified: true, method: 'backup' };
  }

  return { verified: false, method: null };
}

/**
 * Get remaining backup codes count
 */
export async function getRemainingBackupCodesCount(
  userId: string
): Promise<number> {
  return await prisma.twoFactorBackupCode.count({
    where: {
      userId,
      used: false,
    },
  });
}

/**
 * Regenerate backup codes
 */
export async function regenerateBackupCodes(
  userId: string
): Promise<string[]> {
  // Delete old backup codes
  await prisma.twoFactorBackupCode.deleteMany({
    where: { userId },
  });

  // Generate new backup codes
  const backupCodes = generateBackupCodes();
  const hashedCodes = backupCodes.map(code => ({
    userId,
    code: hashBackupCode(code),
    used: false,
  }));

  await prisma.twoFactorBackupCode.createMany({
    data: hashedCodes,
  });

  return backupCodes;
}

/**
 * SMS-based 2FA using Twilio
 */

/**
 * Generate SMS verification code
 */
export function generateSMSCode(): string {
  const { codeLength } = TWO_FACTOR_CONFIG.sms;
  let code = '';

  for (let i = 0; i < codeLength; i++) {
    code += crypto.randomInt(0, 10).toString();
  }

  return code;
}

/**
 * Send SMS verification code using Twilio SDK
 */
export async function sendSMSCode(
  phoneNumber: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !twilioPhoneNumber) {
    console.warn('Twilio credentials not configured. Skipping SMS send.');
    // In development mode, we log the code for testing
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV MODE] SMS code for ${phoneNumber}: ${code}`);
      return { success: true };
    }
    return {
      success: false,
      error: 'SMS service is not configured.',
    };
  }

  try {
    const client = twilio(accountSid, authToken);

    await client.messages.create({
      body: `Your Heinicus verification code is: ${code}. Valid for ${TWO_FACTOR_CONFIG.sms.expirationMinutes} minutes.`,
      from: twilioPhoneNumber,
      to: phoneNumber,
    });

    console.log(`SMS code successfully sent to ${phoneNumber}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to send SMS code:', error);
    return {
      success: false,
      error: 'Failed to send SMS code. Please try again.',
    };
  }
}

/**
 * Store SMS code in database with TTL
 */
export async function storeSmsCode(
  userId: string,
  code: string
): Promise<void> {
  // Invalidate existing unused codes
  await prisma.smsVerificationCode.updateMany({
    where: {
      userId,
      used: false,
    },
    data: {
      used: true,
    },
  });

  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + TWO_FACTOR_CONFIG.sms.expirationMinutes);

  await prisma.smsVerificationCode.create({
    data: {
      userId,
      code, // For simple 6-digit codes, plaintext is common, but hashing is better. 
      // Using plaintext here to match simple verify logic.
      expiresAt,
    },
  });
}

/**
 * Send and store SMS verification code
 */
export async function sendSMSVerificationCode(
  userId: string,
  phoneNumber: string
): Promise<{ success: boolean; expiresAt: Date; error?: string }> {
  const code = generateSMSCode();
  const expiresAt = new Date();
  expiresAt.setMinutes(
    expiresAt.getMinutes() + TWO_FACTOR_CONFIG.sms.expirationMinutes
  );

  try {
    const result = await sendSMSCode(phoneNumber, code);
    
    if (result.success) {
      await storeSmsCode(userId, code);
      return { success: true, expiresAt };
    } else {
      return { success: false, expiresAt, error: result.error };
    }
  } catch (error) {
    console.error('sendSMSVerificationCode error:', error);
    return { success: false, expiresAt, error: 'Internal server error' };
  }
}

/**
 * Verify SMS code checking DB record + expiry
 */
export async function verifySMSCode(
  userId: string, 
  code: string
): Promise<boolean> {
  try {
    const now = new Date();

    const verificationCode = await prisma.smsVerificationCode.findFirst({
      where: {
        userId,
        code,
        used: false,
        expiresAt: {
          gt: now,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!verificationCode) {
      return false;
    }

    // Mark the code as used
    await prisma.smsVerificationCode.update({
      where: { id: verificationCode.id },
      data: { used: true },
    });

    console.log(`SMS code verified for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Verify SMS code error:', error);
    return false;
  }
}

/**
 * Clean up expired SMS codes
 */
export async function cleanupExpiredSMSCodes(): Promise<number> {
  try {
    const result = await prisma.smsVerificationCode.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    return result.count;
  } catch (error) {
    console.error('Cleanup expired SMS codes error:', error);
    return 0;
  }
}

/**
 * Get 2FA status for user
 */
export async function get2FAStatus(userId: string): Promise<{
  enabled: boolean;
  method: '2fa' | 'sms' | null;
  backupCodesRemaining: number;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorEnabled: true },
  });

  if (!user?.twoFactorEnabled) {
    return {
      enabled: false,
      method: null,
      backupCodesRemaining: 0,
    };
  }

  const backupCodesRemaining = await getRemainingBackupCodesCount(userId);

  return {
    enabled: true,
    method: '2fa',
    backupCodesRemaining,
  };
}
