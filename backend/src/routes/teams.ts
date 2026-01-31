/**
 * @fileoverview Team management routes
 *
 * This module handles team-related endpoints including team creation,
 * team retrieval, user-team assignments, and team updates.
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
 * Express router instance for team routes
 */
const router = Router();

/**
 * Prisma client instance for database operations
 */
const prisma = new PrismaClient();

/**
 * Get all teams
 *
 * Retrieves a list of all active teams in the system.
 *
 * @route GET /teams
 * @auth Requires valid JWT token
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 *
 * @returns {Object} 200 - Array of team data
 * @returns {Object} 500 - Internal server error
 *
 * @example
 * // Response
 * [
 *   {
 *     "id": "clx1234567890",
 *     "name": "Engineering",
 *     "description": "Software development team",
 *     "isActive": true,
 *     "createdAt": "2024-01-01T00:00:00Z",
 *     "userTeams": [
 *       {
 *         "id": "clx0987654321",
 *         "joinedAt": "2024-01-15T10:30:00Z",
 *         "isActive": true,
 *         "user": {
 *           "id": "clx1111111111",
 *           "firstName": "John",
 *           "lastName": "Doe",
 *           "email": "john@example.com"
 *         }
 *       }
 *     ]
 *   }
 * ]
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    logger.logDebug('Fetching all teams', undefined, 'GET', '/teams');

    const teams = await prisma.team.findMany({
      where: { isActive: true },
      include: {
        userTeams: {
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

    res.json(teams);
  } catch (error) {
    logger.logError('Error fetching teams', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Get team by ID
 *
 * Retrieves detailed information about a specific team by its ID.
 *
 * @route GET /teams/:id
 * @auth Requires valid JWT token
 *
 * @param {string} req.params.id - Team ID to retrieve
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 *
 * @returns {Object} 200 - Team data with members
 * @returns {Object} 404 - Team not found
 * @returns {Object} 500 - Internal server error
 */
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    logger.logDebug('Fetching team by ID', id, 'GET', `/teams/${id}`);

    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        userTeams: {
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

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    logger.logInfo('Team found', undefined, 'GET', `/teams/${id}`);
    res.json(team);
  } catch (error) {
    logger.logError('Error fetching team', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Create new team
 *
 * Creates a new team in the system.
 * Only administrators can perform this operation.
 *
 * @route POST /teams
 * @auth Requires valid JWT token and ADMIN role
 *
 * @param {Object} req.body - Request body containing team data
 * @param {string} req.body.name - Team name
 * @param {string} [req.body.description] - Team description
 *
 * @returns {Object} 201 - Team created successfully
 * @returns {Object} 400 - Validation errors
 * @returns {Object} 403 - Forbidden (not admin)
 * @returns {Object} 409 - Team name already exists
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
      .withMessage('Team name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Team name must be between 2 and 100 characters'),
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

      // Check if team name already exists
      const existingTeam = await prisma.team.findUnique({
        where: { name },
      });

      if (existingTeam) {
        return res.status(409).json({ message: 'Team name already exists' });
      }

      const team = await prisma.team.create({
        data: {
          name,
          description,
        },
      });

      logger.logInfo('Team created', team.id, 'POST', '/teams');
      res.status(201).json(team);
    } catch (error) {
      logger.logError('Error creating team', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

/**
 * Update team
 *
 * Updates an existing team's information.
 * Only administrators can perform this operation.
 *
 * @route PUT /teams/:id
 * @auth Requires valid JWT token and ADMIN role
 *
 * @param {string} req.params.id - Team ID to update
 * @param {Object} req.body - Request body containing team updates
 * @param {string} [req.body.name] - New team name
 * @param {string} [req.body.description] - New team description
 *
 * @returns {Object} 200 - Team updated successfully
 * @returns {Object} 400 - Validation errors
 * @returns {Object} 403 - Forbidden (not admin)
 * @returns {Object} 404 - Team not found
 * @returns {Object} 409 - Team name already exists
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
      .withMessage('Team name cannot be empty')
      .isLength({ min: 2, max: 100 })
      .withMessage('Team name must be between 2 and 100 characters'),
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

      // Check if team exists
      const existingTeam = await prisma.team.findUnique({
        where: { id },
      });

      if (!existingTeam) {
        return res.status(404).json({ message: 'Team not found' });
      }

      // If name is being updated, check for conflicts
      if (name && name !== existingTeam.name) {
        const nameConflict = await prisma.team.findUnique({
          where: { name },
        });

        if (nameConflict) {
          return res.status(409).json({ message: 'Team name already exists' });
        }
      }

      const updatedTeam = await prisma.team.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
        },
      });

      logger.logInfo('Team updated', id, 'PUT', `/teams/${id}`);
      res.json(updatedTeam);
    } catch (error) {
      logger.logError('Error updating team', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

/**
 * Add user to team
 *
 * Adds a user to a team by creating a UserTeam relationship.
 * Only administrators can perform this operation.
 *
 * @route POST /teams/:id/members
 * @auth Requires valid JWT token and ADMIN role
 *
 * @param {string} req.params.id - Team ID
 * @param {Object} req.body - Request body containing user ID
 * @param {string} req.body.userId - User ID to add to team
 *
 * @returns {Object} 201 - User added to team successfully
 * @returns {Object} 400 - Validation errors
 * @returns {Object} 403 - Forbidden (not admin)
 * @returns {Object} 404 - Team or user not found
 * @returns {Object} 409 - User already in team
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

      const { id: teamId } = req.params;
      const { userId } = req.body;

      // Check if team exists
      const team = await prisma.team.findUnique({
        where: { id: teamId },
      });

      if (!team) {
        return res.status(404).json({ message: 'Team not found' });
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ message: 'Resource not found' });
      }

      // Check if user is already in team
      const existingUserTeam = await prisma.userTeam.findUnique({
        where: {
          userId_teamId: {
            userId,
            teamId,
          },
        },
      });

      if (existingUserTeam) {
        if (existingUserTeam.isActive) {
          return res
            .status(409)
            .json({ message: 'User is already in this team' });
        } else {
          // Reactivate the relationship
          const reactivatedUserTeam = await prisma.userTeam.update({
            where: {
              userId_teamId: {
                userId,
                teamId,
              },
            },
            data: {
              isActive: true,
              joinedAt: new Date(),
            },
          });

          logger.logInfo(
            'User reactivated in team',
            userId,
            'POST',
            `/teams/${teamId}/members`
          );
          return res.status(201).json(reactivatedUserTeam);
        }
      }

      // Create new user-team relationship
      const userTeam = await prisma.userTeam.create({
        data: {
          userId,
          teamId,
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
          team: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      logger.logInfo(
        'User added to team',
        userId,
        'POST',
        `/teams/${teamId}/members`
      );
      res.status(201).json(userTeam);
    } catch (error) {
      logger.logError('Error adding user to team', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

/**
 * Remove user from team
 *
 * Removes a user from a team by deactivating the UserTeam relationship.
 * Only administrators can perform this operation.
 *
 * @route DELETE /teams/:id/members/:userId
 * @auth Requires valid JWT token and ADMIN role
 *
 * @param {string} req.params.id - Team ID
 * @param {string} req.params.userId - User ID to remove from team
 *
 * @returns {Object} 200 - User removed from team successfully
 * @returns {Object} 403 - Forbidden (not admin)
 * @returns {Object} 404 - Team or user not found
 * @returns {Object} 500 - Internal server error
 */
router.delete(
  '/:id/members/:userId',
  authenticateToken,
  requireRole(['ADMIN']),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id: teamId, userId } = req.params;

      // Check if team exists
      const team = await prisma.team.findUnique({
        where: { id: teamId },
      });

      if (!team) {
        return res.status(404).json({ message: 'Team not found' });
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ message: 'Resource not found' });
      }

      // Find and deactivate the user-team relationship
      const userTeam = await prisma.userTeam.findUnique({
        where: {
          userId_teamId: {
            userId,
            teamId,
          },
        },
      });

      if (!userTeam) {
        return res.status(404).json({ message: 'User is not in this team' });
      }

      if (!userTeam.isActive) {
        return res
          .status(400)
          .json({ message: 'User is already not active in this team' });
      }

      await prisma.userTeam.update({
        where: {
          userId_teamId: {
            userId,
            teamId,
          },
        },
        data: {
          isActive: false,
        },
      });

      logger.logInfo(
        'User removed from team',
        userId,
        'DELETE',
        `/teams/${teamId}/members/${userId}`
      );
      res.json({ message: 'User removed from team successfully' });
    } catch (error) {
      logger.logError('Error removing user from team', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

/**
 * Delete team
 *
 * Soft deletes a team by setting isActive to false.
 * Only administrators can perform this operation.
 *
 * @route DELETE /teams/:id
 * @auth Requires valid JWT token and ADMIN role
 *
 * @param {string} req.params.id - Team ID to delete
 *
 * @returns {Object} 200 - Team deleted successfully
 * @returns {Object} 403 - Forbidden (not admin)
 * @returns {Object} 404 - Team not found
 * @returns {Object} 500 - Internal server error
 */
router.delete(
  '/:id',
  authenticateToken,
  requireRole(['ADMIN']),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      // Check if team exists
      const team = await prisma.team.findUnique({
        where: { id },
      });

      if (!team) {
        return res.status(404).json({ message: 'Team not found' });
      }

      // Soft delete the team
      await prisma.team.update({
        where: { id },
        data: {
          isActive: false,
        },
      });

      // Also deactivate all user-team relationships
      await prisma.userTeam.updateMany({
        where: { teamId: id },
        data: {
          isActive: false,
        },
      });

      logger.logInfo('Team deleted', id, 'DELETE', `/teams/${id}`);
      res.json({ message: 'Team deleted successfully' });
    } catch (error) {
      logger.logError('Error deleting team', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

export { router as teamRoutes };
