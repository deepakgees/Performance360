import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';
import { checkIndirectReport } from '../utils/accessControl';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/quarterly-performance/:userId
 * Get all quarterly performance records for a specific user
 */
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { user: currentUser } = req as any;

    // Validate user ID format
    if (!userId || userId.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid user ID',
      });
    }

    // User can always view their own performance
    if (currentUser.id === userId) {
      const performances = await prisma.quarterlyPerformance.findMany({
        where: { userId: userId },
        orderBy: [{ year: 'desc' }, { quarter: 'asc' }],
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
      });
      return res.json(performances);
    }

    // ADMIN: Can view any user's performance
    if (currentUser.role === 'ADMIN') {
      const performances = await prisma.quarterlyPerformance.findMany({
        where: { userId: userId },
        orderBy: [{ year: 'desc' }, { quarter: 'asc' }],
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
      });
      return res.json(performances);
    }

    // MANAGER: Can only view their direct/indirect reports' performance
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
        const performances = await prisma.quarterlyPerformance.findMany({
          where: { userId: userId },
          orderBy: [{ year: 'desc' }, { quarter: 'asc' }],
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
        });
        return res.json(performances);
      }

      // Check if it's an indirect report
      const isIndirectReport = await checkIndirectReport(
        currentUser.id,
        userId
      );
      if (isIndirectReport) {
        const performances = await prisma.quarterlyPerformance.findMany({
          where: { userId: userId },
          orderBy: [{ year: 'desc' }, { quarter: 'asc' }],
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
        });
        return res.json(performances);
      }

      return res.status(403).json({
        error:
          'Access denied. You can only view performance data for your direct or indirect reports.',
      });
    }

    // EMPLOYEE: Can only view their own performance
    return res.status(403).json({
      error:
        'Access denied. Only managers, admins, or the user themselves can view performance data.',
    });
  } catch (error) {
    logger.logError('Error fetching quarterly performance:', error);
    res
      .status(500)
      .json({ error: 'Failed to fetch quarterly performance data' });
  }
});

/**
 * POST /api/quarterly-performance
 * Create a new quarterly performance record
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { user: currentUser } = req as any;
    const {
      userId,
      quarter,
      year,
      rating,
      isCritical,
      managerComment,
      hrbpComment,
      nextActionPlanManager,
      nextActionPlanHrbp,
    } = req.body;

    // Validate required fields
    if (!userId || !quarter || !year) {
      return res.status(400).json({
        error: 'userId, quarter, and year are required fields',
      });
    }

    // Validate quarter format
    if (!['Q1', 'Q2', 'Q3', 'Q4'].includes(quarter)) {
      return res.status(400).json({
        error: 'quarter must be one of: Q1, Q2, Q3, Q4',
      });
    }

    // Validate year
    if (year < 2020 || year > 2030) {
      return res.status(400).json({
        error: 'year must be between 2020 and 2030',
      });
    }

    // Validate rating if provided
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        error: 'rating must be between 1 and 5',
      });
    }

    // Check if current user has permission to create performance records
    // Only managers and admins can create performance records
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'MANAGER') {
      return res.status(403).json({
        error:
          'Access denied. Only managers and admins can create performance records.',
      });
    }

    // Check if a record already exists for this user, quarter, and year
    const existingRecord = await prisma.quarterlyPerformance.findFirst({
      where: {
        userId,
        quarter,
        year,
      },
    });

    if (existingRecord) {
      return res.status(409).json({
        error:
          'A performance record already exists for this user, quarter, and year',
      });
    }

    const performance = await prisma.quarterlyPerformance.create({
      data: {
        userId,
        quarter,
        year,
        rating,
        isCritical: isCritical || false,
        managerComment,
        hrbpComment,
        nextActionPlanManager,
        nextActionPlanHrbp,
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
      },
    });

    logger.logInfo(
      `Created quarterly performance record for user ${userId}, ${quarter} ${year}`
    );
    res.status(201).json(performance);
  } catch (error) {
    logger.logError('Error creating quarterly performance record:', error);
    res
      .status(500)
      .json({ error: 'Failed to create quarterly performance record' });
  }
});

/**
 * PUT /api/quarterly-performance/:id
 * Update an existing quarterly performance record
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { user: currentUser } = req as any;
    const {
      rating,
      isCritical,
      managerComment,
      hrbpComment,
      nextActionPlanManager,
      nextActionPlanHrbp,
    } = req.body;

    // Check if current user has permission to update performance records
    // Only managers and admins can update performance records
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'MANAGER') {
      return res.status(403).json({
        error:
          'Access denied. Only managers and admins can update performance records.',
      });
    }

    // Check if the record exists
    const existingRecord = await prisma.quarterlyPerformance.findUnique({
      where: { id },
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
    });

    if (!existingRecord) {
      return res.status(404).json({
        error: 'Quarterly performance record not found',
      });
    }

    // Validate rating if provided
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        error: 'rating must be between 1 and 5',
      });
    }

    // Build update data object, only including fields that are provided (not undefined)
    const updateData: any = {};
    if (rating !== undefined) updateData.rating = rating;
    if (isCritical !== undefined) updateData.isCritical = isCritical;
    if (managerComment !== undefined) updateData.managerComment = managerComment || null;
    if (hrbpComment !== undefined) updateData.hrbpComment = hrbpComment || null;
    if (nextActionPlanManager !== undefined) updateData.nextActionPlanManager = nextActionPlanManager || null;
    if (nextActionPlanHrbp !== undefined) updateData.nextActionPlanHrbp = nextActionPlanHrbp || null;

    const updatedPerformance = await prisma.quarterlyPerformance.update({
      where: { id },
      data: updateData,
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
    });

    logger.logInfo(`Updated quarterly performance record ${id}`);
    res.json(updatedPerformance);
  } catch (error) {
    logger.logError('Error updating quarterly performance record:', error);
    res
      .status(500)
      .json({ error: 'Failed to update quarterly performance record' });
  }
});

/**
 * DELETE /api/quarterly-performance/:id
 * Delete a quarterly performance record
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { user: currentUser } = req as any;

    // Check if current user has permission to delete performance records
    // Only admins can delete performance records
    if (currentUser.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Access denied. Only admins can delete performance records.',
      });
    }

    // Check if the record exists
    const existingRecord = await prisma.quarterlyPerformance.findUnique({
      where: { id },
    });

    if (!existingRecord) {
      return res.status(404).json({
        error: 'Quarterly performance record not found',
      });
    }

    await prisma.quarterlyPerformance.delete({
      where: { id },
    });

    logger.logInfo(`Deleted quarterly performance record ${id}`);
    res.status(204).send();
  } catch (error) {
    logger.logError('Error deleting quarterly performance record:', error);
    res
      .status(500)
      .json({ error: 'Failed to delete quarterly performance record' });
  }
});

export default router;
