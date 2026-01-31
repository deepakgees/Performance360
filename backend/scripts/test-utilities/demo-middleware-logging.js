/**
 * Middleware Logging Demonstration Utility
 * 
 * Demonstrates the middleware order and how user information is logged
 * 
 * Usage:
 *   node scripts/test-utilities/demo-middleware-logging.js
 * 
 * Prerequisites:
 *   - Backend must be built (npm run build)
 */

const path = require('path');
const { logger } = require('../../dist/utils/logger');

console.log('🧪 Testing middleware order and user logging...');
console.log('📊 This test simulates the correct middleware order');
console.log('');

// Simulate the correct middleware order:
// 1. requestLogger runs first (before authentication)
// 2. authenticateToken runs second (attaches user)
// 3. responseLogger runs third (after authentication, logs with user info)

console.log('📝 Simulating middleware order:');

// Step 1: Initial request logging (before auth)
console.log('1️⃣ requestLogger (before auth):');
logger.logInfo(
  'Incoming GET request to /api/users/me',
  'Anonymous',
  'GET',
  '/api/users/me'
);

// Step 2: Authentication (user gets attached)
console.log('2️⃣ authenticateToken (user attached):');
const user = {
  firstName: 'Deepak',
  lastName: 'Goenka',
  email: 'deepak.goenka@msg-global.com',
  role: 'MANAGER',
};

// Step 3: Response logging (after auth, with user info)
console.log('3️⃣ responseLogger (after auth, with user info):');
logger.logApiAccess(
  `${user.firstName} ${user.lastName} (${user.email})`,
  'GET',
  '/api/users/me',
  200,
  12
);

console.log('');
console.log('✅ Middleware order test completed!');
console.log('📁 Check the log file to see the correct user information.');
console.log(
  '📅 Log file: backend/logs/' + new Date().toISOString().split('T')[0] + '.log'
);
console.log('');
console.log('💡 Expected behavior:');
console.log('   - First log: "Anonymous" (before authentication)');
console.log(
  '   - Second log: "Deepak Goenka (deepak.goenka@msg-global.com)" (after authentication)'
);
console.log(
  '   - User information should be properly displayed in the final API access log'
);
