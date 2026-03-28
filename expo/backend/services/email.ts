import nodemailer from 'nodemailer';
import { validatedEnv } from '../env-validation';

/**
 * Email Service
 * Handles sending emails using SMTP configuration
 */

// We'll use a lazy-initialized transporter to avoid issues if environment variables aren't set yet
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: validatedEnv.SMTP_HOST,
      port: parseInt(validatedEnv.SMTP_PORT || '587', 10),
      secure: validatedEnv.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: validatedEnv.SMTP_USER,
        pass: validatedEnv.SMTP_PASSWORD,
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
