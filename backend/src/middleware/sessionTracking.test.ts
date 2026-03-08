/**
 * Unit tests for sessionTracking middleware
 */

import { Response } from 'express';
import { trackSessionActivity, checkSessionTimeout, cleanupExpiredSessions } from './sessionTracking';

declare global {
  var __sessionMockFindFirst: jest.Mock;
  var __sessionMockUpdate: jest.Mock;
  var __sessionMockUpdateMany: jest.Mock;
}

jest.mock('@prisma/client', () => {
  const findFirst = jest.fn();
  const update = jest.fn();
  const updateMany = jest.fn();
  (global as any).__sessionMockFindFirst = findFirst;
  (global as any).__sessionMockUpdate = update;
  (global as any).__sessionMockUpdateMany = updateMany;
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      session: { findFirst, update, updateMany },
    })),
  };
});

jest.mock('jsonwebtoken', () => ({}));

const mockJson = jest.fn();
const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
const mockNext = jest.fn();

function mockRes(): Response {
  return { status: mockStatus } as unknown as Response;
}

describe('sessionTracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  describe('trackSessionActivity', () => {
    it('should call next when no token', async () => {
      const req = { headers: {}, user: undefined };
      await trackSessionActivity(req as any, mockRes(), mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(global.__sessionMockFindFirst).not.toHaveBeenCalled();
    });

    it('should update session when token and user and session found', async () => {
      global.__sessionMockFindFirst.mockResolvedValue({ id: 'sess-1' });
      global.__sessionMockUpdate.mockResolvedValue({});
      const req = {
        headers: { authorization: 'Bearer token123' },
        user: { id: 'user-1' },
      };
      await trackSessionActivity(req as any, mockRes(), mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(global.__sessionMockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sess-1' },
          data: expect.objectContaining({ lastActivityAt: expect.any(Date) }),
        })
      );
    });

    it('should call next without update when session not found', async () => {
      global.__sessionMockFindFirst.mockResolvedValue(null);
      const req = {
        headers: { authorization: 'Bearer token123' },
        user: { id: 'user-1' },
      };
      await trackSessionActivity(req as any, mockRes(), mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(global.__sessionMockUpdate).not.toHaveBeenCalled();
    });

    it('should call next when session tracking throws', async () => {
      global.__sessionMockFindFirst.mockRejectedValue(new Error('DB error'));
      const req = {
        headers: { authorization: 'Bearer token123' },
        user: { id: 'user-1' },
      };
      await trackSessionActivity(req as any, mockRes(), mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('checkSessionTimeout', () => {
    it('should call next when no token', async () => {
      const req = { headers: {}, user: undefined };
      await checkSessionTimeout(req as any, mockRes(), mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 when session expired', async () => {
      const past = new Date(Date.now() - 10000);
      global.__sessionMockFindFirst.mockResolvedValue({
        id: 'sess-1',
        expiresAt: past,
      });
      global.__sessionMockUpdate.mockResolvedValue({});
      const req = {
        headers: { authorization: 'Bearer token123' },
        user: { id: 'user-1' },
      };
      await checkSessionTimeout(req as any, mockRes(), mockNext);
      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Session expired due to inactivity. Please login again.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when no active session found', async () => {
      global.__sessionMockFindFirst.mockResolvedValue(null);
      const req = {
        headers: { authorization: 'Bearer token123' },
        user: { id: 'user-1' },
      };
      await checkSessionTimeout(req as any, mockRes(), mockNext);
      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Invalid session. Please login again.',
      });
    });

    it('should call next when session exists and not expired', async () => {
      const future = new Date(Date.now() + 60000);
      global.__sessionMockFindFirst.mockResolvedValue({
        id: 'sess-1',
        expiresAt: future,
      });
      const req = {
        headers: { authorization: 'Bearer token123' },
        user: { id: 'user-1' },
      };
      await checkSessionTimeout(req as any, mockRes(), mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(mockStatus).not.toHaveBeenCalled();
    });

    it('should return 500 when checkSessionTimeout throws', async () => {
      global.__sessionMockFindFirst.mockRejectedValue(new Error('DB error'));
      const req = {
        headers: { authorization: 'Bearer token123' },
        user: { id: 'user-1' },
      };
      await checkSessionTimeout(req as any, mockRes(), mockNext);
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should return count of deactivated sessions', async () => {
      global.__sessionMockUpdateMany.mockResolvedValue({ count: 5 });
      const count = await cleanupExpiredSessions();
      expect(count).toBe(5);
    });

    it('should return 0 on error', async () => {
      global.__sessionMockUpdateMany.mockRejectedValue(new Error('DB error'));
      const count = await cleanupExpiredSessions();
      expect(count).toBe(0);
    });
  });
});
