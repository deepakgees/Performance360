/**
 * @fileoverview Request logging middleware
 *
 * This middleware automatically logs all incoming requests and outgoing responses
 * with detailed information for debugging and monitoring purposes.
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

// Middleware to log incoming requests (before authentication)
export const requestLogger = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();

  // Store start time for later use
  (req as any).startTime = startTime;

  // Extract user information - handle both authenticated and anonymous requests
  let user = 'Anonymous';
  if (req.user) {
    user = `${req.user.firstName} ${req.user.lastName} (${req.user.email})`;
  }

  // Log the incoming request
  logger.logInfo(
    `Incoming ${req.method} request to ${req.originalUrl}`,
    user,
    req.method,
    req.originalUrl
  );

  // Log request body for registration and login endpoints (for debugging)
  if ((req.originalUrl || req.url).includes('/api/auth/register') && req.method === 'POST') {
    const sanitizedBody = sanitizeForLogging(req.body);
    logger.logInfo(
      `[REQUEST-LOGGER] Registration request body: ${JSON.stringify(sanitizedBody)}`,
      user,
      req.method,
      req.originalUrl
    );
  }

  next();
};

// Middleware to log API access (after authentication)
export const responseLogger = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();

  // Store start time for later use
  (req as any).startTime = startTime;

  // Extract user information - handle both authenticated and anonymous requests
  let user = 'Anonymous';
  if (req.user) {
    user = `${req.user.firstName} ${req.user.lastName} (${req.user.email})`;
  }

  // Log the incoming request (after authentication, so we have user info)
  logger.logInfo(
    `Incoming ${req.method} request to ${req.originalUrl}`,
    user,
    req.method,
    req.originalUrl
  );

  // Override res.end to capture response details
  const originalEnd = res.end;
  res.end = function (this: Response, chunk?: any, encoding?: any): Response {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Log the API access with response details
    logger.logApiAccess(
      user,
      req.method!,
      req.originalUrl,
      statusCode,
      duration
    );

    // Call the original end method
    return originalEnd.call(this, chunk, encoding);
  };

  next();
};
