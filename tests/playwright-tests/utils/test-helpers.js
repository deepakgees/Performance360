/**
 * Common test helper functions for Playwright tests
 * This file contains shared utilities used across multiple test files
 */

const { expect } = require('@playwright/test');

/**
 * Delete a user by email via API
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} email - Email address of user to delete
 */
async function deleteUser(page, email) {
  const url = `http://localhost:3001/api/test-cleanup/delete`;
  try {
    console.log(`[TEST-HELPER] Attempting to delete user: ${email}`);
    // Make API call to delete user
    const response = await page.request.delete(url, {
      data: { email: email }
    });
    
    const status = response.status();
    if (response.ok()) {
      console.log(`[TEST-HELPER] ✅ Successfully deleted user: ${email}`);
    } else {
      let errorBody = 'Unable to parse error response';
      try {
        errorBody = await response.text();
      } catch (parseError) {
        // Ignore parse errors for cleanup operations
      }
      console.log(`[TEST-HELPER] ❌ Failed to delete user: ${email}, status: ${status}, error: ${errorBody}`);
    }
  } catch (error) {
    console.log(`[TEST-HELPER] ❌ Error deleting user ${email}: ${error.message}`);
    if (error.stack) {
      console.log(`[TEST-HELPER]   Stack: ${error.stack}`);
    }
  }
}

/**
 * Delete users by email pattern via API
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} emailPattern - Email pattern to match (e.g., 'testuser')
 */
async function deleteUsersByPattern(page, emailPattern) {
  const url = `http://localhost:3001/api/test-cleanup/delete-pattern`;
  try {
    console.log(`[TEST-HELPER] Attempting to delete users matching pattern: ${emailPattern}`);
    const response = await page.request.delete(url, {
      data: { emailPattern: emailPattern }
    });
    
    const status = response.status();
    if (response.ok()) {
      console.log(`[TEST-HELPER] ✅ Successfully deleted users matching pattern: ${emailPattern}`);
    } else {
      let errorBody = 'Unable to parse error response';
      try {
        errorBody = await response.text();
      } catch (parseError) {
        // Ignore parse errors for cleanup operations
      }
      console.log(`[TEST-HELPER] ❌ Failed to delete users matching pattern: ${emailPattern}, status: ${status}, error: ${errorBody}`);
    }
  } catch (error) {
    console.log(`[TEST-HELPER] ❌ Error deleting users with pattern ${emailPattern}: ${error.message}`);
    if (error.stack) {
      console.log(`[TEST-HELPER]   Stack: ${error.stack}`);
    }
  }
}

/**
 * Generate a unique test email with timestamp
 * @param {string} prefix - Email prefix (e.g., 'testuser', 'smoketest')
 * @returns {string} Unique email address
 */
function generateTestEmail(prefix = 'testuser') {
  const timestamp = Date.now();
  return `${prefix}${timestamp}@example.com`;
}

/**
 * Generate test user data with unique email
 * @param {string} prefix - Email prefix
 * @param {string} firstName - First name
 * @param {string} lastName - Last name
 * @param {string} password - Password
 * @returns {Object} Test user data object
 */
function generateTestUserData(prefix = 'testuser', firstName = 'John', lastName = 'Doe', password = 'Password@123') {
  return {
    email: generateTestEmail(prefix),
    firstName,
    lastName,
    password
  };
}

/**
 * Clean up test users by pattern
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {Array<string>} patterns - Array of email patterns to clean up
 */
async function cleanupTestUsers(page, patterns = ['testuser', 'existinguser', 'loadingtest', 'cleartest', 'smoketest']) {
  for (const pattern of patterns) {
    await deleteUsersByPattern(page, pattern);
  }
}

/**
 * Login helper function
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} email - User email
 * @param {string} password - User password
 */
