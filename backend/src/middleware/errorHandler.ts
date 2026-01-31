/**
 * @fileoverview Global error handling middleware
 *
 * This module provides centralized error handling for the Performance360 API.
 * It catches and processes different types of errors, providing appropriate
 * HTTP status codes and error messages to clients.
 *
 * @author Performance360 Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { sanitizeForLogging } from '../utils/sanitizeLogs';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

/**
 * Global error handler middleware
 *
 * Catches all errors thrown in the application and returns
 * appropriate HTTP status codes and error messages based on
 * the error type.
 *
 * @param err - The error object that was thrown
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function (not used in error handlers)
 *
 * @example
 * // Throwing an error in a route
 * app.get('/test', (req, res, next) => {
 *   try {
 *     throw new Error('Something went wrong');
 *   } catch (error) {
 *     next(error); // This will be caught by errorHandler
 *   }
 * });
 *
 * @returns {Object} JSON response with appropriate error message and status code
 *
 * @throws {400} For validation errors
 * @throws {401} For unauthorized access errors
 * @throws {500} For internal server errors
 */
export const errorHandler = (
  err: any,
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const user = req.user
    ? `${req.user.firstName} ${req.user.lastName} (${req.user.email})`
    : 'Anonymous';

  // Extract detailed error information
  const errorMessage = err?.message || 'Unknown error';
  const errorStack = err?.stack || 'No stack trace';
  const errorName = err?.name || 'Error';
  const errorCode = err?.code || null;
  
  // Build comprehensive error info object
  const errorInfo: any = {
    name: errorName,
    message: errorMessage,
    code: errorCode,
    stack: errorStack,
    requestBody: sanitizeForLogging(req.body),
    requestQuery: sanitizeForLogging(req.query),
    requestParams: sanitizeForLogging(req.params),
    url: req.originalUrl || req.url,
    method: req.method,
    userAgent: req.headers['user-agent'] || 'unknown',
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown',
  };

  // Add Prisma-specific error details if available
  if (err?.code) {
    errorInfo.prismaCode = err.code;
    errorInfo.prismaMeta = err.meta || null;
  }

  // Add all error properties for debugging
  if (err && typeof err === 'object') {
    Object.keys(err).forEach(key => {
      if (!['message', 'stack', 'name', 'code', 'meta'].includes(key)) {
        errorInfo[`error_${key}`] = err[key];
      }
    });
  }

  // Log detailed error information
  logger.logError(
    `[ERROR-HANDLER] ${errorName}: ${errorMessage} - ${req.method} ${req.originalUrl || req.url}`,
    errorInfo,
    user,
    req.method,
    req.originalUrl || req.url
  );

  // Log to console for immediate visibility
  console.error(`[ERROR-HANDLER] ⚠️  ${errorName}: ${errorMessage}`);
  console.error(`  Method: ${req.method}`);
  console.error(`  URL: ${req.originalUrl || req.url}`);
  console.error(`  User: ${user}`);
  console.error(`  Error Code: ${errorCode || 'N/A'}`);
  if (errorStack && errorStack !== 'No stack trace') {
    console.error(`  Stack: ${errorStack}`);
  }

  // Handle validation errors (e.g., from express-validator)
  if (err.name === 'ValidationError' || err.name === 'ExpressValidatorError') {
    logger.logWarning(
      `[ERROR-HANDLER] Validation error: ${errorMessage}`,
      user,
      req.method,
      req.originalUrl || req.url
    );
    return res.status(400).json({
      message: 'Validation error',
      errors: err.message,
    });
  }

  // Handle unauthorized errors (e.g., from JWT verification)
  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    logger.logWarning(
      `[ERROR-HANDLER] Unauthorized access attempt: ${errorMessage}`,
      user,
      req.method,
      req.originalUrl || req.url
    );
    return res.status(401).json({
      message: 'Unauthorized',
    });
  }

  // Handle Prisma errors
  if (err?.code && err.code.startsWith('P')) {
    logger.logError(
      `[ERROR-HANDLER] Prisma error ${err.code}: ${errorMessage}`,
      errorInfo,
      user,
      req.method,
      req.originalUrl || req.url
    );
    
    // Return appropriate status based on Prisma error code
    if (err.code === 'P2002') {
      return res.status(409).json({
        message: 'Unable to complete registration. Please check your information and try again.',
      });
    }
  }

  // Default error response for unhandled errors
  res.status(500).json({
    message: 'Internal server error',
  });
};
