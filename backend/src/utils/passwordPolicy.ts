/**
 * @fileoverview Password policy validation utilities
 *
 * This module provides password validation functions that enforce
 * strong password requirements for better security.
 *
 * @author Performance360 Team
 * @version 1.0.0
 */

/**
 * Validates password strength
 *
 * Requirements:
 * - Minimum 8 characters (recommended: 12)
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 *
 * @param password - Password to validate
 * @returns Object with isValid flag and error message if invalid
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  message?: string;
} {
  if (!password) {
    return { isValid: false, message: 'Password is required' };
  }

  if (password.length < 8) {
    return {
      isValid: false,
      message: 'Password must be at least 8 characters long',
    };
  }

  if (password.length > 128) {
    return {
      isValid: false,
      message: 'Password must be no more than 128 characters long',
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one uppercase letter',
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one lowercase letter',
    };
  }

  if (!/[0-9]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one number',
    };
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one special character',
    };
  }

  // Check for common weak passwords
  const commonPasswords = [
    'password',
    'Password@123',
    '12345678',
    'qwerty123',
    'admin123',
  ];
  if (commonPasswords.includes(password.toLowerCase())) {
    return {
      isValid: false,
      message: 'Password is too common. Please choose a stronger password',
    };
  }

  return { isValid: true };
}

/**
 * Express validator for password field
 * Can be used with express-validator
 */
export function passwordValidator(value: string): boolean {
  const result = validatePasswordStrength(value);
  return result.isValid;
}

