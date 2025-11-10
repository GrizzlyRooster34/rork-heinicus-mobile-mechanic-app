import { prisma } from '../../lib/prisma';
import { validatedEnv } from '../env-validation';
import { generateResetToken, verifyToken, blacklistToken } from '../middleware/auth';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';

/**
 * Password Reset Service
 * Handles secure password reset flow with email verification
 */

/**
 * Password reset configuration
 */
export const PASSWORD_RESET_CONFIG = {
  tokenExpirationMinutes: 60, // 1 hour
  maxResetAttempts: 3,
  cooldownMinutes: 15, // Cooldown after max attempts
};

/**
 * In-memory store for reset attempts tracking
 * In production, use Redis
 */
interface ResetAttempt {
  count: number;
  lastAttempt: Date;
  cooldownUntil?: Date;
}

const resetAttemptsStore = new Map<string, ResetAttempt>();

/**
 * Email transporter configuration
 * Configure nodemailer with your email service
 */
function createEmailTransporter() {
  // For development, use ethereal.email or console logging
  // For production, configure with actual SMTP service (SendGrid, AWS SES, etc.)

  if (validatedEnv.NODE_ENV === 'production') {
    // Production SMTP configuration
    if (validatedEnv.SMTP_HOST && validatedEnv.SMTP_USER && validatedEnv.SMTP_PASS) {
      return nodemailer.createTransporter({
        host: validatedEnv.SMTP_HOST,
        port: parseInt(validatedEnv.SMTP_PORT || '587'),
        secure: validatedEnv.SMTP_SECURE === 'true',
        auth: {
          user: validatedEnv.SMTP_USER,
          pass: validatedEnv.SMTP_PASS,
        },
      });
    }
  }

  // Development/fallback: Log to console
  return nodemailer.createTransport({
    streamTransport: true,
    newline: 'unix',
    buffer: true,
  });
}

/**
 * Check if email is under cooldown
 */
function isUnderCooldown(email: string): { inCooldown: boolean; cooldownEndsAt?: Date } {
  const attempt = resetAttemptsStore.get(email);

  if (!attempt?.cooldownUntil) {
    return { inCooldown: false };
  }

  const now = new Date();
  if (now < attempt.cooldownUntil) {
    return { inCooldown: true, cooldownEndsAt: attempt.cooldownUntil };
  }

  // Cooldown expired, reset attempts
  resetAttemptsStore.delete(email);
  return { inCooldown: false };
}

/**
 * Track reset attempt
 */
function trackResetAttempt(email: string): void {
  const now = new Date();
  const attempt = resetAttemptsStore.get(email);

  if (!attempt) {
    resetAttemptsStore.set(email, {
      count: 1,
      lastAttempt: now,
    });
    return;
  }

  attempt.count++;
  attempt.lastAttempt = now;

  // Apply cooldown if max attempts reached
  if (attempt.count >= PASSWORD_RESET_CONFIG.maxResetAttempts) {
    attempt.cooldownUntil = new Date(
      now.getTime() + PASSWORD_RESET_CONFIG.cooldownMinutes * 60 * 1000
    );
  }

  resetAttemptsStore.set(email, attempt);
}

/**
 * Generate password reset email HTML
 */
