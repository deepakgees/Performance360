/**
 * Unit tests for sanitizeLogs utilities
 */

import { sanitizeForLogging, redactEmail, redactUserId } from './sanitizeLogs';

describe('sanitizeLogs', () => {
  describe('sanitizeForLogging', () => {
    it('should return same value for non-objects', () => {
      expect(sanitizeForLogging(null)).toBe(null);
      expect(sanitizeForLogging(undefined)).toBe(undefined);
      expect(sanitizeForLogging('hello')).toBe('hello');
      expect(sanitizeForLogging(42)).toBe(42);
    });

    it('should redact password field', () => {
      const data = { user: 'john', password: 'secret123' };
      expect(sanitizeForLogging(data)).toEqual({
        user: 'john',
        password: '[REDACTED]',
      });
    });

    it('should redact token and authorization', () => {
      const data = { token: 'jwt-here', authorization: 'Bearer xyz' };
      expect(sanitizeForLogging(data)).toEqual({
        token: '[REDACTED]',
        authorization: '[REDACTED]',
      });
    });

    it('should redact case-insensitive sensitive fields', () => {
      const data = { PASSWORD: 'secret', ApiKey: 'key123' };
      expect(sanitizeForLogging(data)).toEqual({
        PASSWORD: '[REDACTED]',
        ApiKey: '[REDACTED]',
      });
    });

    it('should recursively sanitize nested objects', () => {
      const data = { outer: { inner: { password: 'pwd' } } };
      expect(sanitizeForLogging(data)).toEqual({
        outer: { inner: { password: '[REDACTED]' } },
      });
    });

    it('should sanitize arrays', () => {
      const data = [{ password: 'a' }, { password: 'b' }];
      expect(sanitizeForLogging(data)).toEqual([
        { password: '[REDACTED]' },
        { password: '[REDACTED]' },
      ]);
    });

    it('should allow custom sensitive fields', () => {
      const data = { customSecret: 'hide-me' };
      expect(sanitizeForLogging(data, ['customSecret'])).toEqual({
        customSecret: '[REDACTED]',
      });
    });
  });

  describe('redactEmail', () => {
    it('should return empty or invalid email as-is', () => {
      expect(redactEmail('')).toBe('');
      expect(redactEmail('no-at-sign')).toBe('no-at-sign');
    });

    it('should redact local part keeping first and last character', () => {
      expect(redactEmail('user@example.com')).toBe('u**r@example.com');
    });

    it('should handle short local part', () => {
      expect(redactEmail('ab@example.com')).toBe('a***@example.com');
    });
  });

  describe('redactUserId', () => {
    it('should return *** for empty or very short id', () => {
      expect(redactUserId('')).toBe('***');
      expect(redactUserId('ab')).toBe('***');
    });

    it('should redact middle keeping first 2 and last 2 chars', () => {
      expect(redactUserId('user123id')).toBe('us*****id');
    });
  });
});
