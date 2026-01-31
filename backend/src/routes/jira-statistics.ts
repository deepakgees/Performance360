import { PrismaClient } from '@prisma/client';
import express, { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';
import { checkUserAccess } from '../utils/accessControl';

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to get user IDs from Jira usernames using the mapping table
async function getUserIdsFromJiraUsernames(
  jiraUsernames: string[]
): Promise<string[]> {
  if (jiraUsernames.length === 0) return [];

  const mappings = await prisma.jiraUserMapping.findMany({
    where: {
      jiraUsername: {
        in: jiraUsernames,
        mode: 'insensitive',
      },
    },
    select: {
      userId: true,
    },
  });

  return mappings.map(m => m.userId);
}

// GET /api/jira-statistics/my-statistics
// Get Jira statistics for the current user
router.get(
  '/my-statistics',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      logger.logInfo(`Fetching Jira statistics for user ${userId}`);

      // Get user details to match by name and email as well
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true, email: true },
      });

      if (!currentUser) {
        return res.status(404).json({
          message: 'Resource not found',
        });
      }

      // Get all tickets assigned to the current user
      // First try direct name matching, then check mapping table
      const directNameMatch = `${currentUser.firstName} ${currentUser.lastName}`;

      // Get mapped Jira usernames for this user
      const userMappings = await prisma.jiraUserMapping.findMany({
        where: { userId: userId },
        select: { jiraUsername: true },
      });
      const mappedUsernames = userMappings.map(m => m.jiraUsername);

      // Build where clause to match either direct name or mapped usernames
      const whereClause: any = {
        OR: [
          {
            assignee: {
              equals: directNameMatch,
              mode: 'insensitive',
            },
          },
          ...(mappedUsernames.length > 0
            ? [
                {
                  assignee: {
                    in: mappedUsernames,
                    mode: 'insensitive',
                  },
                },
              ]
            : []),
        ],
      };

      const userTickets = await prisma.jiraTicket.findMany({
        where: whereClause,
        orderBy: {
          createDate: 'desc',
        },
      });

      if (userTickets.length === 0) {
        return res.json({
          totalTickets: 0,
          completedTickets: 0,
          inProgressTickets: 0,
          averageTicketResolutionTime: 0,
          totalTimeSpent: 0,
          ticketsByPriority: {
            high: 0,
            medium: 0,
            low: 0,
          },
          ticketsByStatus: {
            inProgress: 0,
            blocked: 0,
            review: 0,
            refinement: 0,
            readyForDevelopment: 0,
          },
          recentTickets: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalTickets: 0,
            limit: 50,
          },
        });
      }

      // Calculate statistics
      const totalTickets = userTickets.length;
      const completedTickets = userTickets.filter(
        ticket => ticket.endDate !== null
      ).length;
      const inProgressTickets = userTickets.filter(
        ticket => ticket.endDate === null
      ).length;

      // Calculate average ticket resolution time (from creation to completion in seconds)
      const completedTicketsWithTime = userTickets.filter(
        ticket => ticket.endDate && ticket.createDate
      );

      let averageTicketResolutionTime = 0;
      if (completedTicketsWithTime.length > 0) {
        const totalResolutionTime = completedTicketsWithTime.reduce(
          (total, ticket) => {
            const resolutionTime =
              new Date(ticket.endDate!).getTime() -
              new Date(ticket.createDate!).getTime();
            return total + resolutionTime;
          },
          0
        );
        averageTicketResolutionTime = Math.round(
          totalResolutionTime / completedTicketsWithTime.length / 1000
        ); // Convert to seconds
      }

      // Calculate sum of original estimates
      const totalTimeSpent = userTickets.reduce((total, ticket) => {
        return total + (ticket.originalEstimate || 0);
      }, 0);

      // Calculate tickets by priority
      const ticketsByPriority = {
        high: userTickets.filter(ticket => ticket.priority === 'High').length,
        medium: userTickets.filter(ticket => ticket.priority === 'Medium')
          .length,
        low: userTickets.filter(ticket => ticket.priority === 'Low').length,
      };

      // Calculate total time spent in each status (sum of all tickets)
      const totalInProgressTime = userTickets.reduce(
        (sum, ticket) => sum + (ticket.inProgressTime || 0),
        0
      );
      const totalBlockedTime = userTickets.reduce(
        (sum, ticket) => sum + (ticket.blockedTime || 0),
        0
      );
      const totalReviewTime = userTickets.reduce(
        (sum, ticket) => sum + (ticket.reviewTime || 0),
        0
      );
      const totalRefinementTime = userTickets.reduce(
        (sum, ticket) => sum + (ticket.refinementTime || 0),
        0
      );
      const totalReadyForDevelopmentTime = userTickets.reduce(
        (sum, ticket) => sum + (ticket.readyForDevelopmentTime || 0),
        0
      );
      const totalPromotionTime = userTickets.reduce(
        (sum, ticket) => sum + (ticket.promotionTime || 0),
        0
      );

      // Calculate average time spent in each status
      const ticketsByStatus = {
        inProgress:
          totalTickets > 0 ? Math.round(totalInProgressTime / totalTickets) : 0,
        blocked:
          totalTickets > 0 ? Math.round(totalBlockedTime / totalTickets) : 0,
        review:
          totalTickets > 0 ? Math.round(totalReviewTime / totalTickets) : 0,
        refinement:
          totalTickets > 0 ? Math.round(totalRefinementTime / totalTickets) : 0,
        readyForDevelopment:
          totalTickets > 0
            ? Math.round(totalReadyForDevelopmentTime / totalTickets)
            : 0,
        promotion:
          totalTickets > 0 ? Math.round(totalPromotionTime / totalTickets) : 0,
      };

      // Get all tickets with pagination support
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      const totalTicketsCount = userTickets.length;
      const paginatedTickets = userTickets
        .slice(offset, offset + limit)
        .map(ticket => ({
          jiraId: ticket.jiraId,
          title: ticket.title,
          priority: ticket.priority || 'Unknown',
          status: ticket.status || 'Unknown',
          createDate: ticket.createDate?.toISOString() || '',
          endDate: ticket.endDate?.toISOString(),
          originalEstimate: ticket.originalEstimate || 0,
          refinementTime: ticket.refinementTime || 0,
          readyForDevelopmentTime: ticket.readyForDevelopmentTime || 0,
          inProgressTime: ticket.inProgressTime || 0,
          blockedTime: ticket.blockedTime || 0,
          reviewTime: ticket.reviewTime || 0,
          promotionTime: ticket.promotionTime || 0,
        }));

      const statistics = {
        totalTickets,
        completedTickets,
        inProgressTickets,
        averageTicketResolutionTime,
        totalTimeSpent,
        ticketsByPriority,
        ticketsByStatus,
        recentTickets: paginatedTickets,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalTicketsCount / limit),
          totalTickets: totalTicketsCount,
          limit,
        },
      };

      logger.logInfo(`Found ${totalTickets} tickets for user ${userId}`);
      res.json(statistics);
    } catch (error) {
      logger.logError('Error fetching Jira statistics', error);
      res.status(500).json({
        message: 'Failed to fetch Jira statistics',
      });
    }
  }
);

