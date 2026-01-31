/**
 * @fileoverview Session tracking and timeout middleware
 *
 * This module provides middleware functions for tracking user session activity
 * and enforcing session timeout (2 hours of inactivity).
 *
 * @author Performance360 Team
 * @version 1.0.0
 * @since 2024-01-11
 */

import { PrismaClient } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from './auth';

/**
 * Prisma client instance for database operations
 */
const prisma = new PrismaClient();

/**
 * Session timeout duration in milliseconds (2 hours)
 */
const SESSION_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours

/**
 * Session activity tracking middleware
 *
 * Updates the lastActivityAt timestamp for the current session
 * and extends the expiration time by 2 hours from the last activity.
 * This middleware should be used after authentication middleware.
 *
 * @param req - Express request object with user data
 * @param res - Express response object
 * @param next - Express next function
 */
export const trackSessionActivity = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token && req.user) {
      // Find active session for this token
      const session = await prisma.session.findFirst({
        where: {
          token,
          userId: req.user.id,
          isActive: true,
        },
      });

      if (session) {
        const now = new Date();
        const newExpiresAt = new Date(now.getTime() + SESSION_TIMEOUT_MS);

        // Update session activity
        await prisma.session.update({
          where: { id: session.id },
          data: {
            lastActivityAt: now,
            expiresAt: newExpiresAt,
          },
        });
      }
    }
  } catch (error) {
    // Don't block the request if session tracking fails
    console.error('Session tracking error:', error);
  }

  next();
};

/**
 * Session timeout check middleware
 *
 * Checks if the current session has expired due to inactivity (2 hours).
 * If expired, deactivates the session and returns 401 Unauthorized.
 * This middleware should be used after authentication middleware.
 *
 * @param req - Express request object with user data
 * @param res - Express response object
 * @param next - Express next function
 *
 * @throws {401} When session has expired due to inactivity
 */
export const checkSessionTimeout = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token && req.user) {
      // Find active session for this token
      const session = await prisma.session.findFirst({
        where: {
          token,
          userId: req.user.id,
          isActive: true,
        },
      });

      if (session) {
        const now = new Date();

        // Check if session has expired
        if (session.expiresAt < now) {
          // Deactivate expired session
          await prisma.session.update({
            where: { id: session.id },
            data: { isActive: false },
          });

          return res.status(401).json({
            message: 'Session expired due to inactivity. Please login again.',
          });
        }
      } else {
        // No active session found
        return res.status(401).json({
          message: 'Invalid session. Please login again.',
        });
      }
    }
  } catch (error) {
    console.error('Session timeout check error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }

  next();
};

/**
 * Cleanup expired sessions
 *
 * Background task to deactivate sessions that have expired.
 * This should be called periodically (e.g., via cron job or scheduled task).
 *
 * @returns Promise<number> Number of sessions deactivated
 */
export const cleanupExpiredSessions = async (): Promise<number> => {
  try {
    const now = new Date();

    const result = await prisma.session.updateMany({
      where: {
        isActive: true,
        expiresAt: {
          lt: now,
        },
      },
      data: {
        isActive: false,
      },
    });

    return result.count;
  } catch (error) {
    console.error('Error cleaning up expired sessions:', error);
    return 0;
  }
};
