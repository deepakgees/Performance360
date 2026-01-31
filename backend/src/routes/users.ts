/**
 * @fileoverview User management routes
 *
 * This module handles user-related endpoints including profile management,
 * user retrieval, and user updates. It provides both personal profile
 * operations and administrative user management capabilities.
 *
 * @author Performance360 Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Request, Response, Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, requireRole } from '../middleware/auth';
import { logger } from '../utils/logger';
import { checkIndirectReport } from '../utils/accessControl';
import { sendPasswordResetEmail } from '../utils/emailService';
import { sanitizeForLogging } from '../utils/sanitizeLogs';
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
 * Express router instance for user routes
 */
const router = Router();

/**
 * Prisma client instance for database operations
 */
const prisma = new PrismaClient();

/**
 * Get current user profile
 *
 * Retrieves the complete profile information for the authenticated user,
 * including manager details, employees, and account status.
 *
 * @route GET /users/me
 * @auth Requires valid JWT token
 *
 * @param {Object} req - Express request object with user data from auth middleware
 * @param {Object} res - Express response object
 *
 * @returns {Object} 200 - User profile data with manager and employees
 * @returns {Object} 404 - User not found
 * @returns {Object} 500 - Internal server error
 *
 * @example
 * // Response
 * {
 *   "id": "clx1234567890",
 *   "email": "user@example.com",
 *   "firstName": "John",
 *   "lastName": "Doe",
 *   "role": "EMPLOYEE",
 *   "department": "Engineering",
 *   "position": "Developer",
 *   "avatar": "https://example.com/avatar.jpg",
 *   "isActive": true,
 *   "lastLoginAt": "2024-01-15T10:30:00Z",
 *   "createdAt": "2024-01-01T00:00:00Z",
 *   "manager": {
 *     "id": "clx0987654321",
 *     "firstName": "Jane",
 *     "lastName": "Smith",
 *     "email": "jane@example.com"
 *   },
 *   "employees": [
 *     {
 *       "id": "clx1111111111",
 *       "firstName": "Bob",
 *       "lastName": "Johnson",
 *       "email": "bob@example.com",
 *       "role": "EMPLOYEE"
 *     }
 *   ]
 * }
 */
