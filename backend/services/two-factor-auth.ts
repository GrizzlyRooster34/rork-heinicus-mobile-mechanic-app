import * as crypto from 'crypto';
import { authenticator } from 'otplib';
import { prisma } from '../../lib/prisma';
import { validatedEnv } from '../env-validation';

/**
 * Two-Factor Authentication Service
 * Implements TOTP-based 2FA with backup codes
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

  // SMS (for future Twilio integration)
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
  // For now, return the URI as-is
  // In production, use qrcode library to generate actual QR code
  // Example: import QRCode from 'qrcode';
  // return await QRCode.toDataURL(uri);

  // For development, return a base64 encoded placeholder
  // Frontend should use a QR code library to generate the visual QR code
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
 * SMS-based 2FA (for future implementation with Twilio)
 */
export interface SMSVerification {
  code: string;
  expiresAt: Date;
  attempts: number;
}

// In-memory SMS code storage (use Redis in production)
const smsVerificationStore = new Map<string, SMSVerification>();

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
 * Send SMS verification code (placeholder for Twilio integration)
 */
export async function sendSMSVerificationCode(
  userId: string,
  phoneNumber: string
): Promise<{ success: boolean; expiresAt: Date }> {
  const code = generateSMSCode();
  const expiresAt = new Date();
  expiresAt.setMinutes(
    expiresAt.getMinutes() + TWO_FACTOR_CONFIG.sms.expirationMinutes
  );

  // Store verification code
  smsVerificationStore.set(userId, {
    code,
    expiresAt,
    attempts: 0,
  });

  // TODO: Integrate with Twilio
  // Example:
  // const twilioClient = twilio(validatedEnv.TWILIO_ACCOUNT_SID, validatedEnv.TWILIO_AUTH_TOKEN);
  // await twilioClient.messages.create({
  //   body: `Your Heinicus verification code is: ${code}. Valid for ${TWO_FACTOR_CONFIG.sms.expirationMinutes} minutes.`,
  //   from: validatedEnv.TWILIO_PHONE_NUMBER,
  //   to: phoneNumber,
  // });

  console.log(`SMS code for ${phoneNumber}: ${code} (expires at ${expiresAt.toISOString()})`);

  return { success: true, expiresAt };
}

/**
 * Verify SMS code
 */
export function verifySMSCode(userId: string, code: string): boolean {
  const verification = smsVerificationStore.get(userId);

  if (!verification) {
    return false;
  }

  // Check expiration
  if (new Date() > verification.expiresAt) {
    smsVerificationStore.delete(userId);
    return false;
  }

  // Check max attempts
  verification.attempts++;
  if (verification.attempts > TWO_FACTOR_CONFIG.sms.maxAttempts) {
    smsVerificationStore.delete(userId);
    return false;
  }

  // Verify code
  if (verification.code === code) {
    smsVerificationStore.delete(userId);
    return true;
  }

  return false;
}

/**
 * Clean up expired SMS codes (should be called periodically)
 */
export function cleanupExpiredSMSCodes(): void {
  const now = new Date();

  for (const [userId, verification] of smsVerificationStore.entries()) {
    if (now > verification.expiresAt) {
      smsVerificationStore.delete(userId);
    }
  }
}

// Auto-cleanup every 5 minutes
setInterval(cleanupExpiredSMSCodes, 5 * 60 * 1000);

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
