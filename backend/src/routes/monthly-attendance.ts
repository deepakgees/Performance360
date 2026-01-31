import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { logger } from '../utils/logger';
import { checkUserAccess } from '../utils/accessControl';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/monthly-attendance/:userId
 * Get all monthly attendance records for a specific user
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

    // User can always view their own attendance
    if (currentUser.id === userId) {
      const attendances = await prisma.monthlyAttendance.findMany({
        where: { userId: userId },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
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
      return res.json(attendances);
    }

    // ADMIN: Can view any user's attendance
    if (currentUser.role === 'ADMIN') {
      const attendances = await prisma.monthlyAttendance.findMany({
        where: { userId: userId },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
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
      return res.json(attendances);
    }

    // MANAGER: Can view their direct/indirect reports' attendance
    if (currentUser.role === 'MANAGER') {
      const hasAccess = await checkUserAccess(
        currentUser.id,
        currentUser.role,
        userId
      );
      if (!hasAccess) {
        return res.status(403).json({
          error:
            'Access denied. You can only view attendance for your direct or indirect reports.',
        });
      }

      const attendances = await prisma.monthlyAttendance.findMany({
        where: { userId: userId },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
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
      return res.json(attendances);
    }

    // EMPLOYEE: Can only view their own attendance
    return res.status(403).json({
      error:
        'Access denied. Only admins, managers, or the user themselves can view attendance data.',
    });
  } catch (error) {
    logger.logError('Error fetching monthly attendance:', error);
    res
      .status(500)
      .json({ error: 'Failed to fetch monthly attendance data' });
  }
});

/**
 * GET /api/monthly-attendance
 * Get all monthly attendance records (admin only)
 */
router.get('/', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { userId, year, month } = req.query;

    const where: any = {};
    if (userId) where.userId = userId as string;
    if (year) where.year = parseInt(year as string);
    if (month) where.month = parseInt(month as string);

    const attendances = await prisma.monthlyAttendance.findMany({
      where,
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
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

    res.json(attendances);
  } catch (error) {
    logger.logError('Error fetching monthly attendance:', error);
    res
      .status(500)
      .json({ error: 'Failed to fetch monthly attendance data' });
  }
});

/**
 * POST /api/monthly-attendance
 * Create a new monthly attendance record (admin only)
 */
router.post(
  '/',
  authenticateToken,
  requireRole(['ADMIN']),
  async (req, res) => {
    try {
      const {
        userId,
        month,
        year,
        workingDays,
        presentInOffice,
        leavesAvailed,
        leaveNotificationsInTeamsChannel,
        weeklyCompliance,
        exceptionApproved,
        reasonForNonCompliance,
      } = req.body;

      // Validate required fields
      if (!userId || !month || !year || workingDays === undefined || presentInOffice === undefined) {
        return res.status(400).json({
          error:
            'userId, month, year, workingDays, and presentInOffice are required fields',
        });
      }

      // Validate month (1-12)
      if (month < 1 || month > 12) {
        return res.status(400).json({
          error: 'month must be between 1 and 12',
        });
      }

      // Validate year
      if (year < 2020 || year > 2030) {
        return res.status(400).json({
          error: 'year must be between 2020 and 2030',
        });
      }

      // Validate workingDays
      if (workingDays < 0 || workingDays > 31) {
        return res.status(400).json({
          error: 'workingDays must be between 0 and 31',
        });
      }

      // Validate presentInOffice
      if (presentInOffice < 0 || presentInOffice > workingDays) {
        return res.status(400).json({
          error:
            'presentInOffice must be between 0 and workingDays',
        });
      }

      // Validate leavesAvailed
      const leaves = leavesAvailed || 0;
      if (leaves < 0 || leaves > workingDays) {
        return res.status(400).json({
          error: 'leavesAvailed must be between 0 and workingDays',
        });
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({
          error: 'Resource not found',
        });
      }

      // Check if a record already exists for this user, month, and year
      const existingRecord = await prisma.monthlyAttendance.findFirst({
        where: {
          userId,
          month,
          year,
        },
      });

      if (existingRecord) {
        return res.status(409).json({
          error:
            'A monthly attendance record already exists for this user, month, and year',
        });
      }

      // Calculate attendance percentage
      // Formula: (presentInOffice / (workingDays - leavesAvailed)) * 100
      const effectiveWorkingDays = workingDays - leaves;
      const attendancePercentage =
        effectiveWorkingDays > 0
          ? (presentInOffice / effectiveWorkingDays) * 100
          : 0;

      const attendance = await prisma.monthlyAttendance.create({
        data: {
          userId,
          month,
          year,
          workingDays,
          presentInOffice,
          leavesAvailed: leaves,
          leaveNotificationsInTeamsChannel: leaveNotificationsInTeamsChannel || 0,
          attendancePercentage,
          weeklyCompliance:
            weeklyCompliance !== undefined ? weeklyCompliance : null,
          exceptionApproved:
            exceptionApproved !== undefined ? exceptionApproved : null,
          reasonForNonCompliance: reasonForNonCompliance || null,
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
        `Created monthly attendance record for user ${userId}, ${month}/${year}`
      );
      res.status(201).json(attendance);
    } catch (error: any) {
      logger.logError('Error creating monthly attendance record:', error);
      
      // Handle unique constraint violation
      if (error.code === 'P2002') {
        return res.status(409).json({
          error:
            'A monthly attendance record already exists for this user, month, and year',
        });
      }

      res.status(500).json({
        error: 'Failed to create monthly attendance record',
      });
    }
  }
);

/**
 * PUT /api/monthly-attendance/:id
 * Update an existing monthly attendance record (admin only)
 */
router.put(
  '/:id',
  authenticateToken,
  requireRole(['ADMIN']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        workingDays,
        presentInOffice,
        leavesAvailed,
        leaveNotificationsInTeamsChannel,
        weeklyCompliance,
        exceptionApproved,
        reasonForNonCompliance,
      } = req.body;

      // Check if the record exists
      const existingRecord = await prisma.monthlyAttendance.findUnique({
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
          error: 'Monthly attendance record not found',
        });
      }

      // Build update data object
      const updateData: any = {};

      if (workingDays !== undefined) {
        if (workingDays < 0 || workingDays > 31) {
          return res.status(400).json({
            error: 'workingDays must be between 0 and 31',
          });
        }
        updateData.workingDays = workingDays;
      }

      if (presentInOffice !== undefined) {
        const effectiveWorkingDays =
          (updateData.workingDays || existingRecord.workingDays) -
          (updateData.leavesAvailed !== undefined
            ? updateData.leavesAvailed
            : existingRecord.leavesAvailed);
        
        if (presentInOffice < 0 || presentInOffice > effectiveWorkingDays) {
          return res.status(400).json({
            error:
              'presentInOffice must be between 0 and effective working days (workingDays - leavesAvailed)',
          });
        }
        updateData.presentInOffice = presentInOffice;
      }

      if (leavesAvailed !== undefined) {
        const currentWorkingDays =
          updateData.workingDays || existingRecord.workingDays;
        if (leavesAvailed < 0 || leavesAvailed > currentWorkingDays) {
          return res.status(400).json({
            error:
              'leavesAvailed must be between 0 and workingDays',
          });
        }
        updateData.leavesAvailed = leavesAvailed;
      }

      if (leaveNotificationsInTeamsChannel !== undefined) {
        if (leaveNotificationsInTeamsChannel < 0) {
          return res.status(400).json({
            error: 'leaveNotificationsInTeamsChannel must be >= 0',
          });
        }
        updateData.leaveNotificationsInTeamsChannel = leaveNotificationsInTeamsChannel;
      }

      if (weeklyCompliance !== undefined) {
        updateData.weeklyCompliance =
          weeklyCompliance === null ? null : Boolean(weeklyCompliance);
      }

      if (exceptionApproved !== undefined) {
        updateData.exceptionApproved =
          exceptionApproved === null ? null : Boolean(exceptionApproved);
      }

      if (reasonForNonCompliance !== undefined) {
        updateData.reasonForNonCompliance =
          reasonForNonCompliance || null;
      }

      // Recalculate attendance percentage if relevant fields changed
      if (
        updateData.workingDays !== undefined ||
        updateData.presentInOffice !== undefined ||
        updateData.leavesAvailed !== undefined
      ) {
        const finalWorkingDays =
          updateData.workingDays || existingRecord.workingDays;
        const finalPresentInOffice =
          updateData.presentInOffice || existingRecord.presentInOffice;
        const finalLeavesAvailed =
          updateData.leavesAvailed !== undefined
            ? updateData.leavesAvailed
            : existingRecord.leavesAvailed;

        const effectiveWorkingDays = finalWorkingDays - finalLeavesAvailed;
        updateData.attendancePercentage =
          effectiveWorkingDays > 0
            ? (finalPresentInOffice / effectiveWorkingDays) * 100
            : 0;
      }

      const updatedAttendance = await prisma.monthlyAttendance.update({
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

      logger.logInfo(`Updated monthly attendance record ${id}`);
      res.json(updatedAttendance);
    } catch (error) {
      logger.logError('Error updating monthly attendance record:', error);
      res.status(500).json({
        error: 'Failed to update monthly attendance record',
      });
    }
  }
);

/**
 * DELETE /api/monthly-attendance/:id
 * Delete a monthly attendance record (admin only)
 */
router.delete(
  '/:id',
  authenticateToken,
  requireRole(['ADMIN']),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Check if the record exists
      const existingRecord = await prisma.monthlyAttendance.findUnique({
        where: { id },
      });

      if (!existingRecord) {
        return res.status(404).json({
          error: 'Monthly attendance record not found',
        });
      }

      await prisma.monthlyAttendance.delete({
        where: { id },
      });

      logger.logInfo(`Deleted monthly attendance record ${id}`);
      res.status(204).send();
    } catch (error) {
      logger.logError('Error deleting monthly attendance record:', error);
      res.status(500).json({
        error: 'Failed to delete monthly attendance record',
      });
    }
  }
);

/**
 * POST /api/monthly-attendance/bulk
 * Create or update multiple monthly attendance records at once (admin only)
 */
router.post(
  '/bulk',
  authenticateToken,
  requireRole(['ADMIN']),
  async (req, res) => {
    try {
      const { records } = req.body;

      if (!Array.isArray(records) || records.length === 0) {
        return res.status(400).json({
          error: 'records must be a non-empty array',
        });
      }

      const results = [];
      const errors = [];

      for (const record of records) {
        const {
          userId,
          month,
          year,
          workingDays,
          presentInOffice,
          leavesAvailed,
          leaveNotificationsInTeamsChannel,
          weeklyCompliance,
          exceptionApproved,
          reasonForNonCompliance,
        } = record;

        // Validate required fields
        if (!userId || !month || !year || workingDays === undefined || presentInOffice === undefined) {
          errors.push({
            userId,
            error: 'userId, month, year, workingDays, and presentInOffice are required',
          });
          continue;
        }

        // Validate month (1-12)
        if (month < 1 || month > 12) {
          errors.push({
            userId,
            error: 'month must be between 1 and 12',
          });
          continue;
        }

        // Validate year
        if (year < 2020 || year > 2030) {
          errors.push({
            userId,
            error: 'year must be between 2020 and 2030',
          });
          continue;
        }

        // Validate workingDays
        if (workingDays < 0 || workingDays > 31) {
          errors.push({
            userId,
            error: 'workingDays must be between 0 and 31',
          });
          continue;
        }

        // Validate presentInOffice
        const leaves = leavesAvailed || 0;
        const effectiveWorkingDays = workingDays - leaves;
        if (presentInOffice < 0 || presentInOffice > effectiveWorkingDays) {
          errors.push({
            userId,
            error: 'presentInOffice must be between 0 and effective working days',
          });
          continue;
        }

        // Validate leavesAvailed
        if (leaves < 0 || leaves > workingDays) {
          errors.push({
            userId,
            error: 'leavesAvailed must be between 0 and workingDays',
          });
          continue;
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          errors.push({
            userId,
            error: 'Resource not found',
          });
          continue;
        }

        // Calculate attendance percentage
        const attendancePercentage =
          effectiveWorkingDays > 0
            ? (presentInOffice / effectiveWorkingDays) * 100
            : 0;

        try {
          // Try to update existing record, or create new one
          const attendance = await prisma.monthlyAttendance.upsert({
            where: {
              userId_month_year: {
                userId,
                month,
                year,
              },
            },
            update: {
              workingDays,
              presentInOffice,
              leavesAvailed: leaves,
              leaveNotificationsInTeamsChannel: leaveNotificationsInTeamsChannel || 0,
              attendancePercentage,
              weeklyCompliance:
                weeklyCompliance !== undefined ? weeklyCompliance : null,
              exceptionApproved:
                exceptionApproved !== undefined ? exceptionApproved : null,
              reasonForNonCompliance: reasonForNonCompliance || null,
            },
            create: {
              userId,
              month,
              year,
              workingDays,
              presentInOffice,
              leavesAvailed: leaves,
              leaveNotificationsInTeamsChannel: leaveNotificationsInTeamsChannel || 0,
              attendancePercentage,
              weeklyCompliance:
                weeklyCompliance !== undefined ? weeklyCompliance : null,
              exceptionApproved:
                exceptionApproved !== undefined ? exceptionApproved : null,
              reasonForNonCompliance: reasonForNonCompliance || null,
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

          results.push(attendance);
        } catch (error: any) {
          errors.push({
            userId,
            error: error.message || 'Failed to save attendance record',
          });
        }
      }

      logger.logInfo(
        `Bulk update: ${results.length} records processed, ${errors.length} errors`
      );

      res.status(200).json({
        success: results.length,
        errorCount: errors.length,
        results,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error) {
      logger.logError('Error in bulk attendance update:', error);
      res.status(500).json({
        error: 'Failed to process bulk attendance update',
      });
    }
  }
);

/**
 * PATCH /api/monthly-attendance/:id/comment
 * Update manager comment (reasonForNonCompliance) for a monthly attendance record (managers only)
 */
router.patch(
  '/:id/comment',
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { reasonForNonCompliance } = req.body;
      const { user: currentUser } = req as any;

      // Check if the record exists
      const existingRecord = await prisma.monthlyAttendance.findUnique({
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
          error: 'Monthly attendance record not found',
        });
      }

      // Check if user has permission to add/edit comments
      // Only managers (including admins) who have access to this employee can add comments
      if (currentUser.role === 'EMPLOYEE') {
        return res.status(403).json({
          error: 'Access denied. Only managers can add or edit comments.',
        });
      }

      // For managers, check if they have access to this employee
      if (currentUser.role === 'MANAGER') {
        const hasAccess = await checkUserAccess(
          currentUser.id,
          currentUser.role,
          existingRecord.userId
        );
        if (!hasAccess) {
          return res.status(403).json({
            error:
              'Access denied. You can only add comments for your direct or indirect reports.',
          });
        }
      }

      // Update the comment (using reasonForNonCompliance field)
      const updatedAttendance = await prisma.monthlyAttendance.update({
        where: { id },
        data: {
          reasonForNonCompliance: reasonForNonCompliance || null,
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
        `Updated manager comment for monthly attendance record ${id} by user ${currentUser.id}`
      );
      res.json(updatedAttendance);
    } catch (error) {
      logger.logError('Error updating manager comment:', error);
      res.status(500).json({
        error: 'Failed to update manager comment',
      });
    }
  }
);

export default router;

