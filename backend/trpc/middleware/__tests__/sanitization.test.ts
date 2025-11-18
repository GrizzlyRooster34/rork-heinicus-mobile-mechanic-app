/**
 * Tests for Request Sanitization Middleware
 * HEI-131: Verify input sanitization and validation
 */

import { describe, it, expect } from '@jest/globals';
import {
  sanitizeString,
  sanitizeObject,
  sanitizeEmail,
  sanitizePhone,
  sanitizeUrl,
  sanitizePath,
  validateStringLength,
  sanitizeInput,
} from '../sanitization';

describe('Sanitization Middleware', () => {
  describe('sanitizeString', () => {
    it('should remove script tags', () => {
      const input = 'Hello <script>alert("xss")</script> World';
      const result = sanitizeString(input);

      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
      expect(result).toBe('Hello  World');
    });

    it('should remove HTML tags', () => {
      const input = '<div>Hello <b>World</b></div>';
      const result = sanitizeString(input);

      expect(result).toBe('Hello World');
    });

    it('should remove SQL injection patterns', () => {
      const input = "SELECT * FROM users WHERE id = '1'";
      const result = sanitizeString(input);

      expect(result).not.toContain('SELECT');
      expect(result).not.toContain('FROM');
    });

    it('should remove null bytes', () => {
      const input = 'Hello\0World';
      const result = sanitizeString(input);

      expect(result).toBe('HelloWorld');
    });

    it('should trim whitespace', () => {
      const input = '  Hello World  ';
      const result = sanitizeString(input);

      expect(result).toBe('Hello World');
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize nested objects', () => {
      const input = {
        name: '<script>alert("xss")</script>John',
        email: 'john@example.com  ',
        address: {
          street: '<b>123 Main St</b>',
          city: 'New York  ',
        },
      };

      const result = sanitizeObject(input);

      expect(result.name).not.toContain('<script>');
      expect(result.email).toBe('john@example.com');
      expect(result.address.street).toBe('123 Main St');
      expect(result.address.city).toBe('New York');
    });

    it('should sanitize arrays', () => {
      const input = {
        tags: ['<script>tag1</script>', 'tag2  ', '<b>tag3</b>'],
      };

      const result = sanitizeObject(input);

      expect(result.tags).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should handle null and undefined', () => {
      expect(sanitizeObject(null)).toBeNull();
      expect(sanitizeObject(undefined)).toBeUndefined();
    });
  });

  describe('sanitizeEmail', () => {
    it('should convert email to lowercase and trim', () => {
      const input = '  JoHn@ExAmPlE.com  ';
      const result = sanitizeEmail(input);

      expect(result).toBe('john@example.com');
    });

    it('should throw error for invalid email', () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'john@',
        'john@.com',
        'john..doe@example.com',
      ];

      invalidEmails.forEach(email => {
        expect(() => sanitizeEmail(email)).toThrow('Invalid email format');
      });
    });

    it('should accept valid emails', () => {
      const validEmails = [
        'john@example.com',
        'john.doe@example.com',
        'john+tag@example.co.uk',
      ];

      validEmails.forEach(email => {
        expect(() => sanitizeEmail(email)).not.toThrow();
      });
    });
  });

  describe('sanitizePhone', () => {
    it('should remove non-digit characters', () => {
      const input = '(555) 123-4567';
      const result = sanitizePhone(input);

      expect(result).toBe('5551234567');
    });

    it('should throw error for invalid phone numbers', () => {
      const invalidPhones = [
        '123',        // Too short
        '12345678901234567', // Too long
        'abcdefghij', // No digits
      ];

      invalidPhones.forEach(phone => {
        expect(() => sanitizePhone(phone)).toThrow('Invalid phone number');
      });
    });

    it('should accept valid phone numbers', () => {
      const validPhones = [
        '5551234567',
        '+15551234567',
        '555-123-4567',
      ];

      validPhones.forEach(phone => {
        expect(() => sanitizePhone(phone)).not.toThrow();
      });
    });
  });

  describe('sanitizeUrl', () => {
    it('should accept valid HTTP/HTTPS URLs', () => {
      const urls = [
        'https://example.com',
        'http://example.com/path',
      ];

      urls.forEach(url => {
        expect(() => sanitizeUrl(url)).not.toThrow();
      });
    });

    it('should throw error for invalid protocols', () => {
      const invalidUrls = [
        'javascript:alert("xss")',
        'file:///etc/passwd',
        'data:text/html,<script>alert("xss")</script>',
      ];

      invalidUrls.forEach(url => {
        expect(() => sanitizeUrl(url)).toThrow();
      });
    });

    it('should throw error for malformed URLs', () => {
      expect(() => sanitizeUrl('not a url')).toThrow('Invalid URL format');
    });
  });

  describe('sanitizePath', () => {
    it('should remove parent directory references', () => {
      const input = '../../../etc/passwd';
      const result = sanitizePath(input);

      expect(result).not.toContain('..');
      expect(result).toBe('etc/passwd');
    });

    it('should remove double slashes', () => {
      const input = 'path//to//file';
      const result = sanitizePath(input);

      expect(result).toBe('path/to/file');
    });

    it('should remove leading slashes', () => {
      const input = '/path/to/file';
      const result = sanitizePath(input);

      expect(result).toBe('path/to/file');
    });
  });

  describe('validateStringLength', () => {
    it('should accept strings within limit', () => {
      const input = 'Hello World';
      expect(() => validateStringLength(input, 100)).not.toThrow();
    });

    it('should throw error for strings exceeding limit', () => {
      const input = 'a'.repeat(10001);
      expect(() => validateStringLength(input, 10000)).toThrow();
    });
  });

  describe('sanitizeInput', () => {
    it('should sanitize complex nested structures', () => {
      const input = {
        user: {
          name: '<script>John</script>',
          emails: ['TEST@EXAMPLE.COM  ', '  jane@example.com'],
          metadata: {
            tags: ['<b>tag1</b>', 'tag2'],
          },
        },
      };

      const result = sanitizeInput(input);

      expect(result.user.name).toBe('John');
      expect(result.user.metadata.tags).toEqual(['tag1', 'tag2']);
    });

    it('should throw error for arrays with too many elements', () => {
      const input = new Array(1001).fill('item');

      expect(() => sanitizeInput(input)).toThrow('Array size exceeds maximum limit');
    });

    it('should throw error for objects with too many keys', () => {
      const input: any = {};
      for (let i = 0; i < 101; i++) {
        input[`key${i}`] = 'value';
      }

      expect(() => sanitizeInput(input)).toThrow('Object has too many keys');
    });
  });
});
