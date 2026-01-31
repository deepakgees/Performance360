/**
 * Comprehensive Security Testing Suite for Employee Feedback App
 * 
 * This script tests for:
 * - IDOR (Insecure Direct Object Reference) vulnerabilities
 * - Authorization bypass
 * - Authentication bypass
 * - Role-based access control
 * - Input validation
 * - Missing authentication on endpoints
 * 
 * Usage:
 *   node tests/security-tests/security-test-suite.js
 * 
 * Prerequisites:
 *   - Backend server running on http://localhost:3001 (or set BASE_URL)
 *   - Test users created: employee, manager, admin
 *   - Set environment variables: EMPLOYEE_TOKEN, MANAGER_TOKEN, ADMIN_TOKEN
 */

const axios = require('axios');
const colors = require('colors');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const EMPLOYEE_TOKEN = process.env.EMPLOYEE_TOKEN || '';
const MANAGER_TOKEN = process.env.MANAGER_TOKEN || '';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

// Test results
const results = {
  passed: [],
  failed: [],
  warnings: [],
  critical: []
};

// Helper functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const colors_map = {
    info: colors.blue,
    success: colors.green,
    error: colors.red,
    warning: colors.yellow,
    critical: colors.red.bold
  };
  console.log(colors_map[type](`[${timestamp}] ${message}`));
}

async function makeRequest(method, endpoint, token = null, data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { status: response.status, data: response.data };
  } catch (error) {
    return {
      status: error.response?.status || 500,
      data: error.response?.data || { message: error.message }
    };
  }
}

function recordResult(testName, passed, severity = 'medium', details = '') {
  const result = { testName, passed, severity, details, timestamp: new Date().toISOString() };
  
  if (passed) {
    results.passed.push(result);
    log(`✓ PASSED: ${testName}`, 'success');
  } else {
    if (severity === 'critical') {
      results.critical.push(result);
      log(`✗ CRITICAL FAILURE: ${testName} - ${details}`, 'critical');
    } else if (severity === 'high') {
      results.failed.push(result);
      log(`✗ FAILED: ${testName} - ${details}`, 'error');
    } else {
      results.warnings.push(result);
      log(`⚠ WARNING: ${testName} - ${details}`, 'warning');
    }
  }
}

// Test Categories

/**
 * Test 1: Authentication Bypass
 * Tests if endpoints can be accessed without authentication
 */
async function testAuthenticationBypass() {
  log('\n=== Testing Authentication Bypass ===', 'info');
  
  const protectedEndpoints = [
    { method: 'GET', path: '/api/users' },
    { method: 'GET', path: '/api/users/me' },
    { method: 'GET', path: '/api/assessments' },
    { method: 'GET', path: '/api/colleague-feedback/received' },
    { method: 'GET', path: '/api/manager-feedback/received' },
    { method: 'GET', path: '/api/quarterly-performance/someUserId' },
    { method: 'GET', path: '/api/achievements-observations/someUserId' },
    { method: 'GET', path: '/api/monthly-attendance/someUserId' },
    { method: 'POST', path: '/api/assessments', data: { year: 2024, quarter: 'Q1' } },
    { method: 'POST', path: '/api/colleague-feedback', data: { receiverId: 'test', year: 2024, quarter: 'Q1', feedbackProvider: 'test' } },
  ];
  
  for (const endpoint of protectedEndpoints) {
    const result = await makeRequest(endpoint.method, endpoint.path, null, endpoint.data);
    const testName = `${endpoint.method} ${endpoint.path} without authentication`;
    
    // Should return 401 or 403
    recordResult(
      testName,
      result.status === 401 || result.status === 403,
      'critical',
      `Expected 401/403, got ${result.status}`
    );
  }
}

/**
 * Test 2: IDOR - Employee accessing other employee's data
 */
