/**
 * @fileoverview Self-assessment management routes (V2)
 *
 * This module handles self-assessment endpoints including creation,
 * retrieval, and updating of self-assessments using the new normalized structure.
 *
 * @author Performance360 Team
 * @version 2.0.0
 * @since 2024-01-10
 */

import { PrismaClient, Quarter, SatisfactionLevel } from '@prisma/client';
import { Request, Response, Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { checkIndirectReport } from '../utils/accessControl';
import { logger } from '../utils/logger';
import { sanitizeForLogging } from '../utils/sanitizeLogs';

/**
 * Express router instance for assessment routes
 */
const router = Router();

/**
 * Prisma client instance for database operations
 */
const prisma = new PrismaClient();

/**
 * Get all self-assessments for current user
 *
 * Retrieves all self-assessments created by the authenticated user,
 * ordered by creation date (newest first).
 *
 * @route GET /assessments
 * @auth Requires valid JWT token
 *
 * @param {Object} req - Express request object with user data from auth middleware
 * @param {Object} res - Express response object
 *
 * @returns {Object} 200 - Array of user's self-assessments
 * @returns {Object} 500 - Internal server error
 *
 * @example
 * // Response
 * [
 *   {
 *     "id": "clx1234567890",
 *     "userId": "clx1234567890",
 *     "year": 2024,
 *     "quarter": "Q1",
 *     "rating": 4,
 *     "achievements": "Completed major feature implementation",
 *     "improvements": "Need to improve documentation",
 *     "satisfactionLevel": "VERY_SATISFIED",
 *     "aspirations": "Lead a team project",
 *     "suggestionsForTeam": "Improve code review process",
 *     "createdAt": "2024-01-15T10:30:00Z",
 *     "updatedAt": "2024-01-15T10:30:00Z"
 *   }
 * ]
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const assessments = await prisma.selfAssessmentV2.findMany({
      where: { userId: (req as any).user.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json(assessments);
  } catch (error) {
    console.error('Error fetching assessments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Get all self-assessments for a specific user (admin/manager only)
 *
 * Retrieves all self-assessments created by a specific user.
 * Only admins and managers can access this endpoint.
 *
 * @route GET /assessments/user/:userId
 * @auth Requires valid JWT token
 *
 * @param {string} req.params.userId - User ID to get assessments for
 * @param {Object} req - Express request object with user data from auth middleware
 * @param {Object} res - Express response object
 *
 * @returns {Object} 200 - Array of user's self-assessments
 * @returns {Object} 403 - Not authorized to access this user's assessments
 * @returns {Object} 500 - Internal server error
 */
router.get(
  '/user/:userId',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const currentUser = (req as any).user;

      console.log('GET /assessments/user/:userId called');
      console.log('Requested userId:', userId);
      console.log('Current user ID:', currentUser.id);
      console.log('Current user role:', currentUser.role);

      // Check if the requested user exists
      const requestedUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!requestedUser) {
        console.log('Requested user not found');
        return res.status(404).json({
          message: 'Resource not found',
        });
      }

      // Check if the requested user is active
      if (!requestedUser.isActive) {
        console.log('Requested user is not active');
        return res.status(404).json({
          message: 'Resource not found',
        });
      }

      // Prevent users from accessing their own assessments through this endpoint
      if (currentUser.id === userId) {
        console.log(
          'User trying to access their own assessments through this endpoint'
        );
        return res.status(400).json({
          message: 'Use /assessments endpoint to access your own assessments',
        });
      }

      // Check if current user is admin or manager
      if (currentUser.role !== 'ADMIN' && currentUser.role !== 'MANAGER') {
        console.log('User not authorized - role:', currentUser.role);
        return res.status(403).json({
          message: "Not authorized to access other users' assessments",
        });
      }

      // For managers, check if the requested user is their direct or indirect report
      if (currentUser.role === 'MANAGER') {
        console.log(
          'Checking manager authorization for user:',
          requestedUser.email
        );

        // First check if it's a direct report
        const directReport = await prisma.user.findFirst({
          where: {
            id: userId,
            managerId: currentUser.id,
          },
        });

        if (directReport) {
          console.log('User is a direct report');
        } else {
          // Check if it's an indirect report by traversing the hierarchy
          console.log('Checking for indirect report relationship...');
          const isIndirectReport = await checkIndirectReport(
            currentUser.id,
            userId
          );

          if (!isIndirectReport) {
            console.log('User is not a direct or indirect report');
            return res.status(403).json({
              message: "Not authorized to access this user's assessments",
            });
          }
          console.log('User is an indirect report');
        }
      }

      const assessments = await prisma.selfAssessmentV2.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      console.log('Found assessments:', assessments.length);
      console.log('Authorization successful for user:', requestedUser.email);
      res.json(assessments);
    } catch (error) {
      console.error('Error fetching assessments by user:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Note: checkIndirectReport is now imported from '../utils/accessControl'

/**
 * Get assessment by ID
 *
 * Retrieves a specific self-assessment by its ID. Only the owner
 * of the assessment can access it.
 *
 * @route GET /assessments/:id
 * @auth Requires valid JWT token
 *
 * @param {string} req.params.id - Assessment ID to retrieve
 * @param {Object} req - Express request object with user data from auth middleware
 * @param {Object} res - Express response object
 *
 * @returns {Object} 200 - Assessment data
 * @returns {Object} 403 - Not authorized to access this assessment
 * @returns {Object} 404 - Assessment not found
 * @returns {Object} 500 - Internal server error
 */
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const assessment = await prisma.selfAssessmentV2.findUnique({
      where: { id },
    });

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // Check if user owns this assessment
    if (assessment.userId !== (req as any).user.id) {
      return res
        .status(403)
        .json({ message: 'Not authorized to access this assessment' });
    }

    res.json(assessment);
  } catch (error) {
    console.error('Error fetching assessment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Create new self-assessment
 *
 * Creates a new self-assessment for the authenticated user.
 *
 * @route POST /assessments
 * @auth Requires valid JWT token
 *
 * @param {Object} req.body - Request body containing assessment data
 * @param {number} req.body.year - Assessment year (e.g., 2024)
 * @param {string} [req.body.quarter] - Assessment quarter (Q1, Q2, Q3, Q4, ANNUAL)
 * @param {number} [req.body.rating] - Self-rating (1-5 scale)
 * @param {string} [req.body.achievements] - Key achievements
 * @param {string} [req.body.improvements] - Areas for improvement
 * @param {string} [req.body.satisfactionLevel] - Satisfaction level enum value
 * @param {string} [req.body.aspirations] - Career aspirations
 * @param {string} [req.body.suggestionsForTeam] - Team improvement suggestions
 *
 * @returns {Object} 201 - Assessment created successfully
 * @returns {Object} 400 - Validation errors
 * @returns {Object} 500 - Internal server error
 *
 * @example
 * // Request body
 * {
 *   "year": 2024,
 *   "quarter": "Q1",
 *   "rating": 4,
 *   "achievements": "Completed major feature implementation",
 *   "improvements": "Need to improve documentation",
 *   "satisfactionLevel": "VERY_SATISFIED",
 *   "aspirations": "Lead a team project",
 *   "suggestionsForTeam": "Improve code review process"
 * }
 */
router.post(
  '/',
  [
    authenticateToken,
    body('year').isInt({ min: 2000, max: 2100 }).withMessage('Year must be a valid year'),
    body('quarter').optional().isIn(['Q1', 'Q2', 'Q3', 'Q4', 'ANNUAL']).withMessage('Quarter must be Q1, Q2, Q3, Q4, or ANNUAL'),
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('achievements').optional().isString(),
    body('improvements').optional().isString(),
    body('satisfactionLevel').optional().isIn(['VERY_SATISFIED', 'SOMEWHAT_SATISFIED', 'NEITHER', 'SOMEWHAT_DISSATISFIED', 'VERY_DISSATISFIED']),
    body('aspirations').optional().isString(),
    body('suggestionsForTeam').optional().isString(),
  ],
  async (req: AuthRequest, res: Response) => {
    const startTime = Date.now();
    const userId = req.user?.id;
    const userEmail = req.user?.email;
    const method = 'POST';
    const url = '/api/assessments';

    try {
      // Log incoming request
      logger.logDebug(
        'Creating self-assessment - Request received',
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
          `Validation failed for self-assessment creation: ${JSON.stringify(errorDetails)}`,
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
        year,
        quarter,
        rating,
        achievements,
        improvements,
        satisfactionLevel,
        aspirations,
        suggestionsForTeam,
      } = req.body;

      // Parse year and validate
      const parsedYear = parseInt(year);
      if (isNaN(parsedYear)) {
        logger.logWarning(
          `Invalid year provided: ${year}`,
          userEmail || userId,
          method,
          url
        );
        return res.status(400).json({ 
          message: 'Invalid year format',
          error: 'INVALID_YEAR'
        });
      }

      // Log data extraction
      logger.logDebug(
        `Extracted assessment data - Year: ${parsedYear}, Quarter: ${quarter || 'null'}, Rating: ${rating || 'null'}, Satisfaction: ${satisfactionLevel || 'null'}`,
        userEmail || userId,
        method,
        url
      );

      // Verify user exists and is active
      const user = await prisma.user.findUnique({
        where: { id: userId! },
        select: { id: true, firstName: true, lastName: true, email: true, isActive: true },
      });

      if (!user) {
        logger.logWarning(
          `User not found: ${userId}`,
          userEmail || userId,
          method,
          url
        );
        return res.status(404).json({ 
          message: 'User not found' 
        });
      }

      if (!user.isActive) {
        logger.logWarning(
          `Attempted to create assessment for inactive user: ${userId}`,
          userEmail || userId,
          method,
          url
        );
        return res.status(400).json({ 
          message: 'Cannot create assessment for inactive user' 
        });
      }

      // Check if assessment already exists for this user/year/quarter
      logger.logDebug(
        `Checking for existing assessment - User: ${userId}, Year: ${parsedYear}, Quarter: ${quarter || 'null'}`,
        userEmail || userId,
        method,
        url
      );

      const existing = await prisma.selfAssessmentV2.findUnique({
        where: {
          userId_year_quarter: {
            userId: userId!,
            year: parsedYear,
            quarter: quarter || null,
          },
        },
      });

      if (existing) {
        logger.logWarning(
          `Assessment already exists for this period - Assessment ID: ${existing.id}, Year: ${parsedYear}, Quarter: ${quarter || 'null'}`,
          userEmail || userId,
          method,
          url
        );
        return res.status(409).json({
          message: 'Assessment already exists for this period',
          error: 'DUPLICATE_ASSESSMENT'
        });
      }

      // Log before database operation
      logger.logDatabaseOperation('CREATE', 'selfAssessmentV2', userEmail || userId);
      logger.logDebug(
        `Attempting to create self-assessment - User: ${userId}, Year: ${parsedYear}, Quarter: ${quarter || 'null'}`,
        userEmail || userId,
        method,
        url
      );

      // Create assessment
      const assessment = await prisma.selfAssessmentV2.create({
        data: {
          userId: userId!,
          year: parsedYear,
          quarter: quarter || null,
          rating: rating ? parseInt(rating) : null,
          achievements: achievements || null,
          improvements: improvements || null,
          satisfactionLevel: satisfactionLevel || null,
          aspirations: aspirations || null,
          suggestionsForTeam: suggestionsForTeam || null,
        },
      });

      const duration = Date.now() - startTime;
      logger.logInfo(
        `Self-assessment created successfully - Assessment ID: ${assessment.id}, User: ${user.firstName} ${user.lastName} (${user.email}), Year: ${parsedYear}, Quarter: ${quarter || 'null'}`,
        userEmail || userId,
        method,
        url
      );

      res.status(201).json(assessment);
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
          `Failed to create self-assessment - Duplicate entry violation: ${error.message}`,
          errorInfo,
          userEmail || userId,
          method,
          url
        );
        return res.status(409).json({
          message: 'Assessment already exists for this period',
          error: 'DUPLICATE_ENTRY'
        });
      } else if (error?.code === 'P2003') {
        // Foreign key constraint violation
        logger.logError(
          `Failed to create self-assessment - Foreign key constraint violation: ${error.message}`,
          errorInfo,
          userEmail || userId,
          method,
          url
        );
        return res.status(400).json({ 
          message: 'Invalid user ID',
          error: 'FOREIGN_KEY_VIOLATION'
        });
      } else if (error?.code === 'P2025') {
        // Record not found
        logger.logError(
          `Failed to create self-assessment - Record not found: ${error.message}`,
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
          `Failed to create self-assessment - Unexpected error: ${error?.message || 'Unknown error'}`,
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
 * Update assessment
 *
 * Updates an existing self-assessment. Only the owner can update their assessment.
 *
 * @route PUT /assessments/:id
 * @auth Requires valid JWT token
 *
 * @param {string} req.params.id - Assessment ID to update
 * @param {Object} req.body - Request body containing assessment updates
 * @param {number} [req.body.year] - Assessment year
 * @param {string} [req.body.quarter] - Assessment quarter
 * @param {number} [req.body.rating] - Self-rating (1-5 scale)
 * @param {string} [req.body.achievements] - Key achievements
 * @param {string} [req.body.improvements] - Areas for improvement
 * @param {string} [req.body.satisfactionLevel] - Satisfaction level
 * @param {string} [req.body.aspirations] - Career aspirations
 * @param {string} [req.body.suggestionsForTeam] - Team improvement suggestions
 *
 * @returns {Object} 200 - Assessment updated successfully
 * @returns {Object} 400 - Validation errors
 * @returns {Object} 403 - Not authorized
 * @returns {Object} 404 - Assessment not found
 * @returns {Object} 500 - Internal server error
 */
router.put(
  '/:id',
  [
    authenticateToken,
    body('year').optional().isInt({ min: 2000, max: 2100 }),
    body('quarter').optional().isIn(['Q1', 'Q2', 'Q3', 'Q4', 'ANNUAL']),
    body('rating').optional().isInt({ min: 1, max: 5 }),
    body('achievements').optional().isString(),
    body('improvements').optional().isString(),
    body('satisfactionLevel').optional().isIn(['VERY_SATISFIED', 'SOMEWHAT_SATISFIED', 'NEITHER', 'SOMEWHAT_DISSATISFIED', 'VERY_DISSATISFIED']),
    body('aspirations').optional().isString(),
    body('suggestionsForTeam').optional().isString(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const {
        year,
        quarter,
        rating,
        achievements,
        improvements,
        satisfactionLevel,
        aspirations,
        suggestionsForTeam,
      } = req.body;

      const assessment = await prisma.selfAssessmentV2.findUnique({
        where: { id },
      });

      if (!assessment) {
        return res.status(404).json({ message: 'Assessment not found' });
      }

      const currentUser = (req as any).user;

      // Check if user owns this assessment or is an admin
      if (assessment.userId !== currentUser.id && currentUser.role !== 'ADMIN') {
        return res
          .status(403)
          .json({ message: 'Not authorized to update this assessment' });
      }

      // Build update data object
      const updateData: any = {};
      if (year !== undefined) updateData.year = parseInt(year);
      if (quarter !== undefined) updateData.quarter = quarter || null;
      if (rating !== undefined) updateData.rating = rating ? parseInt(rating) : null;
      if (achievements !== undefined) updateData.achievements = achievements || null;
      if (improvements !== undefined) updateData.improvements = improvements || null;
      if (satisfactionLevel !== undefined) updateData.satisfactionLevel = satisfactionLevel || null;
      if (aspirations !== undefined) updateData.aspirations = aspirations || null;
      if (suggestionsForTeam !== undefined) updateData.suggestionsForTeam = suggestionsForTeam || null;

      const updatedAssessment = await prisma.selfAssessmentV2.update({
        where: { id },
        data: updateData,
      });

      res.json(updatedAssessment);
    } catch (error: any) {
      console.error('Error updating assessment:', error);
      if (error.code === 'P2002') {
        return res.status(409).json({
          message: 'Assessment already exists for this period',
        });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

/**
 * Delete assessment
 *
 * Deletes an existing self-assessment. Only the owner can delete their assessment.
 *
 * @route DELETE /assessments/:id
 * @auth Requires valid JWT token
 *
 * @param {string} req.params.id - Assessment ID to delete
 * @param {Object} req - Express request object with user data from auth middleware
 * @param {Object} res - Express response object
 *
 * @returns {Object} 200 - Assessment deleted successfully
 * @returns {Object} 403 - Not authorized
 * @returns {Object} 404 - Assessment not found
 * @returns {Object} 500 - Internal server error
 */
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const assessment = await prisma.selfAssessmentV2.findUnique({
      where: { id },
    });

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // Check if user owns this assessment
    if (assessment.userId !== (req as any).user.id) {
      return res
        .status(403)
        .json({ message: 'Not authorized to delete this assessment' });
    }

    await prisma.selfAssessmentV2.delete({
      where: { id },
    });

    res.json({ message: 'Assessment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assessment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export { router as assessmentRoutes };
