/**
 * @fileoverview Environment variable validation
 *
 * This module validates required environment variables on application startup
 * to ensure all security-critical configurations are properly set.
 *
 * @author Performance360 Team
 * @version 1.0.0
 */

import { logger } from './logger';

interface EnvValidation {
  name: string;
  required: boolean;
  validator?: (value: string) => { isValid: boolean; message?: string };
}

/**
 * Validates JWT secret strength
 */
function validateJWTSecret(secret: string): { isValid: boolean; message?: string } {
  if (!secret) {
    return { isValid: false, message: 'JWT_SECRET is required' };
  }

  if (secret.length < 32) {
    return {
      isValid: false,
      message: 'JWT_SECRET must be at least 32 characters long for security',
    };
  }

  // Check for common weak secrets
  const weakSecrets = ['secret', 'password', '123456', 'changeme'];
  if (weakSecrets.some(weak => secret.toLowerCase().includes(weak))) {
    return {
      isValid: false,
      message: 'JWT_SECRET appears to be weak. Use a strong, random secret.',
    };
  }

  return { isValid: true };
}

/**
 * Validates database URL format
 */
function validateDatabaseUrl(url: string): { isValid: boolean; message?: string } {
  if (!url) {
    return { isValid: false, message: 'DATABASE_URL is required' };
  }

  // Basic validation - should start with postgresql:// or postgres://
  if (!url.startsWith('postgresql://') && !url.startsWith('postgres://')) {
    return {
      isValid: false,
      message: 'DATABASE_URL must be a valid PostgreSQL connection string',
    };
  }

  return { isValid: true };
}

/**
 * Environment variable validations
 */
const envValidations: EnvValidation[] = [
  {
    name: 'JWT_SECRET',
    required: true,
    validator: validateJWTSecret,
  },
  {
    name: 'JWT_REFRESH_SECRET',
    required: false, // Optional, falls back to JWT_SECRET
    validator: (value) => {
      if (!value) return { isValid: true }; // Optional
      return validateJWTSecret(value);
    },
  },
  {
    name: 'DATABASE_URL',
    required: true,
    validator: validateDatabaseUrl,
  },
  {
    name: 'PORT',
    required: false,
    validator: (value) => {
      if (!value) return { isValid: true }; // Optional, has default
      const port = parseInt(value, 10);
      if (isNaN(port) || port < 1 || port > 65535) {
        return {
          isValid: false,
          message: 'PORT must be a valid port number (1-65535)',
        };
      }
      return { isValid: true };
    },
  },
];

/**
 * Validates all required environment variables
 *
 * @throws Error if validation fails
 */
export function validateEnvironmentVariables(): void {
  const errors: string[] = [];

  for (const validation of envValidations) {
    const value = process.env[validation.name];

    if (validation.required && !value) {
      errors.push(`${validation.name} is required but not set`);
      continue;
    }

    if (value && validation.validator) {
      const result = validation.validator(value);
      if (!result.isValid) {
        errors.push(
          `${validation.name}: ${result.message || 'Invalid value'}`
        );
      }
    }
  }

  if (errors.length > 0) {
    const errorMessage = `Environment variable validation failed:\n${errors.join('\n')}`;
    logger.logError('Environment validation failed', { errors });
    throw new Error(errorMessage);
  }

  logger.logInfo('Environment variables validated successfully');
}

/**
 * Gets environment variable with validation
 *
 * @param name - Environment variable name
 * @param defaultValue - Default value if not set
 * @returns Environment variable value
 */
export function getEnv(name: string, defaultValue?: string): string {
  const value = process.env[name] || defaultValue;

  if (!value) {
    throw new Error(`Environment variable ${name} is required but not set`);
  }

  return value;
}