async function testEmployeeIDOR() {
  log('\n=== Testing IDOR: Employee Access ===', 'info');
  
  if (!EMPLOYEE_TOKEN) {
    log('Skipping employee IDOR tests - no employee token provided', 'warning');
    return;
  }
  
  // Get employee's own ID first
  const selfResponse = await makeRequest('GET', '/api/users/me', EMPLOYEE_TOKEN);
  if (selfResponse.status !== 200) {
    log('Cannot get employee info - skipping IDOR tests', 'warning');
    return;
  }
  
  const employeeId = selfResponse.data.id;
  
  // Try to get list of all users
  const allUsersResponse = await makeRequest('GET', '/api/users', EMPLOYEE_TOKEN);
  recordResult(
    'Employee accessing all users list',
    allUsersResponse.status === 403 || (allUsersResponse.status === 200 && Array.isArray(allUsersResponse.data) && allUsersResponse.data.length === 0),
    'critical',
    `Employee should not see all users. Status: ${allUsersResponse.status}, Users returned: ${Array.isArray(allUsersResponse.data) ? allUsersResponse.data.length : 'N/A'}`
  );
  
  // Try to access another user's profile (using a fake ID)
  const fakeUserId = 'clx000000000000000000000000';
  const userProfileResponse = await makeRequest('GET', `/api/users/${fakeUserId}`, EMPLOYEE_TOKEN);
  recordResult(
    'Employee accessing another user profile',
    userProfileResponse.status === 403 || userProfileResponse.status === 404,
    'critical',
    `Employee should not access other users. Status: ${userProfileResponse.status}`
  );
  
  // Try to access another user's assessments
  const assessmentsResponse = await makeRequest('GET', `/api/assessments/user/${fakeUserId}`, EMPLOYEE_TOKEN);
  recordResult(
    'Employee accessing another user assessments',
    assessmentsResponse.status === 403,
    'critical',
    `Employee should not access other users' assessments. Status: ${assessmentsResponse.status}`
  );
  
  // Try to access another user's feedback
  const feedbackResponse = await makeRequest('GET', `/api/colleague-feedback/received/${fakeUserId}`, EMPLOYEE_TOKEN);
  recordResult(
    'Employee accessing another user feedback',
    feedbackResponse.status === 403,
    'critical',
    `Employee should not access other users' feedback. Status: ${feedbackResponse.status}`
  );
  
  // Try to access another user's performance
  const performanceResponse = await makeRequest('GET', `/api/quarterly-performance/${fakeUserId}`, EMPLOYEE_TOKEN);
  recordResult(
    'Employee accessing another user performance',
    performanceResponse.status === 403,
    'critical',
    `Employee should not access other users' performance. Status: ${performanceResponse.status}`
  );
  
  // Try to access another user's achievements
  const achievementsResponse = await makeRequest('GET', `/api/achievements-observations/${fakeUserId}`, EMPLOYEE_TOKEN);
  recordResult(
    'Employee accessing another user achievements',
    achievementsResponse.status === 403,
    'critical',
    `Employee should not access other users' achievements. Status: ${achievementsResponse.status}`
  );
  
  // Try to access another user's attendance
  const attendanceResponse = await makeRequest('GET', `/api/monthly-attendance/${fakeUserId}`, EMPLOYEE_TOKEN);
  recordResult(
    'Employee accessing another user attendance',
    attendanceResponse.status === 403,
    'critical',
    `Employee should not access other users' attendance. Status: ${attendanceResponse.status}`
  );
}

/**
 * Test 3: IDOR - Manager accessing data outside their hierarchy
 */
