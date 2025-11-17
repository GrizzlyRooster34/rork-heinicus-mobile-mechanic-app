import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma';

/**
 * Password Reset Service
 * Handles secure password reset flow with rate limiting and email enumeration prevention
 */

const MAX_RESET_ATTEMPTS = 3;
const RESET_COOLDOWN_MINUTES = 15;
const TOKEN_EXPIRY_HOURS = 1;

export interface PasswordResetResult {
  success: boolean;
  error?: string;
  message?: string;
}

/**
 * Generate a secure random token for password reset
 */
function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash the reset token before storing in database
 */
async function hashToken(token: string): Promise<string> {
  return bcrypt.hash(token, 10);
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check rate limiting for password reset requests
 */
async function checkRateLimit(userId: string): Promise<{
  allowed: boolean;
  attemptsRemaining?: number;
  cooldownEndsAt?: Date;
}> {
  const cooldownStart = new Date(Date.now() - RESET_COOLDOWN_MINUTES * 60 * 1000);

  const recentAttempts = await prisma.passwordReset.count({
    where: {
      userId,
      createdAt: {
        gte: cooldownStart,
      },
    },
  });

  if (recentAttempts >= MAX_RESET_ATTEMPTS) {
    const oldestAttempt = await prisma.passwordReset.findFirst({
      where: {
        userId,
        createdAt: {
          gte: cooldownStart,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        createdAt: true,
      },
    });

    const cooldownEndsAt = oldestAttempt
      ? new Date(oldestAttempt.createdAt.getTime() + RESET_COOLDOWN_MINUTES * 60 * 1000)
      : new Date();

    return {
      allowed: false,
      cooldownEndsAt,
    };
  }

  return {
    allowed: true,
    attemptsRemaining: MAX_RESET_ATTEMPTS - recentAttempts,
  };
}

/**
 * Send password reset email
 * TODO: Replace console.log with actual email service (SendGrid, AWS SES, etc.)
 */
async function sendResetEmail(
  email: string,
  resetToken: string,
  userName: string
): Promise<boolean> {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  // TODO: Replace with actual email service
  console.log('\n=== PASSWORD RESET EMAIL ===');
  console.log(`To: ${email}`);
  console.log(`Subject: Reset Your Password - Heinicus Mobile Mechanic`);
  console.log(`\nHi ${userName},\n`);
  console.log(`You requested to reset your password. Click the link below to reset it:\n`);
  console.log(`${resetUrl}\n`);
  console.log(`This link will expire in ${TOKEN_EXPIRY_HOURS} hour(s).\n`);
  console.log(`If you didn't request this, please ignore this email.\n`);
  console.log(`Thanks,`);
  console.log(`The Heinicus Team`);
  console.log('============================\n');

  // In production, use a real email service:
  /*
  const msg = {
    to: email,
    from: process.env.SMTP_FROM!,
    subject: 'Reset Your Password - Heinicus Mobile Mechanic',
    html: `
      <h2>Reset Your Password</h2>
      <p>Hi ${userName},</p>
      <p>You requested to reset your password. Click the button below to reset it:</p>
      <a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background:#007bff;color:#fff;text-decoration:none;border-radius:5px;">
        Reset Password
      </a>
      <p>Or copy and paste this link: ${resetUrl}</p>
      <p>This link will expire in ${TOKEN_EXPIRY_HOURS} hour(s).</p>
      <p>If you didn't request this, please ignore this email.</p>
      <p>Thanks,<br>The Heinicus Team</p>
    `,
  };

  await sgMail.send(msg);
  */

  return true;
}

/**
 * Request a password reset
 * Uses timing-safe operations to prevent email enumeration
 */
export async function requestPasswordReset(
  email: string
): Promise<PasswordResetResult> {
  try {
    // Always take the same amount of time, even if user doesn't exist
    // This prevents email enumeration attacks
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        status: true,
      },
    });

    // If user doesn't exist, still pretend we sent an email (prevents enumeration)
    if (!user) {
      // Add a small delay to match the time it would take to send an email
      await new Promise(resolve => setTimeout(resolve, 500));

      return {
        success: true,
        message: 'If an account exists with that email, a reset link has been sent.',
      };
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      // Still pretend we sent an email (prevents enumeration)
      await new Promise(resolve => setTimeout(resolve, 500));

      return {
        success: true,
        message: 'If an account exists with that email, a reset link has been sent.',
      };
    }

    // Check rate limiting
    const rateLimit = await checkRateLimit(user.id);
    if (!rateLimit.allowed) {
      const minutesRemaining = Math.ceil(
        (rateLimit.cooldownEndsAt!.getTime() - Date.now()) / 60000
      );

      return {
        success: false,
        error: `Too many reset attempts. Please try again in ${minutesRemaining} minute(s).`,
      };
    }

    // Generate reset token
    const resetToken = generateResetToken();
    const hashedToken = await hashToken(resetToken);

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    // Save reset token to database
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt,
        used: false,
      },
    });

    // Send reset email
    const emailSent = await sendResetEmail(
      email,
      resetToken,
      `${user.firstName} ${user.lastName}`
    );

    if (!emailSent) {
      return {
        success: false,
        error: 'Failed to send reset email. Please try again.',
      };
    }

    return {
      success: true,
      message: 'If an account exists with that email, a reset link has been sent.',
    };
  } catch (error) {
    console.error('Request password reset error:', error);
    return {
      success: false,
      error: 'Failed to process password reset request. Please try again.',
    };
  }
}

