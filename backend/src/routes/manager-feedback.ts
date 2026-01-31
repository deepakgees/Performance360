/**
 * @fileoverview Manager feedback management routes
 *
 * This module handles all manager feedback-related endpoints including creating,
 * retrieving, and updating feedback for managers. It supports different
 * feedback types and categories with proper validation and authorization.
 *
 * @author Performance360 Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { PrismaClient } from '@prisma/client';
import { Request, Response, Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
import { checkIndirectReport } from '../utils/accessControl';

/**
 * Express router instance for manager feedback routes
 */
const router = Router();

/**
 * Prisma client instance for database operations
 */
const prisma = new PrismaClient();

/**
 * Get all manager feedback received by the authenticated user
 *
 * Retrieves manager feedback items where the current user is the receiver.
 *
 * @route GET /manager-feedback/received
 * @auth Requires valid JWT token
 *
 * @returns {Object} 200 - Array of manager feedback items received by the user
 * @returns {Object} 500 - Internal server error
 */
router.get(
  '/received',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const feedback = await prisma.managerFeedback.findMany({
        where: { receiverId: (req as any).user.id },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json(feedback);
    } catch (error) {
      console.error('Error fetching received manager feedback:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

/**
 * Get all manager feedback sent by the authenticated user
 *
 * Retrieves manager feedback items where the current user is the sender.
 *
 * @route GET /manager-feedback/sent
 * @auth Requires valid JWT token
 *
 * @returns {Object} 200 - Array of manager feedback items sent by the user
 * @returns {Object} 500 - Internal server error
 */
router.get('/sent', authenticateToken, async (req: Request, res: Response) => {
  try {
    const feedback = await prisma.managerFeedback.findMany({
      where: { senderId: (req as any).user.id },
      include: {
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(feedback);
  } catch (error) {
    console.error('Error fetching sent manager feedback:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Create new manager feedback
 *
 * Creates a new manager feedback item from the authenticated user to another user.
 *
 * @route POST /manager-feedback
 * @auth Requires valid JWT token
 *
 * @param {Object} req.body - Request body containing feedback data
 * @param {string} req.body.receiverId - ID of the user receiving feedback
 * @param {string} req.body.year - Year for the feedback period
 * @param {string} req.body.quarter - Quarter for the feedback period (Q1, Q2, Q3, Q4)
 * @param {string} req.body.feedbackProvider - Name of the feedback provider
 * @param {string} [req.body.managerSatisfaction] - Manager satisfaction feedback
 * @param {Object} [req.body.leadershipStyle] - Leadership style feedback (JSON)
 * @param {Object} [req.body.careerGrowth] - Career growth feedback (JSON)
 * @param {Object} [req.body.coachingCaring] - Coaching and caring feedback (JSON)
 * @param {number} [req.body.managerOverallRating] - Overall manager rating (1-5)
 * @param {string} [req.body.appreciation] - Appreciation feedback about the manager
 * @param {string} [req.body.improvementAreas] - Areas for improvement
 *
 * @returns {Object} 201 - Feedback created successfully
 * @returns {Object} 400 - Validation errors
 * @returns {Object} 500 - Internal server error
 */
router.post(
  '/',
  [
    authenticateToken,
    body('receiverId').notEmpty(),
    body('year').notEmpty(),
    body('quarter').isIn(['Q1', 'Q2', 'Q3', 'Q4']),
    body('feedbackProvider').notEmpty(),
    body('managerSatisfaction').optional(),
    body('leadershipStyle').optional(),
    body('careerGrowth').optional(),
    body('coachingCaring').optional(),
    body('managerOverallRating').optional().isInt({ min: 1, max: 5 }),
    body('appreciation').optional(),
    body('improvementAreas').optional(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        receiverId,
        year,
        quarter,
        feedbackProvider,
        managerSatisfaction,
        leadershipStyle,
        careerGrowth,
        coachingCaring,
        managerOverallRating,
        appreciation,
        improvementAreas,
      } = req.body;

      const feedback = await prisma.managerFeedback.create({
        data: {
          senderId: (req as any).user.id,
          receiverId,
          year,
          quarter,
          feedbackProvider,
          managerSatisfaction,
          leadershipStyle: leadershipStyle || null,
          careerGrowth: careerGrowth || null,
          coachingCaring: coachingCaring || null,
          managerOverallRating,
          appreciation: appreciation || null,
          improvementAreas: improvementAreas || null,
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
          receiver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      });

      res.status(201).json(feedback);
    } catch (error) {
      console.error('Error creating manager feedback:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);


/**
 * Get all manager feedback received by a specific user (admin/manager only)
 *
 * Retrieves manager feedback items where the specified user is the receiver,
 * including sender information and team details. Only accessible by admins/managers.
 *
 * @route GET /manager-feedback/received/:userId
 * @auth Requires valid JWT token (admin/manager only)
 *
 * @param {string} req.params.userId - ID of the user to get feedback for
 * @returns {Object} 200 - Array of manager feedback items received by the user
 * @returns {Object} 403 - Forbidden if not admin/manager
 * @returns {Object} 500 - Internal server error
 */
router.get(
  '/received/:userId',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { user: currentUser } = req as any;
      const { userId } = req.params;

      // Validate user ID format
      if (!userId || userId.trim().length === 0) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }

      // User can always view their own feedback
      if (currentUser.id === userId) {
        const feedback = await prisma.managerFeedback.findMany({
          where: { receiverId: userId },
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
        return res.json(feedback);
      }

      // ADMIN: Can view any user's feedback
      if (currentUser.role === 'ADMIN') {
        const feedback = await prisma.managerFeedback.findMany({
          where: { receiverId: userId },
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
        return res.json(feedback);
      }

      // MANAGER: Can only view their direct/indirect reports' feedback
      if (currentUser.role === 'MANAGER') {
        // Check if it's a direct report
        const directReport = await prisma.user.findFirst({
          where: {
            id: userId,
            managerId: currentUser.id,
            isActive: true,
          },
        });

        if (directReport) {
          const feedback = await prisma.managerFeedback.findMany({
            where: { receiverId: userId },
            include: {
              sender: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  role: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          });
          return res.json(feedback);
        }

        // Check if it's an indirect report
        const isIndirectReport = await checkIndirectReport(
          currentUser.id,
          userId
        );
        if (isIndirectReport) {
          const feedback = await prisma.managerFeedback.findMany({
            where: { receiverId: userId },
            include: {
              sender: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  role: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          });
          return res.json(feedback);
        }

        return res.status(403).json({
          message:
            'Access denied. You can only view feedback for your direct or indirect reports.',
        });
      }

      return res.status(403).json({ message: 'Forbidden' });
    } catch (error) {
      console.error(
        'Error fetching received manager feedback for user:',
        error
      );
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

export { router as managerFeedbackRoutes };
