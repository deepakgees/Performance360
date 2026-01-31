import { PrismaClient } from '@prisma/client';
import express, { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { logger } from '../utils/logger';
import { authenticateToken } from '../middleware/auth';
import { checkIndirectReport } from '../utils/accessControl';

const router = express.Router();
const prisma = new PrismaClient();

interface CreateAchievementRequest {
  userId: string;
  date: string;
  achievement: string;
  observation: string;
}

interface UpdateAchievementRequest {
  date?: string;
  achievement?: string;
  observation?: string;
}

// Validation middleware
const validateCreateAchievement = [
  body('userId').isString().notEmpty().withMessage('User ID is required'),
  body('date').isISO8601().withMessage('Date must be a valid ISO date'),
  body('achievement')
    .isString()
    .notEmpty()
    .withMessage('Achievement is required'),
  body('observation')
    .isString()
    .notEmpty()
    .withMessage('Observation is required'),
];

const validateUpdateAchievement = [
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO date'),
  body('achievement')
    .optional()
    .isString()
    .notEmpty()
    .withMessage('Achievement cannot be empty'),
  body('observation')
    .optional()
    .isString()
    .notEmpty()
    .withMessage('Observation cannot be empty'),
];

const validateId = [
  param('id').isString().notEmpty().withMessage('Achievement ID is required'),
];

// GET /api/achievements-observations/:userId
// Get all achievements and observations for a specific user
router.get(
  '/:userId',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { user: currentUser } = req as any;
      const { page = '1', limit = '10' } = req.query;

      // Validate user ID format
      if (!userId || userId.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID',
        });
      }

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      // Verify user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, firstName: true, lastName: true, email: true },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found',
        });
      }

      // User can always view their own achievements
      if (currentUser.id === userId) {
        const achievements = await prisma.achievementsAndObservations.findMany({
          where: { userId },
          include: {
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { date: 'desc' },
          skip,
          take: limitNum,
        });

        const total = await prisma.achievementsAndObservations.count({
          where: { userId },
        });

        return res.json({
          success: true,
          data: {
            achievements,
            pagination: {
              page: pageNum,
              limit: limitNum,
              total,
              pages: Math.ceil(total / limitNum),
            },
            user,
          },
        });
      }

      // ADMIN: Can view any user's achievements
      if (currentUser.role === 'ADMIN') {
        const achievements = await prisma.achievementsAndObservations.findMany({
          where: { userId },
          include: {
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { date: 'desc' },
          skip,
          take: limitNum,
        });

        const total = await prisma.achievementsAndObservations.count({
          where: { userId },
        });

        return res.json({
          success: true,
          data: {
            achievements,
            pagination: {
              page: pageNum,
              limit: limitNum,
              total,
              pages: Math.ceil(total / limitNum),
            },
            user,
          },
        });
      }

      // MANAGER: Can only view their direct/indirect reports' achievements
      if (currentUser.role === 'MANAGER') {
        // Check if it's a direct report
        const directReport = await prisma.user.findFirst({
          where: {
            id: userId,
            managerId: currentUser.id,
            isActive: true,
          },
        });

        if (!directReport) {
          // Check if it's an indirect report
          const isIndirectReport = await checkIndirectReport(
            currentUser.id,
            userId
          );
          if (!isIndirectReport) {
            return res.status(403).json({
              success: false,
              message:
                'Access denied. You can only view achievements for your direct or indirect reports.',
            });
          }
        }

        const achievements = await prisma.achievementsAndObservations.findMany({
          where: { userId },
          include: {
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { date: 'desc' },
          skip,
          take: limitNum,
        });

        const total = await prisma.achievementsAndObservations.count({
          where: { userId },
        });

        return res.json({
          success: true,
          data: {
            achievements,
            pagination: {
              page: pageNum,
              limit: limitNum,
              total,
              pages: Math.ceil(total / limitNum),
            },
            user,
          },
        });
      }

      // EMPLOYEE: Can only view their own achievements
      return res.status(403).json({
        success: false,
        message: 'Access denied.',
      });
    } catch (error) {
      logger.logError('Error retrieving achievements and observations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve achievements and observations',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// POST /api/achievements-observations
// Create a new achievement and observation entry
router.post(
  '/',
  authenticateToken,
  validateCreateAchievement,
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const {
        userId,
        date,
        achievement,
        observation,
      }: CreateAchievementRequest = req.body;
      const createdBy = (req as any).user.id; // From auth middleware

      // Verify user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, firstName: true, lastName: true },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found',
        });
      }

      // Create the achievement and observation entry
      const newAchievement = await prisma.achievementsAndObservations.create({
        data: {
          userId,
          date: new Date(date),
          achievement,
          observation,
          createdBy,
        },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      logger.logInfo(`Created achievement for user ${userId} by ${createdBy}`);

      res.status(201).json({
        success: true,
        message: 'Achievement and observation created successfully',
        data: newAchievement,
      });
    } catch (error) {
      logger.logError('Error creating achievement and observation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create achievement and observation',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// PUT /api/achievements-observations/:id
// Update an existing achievement and observation entry
router.put(
  '/:id',
  authenticateToken,
  validateId,
  validateUpdateAchievement,
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const { date, achievement, observation }: UpdateAchievementRequest =
        req.body;
      const updatedBy = (req as any).user.id; // From auth middleware

      // Check if achievement exists
      const existingAchievement =
        await prisma.achievementsAndObservations.findUnique({
          where: { id },
          include: {
            creator: {
              select: { id: true },
            },
          },
        });

      if (!existingAchievement) {
        return res.status(404).json({
          success: false,
          message: 'Achievement and observation not found',
        });
      }

      // Check if user has permission to update (only creator can update)
      if (existingAchievement.createdBy !== updatedBy) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update this achievement',
        });
      }

      // Update the achievement
      const updatedAchievement =
        await prisma.achievementsAndObservations.update({
          where: { id },
          data: {
            ...(date && { date: new Date(date) }),
            ...(achievement && { achievement }),
            ...(observation && { observation }),
          },
          include: {
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        });

      logger.logInfo(`Updated achievement ${id} by ${updatedBy}`);

      res.json({
        success: true,
        message: 'Achievement and observation updated successfully',
        data: updatedAchievement,
      });
    } catch (error) {
      logger.logError('Error updating achievement and observation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update achievement and observation',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// DELETE /api/achievements-observations/:id
// Delete an achievement and observation entry
router.delete('/:id', authenticateToken, validateId, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedBy = (req as any).user.id; // From auth middleware

    // Check if achievement exists
    const existingAchievement =
      await prisma.achievementsAndObservations.findUnique({
        where: { id },
        include: {
          creator: {
            select: { id: true },
          },
        },
      });

    if (!existingAchievement) {
      return res.status(404).json({
        success: false,
        message: 'Achievement and observation not found',
      });
    }

    // Check if user has permission to delete (only creator can delete)
    if (existingAchievement.createdBy !== deletedBy) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this achievement',
      });
    }

    // Delete the achievement
    await prisma.achievementsAndObservations.delete({
      where: { id },
    });

    logger.logInfo(`Deleted achievement ${id} by ${deletedBy}`);

    res.json({
      success: true,
      message: 'Achievement and observation deleted successfully',
    });
  } catch (error) {
    logger.logError('Error deleting achievement and observation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete achievement and observation',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/achievements-observations/:id
// Get a specific achievement and observation entry
router.get('/entry/:id', authenticateToken, validateId, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const achievement = await prisma.achievementsAndObservations.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Achievement and observation not found',
      });
    }

    res.json({
      success: true,
      data: achievement,
    });
  } catch (error) {
    logger.logError('Error retrieving achievement and observation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve achievement and observation',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