// GET /api/jira-statistics/user-statistics/:userId
// Get Jira statistics for a specific user (for managers/admins viewing their reports)
router.get(
  '/user-statistics/:userId',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { startDate, endDate } = req.query;
      const currentUserId = (req as any).user.id;
      logger.logInfo(
        `Fetching Jira statistics for user ${userId} by ${currentUserId} with date range: ${startDate} to ${endDate}`
      );

      // Verify that the current user has permission to view this user's statistics
      // This could be enhanced with more sophisticated permission checking
      const currentUser = await prisma.user.findUnique({
        where: { id: currentUserId },
        select: { role: true },
      });

      if (!currentUser) {
        return res.status(404).json({
          message: 'Current user not found',
        });
      }

      // User can always view their own statistics
      if (currentUserId === userId) {
        // Continue to fetch own statistics
      } else {
        // Check if user has permission to view this user's statistics
        if (currentUser.role !== 'ADMIN' && currentUser.role !== 'MANAGER') {
          return res.status(403).json({
            message: 'Insufficient permissions to view user statistics',
          });
        }

        // For managers, verify they have access to this user
        if (currentUser.role === 'MANAGER') {
          const hasAccess = await checkUserAccess(
            currentUserId,
            currentUser.role,
            userId
          );
          if (!hasAccess) {
            return res.status(403).json({
              message: 'Access denied. You can only view statistics for your direct or indirect reports.',
            });
          }
        }
      }

      // Get user details to match by name as well
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true, email: true },
      });

      if (!targetUser) {
        return res.status(404).json({
          message: 'Resource not found',
        });
      }

      // Build where clause for date filtering
      // First try direct name matching, then check mapping table
      const directNameMatch = `${targetUser.firstName} ${targetUser.lastName}`;

      // Get mapped Jira usernames for this user
      const userMappings = await prisma.jiraUserMapping.findMany({
        where: { userId: userId },
        select: { jiraUsername: true },
      });
      const mappedUsernames = userMappings.map(m => m.jiraUsername);

      // Build where clause to match either direct name or mapped usernames
      const whereClause: any = {
        OR: [
          {
            assignee: {
              equals: directNameMatch,
              mode: 'insensitive',
            },
          },
          ...(mappedUsernames.length > 0
            ? [
                {
                  assignee: {
                    in: mappedUsernames,
                    mode: 'insensitive',
                  },
                },
              ]
            : []),
        ],
      };

      // Add date range filtering if provided
      if (startDate || endDate) {
        whereClause.endDate = {};
        if (startDate) {
          whereClause.endDate.gte = new Date(startDate as string);
        }
        if (endDate) {
          whereClause.endDate.lte = new Date(endDate as string);
        }
      }

      // Get tickets assigned to the target user with date filtering
      const userTickets = await prisma.jiraTicket.findMany({
        where: whereClause,
        orderBy: {
          createDate: 'desc',
        },
      });

      if (userTickets.length === 0) {
        return res.json({
          totalTickets: 0,
          completedTickets: 0,
          inProgressTickets: 0,
          averageTicketResolutionTime: 0,
          totalTimeSpent: 0,
          ticketsByPriority: {
            high: 0,
            medium: 0,
            low: 0,
          },
          ticketsByStatus: {
            inProgress: 0,
            blocked: 0,
            review: 0,
            refinement: 0,
            readyForDevelopment: 0,
          },
          recentTickets: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalTickets: 0,
            limit: 50,
          },
        });
      }

      // Calculate statistics (same logic as my-statistics)
      const totalTickets = userTickets.length;
      const completedTickets = userTickets.filter(
        ticket => ticket.endDate !== null
      ).length;
      const inProgressTickets = userTickets.filter(
        ticket => ticket.endDate === null
      ).length;

      // Calculate average ticket resolution time (from creation to completion in seconds)
      const completedTicketsWithTime = userTickets.filter(
        ticket => ticket.endDate && ticket.createDate
      );

      let averageTicketResolutionTime = 0;
      if (completedTicketsWithTime.length > 0) {
        const totalResolutionTime = completedTicketsWithTime.reduce(
          (total, ticket) => {
            const resolutionTime =
              new Date(ticket.endDate!).getTime() -
              new Date(ticket.createDate!).getTime();
            return total + resolutionTime;
          },
          0
        );
        averageTicketResolutionTime = Math.round(
          totalResolutionTime / completedTicketsWithTime.length / 1000
        ); // Convert to seconds
      }

      // Calculate sum of original estimates
      const totalTimeSpent = userTickets.reduce((total, ticket) => {
        return total + (ticket.originalEstimate || 0);
      }, 0);

      // Calculate tickets by priority
      const ticketsByPriority = {
        high: userTickets.filter(ticket => ticket.priority === 'High').length,
        medium: userTickets.filter(ticket => ticket.priority === 'Medium')
          .length,
        low: userTickets.filter(ticket => ticket.priority === 'Low').length,
      };

      // Calculate total time spent in each status (sum of all tickets)
      const totalInProgressTime = userTickets.reduce(
        (sum, ticket) => sum + (ticket.inProgressTime || 0),
        0
      );
      const totalBlockedTime = userTickets.reduce(
        (sum, ticket) => sum + (ticket.blockedTime || 0),
        0
      );
      const totalReviewTime = userTickets.reduce(
        (sum, ticket) => sum + (ticket.reviewTime || 0),
        0
      );
      const totalRefinementTime = userTickets.reduce(
        (sum, ticket) => sum + (ticket.refinementTime || 0),
        0
      );
      const totalReadyForDevelopmentTime = userTickets.reduce(
        (sum, ticket) => sum + (ticket.readyForDevelopmentTime || 0),
        0
      );
      const totalPromotionTime = userTickets.reduce(
        (sum, ticket) => sum + (ticket.promotionTime || 0),
        0
      );

      // Calculate average time spent in each status
      const ticketsByStatus = {
        inProgress:
          totalTickets > 0 ? Math.round(totalInProgressTime / totalTickets) : 0,
        blocked:
          totalTickets > 0 ? Math.round(totalBlockedTime / totalTickets) : 0,
        review:
          totalTickets > 0 ? Math.round(totalReviewTime / totalTickets) : 0,
        refinement:
          totalTickets > 0 ? Math.round(totalRefinementTime / totalTickets) : 0,
        readyForDevelopment:
          totalTickets > 0
            ? Math.round(totalReadyForDevelopmentTime / totalTickets)
            : 0,
        promotion:
          totalTickets > 0 ? Math.round(totalPromotionTime / totalTickets) : 0,
      };

      // Get all tickets with pagination support
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      const totalTicketsCount = userTickets.length;
      const paginatedTickets = userTickets
        .slice(offset, offset + limit)
        .map(ticket => ({
          jiraId: ticket.jiraId,
          title: ticket.title,
          priority: ticket.priority || 'Unknown',
          status: ticket.status || 'Unknown',
          createDate: ticket.createDate?.toISOString() || '',
          endDate: ticket.endDate?.toISOString(),
          originalEstimate: ticket.originalEstimate || 0,
          refinementTime: ticket.refinementTime || 0,
          readyForDevelopmentTime: ticket.readyForDevelopmentTime || 0,
          inProgressTime: ticket.inProgressTime || 0,
          blockedTime: ticket.blockedTime || 0,
          reviewTime: ticket.reviewTime || 0,
          promotionTime: ticket.promotionTime || 0,
        }));

      const statistics = {
        totalTickets,
        completedTickets,
        inProgressTickets,
        averageTicketResolutionTime,
        totalTimeSpent,
        ticketsByPriority,
        ticketsByStatus,
        recentTickets: paginatedTickets,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalTicketsCount / limit),
          totalTickets: totalTicketsCount,
          limit,
        },
      };

      logger.logInfo(`Found ${totalTickets} tickets for user ${userId}`);
      res.json(statistics);
    } catch (error) {
      logger.logError('Error fetching Jira statistics for user', error);
      res.status(500).json({
        message: 'Failed to fetch Jira statistics',
      });
    }
  }
);