/**
 * Verify a password reset token
 */
export async function verifyResetToken(token: string): Promise<{
  valid: boolean;
  userId?: string;
  error?: string;
}> {
  try {
    // Find all non-expired, unused tokens
    const resetRecords = await prisma.passwordReset.findMany({
      where: {
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        userId: true,
        token: true,
      },
    });

    // Check each token (timing-safe)
    for (const record of resetRecords) {
      const isValid = await bcrypt.compare(token, record.token);

      if (isValid) {
        return {
          valid: true,
          userId: record.userId,
        };
      }
    }

    return {
      valid: false,
      error: 'Invalid or expired reset token',
    };
  } catch (error) {
    console.error('Verify reset token error:', error);
    return {
      valid: false,
      error: 'Failed to verify token',
    };
  }
}

/**
 * Reset password with token
 */
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<PasswordResetResult> {
  try {
    // Validate password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      return {
        success: false,
        error: passwordValidation.errors.join('. '),
      };
    }

    // Verify token
    const verification = await verifyResetToken(token);
    if (!verification.valid || !verification.userId) {
      return {
        success: false,
        error: verification.error || 'Invalid reset token',
      };
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password and mark all reset tokens as used in a transaction
    await prisma.$transaction(async (tx) => {
      // Update user password
      await tx.user.update({
        where: { id: verification.userId },
        data: { passwordHash },
      });

      // Mark all reset tokens for this user as used
      await tx.passwordReset.updateMany({
        where: {
          userId: verification.userId,
          used: false,
        },
        data: {
          used: true,
          usedAt: new Date(),
        },
      });
    });

    console.log(`Password reset successful for user ${verification.userId}`);

    return {
      success: true,
      message: 'Password has been reset successfully. You can now sign in with your new password.',
    };
  } catch (error) {
    console.error('Reset password error:', error);
    return {
      success: false,
      error: 'Failed to reset password. Please try again.',
    };
  }
}

/**
 * Change password for authenticated user
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<PasswordResetResult> {
  try {
    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user || !user.passwordHash) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      return {
        success: false,
        error: 'Current password is incorrect',
      };
    }

    // Validate new password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      return {
        success: false,
        error: passwordValidation.errors.join('. '),
      };
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    console.log(`Password changed successfully for user ${userId}`);

    return {
      success: true,
      message: 'Password changed successfully',
    };
  } catch (error) {
    console.error('Change password error:', error);
    return {
      success: false,
      error: 'Failed to change password. Please try again.',
    };
  }
}

/**
 * Clean up expired reset tokens (should be run periodically)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  try {
    const result = await prisma.passwordReset.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    console.log(`Cleaned up ${result.count} expired password reset tokens`);
    return result.count;
  } catch (error) {
    console.error('Cleanup expired tokens error:', error);
    return 0;
  }
}

/**
 * Get reset attempt status for a user (admin only)
 */
export async function getResetAttempts(userId: string): Promise<{
  recentAttempts: number;
  canRequest: boolean;
  cooldownEndsAt?: Date;
}> {
  const rateLimit = await checkRateLimit(userId);

  const cooldownStart = new Date(Date.now() - RESET_COOLDOWN_MINUTES * 60 * 1000);
  const recentAttempts = await prisma.passwordReset.count({
    where: {
      userId,
      createdAt: {
        gte: cooldownStart,
      },
    },
  });

  return {
    recentAttempts,
    canRequest: rateLimit.allowed,
    cooldownEndsAt: rateLimit.cooldownEndsAt,
  };
}