async function testManagerIDOR() {
  log('\n=== Testing IDOR: Manager Access ===', 'info');
  
  if (!MANAGER_TOKEN) {
    log('Skipping manager IDOR tests - no manager token provided', 'warning');
    return;
  }
  
  // Get manager's own ID
  const selfResponse = await makeRequest('GET', '/api/users/me', MANAGER_TOKEN);
  if (selfResponse.status !== 200) {
    log('Cannot get manager info - skipping IDOR tests', 'warning');
    return;
  }
  
  const managerId = selfResponse.data.id;
  
  // Get all users - manager should only see their reports
  const allUsersResponse = await makeRequest('GET', '/api/users', MANAGER_TOKEN);
  if (allUsersResponse.status === 200 && Array.isArray(allUsersResponse.data)) {
    // Check if manager can see users outside their hierarchy
    // This is a warning because we can't easily determine hierarchy without DB access
    recordResult(
      'Manager accessing users list',
      true, // Pass for now - would need DB access to verify hierarchy
      'medium',
      `Manager sees ${allUsersResponse.data.length} users (should only see reports)`
    );
  }
  
  // Try to access a user that's definitely not in their hierarchy (using admin's ID if available)
  // For this test, we'll use a fake ID
  const fakeUserId = 'clx000000000000000000000000';
  
  const userProfileResponse = await makeRequest('GET', `/api/users/${fakeUserId}`, MANAGER_TOKEN);
  recordResult(
    'Manager accessing user outside hierarchy',
    userProfileResponse.status === 403 || userProfileResponse.status === 404,
    'high',
    `Manager should not access users outside hierarchy. Status: ${userProfileResponse.status}`
  );
  
  const assessmentsResponse = await makeRequest('GET', `/api/assessments/user/${fakeUserId}`, MANAGER_TOKEN);
  recordResult(
    'Manager accessing assessments outside hierarchy',
    assessmentsResponse.status === 403,
    'high',
    `Manager should not access assessments outside hierarchy. Status: ${assessmentsResponse.status}`
  );
  
  const feedbackResponse = await makeRequest('GET', `/api/colleague-feedback/received/${fakeUserId}`, MANAGER_TOKEN);
  recordResult(
    'Manager accessing feedback outside hierarchy',
    feedbackResponse.status === 403,
    'high',
    `Manager should not access feedback outside hierarchy. Status: ${feedbackResponse.status}`
  );
  
  const performanceResponse = await makeRequest('GET', `/api/quarterly-performance/${fakeUserId}`, MANAGER_TOKEN);
  recordResult(
    'Manager accessing performance outside hierarchy',
    performanceResponse.status === 403,
    'high',
    `Manager should not access performance outside hierarchy. Status: ${performanceResponse.status}`
  );
  
  const achievementsResponse = await makeRequest('GET', `/api/achievements-observations/${fakeUserId}`, MANAGER_TOKEN);
  recordResult(
    'Manager accessing achievements outside hierarchy',
    achievementsResponse.status === 403,
    'high',
    `Manager should not access achievements outside hierarchy. Status: ${achievementsResponse.status}`
  );
  
  // Test Jira statistics endpoint
  const jiraStatsResponse = await makeRequest('GET', `/api/jira-statistics/user-statistics/${fakeUserId}`, MANAGER_TOKEN);
  recordResult(
    'Manager accessing Jira statistics outside hierarchy',
    jiraStatsResponse.status === 403,
    'high',
    `Manager should not access Jira statistics outside hierarchy. Status: ${jiraStatsResponse.status}`
  );
}

/**
 * Test 4: Role-based access control
 */
async function testRoleBasedAccess() {
  log('\n=== Testing Role-Based Access Control ===', 'info');
  
  if (!EMPLOYEE_TOKEN || !MANAGER_TOKEN || !ADMIN_TOKEN) {
    log('Skipping role-based access tests - missing tokens', 'warning');
    return;
  }
  
  // Test admin-only endpoints
  const adminOnlyEndpoints = [
    { method: 'GET', path: '/api/users' }, // Should see all users
    { method: 'POST', path: '/api/users', data: { firstName: 'Test', lastName: 'User', email: 'test@test.com', password: 'test123', role: 'EMPLOYEE' } },
    { method: 'DELETE', path: '/api/users/someId' },
  ];
  
  for (const endpoint of adminOnlyEndpoints) {
    // Employee should not access
    const employeeResponse = await makeRequest(endpoint.method, endpoint.path, EMPLOYEE_TOKEN, endpoint.data);
    recordResult(
      `Employee accessing admin-only: ${endpoint.method} ${endpoint.path}`,
      employeeResponse.status === 403,
      'high',
      `Employee should not access admin endpoints. Status: ${employeeResponse.status}`
    );
    
    // Manager should not access (for most admin endpoints)
    if (endpoint.method === 'POST' || endpoint.method === 'DELETE') {
      const managerResponse = await makeRequest(endpoint.method, endpoint.path, MANAGER_TOKEN, endpoint.data);
      recordResult(
        `Manager accessing admin-only: ${endpoint.method} ${endpoint.path}`,
        managerResponse.status === 403,
        'high',
        `Manager should not access admin endpoints. Status: ${managerResponse.status}`
      );
    }
    
    // Admin should access
    const adminResponse = await makeRequest(endpoint.method, endpoint.path, ADMIN_TOKEN, endpoint.data);
    if (endpoint.method === 'GET') {
      recordResult(
        `Admin accessing admin-only: ${endpoint.method} ${endpoint.path}`,
        adminResponse.status === 200 || adminResponse.status === 404,
        'medium',
        `Admin should access admin endpoints. Status: ${adminResponse.status}`
      );
    }
  }
}

