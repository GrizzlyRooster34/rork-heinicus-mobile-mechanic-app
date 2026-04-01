import nodemailer from 'nodemailer';
import { validatedEnv } from '../env-validation';

/**
 * Email Service
 * Handles sending emails using SMTP configuration
 */

// We'll use a lazy-initialized transporter to avoid issues if environment variables aren't set yet
let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: validatedEnv.SMTP_HOST,
      port: parseInt(validatedEnv.SMTP_PORT || '587', 10),
      secure: validatedEnv.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: validatedEnv.SMTP_USER,
        pass: validatedEnv.SMTP_PASS, // Jules branch used SMTP_PASSWORD, task says SMTP_PASS
      },
    });
  }
  return transporter;
}

/**
 * Send an email
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  try {
    // If SMTP is not configured, we'll log to console in non-production
    if (!validatedEnv.SMTP_HOST) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('\n=== EMAIL LOG (NO SMTP CONFIGURED) ===');
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Content: ${html.substring(0, 100)}...`);
        console.log('========================================\n');
        return true;
      }
      console.warn('Attempted to send email but SMTP is not configured and NODE_ENV is production');
      return false;
    }

    const info = await getTransporter().sendMail({
      from: validatedEnv.EMAIL_FROM_ADDRESS || validatedEnv.SMTP_USER,
      to,
      subject,
      html,
    });

    console.log('Email sent successfully: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}
