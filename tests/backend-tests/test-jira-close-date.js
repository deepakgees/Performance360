/**
 * Jira Ticket Close Date Logic Tests
 * 
 * Tests the database state for Jira tickets and close date logic
 */

// Load environment variables from backend .env file
require('dotenv').config({ path: require('path').join(__dirname, '../../backend/.env') });

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function run(recordResult, recordWarning) {
  try {
    await prisma.$connect();
  } catch (error) {
    recordResult('Jira Close Date - Database connection', false, 
      `Connection failed: ${error.message}`);
    return;
  }

  // Test 1: Check JiraTicket table exists
  try {
    const totalCount = await prisma.jiraTicket.count();
    recordResult('Jira Close Date - Table exists', true, 
      `JiraTicket table exists with ${totalCount} ticket(s)`);
  } catch (error) {
    recordResult('Jira Close Date - Table exists', false, 
      `Table query failed: ${error.message}`);
    await prisma.$disconnect();
    return;
  }

  // Test 2: Check tickets with and without endDate
  try {
    const totalCount = await prisma.jiraTicket.count();
    const withEndDate = await prisma.jiraTicket.count({
      where: { endDate: { not: null } },
    });
    const withoutEndDate = await prisma.jiraTicket.count({
      where: { endDate: null },
    });

    recordResult('Jira Close Date - endDate statistics', true, 
      `Total: ${totalCount}, With endDate: ${withEndDate}, Without: ${withoutEndDate}`);

    if (withoutEndDate > 0) {
      recordWarning('Jira Close Date - Missing endDate', 
        `${withoutEndDate} ticket(s) without endDate. This may indicate tickets need re-extraction.`);
    }
  } catch (error) {
    recordResult('Jira Close Date - endDate statistics', false, 
      `Query failed: ${error.message}`);
  }

  // Test 3: Check active Jira configurations
  try {
    const configurations = await prisma.jiraConfiguration.findMany({
      where: { isActive: true },
      select: {
        name: true,
        ticketClosesStatuses: true,
      },
    });

    if (configurations.length > 0) {
      recordResult('Jira Close Date - Active configurations', true, 
        `Found ${configurations.length} active configuration(s) with close statuses defined`);
      
      configurations.forEach(config => {
        if (config.ticketClosesStatuses && config.ticketClosesStatuses.length > 0) {
          recordResult(`Jira Close Date - Config "${config.name}"`, true, 
            `Has ${config.ticketClosesStatuses.length} close status(es) defined`);
        } else {
          recordWarning(`Jira Close Date - Config "${config.name}"`, 
            'No close statuses defined');
        }
      });
    } else {
      recordWarning('Jira Close Date - Active configurations', 
        'No active Jira configurations found. Close date logic requires active configurations.');
    }
  } catch (error) {
    recordResult('Jira Close Date - Active configurations', false, 
      `Query failed: ${error.message}`);
  }

  // Test 4: Sample tickets query
  try {
    const sampleTickets = await prisma.jiraTicket.findMany({
      where: { endDate: null },
      take: 5,
      select: {
        jiraId: true,
        title: true,
        createDate: true,
        priority: true,
        endDate: true,
      },
    });

    if (sampleTickets.length > 0) {
      recordResult('Jira Close Date - Sample tickets query', true, 
        `Found ${sampleTickets.length} sample ticket(s) without endDate`);
    } else {
      recordResult('Jira Close Date - Sample tickets query', true, 
        'All tickets have endDate set (or no tickets exist)');
    }
  } catch (error) {
    recordResult('Jira Close Date - Sample tickets query', false, 
      `Query failed: ${error.message}`);
  }

  // Cleanup
  try {
    await prisma.$disconnect();
  } catch (error) {
    recordWarning('Jira Close Date - Disconnect', `Error disconnecting: ${error.message}`);
  }
}

module.exports = { run };
