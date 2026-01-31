/**
 * Database Connection and Query Tests
 * 
 * Tests database connectivity and basic queries
 */

// Load environment variables from backend .env file
require('dotenv').config({ path: require('path').join(__dirname, '../../backend/.env') });

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function run(recordResult, recordWarning) {
  // Test 1: Database connection
  try {
    await prisma.$connect();
    recordResult('Database - Connection', true, 'Successfully connected to database');
  } catch (error) {
    recordResult('Database - Connection', false, `Connection failed: ${error.message}`);
    await prisma.$disconnect();
    return; // Can't continue if connection fails
  }

  // Test 2: JiraConfiguration table exists and is queryable
  try {
    const count = await prisma.jiraConfiguration.count();
    recordResult('Database - JiraConfiguration table', true, 
      `Table exists and contains ${count} configuration(s)`);
  } catch (error) {
    recordResult('Database - JiraConfiguration table', false, 
      `Table query failed: ${error.message}`);
  }

  // Test 3: Query JiraConfiguration table
  try {
    const configs = await prisma.jiraConfiguration.findMany({
      select: {
        id: true,
        name: true,
        serverUrl: true,
        username: true,
        jql: true,
        isActive: true,
      },
      take: 5,
    });
    
    recordResult('Database - JiraConfiguration query', true, 
      `Successfully queried ${configs.length} configuration(s)`);
  } catch (error) {
    recordResult('Database - JiraConfiguration query', false, 
      `Query failed: ${error.message}`);
  }

  // Test 4: User table exists and is queryable
  try {
    const userCount = await prisma.user.count();
    recordResult('Database - User table', true, 
      `Table exists and contains ${userCount} user(s)`);
  } catch (error) {
    recordResult('Database - User table', false, 
      `Table query failed: ${error.message}`);
  }

  // Test 5: Query User table with select
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
      take: 5,
    });
    
    recordResult('Database - User query', true, 
      `Successfully queried ${users.length} user(s)`);
  } catch (error) {
    recordResult('Database - User query', false, 
      `Query failed: ${error.message}`);
  }

  // Test 6: Database transaction test
  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.count();
    });
    recordResult('Database - Transaction support', true, 'Transactions work correctly');
  } catch (error) {
    recordResult('Database - Transaction support', false, 
      `Transaction failed: ${error.message}`);
  }

  // Cleanup
  try {
    await prisma.$disconnect();
  } catch (error) {
    recordWarning('Database - Disconnect', `Error disconnecting: ${error.message}`);
  }
}

module.exports = { run };