async function loginUser(page, email = 'test@example.com', password = 'Password@123') {
  await page.goto('/login');
  await page.fill('#login-email', email);
  await page.fill('#login-password', password);

  // Submit login form and wait for navigation
  await page.click('#login-submit-button');
  
  // Wait for navigation to complete (either to dashboard or stay on login if error)
  await page.waitForLoadState('networkidle');
  
  // Verify user is logged in by checking for logout button
  await expect(page.locator('#logout-button')).toBeVisible({ timeout: 10000 });
}

/**
 * Register a new user helper function via API
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {Object} userData - User data object
 * @returns {Object} Created user object with id, email, and other details
 */
async function registerUser(page, userData) {
  const requestData = {
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email,
    password: userData.password,
    role: userData.role || 'EMPLOYEE' // Default role for regular registration
  };
  const url = `http://localhost:3001/api/test-cleanup/create-user`;
  
  try {
    console.log(`[TEST-HELPER] Attempting to register user via API:`);
    console.log(`[TEST-HELPER]   URL: ${url}`);
    console.log(`[TEST-HELPER]   Email: ${userData.email}`);
    console.log(`[TEST-HELPER]   Role: ${requestData.role}`);
    
    // Make API call to register user
    const response = await page.request.post(url, {
      data: requestData
    });
    
    const status = response.status();
    console.log(`[TEST-HELPER] Response status: ${status}`);
    
    if (response.ok()) {
      const user = await response.json();
      console.log(`[TEST-HELPER] ✅ Successfully registered user: ${userData.email}`);
      return user;
    } else {
      // Try to get response body for error details
      let errorBody = 'Unable to parse error response';
      try {
        errorBody = await response.text();
        console.log(`[TEST-HELPER] ❌ Error response body: ${errorBody}`);
      } catch (parseError) {
        console.log(`[TEST-HELPER] ❌ Could not parse error response: ${parseError.message}`);
      }
      
      console.log(`[TEST-HELPER] ❌ Failed to register user: ${userData.email}`);
      console.log(`[TEST-HELPER]   Status: ${status}`);
      console.log(`[TEST-HELPER]   Request data:`, JSON.stringify(requestData, null, 2));
      console.log(`[TEST-HELPER]   Error response: ${errorBody}`);
      
      throw new Error(`Failed to register user: HTTP ${status} - ${errorBody}`);
    }
  } catch (error) {
    console.log(`[TEST-HELPER] ❌ Exception while registering user ${userData.email}:`);
    console.log(`[TEST-HELPER]   Error message: ${error.message}`);
    console.log(`[TEST-HELPER]   Error stack: ${error.stack}`);
    console.log(`[TEST-HELPER]   Request URL: ${url}`);
    console.log(`[TEST-HELPER]   Request data:`, JSON.stringify(requestData, null, 2));
    
    // Check if it's a network error
    if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch')) {
      console.log(`[TEST-HELPER] ⚠️  Network error - is the backend server running on port 3001?`);
    }
    
    throw error;
  }
}

/**
 * Register a new user via UI (legacy method)
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {Object} userData - User data object
 * @returns {string} Email of the registered user
 */
async function registerUserViaUI(page, userData) {
  await page.goto('/register');
  
  await page.fill('#register-first-name', userData.firstName);
  await page.fill('#register-last-name', userData.lastName);
  await page.fill('#register-email', userData.email);
  await page.fill('#register-password', userData.password);

  await page.click('#register-submit-button');
  
  // Wait for redirect to login
  await page.waitForURL(/.*\/login/);
  
  return userData.email;
}

/**
 * Register and login a user via UI in one step
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {Object} userData - User data object
 * @returns {Object} Object containing userData and success status
 */
