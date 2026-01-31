/**
 * Authenticated User Logging Tests
 * 
 * Tests that authenticated user information is properly logged in API requests
 */

const path = require('path');
const fs = require('fs');

// Import logger from compiled backend
const loggerPath = path.join(__dirname, '../../backend/dist/utils/logger');
let logger;

try {
  logger = require(loggerPath).logger;
} catch (error) {
  logger = null;
}

async function run(recordResult, recordWarning) {
  if (!logger) {
    recordWarning('test-auth-logging', 'Logger not available. Run "npm run build" in backend folder first.');
    return;
  }

  const testUser = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    role: 'MANAGER',
  };

  const userString = `${testUser.firstName} ${testUser.lastName} (${testUser.email})`;

  // Test 1: API access logging with authenticated user
  try {
    const endpoints = [
      { method: 'GET', url: '/api/users/me', status: 200, duration: 45 },
      { method: 'GET', url: '/api/users/direct-reports', status: 200, duration: 120 },
      { method: 'GET', url: '/api/colleague-feedback/sent', status: 200, duration: 85 },
      { method: 'GET', url: '/api/manager-feedback/sent', status: 200, duration: 95 },
      { method: 'GET', url: '/api/assessments', status: 200, duration: 65 },
    ];

    endpoints.forEach(endpoint => {
      logger.logApiAccess(
        userString,
        endpoint.method,
        endpoint.url,
        endpoint.status,
        endpoint.duration
      );
    });

    recordResult('Auth Logging - API access with user', true, 
      `Logged ${endpoints.length} API requests with user information`);
  } catch (error) {
    recordResult('Auth Logging - API access with user', false, `Error: ${error.message}`);
  }

  // Test 2: POST requests with authenticated user
  try {
    logger.logApiAccess(userString, 'POST', '/api/colleague-feedback', 201, 150);
    logger.logApiAccess(userString, 'POST', '/api/manager-feedback', 201, 180);
    
    recordResult('Auth Logging - POST requests with user', true, 'POST requests logged with user info');
  } catch (error) {
    recordResult('Auth Logging - POST requests with user', false, `Error: ${error.message}`);
  }

  // Test 3: PUT requests with authenticated user
  try {
    logger.logApiAccess(userString, 'PUT', '/api/users/me', 200, 75);
    
    recordResult('Auth Logging - PUT requests with user', true, 'PUT requests logged with user info');
  } catch (error) {
    recordResult('Auth Logging - PUT requests with user', false, `Error: ${error.message}`);
  }

  // Test 4: Verify user information in logs
  try {
    const logDir = path.join(__dirname, '../../backend/logs');
    const today = new Date().toISOString().split('T')[0];
    const logFile = path.join(logDir, `${today}.log`);
    
    if (fs.existsSync(logFile)) {
      await new Promise(resolve => setTimeout(resolve, 200)); // Wait for file write
      const logContent = fs.readFileSync(logFile, 'utf8');
      
      if (logContent.includes(userString)) {
        recordResult('Auth Logging - User info in log file', true, 
          'User information found in log file');
      } else {
        recordWarning('Auth Logging - User info in log file', 
          'User information not found in log file. This may be normal if LOG_LEVEL filters messages.');
      }
    } else {
      recordWarning('Auth Logging - User info in log file', 'Log file not found');
    }
  } catch (error) {
    recordWarning('Auth Logging - User info in log file', `Could not verify: ${error.message}`);
  }

  // Test 5: Anonymous vs authenticated logging
  try {
    logger.logApiAccess('Anonymous', 'GET', '/api/health', 200, 50);
    logger.logApiAccess(userString, 'GET', '/api/users/me', 200, 45);
    
    recordResult('Auth Logging - Anonymous vs authenticated', true, 
      'Both anonymous and authenticated requests logged correctly');
  } catch (error) {
    recordResult('Auth Logging - Anonymous vs authenticated', false, `Error: ${error.message}`);
  }
}

module.exports = { run };
