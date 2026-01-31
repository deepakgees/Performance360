/**
 * @fileoverview Business Unit management routes
 *
 * This module handles business unit-related endpoints including business unit creation,
 * business unit retrieval, user-business unit assignments, and business unit updates.
 *
 * @author Performance360 Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { PrismaClient } from '@prisma/client';
import { Request, Response, Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, requireRole } from '../middleware/auth';
import { logger } from '../utils/logger';
import { sendCustomizedEmailWithResetLink } from '../utils/emailService';
import crypto from 'crypto';

/**
 * Extended Request interface that includes user information
 * after successful authentication
 */
interface AuthRequest extends Request {
  /** User object containing authentication details */
  user?: {
    /** Unique user identifier */
    id: string;
    /** User's email address */
    email: string;
    /** User's role in the system (ADMIN, MANAGER, EMPLOYEE) */
    role: string;
  };
}

/**
 * Express router instance for business unit routes
 */
const router = Router();

/**
 * Prisma client instance for database operations
 */
const prisma = new PrismaClient();

/**
 * Get all business units
 *
 * Retrieves a list of all active business units in the system.
 *
 * @route GET /business-units
 * @auth Requires valid JWT token
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 *
 * @returns {Object} 200 - Array of business unit data
 * @returns {Object} 500 - Internal server error
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    logger.logDebug(
      'Fetching all business units',
      undefined,
      'GET',
      '/business-units'
    );

    const businessUnits = await prisma.businessUnit.findMany({
      where: { isActive: true },
      include: {
        userBusinessUnits: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json(businessUnits);
  } catch (error) {
    logger.logError('Error fetching business units', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Get business unit by ID
 *
 * Retrieves detailed information about a specific business unit by its ID.
 *
 * @route GET /business-units/:id
 * @auth Requires valid JWT token
 *
 * @param {string} req.params.id - Business Unit ID to retrieve
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 *
 * @returns {Object} 200 - Business unit data with members
 * @returns {Object} 404 - Business unit not found
 * @returns {Object} 500 - Internal server error
 */
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    logger.logDebug(
      'Fetching business unit by ID',
      id,
      'GET',
      `/business-units/${id}`
    );

    const businessUnit = await prisma.businessUnit.findUnique({
      where: { id },
      include: {
        userBusinessUnits: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                position: true,
              },
            },
          },
        },
      },
    });

    if (!businessUnit) {
      return res.status(404).json({ message: 'Business unit not found' });
    }

    logger.logInfo(
      'Business unit found',
      undefined,
      'GET',
      `/business-units/${id}`
    );
    res.json(businessUnit);
  } catch (error) {
    logger.logError('Error fetching business unit', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Create new business unit
 *
 * Creates a new business unit in the system.
 * Only administrators can perform this operation.
 *
 * @route POST /business-units
 * @auth Requires valid JWT token and ADMIN role
 *
 * @param {Object} req.body - Request body containing business unit data
 * @param {string} req.body.name - Business unit name
 * @param {string} [req.body.description] - Business unit description
 *
 * @returns {Object} 201 - Business unit created successfully
 * @returns {Object} 400 - Validation errors
 * @returns {Object} 403 - Forbidden (not admin)
 * @returns {Object} 409 - Business unit name already exists
 * @returns {Object} 500 - Internal server error
 */
router.post(
  '/',
  authenticateToken,
  requireRole(['ADMIN']),
  [
    body('name')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Business unit name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Business unit name must be between 2 and 100 characters'),
    body('description')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { name, description } = req.body;

      // Check if business unit name already exists
      const existingBusinessUnit = await prisma.businessUnit.findUnique({
        where: { name },
      });

      if (existingBusinessUnit) {
        return res
          .status(409)
          .json({ message: 'Business unit name already exists' });
      }

      const businessUnit = await prisma.businessUnit.create({
        data: {
          name,
          description,
        },
      });

      logger.logInfo(
        'Business unit created',
        businessUnit.id,
        'POST',
        '/business-units'
      );
      res.status(201).json(businessUnit);
    } catch (error) {
      logger.logError('Error creating business unit', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

/**
 * Update business unit
 *
 * Updates an existing business unit's information.
 * Only administrators can perform this operation.
 *
 * @route PUT /business-units/:id
 * @auth Requires valid JWT token and ADMIN role
 *
 * @param {string} req.params.id - Business Unit ID to update
 * @param {Object} req.body - Request body containing business unit updates
 * @param {string} [req.body.name] - New business unit name
 * @param {string} [req.body.description] - New business unit description
 *
 * @returns {Object} 200 - Business unit updated successfully
 * @returns {Object} 400 - Validation errors
 * @returns {Object} 403 - Forbidden (not admin)
 * @returns {Object} 404 - Business unit not found
 * @returns {Object} 409 - Business unit name already exists
 * @returns {Object} 500 - Internal server error
 */
router.put(
  '/:id',
  authenticateToken,
  requireRole(['ADMIN']),
  [
    body('name')
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Business unit name cannot be empty')
      .isLength({ min: 2, max: 100 })
      .withMessage('Business unit name must be between 2 and 100 characters'),
    body('description')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const { name, description } = req.body;

      // Check if business unit exists
      const existingBusinessUnit = await prisma.businessUnit.findUnique({
        where: { id },
      });

      if (!existingBusinessUnit) {
        return res
          .status(404)
          .json({ message: 'Business unit not found' });
      }

      // If name is being updated, check for conflicts
      if (name && name !== existingBusinessUnit.name) {
        const nameConflict = await prisma.businessUnit.findUnique({
          where: { name },
        });

        if (nameConflict) {
          return res
            .status(409)
            .json({ message: 'Business unit name already exists' });
        }
      }

      const updatedBusinessUnit = await prisma.businessUnit.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
        },
      });

      logger.logInfo(
        'Business unit updated',
        id,
        'PUT',
        `/business-units/${id}`
      );
      res.json(updatedBusinessUnit);
    } catch (error) {
      logger.logError('Error updating business unit', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

/**
 * Add user to business unit
 *
 * Adds a user to a business unit by creating a UserBusinessUnit relationship.
 * Only administrators can perform this operation.
 *
 * @route POST /business-units/:id/members
 * @auth Requires valid JWT token and ADMIN role
 *
 * @param {string} req.params.id - Business Unit ID
 * @param {Object} req.body - Request body containing user ID
 * @param {string} req.body.userId - User ID to add to business unit
 *
 * @returns {Object} 201 - User added to business unit successfully
 * @returns {Object} 400 - Validation errors
 * @returns {Object} 403 - Forbidden (not admin)
 * @returns {Object} 404 - Business unit or user not found
 * @returns {Object} 409 - User already in business unit
 * @returns {Object} 500 - Internal server error
 */
router.post(
  '/:id/members',
  authenticateToken,
  requireRole(['ADMIN']),
  [body('userId').isString().notEmpty().withMessage('User ID is required')],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { id: businessUnitId } = req.params;
      const { userId } = req.body;

      // Check if business unit exists
      const businessUnit = await prisma.businessUnit.findUnique({
        where: { id: businessUnitId },
      });

      if (!businessUnit) {
        return res
          .status(404)
          .json({ message: 'Business unit not found' });
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ message: 'Resource not found' });
      }

      // Check if user is already in this business unit
      const existingUserBusinessUnit =
        await prisma.userBusinessUnit.findUnique({
          where: {
            userId_businessUnitId: {
              userId,
              businessUnitId,
            },
          },
        });

      if (existingUserBusinessUnit) {
        if (existingUserBusinessUnit.isActive) {
          return res
            .status(409)
            .json({ message: 'User is already in this business unit' });
        } else {
          // User was previously in this business unit but is inactive
          // First, deactivate any other active business unit memberships
          await prisma.userBusinessUnit.updateMany({
            where: {
              userId,
              isActive: true,
              businessUnitId: { not: businessUnitId },
            },
            data: {
              isActive: false,
            },
          });

          // Reactivate the relationship
          const reactivatedUserBusinessUnit =
            await prisma.userBusinessUnit.update({
              where: {
                userId_businessUnitId: {
                  userId,
                  businessUnitId,
                },
              },
              data: {
                isActive: true,
                joinedAt: new Date(),
              },
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
                businessUnit: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            });

          logger.logInfo(
            'User reactivated in business unit (removed from other business units)',
            userId,
            'POST',
            `/business-units/${businessUnitId}/members`
          );
          return res.status(201).json(reactivatedUserBusinessUnit);
        }
      }

      // Check if user is already in another active business unit
      const existingActiveMembership =
        await prisma.userBusinessUnit.findFirst({
          where: {
            userId,
            isActive: true,
            businessUnitId: { not: businessUnitId },
          },
          include: {
            businessUnit: {
              select: {
                name: true,
              },
            },
          },
        });

      // If user is in another business unit, deactivate that membership
      if (existingActiveMembership) {
        await prisma.userBusinessUnit.update({
          where: {
            userId_businessUnitId: {
              userId,
              businessUnitId: existingActiveMembership.businessUnitId,
            },
          },
          data: {
            isActive: false,
          },
        });

        logger.logInfo(
          `User removed from business unit "${existingActiveMembership.businessUnit.name}" to join new one`,
          userId,
          'POST',
          `/business-units/${businessUnitId}/members`
        );
      }

      // Create new user-business unit relationship
      const userBusinessUnit = await prisma.userBusinessUnit.create({
        data: {
          userId,
          businessUnitId,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          businessUnit: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      logger.logInfo(
        'User added to business unit',
        userId,
        'POST',
        `/business-units/${businessUnitId}/members`
      );
      res.status(201).json(userBusinessUnit);
    } catch (error) {
      logger.logError('Error adding user to business unit', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

/**
 * Remove user from business unit
 *
 * Removes a user from a business unit by deactivating the UserBusinessUnit relationship.
 * Only administrators can perform this operation.
 *
 * @route DELETE /business-units/:id/members/:userId
 * @auth Requires valid JWT token and ADMIN role
 *
 * @param {string} req.params.id - Business Unit ID
 * @param {string} req.params.userId - User ID to remove from business unit
 *
 * @returns {Object} 200 - User removed from business unit successfully
 * @returns {Object} 403 - Forbidden (not admin)
 * @returns {Object} 404 - Business unit or user not found
 * @returns {Object} 500 - Internal server error
 */
router.delete(
  '/:id/members/:userId',
  authenticateToken,
  requireRole(['ADMIN']),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id: businessUnitId, userId } = req.params;

      // Check if business unit exists
      const businessUnit = await prisma.businessUnit.findUnique({
        where: { id: businessUnitId },
      });

      if (!businessUnit) {
        return res
          .status(404)
          .json({ message: 'Business unit not found' });
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ message: 'Resource not found' });
      }

      // Find and deactivate the user-business unit relationship
      const userBusinessUnit = await prisma.userBusinessUnit.findUnique({
        where: {
          userId_businessUnitId: {
            userId,
            businessUnitId,
          },
        },
      });

      if (!userBusinessUnit) {
        return res
          .status(404)
          .json({ message: 'User is not in this business unit' });
      }

      if (!userBusinessUnit.isActive) {
        return res.status(400).json({
          message: 'User is already not active in this business unit',
        });
      }

      await prisma.userBusinessUnit.update({
        where: {
          userId_businessUnitId: {
            userId,
            businessUnitId,
          },
        },
        data: {
          isActive: false,
        },
      });

      logger.logInfo(
        'User removed from business unit',
        userId,
        'DELETE',
        `/business-units/${businessUnitId}/members/${userId}`
      );
      res.json({ message: 'User removed from business unit successfully' });
    } catch (error) {
      logger.logError('Error removing user from business unit', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

/**
 * Delete business unit
 *
 * Soft deletes a business unit by setting isActive to false.
 * Only administrators can perform this operation.
 *
 * @route DELETE /business-units/:id
 * @auth Requires valid JWT token and ADMIN role
 *
 * @param {string} req.params.id - Business Unit ID to delete
 *
 * @returns {Object} 200 - Business unit deleted successfully
 * @returns {Object} 403 - Forbidden (not admin)
 * @returns {Object} 404 - Business unit not found
 * @returns {Object} 500 - Internal server error
 */
router.delete(
  '/:id',
  authenticateToken,
  requireRole(['ADMIN']),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      // Check if business unit exists
      const businessUnit = await prisma.businessUnit.findUnique({
        where: { id },
      });

      if (!businessUnit) {
        return res
          .status(404)
          .json({ message: 'Business unit not found' });
      }

      // Soft delete the business unit
      await prisma.businessUnit.update({
        where: { id },
        data: {
          isActive: false,
        },
      });

      // Also deactivate all user-business unit relationships
      await prisma.userBusinessUnit.updateMany({
        where: { businessUnitId: id },
        data: {
          isActive: false,
        },
      });

      logger.logInfo(
        'Business unit deleted',
        id,
        'DELETE',
        `/business-units/${id}`
      );
      res.json({ message: 'Business unit deleted successfully' });
    } catch (error) {
      logger.logError('Error deleting business unit', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

/**
 * Send customized email to all users in a business unit with password reset links
 *
 * Sends a customized email to all active users in a business unit. Each user receives
 * a personalized email with a unique password reset link. The email includes custom
 * subject and message content provided by the admin.
 *
 * @route POST /business-units/:id/send-email
 * @auth Requires valid JWT token and ADMIN role
 *
 * @param {string} req.params.id - Business Unit ID
 * @param {Object} req.body - Request body
 * @param {string} req.body.subject - Email subject
 * @param {string} req.body.message - Custom message content (HTML supported)
 *
 * @returns {Object} 200 - Email sending results
 * @returns {Object} 400 - Validation errors or no users found
 * @returns {Object} 403 - Forbidden (not admin)
 * @returns {Object} 404 - Business unit not found
 * @returns {Object} 500 - Internal server error
 *
 * @example
 * // Request body
 * {
 *   "subject": "Important Announcement",
 *   "message": "<p>This is a custom message to all business unit members.</p>"
 * }
 *
 * // Success response
 * {
 *   "message": "Emails sent to 5 users",
 *   "totalUsers": 5,
 *   "successful": 5,
 *   "failed": 0,
 *   "results": [...]
 * }
 */
router.post(
  '/:id/send-email',
  authenticateToken,
  requireRole(['ADMIN']),
  [
    body('subject')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Email subject is required')
      .isLength({ min: 3, max: 200 })
      .withMessage('Email subject must be between 3 and 200 characters'),
    body('message')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Email message is required')
      .isLength({ min: 10, max: 10000 })
      .withMessage('Email message must be between 10 and 10000 characters'),
  ],
  async (req: AuthRequest, res: Response) => {
    const startTime = Date.now();
    const { id: businessUnitId } = req.params;
    const { subject, message } = req.body;

    try {
      logger.logDebug(
        'Sending customized emails to business unit users',
        businessUnitId,
        'POST',
        `/business-units/${businessUnitId}/send-email`
      );

      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorDetails = errors.array();
        logger.logWarning(
          `Validation failed for send-email request: ${JSON.stringify(errorDetails)}`,
          businessUnitId,
          'POST',
          `/business-units/${businessUnitId}/send-email`
        );
        return res.status(400).json({
          message: 'Validation failed',
          errors: errorDetails,
        });
      }

      // Check if business unit exists
      const businessUnit = await prisma.businessUnit.findUnique({
        where: { id: businessUnitId },
        include: {
          userBusinessUnits: {
            where: { isActive: true },
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  isActive: true,
                },
              },
            },
          },
        },
      });

      if (!businessUnit) {
        logger.logWarning(
          'Business unit not found for email sending',
          businessUnitId,
          'POST',
          `/business-units/${businessUnitId}/send-email`
        );
        return res.status(404).json({ message: 'Business unit not found' });
      }

      // Filter to only active users
      const activeUsers = businessUnit.userBusinessUnits
        .map(ubu => ubu.user)
        .filter(user => user.isActive);

      if (activeUsers.length === 0) {
        logger.logWarning(
          'No active users found in business unit - cannot send emails',
          businessUnitId,
          'POST',
          `/business-units/${businessUnitId}/send-email`
        );
        return res.status(400).json({
          message: 'No active users found in this business unit',
          errors: [
            {
              msg: 'No active users found in this business unit',
              param: 'businessUnit',
              location: 'body',
            },
          ],
        });
      }

      // Send emails to all users
      const emailResults = [];
      let successful = 0;
      let failed = 0;

      for (const user of activeUsers) {
        try {
          // Generate secure reset token for each user
          const resetToken = crypto.randomBytes(32).toString('hex');
          const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day from now

          // Save reset token to database
          await prisma.user.update({
            where: { id: user.id },
            data: {
              passwordResetToken: resetToken,
              passwordResetExpires: resetTokenExpiry,
            },
          });

          logger.logDatabaseOperation('UPDATE', 'users', user.id);

          // Send customized email with reset link
          const emailSent = await sendCustomizedEmailWithResetLink(
            user.email,
            user.firstName,
            resetToken,
            subject,
            message
          );

          if (emailSent) {
            successful++;
            emailResults.push({
              userId: user.id,
              email: user.email,
              name: `${user.firstName} ${user.lastName}`,
              status: 'success',
            });
          } else {
            failed++;
            emailResults.push({
              userId: user.id,
              email: user.email,
              name: `${user.firstName} ${user.lastName}`,
              status: 'failed',
              error: 'Email service error',
            });
          }
        } catch (error: any) {
          failed++;
          logger.logError(
            `Error sending email to user ${user.email}`,
            error
          );
          emailResults.push({
            userId: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            status: 'failed',
            error: error.message || 'Unknown error',
          });
        }
      }

      const responseTime = Date.now() - startTime;
      logger.logInfo(
        `Customized emails sent to business unit: ${successful} successful, ${failed} failed`,
        businessUnitId,
        'POST',
        `/business-units/${businessUnitId}/send-email`
      );

      res.json({
        message: `Emails sent to ${activeUsers.length} users (${successful} successful, ${failed} failed)`,
        totalUsers: activeUsers.length,
        successful,
        failed,
        results: emailResults,
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.logError('Error sending emails to business unit users', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

/**
 * Get business unit statistics
 *
 * Retrieves comprehensive statistics for a business unit including:
 * - Attendance compliance metrics and trends
 * - Feedback completion statistics
 * - Average feedback ratings
 *
 * @route GET /business-units/:id/statistics
 * @auth Requires valid JWT token
 *
 * @param {string} req.params.id - Business Unit ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 *
 * @returns {Object} 200 - Business unit statistics
 * @returns {Object} 404 - Business unit not found
 * @returns {Object} 500 - Internal server error
 */
router.get(
  '/:id/statistics',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      logger.logDebug(
        'Fetching business unit statistics',
        id,
        'GET',
        `/business-units/${id}/statistics`
      );

      // Get business unit with active members
      const businessUnit = await prisma.businessUnit.findUnique({
        where: { id },
        include: {
          userBusinessUnits: {
            where: { isActive: true },
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  role: true,
                  position: true,
                },
              },
            },
          },
        },
      });

      if (!businessUnit) {
        return res.status(404).json({ message: 'Business unit not found' });
      }

      const memberIds = businessUnit.userBusinessUnits.map(ubu => ubu.user.id);

      if (memberIds.length === 0) {
        return res.json({
          businessUnit: {
            id: businessUnit.id,
            name: businessUnit.name,
            description: businessUnit.description,
            totalMembers: 0,
          },
          attendance: {
            complianceRate: 0,
            trends: [],
          },
          feedbackCompletion: {
            selfAssessment: { completed: 0, notCompleted: 0 },
            managerFeedback: { completed: 0, notCompleted: 0 },
            colleagueFeedback: { provided: 0, notProvided: 0 },
          },
          feedbackRatings: {
            averageSelfAssessment: null,
            averageManagerRating: null,
            averageColleagueRating: null,
          },
        });
      }

      // Calculate previous quarter
      const now = new Date();
      const currentMonth = now.getMonth() + 1; // 1-12
      const currentYear = now.getFullYear();

      let previousQuarter: string;
      let previousQuarterYear: number;

      if (currentMonth >= 1 && currentMonth <= 3) {
        previousQuarter = 'Q4';
        previousQuarterYear = currentYear - 1;
      } else if (currentMonth >= 4 && currentMonth <= 6) {
        previousQuarter = 'Q1';
        previousQuarterYear = currentYear;
      } else if (currentMonth >= 7 && currentMonth <= 9) {
        previousQuarter = 'Q2';
        previousQuarterYear = currentYear;
      } else {
        previousQuarter = 'Q3';
        previousQuarterYear = currentYear;
      }

      // Get attendance data for last 6 months
      const attendanceTrends = [];
      const currentDate = new Date();
      let complianceCount = 0;
      let totalMembersWithAttendance = 0;

      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentYear, currentMonth - 1 - i, 1);
        const month = date.getMonth() + 1;
        const year = date.getFullYear();

        const attendanceRecords = await prisma.monthlyAttendance.findMany({
          where: {
            userId: { in: memberIds },
            month,
            year,
          },
        });

        let compliantMembers = 0;
        let membersWithData = 0;

        attendanceRecords.forEach(record => {
          if (record.attendancePercentage !== null) {
            membersWithData++;
            // Compliance: 40% or more attendance percentage
            if (record.attendancePercentage >= 40) {
              compliantMembers++;
            }
          }
        });

        const monthNames = [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec',
        ];

        attendanceTrends.push({
          month: monthNames[month - 1],
          year,
          monthNumber: month,
          complianceRate:
            membersWithData > 0
              ? (compliantMembers / membersWithData) * 100
              : 0,
          compliantMembers,
          totalMembersWithData: membersWithData,
        });

        if (i === 0) {
          // Current month
          complianceCount = compliantMembers;
          totalMembersWithAttendance = membersWithData;
        }
      }

      const overallComplianceRate =
        totalMembersWithAttendance > 0
          ? (complianceCount / totalMembersWithAttendance) * 100
          : 0;

      // Get feedback completion statistics for previous quarter
      // Self-assessment completion
      const selfAssessments = await prisma.selfAssessmentV2.findMany({
        where: {
          userId: { in: memberIds },
          year: previousQuarterYear,
          quarter: previousQuarter as any,
        },
      });

      const completedSelfAssessments = selfAssessments.length;
      const notCompletedSelfAssessments =
        memberIds.length - completedSelfAssessments;

      // Manager feedback completion (received by members)
      const managerFeedbacks = await prisma.managerFeedback.findMany({
        where: {
          receiverId: { in: memberIds },
          year: previousQuarterYear.toString(),
          quarter: previousQuarter,
        },
      });

      const uniqueMembersWithManagerFeedback = new Set(
        managerFeedbacks.map(mf => mf.receiverId)
      ).size;
      const completedManagerFeedback = uniqueMembersWithManagerFeedback;
      const notCompletedManagerFeedback =
        memberIds.length - completedManagerFeedback;

      // Colleague feedback (at least 1 feedback provided by members)
      const colleagueFeedbacks = await prisma.colleagueFeedback.findMany({
        where: {
          senderId: { in: memberIds },
          year: previousQuarterYear.toString(),
          quarter: previousQuarter,
        },
      });

      const uniqueMembersWhoProvidedFeedback = new Set(
        colleagueFeedbacks.map(cf => cf.senderId)
      ).size;
      const providedColleagueFeedback = uniqueMembersWhoProvidedFeedback;
      const notProvidedColleagueFeedback =
        memberIds.length - providedColleagueFeedback;

      // Get feedback ratings
      // Average self-assessment rating
      const selfAssessmentRatings = selfAssessments
        .map(sa => sa.rating)
        .filter((rating): rating is number => rating !== null);

      const averageSelfAssessment =
        selfAssessmentRatings.length > 0
          ? selfAssessmentRatings.reduce((sum, rating) => sum + rating, 0) /
            selfAssessmentRatings.length
          : null;

      // Average manager rating
      const managerRatings = managerFeedbacks
        .map(mf => mf.managerOverallRating)
        .filter((rating): rating is number => rating !== null);

      const averageManagerRating =
        managerRatings.length > 0
          ? managerRatings.reduce((sum, rating) => sum + rating, 0) /
            managerRatings.length
          : null;

      // Average colleague rating
      const colleagueRatings = colleagueFeedbacks
        .map(cf => cf.rating)
        .filter((rating): rating is number => rating !== null);

      const averageColleagueRating =
        colleagueRatings.length > 0
          ? colleagueRatings.reduce((sum, rating) => sum + rating, 0) /
            colleagueRatings.length
          : null;

      logger.logInfo(
        'Business unit statistics calculated',
        id,
        'GET',
        `/business-units/${id}/statistics`
      );

      res.json({
        businessUnit: {
          id: businessUnit.id,
          name: businessUnit.name,
          description: businessUnit.description,
          totalMembers: memberIds.length,
        },
        attendance: {
          complianceRate: overallComplianceRate,
          trends: attendanceTrends,
        },
        feedbackCompletion: {
          selfAssessment: {
            completed: completedSelfAssessments,
            notCompleted: notCompletedSelfAssessments,
          },
          managerFeedback: {
            completed: completedManagerFeedback,
            notCompleted: notCompletedManagerFeedback,
          },
          colleagueFeedback: {
            provided: providedColleagueFeedback,
            notProvided: notProvidedColleagueFeedback,
          },
        },
        feedbackRatings: {
          averageSelfAssessment,
          averageManagerRating,
          averageColleagueRating,
        },
      });
    } catch (error) {
      logger.logError('Error fetching business unit statistics', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

export { router as businessUnitRoutes };

