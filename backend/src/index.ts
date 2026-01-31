/**
 * @fileoverview Main server entry point for the Performance360 Backend
 *
 * This file sets up the Express server with all necessary middleware,
 * security configurations, and route handlers for the performance management
 * and feedback application.
 *
 * @author Performance360 Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import achievementsObservationsRoutes from './routes/achievements-observations';
import { assessmentRoutes } from './routes/assessments';
import { authRoutes } from './routes/auth';
import { businessUnitRoutes } from './routes/business-units';
import { colleagueFeedbackRoutes } from './routes/colleague-feedback';
import jiraConfigurationsRoutes from './routes/jira-configurations';
import jiraStatisticsRoutes from './routes/jira-statistics';
import jiraTicketsRoutes from './routes/jira-tickets';
import { managerFeedbackRoutes } from './routes/manager-feedback';
import monthlyAttendanceRoutes from './routes/monthly-attendance';
import quarterlyPerformanceRoutes from './routes/quarterly-performance';
import { teamRoutes } from './routes/teams';
import { userRoutes } from './routes/users';
import { sessionRoutes } from './routes/sessions';

import { authenticateToken } from './middleware/auth';
import { checkSessionTimeout, trackSessionActivity } from './middleware/sessionTracking';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger, responseLogger } from './middleware/requestLogger';
import { logger } from './utils/logger';

// Load environment variables from .env file
dotenv.config();

// Validate environment variables on startup
import { validateEnvironmentVariables } from './utils/envValidation';
try {
  validateEnvironmentVariables();
} catch (error) {
  console.error('❌ Environment validation failed:', error);
  process.exit(1);
}

/**
 * Express application instance
 */
const app = express();

/**
 * Server port number from environment variables or default to 3001
 */
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration for cross-origin requests
const corsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      logger.logDebug('CORS: Allowing request with no origin');
      return callback(null, true);
    }

    // In development mode, be more permissive
    if (process.env.NODE_ENV === 'development') {
      logger.logDebug(
        'CORS: Development mode - allowing origin',
        undefined,
        undefined,
        origin
      );
      return callback(null, true);
    }

    // Get allowed origins from environment variable
    const allowedOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
      : [
          'http://localhost:3000',
          'http://127.0.0.1:3000',
          'http://MSGN-6TFBR24:3000',
        ];

    // If ALLOWED_ORIGINS is set to "*", allow all origins
    if (process.env.ALLOWED_ORIGINS === '*') {
      logger.logWarning(
        'CORS: Allowing all origins (wildcard)',
        undefined,
        undefined,
        origin
      );
      return callback(null, true);
    }

    // Add the FRONTEND_URL if it's set
    if (
      process.env.FRONTEND_URL &&
      !allowedOrigins.includes(process.env.FRONTEND_URL)
    ) {
      allowedOrigins.push(process.env.FRONTEND_URL);
    }

    // Check if the origin is allowed
    if (allowedOrigins.includes(origin)) {
      logger.logDebug('CORS: Allowing origin', undefined, undefined, origin);
      callback(null, true);
    } else {
      logger.logWarning(
        'CORS blocked request from unauthorized origin',
        undefined,
        undefined,
        origin
      );
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));

// Global request logging middleware
app.use(requestLogger);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/**
 * Health check endpoint
 * Returns server status and current timestamp
 *
 * @route GET /health
 * @returns {Object} Server status object with timestamp
 */
