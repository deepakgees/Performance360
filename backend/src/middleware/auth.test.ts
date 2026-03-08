/**
 * Unit tests for auth middleware
 */

import { Response } from 'express';
import { AuthRequest, authenticateToken, requireRole } from './auth';

declare global {
  var __authMockUserFindUnique: jest.Mock;
  var __authMockVerify: jest.Mock;
}

jest.mock('@prisma/client', () => {
  const findUnique = jest.fn();
  (global as typeof globalThis & { __authMockUserFindUnique: jest.Mock }).__authMockUserFindUnique = findUnique;
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      user: { findUnique },
    })),
  };
});

jest.mock('jsonwebtoken', () => {
  const verify = jest.fn();
  (global as typeof globalThis & { __authMockVerify: jest.Mock }).__authMockVerify = verify;
  return { verify: (...args: unknown[]) => verify(...args) };
});

const mockJson = jest.fn();
const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
const mockNext = jest.fn();

function mockRes(): Response {
  return { status: mockStatus } as unknown as Response;
}

describe('auth middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('requireRole', () => {
    it('should call next when user has required role', () => {
      const req = { user: { id: '1', email: 'a@b.com', firstName: 'A', lastName: 'B', role: 'ADMIN' } } as AuthRequest;
      const res = mockRes();
      requireRole(['ADMIN'])(req, res, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(mockStatus).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', () => {
      const req = {} as AuthRequest;
      const res = mockRes();
      requireRole(['ADMIN'])(req, res, mockNext);
      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Authentication required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when user does not have required role', () => {
      const req = { user: { id: '1', email: 'a@b.com', firstName: 'A', lastName: 'B', role: 'EMPLOYEE' } } as AuthRequest;
      const res = mockRes();
      requireRole(['ADMIN', 'MANAGER'])(req, res, mockNext);
      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Insufficient permissions' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next when user has one of the allowed roles', () => {
      const req = { user: { id: '1', email: 'a@b.com', firstName: 'A', lastName: 'B', role: 'MANAGER' } } as AuthRequest;
      const res = mockRes();
      requireRole(['ADMIN', 'MANAGER'])(req, res, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('authenticateToken', () => {
    it('should return 401 when no authorization header', async () => {
      const req = { headers: {} } as AuthRequest;
      const res = mockRes();
      await authenticateToken(req, res, mockNext);
      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Access token required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header has no Bearer token', async () => {
      const req = { headers: { authorization: 'Invalid' } } as AuthRequest;
      const res = mockRes();
      await authenticateToken(req, res, mockNext);
      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when token is invalid', async () => {
      global.__authMockVerify.mockImplementation(() => {
        throw new Error('invalid');
      });
      const req = { headers: { authorization: 'Bearer bad-token' } } as AuthRequest;
      const res = mockRes();
      await authenticateToken(req, res, mockNext);
      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when user not found or inactive', async () => {
      global.__authMockVerify.mockReturnValue({ id: 'user-1' });
      global.__authMockUserFindUnique.mockResolvedValue(null);
      const req = { headers: { authorization: 'Bearer valid-token' } } as AuthRequest;
      const res = mockRes();
      await authenticateToken(req, res, mockNext);
      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({ message: 'User not found or inactive' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should attach user and call next when token and user are valid', async () => {
      global.__authMockVerify.mockReturnValue({ id: 'user-1' });
      global.__authMockUserFindUnique.mockResolvedValue({
        id: 'user-1',
        email: 'u@test.com',
        firstName: 'U',
        lastName: 'Ser',
        role: 'EMPLOYEE',
        isActive: true,
      });
      const req = { headers: { authorization: 'Bearer valid-token' } } as AuthRequest;
      const res = mockRes();
      await authenticateToken(req, res, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(req.user).toEqual({
        id: 'user-1',
        email: 'u@test.com',
        firstName: 'U',
        lastName: 'Ser',
        role: 'EMPLOYEE',
      });
    });
  });
});
