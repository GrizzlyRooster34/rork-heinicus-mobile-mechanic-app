/**
 * Request Sanitization Middleware
 * HEI-131: Prevents XSS and injection attacks by sanitizing input
 */

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return input;
  }

  return input
    // Remove HTML tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    // Remove SQL injection patterns
    .replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi, '')
    // Remove null bytes
    .replace(/\0/g, '')
    // Trim whitespace
    .trim();
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Sanitize key and value
      const sanitizedKey = sanitizeString(key);
      sanitized[sanitizedKey] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email: string): string {
  const sanitized = email.toLowerCase().trim();

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    throw new Error('Invalid email format');
  }

  return sanitized;
}

/**
 * Validate and sanitize phone number
 */
export function sanitizePhone(phone: string): string {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');

  // Basic validation (10-15 digits)
  if (digitsOnly.length < 10 || digitsOnly.length > 15) {
    throw new Error('Invalid phone number');
  }

  return digitsOnly;
}

/**
 * Sanitize URL to prevent open redirect vulnerabilities
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid URL protocol');
    }

    return parsed.toString();
  } catch {
    throw new Error('Invalid URL format');
  }
}

/**
 * Prevent path traversal attacks
 */
export function sanitizePath(path: string): string {
  return path
    .replace(/\.\./g, '') // Remove parent directory references
    .replace(/\/\//g, '/') // Remove double slashes
    .replace(/^\/+/, '') // Remove leading slashes
    .trim();
}

/**
 * Rate limit-safe string (prevent DOS with very long strings)
 */
export function validateStringLength(input: string, maxLength: number = 10000): string {
  if (input.length > maxLength) {
    throw new Error(`Input exceeds maximum length of ${maxLength} characters`);
  }
  return input;
}

/**
 * Comprehensive input sanitization
 */
export function sanitizeInput(input: any): any {
  // Sanitize based on type
  if (typeof input === 'string') {
    return sanitizeString(validateStringLength(input));
  }

  if (Array.isArray(input)) {
    // Limit array size to prevent DOS
    if (input.length > 1000) {
      throw new Error('Array size exceeds maximum limit');
    }
    return input.map(sanitizeInput);
  }

  if (typeof input === 'object' && input !== null) {
    // Limit object depth to prevent DOS
    const sanitized: any = {};
    let keyCount = 0;

    for (const [key, value] of Object.entries(input)) {
      if (++keyCount > 100) {
        throw new Error('Object has too many keys');
      }

      const sanitizedKey = sanitizeString(key);
      sanitized[sanitizedKey] = sanitizeInput(value);
    }

    return sanitized;
  }

  return input;
}