async function registerAndLoginUserViaUI(page, userData) {
  // Navigate to registration page
  await page.goto('/register');
  
  // Fill in registration form
  await page.fill('#register-first-name', userData.firstName);
  await page.fill('#register-last-name', userData.lastName);
  await page.fill('#register-email', userData.email);
  await page.fill('#register-password', userData.password);

  // Submit the registration form
  await page.click('#register-submit-button');
  
  // Wait a moment for the response
  await page.waitForTimeout(1000);
  
  // Check if there's an error message (registration failed)
  const errorMessage = page.locator('text=Unable to complete registration').or(page.locator('text=already exists')).or(page.locator('text=Registration failed'));
  const hasError = await errorMessage.isVisible().catch(() => false);
  
  if (hasError) {
    console.log(`[TEST-HELPER] Registration failed for ${userData.email}. Error may be visible on page.`);
    // Try to get the error text
    const errorText = await errorMessage.textContent().catch(() => 'Unknown error');
    throw new Error(`Registration failed: ${errorText}`);
  }
  
  // Wait for navigation to login page (successful registration)
  await page.waitForURL(/.*\/login/, { timeout: 15000 });
  
  // Wait for page to be fully loaded
  await page.waitForLoadState('networkidle');

  // Login with the newly created credentials
  await page.fill('#login-email', userData.email);
  await page.fill('#login-password', userData.password);

  // Submit the login form and wait for navigation
  await page.click('#login-submit-button');
  await page.waitForLoadState('networkidle');

  // Verify user is logged in by checking for logout button
  await page.waitForSelector('#logout-button', { timeout: 10000 });
  
  return {
    userData,
    success: true
  };
}

/**
 * Register a new test user with specific role via API
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {Object} userData - User data object
 * @param {string} role - User role ('user', 'manager', 'admin')
 * @returns {Object} Created user object with id, email, and role
 */
async function registerUserWithRole(page, userData, role = 'EMPLOYEE') {
  const requestData = {
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email,
    password: userData.password,
    role: role
  };
  const url = `http://localhost:3001/api/test-cleanup/create-user`;
  
  try {
    console.log(`[TEST-HELPER] Attempting to create user with role via API:`);
    console.log(`[TEST-HELPER]   URL: ${url}`);
    console.log(`[TEST-HELPER]   Email: ${userData.email}`);
    console.log(`[TEST-HELPER]   Role: ${role}`);
    
    // Make API call to create user with role
    const response = await page.request.post(url, {
      data: requestData
    });
    
    const status = response.status();
    console.log(`[TEST-HELPER] Response status: ${status}`);
    
    if (response.ok()) {
      const user = await response.json();
      console.log(`[TEST-HELPER] ✅ Successfully created user with role ${role}: ${userData.email}`);
      return user;
    } else {
      // Try to get response body for error details
      let errorBody = 'Unable to parse error response';
      try {
        errorBody = await response.text();
        console.log(`[TEST-HELPER] ❌ Error response body: ${errorBody}`);
      } catch (parseError) {
        console.log(`[TEST-HELPER] ❌ Could not parse error response: ${parseError.message}`);
      }
      
      console.log(`[TEST-HELPER] ❌ Failed to create user with role ${role}: ${userData.email}`);
      console.log(`[TEST-HELPER]   Status: ${status}`);
      console.log(`[TEST-HELPER]   Request data:`, JSON.stringify(requestData, null, 2));
      console.log(`[TEST-HELPER]   Error response: ${errorBody}`);
      
      throw new Error(`Failed to create user: HTTP ${status} - ${errorBody}`);
    }
  } catch (error) {
    console.log(`[TEST-HELPER] ❌ Exception while creating user with role ${role} ${userData.email}:`);
    console.log(`[TEST-HELPER]   Error message: ${error.message}`);
    console.log(`[TEST-HELPER]   Error stack: ${error.stack}`);
    console.log(`[TEST-HELPER]   Request URL: ${url}`);
    console.log(`[TEST-HELPER]   Request data:`, JSON.stringify(requestData, null, 2));
    
    // Check if it's a network error
    if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch')) {
      console.log(`[TEST-HELPER] ⚠️  Network error - is the backend server running on port 3001?`);
    }
    
    throw error;
  }
}

/**
 * Create and login as a test user with specific role
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} prefix - Email prefix for unique email generation
 * @param {string} role - User role ('user', 'manager', 'admin')
 * @param {Object} options - Additional options
 * @param {string} options.firstName - First name (default: 'John')
 * @param {string} options.lastName - Last name (default: 'Doe')
 * @param {string} options.password - Password (default: 'Password@123')
 * @returns {Object} User data and created user object
 */
