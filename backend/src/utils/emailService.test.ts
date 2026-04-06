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

    it('should return false and log when sendMail throws EAUTH', async () => {
      process.env.SMTP_HOST = 'smtp.test.com';
      process.env.SMTP_PORT = '587';
      process.env.SMTP_USER = 'user';
      process.env.SMTP_PASS = 'pass';
      const err = new Error('Invalid login') as Error & { code?: string };
      err.code = 'EAUTH';
      getSendMailMock().mockRejectedValue(err);
      const result = await sendPasswordResetEmail(
        'user@test.com',
        'User',
        'token123'
      );
      expect(result).toBe(false);
    });

    it('should return false and log when sendMail throws ESOCKET', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      process.env.SMTP_PORT = '25';
      process.env.SMTP_USER = 'user';
      process.env.SMTP_PASS = 'pass';
      const err = new Error('Connection failed') as Error & { code?: string };
      err.code = 'ESOCKET';
      getSendMailMock().mockRejectedValue(err);
      const result = await sendPasswordResetEmail(
        'user@test.com',
        'User',
        'token123'
      );
      expect(result).toBe(false);
    });

    it('should use FRONTEND_URL when frontendUrl param not provided', async () => {
      process.env.SMTP_HOST = 'smtp.test.com';
      process.env.SMTP_PORT = '587';
      process.env.SMTP_USER = 'user';
      process.env.SMTP_PASS = 'pass';
      process.env.FRONTEND_URL = 'https://app.example.com';
      getSendMailMock().mockResolvedValue({ messageId: 'id' });
      await sendPasswordResetEmail('user@test.com', 'User', 'token123');
      const call = getSendMailMock().mock.calls[0][0];
      expect(call.html).toContain('https://app.example.com/reset-password');
    });

    it('should use hideSenderEmail when SMTP_HIDE_SENDER_EMAIL is true', async () => {
      process.env.SMTP_HOST = 'smtp.test.com';
      process.env.SMTP_PORT = '587';
      process.env.SMTP_USER = 'user';
      process.env.SMTP_PASS = 'pass';
      delete process.env.SMTP_FROM_NAME;
      process.env.SMTP_HIDE_SENDER_EMAIL = 'true';
      getSendMailMock().mockResolvedValue({});
      await sendPasswordResetEmail('user@test.com', 'User', 'token123');
      const call = getSendMailMock().mock.calls[0][0];
      expect(call.from).toBe('"Performance360"');
    });

    it('should normalize SMTP_FROM_NAME when the env value includes outer quotes', async () => {
      process.env.SMTP_HOST = 'smtp.test.com';
      process.env.SMTP_PORT = '587';
      process.env.SMTP_USER = 'user';
      process.env.SMTP_PASS = 'pass';
      process.env.SMTP_FROM_NAME = '"Performance360"';
      getSendMailMock().mockResolvedValue({ messageId: 'id' });
      await sendPasswordResetEmail('user@test.com', 'User', 'token123');
      const call = getSendMailMock().mock.calls[0][0];
      expect(call.from).toBe('"Performance360" <user>');
    });

    it('should create transporter with port 465 (secure)', async () => {
      process.env.SMTP_HOST = 'smtp.test.com';
      process.env.SMTP_PORT = '465';
      process.env.SMTP_USER = 'user';
      process.env.SMTP_PASS = 'pass';
      process.env.SMTP_TLS_REJECT_UNAUTHORIZED = 'false';
      process.env.SMTP_DEBUG = 'true';
      getSendMailMock().mockResolvedValue({});
      const result = await sendPasswordResetEmail(
        'user@test.com',
        'User',
        'token123'
      );
      expect(result).toBe(true);
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

    it('should format HTML message with p tag that has style attribute', async () => {
      process.env.SMTP_HOST = 'smtp.test.com';
      process.env.SMTP_PORT = '587';
      process.env.SMTP_USER = 'user';
      process.env.SMTP_PASS = 'pass';
      getSendMailMock().mockResolvedValue({});
      await sendCustomizedEmailWithResetLink(
        'user@test.com',
        'User',
        'token123',
        'Subject',
        '<p style="margin:0">Styled</p>'
      );
      const call = getSendMailMock().mock.calls[0][0];
      expect(call.html).toContain('Styled');
    });

    it('should format HTML message with p tag that has attributes but no style', async () => {
      process.env.SMTP_HOST = 'smtp.test.com';
      process.env.SMTP_PORT = '587';
      process.env.SMTP_USER = 'user';
      process.env.SMTP_PASS = 'pass';
      getSendMailMock().mockResolvedValue({});
      await sendCustomizedEmailWithResetLink(
        'user@test.com',
        'User',
        'token123',
        'Subject',
        '<p class="intro">No style attr</p>'
      );
      const call = getSendMailMock().mock.calls[0][0];
      expect(call.html).toContain('No style attr');
    });

    it('should format plain text message with paragraphs', async () => {
      process.env.SMTP_HOST = 'smtp.test.com';
      process.env.SMTP_PORT = '587';
      process.env.SMTP_USER = 'user';
      process.env.SMTP_PASS = 'pass';
      getSendMailMock().mockResolvedValue({});
      await sendCustomizedEmailWithResetLink(
        'user@test.com',
        'User',
        'token123',
        'Subject',
        'First para\n\nSecond para'
      );
      const call = getSendMailMock().mock.calls[0][0];
      expect(call.html).toContain('First para');
      expect(call.html).toContain('Second para');
    });

    it('should format empty-looking message as single paragraph', async () => {
      process.env.SMTP_HOST = 'smtp.test.com';
      process.env.SMTP_PORT = '587';
      process.env.SMTP_USER = 'user';
      process.env.SMTP_PASS = 'pass';
      getSendMailMock().mockResolvedValue({});
      await sendCustomizedEmailWithResetLink(
        'user@test.com',
        'User',
        'token123',
        'Subject',
        '  \n\n  '
      );
      expect(getSendMailMock()).toHaveBeenCalled();
    });

    it('should return false when sendMail throws EAUTH', async () => {
      process.env.SMTP_HOST = 'smtp.test.com';
      process.env.SMTP_PORT = '587';
      process.env.SMTP_USER = 'user';
      process.env.SMTP_PASS = 'pass';
      const err = new Error('Auth failed') as Error & { code?: string };
      err.code = 'EAUTH';
      getSendMailMock().mockRejectedValue(err);
      const result = await sendCustomizedEmailWithResetLink(
        'user@test.com',
        'User',
        'token123',
        'Subj',
        'Msg'
      );
      expect(result).toBe(false);
    });

    it('should return false when sendMail throws ETIMEDOUT', async () => {
      process.env.SMTP_HOST = 'smtp.test.com';
      process.env.SMTP_PORT = '587';
      process.env.SMTP_USER = 'user';
      process.env.SMTP_PASS = 'pass';
      const err = new Error('Timeout') as Error & { code?: string };
      err.code = 'ETIMEDOUT';
      getSendMailMock().mockRejectedValue(err);
      const result = await sendCustomizedEmailWithResetLink(
        'user@test.com',
        'User',
        'token123',
        'Subj',
        'Msg'
      );
      expect(result).toBe(false);
    });
  });
});