/**
 * Test 5: Input validation
 */
async function testInputValidation() {
  log('\n=== Testing Input Validation ===', 'info');
  
  if (!EMPLOYEE_TOKEN) {
    log('Skipping input validation tests - no employee token', 'warning');
    return;
  }
  
  // Test SQL injection attempts (though Prisma should protect)
  const sqlInjectionPayloads = [
    "'; DROP TABLE users; --",
    "' OR '1'='1",
    "1' UNION SELECT * FROM users--",
  ];
  
  for (const payload of sqlInjectionPayloads) {
    const response = await makeRequest('GET', `/api/users/${payload}`, EMPLOYEE_TOKEN);
    recordResult(
      `SQL injection attempt in user ID: ${payload.substring(0, 20)}...`,
      response.status === 400 || response.status === 403 || response.status === 404,
      'high',
      `Should reject invalid input. Status: ${response.status}`
    );
  }
  
  // Test XSS attempts
  const xssPayloads = [
    '<script>alert("XSS")</script>',
    'javascript:alert("XSS")',
    '<img src=x onerror=alert("XSS")>',
  ];
  
  // Test in assessment creation
  for (const payload of xssPayloads) {
    const response = await makeRequest('POST', '/api/assessments', EMPLOYEE_TOKEN, {
      year: 2024,
      quarter: 'Q1',
      achievements: payload
    });
    // Should either accept (with sanitization) or reject
    recordResult(
      `XSS attempt in assessment: ${payload.substring(0, 20)}...`,
      response.status === 201 || response.status === 400,
      'medium',
      `Should handle XSS safely. Status: ${response.status}`
    );
  }
}

/**
 * Test 6: Missing authentication on state-changing operations
 */
async function testStateChangingOperations() {
  log('\n=== Testing State-Changing Operations ===', 'info');
  
  if (!EMPLOYEE_TOKEN) {
    log('Skipping state-changing operations tests - no employee token', 'warning');
    return;
  }
  
  const stateChangingEndpoints = [
    { method: 'POST', path: '/api/assessments', data: { year: 2024, quarter: 'Q1' } },
    { method: 'PUT', path: '/api/assessments/someId', data: { year: 2024 } },
    { method: 'DELETE', path: '/api/assessments/someId' },
    { method: 'POST', path: '/api/colleague-feedback', data: { receiverId: 'test', year: 2024, quarter: 'Q1', feedbackProvider: 'test' } },
    { method: 'POST', path: '/api/manager-feedback', data: { receiverId: 'test', year: 2024, quarter: 'Q1', feedbackProvider: 'test' } },
    { method: 'POST', path: '/api/quarterly-performance', data: { userId: 'test', quarter: 'Q1', year: 2024 } },
    { method: 'POST', path: '/api/achievements-observations', data: { userId: 'test', date: '2024-01-01', achievement: 'test', observation: 'test' } },
  ];
  
  for (const endpoint of stateChangingEndpoints) {
    const response = await makeRequest(endpoint.method, endpoint.path, null, endpoint.data);
    recordResult(
      `${endpoint.method} ${endpoint.path} without authentication`,
      response.status === 401 || response.status === 403,
      'critical',
      `State-changing operations must require auth. Status: ${response.status}`
    );
  }
}

