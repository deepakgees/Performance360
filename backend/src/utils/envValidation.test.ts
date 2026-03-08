/**
 * Unit tests for envValidation
 */

import {
  validateEnvironmentVariables,
  getEnv,
} from './envValidation';

jest.mock('./logger', () => ({
  logger: {
    logError: jest.fn(),
    logInfo: jest.fn(),
  },
}));

describe('envValidation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('validateEnvironmentVariables', () => {
    it('should throw when JWT_SECRET is missing', () => {
      delete process.env.JWT_SECRET;
      process.env.DATABASE_URL = 'postgresql://localhost/db';
      expect(validateEnvironmentVariables).toThrow(/JWT_SECRET is required/);
    });

    it('should throw when JWT_SECRET is empty string', () => {
      process.env.JWT_SECRET = '';
      process.env.DATABASE_URL = 'postgresql://localhost/db';
      expect(validateEnvironmentVariables).toThrow(/JWT_SECRET is required/);
    });

    it('should throw when JWT_SECRET is too short', () => {
      process.env.JWT_SECRET = 'short';
      process.env.DATABASE_URL = 'postgresql://localhost/db';
      expect(validateEnvironmentVariables).toThrow(/at least 32 characters/);
    });

    it('should throw when JWT_SECRET is weak', () => {
      process.env.JWT_SECRET = 'a'.repeat(32) + 'password';
      process.env.DATABASE_URL = 'postgresql://localhost/db';
      expect(validateEnvironmentVariables).toThrow(/weak/);
    });

    it('should throw when DATABASE_URL is missing', () => {
      process.env.JWT_SECRET = 'a'.repeat(32);
      delete process.env.DATABASE_URL;
      expect(validateEnvironmentVariables).toThrow(/DATABASE_URL is required/);
    });

    it('should throw when DATABASE_URL is empty string', () => {
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.DATABASE_URL = '';
      expect(validateEnvironmentVariables).toThrow(/DATABASE_URL is required/);
    });

    it('should throw when DATABASE_URL is invalid', () => {
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.DATABASE_URL = 'mysql://localhost/db';
      expect(validateEnvironmentVariables).toThrow(/PostgreSQL/);
    });

    it('should pass when DATABASE_URL starts with postgres://', () => {
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.DATABASE_URL = 'postgres://localhost:5432/mydb';
      expect(() => validateEnvironmentVariables()).not.toThrow();
    });

    it('should pass when JWT_REFRESH_SECRET is set and valid', () => {
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);
      process.env.DATABASE_URL = 'postgresql://localhost/db';
      expect(() => validateEnvironmentVariables()).not.toThrow();
    });

    it('should throw when PORT is zero', () => {
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.DATABASE_URL = 'postgresql://localhost/db';
      process.env.PORT = '0';
      expect(validateEnvironmentVariables).toThrow(/PORT/);
    });

    it('should pass when required vars are valid', () => {
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.DATABASE_URL = 'postgresql://localhost:5432/mydb';
      expect(() => validateEnvironmentVariables()).not.toThrow();
    });

    it('should throw when PORT is invalid', () => {
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.DATABASE_URL = 'postgresql://localhost/db';
      process.env.PORT = '99999';
      expect(validateEnvironmentVariables).toThrow(/PORT/);
    });

    it('should throw when PORT is not a number', () => {
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.DATABASE_URL = 'postgresql://localhost/db';
      process.env.PORT = 'notaport';
      expect(validateEnvironmentVariables).toThrow(/PORT/);
    });
  });

  describe('getEnv', () => {
    it('should return value when set', () => {
      process.env.MY_VAR = 'value';
      expect(getEnv('MY_VAR')).toBe('value');
    });

    it('should return default when provided and var not set', () => {
      delete process.env.MY_VAR;
      expect(getEnv('MY_VAR', 'default')).toBe('default');
    });

    it('should throw when required and not set', () => {
      delete process.env.MY_VAR;
      expect(() => getEnv('MY_VAR')).toThrow(/MY_VAR is required/);
    });

    it('should throw when value is empty string', () => {
      process.env.MY_VAR = '';
      expect(() => getEnv('MY_VAR')).toThrow(/MY_VAR is required/);
    });
  });
});
