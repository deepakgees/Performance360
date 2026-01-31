/**
 * Jira Authentication Test Utility
 * 
 * Tests Jira API authentication and ticket extraction
 * 
 * Usage:
 *   JIRA_USERNAME=your-username JIRA_PASSWORD=your-password node scripts/test-utilities/test-jira-auth.js
 * 
 * Or set in .env file:
 *   JIRA_USERNAME=your-username
 *   JIRA_PASSWORD=your-password
 */

const axios = require('axios');
require('dotenv').config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001/api';
const JIRA_USERNAME = process.env.JIRA_USERNAME || 'your-jira-username';
const JIRA_PASSWORD = process.env.JIRA_PASSWORD || 'your-jira-password';
const JIRA_SERVER = process.env.JIRA_SERVER || 'https://nexontis.atlassian.net';

async function testJiraAuthentication() {
  console.log('🧪 Testing Jira Authentication...\n');

  if (JIRA_USERNAME === 'your-jira-username' || JIRA_PASSWORD === 'your-jira-password') {
    console.error('❌ Error: Jira credentials not set!');
    console.error('   Set JIRA_USERNAME and JIRA_PASSWORD environment variables');
    console.error('   or add them to your .env file');
    process.exit(1);
  }

  try {
    // Test with a simple JQL query
    console.log('1. Testing with simple JQL query...');
    const extractResponse = await axios.post(
      `${BASE_URL}/jira-tickets/extract`,
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

    console.log('✅ Authentication successful!');
    console.log('Response:', JSON.stringify(extractResponse.data, null, 2));
  } catch (error) {
    console.error('❌ Authentication failed:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data);
    console.error('URL:', error.config?.url);
    process.exit(1);
  }
}

// Run the test
testJiraAuthentication();
