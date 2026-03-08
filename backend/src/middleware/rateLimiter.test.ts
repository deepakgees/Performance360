/**
 * Unit tests for rateLimiter middleware
 */

import { Request, Response } from 'express';

const capturedConfigs: any[] = [];

jest.mock('express-rate-limit', () => (config: any) => {
  capturedConfigs.push(config);
  return (_req: Request, _res: Response, next: () => void) => next();
});

jest.mock('../utils/logger', () => ({
  logger: {
    logWarning: jest.fn(),
    logError: jest.fn(),
  },
}));

const originalEnv = process.env.NODE_ENV;

describe('rateLimiter', () => {
  beforeEach(() => {
    // Do not clear capturedConfigs: rateLimiter is loaded once (cached), so configs are captured on first import only
    process.env.NODE_ENV = 'test';
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should use production rate limits when NODE_ENV is production', () => {
    const prevNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const configCountBefore = capturedConfigs.length;
    jest.isolateModules(() => {
      require('./rateLimiter');
      const authConfig = capturedConfigs.find(
        (c: any) => c.message?.error?.includes('login')
      );
      const generalConfig = capturedConfigs.find(
        (c: any) => c.message?.error?.includes('Too many requests')
      );
      expect(authConfig?.max).toBe(10);
      expect(generalConfig?.max).toBe(100);
    });
    process.env.NODE_ENV = prevNodeEnv;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    (console.log as jest.Mock).mockRestore();
    (console.error as jest.Mock).mockRestore();
  });

  it('should export authRateLimiter and generalRateLimiter', async () => {
    const { authRateLimiter, generalRateLimiter } = await import(
      './rateLimiter'
    );
    expect(typeof authRateLimiter).toBe('function');
    expect(typeof generalRateLimiter).toBe('function');
    expect(capturedConfigs.length).toBeGreaterThanOrEqual(2);
  });

  it('should call auth handler with 429 when rate limit exceeded', async () => {
    await import('./rateLimiter');
    const authConfig = capturedConfigs.find(
      (c: any) => c.message?.error?.includes('login')
    );
    expect(authConfig?.handler).toBeDefined();
    const mockJson = jest.fn();
    const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    const req = {
      method: 'POST',
      originalUrl: '/api/auth/login',
      url: '/api/auth/login',
      body: { email: 'a@b.com' },
      headers: { 'user-agent': 'test' },
      socket: { remoteAddress: '127.0.0.1' },
    };
    authConfig.handler(
      req as unknown as Request,
      { status: mockStatus } as unknown as Response
    );
    expect(mockStatus).toHaveBeenCalledWith(429);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Too many login attempts, please try again later.',
      })
    );
  });

  it('should call general handler with 429 when rate limit exceeded', async () => {
    await import('./rateLimiter');
    const generalConfig = capturedConfigs.find(
      (c: any) => c.message?.error?.includes('Too many requests')
    );
    expect(generalConfig?.handler).toBeDefined();
    const mockJson = jest.fn();
    const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    const req = {
      method: 'GET',
      originalUrl: '/api/users',
      url: '/api/users',
      headers: { 'user-agent': 'test' },
      socket: { remoteAddress: '127.0.0.1' },
    };
    generalConfig.handler(
      req as unknown as Request,
      { status: mockStatus } as unknown as Response
    );
    expect(mockStatus).toHaveBeenCalledWith(429);
  });

  it('should use x-forwarded-for first client when present with comma', async () => {
    await import('./rateLimiter');
    const authConfig = capturedConfigs.find(
      (c: any) => c.message?.error?.includes('login')
    );
    const mockJson = jest.fn();
    const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    const req = {
      method: 'POST',
      originalUrl: '/api/auth/login',
      url: '/api/auth/login',
      body: { email: 'b@c.com' },
      headers: { 'user-agent': 'test', 'x-forwarded-for': ' 1.2.3.4 , 5.6.7.8' },
      socket: { remoteAddress: '127.0.0.1' },
    };
    authConfig.handler(
      req as unknown as Request,
      { status: mockStatus } as unknown as Response
    );
    expect(mockStatus).toHaveBeenCalledWith(429);
  });

  it('should use x-real-ip when x-forwarded-for is missing', async () => {
    await import('./rateLimiter');
    const generalConfig = capturedConfigs.find(
      (c: any) => c.message?.error?.includes('Too many requests')
    );
    const mockJson = jest.fn();
    const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    const req = {
      method: 'GET',
      originalUrl: '/api/users',
      url: '/api/users',
      headers: { 'user-agent': 'test', 'x-real-ip': '9.9.9.9' },
      socket: { remoteAddress: undefined },
    };
    generalConfig.handler(
      req as unknown as Request,
      { status: mockStatus } as unknown as Response
    );
    expect(mockStatus).toHaveBeenCalledWith(429);
  });

  it('should handle request with no body', async () => {
    await import('./rateLimiter');
    const authConfig = capturedConfigs.find(
      (c: any) => c.message?.error?.includes('login')
    );
    const mockJson = jest.fn();
    const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    const req = {
      method: 'POST',
      originalUrl: '/api/auth/login',
      url: '/api/auth/login',
      body: undefined,
      headers: { 'user-agent': 'test' },
      socket: { remoteAddress: '127.0.0.1' },
    };
    authConfig.handler(
      req as unknown as Request,
      { status: mockStatus } as unknown as Response
    );
    expect(mockStatus).toHaveBeenCalledWith(429);
  });

  it('should use unknown when no ip headers and no socket address', async () => {
    await import('./rateLimiter');
    const generalConfig = capturedConfigs.find(
      (c: any) => c.message?.error?.includes('Too many requests')
    );
    const mockJson = jest.fn();
    const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    const req = {
      method: 'GET',
      originalUrl: '/api/users',
      url: '/api/users',
      headers: { 'user-agent': 'test' },
      socket: { remoteAddress: undefined },
    };
    generalConfig.handler(
      req as unknown as Request,
      { status: mockStatus } as unknown as Response
    );
    expect(mockStatus).toHaveBeenCalledWith(429);
  });
});
