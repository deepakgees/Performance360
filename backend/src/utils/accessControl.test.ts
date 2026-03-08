/**
 * Unit tests for accessControl utilities
 */

import { checkUserAccess, checkIndirectReport } from './accessControl';

declare global {
  var __acMockFindMany: jest.Mock;
  var __acMockFindFirst: jest.Mock;
}

jest.mock('@prisma/client', () => {
  const findMany = jest.fn();
  const findFirst = jest.fn();
  (global as typeof globalThis & { __acMockFindMany: jest.Mock }).__acMockFindMany = findMany;
  (global as typeof globalThis & { __acMockFindFirst: jest.Mock }).__acMockFindFirst = findFirst;
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      user: { findMany, findFirst },
    })),
  };
});

jest.mock('./logger', () => ({
  logger: { logError: jest.fn() },
}));

describe('accessControl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkUserAccess', () => {
    it('should return true when current user is same as target', async () => {
      const result = await checkUserAccess('user-1', 'EMPLOYEE', 'user-1');
      expect(result).toBe(true);
      expect(global.__acMockFindFirst).not.toHaveBeenCalled();
    });

    it('should return true when current user is ADMIN', async () => {
      const result = await checkUserAccess('admin-1', 'ADMIN', 'any-user');
      expect(result).toBe(true);
      expect(global.__acMockFindFirst).not.toHaveBeenCalled();
    });

    it('should return true when MANAGER and target is direct report', async () => {
      global.__acMockFindFirst.mockResolvedValueOnce({ id: 'emp-1' });
      const result = await checkUserAccess('mgr-1', 'MANAGER', 'emp-1');
      expect(result).toBe(true);
      expect(global.__acMockFindFirst).toHaveBeenCalledWith({
        where: { id: 'emp-1', managerId: 'mgr-1', isActive: true },
      });
    });

    it('should return false when EMPLOYEE and target is different user', async () => {
      const result = await checkUserAccess('emp-1', 'EMPLOYEE', 'other-1');
      expect(result).toBe(false);
    });
  });

  describe('checkIndirectReport', () => {
    it('should return false when manager has no direct reports', async () => {
      global.__acMockFindMany.mockResolvedValue([]);
      const result = await checkIndirectReport('mgr-1', 'emp-1');
      expect(result).toBe(false);
    });

    it('should return true when employee is direct report of a direct report', async () => {
      global.__acMockFindMany.mockResolvedValue([{ id: 'mgr-2' }]);
      global.__acMockFindFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'emp-1' });
      const result = await checkIndirectReport('mgr-1', 'emp-1');
      expect(result).toBe(true);
    });

    it('should return false when prisma throws in checkIndirectReport', async () => {
      global.__acMockFindMany.mockRejectedValue(new Error('DB error'));
      const result = await checkIndirectReport('mgr-1', 'emp-1');
      expect(result).toBe(false);
    });
  });

  describe('checkUserAccess manager indirect report', () => {
    it('should return true when MANAGER and target is indirect report', async () => {
      global.__acMockFindFirst.mockResolvedValueOnce(null);
      global.__acMockFindMany.mockResolvedValue([{ id: 'sub-mgr' }]);
      global.__acMockFindFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'emp-1' });
      const result = await checkUserAccess('mgr-1', 'MANAGER', 'emp-1');
      expect(result).toBe(true);
    });
  });
});