async function createAndLoginUserWithRole(page, userData, role = 'EMPLOYEE') {    
  // Create user with role via API
  const createdUser = await registerUserWithRole(page, userData, role);
  
  // Login with the created user
  await loginUser(page, userData.email, userData.password);
  
  return createdUser;
}

/**
 * Wait for element to be visible with timeout
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} selector - Element selector
 * @param {number} timeout - Timeout in milliseconds (default: 5000)
 */
async function waitForElement(page, selector, timeout = 5000) {
  await page.waitForSelector(selector, { timeout });
}

/**
 * Assign a manager to an employee via API
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} employeeId - ID of the employee
 * @param {string} managerId - ID of the manager to assign
 * @returns {Object} Response object with success status
 */
async function assignManagerToEmployee(page, employeeId, managerId) {
  const url = `http://localhost:3001/api/test-cleanup/assign-manager`;
  const requestData = {
    employeeId: employeeId,
    managerId: managerId
  };
  
  try {
    console.log(`[TEST-HELPER] Attempting to assign manager to employee:`);
    console.log(`[TEST-HELPER]   URL: ${url}`);
    console.log(`[TEST-HELPER]   Employee ID: ${employeeId}`);
    console.log(`[TEST-HELPER]   Manager ID: ${managerId}`);
    
    // Make API call to assign manager to employee
    const response = await page.request.put(url, {
      data: requestData
    });
    
    const status = response.status();
    console.log(`[TEST-HELPER] Response status: ${status}`);
    
    if (response.ok()) {
      const result = await response.json();
      console.log(`[TEST-HELPER] ✅ Successfully assigned manager ${managerId} to employee ${employeeId}`);
      return result;
    } else {
      let errorBody = 'Unable to parse error response';
      try {
        errorBody = await response.text();
        console.log(`[TEST-HELPER] ❌ Error response body: ${errorBody}`);
      } catch (parseError) {
        console.log(`[TEST-HELPER] ❌ Could not parse error response: ${parseError.message}`);
      }
      
      console.log(`[TEST-HELPER] ❌ Failed to assign manager ${managerId} to employee ${employeeId}`);
      console.log(`[TEST-HELPER]   Status: ${status}`);
      console.log(`[TEST-HELPER]   Request data:`, JSON.stringify(requestData, null, 2));
      console.log(`[TEST-HELPER]   Error response: ${errorBody}`);
      
      throw new Error(`Failed to assign manager: HTTP ${status} - ${errorBody}`);
    }
  } catch (error) {
    console.log(`[TEST-HELPER] ❌ Exception while assigning manager ${managerId} to employee ${employeeId}:`);
    console.log(`[TEST-HELPER]   Error message: ${error.message}`);
    console.log(`[TEST-HELPER]   Error stack: ${error.stack}`);
    console.log(`[TEST-HELPER]   Request URL: ${url}`);
    console.log(`[TEST-HELPER]   Request data:`, JSON.stringify(requestData, null, 2));
    
    // Check if it's a network error
    if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch')) {
      console.log(`[TEST-HELPER] ⚠️  Network error - is the backend server running on port 3001?`);
    }
    
    throw error;
  }
}

/**
 * Take screenshot on test failure
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} testName - Name of the test for screenshot naming
 */
async function takeScreenshotOnFailure(page, testName) {
  try {
    await page.screenshot({ 
      path: `test-results/screenshots/${testName}-${Date.now()}.png`,
      fullPage: true 
    });
  } catch (error) {
    console.log('Failed to take screenshot:', error.message);
  }
}

module.exports = {
  deleteUser,
  deleteUsersByPattern,
  generateTestEmail,
  generateTestUserData,
  cleanupTestUsers,
  loginUser,
  registerUser,
  registerUserViaUI,
  registerAndLoginUserViaUI,
  registerUserWithRole,
  createAndLoginUserWithRole,
  assignManagerToEmployee,
  waitForElement,
  takeScreenshotOnFailure
}; 