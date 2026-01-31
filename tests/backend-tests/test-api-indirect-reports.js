/**
 * Indirect Reports API Endpoint Tests
 * 
 * Tests the /api/users/indirect-reports endpoint
 * 
 * Prerequisites:
 *   - Backend server running on http://localhost:3001
 *   - Test user with manager role exists (manager@company.com / manager123)
 */

const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'manager@company.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'manager123';

async function run(recordResult, recordWarning) {
  let token = null;

  // Test 1: Login to get authentication token
  try {
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
    });

    if (loginResponse.data && loginResponse.data.token) {
      token = loginResponse.data.token;
      recordResult('API Indirect Reports - Login', true, 'Successfully authenticated');
    } else {
      recordResult('API Indirect Reports - Login', false, 'No token in response');
      return;
    }
  } catch (error) {
    if (error.response && error.response.status === 401) {
      recordWarning('API Indirect Reports - Login', 
        'Authentication failed. Test user may not exist. Create user with: email=manager@company.com, password=manager123, role=MANAGER');
    } else if (error.code === 'ECONNREFUSED') {
      recordWarning('API Indirect Reports - Login', 
        'Cannot connect to backend server. Make sure server is running on http://localhost:3001');
    } else {
      recordResult('API Indirect Reports - Login', false, 
        `Login failed: ${error.response?.data?.message || error.message}`);
    }
    return;
  }

  // Test 2: Fetch indirect reports
  try {
    const response = await axios.get(`${BASE_URL}/api/users/indirect-reports`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (Array.isArray(response.data)) {
      recordResult('API Indirect Reports - Fetch endpoint', true, 
        `Successfully fetched ${response.data.length} indirect report(s)`);
    } else {
      recordResult('API Indirect Reports - Fetch endpoint', false, 
        'Response is not an array');
    }
  } catch (error) {
    if (error.response) {
      recordResult('API Indirect Reports - Fetch endpoint', false, 
        `Request failed: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
    } else {
      recordResult('API Indirect Reports - Fetch endpoint', false, 
        `Request failed: ${error.message}`);
    }
  }

  // Test 3: Verify manager information in response
  try {
    const response = await axios.get(`${BASE_URL}/api/users/indirect-reports`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (Array.isArray(response.data) && response.data.length > 0) {
      const reportsWithManager = response.data.filter(
        report => report.manager && report.manager.id
      ).length;
      const totalReports = response.data.length;

      if (reportsWithManager === totalReports) {
        recordResult('API Indirect Reports - Manager info', true, 
          `All ${totalReports} report(s) include manager information`);
      } else {
        recordWarning('API Indirect Reports - Manager info', 
          `${reportsWithManager}/${totalReports} report(s) have manager information`);
      }
    } else {
      recordWarning('API Indirect Reports - Manager info', 
        'No indirect reports found to verify manager information');
    }
  } catch (error) {
    recordWarning('API Indirect Reports - Manager info', 
      `Could not verify manager info: ${error.message}`);
  }

  // Test 4: Test without authentication (should fail)
  try {
    await axios.get(`${BASE_URL}/api/users/indirect-reports`);
    recordResult('API Indirect Reports - Authentication required', false, 
      'Endpoint should require authentication but request succeeded');
  } catch (error) {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      recordResult('API Indirect Reports - Authentication required', true, 
        'Endpoint correctly requires authentication');
    } else {
      recordResult('API Indirect Reports - Authentication required', false, 
        `Unexpected error: ${error.response?.status || error.message}`);
    }
  }
}

module.exports = { run };
