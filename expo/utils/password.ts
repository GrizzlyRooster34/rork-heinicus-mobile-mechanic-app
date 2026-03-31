/**
 * Password Hashing and Verification Utilities
 * Uses bcryptjs for secure password hashing
 */

import bcrypt from 'bcryptjs';
import * as Crypto from 'expo-crypto';
import { logger } from './logger';

/**
 * Number of salt rounds for bcrypt
 * Higher = more secure but slower (10 is a good balance for mobile)
 */
const SALT_ROUNDS = 10;

/**
 * Hash a plain text password using bcrypt
 * @param plainPassword - The plain text password to hash
 * @returns Promise that resolves to the hashed password
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);
    return hashedPassword;
  } catch (error) {
    logger.error('Failed to hash password', 'PasswordUtils', error);
    throw new Error('Password hashing failed');
  }
}

/**
 * Verify a plain text password against a hashed password
 * @param plainPassword - The plain text password to verify
 * @param hashedPassword - The hashed password to compare against
 * @returns Promise that resolves to true if passwords match, false otherwise
 */
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    return isMatch;
  } catch (error) {
    logger.error('Failed to verify password', 'PasswordUtils', error);
    return false;
  }
}

/**
 * Check if a password meets security requirements
 * @param password - The password to validate
 * @returns Object with isValid flag and error message if invalid
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  message?: string;
} {
  // Minimum length check
  if (password.length < 8) {
    return {
      isValid: false,
      message: 'Password must be at least 8 characters long',
    };
  }

  // Maximum length check (bcrypt limit is 72 characters)
  if (password.length > 72) {
    return {
      isValid: false,
      message: 'Password must be less than 72 characters',
    };
  }

  // Check for at least one number
  if (!/\d/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one number',
    };
  }

  // Check for at least one letter
  if (!/[a-zA-Z]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one letter',
    };
  }

  // Check for at least one special character (recommended but not required)
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  if (!hasSpecialChar) {
    logger.warn(
      'Password does not contain special characters',
      'PasswordValidation',
      { hasSpecialChar: false }
    );
  }

  return { isValid: true };
}

/**
 * Check if a string is already a bcrypt hash
 * @param str - The string to check
 * @returns True if the string appears to be a bcrypt hash
 */
export function isBcryptHash(str: string): boolean {
  // Bcrypt hashes start with $2a$, $2b$, or $2y$ and are 60 characters long
  return /^\$2[aby]\$\d{2}\$.{53}$/.test(str);
}

/**
 * Generates a cryptographically secure random integer between 0 and max - 1
 * Uses rejection sampling to avoid modulo bias
 */
function getSecureRandomInt(max: number): number {
  if (max <= 0 || max > 256) {
    throw new Error('max must be between 1 and 256');
  }

  // Find the largest multiple of max that fits in 256
  // This avoids modulo bias by rejecting random numbers >= limit
  const limit = 256 - (256 % max);
  const buffer = new Uint8Array(1);

  while (true) {
    Crypto.getRandomValues(buffer);
    const value = buffer[0];

    // Reject values >= limit to avoid modulo bias
    if (value < limit) {
      return value % max;
    }
  }
}

/**
 * Generate a secure random password
 * @param length - Length of password (default 16)
 * @returns A secure random password
 */
export function generateSecurePassword(length: number = 16): string {
  if (length < 4 || length > 256) {
    throw new Error('Password length must be between 4 and 256');
  }

  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const allChars = lowercase + uppercase + numbers + special;

  let passwordArr: string[] = [];

  // Ensure at least one of each type
  passwordArr.push(lowercase[getSecureRandomInt(lowercase.length)]);
  passwordArr.push(uppercase[getSecureRandomInt(uppercase.length)]);
  passwordArr.push(numbers[getSecureRandomInt(numbers.length)]);
  passwordArr.push(special[getSecureRandomInt(special.length)]);

  // Fill the rest randomly
  for (let i = passwordArr.length; i < length; i++) {
    passwordArr.push(allChars[getSecureRandomInt(allChars.length)]);
  }

  // Fisher-Yates shuffle the password array
  for (let i = passwordArr.length - 1; i > 0; i--) {
    const j = getSecureRandomInt(i + 1);
    const temp = passwordArr[i];
    passwordArr[i] = passwordArr[j];
    passwordArr[j] = temp;
  }

  return passwordArr.join('');
}
