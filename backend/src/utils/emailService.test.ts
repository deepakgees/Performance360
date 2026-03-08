/**
 * Unit tests for emailService
 */

import nodemailer from 'nodemailer';
import { sendPasswordResetEmail, sendCustomizedEmailWithResetLink } from './emailService';

// Mock must define the jest.fn inside the factory (hoisting), then we get it via createTransport().sendMail
jest.mock('nodemailer', () => {
  const sendMail = jest.fn();
  return {
    __esModule: true,
    default: {
      createTransport: () => ({ sendMail }),
    },
  };
});

function getSendMailMock(): jest.Mock {
  return (nodemailer as any).createTransport().sendMail;
}

jest.mock('./logger', () => ({
  logger: {
    logInfo: jest.fn(),
    logError: jest.fn(),
    logWarning: jest.fn(),
  },
}));

describe('emailService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('sendPasswordResetEmail', () => {
    it('should return false when SMTP is not configured', async () => {
      delete process.env.SMTP_HOST;
      delete process.env.SMTP_PORT;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;
      const result = await sendPasswordResetEmail(
        'user@test.com',
        'User',
        'token123'
      );
      expect(result).toBe(false);
      expect(getSendMailMock()).not.toHaveBeenCalled();
    });

    it('should send email and return true when SMTP is configured', async () => {
      process.env.SMTP_HOST = 'smtp.test.com';
      process.env.SMTP_PORT = '587';
      process.env.SMTP_USER = 'user';
      process.env.SMTP_PASS = 'pass';
      getSendMailMock().mockResolvedValue({ messageId: 'id' });
      const result = await sendPasswordResetEmail(
        'user@test.com',
        'User',
        'token123',
        'https://app.test.com'
      );
      expect(result).toBe(true);
      const sendMailMock = getSendMailMock();
      expect(sendMailMock).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          subject: 'Password Reset Request',
        })
      );
      expect(sendMailMock.mock.calls[0][0].html).toContain('token123');
      expect(sendMailMock.mock.calls[0][0].html).toContain(
        'https://app.test.com/reset-password'
      );
    });

    it('should return false when sendMail throws', async () => {
      process.env.SMTP_HOST = 'smtp.test.com';
      process.env.SMTP_PORT = '587';
      process.env.SMTP_USER = 'user';
      process.env.SMTP_PASS = 'pass';
      getSendMailMock().mockRejectedValue(new Error('SMTP error'));
      const result = await sendPasswordResetEmail(
        'user@test.com',
        'User',
        'token123'
      );
      expect(result).toBe(false);
    });
  });

  describe('sendCustomizedEmailWithResetLink', () => {
    it('should return false when SMTP is not configured', async () => {
      delete process.env.SMTP_HOST;
      const result = await sendCustomizedEmailWithResetLink(
        'user@test.com',
        'User',
        'token123',
        'Subject',
        'Message'
      );
      expect(result).toBe(false);
    });

    it('should send email when SMTP is configured', async () => {
      process.env.SMTP_HOST = 'smtp.test.com';
      process.env.SMTP_PORT = '587';
      process.env.SMTP_USER = 'user';
      process.env.SMTP_PASS = 'pass';
      getSendMailMock().mockResolvedValue({});
      const result = await sendCustomizedEmailWithResetLink(
        'user@test.com',
        'User',
        'token123',
        'Custom Subject',
        '<p>Hello</p>'
      );
      expect(result).toBe(true);
      expect(getSendMailMock()).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          subject: 'Custom Subject',
        })
      );
    });
  });
});
