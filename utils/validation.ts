// Validation utilities for form inputs and data sanitization

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// Field validation options
export interface ValidationOptions {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: string) => ValidationResult;
  allowEmpty?: boolean;
  trimWhitespace?: boolean;
}

// Input sanitization options
export interface SanitizationOptions {
  removeHTML?: boolean;
  removeScripts?: boolean;
  removeSQLKeywords?: boolean;
  normalizeWhitespace?: boolean;
  maxLength?: number;
  allowedCharacters?: RegExp;
  replacePattern?: { pattern: RegExp; replacement: string };
}

// Email validation
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];
  
  if (!email || email.trim().length === 0) {
    errors.push('Email is required');
    return { isValid: false, errors };
  }

  const trimmedEmail = email.trim().toLowerCase();
  
  // Basic email regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!emailRegex.test(trimmedEmail)) {
    errors.push('Please enter a valid email address');
  }

  // Length validation
  if (trimmedEmail.length > 254) {
    errors.push('Email address is too long');
  }

  // Common typo detection
  const domain = trimmedEmail.split('@')[1];
  
  if (domain) {
    // Check for common typos
    const typoMap: Record<string, string> = {
      'gmai.com': 'gmail.com',
      'gmial.com': 'gmail.com',
      'yahooo.com': 'yahoo.com',
      'hotmial.com': 'hotmail.com',
      'outlok.com': 'outlook.com',
    };
    
    if (typoMap[domain]) {
      errors.push(`Did you mean ${trimmedEmail.replace(domain, typoMap[domain])}?`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Password validation
export function validatePassword(password: string, confirmPassword?: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors };
  }

  // Length validation
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password is too long (maximum 128 characters)');
  }

  // Strength validation
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasLowerCase) {
    warnings.push('Consider adding lowercase letters for stronger security');
  }
  
  if (!hasUpperCase) {
    warnings.push('Consider adding uppercase letters for stronger security');
  }
  
  if (!hasNumbers) {
    warnings.push('Consider adding numbers for stronger security');
  }
  
  if (!hasSpecialChar) {
    warnings.push('Consider adding special characters for stronger security');
  }

  // Common password checks
  const commonPasswords = [
    'password', '123456', '12345678', 'qwerty', 'abc123', 'password123',
    'admin', 'letmein', 'welcome', 'monkey', '1234567890'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Please choose a more secure password');
  }

  // Confirm password validation
  if (confirmPassword !== undefined && password !== confirmPassword) {
    errors.push('Passwords do not match');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Phone number validation
export function validatePhoneNumber(phone: string): ValidationResult {
  const errors: string[] = [];
  
  if (!phone || phone.trim().length === 0) {
    return { isValid: true, errors }; // Phone is optional
  }

  // Remove all non-digit characters for validation
  const digitsOnly = phone.replace(/\D/g, '');
  
  // US phone number validation
  if (digitsOnly.length < 10) {
    errors.push('Phone number must have at least 10 digits');
  }
  
  if (digitsOnly.length > 15) {
    errors.push('Phone number is too long');
  }

  // Pattern validation for common formats
  const phonePatterns = [
    /^\(\d{3}\) \d{3}-\d{4}$/, // (555) 123-4567
    /^\d{3}-\d{3}-\d{4}$/, // 555-123-4567
    /^\d{10}$/, // 5551234567
    /^\+1\d{10}$/, // +15551234567
    /^\d{3}\.\d{3}\.\d{4}$/, // 555.123.4567
  ];

  const isValidFormat = phonePatterns.some(pattern => pattern.test(phone.trim()));
  
  if (!isValidFormat && digitsOnly.length >= 10) {
    errors.push('Please enter a valid phone number format');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Name validation
export function validateName(name: string, fieldName: string = 'Name'): ValidationResult {
  const errors: string[] = [];
  
  if (!name || name.trim().length === 0) {
    errors.push(`${fieldName} is required`);
    return { isValid: false, errors };
  }

  const trimmedName = name.trim();
  
  if (trimmedName.length < 2) {
    errors.push(`${fieldName} must be at least 2 characters long`);
  }
  
  if (trimmedName.length > 50) {
    errors.push(`${fieldName} is too long (maximum 50 characters)`);
  }

  // Only allow letters, spaces, hyphens, and apostrophes
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  if (!nameRegex.test(trimmedName)) {
    errors.push(`${fieldName} can only contain letters, spaces, hyphens, and apostrophes`);
  }

  // Check for suspicious patterns
  if (/^\s*$/.test(trimmedName)) {
    errors.push(`${fieldName} cannot be only whitespace`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// VIN validation
export function validateVIN(vin: string): ValidationResult {
  const errors: string[] = [];
  
  if (!vin || vin.trim().length === 0) {
    return { isValid: true, errors }; // VIN is optional
  }

  const trimmedVIN = vin.trim().toUpperCase();
  
  // VIN must be exactly 17 characters
  if (trimmedVIN.length !== 17) {
    errors.push('VIN must be exactly 17 characters long');
  }

  // VIN should not contain I, O, or Q
  if (/[IOQ]/.test(trimmedVIN)) {
    errors.push('VIN cannot contain letters I, O, or Q');
  }

  // VIN should only contain alphanumeric characters
  if (!/^[A-HJ-NPR-Z0-9]+$/.test(trimmedVIN)) {
    errors.push('VIN can only contain letters and numbers (excluding I, O, Q)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Generic field validation
export function validateField(value: string, options: ValidationOptions): ValidationResult {
  const errors: string[] = [];
  let processedValue = value;

  // Trim whitespace if specified
  if (options.trimWhitespace !== false) {
    processedValue = value.trim();
  }

  // Required validation
  if (options.required && (!processedValue || processedValue.length === 0)) {
    errors.push('This field is required');
    return { isValid: false, errors };
  }

  // Allow empty if not required
  if (!options.required && (!processedValue || processedValue.length === 0)) {
    return { isValid: true, errors };
  }

  // Length validation
  if (options.minLength && processedValue.length < options.minLength) {
    errors.push(`Must be at least ${options.minLength} characters long`);
  }

  if (options.maxLength && processedValue.length > options.maxLength) {
    errors.push(`Must be no more than ${options.maxLength} characters long`);
  }

  // Pattern validation
  if (options.pattern && !options.pattern.test(processedValue)) {
    errors.push('Invalid format');
  }

  // Custom validation
  if (options.customValidator) {
    const customResult = options.customValidator(processedValue);
    if (!customResult.isValid) {
      errors.push(...customResult.errors);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Input sanitization
export function sanitizeInput(input: string, options: SanitizationOptions = {}): string {
  let sanitized = input;

  // Remove HTML tags
  if (options.removeHTML !== false) {
    sanitized = sanitized.replace(/<[^>]*>/g, '');
  }

  // Remove script tags and content
  if (options.removeScripts !== false) {
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  }

  // Remove common SQL keywords (basic protection)
  if (options.removeSQLKeywords) {
    const sqlKeywords = [
      'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER',
      'UNION', 'WHERE', 'OR', 'AND', 'EXEC', 'EXECUTE'
    ];
    
    sqlKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      sanitized = sanitized.replace(regex, '');
    });
  }

  // Normalize whitespace
  if (options.normalizeWhitespace !== false) {
    sanitized = sanitized.replace(/\s+/g, ' ').trim();
  }

  // Apply custom pattern replacement
  if (options.replacePattern) {
    sanitized = sanitized.replace(options.replacePattern.pattern, options.replacePattern.replacement);
  }

  // Filter allowed characters only
  if (options.allowedCharacters) {
    const matches = sanitized.match(options.allowedCharacters);
    sanitized = matches ? matches.join('') : '';
  }

  // Truncate to max length
  if (options.maxLength && sanitized.length > options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
  }

  return sanitized;
}

// Specific sanitizers
export function sanitizeEmail(email: string): string {
  return sanitizeInput(email, {
    normalizeWhitespace: true,
    maxLength: 254,
    allowedCharacters: /[a-zA-Z0-9._%+-@]/g,
  }).toLowerCase();
}

export function sanitizeName(name: string): string {
  return sanitizeInput(name, {
    normalizeWhitespace: true,
    maxLength: 50,
    allowedCharacters: /[a-zA-Z\s\-']/g,
  });
}

export function sanitizePhoneNumber(phone: string): string {
  return sanitizeInput(phone, {
    normalizeWhitespace: true,
    maxLength: 20,
    allowedCharacters: /[\d\s\-\(\)\+\.]/g,
  });
}

export function sanitizeVIN(vin: string): string {
  return sanitizeInput(vin, {
    normalizeWhitespace: true,
    maxLength: 17,
    allowedCharacters: /[A-HJ-NPR-Z0-9]/g,
  }).toUpperCase();
}

export function sanitizeDescription(description: string): string {
  return sanitizeInput(description, {
    removeHTML: true,
    removeScripts: true,
    removeSQLKeywords: true,
    normalizeWhitespace: true,
    maxLength: 1000,
  });
}

// Form validation helper
export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
  warnings: Record<string, string[]>;
}

export function validateForm(fields: Record<string, unknown>, rules: Record<string, ValidationOptions>): FormValidationResult {
  const errors: Record<string, string[]> = {};
  const warnings: Record<string, string[]> = {};
  let isValid = true;

  Object.entries(fields).forEach(([fieldName, value]) => {
    const rule = rules[fieldName];
    if (rule) {
      const result = validateField(String(value || ''), rule);
      
      if (!result.isValid) {
        errors[fieldName] = result.errors;
        isValid = false;
      }
      
      if (result.warnings && result.warnings.length > 0) {
        warnings[fieldName] = result.warnings;
      }
    }
  });

  return {
    isValid,
    errors,
    warnings,
  };
}

// Real-time validation debouncer
export function debounceValidation(
  validationFunction: () => void,
  delay: number = 300
): () => void {
  let timeoutId: NodeJS.Timeout;
  
  return () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(validationFunction, delay);
  };
}