// GET /api/jira-statistics/monthly-trends/:userId
// Get monthly trends for Jira statistics over the last year
router.get(
  '/monthly-trends/:userId',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const currentUserId = (req as any).user.id;
      logger.logInfo(`Fetching quarterly trends for user ${userId}`);

      // Check access control
      const currentUser = await prisma.user.findUnique({
        where: { id: currentUserId },
        select: { role: true },
      });

      if (!currentUser) {
        return res.status(404).json({
          message: 'Current user not found',
        });
      }

      // User can always view their own trends
      if (currentUserId !== userId) {
        if (currentUser.role !== 'ADMIN' && currentUser.role !== 'MANAGER') {
          return res.status(403).json({
            message: 'Insufficient permissions to view user trends',
          });
        }

        // For managers, verify they have access to this user
        if (currentUser.role === 'MANAGER') {
          const hasAccess = await checkUserAccess(
            currentUserId,
            currentUser.role,
            userId
          );
          if (!hasAccess) {
            return res.status(403).json({
              message: 'Access denied. You can only view trends for your direct or indirect reports.',
            });
          }
        }
      }

      // Get the last 5 completed quarters
      const quarters = [];
      const currentDate = new Date();

      // Calculate the last completed quarter
      const currentMonth = currentDate.getMonth(); // 0-11
      const currentQuarter = Math.floor(currentMonth / 3) + 1; // 1-4
      const currentYear = currentDate.getFullYear();

      // Start from the last completed quarter and go back 4 more quarters
      for (let i = 4; i >= 0; i--) {
        // Calculate which quarter we're looking at (going backwards from last completed)
        let targetQuarter = currentQuarter - 1 - i; // Start from last completed quarter
        let targetYear = currentYear;

        // Handle year rollover when going back
        while (targetQuarter <= 0) {
          targetQuarter += 4;
          targetYear -= 1;
        }

        const quarterStartMonth = (targetQuarter - 1) * 3;
        const quarterStartDate = new Date(targetYear, quarterStartMonth, 1);
        const quarterEndDate = new Date(
          targetYear,
          quarterStartMonth + 3,
          0,
          23,
          59,
          59,
          999
        );

        // Only include quarters that have ended (quarter end date is before current date)
        if (quarterEndDate < currentDate) {
          quarters.push({
            quarter: targetQuarter,
            year: targetYear,
            quarterName: `Q${targetQuarter} ${targetYear}`,
            startDate: quarterStartDate,
            endDate: quarterEndDate,
          });
        }
      }

      // Get user details to match by name as well
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true, email: true },
      });

      if (!targetUser) {
        return res.status(404).json({
          message: 'Resource not found',
        });
      }

      const quarterlyData = [];

      for (const quarterInfo of quarters) {
        // Get tickets completed in this quarter
        // First try direct name matching, then check mapping table
        const directNameMatch = `${targetUser.firstName} ${targetUser.lastName}`;

        // Get mapped Jira usernames for this user
        const userMappings = await prisma.jiraUserMapping.findMany({
          where: { userId: userId },
          select: { jiraUsername: true },
        });
        const mappedUsernames = userMappings.map(m => m.jiraUsername);

        // Build where clause to match either direct name or mapped usernames
        const quarterWhereClause: any = {
          OR: [
            {
              assignee: {
                equals: directNameMatch,
                mode: 'insensitive',
              },
            },
            ...(mappedUsernames.length > 0
              ? [
                  {
                    assignee: {
                      in: mappedUsernames,
                      mode: 'insensitive',
                    },
                  },
                ]
              : []),
          ],
        };

        const quarterTickets = await prisma.jiraTicket.findMany({
          where: {
            ...quarterWhereClause,
            endDate: {
              gte: quarterInfo.startDate,
              lte: quarterInfo.endDate,
            },
          },
        });

        if (quarterTickets.length === 0) {
          quarterlyData.push({
            quarter: quarterInfo.quarterName,
            refinement: 0,
            waiting: 0,
            inProgress: 0,
            blocked: 0,
            review: 0,
            resolution: 0,
            promotion: 0,
            resolvedTickets: 0,
          });
          continue;
        }

        // Calculate averages for this quarter
        const totalTickets = quarterTickets.length;

        const totalRefinementTime = quarterTickets.reduce(
          (sum, ticket) => sum + (ticket.refinementTime || 0),
          0
        );
        const totalWaitingTime = quarterTickets.reduce(
          (sum, ticket) => sum + (ticket.readyForDevelopmentTime || 0),
          0
        );
        const totalInProgressTime = quarterTickets.reduce(
          (sum, ticket) => sum + (ticket.inProgressTime || 0),
          0
        );
        const totalBlockedTime = quarterTickets.reduce(
          (sum, ticket) => sum + (ticket.blockedTime || 0),
          0
        );
        const totalReviewTime = quarterTickets.reduce(
          (sum, ticket) => sum + (ticket.reviewTime || 0),
          0
        );
        const totalResolutionTime = quarterTickets.reduce((sum, ticket) => {
          if (ticket.createDate && ticket.endDate) {
            return (
              sum +
              (ticket.endDate.getTime() - ticket.createDate.getTime()) / 1000
            );
          }
          return sum;
        }, 0);
        const totalPromotionTime = quarterTickets.reduce(
          (sum, ticket) => sum + (ticket.promotionTime || 0),
          0
        );

        quarterlyData.push({
          quarter: quarterInfo.quarterName,
          refinement: totalRefinementTime / totalTickets,
          waiting: totalWaitingTime / totalTickets,
          inProgress: totalInProgressTime / totalTickets,
          blocked: totalBlockedTime / totalTickets,
          review: totalReviewTime / totalTickets,
          resolution: totalResolutionTime / totalTickets,
          promotion: totalPromotionTime / totalTickets,
          resolvedTickets: totalTickets,
        });
      }

      logger.logInfo(
        `Generated quarterly trends for user ${userId} with ${quarterlyData.length} quarters`
      );
      res.json(quarterlyData);
    } catch (error) {
      logger.logError('Error fetching quarterly trends', error);
      res.status(500).json({
        message: 'Failed to fetch quarterly trends',
      });
    }
  }
);