app.get('/health', (req, res) => {
  logger.logDebug('Health check requested');
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);

// Test cleanup routes (no authentication required) - only in non-production
// Also enable in test environment or if explicitly enabled via env var
const nodeEnv = process.env.NODE_ENV;
const enableTestRoutes = 
  nodeEnv === 'test' ||
  (nodeEnv !== undefined && nodeEnv !== 'production') || 
  process.env.ENABLE_TEST_ROUTES === 'true';

// Check if ENABLE_TEST_ROUTES is explicitly set to 'true'
const isTestRoutesExplicitlyEnabled = process.env.ENABLE_TEST_ROUTES === 'true';

if (enableTestRoutes) {
  app.use('/api/test-cleanup', userRoutes);
  console.log('🔧 Test cleanup routes enabled');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log('   Available endpoints:');
  console.log('   - POST /api/test-cleanup/create-user');
  console.log('   - DELETE /api/test-cleanup/delete');
  console.log('   - DELETE /api/test-cleanup/delete-pattern');
  console.log('   - PUT /api/test-cleanup/assign-manager');
} else {
  console.log('⚠️  Test cleanup routes disabled (production mode)');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log('   To enable: Set NODE_ENV=development or ENABLE_TEST_ROUTES=true');
}

// Display prominent security warning if ENABLE_TEST_ROUTES is explicitly enabled
if (isTestRoutesExplicitlyEnabled) {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                              ║');
  console.log('║                    ⚠️  SECURITY WARNING ⚠️                                   ║');
  console.log('║                                                                              ║');
  console.log('║  ENABLE_TEST_ROUTES=true is set. This configuration is NOT SECURE and      ║');
  console.log('║  should ONLY be used for testing purposes.                                  ║');
  console.log('║                                                                              ║');
  console.log('║  ⛔ DO NOT use this in production environments                              ║');
  console.log('║  ⛔ Test routes expose unauthenticated endpoints                            ║');
  console.log('║  ⛔ This can lead to unauthorized data access and manipulation              ║');
  console.log('║                                                                              ║');
  console.log('║  Use this ONLY for local development and testing.                          ║');
  console.log('║                                                                              ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
  console.log('');
}

// Protected API routes (authentication required)
// Session timeout check and activity tracking middleware for authenticated routes
const protectedRoutes = [
  authenticateToken,
  checkSessionTimeout,
  trackSessionActivity,
  responseLogger,
];

app.use('/api/users', ...protectedRoutes, userRoutes);
app.use(
  '/api/colleague-feedback',
  ...protectedRoutes,
  colleagueFeedbackRoutes
);
app.use(
  '/api/manager-feedback',
  ...protectedRoutes,
  managerFeedbackRoutes
);
app.use(
  '/api/assessments',
  ...protectedRoutes,
  assessmentRoutes
);
app.use(
  '/api/quarterly-performance',
  ...protectedRoutes,
  quarterlyPerformanceRoutes
);

app.use(
  '/api/jira-statistics',
  ...protectedRoutes,
  jiraStatisticsRoutes
);

app.use('/api/jira-tickets', responseLogger, jiraTicketsRoutes);
app.use(
  '/api/jira-configurations',
  ...protectedRoutes,
  jiraConfigurationsRoutes
);
app.use(
  '/api/achievements-observations',
  ...protectedRoutes,
  achievementsObservationsRoutes
);
app.use('/api/teams', ...protectedRoutes, teamRoutes);
app.use(
  '/api/business-units',
  ...protectedRoutes,
  businessUnitRoutes
);
app.use(
  '/api/monthly-attendance',
  ...protectedRoutes,
  monthlyAttendanceRoutes
);

// Session management routes (Admin only)
app.use('/api/sessions', responseLogger, sessionRoutes);

// Error handling middleware
app.use(errorHandler);

/**
 * 404 handler for unmatched routes
 * Returns a JSON error message for any undefined routes
 */
app.use('*', (req, res) => {
  logger.logWarning('Route not found', undefined, req.method, req.url);
  res.status(404).json({ message: 'Route not found' });
});

/**
 * Start the server and listen on the specified port
 * Logs server startup information to console
 */
app.listen(Number(PORT), '0.0.0.0', () => {
  logger.logInfo(`Server starting on port ${PORT}`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📝 Logs directory: backend/logs/`);
  console.log(`📅 Log files: Date-based (YYYY-MM-DD.log)`);
  
  // Display security warning again at server startup if test routes are enabled
  if (isTestRoutesExplicitlyEnabled) {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                    ⚠️  SECURITY WARNING: TEST MODE ACTIVE ⚠️                ║');
    console.log('║  ENABLE_TEST_ROUTES=true - NOT SECURE - USE ONLY FOR TESTING               ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
    console.log('');
  }
});
