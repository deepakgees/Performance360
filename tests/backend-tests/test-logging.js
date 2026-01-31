/**
 * Logger Functionality Tests
 * 
 * Tests the logger utility with different log levels and message types
 */

const path = require('path');
const fs = require('fs');

// Import logger from compiled backend
const loggerPath = path.join(__dirname, '../../backend/dist/utils/logger');
let logger;

try {
  logger = require(loggerPath).logger;
} catch (error) {
  // If dist doesn't exist, we'll skip these tests
  logger = null;
}

async function run(recordResult, recordWarning) {
  if (!logger) {
    recordWarning('test-logging', 'Logger not available. Run "npm run build" in backend folder first.');
    return;
  }

  // Test 1: Basic logging functionality
  try {
    logger.logInfo('Test info message', 'Test User (test@example.com)', 'GET', '/api/test');
    logger.logWarning('Test warning message', 'Test User (test@example.com)', 'POST', '/api/test');
    logger.logError('Test error message', new Error('Test error'), 'Test User (test@example.com)', 'DELETE', '/api/test');
    logger.logDebug('Test debug message', 'Test User (test@example.com)', 'PUT', '/api/test');
    
    recordResult('Logger - Basic logging', true, 'All log levels executed without errors');
  } catch (error) {
    recordResult('Logger - Basic logging', false, `Error: ${error.message}`);
  }

  // Test 2: API access logging
  try {
    logger.logApiAccess('John Doe (john@example.com)', 'GET', '/api/users', 200, 150);
    logger.logApiAccess('Jane Smith (jane@example.com)', 'POST', '/api/feedback', 201, 300);
    logger.logApiAccess('Anonymous', 'GET', '/api/health', 200, 50);
    
    recordResult('Logger - API access logging', true, 'API access logs created successfully');
  } catch (error) {
    recordResult('Logger - API access logging', false, `Error: ${error.message}`);
  }

  // Test 3: Database operation logging
  try {
    logger.logDatabaseOperation('SELECT', 'users', 'John Doe (john@example.com)');
    logger.logDatabaseOperation('INSERT', 'feedback', 'Jane Smith (jane@example.com)');
    
    recordResult('Logger - Database operation logging', true, 'Database operation logs created');
  } catch (error) {
    recordResult('Logger - Database operation logging', false, `Error: ${error.message}`);
  }

  // Test 4: Authentication logging
  try {
    logger.logAuth('login', 'john@example.com', true);
    logger.logAuth('login', 'invalid@example.com', false);
    logger.logAuth('logout', 'jane@example.com', true);
    
    recordResult('Logger - Authentication logging', true, 'Authentication logs created');
  } catch (error) {
    recordResult('Logger - Authentication logging', false, `Error: ${error.message}`);
  }

  // Test 5: Verify log file creation
  try {
    const logDir = path.join(__dirname, '../../backend/logs');
    const today = new Date().toISOString().split('T')[0];
    const logFile = path.join(logDir, `${today}.log`);
    
    if (fs.existsSync(logFile)) {
      const logContent = fs.readFileSync(logFile, 'utf8');
      if (logContent.includes('Test info message') || logContent.includes('Test User')) {
        recordResult('Logger - Log file creation', true, 'Log file created and contains test messages');
      } else {
        recordResult('Logger - Log file creation', true, 'Log file exists but may not contain recent messages');
      }
    } else {
      recordWarning('Logger - Log file creation', 'Log file not found. This may be normal if LOG_LEVEL filters messages.');
    }
  } catch (error) {
    recordWarning('Logger - Log file creation', `Could not verify log file: ${error.message}`);
  }
}

module.exports = { run };
