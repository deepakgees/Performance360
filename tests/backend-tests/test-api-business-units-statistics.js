/**
 * Business Units Statistics API Endpoint Tests
 * 
 * Tests the /api/business-units/:id/statistics endpoint
 * 
 * Prerequisites:
 *   - Backend server running on http://localhost:3001
 *   - Test user with admin or manager role exists
 *   - At least one business unit exists in the database
 */

const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'admin@company.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'admin123';

async function run(recordResult, recordWarning) {
  let token = null;
  let businessUnitId = null;

  // Test 1: Login to get authentication token
  try {
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
    });

    if (loginResponse.data && loginResponse.data.token) {
      token = loginResponse.data.token;
      recordResult('Business Units Statistics - Login', true, 'Successfully authenticated');
    } else {
      recordResult('Business Units Statistics - Login', false, 'No token in response');
      return;
    }
  } catch (error) {
    if (error.response && error.response.status === 401) {
      recordWarning('Business Units Statistics - Login', 
        'Authentication failed. Test user may not exist. Create user with: email=admin@company.com, password=admin123, role=ADMIN');
    } else if (error.code === 'ECONNREFUSED') {
      recordWarning('Business Units Statistics - Login', 
        'Cannot connect to backend server. Make sure server is running on http://localhost:3001');
    } else {
      recordResult('Business Units Statistics - Login', false, 
        `Login failed: ${error.response?.data?.message || error.message}`);
    }
    return;
  }

  // Test 2: Get a business unit ID to test with
  try {
    const response = await axios.get(`${BASE_URL}/api/business-units`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (Array.isArray(response.data) && response.data.length > 0) {
      businessUnitId = response.data[0].id;
      recordResult('Business Units Statistics - Get Business Unit ID', true, 
        `Found business unit with ID: ${businessUnitId}`);
    } else {
      recordWarning('Business Units Statistics - Get Business Unit ID', 
        'No business units found. Create a business unit first to test statistics endpoint.');
      businessUnitId = 'test-id-that-does-not-exist';
    }
  } catch (error) {
    recordWarning('Business Units Statistics - Get Business Unit ID', 
      `Could not fetch business units: ${error.message}. Using test ID.`);
    businessUnitId = 'test-id-that-does-not-exist';
  }

  // Test 3: Fetch statistics for existing business unit
  if (businessUnitId && businessUnitId !== 'test-id-that-does-not-exist') {
    try {
      const response = await axios.get(`${BASE_URL}/api/business-units/${businessUnitId}/statistics`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Verify response structure
      const data = response.data;
      const hasBusinessUnit = data.businessUnit && 
        typeof data.businessUnit.id === 'string' &&
        typeof data.businessUnit.name === 'string' &&
        typeof data.businessUnit.totalMembers === 'number';
      
      const hasAttendance = data.attendance && 
        typeof data.attendance.complianceRate === 'number' &&
        Array.isArray(data.attendance.trends);
      
      const hasFeedbackCompletion = data.feedbackCompletion &&
        data.feedbackCompletion.selfAssessment &&
        data.feedbackCompletion.managerFeedback &&
        data.feedbackCompletion.colleagueFeedback;
      
      const hasFeedbackRatings = data.feedbackRatings &&
        (data.feedbackRatings.averageSelfAssessment === null || typeof data.feedbackRatings.averageSelfAssessment === 'number') &&
        (data.feedbackRatings.averageManagerRating === null || typeof data.feedbackRatings.averageManagerRating === 'number') &&
        (data.feedbackRatings.averageColleagueRating === null || typeof data.feedbackRatings.averageColleagueRating === 'number');

      if (hasBusinessUnit && hasAttendance && hasFeedbackCompletion && hasFeedbackRatings) {
        recordResult('Business Units Statistics - Fetch Statistics', true, 
          `Successfully fetched statistics for business unit. Members: ${data.businessUnit.totalMembers}, Compliance: ${data.attendance.complianceRate.toFixed(2)}%`);
      } else {
        recordResult('Business Units Statistics - Fetch Statistics', false, 
          'Response structure is invalid. Missing required fields.');
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        recordResult('Business Units Statistics - Fetch Statistics', false, 
          'Business unit not found (404)');
      } else {
        recordResult('Business Units Statistics - Fetch Statistics', false, 
          `Request failed: ${error.response?.status || 'Unknown'} - ${error.response?.data?.message || error.message}`);
      }
    }
  }

  // Test 4: Test with non-existent business unit ID (should return 404)
  try {
    await axios.get(`${BASE_URL}/api/business-units/non-existent-id-12345/statistics`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    recordResult('Business Units Statistics - Non-existent ID', false, 
      'Should return 404 for non-existent business unit');
  } catch (error) {
    if (error.response && error.response.status === 404) {
      recordResult('Business Units Statistics - Non-existent ID', true, 
        'Correctly returns 404 for non-existent business unit');
    } else {
      recordResult('Business Units Statistics - Non-existent ID', false, 
        `Unexpected error: ${error.response?.status || error.message}`);
    }
  }

  // Test 5: Test without authentication (should fail)
  try {
    await axios.get(`${BASE_URL}/api/business-units/${businessUnitId || 'test-id'}/statistics`);
    recordResult('Business Units Statistics - Authentication required', false, 
      'Endpoint should require authentication but request succeeded');
  } catch (error) {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      recordResult('Business Units Statistics - Authentication required', true, 
        'Endpoint correctly requires authentication');
    } else {
      recordResult('Business Units Statistics - Authentication required', false, 
        `Unexpected error: ${error.response?.status || error.message}`);
    }
  }

  // Test 6: Verify attendance trends structure
  if (businessUnitId && businessUnitId !== 'test-id-that-does-not-exist') {
    try {
      const response = await axios.get(`${BASE_URL}/api/business-units/${businessUnitId}/statistics`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const trends = response.data.attendance?.trends || [];
      if (Array.isArray(trends)) {
        const isValidTrend = trends.length === 0 || trends.every(trend => 
          typeof trend.month === 'string' &&
          typeof trend.year === 'number' &&
          typeof trend.monthNumber === 'number' &&
          typeof trend.complianceRate === 'number' &&
          typeof trend.compliantMembers === 'number' &&
          typeof trend.totalMembersWithData === 'number'
        );

        if (isValidTrend) {
          recordResult('Business Units Statistics - Attendance Trends Structure', true, 
            `Attendance trends structure is valid. Found ${trends.length} trend(s)`);
        } else {
          recordResult('Business Units Statistics - Attendance Trends Structure', false, 
            'Attendance trends structure is invalid. Missing required fields.');
        }
      } else {
        recordResult('Business Units Statistics - Attendance Trends Structure', false, 
          'Attendance trends is not an array');
      }
    } catch (error) {
      recordWarning('Business Units Statistics - Attendance Trends Structure', 
        `Could not verify trends structure: ${error.message}`);
    }
  }
}

module.exports = { run };
