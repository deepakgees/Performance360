/**
 * @fileoverview Authentication and authorization middleware
 *
 * This module provides middleware functions for JWT token authentication
 * and role-based access control for the Performance360 API.
 *
 * @author Performance360 Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { PrismaClient } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

/**
 * Extended Request interface that includes user information
 * after successful authentication
 */
export interface AuthRequest extends Request {
  /** User object containing authentication details */
  user?: {
    /** Unique user identifier */
    id: string;
    /** User's email address */
    email: string;
    /** User's first name */
    firstName: string;
    /** User's last name */
    lastName: string;
    /** User's role in the system (ADMIN, MANAGER, EMPLOYEE) */
    role: string;
  };
}

/**
 * Prisma client instance for database operations
 */
const prisma = new PrismaClient();

/**
 * JWT token authentication middleware
 *
 * Verifies the JWT token from the Authorization header and
 * attaches complete user information to the request object if valid.
 *
 * @param req - Express request object with potential user data
 * @param res - Express response object
 * @param next - Express next function
 *
 * @example
 * // Usage in route
 * app.get('/protected', authenticateToken, (req, res) => {
 *   // req.user is now available with complete user data
 *   res.json({ user: req.user });
 * });
 *
 * @throws {401} When no token is provided
 * @throws {403} When token is invalid or expired
 */
export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // Fetch complete user information from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(403).json({ message: 'User not found or inactive' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };

    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

/**
 * Role-based authorization middleware factory
 *
 * Creates middleware that checks if the authenticated user
 * has one of the required roles to access the endpoint.
 *
 * @param roles - Array of allowed roles for the endpoint
 * @returns Express middleware function
 *
 * @example
 * // Usage in route - only ADMIN and MANAGER can access
 * app.get('/admin', authenticateToken, requireRole(['ADMIN', 'MANAGER']), (req, res) => {
 *   res.json({ message: 'Admin access granted' });
 * });
 *
 * @throws {401} When user is not authenticated
 * @throws {403} When user doesn't have required role
 */
export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};
