/**
 * @fileoverview Authentication routes
 *
 * This module handles user authentication including login, registration,
 * and token management for the Performance360 application.
 *
 * @author Performance360 Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Request, Response, Router } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { authRateLimiter } from '../middleware/rateLimiter';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { validatePasswordStrength } from '../utils/passwordPolicy';
import { sanitizeForLogging } from '../utils/sanitizeLogs';

/**
 * Express router instance for authentication routes
 */
const router = Router();

/**
 * Prisma client instance for database operations
 */
const prisma = new PrismaClient();

/**
 * User registration endpoint
 *
 * Creates a new user account with hashed password and returns JWT token.
 * Validates input data and checks for existing users.
 *
 * @route POST /auth/register
 *
 * @param {Object} req.body - Request body containing user data
 * @param {string} req.body.email - User's email address (must be valid email)
 * @param {string} req.body.firstName - User's first name
 * @param {string} req.body.lastName - User's last name
 * @param {string} req.body.password - User's password (minimum 6 characters)
 *
 * @returns {Object} 201 - User created successfully
 * @returns {Object} 400 - Validation errors or user already exists
 * @returns {Object} 500 - Internal server error
 *
 * @example
 * // Request body
 * {
 *   "email": "user@example.com",
 *   "password": "Password@123"
 * }
 *
 * // Success response
 * {
 *   "message": "User created successfully",
 *   "user": {
 *     "id": "clx1234567890",
 *     "email": "user@example.com",
 *     "firstName": "User",
 *     "lastName": "User",
 *     "role": "EMPLOYEE",
 *     "department": null,
 *     "position": null
 *   },
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 */
router.post(
  '/register',
  authRateLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('firstName').isString().trim().notEmpty(),
    body('lastName').isString().trim().notEmpty(),
    body('password').isLength({ min: 8 }),
  ],
  async (req: Request, res: Response) => {
    // Log that the request reached the handler
    const requestEmail = req.body?.email || 'unknown';
    logger.logInfo(
      `[REGISTER] Registration request received for email: ${requestEmail}`,
      undefined,
      req.method,
      req.originalUrl || req.url
    );
    logger.logInfo(
      `[REGISTER] Request body: ${JSON.stringify(sanitizeForLogging(req.body))}`,
      undefined,
      req.method,
      req.originalUrl || req.url
    );
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.logWarning(
          `Registration validation failed for email: ${req.body?.email || 'unknown'}`,
          undefined,
          req.method,
          req.originalUrl || req.url
        );
        logger.logError(
          `Registration validation errors: ${JSON.stringify(errors.array())}`,
          { validationErrors: errors.array(), requestBody: sanitizeForLogging(req.body) },
          undefined,
          req.method,
          req.originalUrl || req.url
        );
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, firstName, lastName } = req.body;
      const role = 'EMPLOYEE';

      // Validate password strength
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        logger.logWarning(
          `Registration password validation failed for email: ${email}`,
          undefined,
          req.method,
          req.originalUrl || req.url
        );
        logger.logError(
          `Password validation failed: ${passwordValidation.message}`,
          { email, passwordLength: password?.length, validationMessage: passwordValidation.message },
          undefined,
          req.method,
          req.originalUrl || req.url
        );
        return res.status(400).json({
          message: passwordValidation.message,
        });
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      // Use generic message to prevent account enumeration
      if (existingUser) {
        logger.logWarning(
          `Registration attempt with existing email: ${email}`,
          undefined,
          req.method,
          req.originalUrl || req.url
        );
        return res.status(400).json({
          message: 'Unable to complete registration. Please check your information and try again.',
        });
      }

      // Hash password with bcrypt (12 rounds for security)
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user in database
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          position: true,
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

      // Generate JWT access token with 1-hour expiration
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, type: 'access' },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      // Generate refresh token with 7-day expiration
      const refreshToken = jwt.sign(
        { id: user.id, type: 'refresh' },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      logger.logAuth('register', email, true);
      res.status(201).json({
        message: 'User created successfully',
        user,
        token,
        refreshToken,
      });
    } catch (error: any) {
      // Enhanced error logging with detailed information
      const errorMessage = error?.message || 'Unknown error';
      const errorStack = error?.stack || 'No stack trace';
      const errorName = error?.name || 'Error';
      const errorCode = error?.code || null;
      const prismaMeta = error?.meta || null;
      
      // Build detailed error info object
      const errorInfo: any = {
        name: errorName,
        message: errorMessage,
        code: errorCode,
        stack: errorStack,
        requestBody: sanitizeForLogging({
          email: req.body?.email,
          firstName: req.body?.firstName,
          lastName: req.body?.lastName,
          // Don't log password
        }),
      };
      
      // Add Prisma-specific error details if available
      if (errorCode) {
        errorInfo.prismaCode = errorCode;
        errorInfo.prismaMeta = prismaMeta;
      }
      
      // Log the detailed error
      logger.logError(
        `Registration error for email: ${req.body?.email || 'unknown'} - ${errorMessage}`,
        errorInfo,
        undefined,
        req.method,
        req.originalUrl || req.url
      );
      
      // Log additional context for common error types
      if (errorCode === 'P2002') {
        logger.logError(
          `Registration failed: Unique constraint violation - Email ${req.body?.email} may already exist`,
          { constraint: prismaMeta?.target, email: req.body?.email },
          undefined,
          req.method,
          req.originalUrl || req.url
        );
      } else if (errorCode) {
        logger.logError(
          `Registration failed: Database error code ${errorCode}`,
          { code: errorCode, meta: prismaMeta },
          undefined,
          req.method,
          req.originalUrl || req.url
        );
      }
      
      // Return generic error message to client (security best practice)
      res.status(500).json({ 
        message: 'Unable to complete registration. Please check your information and try again.' 
      });
    }
  }
);

