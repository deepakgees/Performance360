/**
 * @fileoverview Rate limiting middleware
 *
 * This module provides rate limiting middleware to protect endpoints
 * from brute force attacks and abuse.
 *
 * @author Performance360 Team
 * @version 1.0.0
 */

import { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';
import { sanitizeForLogging } from '../utils/sanitizeLogs';

/**
 * Get client IP address from request
 */
function getClientIp(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    (req.headers['x-real-ip'] as string) ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

/**
 * Get rate limit configuration from environment variables
 * Defaults to higher limits for development, stricter for production
 */
const getAuthRateLimitConfig = () => {
  const windowMs = parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '900000', 10); // Default: 15 minutes
  const max = parseInt(process.env.AUTH_RATE_LIMIT_MAX || (process.env.NODE_ENV === 'production' ? '10' : '50'), 10);
  return { windowMs, max };
};

/**
 * Get general rate limit configuration from environment variables
 */
const getGeneralRateLimitConfig = () => {
  const windowMs = parseInt(process.env.GENERAL_RATE_LIMIT_WINDOW_MS || '900000', 10); // Default: 15 minutes
  const max = parseInt(process.env.GENERAL_RATE_LIMIT_MAX || (process.env.NODE_ENV === 'production' ? '100' : '1000'), 10);
  return { windowMs, max };
};

const authRateLimitConfig = getAuthRateLimitConfig();
const generalRateLimitConfig = getGeneralRateLimitConfig();

// Log rate limit configuration on startup
if (process.env.NODE_ENV !== 'production') {
  console.log('📊 Rate Limit Configuration:');
  console.log(`   Authentication: ${authRateLimitConfig.max} requests per ${authRateLimitConfig.windowMs / 1000 / 60} minutes`);
  console.log(`   General API: ${generalRateLimitConfig.max} requests per ${generalRateLimitConfig.windowMs / 1000 / 60} minutes`);
}

/**
 * Rate limiter for authentication endpoints
 * Configurable via AUTH_RATE_LIMIT_MAX and AUTH_RATE_LIMIT_WINDOW_MS environment variables
 * Defaults: 50 requests per 15 minutes (development) or 10 requests per 15 minutes (production)
 */
export const authRateLimiter = rateLimit({
  windowMs: authRateLimitConfig.windowMs,
  max: authRateLimitConfig.max,
  message: {
    error: 'Too many login attempts, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: false, // Count successful requests too
  skipFailedRequests: false, // Count failed requests
  handler: (req: Request, res: Response) => {
    const clientIp = getClientIp(req);
    const method = req.method;
    const url = req.originalUrl || req.url;
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    // Extract email from request body if available (for registration/login attempts)
    const requestBody = req.body || {};
    const sanitizedBody = sanitizeForLogging(requestBody);
    const email = requestBody.email || 'N/A';
    
    logger.logWarning(
      `[RATE-LIMIT] 429 Too Many Requests - Authentication endpoint rate limit exceeded`,
      undefined,
      method,
      url
    );
    
    logger.logError(
      `[RATE-LIMIT] Rate limit exceeded for authentication endpoint - IP: ${clientIp}, Email: ${email}`,
      {
        ip: clientIp,
        method,
        url,
        userAgent,
        endpoint: url,
        limitType: 'authentication',
        maxRequests: authRateLimitConfig.max,
        windowMs: authRateLimitConfig.windowMs,
        attemptedEmail: email,
        requestBody: sanitizedBody,
        timestamp: new Date().toISOString(),
      },
      undefined,
      method,
      url
    );
    
    // Also log to console for immediate visibility
    console.error(`[RATE-LIMIT] ⚠️  429 Error - Authentication rate limit exceeded`);
    console.error(`  IP: ${clientIp}`);
    console.error(`  Endpoint: ${method} ${url}`);
    console.error(`  Email: ${email}`);
    console.error(`  User-Agent: ${userAgent}`);
    
    res.status(429).json({
      error: 'Too many login attempts, please try again later.',
      message: 'Rate limit exceeded. Please wait before trying again.',
    });
  },
});

/**
 * General rate limiter for API endpoints
 * Configurable via GENERAL_RATE_LIMIT_MAX and GENERAL_RATE_LIMIT_WINDOW_MS environment variables
 * Defaults: 1000 requests per 15 minutes (development) or 100 requests per 15 minutes (production)
 */
export const generalRateLimiter = rateLimit({
  windowMs: generalRateLimitConfig.windowMs,
  max: generalRateLimitConfig.max,
  message: {
    error: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    const clientIp = getClientIp(req);
    const method = req.method;
    const url = req.originalUrl || req.url;
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    logger.logWarning(
      `[RATE-LIMIT] 429 Too Many Requests - General API endpoint rate limit exceeded`,
      undefined,
      method,
      url
    );
    
    logger.logError(
      `[RATE-LIMIT] Rate limit exceeded for general API endpoint - IP: ${clientIp}`,
      {
        ip: clientIp,
        method,
        url,
        userAgent,
        endpoint: url,
        limitType: 'general',
        maxRequests: generalRateLimitConfig.max,
        windowMs: generalRateLimitConfig.windowMs,
        timestamp: new Date().toISOString(),
      },
      undefined,
      method,
      url
    );
    
    // Also log to console for immediate visibility
    console.error(`[RATE-LIMIT] ⚠️  429 Error - General API rate limit exceeded`);
    console.error(`  IP: ${clientIp}`);
    console.error(`  Endpoint: ${method} ${url}`);
    console.error(`  User-Agent: ${userAgent}`);
    
    res.status(429).json({
      error: 'Too many requests, please try again later.',
      message: 'Rate limit exceeded. Please wait before trying again.',
    });
  },
});