function generateResetEmailHTML(
  firstName: string,
  resetLink: string,
  expirationMinutes: number
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background-color: #f9f9f9;
          border-radius: 8px;
          padding: 30px;
          border: 1px solid #e0e0e0;
        }
        .logo {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo h1 {
          color: #2563eb;
          margin: 0;
        }
        .button {
          display: inline-block;
          background-color: #2563eb;
          color: white !important;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
          font-weight: 600;
        }
        .button:hover {
          background-color: #1d4ed8;
        }
        .warning {
          background-color: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
          font-size: 14px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <h1>🔧 Heinicus Mobile Mechanic</h1>
        </div>

        <h2>Password Reset Request</h2>

        <p>Hi ${firstName},</p>

        <p>We received a request to reset your password. Click the button below to create a new password:</p>

        <p style="text-align: center;">
          <a href="${resetLink}" class="button">Reset Password</a>
        </p>

        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #2563eb;">${resetLink}</p>

        <div class="warning">
          <strong>⚠️ Important:</strong>
          <ul style="margin: 10px 0;">
            <li>This link will expire in ${expirationMinutes} minutes</li>
            <li>If you didn't request this reset, please ignore this email</li>
            <li>Your password won't change until you create a new one</li>
          </ul>
        </div>

        <div class="footer">
          <p>Need help? Contact us at support@heinicus-mobile-mechanic.app</p>
          <p style="font-size: 12px; color: #999;">
            This is an automated email. Please do not reply directly to this message.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Check cooldown
    const cooldownCheck = isUnderCooldown(email);
    if (cooldownCheck.inCooldown) {
      const minutesRemaining = Math.ceil(
        (cooldownCheck.cooldownEndsAt!.getTime() - Date.now()) / (60 * 1000)
      );
      return {
        success: false,
        message: `Too many reset attempts. Please try again in ${minutesRemaining} minute(s).`,
      };
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, firstName: true, email: true, isActive: true },
    });

    // Always return success to prevent email enumeration
    // but only send email if user exists and is active
    if (!user || !user.isActive) {
      console.log(`Password reset requested for non-existent/inactive email: ${email}`);
      return {
        success: true,
        message: 'If an account exists with that email, a password reset link has been sent.',
      };
    }

    // Track attempt
    trackResetAttempt(email);

    // Generate reset token
    const resetToken = generateResetToken(user.email);

    // Store reset token in database
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: crypto.createHash('sha256').update(resetToken).digest('hex'),
        expiresAt: new Date(
          Date.now() + PASSWORD_RESET_CONFIG.tokenExpirationMinutes * 60 * 1000
        ),
      },
    });

    // Generate reset link
    const frontendUrl = validatedEnv.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    // Send email
    const transporter = createEmailTransporter();
    const emailHTML = generateResetEmailHTML(
      user.firstName,
      resetLink,
      PASSWORD_RESET_CONFIG.tokenExpirationMinutes
    );

    const mailOptions = {
      from: validatedEnv.SMTP_FROM || 'noreply@heinicus-mobile-mechanic.app',
      to: user.email,
      subject: 'Reset Your Password - Heinicus Mobile Mechanic',
      html: emailHTML,
      text: `Hi ${user.firstName},\n\nWe received a request to reset your password. Click the link below to create a new password:\n\n${resetLink}\n\nThis link will expire in ${PASSWORD_RESET_CONFIG.tokenExpirationMinutes} minutes.\n\nIf you didn't request this reset, please ignore this email.`,
    };

    if (validatedEnv.NODE_ENV === 'production') {
      await transporter.sendMail(mailOptions);
    } else {
      // In development, log to console
      console.log('\n📧 Password Reset Email (Development Mode)');
      console.log('─'.repeat(60));
      console.log(`To: ${user.email}`);
      console.log(`Reset Link: ${resetLink}`);
      console.log('─'.repeat(60));
      console.log('\n');
    }

    return {
      success: true,
      message: 'If an account exists with that email, a password reset link has been sent.',
    };
  } catch (error: any) {
    console.error('Error sending password reset email:', error);
    return {
      success: false,
      message: 'Failed to process password reset request. Please try again later.',
    };
  }
}

/**
 * Verify reset token and get user
 */
export async function verifyResetToken(
  token: string
): Promise<{ valid: boolean; userId?: string; error?: string }> {
  try {
    // Verify JWT structure
    const payload = verifyToken(token) as any;

    if (payload.type !== 'reset') {
      return { valid: false, error: 'Invalid token type' };
    }

    // Hash token for database lookup
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find reset record in database
    const resetRecord = await prisma.passwordReset.findFirst({
      where: {
        token: hashedToken,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: {
          select: { id: true, isActive: true },
        },
      },
    });

    if (!resetRecord) {
      return { valid: false, error: 'Invalid or expired reset token' };
    }

    if (!resetRecord.user.isActive) {
      return { valid: false, error: 'User account is inactive' };
    }

    return { valid: true, userId: resetRecord.user.id };
  } catch (error: any) {
    console.error('Error verifying reset token:', error);
    return { valid: false, error: error.message || 'Token verification failed' };
  }
}

/**
 * Reset user password
 */
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Verify token
    const verification = await verifyResetToken(token);

    if (!verification.valid) {
      return {
        success: false,
        message: verification.error || 'Invalid or expired reset token',
      };
    }

    // Hash new password (using bcryptjs)
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Hash token for database lookup
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Update password and mark reset token as used (in transaction)
    await prisma.$transaction([
      // Update user password
      prisma.user.update({
        where: { id: verification.userId! },
        data: { passwordHash: hashedPassword },
      }),

      // Mark reset token as used
      prisma.passwordReset.updateMany({
        where: { token: hashedToken },
        data: { used: true, usedAt: new Date() },
      }),

      // Invalidate all existing sessions for this user
      // In production with proper session management, this would invalidate all JWT tokens
    ]);

    // Blacklist the reset token
    blacklistToken(token);

    // Clear reset attempts for this email
    const user = await prisma.user.findUnique({
      where: { id: verification.userId! },
      select: { email: true },
    });

    if (user) {
      resetAttemptsStore.delete(user.email);
    }

    return {
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.',
    };
  } catch (error: any) {
    console.error('Error resetting password:', error);
    return {
      success: false,
      message: 'Failed to reset password. Please try again.',
    };
  }
}

/**
 * Clean up expired reset tokens (should be called periodically)
 */
export async function cleanupExpiredResetTokens(): Promise<number> {
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
  } catch (error: any) {
    console.error('Error cleaning up expired reset tokens:', error);
    return 0;
  }
}

// Auto-cleanup every hour
setInterval(cleanupExpiredResetTokens, 60 * 60 * 1000);

/**
 * Get reset attempt status (for admin monitoring)
 */
export function getResetAttemptStatus(): Array<{
  email: string;
  attempts: number;
  lastAttempt: Date;
  cooldownUntil?: Date;
}> {
  return Array.from(resetAttemptsStore.entries()).map(([email, attempt]) => ({
    email,
    attempts: attempt.count,
    lastAttempt: attempt.lastAttempt,
    cooldownUntil: attempt.cooldownUntil,
  }));
}
