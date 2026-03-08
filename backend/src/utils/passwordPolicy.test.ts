/**
 * Unit tests for passwordPolicy utilities
 */

import {
  validatePasswordStrength,
  passwordValidator,
} from './passwordPolicy';

describe('passwordPolicy', () => {
  describe('validatePasswordStrength', () => {
    it('should return invalid when password is empty', () => {
      const result = validatePasswordStrength('');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Password is required');
    });

    it('should return invalid when password is too short', () => {
      const result = validatePasswordStrength('Ab1!');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Password must be at least 8 characters long');
    });

    it('should return invalid when password is too long', () => {
      const result = validatePasswordStrength('A'.repeat(129));
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Password must be no more than 128 characters long');
    });

    it('should return invalid when missing uppercase', () => {
      const result = validatePasswordStrength('password1!');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Password must contain at least one uppercase letter');
    });

    it('should return invalid when missing lowercase', () => {
      const result = validatePasswordStrength('PASSWORD1!');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Password must contain at least one lowercase letter');
    });

    it('should return invalid when missing number', () => {
      const result = validatePasswordStrength('Password!');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Password must contain at least one number');
    });

    it('should return invalid when missing special character', () => {
      const result = validatePasswordStrength('Password123');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Password must contain at least one special character');
    });

    it('should return invalid for common passwords', () => {
      const result = validatePasswordStrength('Password@123');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('too common');
    });

    it('should return valid for a strong password', () => {
      const result = validatePasswordStrength('MyStr0ng!P@ss');
      expect(result.isValid).toBe(true);
      expect(result.message).toBeUndefined();
    });
  });

  describe('passwordValidator', () => {
    it('should return true for valid password', () => {
      expect(passwordValidator('MyStr0ng!P@ss')).toBe(true);
    });

    it('should return false for invalid password', () => {
      expect(passwordValidator('short')).toBe(false);
    });
  });
});
