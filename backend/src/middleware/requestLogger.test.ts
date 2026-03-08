/**
 * Unit tests for requestLogger middleware
 */

import { Response } from 'express';
import { requestLogger, responseLogger } from './requestLogger';

jest.mock('../utils/logger', () => ({
  logger: {
    logInfo: jest.fn(),
    logApiAccess: jest.fn(),
  },
}));

const mockNext = jest.fn();

function mockReq(overrides: Record<string, unknown> = {}) {
  return {
    method: 'GET',
    originalUrl: '/api/test',
    url: '/api/test',
    body: {},
    user: undefined,
    ...overrides,
  };
}

function mockRes(): Response {
  const endFn = jest.fn(function (this: Response, chunk?: any, encoding?: any) {
    return this;
  });
  const res: Partial<Response> = {
    statusCode: 200,
    end: endFn,
  };
  (res as any)._endFn = endFn;
  return res as Response;
}

describe('requestLogger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call next and log with Anonymous when no user', () => {
    const req = mockReq();
    requestLogger(req as any, mockRes() as any, mockNext);
    expect(mockNext).toHaveBeenCalled();
    expect(require('../utils/logger').logger.logInfo).toHaveBeenCalledWith(
      'Incoming GET request to /api/test',
      'Anonymous',
      'GET',
      '/api/test'
    );
  });

  it('should log user when req.user is set', () => {
    const req = mockReq({
      user: { firstName: 'Jane', lastName: 'Doe', email: 'j@test.com' },
    });
    requestLogger(req as any, mockRes() as any, mockNext);
    expect(require('../utils/logger').logger.logInfo).toHaveBeenCalledWith(
      expect.any(String),
      'Jane Doe (j@test.com)',
      expect.any(String),
      expect.any(String)
    );
  });

  it('should log sanitized body for register POST', () => {
    const req = mockReq({
      method: 'POST',
      originalUrl: '/api/auth/register',
      body: { email: 'a@b.com', password: 'secret' },
    });
    requestLogger(req as any, mockRes() as any, mockNext);
    expect(require('../utils/logger').logger.logInfo).toHaveBeenCalledTimes(2);
  });
});

describe('responseLogger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call next and wrap res.end to log API access', () => {
    const req = mockReq();
    const res = mockRes();
    const endFn = (res as any)._endFn;
    responseLogger(req as any, res as any, mockNext);
    expect(mockNext).toHaveBeenCalled();
    res.end('ok');
    expect(require('../utils/logger').logger.logApiAccess).toHaveBeenCalledWith(
      'Anonymous',
      'GET',
      '/api/test',
      200,
      expect.any(Number)
    );
    expect(endFn).toHaveBeenCalledWith('ok', undefined);
  });

  it('should use authenticated user in responseLogger when req.user is set', () => {
    const req = mockReq({
      user: { firstName: 'Jane', lastName: 'Doe', email: 'j@test.com' },
    });
    const res = mockRes();
    const endFn = (res as any)._endFn;
    responseLogger(req as any, res as any, mockNext);
    res.end();
    expect(require('../utils/logger').logger.logApiAccess).toHaveBeenCalledWith(
      'Jane Doe (j@test.com)',
      'GET',
      '/api/test',
      200,
      expect.any(Number)
    );
    expect(endFn).toHaveBeenCalled();
  });
});
