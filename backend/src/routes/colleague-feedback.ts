/**
 * @fileoverview Colleague feedback management routes
 *
 * This module handles all colleague feedback-related endpoints including creating,
 * retrieving, and updating feedback between colleagues. It supports different
 * feedback types and categories with proper validation and authorization.
 *
 * @author Performance360 Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { PrismaClient } from '@prisma/client';
import { Request, Response, Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { checkIndirectReport } from '../utils/accessControl';
import { logger } from '../utils/logger';
import { sanitizeForLogging } from '../utils/sanitizeLogs';

/**
 * Express router instance for colleague feedback routes
 */
const router = Router();

/**
 * Prisma client instance for database operations
 */
const prisma = new PrismaClient();

/**
 * Get all colleague feedback received by the authenticated user
 *
 * Retrieves colleague feedback items where the current user is the receiver,
 * including sender information.
 *
 * @route GET /colleague-feedback/received
 * @auth Requires valid JWT token
 *
 * @param {Object} req - Express request object with user data from auth middleware
 * @param {Object} res - Express response object
 *
 * @returns {Object} 200 - Array of colleague feedback items received by the user
 * @returns {Object} 500 - Internal server error
 */
router.get(
  '/received',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const feedback = await prisma.colleagueFeedback.findMany({
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
      console.error('Error fetching received colleague feedback:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

/**
 * Get all colleague feedback sent by the authenticated user
 *
 * Retrieves colleague feedback items where the current user is the sender,
 * including receiver information.
 *
 * @route GET /colleague-feedback/sent
 * @auth Requires valid JWT token
 *
 * @param {Object} req - Express request object with user data from auth middleware
 * @param {Object} res - Express response object
 *
 * @returns {Object} 200 - Array of colleague feedback items sent by the user
 * @returns {Object} 500 - Internal server error
 */
router.get('/sent', authenticateToken, async (req: Request, res: Response) => {
  try {
    const feedback = await prisma.colleagueFeedback.findMany({
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
    console.error('Error fetching sent colleague feedback:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Create new colleague feedback
 *
 * Creates a new colleague feedback item from the authenticated user to another user.
 * Supports year/quarter based feedback periods.
 *
 * @route POST /colleague-feedback
 * @auth Requires valid JWT token
 *
 * @param {Object} req.body - Request body containing feedback data
 * @param {string} req.body.receiverId - ID of the user receiving feedback
 * @param {string} req.body.year - Year for the feedback period
 * @param {string} req.body.quarter - Quarter for the feedback period (Q1, Q2, Q3, Q4)
 * @param {number} [req.body.rating] - Numerical rating (1-5)
 * @param {boolean} [req.body.isAnonymous] - Whether feedback is anonymous (default: false)
 * @param {boolean} [req.body.isPublic] - Whether feedback is public (default: false)
 * @param {string} req.body.feedbackProvider - Name of the feedback provider
 * @param {string} [req.body.appreciation] - What do you appreciate most about this colleague
 * @param {string} [req.body.improvement] - What could this colleague improve
 * @param {boolean} [req.body.wouldWorkAgain] - Would you like to work with this colleague in future projects
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
    body('rating').optional().isInt({ min: 1, max: 5 }),
    body('isAnonymous').optional().isBoolean(),
    body('isPublic').optional().isBoolean(),
    body('feedbackProvider').notEmpty(),
    body('appreciation').optional(),
    body('improvement').optional(),
    body('wouldWorkAgain').optional().isBoolean(),
  ],
  async (req: AuthRequest, res: Response) => {
    const startTime = Date.now();
    const userId = req.user?.id;
    const userEmail = req.user?.email;
    const method = 'POST';
    const url = '/api/colleague-feedback';

    try {
      // Log incoming request
      logger.logDebug(
        'Creating colleague feedback - Request received',
        userEmail || userId,
        method,
        url
      );

      // Log request body (sanitized)
      const sanitizedBody = sanitizeForLogging(req.body);
      logger.logDebug(
        `Request body: ${JSON.stringify(sanitizedBody)}`,
        userEmail || userId,
        method,
        url
      );

      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorDetails = errors.array();
        logger.logWarning(
          `Validation failed for colleague feedback creation: ${JSON.stringify(errorDetails)}`,
          userEmail || userId,
          method,
          url
        );
        return res.status(400).json({ 
          message: 'Validation failed',
          errors: errorDetails 
        });
      }

      const {
        receiverId,
        year,
        quarter,
        rating,
        isAnonymous = false,
        isPublic = false,
        feedbackProvider,
        appreciation,
        improvement,
        wouldWorkAgain,
      } = req.body;

      // Log data extraction
      logger.logDebug(
        `Extracted feedback data - Receiver: ${receiverId}, Year: ${year}, Quarter: ${quarter}, Rating: ${rating}, Anonymous: ${isAnonymous}`,
        userEmail || userId,
        method,
        url
      );

      // Verify receiver exists
      const receiver = await prisma.user.findUnique({
        where: { id: receiverId },
        select: { id: true, firstName: true, lastName: true, email: true, isActive: true },
      });

      if (!receiver) {
        logger.logWarning(
          `Receiver not found: ${receiverId}`,
          userEmail || userId,
          method,
          url
        );
        return res.status(404).json({ 
          message: 'Receiver not found' 
        });
      }

      if (!receiver.isActive) {
        logger.logWarning(
          `Attempted to send feedback to inactive user: ${receiverId}`,
          userEmail || userId,
          method,
          url
        );
        return res.status(400).json({ 
          message: 'Cannot send feedback to inactive user' 
        });
      }

      // Log before database operation
      logger.logDatabaseOperation('CREATE', 'colleagueFeedback', userEmail || userId);
      logger.logDebug(
        `Attempting to create colleague feedback - Sender: ${userId}, Receiver: ${receiverId}`,
        userEmail || userId,
        method,
        url
      );

      // Create feedback
      const feedback = await prisma.colleagueFeedback.create({
        data: {
          senderId: userId!,
          receiverId,
          year,
          quarter,
          rating,
          isAnonymous,
          isPublic,
          feedbackType: 'COLLEAGUE',
          feedbackProvider,
          appreciation,
          improvement,
          wouldWorkAgain,
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

      const duration = Date.now() - startTime;
      logger.logInfo(
        `Colleague feedback created successfully - Feedback ID: ${feedback.id}, Receiver: ${receiver.firstName} ${receiver.lastName} (${receiver.email})`,
        userEmail || userId,
        method,
        url
      );

      res.status(201).json(feedback);
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      // Extract detailed error information
      const errorInfo: any = {
        name: error?.name || 'UnknownError',
        message: error?.message || 'Unknown error occurred',
        code: error?.code || 'UNKNOWN',
        meta: error?.meta || null,
        cause: error?.cause || null,
      };

      // Add Prisma-specific error details
      if (error?.code) {
        errorInfo.prismaCode = error.code;
        errorInfo.prismaMeta = error.meta;
      }

      // Add stack trace for debugging
      if (error?.stack) {
        errorInfo.stack = error.stack;
      }

      // Log request body for context
      errorInfo.requestBody = sanitizeForLogging(req.body);
      errorInfo.userId = userId;
      errorInfo.userEmail = userEmail;

      // Determine error type and log accordingly
      if (error?.code === 'P2002') {
        // Unique constraint violation
        logger.logError(
          `Failed to create colleague feedback - Duplicate entry violation: ${error.message}`,
          errorInfo,
          userEmail || userId,
          method,
          url
        );
        return res.status(409).json({ 
          message: 'A feedback entry for this receiver, year, and quarter already exists',
          error: 'DUPLICATE_ENTRY'
        });
      } else if (error?.code === 'P2003') {
        // Foreign key constraint violation
        logger.logError(
          `Failed to create colleague feedback - Foreign key constraint violation: ${error.message}`,
          errorInfo,
          userEmail || userId,
          method,
          url
        );
        return res.status(400).json({ 
          message: 'Invalid receiver or sender ID',
          error: 'FOREIGN_KEY_VIOLATION'
        });
      } else if (error?.code === 'P2025') {
        // Record not found
        logger.logError(
          `Failed to create colleague feedback - Record not found: ${error.message}`,
          errorInfo,
          userEmail || userId,
          method,
          url
        );
        return res.status(404).json({ 
          message: 'Required record not found',
          error: 'RECORD_NOT_FOUND'
        });
      } else {
        // Generic error
        logger.logError(
          `Failed to create colleague feedback - Unexpected error: ${error?.message || 'Unknown error'}`,
          errorInfo,
          userEmail || userId,
          method,
          url
        );
      }

      res.status(500).json({ 
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      });
    }
  }
);

/**
 * Update colleague feedback status
 *
 * Updates the status of a colleague feedback item. Only the sender or receiver
 * can update the status of their feedback.
 *
 * @route PATCH /colleague-feedback/:id/status
 * @auth Requires valid JWT token
 *
 * @param {string} req.params.id - Feedback ID
 * @param {Object} req.body - Request body containing status update
 * @param {string} req.body.status - New status (PENDING, ACKNOWLEDGED, COMPLETED, ARCHIVED)
 *
 * @returns {Object} 200 - Feedback status updated successfully
 * @returns {Object} 400 - Validation errors
 * @returns {Object} 403 - Not authorized to update this feedback
 * @returns {Object} 404 - Feedback not found
 * @returns {Object} 500 - Internal server error
 */
router.patch(
  '/:id/status',
  [
    authenticateToken,
    body('status').isIn(['PENDING', 'ACKNOWLEDGED', 'COMPLETED', 'ARCHIVED']),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { status } = req.body;

      const feedback = await prisma.colleagueFeedback.findUnique({
        where: { id },
        include: { receiver: true },
      });

      if (!feedback) {
        return res
          .status(404)
          .json({ message: 'Colleague feedback not found' });
      }

      // Only the receiver or sender can update status
      if (
        feedback.receiverId !== (req as any).user.id &&
        feedback.senderId !== (req as any).user.id
      ) {
        return res.status(403).json({ message: 'Not authorized' });
      }

      const updatedFeedback = await prisma.colleagueFeedback.update({
        where: { id },
        data: { status },
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

      res.json(updatedFeedback);
    } catch (error) {
      console.error('Error updating colleague feedback status:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

/**
 * Get all colleague feedback received by a specific user (admin/manager only)
 *
 * Retrieves colleague feedback items where the specified user is the receiver,
 * including sender information. Only accessible by admins/managers.
 *
 * @route GET /colleague-feedback/received/:userId
 * @auth Requires valid JWT token (admin/manager only)
 *
 * @param {string} req.params.userId - ID of the user to get feedback for
 * @returns {Object} 200 - Array of colleague feedback items received by the user
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
        const feedback = await prisma.colleagueFeedback.findMany({
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
        const feedback = await prisma.colleagueFeedback.findMany({
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
          const feedback = await prisma.colleagueFeedback.findMany({
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
          const feedback = await prisma.colleagueFeedback.findMany({
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
        'Error fetching received colleague feedback for user:',
        error
      );
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

/**
 * Get all colleague feedback sent by a specific user (admin/manager only)
 *
 * Retrieves colleague feedback items where the specified user is the sender,
 * including receiver information. Only accessible by admins/managers.
 *
 * @route GET /colleague-feedback/sent/:userId
 * @auth Requires valid JWT token (admin/manager only)
 *
 * @param {string} req.params.userId - ID of the user to get feedback for
 * @returns {Object} 200 - Array of colleague feedback items sent by the user
 * @returns {Object} 403 - Forbidden if not admin/manager
 * @returns {Object} 500 - Internal server error
 */
router.get(
  '/sent/:userId',
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
        const feedback = await prisma.colleagueFeedback.findMany({
          where: { senderId: userId },
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
        return res.json(feedback);
      }

      // ADMIN: Can view any user's feedback
      if (currentUser.role === 'ADMIN') {
        const feedback = await prisma.colleagueFeedback.findMany({
          where: { senderId: userId },
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
          const feedback = await prisma.colleagueFeedback.findMany({
            where: { senderId: userId },
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
          return res.json(feedback);
        }

        // Check if it's an indirect report
        const isIndirectReport = await checkIndirectReport(
          currentUser.id,
          userId
        );
        if (isIndirectReport) {
          const feedback = await prisma.colleagueFeedback.findMany({
            where: { senderId: userId },
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
          return res.json(feedback);
        }

        return res.status(403).json({
          message:
            'Access denied. You can only view feedback for your direct or indirect reports.',
        });
      }

      return res.status(403).json({ message: 'Forbidden' });
    } catch (error) {
      console.error('Error fetching sent colleague feedback for user:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

export { router as colleagueFeedbackRoutes };