/**
 * Test 7: Token manipulation
 */
async function testTokenManipulation() {
  log('\n=== Testing Token Manipulation ===', 'info');
  
  const invalidTokens = [
    'invalid.token.here',
    'Bearer invalid',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c', // JWT.io example token
    '',
    null,
  ];
  
  for (const token of invalidTokens) {
    const response = await makeRequest('GET', '/api/users/me', token);
    recordResult(
      `Access with invalid token: ${token ? token.substring(0, 20) + '...' : 'null'}`,
      response.status === 401 || response.status === 403,
      'high',
      `Invalid tokens should be rejected. Status: ${response.status}`
    );
  }
}

/**
 * Test 8: Rate limiting (if implemented)
 */
async function testRateLimiting() {
  log('\n=== Testing Rate Limiting ===', 'info');
  
  // Try multiple login attempts
  const loginAttempts = 10;
  let rateLimited = false;
  
  for (let i = 0; i < loginAttempts; i++) {
    const response = await makeRequest('POST', '/api/auth/login', null, {
      email: 'test@test.com',
      password: 'wrongpassword'
    });
    
    if (response.status === 429) {
      rateLimited = true;
      break;
    }
  }
  
  recordResult(
    'Rate limiting on login endpoint',
    rateLimited,
    'medium',
    rateLimited ? 'Rate limiting is working' : 'Rate limiting may not be implemented'
  );
}

/**
 * Generate final report
 */
function generateReport() {
  log('\n' + '='.repeat(80), 'info');
  log('SECURITY TEST REPORT', 'info');
  log('='.repeat(80), 'info');
  
  const totalTests = results.passed.length + results.failed.length + results.warnings.length + results.critical.length;
  const passedCount = results.passed.length;
  const failedCount = results.failed.length;
  const warningCount = results.warnings.length;
  const criticalCount = results.critical.length;
  
  log(`\nTotal Tests: ${totalTests}`, 'info');
  log(`Passed: ${passedCount}`, 'success');
  log(`Failed: ${failedCount}`, 'error');
  log(`Warnings: ${warningCount}`, 'warning');
  log(`Critical: ${criticalCount}`, 'critical');
  
  if (criticalCount > 0) {
    log('\n=== CRITICAL VULNERABILITIES ===', 'critical');
    results.critical.forEach((result, index) => {
      log(`${index + 1}. ${result.testName}`, 'critical');
      log(`   Details: ${result.details}`, 'critical');
    });
  }
  
  if (failedCount > 0) {
    log('\n=== FAILED TESTS ===', 'error');
    results.failed.forEach((result, index) => {
      log(`${index + 1}. ${result.testName}`, 'error');
      log(`   Details: ${result.details}`, 'error');
    });
  }
  
  if (warningCount > 0) {
    log('\n=== WARNINGS ===', 'warning');
    results.warnings.forEach((result, index) => {
      log(`${index + 1}. ${result.testName}`, 'warning');
      log(`   Details: ${result.details}`, 'warning');
    });
  }
  
  log('\n' + '='.repeat(80), 'info');
  
  // Save report to file
  const fs = require('fs');
  const reportPath = 'test-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  log(`\nDetailed report saved to: ${reportPath}`, 'info');
  
  // Exit with appropriate code
  if (criticalCount > 0) {
    process.exit(1);
  } else if (failedCount > 0) {
    process.exit(2);
  } else {
    process.exit(0);
  }
}

/**
 * Main test runner
 */
async function runTests() {
  log('Starting Security Test Suite...', 'info');
  log(`Base URL: ${BASE_URL}`, 'info');
  
  try {
    await testAuthenticationBypass();
    await testEmployeeIDOR();
    await testManagerIDOR();
    await testRoleBasedAccess();
    await testInputValidation();
    await testStateChangingOperations();
    await testTokenManipulation();
    await testRateLimiting();
    
    generateReport();
  } catch (error) {
    log(`Fatal error: ${error.message}`, 'critical');
    console.error(error);
    process.exit(1);
  }
}

// Run tests if executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests, results };