// GET /api/jira-statistics/team-averages/:userId
// Get team average statistics for a user's teams
router.get(
  '/team-averages/:userId',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      logger.logInfo(`Fetching team averages for user ${userId}`);

      // Get user's teams
      const userTeams = await prisma.userTeam.findMany({
        where: {
          userId: userId,
          isActive: true,
        },
        include: {
          team: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (userTeams.length === 0) {
        return res.json({
          teamAverages: [],
          message: 'User is not part of any active teams',
        });
      }

      const teamAverages = [];

      for (const userTeam of userTeams) {
        // Get all team members
        const teamMembers = await prisma.userTeam.findMany({
          where: {
            teamId: userTeam.teamId,
            isActive: true,
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

        const memberNames = teamMembers.map(
          member => `${member.user.firstName} ${member.user.lastName}`
        );
        const memberIds = teamMembers.map(member => member.user.id);

        // Get mapped Jira usernames for all team members
        const teamMappings = await prisma.jiraUserMapping.findMany({
          where: { userId: { in: memberIds } },
          select: { jiraUsername: true },
        });
        const mappedUsernames = teamMappings.map(m => m.jiraUsername);

        // Get all tickets for team members
        // Look for tickets where assignee name matches team member names or mapped usernames
        const teamTickets = await prisma.jiraTicket.findMany({
          where: {
            OR: [
              {
                assignee: {
                  in: memberNames,
                  mode: 'insensitive',
                },
              },
              ...(mappedUsernames.length > 0
                ? [
                    {
                      assignee: {
                        in: mappedUsernames,
                        mode: 'insensitive' as const,
                      },
                    },
                  ]
                : []),
            ],
          },
        });

        if (teamTickets.length === 0) {
          teamAverages.push({
            teamId: userTeam.team.id,
            teamName: userTeam.team.name,
            memberCount: teamMembers.length,
            averages: {
              refinement: 0,
              waiting: 0,
              inProgress: 0,
              blocked: 0,
              review: 0,
              resolution: 0,
              promotion: 0,
              resolvedTickets: 0,
            },
          });
          continue;
        }

        // Calculate team averages
        const totalTickets = teamTickets.length;
        const completedTickets = teamTickets.filter(
          ticket => ticket.endDate !== null
        ).length;

        const totalRefinementTime = teamTickets.reduce(
          (sum, ticket) => sum + (ticket.refinementTime || 0),
          0
        );
        const totalWaitingTime = teamTickets.reduce(
          (sum, ticket) => sum + (ticket.readyForDevelopmentTime || 0),
          0
        );
        const totalInProgressTime = teamTickets.reduce(
          (sum, ticket) => sum + (ticket.inProgressTime || 0),
          0
        );
        const totalBlockedTime = teamTickets.reduce(
          (sum, ticket) => sum + (ticket.blockedTime || 0),
          0
        );
        const totalReviewTime = teamTickets.reduce(
          (sum, ticket) => sum + (ticket.reviewTime || 0),
          0
        );
        const totalResolutionTime = teamTickets.reduce((sum, ticket) => {
          if (ticket.createDate && ticket.endDate) {
            return (
              sum +
              (ticket.endDate.getTime() - ticket.createDate.getTime()) / 1000
            );
          }
          return sum;
        }, 0);
        const totalPromotionTime = teamTickets.reduce(
          (sum, ticket) => sum + (ticket.promotionTime || 0),
          0
        );

        const averages = {
          refinement:
            totalTickets > 0
              ? Math.round(totalRefinementTime / totalTickets)
              : 0,
          waiting:
            totalTickets > 0 ? Math.round(totalWaitingTime / totalTickets) : 0,
          inProgress:
            totalTickets > 0
              ? Math.round(totalInProgressTime / totalTickets)
              : 0,
          blocked:
            totalTickets > 0 ? Math.round(totalBlockedTime / totalTickets) : 0,
          review:
            totalTickets > 0 ? Math.round(totalReviewTime / totalTickets) : 0,
          resolution:
            totalTickets > 0
              ? Math.round(totalResolutionTime / totalTickets)
              : 0,
          promotion:
            totalTickets > 0
              ? Math.round(totalPromotionTime / totalTickets)
              : 0,
          resolvedTickets:
            totalTickets > 0
              ? Math.round((completedTickets / totalTickets) * 100)
              : 0,
        };

        teamAverages.push({
          teamId: userTeam.team.id,
          teamName: userTeam.team.name,
          memberCount: teamMembers.length,
          averages,
        });
      }

      logger.logInfo(`Found team averages for ${teamAverages.length} teams`);
      res.json({ teamAverages });
    } catch (error) {
      logger.logError('Error fetching team averages', error);
      res.status(500).json({
        message: 'Failed to fetch team averages',
      });
    }
  }
);

// GET /api/jira-statistics/team-statistics/:teamId
// Get comprehensive Jira statistics for a specific team
router.get(
  '/team-statistics/:teamId',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const teamId = req.params.teamId;
      const { startDate, endDate } = req.query;
      logger.logInfo(
        `Fetching Jira statistics for team ${teamId} with date range: ${startDate} to ${endDate}`
      );

      // Get team information
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        select: { id: true, name: true },
      });

      if (!team) {
        return res.status(404).json({
          message: 'Team not found',
        });
      }

      // Get all team members
      const teamMembers = await prisma.userTeam.findMany({
        where: {
          teamId: teamId,
          isActive: true,
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

      if (teamMembers.length === 0) {
        return res.json({
          totalTickets: 0,
          completedTickets: 0,
          inProgressTickets: 0,
          averageTicketResolutionTime: 0,
          totalTimeSpent: 0,
          ticketsByPriority: {
            high: 0,
            medium: 0,
            low: 0,
          },
          ticketsByStatus: {
            inProgress: 0,
            blocked: 0,
            review: 0,
            refinement: 0,
            readyForDevelopment: 0,
            promotion: 0,
          },
          recentTickets: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalTickets: 0,
            limit: 50,
          },
          teamInfo: {
            teamId: teamId,
            memberCount: 0,
            memberNames: [],
          },
        });
      }

      // Get team member names and IDs for filtering
      const memberNames = teamMembers.map(
        member => `${member.user.firstName} ${member.user.lastName}`
      );
      const memberIds = teamMembers.map(member => member.user.id);

      // Filter by selected members if memberIds query parameter is provided
      const requestedMemberIds = req.query.memberIds;
      let filteredMemberIds = memberIds;
      let filteredMemberNames = memberNames;
      if (requestedMemberIds) {
        const requestedIds = Array.isArray(requestedMemberIds)
          ? requestedMemberIds
          : [requestedMemberIds];
        filteredMemberIds = memberIds.filter(id => requestedIds.includes(id));
        filteredMemberNames = teamMembers
          .filter(member => requestedIds.includes(member.user.id))
          .map(member => `${member.user.firstName} ${member.user.lastName}`);
      }

      // Get mapped Jira usernames for all team members
      const teamMappings = await prisma.jiraUserMapping.findMany({
        where: { userId: { in: filteredMemberIds } },
        select: { jiraUsername: true },
      });
      const mappedUsernames = teamMappings.map(m => m.jiraUsername);

      // Build where clause for date filtering
      // Look for tickets where assignee name matches team member names or mapped usernames
      const whereClause: any = {
        OR: [
          {
            assignee: {
              in: filteredMemberNames,
              mode: 'insensitive',
            },
          },
          ...(mappedUsernames.length > 0
            ? [
                {
                  assignee: {
                    in: mappedUsernames,
                    mode: 'insensitive',
                  },
                },
              ]
            : []),
        ],
      };

      // Add date range filtering if provided
      if (startDate || endDate) {
        whereClause.endDate = {};
        if (startDate) {
          whereClause.endDate.gte = new Date(startDate as string);
        }
        if (endDate) {
          whereClause.endDate.lte = new Date(endDate as string);
        }
      }

      // Get all tickets for team members
      const teamTickets = await prisma.jiraTicket.findMany({
        where: whereClause,
        orderBy: {
          createDate: 'desc',
        },
      });

      if (teamTickets.length === 0) {
        return res.json({
          totalTickets: 0,
          completedTickets: 0,
          inProgressTickets: 0,
          averageTicketResolutionTime: 0,
          totalTimeSpent: 0,
          ticketsByPriority: {
            high: 0,
            medium: 0,
            low: 0,
          },
          ticketsByStatus: {
            inProgress: 0,
            blocked: 0,
            review: 0,
            refinement: 0,
            readyForDevelopment: 0,
            promotion: 0,
          },
          recentTickets: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalTickets: 0,
            limit: 50,
          },
          teamInfo: {
            teamId: teamId,
            teamName: team.name,
            memberCount: teamMembers.length,
            memberNames: teamMembers.map(member => ({
              id: member.user.id,
              name: `${member.user.firstName} ${member.user.lastName}`,
              email: member.user.email,
            })),
          },
        });
      }

      // Calculate team statistics (same logic as individual user statistics)
      const totalTickets = teamTickets.length;
      const completedTickets = teamTickets.filter(
        ticket => ticket.endDate !== null
      ).length;
      const inProgressTickets = teamTickets.filter(
        ticket => ticket.endDate === null
      ).length;

      // Calculate average ticket resolution time
      const completedTicketsWithTime = teamTickets.filter(
        ticket => ticket.endDate && ticket.createDate
      );

      let averageTicketResolutionTime = 0;
      if (completedTicketsWithTime.length > 0) {
        const totalResolutionTime = completedTicketsWithTime.reduce(
          (sum, ticket) => {
            if (ticket.createDate && ticket.endDate) {
              return (
                sum +
                (ticket.endDate.getTime() - ticket.createDate.getTime()) / 1000
              );
            }
            return sum;
          },
          0
        );
        averageTicketResolutionTime = Math.round(
          totalResolutionTime / completedTicketsWithTime.length
        );
      }

      // Calculate total time spent (sum of all time fields)
      const totalTimeSpent = teamTickets.reduce(
        (sum, ticket) =>
          sum +
          (ticket.inProgressTime || 0) +
          (ticket.blockedTime || 0) +
          (ticket.reviewTime || 0) +
          (ticket.promotionTime || 0) +
          (ticket.refinementTime || 0) +
          (ticket.readyForDevelopmentTime || 0),
        0
      );

      // Calculate tickets by priority
      const ticketsByPriority = {
        high: teamTickets.filter(ticket => ticket.priority === 'High').length,
        medium: teamTickets.filter(ticket => ticket.priority === 'Medium')
          .length,
        low: teamTickets.filter(ticket => ticket.priority === 'Low').length,
      };

      // Calculate time spent in each status
      const totalInProgressTime = teamTickets.reduce(
        (sum, ticket) => sum + (ticket.inProgressTime || 0),
        0
      );
      const totalBlockedTime = teamTickets.reduce(
        (sum, ticket) => sum + (ticket.blockedTime || 0),
        0
      );
      const totalReviewTime = teamTickets.reduce(
        (sum, ticket) => sum + (ticket.reviewTime || 0),
        0
      );
      const totalRefinementTime = teamTickets.reduce(
        (sum, ticket) => sum + (ticket.refinementTime || 0),
        0
      );
      const totalReadyForDevelopmentTime = teamTickets.reduce(
        (sum, ticket) => sum + (ticket.readyForDevelopmentTime || 0),
        0
      );
      const totalPromotionTime = teamTickets.reduce(
        (sum, ticket) => sum + (ticket.promotionTime || 0),
        0
      );

      // Calculate average time spent in each status
      const ticketsByStatus = {
        inProgress:
          totalTickets > 0 ? Math.round(totalInProgressTime / totalTickets) : 0,
        blocked:
          totalTickets > 0 ? Math.round(totalBlockedTime / totalTickets) : 0,
        review:
          totalTickets > 0 ? Math.round(totalReviewTime / totalTickets) : 0,
        refinement:
          totalTickets > 0 ? Math.round(totalRefinementTime / totalTickets) : 0,
        readyForDevelopment:
          totalTickets > 0
            ? Math.round(totalReadyForDevelopmentTime / totalTickets)
            : 0,
        promotion:
          totalTickets > 0 ? Math.round(totalPromotionTime / totalTickets) : 0,
      };

      // Get paginated recent tickets
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      const totalTicketsCount = teamTickets.length;
      const paginatedTickets = teamTickets
        .slice(offset, offset + limit)
        .map(ticket => ({
          jiraId: ticket.jiraId,
          title: ticket.title,
          priority: ticket.priority,
          status: 'Completed', // Since we're only showing completed tickets in trends
          createDate: ticket.createDate?.toISOString() || '',
          endDate: ticket.endDate?.toISOString() || null,
          originalEstimate: ticket.originalEstimate || 0,
          refinementTime: ticket.refinementTime || 0,
          readyForDevelopmentTime: ticket.readyForDevelopmentTime || 0,
          inProgressTime: ticket.inProgressTime || 0,
          blockedTime: ticket.blockedTime || 0,
          reviewTime: ticket.reviewTime || 0,
          promotionTime: ticket.promotionTime || 0,
          assignee: ticket.assignee || null,
        }));

      const statistics = {
        totalTickets,
        completedTickets,
        inProgressTickets,
        averageTicketResolutionTime,
        totalTimeSpent,
        ticketsByPriority,
        ticketsByStatus,
        recentTickets: paginatedTickets,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalTicketsCount / limit),
          totalTickets: totalTicketsCount,
          limit,
        },
        teamInfo: {
          teamId: teamId,
          teamName: team.name,
          memberCount: teamMembers.length,
          memberNames: teamMembers.map(member => ({
            id: member.user.id,
            name: `${member.user.firstName} ${member.user.lastName}`,
            email: member.user.email,
          })),
        },
      };

      logger.logInfo(`Found ${totalTickets} tickets for team ${teamId}`);
      res.json(statistics);
    } catch (error) {
      logger.logError('Error fetching team Jira statistics', error);
      res.status(500).json({
        message: 'Failed to fetch team Jira statistics',
      });
    }
  }
);