router.get(
  '/me',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          position: true,
          avatar: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          employees: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          userTeams: {
            select: {
              id: true,
              joinedAt: true,
              isActive: true,
              team: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        return res.status(404).json({ message: 'Resource not found' });
      }

      res.json(user);
    } catch (error) {
      logger.logError('Error fetching user profile', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

/**
 * Get all active users
 *
 * Retrieves a list of all active users in the system with their basic
 * information and manager details. Results are sorted by last name and first name.
 *
 * @route GET /users
 * @auth Requires valid JWT token
 *
 * @param {Object} req - Express request object with user data from auth middleware
 * @param {Object} res - Express response object
 *
 * @returns {Object} 200 - Array of active user data
 * @returns {Object} 500 - Internal server error
 *
 * @example
 * // Response
 * [
 *   {
 *     "id": "clx1234567890",
 *     "email": "user@example.com",
 *     "firstName": "John",
 *     "lastName": "Doe",
 *     "role": "EMPLOYEE",
 *     "department": "Engineering",
 *     "position": "Developer",
 *     "avatar": "https://example.com/avatar.jpg",
 *     "lastLoginAt": "2024-01-15T10:30:00Z",
 *     "manager": {
 *       "id": "clx0987654321",
 *       "firstName": "Jane",
 *       "lastName": "Smith"
 *     }
 *   }
 * ]
 */
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    logger.logDebug('Fetching users', req.user!.id, 'GET', '/users');

    const currentUser = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, role: true },
    });

    if (!currentUser) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    // ADMIN: Can see all users
    if (currentUser.role === 'ADMIN') {
      const users = await prisma.user.findMany({
        where: { isActive: true },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          position: true,
          avatar: true,
          lastLoginAt: true,
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          userTeams: {
            select: {
              id: true,
              joinedAt: true,
              isActive: true,
              team: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          },
          userBusinessUnits: {
            select: {
              id: true,
              joinedAt: true,
              isActive: true,
              businessUnit: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          },
        },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      });
      return res.json(users);
    }

    // MANAGER: Can see all active users (same as EMPLOYEE) for colleague feedback purposes
    // This allows managers to provide feedback to any user in the system
    if (currentUser.role === 'MANAGER') {
      const users = await prisma.user.findMany({
        where: {
          isActive: true,
          id: { not: currentUser.id }, // Exclude the current user
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          position: true,
          avatar: true,
          lastLoginAt: true,
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          userTeams: {
            select: {
              id: true,
              joinedAt: true,
              isActive: true,
              team: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          },
          userBusinessUnits: {
            select: {
              id: true,
              joinedAt: true,
              isActive: true,
              businessUnit: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          },
        },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      });
      
      return res.json(users);
    }

    // EMPLOYEE: Can see other active employees for colleague feedback purposes
    // Exclude themselves from the list
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        id: { not: currentUser.id }, // Exclude the current user
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        position: true,
        avatar: true,
        lastLoginAt: true,
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        userTeams: {
          select: {
            id: true,
            joinedAt: true,
            isActive: true,
            team: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
        userBusinessUnits: {
          select: {
            id: true,
            joinedAt: true,
            isActive: true,
            businessUnit: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
    
    return res.json(users);
  } catch (error) {
    logger.logError('Error fetching users', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Get user by ID
 *
 * Retrieves detailed information about a specific user by their ID,
 * including manager and employee relationships.
 *
 * @route GET /users/:id
 * @auth Requires valid JWT token
 *
 * @param {string} req.params.id - User ID to retrieve
 * @param {Object} req - Express request object with user data from auth middleware
 * @param {Object} res - Express response object
 *
 * @returns {Object} 200 - User data with manager and employees
 * @returns {Object} 404 - User not found
 * @returns {Object} 500 - Internal server error
 *
 * @example
 * // Response
 * {
 *   "id": "clx1234567890",
 *   "email": "user@example.com",
 *   "firstName": "John",
 *   "lastName": "Doe",
 *   "role": "EMPLOYEE",
 *   "department": "Engineering",
 *   "position": "Developer",
 *   "avatar": "https://example.com/avatar.jpg",
 *   "isActive": true,
 *   "lastLoginAt": "2024-01-15T10:30:00Z",
 *   "createdAt": "2024-01-01T00:00:00Z",
 *   "manager": {
 *     "id": "clx0987654321",
 *     "firstName": "Jane",
 *     "lastName": "Smith",
 *     "email": "jane@example.com"
 *   },
 *   "employees": [
 *     {
 *       "id": "clx1111111111",
 *       "firstName": "Bob",
 *       "lastName": "Johnson",
 *       "email": "bob@example.com",
 *       "role": "EMPLOYEE"
 *     }
 *   ]
 * }
 */

/**
 * Get direct reports for current user
 *
 * Retrieves all users who have the current user as their manager.
 * Only accessible by users with MANAGER or ADMIN role.
 *
 * @route GET /users/direct-reports
 * @auth Requires valid JWT token and MANAGER/ADMIN role
 *
 * @param {Object} req - Express request object with user data from auth middleware
 * @param {Object} res - Express response object
 *
 * @returns {Object} 200 - Array of direct reports
 * @returns {Object} 403 - Insufficient permissions
 * @returns {Object} 500 - Internal server error
 *
 * @example
 * // Response
 * [
 *   {
 *     "id": "clx1234567890",
 *     "email": "employee@example.com",
 *     "firstName": "John",
 *     "lastName": "Doe",
 *     "role": "EMPLOYEE",
 *     "department": "Engineering",
 *     "position": "Developer",
 *     "lastLoginAt": "2024-01-15T10:30:00Z"
 *   }
 * ]
 */
router.get(
  '/direct-reports',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    logger.logDebug(
      'Fetching direct reports for user',
      req.user!.id,
      'GET',
      '/users/direct-reports'
    );

    const startTime = Date.now();
    const userId = req.user!.id;

    logger.logDebug(
      'Direct reports request started',
      undefined,
      'GET',
      '/users/direct-reports'
    );

    try {
      logger.logDebug(
        'Fetching current user from database',
        undefined,
        'GET',
        '/users/direct-reports'
      );
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      logger.logDatabaseOperation('SELECT', 'users', undefined);

      if (!currentUser) {
        logger.logWarning(
          'User not found for direct reports request',
          undefined,
          'GET',
          '/users/direct-reports'
        );
        return res.status(404).json({ message: 'Resource not found' });
      }

      logger.logDebug(
        'Checking user role for access',
        undefined,
        'GET',
        '/users/direct-reports'
      );

      if (currentUser.role !== 'MANAGER' && currentUser.role !== 'ADMIN') {
        logger.logWarning(
          'Access denied for direct reports',
          undefined,
          'GET',
          '/users/direct-reports'
        );
        return res
          .status(403)
          .json({ message: 'Access denied. Manager or Admin role required.' });
      }

      logger.logDebug(
        'Fetching direct reports from database',
        undefined,
        'GET',
        '/users/direct-reports'
      );
      const directReports = await prisma.user.findMany({
        where: {
          managerId: userId,
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          position: true,
          avatar: true,
          lastLoginAt: true,
          createdAt: true,
          userTeams: {
            select: {
              id: true,
              joinedAt: true,
              isActive: true,
              team: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          },
        },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      });

      logger.logDatabaseOperation('SELECT', 'users', undefined);

      const responseTime = Date.now() - startTime;
      logger.logDebug(
        'Direct reports request completed successfully',
        undefined,
        'GET',
        '/users/direct-reports'
      );

      res.json(directReports);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.logError('Error fetching direct reports', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

/**
 * Get all indirect reports for current user (recursive hierarchy traversal)
 *
 * Retrieves all users who report to the current user through any number of
 * management levels in the hierarchy. This includes people who report to your
 * direct reports, people who report to those people, and so on.
 * Only accessible by users with MANAGER or ADMIN role.
 *
 * @route GET /users/indirect-reports
 * @auth Requires valid JWT token and MANAGER/ADMIN role
 *
 * @param {Object} req - Express request object with user data from auth middleware
 * @param {Object} res - Express response object
 *
 * @returns {Object} 200 - Array of all indirect reports at all levels
 * @returns {Object} 403 - Insufficient permissions
 * @returns {Object} 500 - Internal server error
 *
 * @example
 * // Response
 * [
 *   {
 *     "id": "clx1234567890",
 *     "email": "employee@example.com",
 *     "firstName": "John",
 *     "lastName": "Doe",
 *     "role": "EMPLOYEE",
 *     "department": "Engineering",
 *     "position": "Developer",
 *     "lastLoginAt": "2024-01-15T10:30:00Z",
 *     "manager": {
 *       "id": "clx0987654321",
 *       "firstName": "Jane",
 *       "lastName": "Smith",
 *       "email": "jane@example.com"
 *     }
 *   }
 * ]
 */
router.get(
  '/indirect-reports',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    logger.logDebug(
      'Fetching indirect reports for user',
      req.user!.id,
      'GET',
      '/users/indirect-reports'
    );

    const startTime = Date.now();
    const userId = req.user!.id;

    logger.logDebug(
      'Indirect reports request started',
      undefined,
      'GET',
      '/users/indirect-reports'
    );

    try {
      logger.logDebug(
        'Fetching current user from database',
        undefined,
        'GET',
        '/users/indirect-reports'
      );
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      logger.logDatabaseOperation('SELECT', 'users', undefined);

      if (!currentUser) {
        logger.logWarning(
          'User not found for indirect reports request',
          undefined,
          'GET',
          '/users/indirect-reports'
        );
        return res.status(404).json({ message: 'Resource not found' });
      }

      logger.logDebug(
        'Checking user role for access',
        undefined,
        'GET',
        '/users/indirect-reports'
      );

      if (currentUser.role !== 'MANAGER' && currentUser.role !== 'ADMIN') {
        logger.logWarning(
          'Access denied for indirect reports',
          undefined,
          'GET',
          '/users/indirect-reports'
        );
        return res.status(403).json({ message: 'Access denied' });
      }

      // Recursive function to get all indirect reports
      const getAllIndirectReports = async (
        managerIds: string[],
        visited: Set<string> = new Set()
      ): Promise<any[]> => {
        if (managerIds.length === 0) return [];

        // Mark these managers as visited to prevent cycles
        managerIds.forEach(id => visited.add(id));

        logger.logDebug(
          'Finding reports for managers',
          undefined,
          'GET',
          '/users/indirect-reports'
        );

        const reports = await prisma.user.findMany({
          where: {
            managerId: { in: managerIds },
            isActive: true,
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            position: true,
            avatar: true,
            lastLoginAt: true,
            createdAt: true,
            manager: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            userTeams: {
              select: {
                id: true,
                joinedAt: true,
                isActive: true,
                team: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                  },
                },
              },
            },
          },
          orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        });

        logger.logDatabaseOperation('SELECT', 'users', undefined);

        // Get the IDs of these reports for the next iteration
        const reportIds = reports.map(user => user.id);

        // Recursively get indirect reports of these reports
        const indirectReports = await getAllIndirectReports(reportIds, visited);

        // Combine direct and indirect reports
        return [...reports, ...indirectReports];
      };

      logger.logDebug(
        'Starting recursive indirect reports search',
        undefined,
        'GET',
        '/users/indirect-reports'
      );

      // Start with the current user's direct reports
      const directReports = await prisma.user.findMany({
        where: { managerId: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          position: true,
          avatar: true,
          lastLoginAt: true,
          createdAt: true,
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          userTeams: {
            select: {
              id: true,
              joinedAt: true,
              isActive: true,
              team: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          },
        },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      });

      logger.logDatabaseOperation('SELECT', 'users', undefined);

      const directReportIds = directReports.map(user => user.id);
      logger.logDebug(
        'Direct report IDs found',
        undefined,
        'GET',
        '/users/indirect-reports'
      );

      // Get all indirect reports
      const indirectReports = await getAllIndirectReports(directReportIds);

      // Combine direct and indirect reports
      const allReports = [...directReports, ...indirectReports];

      const responseTime = Date.now() - startTime;
      logger.logDebug(
        'Indirect reports request completed successfully',
        undefined,
        'GET',
        '/users/indirect-reports'
      );

      res.json(allReports);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.logError('Error fetching indirect reports', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

router.get(
  '/:id',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const currentUserId = req.user!.id;

      logger.logDebug('Fetching user by ID', id, 'GET', `/users/${id}`);

      // Validate user ID format (basic validation)
      if (!id || id.trim().length === 0) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }

      // Get current user's role
      const currentUser = await prisma.user.findUnique({
        where: { id: currentUserId },
        select: { id: true, role: true },
      });

      if (!currentUser) {
        return res.status(404).json({ message: 'Resource not found' });
      }

      // Check if user is trying to access their own profile
      if (currentUserId === id) {
        const user = await prisma.user.findUnique({
          where: { id },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            position: true,
            avatar: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
            manager: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            employees: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
            userTeams: {
              select: {
                id: true,
                joinedAt: true,
                isActive: true,
                team: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                  },
                },
              },
            },
          },
        });

        if (!user) {
          return res.status(404).json({ message: 'Resource not found' });
        }

        return res.json(user);
      }

      // ADMIN: Can access any user
      if (currentUser.role === 'ADMIN') {
        const user = await prisma.user.findUnique({
          where: { id },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            position: true,
            avatar: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
            manager: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            employees: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
            userTeams: {
              select: {
                id: true,
                joinedAt: true,
                isActive: true,
                team: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                  },
                },
              },
            },
          },
        });

        if (!user) {
          return res.status(404).json({ message: 'Resource not found' });
        }

        return res.json(user);
      }

      // MANAGER: Can only access their direct/indirect reports
      if (currentUser.role === 'MANAGER') {
        // Check if it's a direct report
        const directReport = await prisma.user.findFirst({
          where: {
            id: id,
            managerId: currentUserId,
            isActive: true,
          },
        });

        if (directReport) {
          const user = await prisma.user.findUnique({
            where: { id },
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              position: true,
              avatar: true,
              isActive: true,
              lastLoginAt: true,
              createdAt: true,
              manager: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
              employees: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  role: true,
                },
              },
              userTeams: {
                select: {
                  id: true,
                  joinedAt: true,
                  isActive: true,
                  team: {
                    select: {
                      id: true,
                      name: true,
                      description: true,
                    },
                  },
                },
              },
            },
          });

          if (!user) {
            return res.status(404).json({ message: 'Resource not found' });
          }

          return res.json(user);
        }

        // Check if it's an indirect report
        const isIndirectReport = await checkIndirectReport(currentUserId, id);
        if (isIndirectReport) {
          const user = await prisma.user.findUnique({
            where: { id },
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              position: true,
              avatar: true,
              isActive: true,
              lastLoginAt: true,
              createdAt: true,
              manager: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
              employees: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  role: true,
                },
              },
              userTeams: {
                select: {
                  id: true,
                  joinedAt: true,
                  isActive: true,
                  team: {
                    select: {
                      id: true,
                      name: true,
                      description: true,
                    },
                  },
                },
              },
            },
          });

          if (!user) {
            return res.status(404).json({ message: 'Resource not found' });
          }

          return res.json(user);
        }

        return res.status(403).json({
          message:
            'Access denied. You can only view your own profile or your reports.',
        });
      }

      // EMPLOYEE: Can only access their own profile
      return res.status(403).json({
        message: 'Access denied. You can only view your own profile.',
      });
    } catch (error) {
      logger.logError('Error fetching user', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

/**
 * Update current user profile
 *
 * Updates the profile information for the authenticated user.
 * Only allows updating non-sensitive fields like name, department, and position.
 *
 * @route PUT /users/me
 * @auth Requires valid JWT token
 *
 * @param {Object} req.body - Request body containing profile updates
 * @param {string} [req.body.firstName] - User's first name
 * @param {string} [req.body.lastName] - User's last name
 * @param {string} [req.body.department] - User's department
 * @param {string} [req.body.position] - User's job position
 *
 * @returns {Object} 200 - Profile updated successfully
 * @returns {Object} 400 - Validation errors
 * @returns {Object} 404 - User not found
 * @returns {Object} 500 - Internal server error
 *
 * @example
 * // Request body
 * {
 *   "firstName": "John",
 *   "lastName": "Smith",
 *   "department": "Engineering",
 *   "position": "Senior Developer"
 * }
 *
 * // Success response
 * {
 *   "id": "clx1234567890",
 *   "email": "user@example.com",
 *   "firstName": "John",
 *   "lastName": "Smith",
 *   "role": "EMPLOYEE",
 *   "department": "Engineering",
 *   "position": "Senior Developer",
 *   "avatar": "https://example.com/avatar.jpg"
 * }
 */
router.put('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    logger.logDebug(
      'Updating user profile for',
      (req as any).user.id,
      'PUT',
      '/users/me'
    );

    const { firstName, lastName, position } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: (req as any).user.id },
      data: {
        firstName,
        lastName,
        position,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        position: true,
        avatar: true,
      },
    });

    res.json(updatedUser);
  } catch (error) {
    logger.logError('Error updating user profile', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Update user's manager (admin only)
 *
 * Updates the manager assignment for a specific user.
 * Only administrators can perform this operation.
 *
 * @route PATCH /users/:id/manager
 * @auth Requires valid JWT token and ADMIN role
 *
 * @param {string} req.params.id - User ID to update
 * @param {Object} req.body - Request body containing manager update
 * @param {string|null} req.body.managerId - Manager ID or null to remove manager
 *
 * @returns {Object} 200 - Manager updated successfully
 * @returns {Object} 400 - Validation errors
 * @returns {Object} 403 - Forbidden (not admin)
 * @returns {Object} 404 - User not found
 * @returns {Object} 500 - Internal server error
 *
 * @example
 * // Request body
 * {
 *   "managerId": "clx0987654321"
 * }
 *
 * // Success response
 * {
 *   "message": "Manager updated successfully"
 * }
 */
router.patch(
  '/:id/manager',
  authenticateToken,
  async (req: Request, res: Response) => {
    logger.logDebug(
      'Updating user manager for',
      req.params.id,
      'PATCH',
      `/users/${req.params.id}/manager`
    );

    try {
      // Check if user is admin
      const currentUser = await prisma.user.findUnique({
        where: { id: (req as any).user.id },
      });

      if (!currentUser || currentUser.role !== 'ADMIN') {
        return res
          .status(403)
          .json({ message: 'Access denied. Admin role required.' });
      }

      const { id } = req.params;
      const { managerId } = req.body;

      // Check if target user exists
      const targetUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!targetUser) {
        return res.status(404).json({ message: 'Resource not found' });
      }

      // If managerId is provided, check if manager exists and has MANAGER role
      if (managerId) {
        const manager = await prisma.user.findUnique({
          where: { id: managerId },
        });

        if (!manager) {
          return res.status(400).json({ message: 'Manager not found' });
        }

        if (manager.role !== 'MANAGER' && manager.role !== 'ADMIN') {
          return res
            .status(400)
            .json({ message: 'Selected user is not a manager or admin' });
        }

        // Prevent self-assignment as manager
        if (managerId === id) {
          return res
            .status(400)
            .json({ message: 'User cannot be their own manager' });
        }
      }

      // Update the user's manager
      await prisma.user.update({
        where: { id },
        data: {
          managerId: managerId || null,
        },
      });

      res.json({ message: 'Manager updated successfully' });
    } catch (error) {
      logger.logError('Error updating user manager', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

/**
 * Delete user by email (for test cleanup)
 *
 * Deletes a user by email address. This endpoint is specifically designed
 * for cleaning up test data and should only be used in test environments.
 *
 * @route DELETE /users/delete
 * @auth No authentication required (for test purposes)
 *
 * @param {Object} req.body - Request body containing email
 * @param {string} req.body.email - Email address of user to delete
 *
 * @returns {Object} 200 - User deleted successfully
 * @returns {Object} 404 - User not found
 * @returns {Object} 500 - Internal server error
 *
 * @example
 * // Request body
 * {
 *   "email": "testuser@example.com"
 * }
 *
 * // Success response
 * {
 *   "message": "User deleted successfully"
 * }
 */
router.delete('/delete', async (req: Request, res: Response) => {
    const url = req.originalUrl || req.url;
    const method = req.method;
    
    // Additional security check for production
    const nodeEnv = process.env.NODE_ENV;
    const enableTestRoutes = 
      nodeEnv === 'test' ||
      (nodeEnv !== undefined && nodeEnv !== 'production') || 
      process.env.ENABLE_TEST_ROUTES === 'true';
    
    if (!enableTestRoutes) {
      logger.logWarning('Attempted access to test endpoint in production', undefined, method, url);
      return res.status(404).json({ message: 'Endpoint not found' });
    }

  logger.logDebug(
    'Deleting user by email',
    req.body.email,
    'DELETE',
    '/users/delete'
  );

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find and delete user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    // Hard delete the user (for test cleanup)
    await prisma.user.delete({
      where: { email },
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.logError('Error deleting user by email', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Delete users by email pattern (for test cleanup)
 *
 * Deletes multiple users whose email addresses match a specific pattern.
 * This endpoint is specifically designed for cleaning up test data and
 * should only be used in test environments.
 *
 * @route DELETE /users/delete-pattern
 * @auth No authentication required (for test purposes)
 *
 * @param {Object} req.body - Request body containing email pattern
 * @param {string} req.body.emailPattern - Email pattern to match (e.g., 'testuser')
 *
 * @returns {Object} 200 - Users deleted successfully
 * @returns {Object} 500 - Internal server error
 *
 * @example
 * // Request body
 * {
 *   "emailPattern": "testuser"
 * }
 *
 * // Success response
 * {
 *   "message": "Users deleted successfully",
 *   "deletedCount": 5
 * }
 */
router.delete('/delete-pattern', async (req: Request, res: Response) => {
    const url = req.originalUrl || req.url;
    const method = req.method;
    
    // Additional security check for production
    const nodeEnv = process.env.NODE_ENV;
    const enableTestRoutes = 
      nodeEnv === 'test' ||
      (nodeEnv !== undefined && nodeEnv !== 'production') || 
      process.env.ENABLE_TEST_ROUTES === 'true';
    
    if (!enableTestRoutes) {
      logger.logWarning('Attempted access to test endpoint in production', undefined, method, url);
      return res.status(404).json({ message: 'Endpoint not found' });
    }

  logger.logInfo(
    'Deleting users by pattern',
    req.body,
    'DELETE',
    '/users/delete-pattern'
  );
  try {
    const { emailPattern } = req.body;

    if (!emailPattern) {
      return res.status(400).json({ message: 'Email pattern is required' });
    }

    // Find users matching the pattern
    const users = await prisma.user.findMany({
      where: {
        email: {
          contains: emailPattern,
        },
      },
    });

    if (users.length === 0) {
      return res.json({
        message: 'No users found matching pattern',
        deletedCount: 0,
      });
    }

    // Delete all matching users
    const deletePromises = users.map(user =>
      prisma.user.delete({
        where: { id: user.id },
      })
    );

    await Promise.all(deletePromises);

    res.json({
      message: 'Users deleted successfully',
      deletedCount: users.length,
    });
  } catch (error) {
    logger.logError('Error deleting users by pattern', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Create user (admin only)
 *
 * Creates a new user with a specific role. Only administrators can perform this operation.
 * This endpoint allows admins to create new users directly from the user management interface.
 *
 * @route POST /users
 * @auth Requires valid JWT token and ADMIN role
 *
 * @param {Object} req.body - Request body containing user data
 * @param {string} req.body.firstName - User's first name
 * @param {string} req.body.lastName - User's last name
 * @param {string} req.body.email - User's email address
 * @param {string} req.body.password - User's password
 * @param {string} req.body.role - User's role ('EMPLOYEE', 'MANAGER', 'ADMIN')
 * @param {string} [req.body.position] - User's position (optional)
 * @param {string} [req.body.managerId] - Manager's ID (optional)
 *
 * @returns {Object} 201 - User created successfully
 * @returns {Object} 400 - Invalid input data
 * @returns {Object} 403 - Forbidden (not admin)
 * @returns {Object} 409 - User already exists
 * @returns {Object} 500 - Internal server error
 *
 * @example
 * // Request body
 * {
 *   "firstName": "John",
 *   "lastName": "Doe",
 *   "email": "john.doe@example.com",
 *   "password": "Password@123",
 *   "role": "MANAGER",
 *   "position": "Senior Manager",
 *   "managerId": "clx1234567890"
 * }
 *
 * // Success response
 * {
 *   "id": "clx1234567890",
 *   "email": "john.doe@example.com",
 *   "firstName": "John",
 *   "lastName": "Doe",
 *   "role": "MANAGER",
 *   "position": "Senior Manager",
 *   "isActive": true,
 *   "createdAt": "2024-01-15T10:30:00Z",
 *   "manager": {
 *     "id": "clx1234567890",
 *     "firstName": "Jane",
 *     "lastName": "Smith"
 *   }
 * }
 */
router.post(
  '/',
  authenticateToken,
  requireRole(['ADMIN']),
  [
    body('email').isEmail().normalizeEmail(),
    body('firstName').isString().trim().notEmpty(),
    body('lastName').isString().trim().notEmpty(),
    body('password').isLength({ min: 6 }),
    body('role').isIn(['EMPLOYEE', 'MANAGER', 'ADMIN']),
    body('position').optional().isString().trim(),
    body('managerId').optional().isString(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        firstName,
        lastName,
        email,
        password,
        role,
        position,
        managerId,
      } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(409).json({ message: 'User already exists' });
      }

      // Validate manager exists if provided
      if (managerId) {
        const manager = await prisma.user.findUnique({
          where: { id: managerId },
        });
        if (!manager) {
          return res.status(400).json({ message: 'Manager not found' });
        }
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create the user
      const user = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          password: hashedPassword,
          role: role.toUpperCase(),
          position,
          managerId: managerId || null,
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          position: true,
          isActive: true,
          createdAt: true,
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      logger.logInfo(`User created by admin ${req.user?.email}: ${user.email}`);
      res.status(201).json(user);
    } catch (error) {
      logger.logError('Error creating user', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

/**
 * Create user with role (for test setup)
 *
 * Creates a new user with a specific role. This endpoint is specifically designed
 * for setting up test data and should only be used in test environments.
 *
 * @route POST /users/create-user
 * @auth No authentication required (for test purposes)
 *
 * @param {Object} req.body - Request body containing user data
 * @param {string} req.body.firstName - User's first name
 * @param {string} req.body.lastName - User's last name
 * @param {string} req.body.email - User's email address
 * @param {string} req.body.password - User's password
 * @param {string} req.body.role - User's role ('USER', 'MANAGER', 'ADMIN')
 *
 * @returns {Object} 201 - User created successfully
 * @returns {Object} 400 - Invalid input data
 * @returns {Object} 409 - User already exists
 * @returns {Object} 500 - Internal server error
 *
 * @example
 * // Request body
 * {
 *   "firstName": "John",
 *   "lastName": "Doe",
 *   "email": "testuser@example.com",
 *   "password": "Password@123",
 *   "role": "MANAGER"
 * }
 *
 * // Success response
 * {
 *   "id": "clx1234567890",
 *   "email": "testuser@example.com",
 *   "firstName": "John",
 *   "lastName": "Doe",
 *   "role": "MANAGER",
 *   "isActive": true,
 *   "createdAt": "2024-01-15T10:30:00Z"
 * }
 */
router.post(
  '/create-user',
  [
    body('email').isEmail().normalizeEmail(),
    body('firstName').isString().trim().notEmpty(),
    body('lastName').isString().trim().notEmpty(),
    body('password').isLength({ min: 6 }),
  ],
  async (req: Request, res: Response) => {
    const url = req.originalUrl || req.url;
    const method = req.method;
    
    // Additional security check for production
    const nodeEnv = process.env.NODE_ENV;
    const enableTestRoutes = 
      nodeEnv === 'test' ||
      (nodeEnv !== undefined && nodeEnv !== 'production') || 
      process.env.ENABLE_TEST_ROUTES === 'true';
    
    if (!enableTestRoutes) {
      logger.logWarning('Attempted access to test endpoint in production', undefined, method, url);
      return res.status(404).json({ message: 'Endpoint not found' });
    }

    // Log incoming request
    logger.logInfo(`[TEST-CLEANUP] POST /create-user - Request received`, undefined, method, url);
    
    try {
      // Log request body (sanitized)
      const sanitizedBody = sanitizeForLogging(req.body);
      logger.logDebug(`[TEST-CLEANUP] Request body: ${JSON.stringify(sanitizedBody)}`, undefined, method, url);
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorDetails = errors.array();
        logger.logWarning(
          `[TEST-CLEANUP] Validation failed: ${JSON.stringify(errorDetails)}`,
          undefined,
          method,
          url
        );
        return res.status(400).json({ errors: errorDetails });
      }
      
      const {
        firstName,
        lastName,
        email,
        password,
        role = 'EMPLOYEE',
      } = req.body;

      logger.logDebug(
        `[TEST-CLEANUP] Processing user creation - Email: ${email}, Role: ${role}`,
        undefined,
        method,
        url
      );

      // Validate required fields
      if (!firstName || !lastName || !email || !password) {
        const missingFields = [];
        if (!firstName) missingFields.push('firstName');
        if (!lastName) missingFields.push('lastName');
        if (!email) missingFields.push('email');
        if (!password) missingFields.push('password');
        
        logger.logWarning(
          `[TEST-CLEANUP] Missing required fields: ${missingFields.join(', ')}`,
          undefined,
          method,
          url
        );
        return res.status(400).json({
          message: 'firstName, lastName, email, and password are required',
          missingFields,
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        logger.logWarning(
          `[TEST-CLEANUP] Invalid email format: ${email}`,
          undefined,
          method,
          url
        );
        return res.status(400).json({ message: 'Invalid email format' });
      }

      // Validate role
      const validRoles = ['EMPLOYEE', 'MANAGER', 'ADMIN'];
      const normalizedRole = role.toUpperCase();
      if (!validRoles.includes(normalizedRole)) {
        logger.logWarning(
          `[TEST-CLEANUP] Invalid role: ${role} (valid roles: ${validRoles.join(', ')})`,
          undefined,
          method,
          url
        );
        return res.status(400).json({
          message: 'Invalid role. Must be one of: EMPLOYEE, MANAGER, ADMIN',
          providedRole: role,
          validRoles,
        });
      }

      // Check if user already exists
      logger.logDebug(`[TEST-CLEANUP] Checking if user exists: ${email}`, undefined, method, url);
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        logger.logWarning(
          `[TEST-CLEANUP] User already exists: ${email}`,
          undefined,
          method,
          url
        );
        return res.status(409).json({ 
          message: 'User already exists',
          email,
        });
      }

      // Hash the password (use same configuration as auth.ts)
      logger.logDebug(`[TEST-CLEANUP] Hashing password for user: ${email}`, undefined, method, url);
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create the user
      logger.logInfo(`[TEST-CLEANUP] Creating user: ${email} with role: ${normalizedRole}`, undefined, method, url);
      const user = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          password: hashedPassword,
          role: normalizedRole,
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });

      logger.logInfo(
        `[TEST-CLEANUP] ✅ User created successfully: ${email} (ID: ${user.id})`,
        undefined,
        method,
        url
      );
      res.status(201).json(user);
    } catch (error: any) {
      // Enhanced error logging
      const errorMessage = error?.message || 'Unknown error';
      const errorStack = error?.stack || 'No stack trace';
      const errorName = error?.name || 'Error';
      
      logger.logError(
        `[TEST-CLEANUP] ❌ Error creating user: ${errorMessage}`,
        {
          name: errorName,
          message: errorMessage,
          stack: errorStack,
          requestBody: sanitizeForLogging(req.body),
        },
        undefined,
        method,
        url
      );
      
      // Log additional details for common errors
      if (error?.code) {
        logger.logError(
          `[TEST-CLEANUP] Database error code: ${error.code}`,
          error,
          undefined,
          method,
          url
        );
      }
      
      // Return more detailed error in development
      const errorResponse: any = { message: 'Internal server error' };
      if (process.env.NODE_ENV !== 'production') {
        errorResponse.error = errorMessage;
        errorResponse.errorName = errorName;
      }
      
      res.status(500).json(errorResponse);
    }
  }
);

/**
 * Delete user (admin only)
 *
 * Soft deletes a user by setting isActive to false.
 * Only administrators can perform this operation.
 *
 * @route DELETE /users/:id
 * @auth Requires valid JWT token and ADMIN role
 *
 * @param {string} req.params.id - User ID to delete
 * @param {Object} req - Express request object with user data from auth middleware
 * @param {Object} res - Express response object
 *
 * @returns {Object} 200 - User deleted successfully
 * @returns {Object} 403 - Forbidden (not admin)
 * @returns {Object} 404 - User not found
 * @returns {Object} 500 - Internal server error
 *
 * @example
 * // Success response
 * {
 *   "message": "User deleted successfully"
 * }
 */
router.delete(
  '/:id',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      // Check if user is admin
      const currentUser = await prisma.user.findUnique({
        where: { id: (req as any).user.id },
      });

      if (!currentUser || currentUser.role !== 'ADMIN') {
        return res
          .status(403)
          .json({ message: 'Access denied. Admin role required.' });
      }

      const { id } = req.params;

      // Check if target user exists
      const targetUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!targetUser) {
        return res.status(404).json({ message: 'Resource not found' });
      }

      // Prevent self-deletion
      if (id === (req as any).user.id) {
        return res
          .status(400)
          .json({ message: 'You cannot delete your own account' });
      }

      // Soft delete the user by setting isActive to false
      await prisma.user.update({
        where: { id },
        data: {
          isActive: false,
        },
      });

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      logger.logError('Error deleting user', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

/**
 * Get direct reports for current user
 *
 * Retrieves all users who have the current user as their manager.
 * Only accessible by users with MANAGER or ADMIN role.
 *
 * @route GET /users/direct-reports
 * @auth Requires valid JWT token and MANAGER/ADMIN role
 *
 * @param {Object} req - Express request object with user data from auth middleware
 * @param {Object} res - Express response object
 *
 * @returns {Object} 200 - Array of direct reports
 * @returns {Object} 403 - Insufficient permissions
 * @returns {Object} 500 - Internal server error
 *
 * @example
 * // Response
 * [
 *   {
 *     "id": "clx1234567890",
 *     "email": "employee@example.com",
 *     "firstName": "John",
 *     "lastName": "Doe",
 *     "role": "EMPLOYEE",
 *     "department": "Engineering",
 *     "position": "Developer",
 *     "lastLoginAt": "2024-01-15T10:30:00Z"
 *   }
 * ]
 */
router.get(
  '/direct-reports',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    logger.logDebug(
      'Fetching direct reports for user',
      req.user!.id,
      'GET',
      '/users/direct-reports'
    );

    const startTime = Date.now();
    const userId = req.user!.id;

    logger.logDebug(
      'Direct reports request started',
      undefined,
      'GET',
      '/users/direct-reports'
    );

    try {
      logger.logDebug(
        'Fetching current user from database',
        undefined,
        'GET',
        '/users/direct-reports'
      );
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      logger.logDatabaseOperation('SELECT', 'users', undefined);

      if (!currentUser) {
        logger.logWarning(
          'User not found for direct reports request',
          undefined,
          'GET',
          '/users/direct-reports'
        );
        return res.status(404).json({ message: 'Resource not found' });
      }

      logger.logDebug(
        'Checking user role for access',
        undefined,
        'GET',
        '/users/direct-reports'
      );

      if (currentUser.role !== 'MANAGER' && currentUser.role !== 'ADMIN') {
        logger.logWarning(
          'Access denied for direct reports',
          undefined,
          'GET',
          '/users/direct-reports'
        );
        return res
          .status(403)
          .json({ message: 'Access denied. Manager or Admin role required.' });
      }

      logger.logDebug(
        'Fetching direct reports from database',
        undefined,
        'GET',
        '/users/direct-reports'
      );
      const directReports = await prisma.user.findMany({
        where: {
          managerId: userId,
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          position: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      });

      logger.logDatabaseOperation('SELECT', 'users', undefined);

      const responseTime = Date.now() - startTime;
      logger.logDebug(
        'Direct reports request completed successfully',
        undefined,
        'GET',
        '/users/direct-reports'
      );

      res.json(directReports);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.logError('Error fetching direct reports', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

/**
 * Assign manager to employee (for test setup)
 *
 * Assigns a manager to an employee by updating the employee's managerId.
 * This endpoint is specifically designed for setting up test data and
 * should only be used in test environments.
 *
 * @route PUT /users/assign-manager
 * @auth No authentication required (for test purposes)
 *
 * @param {Object} req.body - Request body containing employee and manager IDs
 * @param {string} req.body.employeeId - ID of the employee
 * @param {string} req.body.managerId - ID of the manager to assign
 *
 * @returns {Object} 200 - Manager assigned successfully
 * @returns {Object} 400 - Invalid input data
 * @returns {Object} 404 - Employee or manager not found
 * @returns {Object} 500 - Internal server error
 *
 * @example
 * // Request body
 * {
 *   "employeeId": "clx1234567890",
 *   "managerId": "clx0987654321"
 * }
 *
 * // Success response
 * {
 *   "message": "Manager assigned successfully",
 *   "employee": {
 *     "id": "clx1234567890",
 *     "firstName": "John",
 *     "lastName": "Doe",
 *     "managerId": "clx0987654321"
 *   }
 * }
 */
router.put('/assign-manager', async (req: Request, res: Response) => {
    const url = req.originalUrl || req.url;
    const method = req.method;
    
    // Additional security check for production
    const nodeEnv = process.env.NODE_ENV;
    const enableTestRoutes = 
      nodeEnv === 'test' ||
      (nodeEnv !== undefined && nodeEnv !== 'production') || 
      process.env.ENABLE_TEST_ROUTES === 'true';
    
    if (!enableTestRoutes) {
      logger.logWarning('Attempted access to test endpoint in production', undefined, method, url);
      return res.status(404).json({ message: 'Endpoint not found' });
    }
  try {
    const { employeeId, managerId } = req.body;

    // Validate required fields
    if (!employeeId || !managerId) {
      return res.status(400).json({
        message: 'employeeId and managerId are required',
      });
    }

    // Check if employee exists
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check if manager exists
    const manager = await prisma.user.findUnique({
      where: { id: managerId },
    });

    if (!manager) {
      return res.status(404).json({ message: 'Manager not found' });
    }

    // Update employee with manager assignment
    const updatedEmployee = await prisma.user.update({
      where: { id: employeeId },
      data: {
        managerId: managerId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        managerId: true,
      },
    });

    res.json({
      message: 'Manager assigned successfully',
      employee: updatedEmployee,
    });
  } catch (error) {
    logger.logError('Error assigning manager', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Reset user password (Admin only)
 *
 * Allows administrators to reset a user's password to a new value.
 * This endpoint requires ADMIN role and validates the new password.
 *
 * @route PATCH /users/:id/reset-password
 * @auth Requires valid JWT token with ADMIN role
 *
 * @param {string} id - User ID to reset password for
 * @param {Object} req.body - Request body containing new password
 * @param {string} req.body.password - New password for the user
 *
 * @returns {Object} 200 - Password reset successfully
 * @returns {Object} 400 - Invalid input data
 * @returns {Object} 404 - User not found
 * @returns {Object} 403 - Insufficient permissions (non-admin)
 * @returns {Object} 500 - Internal server error
 *
 * @example
 * // Request body
 * {
 *   "password": "newSecurePassword@123"
 * }
 *
 * // Success response
 * {
 *   "message": "Password reset successfully",
 *   "user": {
 *     "id": "clx1234567890",
 *     "email": "user@example.com",
 *     "firstName": "John",
 *     "lastName": "Doe"
 *   }
 * }
 */
router.patch(
  '/:id/reset-password',
  authenticateToken,
  requireRole(['ADMIN']),
  [
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
  ],
  async (req: AuthRequest, res: Response) => {
    const startTime = Date.now();
    const { id } = req.params;
    const { password } = req.body;

    try {
      logger.logDebug(
        'Password reset request initiated',
        undefined,
        'PATCH',
        `/users/${id}/reset-password`
      );

      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.logWarning(
          'Password reset validation failed',
          undefined,
          'PATCH',
          `/users/${id}/reset-password`
        );
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      // Check if target user exists
      const targetUser = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
        },
      });

      if (!targetUser) {
        logger.logWarning(
          'Password reset failed - target user not found',
          undefined,
          'PATCH',
          `/users/${id}/reset-password`
        );
        return res.status(404).json({ message: 'Resource not found' });
      }

      if (!targetUser.isActive) {
        logger.logWarning(
          'Password reset failed - target user is inactive',
          undefined,
          'PATCH',
          `/users/${id}/reset-password`
        );
        return res
          .status(400)
          .json({ message: 'Cannot reset password for inactive user' });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Update user's password
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          password: hashedPassword,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      });

      logger.logDatabaseOperation('UPDATE', 'users', undefined);

      const responseTime = Date.now() - startTime;
      logger.logInfo(
        'Password reset completed successfully',
        undefined,
        'PATCH',
        `/users/${id}/reset-password`
      );

      res.json({
        message: 'Password reset successfully',
        user: updatedUser,
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.logError('Error during password reset', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

/**
 * Send password reset link to user (admin only)
 *
 * Generates a secure password reset token and sends it via email to the user.
 * The token expires after 1 day.
 *
 * @route POST /users/:id/send-reset-link
 * @auth Requires valid JWT token and ADMIN role
 *
 * @param {string} id - User ID to send reset link to
 *
 * @returns {Object} 200 - Reset link sent successfully
 * @returns {Object} 404 - User not found
 * @returns {Object} 400 - User is inactive
 * @returns {Object} 500 - Internal server error
 *
 * @example
 * // Success response
 * {
 *   "message": "Password reset link sent successfully to user@example.com"
 * }
 */
router.post(
  '/:id/send-reset-link',
  authenticateToken,
  requireRole(['ADMIN']),
  async (req: AuthRequest, res: Response) => {
    const startTime = Date.now();
    const { id } = req.params;

    try {
      logger.logDebug(
        'Password reset link request initiated',
        undefined,
        'POST',
        `/users/${id}/send-reset-link`
      );

      // Check if target user exists
      const targetUser = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
        },
      });

      if (!targetUser) {
        logger.logWarning(
          'Password reset link failed - target user not found',
          undefined,
          'POST',
          `/users/${id}/send-reset-link`
        );
        return res.status(404).json({ message: 'Resource not found' });
      }

      if (!targetUser.isActive) {
        logger.logWarning(
          'Password reset link failed - target user is inactive',
          undefined,
          'POST',
          `/users/${id}/send-reset-link`
        );
        return res
          .status(400)
          .json({ message: 'Cannot send reset link to inactive user' });
      }

      // Generate secure reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day from now

      // Save reset token to database
      await prisma.user.update({
        where: { id },
        data: {
          passwordResetToken: resetToken,
          passwordResetExpires: resetTokenExpiry,
        },
      });

      logger.logDatabaseOperation('UPDATE', 'users', undefined);

      // Send email with reset link
      const emailSent = await sendPasswordResetEmail(
        targetUser.email,
        targetUser.firstName,
        resetToken
      );

      if (!emailSent) {
        logger.logWarning(
          'Password reset link generated but email failed to send',
          undefined,
          'POST',
          `/users/${id}/send-reset-link`
        );
        // Still return success but with a warning
        return res.status(200).json({
          message:
            'Reset token generated but email may not have been sent. Please check email configuration.',
          token: resetToken, // Include token in response for testing/debugging
        });
      }

      const responseTime = Date.now() - startTime;
      logger.logInfo(
        `Password reset link sent successfully to ${targetUser.email}`,
        undefined,
        'POST',
        `/users/${id}/send-reset-link`
      );

      res.json({
        message: `Password reset link sent successfully to ${targetUser.email}`,
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.logError('Error sending password reset link', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

export { router as userRoutes };
