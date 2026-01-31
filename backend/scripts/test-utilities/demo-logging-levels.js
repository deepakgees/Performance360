/**
 * Logging Levels Demonstration Utility
 * 
 * Demonstrates how different log levels work and how they filter messages
 * 
 * Usage:
 *   LOG_LEVEL=ERROR node scripts/test-utilities/demo-logging-levels.js
 *   LOG_LEVEL=WARN node scripts/test-utilities/demo-logging-levels.js
 *   LOG_LEVEL=INFO node scripts/test-utilities/demo-logging-levels.js
 *   LOG_LEVEL=DEBUG node scripts/test-utilities/demo-logging-levels.js
 *   LOG_LEVEL=TRACE node scripts/test-utilities/demo-logging-levels.js
 */

// Set environment variable for testing
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'INFO';

// Simple logging function to demonstrate the concept
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const levelUpper = level.toUpperCase();

  // Check if we should log this level
  const levels = { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3, TRACE: 4 };
  const currentLevel = levels[process.env.LOG_LEVEL] || 2;
  const messageLevel = levels[levelUpper] || 2;

  if (messageLevel <= currentLevel) {
    const logMessage = `[${timestamp}] [${levelUpper}] ${message}`;
    if (data) {
      console.log(`${logMessage} ${JSON.stringify(data, null, 2)}`);
    } else {
      console.log(logMessage);
    }
  }
}

console.log('=== Logging Levels Demonstration ===');
console.log(`Current LOG_LEVEL: ${process.env.LOG_LEVEL}`);
console.log('');

// Test different log levels
log('error', 'This is an ERROR message', { errorCode: 500, userId: '123' });
log('warn', 'This is a WARNING message', {
  warningType: 'validation',
  field: 'email',
});
log('info', 'This is an INFO message', { action: 'user_login', userId: '123' });
log('debug', 'This is a DEBUG message', {
  query: 'SELECT * FROM users',
  params: { id: '123' },
});
log('trace', 'This is a TRACE message', {
  requestId: 'abc123',
  method: 'GET',
  url: '/api/users/direct-reports',
  headers: { authorization: 'Bearer [REDACTED]' },
  user: { id: '123', role: 'MANAGER' },
});

console.log('');
console.log('=== API Request/Response Logging Demonstration ===');

// Simulate API request logging
log('trace', 'API Request', {
  method: 'GET',
  url: '/api/users/direct-reports',
  headers: {
    'user-agent': 'Mozilla/5.0...',
    'content-type': 'application/json',
    authorization: 'Bearer [REDACTED]',
  },
  user: {
    id: '123',
    email: 'manager@example.com',
    role: 'MANAGER',
  },
});

// Simulate API response logging
log('trace', 'API Response', {
  method: 'GET',
  url: '/api/users/direct-reports',
  statusCode: 200,
  responseTime: '45ms',
  responseSize: '1024 bytes',
});

console.log('');
console.log('=== Database Operation Logging Demonstration ===');

// Simulate database operation logging
log('trace', 'Database Operation', {
  operation: 'SELECT',
  table: 'users',
  query: JSON.stringify({
    where: { managerId: '123', isActive: true },
    select: ['id', 'email', 'firstName', 'lastName'],
  }),
  resultCount: 2,
});

console.log('');
console.log('=== Authentication Event Logging Demonstration ===');

// Simulate authentication event logging
log('trace', 'Authentication Event', {
  event: 'Login Success',
  userId: '123',
  email: 'manager@example.com',
  success: true,
});

log('trace', 'Authentication Event', {
  event: 'Login Failed',
  userId: null,
  email: 'invalid@example.com',
  success: false,
});

console.log('');
console.log('=== Authorization Event Logging Demonstration ===');

// Simulate authorization event logging
log('trace', 'Authorization Event', {
  event: 'Direct Reports Access Check',
  userId: '123',
  requiredRole: 'MANAGER or ADMIN',
  userRole: 'MANAGER',
  granted: true,
});

log('trace', 'Authorization Event', {
  event: 'Direct Reports Access Check',
  userId: '456',
  requiredRole: 'MANAGER or ADMIN',
  userRole: 'EMPLOYEE',
  granted: false,
});

console.log('');
console.log('=== Demonstration Complete ===');
console.log('');
console.log('To enable TRACE logging in your application:');
console.log('1. Set LOG_LEVEL=TRACE in your .env file');
console.log('2. Restart your server');
console.log('3. Make API requests to see detailed logs');
console.log('');
console.log('Example .env configuration:');
console.log('LOG_LEVEL=TRACE  # For maximum logging');
console.log('LOG_LEVEL=DEBUG  # For detailed debugging');
console.log('LOG_LEVEL=INFO   # For normal development');
console.log('LOG_LEVEL=WARN   # For production-like logging');
console.log('LOG_LEVEL=ERROR  # For minimal logging');