// GET /api/jira-statistics/monthly-trends-data/:userId
// Get monthly trends for Jira statistics over the last 5 months
router.get(
  '/monthly-trends-data/:userId',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const currentUserId = (req as any).user.id;
      logger.logInfo(`Fetching monthly trends for user ${userId}`);

      // Check access control
      const currentUser = await prisma.user.findUnique({
        where: { id: currentUserId },
        select: { role: true },
      });

      if (!currentUser) {
        return res.status(404).json({
          message: 'Current user not found',
        });
      }

      // User can always view their own trends
      if (currentUserId !== userId) {
        if (currentUser.role !== 'ADMIN' && currentUser.role !== 'MANAGER') {
          return res.status(403).json({
            message: 'Insufficient permissions to view user trends',
          });
        }

        // For managers, verify they have access to this user
        if (currentUser.role === 'MANAGER') {
          const hasAccess = await checkUserAccess(
            currentUserId,
            currentUser.role,
            userId
          );
          if (!hasAccess) {
            return res.status(403).json({
              message: 'Access denied. You can only view trends for your direct or indirect reports.',
            });
          }
        }
      }

      // Get the last 5 completed months
      const months = [];
      const currentDate = new Date();

      // Start from the previous month (not current month) and go back 4 more months
      for (let i = 4; i >= 0; i--) {
        const targetDate = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() - i - 1,
          1
        );
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth();

        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

        const monthNames = [
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December',
        ];

        months.push({
          month: month,
          year: year,
          monthName: `${monthNames[month]} ${year}`,
          startDate: startDate,
          endDate: endDate,
        });
      }

      // Get user details to match by name as well
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true, email: true },
      });

      if (!targetUser) {
        return res.status(404).json({
          message: 'Resource not found',
        });
      }

      const monthlyData = [];

      for (const monthInfo of months) {
        // Get tickets completed in this month
        // First try direct name matching, then check mapping table
        const directNameMatch = `${targetUser.firstName} ${targetUser.lastName}`;

        // Get mapped Jira usernames for this user
        const userMappings = await prisma.jiraUserMapping.findMany({
          where: { userId: userId },
          select: { jiraUsername: true },
        });
        const mappedUsernames = userMappings.map(m => m.jiraUsername);

        // Build where clause to match either direct name or mapped usernames
        const monthWhereClause: any = {
          OR: [
            {
              assignee: {
                equals: directNameMatch,
                mode: 'insensitive',
              },
            },
            ...(mappedUsernames.length > 0
              ? [
                  {
                    assignee: {
                      in: mappedUsernames,
                      mode: 'insensitive',
                    },
                  },
                ]
              : []),
          ],
        };

        const monthTickets = await prisma.jiraTicket.findMany({
          where: {
            ...monthWhereClause,
            endDate: {
              gte: monthInfo.startDate,
              lte: monthInfo.endDate,
            },
          },
        });

        if (monthTickets.length === 0) {
          monthlyData.push({
            quarter: monthInfo.monthName,
            refinement: 0,
            waiting: 0,
            inProgress: 0,
            blocked: 0,
            review: 0,
            resolution: 0,
            promotion: 0,
            resolvedTickets: 0,
          });
          continue;
        }

        // Calculate averages for this month
        const totalTickets = monthTickets.length;

        const totalRefinementTime = monthTickets.reduce(
          (sum, ticket) => sum + (ticket.refinementTime || 0),
          0
        );
        const totalWaitingTime = monthTickets.reduce(
          (sum, ticket) => sum + (ticket.readyForDevelopmentTime || 0),
          0
        );
        const totalInProgressTime = monthTickets.reduce(
          (sum, ticket) => sum + (ticket.inProgressTime || 0),
          0
        );
        const totalBlockedTime = monthTickets.reduce(
          (sum, ticket) => sum + (ticket.blockedTime || 0),
          0
        );
        const totalReviewTime = monthTickets.reduce(
          (sum, ticket) => sum + (ticket.reviewTime || 0),
          0
        );
        const totalResolutionTime = monthTickets.reduce((sum, ticket) => {
          if (ticket.endDate && ticket.createDate) {
            const resolutionTime =
              new Date(ticket.endDate).getTime() -
              new Date(ticket.createDate).getTime();
            return sum + resolutionTime;
          }
          return sum;
        }, 0);
        const totalPromotionTime = monthTickets.reduce(
          (sum, ticket) => sum + (ticket.promotionTime || 0),
          0
        );

        monthlyData.push({
          quarter: monthInfo.monthName,
          refinement: totalRefinementTime / totalTickets,
          waiting: totalWaitingTime / totalTickets,
          inProgress: totalInProgressTime / totalTickets,
          blocked: totalBlockedTime / totalTickets,
          review: totalReviewTime / totalTickets,
          resolution: totalResolutionTime / totalTickets,
          promotion: totalPromotionTime / totalTickets,
          resolvedTickets: totalTickets,
        });
      }

      logger.logInfo(
        `Generated monthly trends for user ${userId} with ${monthlyData.length} months`
      );
      res.json(monthlyData);
    } catch (error) {
      logger.logError('Error fetching monthly trends', error);
      res.status(500).json({
        message: 'Failed to fetch monthly trends',
      });
    }
  }
);

