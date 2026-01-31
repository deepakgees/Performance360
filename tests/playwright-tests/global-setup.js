/**
 * Global setup for Playwright tests
 * 
 * This file runs before all tests to verify that the backend is running
 * in test mode. If the backend is in production mode, tests will fail
 * with a clear error message.
 */

const { chromium } = require('@playwright/test');

/**
 * Check if backend is running in test mode
 * @returns {Promise<boolean>} True if backend is in test mode, false otherwise
 */
async function checkBackendTestMode() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Try to access a test endpoint that should return 404 in production
    // We use a dummy pattern that won't match anything, just to check if the endpoint exists
    const testUrl = 'http://localhost:3001/api/test-cleanup/delete-pattern';
    const response = await page.request.delete(testUrl, {
      data: { emailPattern: '__test_mode_check__' },
      failOnStatusCode: false, // Don't throw on 404
    });
    
    const status = response.status();
    let responseText = '';
    let responseJson = null;
    
    try {
      responseText = await response.text();
      // Try to parse as JSON
      try {
        responseJson = JSON.parse(responseText);
      } catch {
        // Not JSON, that's fine
      }
    } catch (error) {
      // Couldn't read response body, that's okay
    }
    
    await browser.close();
    
    // If we get 404, it means the endpoint doesn't exist (production mode)
    // The response body should contain "Endpoint not found" or similar
    if (status === 404) {
      // Check if the response indicates it's a production mode block
      const message = responseJson?.message || responseText || '';
      if (message.includes('Endpoint not found') || 
          message.includes('not found') ||
          message === '') {
        return false; // Production mode
      }
    }
    
    // If we get 200 or 400 (validation error), the endpoint exists (test mode)
    // 400 is acceptable because it means the endpoint exists but our dummy data is invalid
    // 200 means the endpoint worked (even if no users were deleted)
    if (status === 200 || status === 400) {
      return true; // Test mode
    }
    
    // Any other status means something unexpected happened
    console.warn(`⚠️  Unexpected status code ${status} when checking test mode`);
    if (responseText) {
      console.warn(`   Response: ${responseText.substring(0, 200)}`);
    }
    // Assume test mode if we get a non-404 response (endpoint exists)
    return status !== 404;
  } catch (error) {
    await browser.close();
    
    // If we can't connect, the backend might not be running
    if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch')) {
      throw new Error(
        '❌ Cannot connect to backend server at http://localhost:3001\n' +
        '   Please ensure the backend server is running before running tests.\n' +
        '   Start the backend with: npm run dev (in the backend directory)'
      );
    }
    
    throw error;
  }
}

/**
 * Global setup function that runs before all tests
 */
async function globalSetup() {
  console.log('\n🔍 Checking if backend is running in test mode...\n');
  
  try {
    const isTestMode = await checkBackendTestMode();
    
    if (!isTestMode) {
      const errorMessage = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                          ❌ BACKEND IN PRODUCTION MODE                      ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  The backend server is running in PRODUCTION mode.                          ║
║  Test endpoints are disabled in production for security reasons.            ║
║                                                                              ║
║  To run tests, you must start the backend in TEST/DEVELOPMENT mode:          ║
║                                                                              ║
║  1. Stop the current backend server (if running)                             ║
║  2. Set NODE_ENV to 'development' or 'test':                                ║
║     - Windows: set NODE_ENV=development                                      ║
║     - Linux/Mac: export NODE_ENV=development                                ║
║  3. Or set ENABLE_TEST_ROUTES=true:                                          ║
║     - Windows: set ENABLE_TEST_ROUTES=true                                   ║
║     - Linux/Mac: export ENABLE_TEST_ROUTES=true                             ║
║  4. Start the backend server:                                                ║
║     cd backend && npm run dev                                                ║
║                                                                              ║
║  Then run the tests again.                                                   ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`;
      console.error(errorMessage);
      throw new Error('Backend is running in production mode. Tests cannot run.');
    }
    
    console.log('✅ Backend is running in test mode. Tests can proceed.\n');
  } catch (error) {
    // If it's our custom error, re-throw it
    if (error.message.includes('Backend is running in production mode') || 
        error.message.includes('Cannot connect to backend server')) {
      throw error;
    }
    
    // For other errors, provide a helpful message
    console.error('\n❌ Error checking backend test mode:', error.message);
    throw new Error(
      'Failed to verify backend test mode. Please ensure:\n' +
      '  1. Backend server is running on http://localhost:3001\n' +
      '  2. Backend is started with NODE_ENV=development or ENABLE_TEST_ROUTES=true\n' +
      '  3. Test endpoints are enabled\n'
    );
  }
}

module.exports = globalSetup;