/**
 * User login endpoint
 *
 * Authenticates user credentials and returns JWT token if valid.
 * Updates last login timestamp and validates user account status.
 *
 * @route POST /auth/login
 *
 * @param {Object} req.body - Request body containing login credentials
 * @param {string} req.body.email - User's email address
 * @param {string} req.body.password - User's password
 *
 * @returns {Object} 200 - Login successful
 * @returns {Object} 400 - Validation errors
 * @returns {Object} 401 - Invalid credentials or inactive account
 * @returns {Object} 500 - Internal server error
 *
 * @example
 * // Request body
 * {
 *   "email": "user@example.com",
 *   "password": "Password@123"
 * }
 *
 * // Success response
 * {
 *   "message": "Login successful",
 *   "user": {
 *     "id": "clx1234567890",
 *     "email": "user@example.com",
 *     "firstName": "John",
 *     "lastName": "Doe",
 *     "role": "EMPLOYEE",
 *     "department": "Engineering",
 *     "position": "Developer"
 *   },
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 */
router.post(
  '/login',
  authRateLimiter,
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    const { email, password } = req.body;

    logger.logDebug('Login attempt started', undefined, 'POST', '/auth/login');

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.logWarning(
          'Login validation failed',
          undefined,
          'POST',
          '/auth/login'
        );
        return res.status(400).json({ errors: errors.array() });
      }

      logger.logDebug(
        'Looking up user by email',
        undefined,
        'POST',
        '/auth/login'
      );
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          password: true,
          role: true,
          position: true,
          isActive: true,
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

      logger.logDatabaseOperation('SELECT', 'users', undefined);

      // Check if user exists and is active
      if (!user || !user.isActive) {
        logger.logWarning(
          'Login failed - user not found or inactive',
          undefined,
          'POST',
          '/auth/login'
        );
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      logger.logDebug('Verifying password', undefined, 'POST', '/auth/login');
      // Verify password using bcrypt
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        logger.logWarning(
          'Login failed - invalid password',
          undefined,
          'POST',
          '/auth/login'
        );
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      logger.logDebug(
        'Updating last login timestamp',
        undefined,
        'POST',
        '/auth/login'
      );
      // Update last login timestamp
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      logger.logDatabaseOperation('UPDATE', 'users', undefined);

      logger.logDebug('Generating JWT token', undefined, 'POST', '/auth/login');
      // Generate JWT access token with 1-hour expiration
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, type: 'access' },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      // Generate refresh token with 7-day expiration
      const refreshToken = jwt.sign(
        { id: user.id, type: 'refresh' },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      // Get IP address and user agent for session tracking
      const ipAddress =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
        (req.headers['x-real-ip'] as string) ||
        req.socket.remoteAddress ||
        'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';

      // Create session record
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now

      await prisma.session.create({
        data: {
          userId: user.id,
          token,
          ipAddress,
          userAgent,
          lastActivityAt: now,
          expiresAt,
          isActive: true,
        },
      });

      logger.logDatabaseOperation('INSERT', 'sessions', user.id);

      // Prepare user data for response (excluding password)
      const userData = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        position: user.position,
        userTeams: user.userTeams,
      };

      const responseTime = Date.now() - startTime;
      logger.logAuth('login', email, true);
      logger.logInfo(
        'Login completed successfully',
        undefined,
        'POST',
        '/auth/login'
      );

      res.json({
        message: 'Login successful',
        user: userData,
        token,
        refreshToken,
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.logError(
        'Login error',
        sanitizeForLogging({
          email,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          responseTime: `${responseTime}ms`,
        })
      );
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

/**
 * Change password endpoint for authenticated users
 *
 * Allows logged-in users to change their password by providing
 * their current password and a new password. Requires authentication.
 *
 * @route PATCH /auth/change-password
 * @auth Requires valid JWT token
 *
 * @param {Object} req.body - Request body containing password data
 * @param {string} req.body.currentPassword - User's current password
 * @param {string} req.body.newPassword - User's new password (minimum 6 characters)
 *
 * @returns {Object} 200 - Password changed successfully
 * @returns {Object} 400 - Validation errors
 * @returns {Object} 401 - Invalid current password or authentication required
 * @returns {Object} 500 - Internal server error
 *
 * @example
 * // Request body
 * {
 *   "currentPassword": "oldPassword@123",
 *   "newPassword": "newSecurePassword@123"
 * }
 *
 * // Success response
 * {
 *   "message": "Password changed successfully"
 * }
 */
router.patch(
  '/change-password',
  authenticateToken,
  authRateLimiter,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long')
      .custom((value) => {
        const validation = validatePasswordStrength(value);
        if (!validation.isValid) {
          throw new Error(validation.message);
        }
        return true;
      }),
  ],
  async (req: AuthRequest, res: Response) => {
    const startTime = Date.now();
    const { currentPassword, newPassword } = req.body;

    logger.logDebug(
      'Password change request initiated',
      req.user?.id,
      'PATCH',
      '/auth/change-password'
    );

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.logWarning(
          'Password change validation failed',
          req.user?.id,
          'PATCH',
          '/auth/change-password'
        );
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Fetch user with password to verify current password
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          password: true,
          isActive: true,
        },
      });

      if (!user || !user.isActive) {
        logger.logWarning(
          'Password change failed - user not found or inactive',
          req.user.id,
          'PATCH',
          '/auth/change-password'
        );
        return res.status(404).json({ message: 'Resource not found' });
      }

      // Verify current password
      logger.logDebug(
        'Verifying current password',
        req.user.id,
        'PATCH',
        '/auth/change-password'
      );
      const isValidPassword = await bcrypt.compare(
        currentPassword,
        user.password
      );

      if (!isValidPassword) {
        logger.logWarning(
          'Password change failed - invalid current password',
          req.user.id,
          'PATCH',
          '/auth/change-password'
        );
        return res.status(401).json({ message: 'Invalid current password' });
      }

      // Check if new password is different from current password
      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        logger.logWarning(
          'Password change failed - new password same as current',
          req.user.id,
          'PATCH',
          '/auth/change-password'
        );
        return res.status(400).json({
          message: 'New password must be different from current password',
        });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update user's password
      await prisma.user.update({
        where: { id: req.user.id },
        data: {
          password: hashedPassword,
        },
      });

      logger.logDatabaseOperation('UPDATE', 'users', req.user.id);

      const responseTime = Date.now() - startTime;
      logger.logInfo(
        'Password change completed successfully',
        req.user.id,
        'PATCH',
        '/auth/change-password'
      );

      res.json({
        message: 'Password changed successfully',
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.logError(
        'Error during password change',
        sanitizeForLogging({
          userId: req.user?.id,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          responseTime: `${responseTime}ms`,
        })
      );
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

/**
 * Verify password reset token
 *
 * Checks if a password reset token is valid and not expired.
 * This endpoint is used to verify the token before showing the reset form.
 *
 * @route GET /auth/reset-password/:token
 *
 * @param {string} token - Password reset token from email link
 *
 * @returns {Object} 200 - Token is valid
 * @returns {Object} 400 - Token is invalid or expired
 * @returns {Object} 404 - Token not found
 *
 * @example
 * // Success response
 * {
 *   "valid": true,
 *   "email": "user@example.com"
 * }
 */
router.get('/reset-password/:token', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const { token } = req.params;

  try {
    logger.logDebug(
      'Password reset token verification request',
      undefined,
      'GET',
      '/auth/reset-password/:token'
    );

    // Find user with this reset token
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date(), // Token must not be expired
        },
      },
      select: {
        id: true,
        email: true,
        isActive: true,
      },
    });

    if (!user) {
      logger.logWarning(
        'Password reset token verification failed - invalid or expired token',
        undefined,
        'GET',
        '/auth/reset-password/:token'
      );
      return res.status(400).json({
        valid: false,
        message: 'Invalid or expired reset token',
      });
    }

    if (!user.isActive) {
      logger.logWarning(
        'Password reset token verification failed - user is inactive',
        undefined,
        'GET',
        '/auth/reset-password/:token'
      );
      return res.status(400).json({
        valid: false,
        message: 'User account is inactive',
      });
    }

    const responseTime = Date.now() - startTime;
    logger.logInfo(
      'Password reset token verified successfully',
      undefined,
      'GET',
      '/auth/reset-password/:token'
    );

    res.json({
      valid: true,
      email: user.email,
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.logError('Error verifying password reset token', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * Reset password using token
 *
 * Allows users to reset their password using a valid reset token.
 * The token must be valid and not expired. After successful reset,
 * the token is cleared from the database.
 *
 * @route POST /auth/reset-password
 *
 * @param {Object} req.body - Request body
 * @param {string} req.body.token - Password reset token
 * @param {string} req.body.password - New password (minimum 6 characters)
 *
 * @returns {Object} 200 - Password reset successfully
 * @returns {Object} 400 - Validation errors or invalid token
 * @returns {Object} 500 - Internal server error
 *
 * @example
 * // Request body
 * {
 *   "token": "abc123...",
 *   "password": "newSecurePassword@123"
 * }
 *
 * // Success response
 * {
 *   "message": "Password reset successfully"
 * }
 */
router.post(
  '/reset-password',
  authRateLimiter,
  [
    body('token')
      .notEmpty()
      .withMessage('Reset token is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .custom((value) => {
        const validation = validatePasswordStrength(value);
        if (!validation.isValid) {
          throw new Error(validation.message);
        }
        return true;
      }),
  ],
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    const { token, password } = req.body;

    try {
      logger.logDebug(
        'Password reset request initiated',
        undefined,
        'POST',
        '/auth/reset-password'
      );

      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.logWarning(
          'Password reset validation failed',
          undefined,
          'POST',
          '/auth/reset-password'
        );
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      // Find user with this reset token
      const user = await prisma.user.findFirst({
        where: {
          passwordResetToken: token,
          passwordResetExpires: {
            gt: new Date(), // Token must not be expired
          },
        },
        select: {
          id: true,
          email: true,
          isActive: true,
        },
      });

      if (!user) {
        logger.logWarning(
          'Password reset failed - invalid or expired token',
          undefined,
          'POST',
          '/auth/reset-password'
        );
        return res.status(400).json({
          message: 'Invalid or expired reset token',
        });
      }

      if (!user.isActive) {
        logger.logWarning(
          'Password reset failed - user is inactive',
          undefined,
          'POST',
          '/auth/reset-password'
        );
        return res.status(400).json({
          message: 'User account is inactive',
        });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Update user's password and clear reset token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          passwordResetToken: null,
          passwordResetExpires: null,
        },
      });

      logger.logDatabaseOperation('UPDATE', 'users', undefined);

      const responseTime = Date.now() - startTime;
      logger.logInfo(
        `Password reset completed successfully for ${user.email}`,
        undefined,
        'POST',
        '/auth/reset-password'
      );

      res.json({
        message: 'Password reset successfully',
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.logError('Error during password reset', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

/**
 * Refresh access token using refresh token
 *
 * Allows users to get a new access token using a valid refresh token.
 * This enables longer sessions without requiring re-authentication.
 *
 * @route POST /auth/refresh
 *
 * @param {Object} req.body - Request body
 * @param {string} req.body.refreshToken - Refresh token from login/register
 *
 * @returns {Object} 200 - New access token generated
 * @returns {Object} 401 - Invalid or expired refresh token
 * @returns {Object} 500 - Internal server error
 *
 * @example
 * // Request body
 * {
 *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 *
 * // Success response
 * {
 *   "message": "Token refreshed successfully",
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 */
router.post(
  '/refresh',
  [
    body('refreshToken')
      .notEmpty()
      .withMessage('Refresh token is required'),
  ],
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    const { refreshToken } = req.body;

    try {
      logger.logDebug(
        'Refresh token request initiated',
        undefined,
        'POST',
        '/auth/refresh'
      );

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Verify refresh token
      let decoded: any;
      try {
        decoded = jwt.verify(
          refreshToken,
          process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!
        );
      } catch (error) {
        logger.logWarning(
          'Refresh token verification failed - invalid or expired',
          undefined,
          'POST',
          '/auth/refresh'
        );
        return res.status(401).json({
          message: 'Invalid or expired refresh token',
        });
      }

      // Check token type
      if (decoded.type !== 'refresh') {
        logger.logWarning(
          'Refresh token verification failed - wrong token type',
          undefined,
          'POST',
          '/auth/refresh'
        );
        return res.status(401).json({
          message: 'Invalid token type',
        });
      }

      // Verify user exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
        },
      });

      if (!user || !user.isActive) {
        logger.logWarning(
          'Refresh token verification failed - user not found or inactive',
          decoded.id,
          'POST',
          '/auth/refresh'
        );
        return res.status(401).json({
          message: 'Invalid refresh token',
        });
      }

      // Generate new access token
      const newToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role, type: 'access' },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      // Generate new refresh token (rotate refresh token for security)
      const newRefreshToken = jwt.sign(
        { id: user.id, type: 'refresh' },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      // Update session with new token if old token session exists
      const oldToken = req.body.refreshToken
        ? undefined
        : req.headers['authorization']?.split(' ')[1];
      
      if (oldToken) {
        const session = await prisma.session.findFirst({
          where: {
            token: oldToken,
            userId: user.id,
            isActive: true,
          },
        });

        if (session) {
          const now = new Date();
          const newExpiresAt = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours

          await prisma.session.update({
            where: { id: session.id },
            data: {
              token: newToken,
              lastActivityAt: now,
              expiresAt: newExpiresAt,
            },
          });
        }
      }

      const responseTime = Date.now() - startTime;
      logger.logInfo(
        'Token refreshed successfully',
        user.id,
        'POST',
        '/auth/refresh'
      );

      res.json({
        message: 'Token refreshed successfully',
        token: newToken,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.logError(
        'Error refreshing token',
        sanitizeForLogging(error)
      );
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

/**
 * Logout endpoint
 *
 * Deactivates the current user's session.
 * Requires authentication.
 *
 * @route POST /auth/logout
 * @auth Requires valid JWT token
 *
 * @returns {Object} 200 - Logout successful
 * @returns {Object} 401 - Authentication required
 * @returns {Object} 500 - Internal server error
 */
router.post(
  '/logout',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (token) {
        // Deactivate all active sessions for this token
        await prisma.session.updateMany({
          where: {
            token,
            userId: req.user.id,
            isActive: true,
          },
          data: {
            isActive: false,
          },
        });

        logger.logDatabaseOperation('UPDATE', 'sessions', req.user.id);
      }

      logger.logAuth('logout', req.user.email, true);
      res.json({ message: 'Logout successful' });
    } catch (error) {
      logger.logError('Error during logout', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

export { router as authRoutes };
