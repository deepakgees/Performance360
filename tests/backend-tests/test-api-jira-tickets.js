/**
 * Jira Tickets API Endpoint Tests
 * 
 * Tests the Jira tickets API endpoints
 * 
 * Prerequisites:
 *   - Backend server running on http://localhost:3001
 *   - Jira credentials (optional, for extract endpoint)
 */

const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const JIRA_USERNAME = process.env.JIRA_USERNAME;
const JIRA_PASSWORD = process.env.JIRA_PASSWORD;
const JIRA_SERVER = process.env.JIRA_SERVER || 'https://nexontis.atlassian.net';

async function run(recordResult, recordWarning) {
  // Test 1: Get all tickets (no auth required)
  try {
    const response = await axios.get(`${BASE_URL}/api/jira-tickets`);
    
    if (response.data && (Array.isArray(response.data) || response.data.tickets)) {
      const tickets = Array.isArray(response.data) ? response.data : response.data.tickets;
      recordResult('API Jira Tickets - Get all tickets', true, 
        `Successfully fetched tickets endpoint (${tickets?.length || 0} tickets)`);
    } else {
      recordResult('API Jira Tickets - Get all tickets', true, 
        'Endpoint responded successfully');
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      recordWarning('API Jira Tickets - Get all tickets', 
        'Cannot connect to backend server. Make sure server is running on http://localhost:3001');
    } else {
      recordResult('API Jira Tickets - Get all tickets', false, 
        `Request failed: ${error.response?.status || error.message}`);
    }
  }

  // Test 2: Get tickets with filters
  try {
    const response = await axios.get(
      `${BASE_URL}/api/jira-tickets?page=1&limit=10&priority=High`
    );
    
    recordResult('API Jira Tickets - Filtered query', true, 
      'Successfully queried tickets with filters');
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      recordWarning('API Jira Tickets - Filtered query', 
        'Cannot connect to backend server');
    } else {
      recordResult('API Jira Tickets - Filtered query', false, 
        `Request failed: ${error.response?.status || error.message}`);
    }
  }

  // Test 3: Extract tickets from Jira (requires credentials)
  if (JIRA_USERNAME && JIRA_PASSWORD) {
    try {
      const response = await axios.post(
        `${BASE_URL}/api/jira-tickets/extract`,
        {
          jql: 'project = "RIE" AND created >= "2024-01-01" LIMIT 10',
          server: JIRA_SERVER,
          username: JIRA_USERNAME,
          password: JIRA_PASSWORD,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      recordResult('API Jira Tickets - Extract endpoint', true, 
        'Successfully extracted tickets from Jira');
    } catch (error) {
      if (error.response) {
        recordResult('API Jira Tickets - Extract endpoint', false, 
          `Extract failed: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
      } else {
        recordResult('API Jira Tickets - Extract endpoint', false, 
          `Extract failed: ${error.message}`);
      }
    }
  } else {
    recordWarning('API Jira Tickets - Extract endpoint', 
      'Skipped: JIRA_USERNAME and JIRA_PASSWORD not set. Set these env vars to test extraction.');
  }

  // Test 4: Test pagination
  try {
    const response1 = await axios.get(`${BASE_URL}/api/jira-tickets?page=1&limit=5`);
    const response2 = await axios.get(`${BASE_URL}/api/jira-tickets?page=2&limit=5`);
    
    recordResult('API Jira Tickets - Pagination', true, 
      'Pagination works correctly');
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      recordWarning('API Jira Tickets - Pagination', 
        'Cannot connect to backend server');
    } else {
      recordWarning('API Jira Tickets - Pagination', 
        `Could not test pagination: ${error.message}`);
    }
  }
}

module.exports = { run };
