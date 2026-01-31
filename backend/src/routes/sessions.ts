/**
 * @fileoverview Session management routes (Admin only)
 *
 * This module handles session viewing and management endpoints
 * that are only accessible to ADMIN users.
 *
 * @author Performance360 Team
 * @version 1.0.0
 * @since 2024-01-11
 */

import { PrismaClient } from '@prisma/client';
import { Request, Response, Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/auth';
import { logger } from '../utils/logger';

/**
 * Express router instance for session routes
 */
const router = Router();

/**
 * Prisma client instance for database operations
 */
const prisma = new PrismaClient();

/**
 * Get all sessions (Admin only)
 *
 * Retrieves all user sessions with pagination support.
 * Only accessible to ADMIN users.
 *
 * @route GET /api/sessions
 * @auth Requires ADMIN role
 *
 * @param {number} req.query.page - Page number (default: 1)
 * @param {number} req.query.limit - Items per page (default: 50, max: 100)
 * @param {string} req.query.userId - Filter by user ID (optional)
 * @param {boolean} req.query.isActive - Filter by active status (optional)
 *
 * @returns {Object} 200 - Sessions list with pagination metadata
 * @returns {Object} 403 - Insufficient permissions
 * @returns {Object} 500 - Internal server error
 */
router.get(
  '/',
  authenticateToken,
  requireRole(['ADMIN']),
  async (req: AuthRequest, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const skip = (page - 1) * limit;
      const userId = req.query.userId as string | undefined;
      const isActive = req.query.isActive
        ? req.query.isActive === 'true'
        : undefined;

      // Build where clause
      const where: any = {};
      if (userId) {
        where.userId = userId;
      }
      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      // Get sessions with user information
      const [sessions, total] = await Promise.all([
        prisma.session.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: limit,
        }),
        prisma.session.count({ where }),
      ]);

      logger.logDatabaseOperation('SELECT', 'sessions', req.user?.id);

      res.json({
        sessions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.logError('Error fetching sessions', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

/**
 * Get session statistics (Admin only)
 *
 * Retrieves statistics about user sessions.
 * Only accessible to ADMIN users.
 *
 * @route GET /api/sessions/stats
 * @auth Requires ADMIN role
 *
 * @returns {Object} 200 - Session statistics
 * @returns {Object} 403 - Insufficient permissions
 * @returns {Object} 500 - Internal server error
 */
router.get(
  '/stats',
  authenticateToken,
  requireRole(['ADMIN']),
  async (req: AuthRequest, res: Response) => {
    try {
      const [
        totalSessions,
        activeSessions,
        expiredSessions,
        sessionsToday,
        uniqueUsers,
      ] = await Promise.all([
        prisma.session.count(),
        prisma.session.count({ where: { isActive: true } }),
        prisma.session.count({
          where: {
            isActive: false,
            expiresAt: {
              lt: new Date(),
            },
          },
        }),
        prisma.session.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
        prisma.session.groupBy({
          by: ['userId'],
          _count: {
            userId: true,
          },
        }),
      ]);

      logger.logDatabaseOperation('SELECT', 'sessions', req.user?.id);

      res.json({
        totalSessions,
        activeSessions,
        expiredSessions,
        sessionsToday,
        uniqueUsers: uniqueUsers.length,
      });
    } catch (error) {
      logger.logError('Error fetching session statistics', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

/**
 * Get sessions for a specific user (Admin only)
 *
 * Retrieves all sessions for a specific user.
 * Only accessible to ADMIN users.
 *
 * @route GET /api/sessions/user/:userId
 * @auth Requires ADMIN role
 *
 * @param {string} req.params.userId - User ID
 *
 * @returns {Object} 200 - User sessions list
 * @returns {Object} 403 - Insufficient permissions
 * @returns {Object} 404 - User not found
 * @returns {Object} 500 - Internal server error
 */
router.get(
  '/user/:userId',
  authenticateToken,
  requireRole(['ADMIN']),
  async (req: AuthRequest, res: Response) => {
    try {
      const { userId } = req.params;

      // Verify user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, firstName: true, lastName: true },
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Get all sessions for this user
      const sessions = await prisma.session.findMany({
        where: { userId },
        orderBy: {
          createdAt: 'desc',
        },
      });

      logger.logDatabaseOperation('SELECT', 'sessions', req.user?.id);

      res.json({
        user,
        sessions,
      });
    } catch (error) {
      logger.logError('Error fetching user sessions', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

/**
 * Deactivate a session (Admin only)
 *
 * Manually deactivates a session.
 * Only accessible to ADMIN users.
 *
 * @route PATCH /api/sessions/:sessionId/deactivate
 * @auth Requires ADMIN role
 *
 * @param {string} req.params.sessionId - Session ID
 *
 * @returns {Object} 200 - Session deactivated successfully
 * @returns {Object} 403 - Insufficient permissions
 * @returns {Object} 404 - Session not found
 * @returns {Object} 500 - Internal server error
 */
router.patch(
  '/:sessionId/deactivate',
  authenticateToken,
  requireRole(['ADMIN']),
  async (req: AuthRequest, res: Response) => {
    try {
      const { sessionId } = req.params;

      const session = await prisma.session.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }

      await prisma.session.update({
        where: { id: sessionId },
        data: { isActive: false },
      });

      logger.logDatabaseOperation('UPDATE', 'sessions', req.user?.id);

      res.json({
        message: 'Session deactivated successfully',
      });
    } catch (error) {
      logger.logError('Error deactivating session', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

export { router as sessionRoutes };
