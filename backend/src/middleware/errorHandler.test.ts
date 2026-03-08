/**
 * Unit tests for errorHandler middleware
 */

import { Response } from 'express';
import { errorHandler } from './errorHandler';

jest.mock('../utils/logger', () => ({
  logger: {
    logError: jest.fn(),
    logWarning: jest.fn(),
  },
}));

const mockJson = jest.fn();
const mockStatus = jest.fn().mockReturnValue({ json: mockJson });

function mockReq(overrides: Record<string, unknown> = {}) {
  return {
    method: 'GET',
    originalUrl: '/api/test',
    url: '/api/test',
    body: {},
    query: {},
    params: {},
    headers: { 'user-agent': 'test-agent' },
    socket: { remoteAddress: '127.0.0.1' },
    ...overrides,
  };
}

function mockRes(): Response {
  return { status: mockStatus } as unknown as Response;
}

describe('errorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it('should return 400 for ValidationError', () => {
    const err = new Error('Invalid input');
    err.name = 'ValidationError';
    errorHandler(err, mockReq() as any, mockRes(), () => {});
    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      message: 'Validation error',
      errors: 'Invalid input',
    });
  });

  it('should return 401 for UnauthorizedError', () => {
    const err = new Error('Invalid token');
    err.name = 'UnauthorizedError';
    errorHandler(err, mockReq() as any, mockRes(), () => {});
    expect(mockStatus).toHaveBeenCalledWith(401);
    expect(mockJson).toHaveBeenCalledWith({ message: 'Unauthorized' });
  });

  it('should return 401 for JsonWebTokenError', () => {
    const err = new Error('jwt malformed');
    err.name = 'JsonWebTokenError';
    errorHandler(err, mockReq() as any, mockRes(), () => {});
    expect(mockStatus).toHaveBeenCalledWith(401);
  });

  it('should return 409 for Prisma P2002 (unique constraint)', () => {
    const err = new Error('Unique constraint failed');
    (err as any).code = 'P2002';
    errorHandler(err, mockReq() as any, mockRes(), () => {});
    expect(mockStatus).toHaveBeenCalledWith(409);
    expect(mockJson).toHaveBeenCalledWith({
      message: 'Unable to complete registration. Please check your information and try again.',
    });
  });

  it('should return 500 for unknown errors', () => {
    errorHandler(new Error('Unknown'), mockReq() as any, mockRes(), () => {});
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({ message: 'Internal server error' });
  });

  it('should include user info when req.user is set', () => {
    const req = mockReq({
      user: { firstName: 'John', lastName: 'Doe', email: 'j@test.com' },
    });
    errorHandler(new Error('Test'), req as any, mockRes(), () => {});
    expect(mockStatus).toHaveBeenCalledWith(500);
  });

  it('should add extra error properties to errorInfo for debugging', () => {
    const err = new Error('Custom error');
    (err as any).customField = 'customValue';
    errorHandler(err, mockReq() as any, mockRes(), () => {});
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({ message: 'Internal server error' });
  });

  it('should return 400 for ExpressValidatorError', () => {
    const err = new Error('Invalid input');
    err.name = 'ExpressValidatorError';
    errorHandler(err, mockReq() as any, mockRes(), () => {});
    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      message: 'Validation error',
      errors: 'Invalid input',
    });
  });

  it('should return 500 for Prisma error other than P2002', () => {
    const err = new Error('Record not found');
    (err as any).code = 'P2003';
    errorHandler(err, mockReq() as any, mockRes(), () => {});
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({ message: 'Internal server error' });
  });

  it('should handle error without stack', () => {
    const err = new Error('No stack');
    err.stack = undefined;
    errorHandler(err, mockReq() as any, mockRes(), () => {});
    expect(mockStatus).toHaveBeenCalledWith(500);
  });

  it('should include prisma meta in errorInfo when err.meta is set', () => {
    const err = new Error('Prisma error');
    (err as any).code = 'P2002';
    (err as any).meta = { target: ['email'] };
    errorHandler(err, mockReq() as any, mockRes(), () => {});
    expect(mockStatus).toHaveBeenCalledWith(409);
  });

  it('should handle error with code but no meta', () => {
    const err = new Error('Prisma error');
    (err as any).code = 'P2003';
    (err as any).meta = undefined;
    errorHandler(err, mockReq() as any, mockRes(), () => {});
    expect(mockStatus).toHaveBeenCalledWith(500);
  });

  it('should use unknown ip when no x-forwarded-for or socket address', () => {
    const req = mockReq({
      headers: { 'user-agent': 'test' },
      socket: { remoteAddress: undefined },
    });
    (req as any).headers['x-forwarded-for'] = undefined;
    errorHandler(new Error('Test'), req as any, mockRes(), () => {});
    expect(mockStatus).toHaveBeenCalledWith(500);
  });

  it('should handle error-like object with no stack or code', () => {
    const err = { message: 'Minimal error', name: 'Error' };
    errorHandler(err as any, mockReq() as any, mockRes(), () => {});
    expect(mockStatus).toHaveBeenCalledWith(500);
  });
});
