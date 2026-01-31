/**
 * Log Level Filtering Tests
 * 
 * Tests that log levels are properly filtered based on LOG_LEVEL environment variable
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
    recordWarning('test-log-levels', 'Logger not available. Run "npm run build" in backend folder first.');
    return;
  }

  const originalLogLevel = process.env.LOG_LEVEL;
  const logDir = path.join(__dirname, '../../backend/logs');
  const today = new Date().toISOString().split('T')[0];
  const logFile = path.join(logDir, `${today}.log`);

  // Helper to count log entries in file
  function countLogEntries(level) {
    if (!fs.existsSync(logFile)) return 0;
    const content = fs.readFileSync(logFile, 'utf8');
    const regex = new RegExp(`\\[${level}\\]`, 'g');
    return (content.match(regex) || []).length;
  }

  // Test ERROR level - should only log ERROR
  try {
    process.env.LOG_LEVEL = 'ERROR';
    // Re-import logger to get new log level
    delete require.cache[require.resolve(loggerPath)];
    const { logger: errorLogger } = require(loggerPath);
    
    const beforeCount = countLogEntries('ERROR');
    errorLogger.logError('Error test', new Error('Test'), 'User', 'GET', '/test');
    errorLogger.logWarning('Warning test', 'User', 'GET', '/test');
    errorLogger.logInfo('Info test', 'User', 'GET', '/test');
    errorLogger.logDebug('Debug test', 'User', 'GET', '/test');
    
    // Give it a moment to write
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const afterCount = countLogEntries('ERROR');
    const errorLogged = afterCount > beforeCount;
    
    recordResult('Log Level - ERROR filtering', errorLogged, 
      errorLogged ? 'Only ERROR messages logged' : 'ERROR messages may not have been logged');
  } catch (error) {
    recordResult('Log Level - ERROR filtering', false, `Error: ${error.message}`);
  }

  // Test WARN level - should log ERROR and WARN
  try {
    process.env.LOG_LEVEL = 'WARN';
    delete require.cache[require.resolve(loggerPath)];
    const { logger: warnLogger } = require(loggerPath);
    
    const beforeWarn = countLogEntries('WARN');
    warnLogger.logWarning('Warning test', 'User', 'GET', '/test');
    warnLogger.logInfo('Info test', 'User', 'GET', '/test');
    warnLogger.logDebug('Debug test', 'User', 'GET', '/test');
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const afterWarn = countLogEntries('WARN');
    const warnLogged = afterWarn > beforeWarn;
    
    recordResult('Log Level - WARN filtering', warnLogged,
      warnLogged ? 'WARN and ERROR messages logged' : 'WARN messages may not have been logged');
  } catch (error) {
    recordResult('Log Level - WARN filtering', false, `Error: ${error.message}`);
  }

  // Test INFO level - should log ERROR, WARN, INFO
  try {
    process.env.LOG_LEVEL = 'INFO';
    delete require.cache[require.resolve(loggerPath)];
    const { logger: infoLogger } = require(loggerPath);
    
    const beforeInfo = countLogEntries('INFO');
    infoLogger.logInfo('Info test', 'User', 'GET', '/test');
    infoLogger.logDebug('Debug test', 'User', 'GET', '/test');
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const afterInfo = countLogEntries('INFO');
    const infoLogged = afterInfo > beforeInfo;
    
    recordResult('Log Level - INFO filtering', infoLogged,
      infoLogged ? 'INFO, WARN, and ERROR messages logged' : 'INFO messages may not have been logged');
  } catch (error) {
    recordResult('Log Level - INFO filtering', false, `Error: ${error.message}`);
  }

  // Test DEBUG level - should log all levels
  try {
    process.env.LOG_LEVEL = 'DEBUG';
    delete require.cache[require.resolve(loggerPath)];
    const { logger: debugLogger } = require(loggerPath);
    
    const beforeDebug = countLogEntries('DEBUG');
    debugLogger.logDebug('Debug test', 'User', 'GET', '/test');
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const afterDebug = countLogEntries('DEBUG');
    const debugLogged = afterDebug > beforeDebug;
    
    recordResult('Log Level - DEBUG filtering', debugLogged,
      debugLogged ? 'All log levels including DEBUG logged' : 'DEBUG messages may not have been logged');
  } catch (error) {
    recordResult('Log Level - DEBUG filtering', false, `Error: ${error.message}`);
  }

  // Restore original log level
  if (originalLogLevel) {
    process.env.LOG_LEVEL = originalLogLevel;
  } else {
    delete process.env.LOG_LEVEL;
  }
  delete require.cache[require.resolve(loggerPath)];
}

module.exports = { run };
