/**
 * @fileoverview Log sanitization utilities
 *
 * This module provides functions to sanitize sensitive information
 * from logs to prevent data leakage.
 *
 * @author Performance360 Team
 * @version 1.0.0
 */

/**
 * Redacts sensitive information from objects
 *
 * @param data - Object to sanitize
 * @param sensitiveFields - Array of field names to redact
 * @returns Sanitized object with sensitive fields redacted
 */
export function sanitizeForLogging(
  data: any,
  sensitiveFields: string[] = [
    'password',
    'token',
    'refreshToken',
    'authorization',
    'jwt',
    'secret',
    'apiKey',
    'accessToken',
    'passwordResetToken',
  ]
): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeForLogging(item, sensitiveFields));
  }

  const sanitized: any = {};

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();

    // Check if this field should be redacted
    const shouldRedact = sensitiveFields.some(
      field => lowerKey.includes(field.toLowerCase())
    );

    if (shouldRedact) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeForLogging(value, sensitiveFields);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Redacts email addresses from logs (keeps domain visible)
 *
 * @param email - Email address to redact
 * @returns Redacted email (e.g., u***@example.com)
 */
export function redactEmail(email: string): string {
  if (!email || !email.includes('@')) {
    return email;
  }

  const [localPart, domain] = email.split('@');
  if (localPart.length <= 2) {
    return `${localPart[0]}***@${domain}`;
  }
  return `${localPart[0]}${'*'.repeat(localPart.length - 2)}${localPart[localPart.length - 1]}@${domain}`;
}

/**
 * Redacts user IDs while keeping format visible
 *
 * @param userId - User ID to redact
 * @returns Redacted user ID
 */
export function redactUserId(userId: string): string {
  if (!userId || userId.length <= 4) {
    return '***';
  }
  return `${userId.substring(0, 2)}${'*'.repeat(userId.length - 4)}${userId.substring(userId.length - 2)}`;
}