// GET /api/jira-statistics/team-monthly-trends/:teamId
// Get monthly trends for team Jira statistics over the last year
router.get(
  '/team-monthly-trends/:teamId',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const teamId = req.params.teamId;
      logger.logInfo(`Fetching monthly trends for team ${teamId}`);

      // Get all team members
      const teamMembers = await prisma.userTeam.findMany({
        where: {
          teamId: teamId,
          isActive: true,
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

      if (teamMembers.length === 0) {
        return res.json([]);
      }

      const memberNames = teamMembers.map(
        member => `${member.user.firstName} ${member.user.lastName}`
      );
      const memberIds = teamMembers.map(member => member.user.id);

      // Generate quarters for the last 5 complete quarters (exclude current quarter)
      const quarters = [];
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const currentQuarter = Math.floor(currentMonth / 3);

      // Start from the previous quarter (not current quarter)
      for (let i = 5; i >= 1; i--) {
        let quarter = currentQuarter - i;
        let year = currentYear;

        if (quarter < 0) {
          quarter = 4 + quarter; // Convert to previous year's quarter
          year = currentYear - 1;
        }

        const quarterStartMonth = quarter * 3;
        const startDate = new Date(year, quarterStartMonth, 1);
        const endDate = new Date(year, quarterStartMonth + 3, 0);

        const quarterNames = ['Q1', 'Q2', 'Q3', 'Q4'];
        quarters.push({
          quarterName: `${year} ${quarterNames[quarter]}`,
          startDate,
          endDate,
        });
      }

      const quarterlyData = [];

      for (const quarterInfo of quarters) {
        // Get tickets completed in this quarter for team members
        // Get mapped Jira usernames for all team members
        const teamMappings = await prisma.jiraUserMapping.findMany({
          where: { userId: { in: memberIds } },
          select: { jiraUsername: true },
        });
        const mappedUsernames = teamMappings.map(m => m.jiraUsername);

        // Look for tickets where assignee name matches team member names or mapped usernames
        const quarterTickets = await prisma.jiraTicket.findMany({
          where: {
            OR: [
              {
                assignee: {
                  in: memberNames,
                  mode: 'insensitive',
                },
              },
              ...(mappedUsernames.length > 0
                ? [
                    {
                      assignee: {
                        in: mappedUsernames,
                        mode: 'insensitive' as const,
                      },
                    },
                  ]
                : []),
            ],
            endDate: {
              gte: quarterInfo.startDate,
              lte: quarterInfo.endDate,
            },
          },
        });

        if (quarterTickets.length === 0) {
          quarterlyData.push({
            quarter: quarterInfo.quarterName,
            refinement: 0,
            waiting: 0,
            inProgress: 0,
            blocked: 0,
            review: 0,
            resolution: 0,
            promotion: 0,
            resolvedTickets: 0,
          });
          continue;
        }

        // Calculate averages for this quarter
        const totalTickets = quarterTickets.length;

        const totalRefinementTime = quarterTickets.reduce(
          (sum, ticket) => sum + (ticket.refinementTime || 0),
          0
        );
        const totalWaitingTime = quarterTickets.reduce(
          (sum, ticket) => sum + (ticket.readyForDevelopmentTime || 0),
          0
        );
        const totalInProgressTime = quarterTickets.reduce(
          (sum, ticket) => sum + (ticket.inProgressTime || 0),
          0
        );
        const totalBlockedTime = quarterTickets.reduce(
          (sum, ticket) => sum + (ticket.blockedTime || 0),
          0
        );
        const totalReviewTime = quarterTickets.reduce(
          (sum, ticket) => sum + (ticket.reviewTime || 0),
          0
        );
        const totalResolutionTime = quarterTickets.reduce((sum, ticket) => {
          if (ticket.createDate && ticket.endDate) {
            return (
              sum +
              (ticket.endDate.getTime() - ticket.createDate.getTime()) / 1000
            );
          }
          return sum;
        }, 0);
        const totalPromotionTime = quarterTickets.reduce(
          (sum, ticket) => sum + (ticket.promotionTime || 0),
          0
        );

        quarterlyData.push({
          quarter: quarterInfo.quarterName,
          refinement:
            totalTickets > 0
              ? Math.round(totalRefinementTime / totalTickets)
              : 0,
          waiting:
            totalTickets > 0 ? Math.round(totalWaitingTime / totalTickets) : 0,
          inProgress:
            totalTickets > 0
              ? Math.round(totalInProgressTime / totalTickets)
              : 0,
          blocked:
            totalTickets > 0 ? Math.round(totalBlockedTime / totalTickets) : 0,
          review:
            totalTickets > 0 ? Math.round(totalReviewTime / totalTickets) : 0,
          resolution:
            totalTickets > 0
              ? Math.round(totalResolutionTime / totalTickets)
              : 0,
          promotion:
            totalTickets > 0
              ? Math.round(totalPromotionTime / totalTickets)
              : 0,
          resolvedTickets: totalTickets,
        });
      }

      logger.logInfo(`Generated quarterly trends for team ${teamId}`);
      res.json(quarterlyData);
    } catch (error) {
      logger.logError('Error fetching team monthly trends', error);
      res.status(500).json({
        message: 'Failed to fetch team monthly trends',
      });
    }
  }
);

export default router;
