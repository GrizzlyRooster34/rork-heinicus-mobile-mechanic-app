import { z } from 'zod';
import { TRPCError } from '@trpc/server';

/**
 * Input Sanitization Middleware
 * Provides utilities to sanitize and validate user inputs to prevent XSS and other injection attacks
 */

// HTML sanitization - removes potentially dangerous HTML tags and attributes
const DANGEROUS_HTML_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^<]*>/gi,
  /<link\b[^<]*>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi, // Event handlers like onclick, onload, etc.
];

/**
 * Sanitizes HTML input by removing dangerous tags and attributes
 */
export function sanitizeHTML(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // Remove dangerous patterns
  DANGEROUS_HTML_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  // Remove any remaining script-related attributes
  sanitized = sanitized
    .replace(/(<[^>]+)\son\w+\s*=\s*["'][^"']*["']/gi, '$1')
    .replace(/(<[^>]+)\son\w+\s*=\s*[^\s>]*/gi, '$1');

  return sanitized.trim();
}

/**
 * Sanitizes a string by removing control characters and normalizing whitespace
 */
export function sanitizeString(input: string, options: {
  maxLength?: number;
  allowNewlines?: boolean;
  allowHTML?: boolean;
} = {}): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  const { maxLength = 10000, allowNewlines = true, allowHTML = false } = options;

  let sanitized = input;

  // Remove HTML if not allowed
  if (!allowHTML) {
    sanitized = sanitizeHTML(sanitized);
    // Also strip any remaining HTML tags
    sanitized = sanitized.replace(/<[^>]*>/g, '');
  }

  // Remove control characters except newlines and tabs
  if (!allowNewlines) {
    sanitized = sanitized.replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  } else {
    sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  }

  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  // Enforce max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * File upload validation configuration
 */
export const FILE_UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/pdf',
  ],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.pdf'],
};

/**
 * File metadata type
 */
export interface FileMetadata {
  filename: string;
  size: number;
  mimeType: string;
}

/**
 * Validates file upload metadata
 */
export function validateFileUpload(file: FileMetadata): {
  valid: boolean;
  error?: string;
} {
  // Check file size
  if (file.size > FILE_UPLOAD_CONFIG.maxFileSize) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${FILE_UPLOAD_CONFIG.maxFileSize / 1024 / 1024}MB`,
    };
  }

  // Check MIME type
  if (!FILE_UPLOAD_CONFIG.allowedMimeTypes.includes(file.mimeType.toLowerCase())) {
    return {
      valid: false,
      error: `File type '${file.mimeType}' is not allowed. Allowed types: ${FILE_UPLOAD_CONFIG.allowedMimeTypes.join(', ')}`,
    };
  }

  // Check file extension
  const extension = file.filename.toLowerCase().substring(file.filename.lastIndexOf('.'));
  if (!FILE_UPLOAD_CONFIG.allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `File extension '${extension}' is not allowed. Allowed extensions: ${FILE_UPLOAD_CONFIG.allowedExtensions.join(', ')}`,
    };
  }

  // Validate filename (prevent path traversal)
  if (file.filename.includes('..') || file.filename.includes('/') || file.filename.includes('\\')) {
    return {
      valid: false,
      error: 'Invalid filename - path traversal detected',
    };
  }

  return { valid: true };
}

/**
 * Zod schema helpers for common input validation
 */
export const sanitizedStringSchema = (options: {
  maxLength?: number;
  minLength?: number;
  allowNewlines?: boolean;
  allowHTML?: boolean;
} = {}) => {
  const { maxLength = 10000, minLength = 0, allowNewlines = true, allowHTML = false } = options;

  return z.string()
    .min(minLength, `Must be at least ${minLength} characters`)
    .max(maxLength, `Must be at most ${maxLength} characters`)
    .transform((val) => sanitizeString(val, { maxLength, allowNewlines, allowHTML }));
};

export const emailSchema = z.string()
  .email('Invalid email address')
  .toLowerCase()
  .transform((val) => sanitizeString(val, { maxLength: 255, allowNewlines: false, allowHTML: false }));

export const phoneSchema = z.string()
  .regex(/^[\d\s\-\(\)\+]+$/, 'Invalid phone number format')
  .transform((val) => sanitizeString(val, { maxLength: 20, allowNewlines: false, allowHTML: false }));

export const urlSchema = z.string()
  .url('Invalid URL')
  .transform((val) => sanitizeString(val, { maxLength: 2048, allowNewlines: false, allowHTML: false }));

/**
 * tRPC middleware for input sanitization
 */
export function createSanitizationMiddleware() {
  return ({ ctx, next, input }: any) => {
    // Recursively sanitize all string inputs
    const sanitizeObject = (obj: any): any => {
      if (typeof obj === 'string') {
        return sanitizeString(obj);
      } else if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      } else if (obj !== null && typeof obj === 'object') {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(obj)) {
          sanitized[key] = sanitizeObject(value);
        }
        return sanitized;
      }
      return obj;
    };

    // Only sanitize if input exists
    const sanitizedInput = input ? sanitizeObject(input) : input;

    return next({
      ctx,
      input: sanitizedInput,
    });
  };
}

/**
 * Express middleware for input sanitization
 */
export function sanitizeRequestBody(req: any, res: any, next: any) {
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    } else if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    } else if (obj !== null && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
}

/**
 * Validation error formatter for better error messages
 */
export function formatValidationError(error: z.ZodError): string {
  const errors = error.errors.map(err => {
    const path = err.path.join('.');
    return `${path}: ${err.message}`;
  });

  return `Validation failed:\n${errors.join('\n')}`;
}

/**
 * tRPC error handler for validation errors
 */
export function handleValidationError(error: any): never {
  if (error instanceof z.ZodError) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: formatValidationError(error),
      cause: error,
    });
  }

  throw error;
}
