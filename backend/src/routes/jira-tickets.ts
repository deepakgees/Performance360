import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { logger } from '../utils/logger';

const router = express.Router();
const prisma = new PrismaClient();

interface JiraTicketData {
  id: string;
  key: string;
  fields: {
    summary: string;
    priority: {
      name: string;
    };
    status: {
      name: string;
    };
    created: string;
    resolutiondate: string;
    timeoriginalestimate: number;
    components: Array<{
      name: string;
    }>;
    duedate: string;
    assignee: {
      displayName: string;
    };
    reporter: {
      displayName: string;
    };
  };
  changelog: {
    histories: Array<{
      created: string;
      items: Array<{
        field: string;
        fromString: string;
        toString: string;
      }>;
    }>;
  };
}

interface ExtractedTicketData {
  jiraId: string;
  link: string;
  title: string;
  priority: string;
  status: string;
  createDate: Date | null;
  endDate: Date; // **CHANGED: Always required now**
  originalEstimate: number | null;
  components: string[];
  dueDate: Date | null;
  assignee: string | null;
  reporter: string | null;
  inProgressTime: number | null;
  blockedTime: number | null;
  reviewTime: number | null;
  promotionTime: number | null;
  refinementTime: number | null;
  readyForDevelopmentTime: number | null;
  unmappedStatuses: string[];
}

// Validation middleware
const validateJiraRequest = [
  body('jql').notEmpty().withMessage('JQL query is required'),
  body('server').notEmpty().withMessage('Jira server URL is required'),
  body('username').notEmpty().withMessage('Jira username is required'),
  body('password').optional(),
  body('apiToken').optional(),
  // Custom validation to ensure either password or apiToken is provided
  body().custom(value => {
    if (!value.password && !value.apiToken) {
      throw new Error('Either password or apiToken must be provided');
    }
    return true;
  }),
];

// Helper function to find the appropriate Jira configuration for a ticket
async function findConfigurationForTicket(jiraId: string): Promise<{
  inProgressStatuses: string[];
  blockedStatuses: string[];
  reviewStatuses: string[];
  promotionStatuses: string[];
  refinementStatuses: string[];
  readyForDevelopmentStatuses: string[];
  ticketClosesStatuses: string[];
} | null> {
  // Get all active Jira configurations
  const configurations = await prisma.jiraConfiguration.findMany({
    where: { isActive: true },
    select: {
      name: true,
      inProgressStatuses: true,
      blockedStatuses: true,
      reviewStatuses: true,
      promotionStatuses: true,
      refinementStatuses: true,
      readyForDevelopmentStatuses: true,
      ticketClosesStatuses: true,
    },
  });

  // Find configuration whose name matches the Jira ID prefix
  for (const config of configurations) {
    if (jiraId.startsWith(config.name)) {
      logger.logInfo(
        `Found configuration for ticket ${jiraId}: ${config.name}`
      );
      return {
        inProgressStatuses: config.inProgressStatuses,
        blockedStatuses: config.blockedStatuses,
        reviewStatuses: config.reviewStatuses,
        promotionStatuses: config.promotionStatuses,
        refinementStatuses: config.refinementStatuses,
        readyForDevelopmentStatuses: config.readyForDevelopmentStatuses,
        ticketClosesStatuses: config.ticketClosesStatuses,
      };
    }
  }

  logger.logWarning(`No configuration found for ticket ${jiraId}`);
  return null;
}

// Helper function to calculate time spent in a status
function calculateStatusTime(changelog: any, targetStatuses: string[]): number {
  let totalTime = 0;
  let statusPeriods: Array<{
    status: string;
    startTime: Date;
    endTime?: Date;
  }> = [];

  if (!changelog?.histories) return 0;

  // Sort histories by creation time to ensure chronological order
  const sortedHistories = changelog.histories.sort(
    (a: any, b: any) =>
      new Date(a.created).getTime() - new Date(b.created).getTime()
  );

  // Track status changes chronologically
  for (const history of sortedHistories) {
    for (const item of history.items) {
      if (item.field === 'status') {
        const changeTime = new Date(history.created);

        // Close the previous status period if it exists
        if (statusPeriods.length > 0) {
          const lastPeriod = statusPeriods[statusPeriods.length - 1];
          if (!lastPeriod.endTime) {
            lastPeriod.endTime = changeTime;
          }
        }

        // Add new status period
        statusPeriods.push({
          status: item.toString,
          startTime: changeTime,
        });
      }
    }
  }

  // Close the last status period if it's still open
  if (statusPeriods.length > 0) {
    const lastPeriod = statusPeriods[statusPeriods.length - 1];
    if (!lastPeriod.endTime) {
      lastPeriod.endTime = new Date();
    }
  }

  // Calculate total time for target statuses (case-insensitive comparison)
  for (const period of statusPeriods) {
    const isTargetStatus = targetStatuses.some(
      targetStatus => targetStatus.toLowerCase() === period.status.toLowerCase()
    );
    if (isTargetStatus && period.endTime) {
      const duration =
        (period.endTime.getTime() - period.startTime.getTime()) / 1000;
      totalTime += duration;
    }
  }

  // Debug: Log status periods for tickets with multiple status changes
  if (statusPeriods.length > 1) {
    const statusNames = statusPeriods.map(p => p.status);
    const matchingStatuses = statusNames.filter(s =>
      targetStatuses.some(
        targetStatus => targetStatus.toLowerCase() === s.toLowerCase()
      )
    );
    if (matchingStatuses.length > 0) {
      logger.logInfo(
        `Status periods: ${statusNames.join(
          ' -> '
        )} | Matching: ${matchingStatuses.join(
          ', '
        )} | Total time: ${totalTime}s`
      );
    }
  }

  return Math.round(totalTime);
}

// Helper function to find the date when a ticket moved to a closed status
function findTicketCloseDate(
  changelog: any,
  ticketClosesStatuses: string[]
): Date | null {
  if (!changelog?.histories || ticketClosesStatuses.length === 0) {
    return null;
  }

  // Sort histories by creation time to ensure chronological order
  const sortedHistories = changelog.histories.sort(
    (a: any, b: any) =>
      new Date(a.created).getTime() - new Date(b.created).getTime()
  );

  // Find the first time the ticket moved to a closed status
  for (const history of sortedHistories) {
    for (const item of history.items) {
      if (item.field === 'status') {
        const isClosedStatus = ticketClosesStatuses.some(
          closedStatus =>
            closedStatus.toLowerCase() === item.toString.toLowerCase()
        );

        if (isClosedStatus) {
          logger.logInfo(
            `Ticket ${history.key || 'unknown'} moved to closed status "${
              item.toString
            }" on ${history.created}`
          );
          return new Date(history.created);
        }
      }
    }
  }

  return null;
}

// Helper function to extract ticket data from Jira response
async function extractTicketData(
  ticket: JiraTicketData,
  serverUrl: string
  // Remove statusMappings parameter since we'll find it per ticket
): Promise<ExtractedTicketData | null> {
  const fields = ticket.fields;

  // Find the appropriate configuration for this ticket
  const statusMappings = await findConfigurationForTicket(ticket.key);

  if (!statusMappings) {
    logger.logWarning(
      `No configuration found for ticket ${ticket.key}, using default empty mappings`
    );
    // Use empty arrays as default if no configuration found
    const defaultMappings = {
      inProgressStatuses: [],
      blockedStatuses: [],
      reviewStatuses: [],
      promotionStatuses: [],
      refinementStatuses: [],
      readyForDevelopmentStatuses: [],
      ticketClosesStatuses: [],
    };

    // **NEW: Find close date using ticket closed statuses**
    const closeDate = findTicketCloseDate(
      ticket.changelog,
      defaultMappings.ticketClosesStatuses
    );

    // **NEW: Skip tickets that haven't been closed**
    if (!closeDate) {
      logger.logWarning(
        `Skipping ticket ${ticket.key} - no close date found using ticket closed statuses. This ticket may not be resolved.`
      );
      return null; // Return null to skip this ticket
    }

    return {
      jiraId: ticket.key,
      link: `${serverUrl}/browse/${ticket.key}`,
      title: fields.summary,
      priority: fields.priority?.name || 'Unknown',
      status: fields.status?.name || 'Unknown',
      createDate: fields.created ? new Date(fields.created) : null,
      endDate: closeDate, // **USE: Close date from status change**
      originalEstimate: fields.timeoriginalestimate || null,
      components: fields.components?.map(c => c.name) || [],
      dueDate: fields.duedate ? new Date(fields.duedate) : null,
      assignee: fields.assignee?.displayName || null,
      reporter: fields.reporter?.displayName || null,
      inProgressTime: 0,
      blockedTime: 0,
      reviewTime: 0,
      promotionTime: 0,
      refinementTime: 0,
      readyForDevelopmentTime: 0,
      unmappedStatuses: [],
    };
  }

  // **NEW: Find close date using ticket closed statuses**
  const closeDate = findTicketCloseDate(
    ticket.changelog,
    statusMappings.ticketClosesStatuses
  );

  // **NEW: Skip tickets that haven't been closed**
  if (!closeDate) {
    logger.logWarning(
      `Skipping ticket ${ticket.key} - no close date found using ticket closed statuses. This ticket may not be resolved.`
    );
    return null; // Return null to skip this ticket
  }

  const inProgressTime = calculateStatusTime(
    ticket.changelog,
    statusMappings.inProgressStatuses
  );
  const blockedTime = calculateStatusTime(
    ticket.changelog,
    statusMappings.blockedStatuses
  );
  const reviewTime = calculateStatusTime(
    ticket.changelog,
    statusMappings.reviewStatuses
  );
  const promotionTime = calculateStatusTime(
    ticket.changelog,
    statusMappings.promotionStatuses
  );
  const refinementTime = calculateStatusTime(
    ticket.changelog,
    statusMappings.refinementStatuses
  );
  const readyForDevelopmentTime = calculateStatusTime(
    ticket.changelog,
    statusMappings.readyForDevelopmentStatuses
  );

  // Collect all unique statuses from changelog
  const allStatuses = new Set<string>();
  if (ticket.changelog?.histories) {
    for (const history of ticket.changelog.histories) {
      for (const item of history.items) {
        if (item.field === 'status') {
          allStatuses.add(item.toString);
        }
      }
    }
  }

  // Find unmapped statuses using all configured status mappings (case-insensitive comparison)
  const mappedStatuses = [
    ...statusMappings.inProgressStatuses,
    ...statusMappings.blockedStatuses,
    ...statusMappings.reviewStatuses,
    ...statusMappings.promotionStatuses,
    ...statusMappings.refinementStatuses,
    ...statusMappings.readyForDevelopmentStatuses,
    ...statusMappings.ticketClosesStatuses,
  ];
  const unmappedStatuses = Array.from(allStatuses).filter(
    status =>
      !mappedStatuses.some(
        mappedStatus => mappedStatus.toLowerCase() === status.toLowerCase()
      )
  );

  // Log status times for debugging
  if (
    inProgressTime > 0 ||
    blockedTime > 0 ||
    reviewTime > 0 ||
    promotionTime > 0 ||
    refinementTime > 0 ||
    readyForDevelopmentTime > 0
  ) {
    logger.logInfo(
      `Ticket ${ticket.key} status times - InProgress: ${inProgressTime}s, Blocked: ${blockedTime}s, Review: ${reviewTime}s, Promotion: ${promotionTime}s, Refinement: ${refinementTime}s, ReadyForDevelopment: ${readyForDevelopmentTime}s`
    );
  }

  // Log unmapped statuses if any found
  if (unmappedStatuses.length > 0) {
    logger.logInfo(
      `Ticket ${ticket.key} has unmapped statuses: ${unmappedStatuses.join(
        ', '
      )}`
    );
  }

  return {
    jiraId: ticket.key,
    link: `${serverUrl}/browse/${ticket.key}`,
    title: fields.summary,
    priority: fields.priority?.name || 'Unknown',
    status: fields.status?.name || 'Unknown',
    createDate: fields.created ? new Date(fields.created) : null,
    endDate: closeDate, // **USE: Close date from status change**
    originalEstimate: fields.timeoriginalestimate || null,
    components: fields.components?.map(c => c.name) || [],
    dueDate: fields.duedate ? new Date(fields.duedate) : null,
    assignee: fields.assignee?.displayName || null,
    reporter: fields.reporter?.displayName || null,
    inProgressTime,
    blockedTime,
    reviewTime,
    promotionTime,
    refinementTime,
    readyForDevelopmentTime,
    unmappedStatuses,
  };
}

// GET /api/jira-tickets/test-connection
// Test Jira API connection
router.get('/test-connection', async (req: Request, res: Response) => {
  try {
    const { server, username, password, apiToken } = req.query;

    if (!server || !username) {
      return res.status(400).json({
        success: false,
        message: 'Server and username are required',
      });
    }

    if (!password && !apiToken) {
      return res.status(400).json({
        success: false,
        message: 'Either password or apiToken is required',
      });
    }

    // Determine authentication method
    let authHeader: string;
    if (apiToken) {
      // Use API Token with Basic Auth (Jira Cloud standard)
      const auth = Buffer.from(`${username}:${apiToken}`).toString('base64');
      authHeader = `Basic ${auth}`;
      logger.logInfo(
        'Using API Token with Basic Authentication (Jira Cloud standard)'
      );
    } else if (password) {
      // Use Basic Authentication (legacy method)
      const auth = Buffer.from(`${username}:${password}`).toString('base64');
      authHeader = `Basic ${auth}`;
      logger.logInfo('Using Basic Authentication (legacy)');
    } else {
      return res.status(400).json({
        success: false,
        message:
          'Either apiToken or password must be provided for authentication',
      });
    }

    // Clean server URL
    const cleanServer = (server as string).endsWith('/')
      ? (server as string).slice(0, -1)
      : (server as string);

    // Test connection using the /rest/api/3/myself endpoint
    const testUrl = `${cleanServer}/rest/api/3/myself`;
    logger.logInfo(`Testing Jira connection: ${testUrl}`);

    const response = await axios.get(testUrl, {
      headers: {
        Authorization: authHeader,
        Accept: 'application/json',
      },
      timeout: 10000, // 10 second timeout for test
    });

    logger.logInfo('Jira connection test successful');

    res.json({
      success: true,
      message: 'Jira connection successful',
      data: {
        user: response.data,
        server: cleanServer,
        authenticated: true,
      },
    });
  } catch (error: any) {
    logger.logError('Jira connection test failed', error);

    let errorMessage = 'Connection test failed';
    let statusCode = 500;

    if (error.response) {
      statusCode = error.response.status;
      if (error.response.status === 401) {
        errorMessage =
          'Authentication failed - check username and API token/password';
      } else if (error.response.status === 403) {
        errorMessage = 'Access forbidden - check API token permissions';
      } else if (error.response.status === 404) {
        errorMessage = 'Jira server not found - check server URL';
      } else {
        errorMessage = `Jira API error: ${error.response.status} ${error.response.statusText}`;
      }
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage =
        'Cannot connect to Jira server - check server URL and network';
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'Jira server not found - check server URL';
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: error.message,
    });
  }
});

// POST /api/jira-tickets/extract
// Extract tickets from Jira using JQL and store in database
router.post(
  '/extract',
  validateJiraRequest,
  async (req: Request, res: Response) => {
    try {
      logger.logInfo('Starting Jira ticket extraction');
      const validationErrors = validationResult(req);
      if (!validationErrors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors.array(),
        });
      }

      const {
        jql,
        server,
        username,
        password,
        apiToken,
        // Remove status mappings since they'll be determined per ticket
      } = req.body;

      // Remove status mappings preparation since they'll be determined per ticket
      logger.logInfo('Starting Jira ticket extraction');

      // Fetch tickets from Jira using API Token Authentication (preferred) or Basic Auth (fallback)
      const jqlEncoded = encodeURIComponent(jql);

      // Determine authentication method
      let authHeader: string;
      if (apiToken) {
        // Use API Token with Basic Auth (Jira Cloud standard)
        const auth = Buffer.from(`${username}:${apiToken}`).toString('base64');
        authHeader = `Basic ${auth}`;
        logger.logInfo(
          'Using API Token with Basic Authentication (Jira Cloud standard)'
        );
      } else if (password) {
        // Use Basic Authentication (legacy method)
        const auth = Buffer.from(`${username}:${password}`).toString('base64');
        authHeader = `Basic ${auth}`;
        logger.logInfo('Using Basic Authentication (legacy)');
      } else {
        throw new Error(
          'Either apiToken or password must be provided for authentication'
        );
      }

      // Ensure server URL doesn't end with slash to avoid double slashes
      const cleanServer = server.endsWith('/') ? server.slice(0, -1) : server;

      // Two-step process as per Atlassian Enhanced JQL API best practices
      logger.logInfo(
        'Starting two-step Jira extraction using Enhanced JQL API'
      );

      // Step 1: Get all issue IDs (optimized for performance)
      logger.logInfo('Step 1: Collecting all issue IDs...');
      let allIssueIds: string[] = [];
      let nextPageToken: string | undefined = undefined;
      const maxResults = 5000; // Use maximum batch size for ID collection

      while (true) {
        const searchUrl = `${cleanServer}/rest/api/3/search/jql`;

        // Request body for ID collection (no fields/expands for better performance)
        const requestBody: any = {
          jql: jql,
          maxResults: maxResults,
        };

        // Add nextPageToken if available
        if (nextPageToken) {
          requestBody.nextPageToken = nextPageToken;
        }

        logger.logInfo(
          `Collecting issue IDs (batch ${
            Math.floor(allIssueIds.length / maxResults) + 1
          }): ${searchUrl}`
        );
        logger.logInfo(`Request body: ${JSON.stringify(requestBody)}`);

        const response = await axios.post(searchUrl, requestBody, {
          headers: {
            Authorization: authHeader,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        });

        const { issues, nextPageToken: newNextPageToken } = response.data;

        // Extract just the issue IDs
        const issueIds = issues.map((issue: any) => issue.id);
        allIssueIds = allIssueIds.concat(issueIds);

        logger.logInfo(
          `Collected ${issueIds.length} issue IDs (total: ${allIssueIds.length})`
        );

        // Check if there are more pages
        if (newNextPageToken) {
          nextPageToken = newNextPageToken;
        } else {
          break;
        }
      }

      logger.logInfo(
        `Step 1 complete. Total issue IDs collected: ${allIssueIds.length}`
      );

      // Step 2: Get detailed issue information using Bulk Fetch API
      logger.logInfo('Step 2: Fetching detailed issue information...');
      let allTickets: any[] = [];
      const batchSize = 100; // Optimal batch size for bulk fetch

      // Process issues in batches of 100
      for (let i = 0; i < allIssueIds.length; i += batchSize) {
        const batch = allIssueIds.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;

        logger.logInfo(
          `Processing batch ${batchNumber}/${Math.ceil(
            allIssueIds.length / batchSize
          )} (${batch.length} issues)`
        );

        // Use Bulk Fetch API for detailed information
        const bulkFetchUrl = `${cleanServer}/rest/api/3/issue/bulkfetch`;
        const bulkFetchBody = {
          issueIdsOrKeys: batch,
          fields: ['*all'],
          expand: ['changelog'],
        };

        try {
          const bulkResponse = await axios.post(bulkFetchUrl, bulkFetchBody, {
            headers: {
              Authorization: authHeader,
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            timeout: 30000,
          });

          const { issues: batchTickets } = bulkResponse.data;
          allTickets = allTickets.concat(batchTickets);

          logger.logInfo(
            `Batch ${batchNumber} complete. Retrieved ${batchTickets.length} detailed tickets`
          );
        } catch (error) {
          logger.logError(`Error processing batch ${batchNumber}`, error);
          // Continue with next batch even if one fails
        }
      }

      logger.logInfo(
        `Step 2 complete. Total detailed tickets retrieved: ${allTickets.length}`
      );

      const extractedTickets: ExtractedTicketData[] = [];
      const extractionErrors: string[] = [];

      // Extract data from each ticket
      for (const ticket of allTickets) {
        try {
          const extractedData = await extractTicketData(
            ticket,
            server
            // Remove statusMappings parameter
          );
          if (extractedData) {
            extractedTickets.push(extractedData);
          }
        } catch (error) {
          logger.logError('Error extracting ticket data', error);
          extractionErrors.push(
            `Failed to extract data for ticket ${ticket.key}`
          );
        }
      }

      // Store tickets in database
      const storedTickets = [];
      for (const ticketData of extractedTickets) {
        try {
          // Note: assigneeId field removed - user mapping now handled via manual mapping page

          const storedTicket = await prisma.jiraTicket.upsert({
            where: { jiraId: ticketData.jiraId },
            update: {
              link: ticketData.link,
              title: ticketData.title,
              priority: ticketData.priority,
              status: ticketData.status,
              createDate: ticketData.createDate,
              endDate: ticketData.endDate,
              originalEstimate: ticketData.originalEstimate,
              components: ticketData.components,
              dueDate: ticketData.dueDate,
              assignee: ticketData.assignee,
              reporter: ticketData.reporter,
              inProgressTime: ticketData.inProgressTime,
              blockedTime: ticketData.blockedTime,
              reviewTime: ticketData.reviewTime,
              promotionTime: ticketData.promotionTime,
              refinementTime: ticketData.refinementTime, // Add refinementTime
              readyForDevelopmentTime: ticketData.readyForDevelopmentTime, // Add readyForDevelopmentTime
              unmappedStatuses: ticketData.unmappedStatuses,
              updatedAt: new Date(),
            },
            create: {
              jiraId: ticketData.jiraId,
              link: ticketData.link,
              title: ticketData.title,
              priority: ticketData.priority,
              status: ticketData.status,
              createDate: ticketData.createDate,
              endDate: ticketData.endDate,
              originalEstimate: ticketData.originalEstimate,
              components: ticketData.components,
              dueDate: ticketData.dueDate,
              assignee: ticketData.assignee,
              reporter: ticketData.reporter,
              inProgressTime: ticketData.inProgressTime,
              blockedTime: ticketData.blockedTime,
              reviewTime: ticketData.reviewTime,
              promotionTime: ticketData.promotionTime,
              refinementTime: ticketData.refinementTime, // Add refinementTime
              readyForDevelopmentTime: ticketData.readyForDevelopmentTime, // Add readyForDevelopmentTime
              unmappedStatuses: ticketData.unmappedStatuses,
            },
          });
          storedTickets.push(storedTicket);
        } catch (error) {
          logger.logError('Error storing ticket in database', error);
          extractionErrors.push(`Failed to store ticket ${ticketData.jiraId}`);
        }
      }

      logger.logInfo('Jira ticket extraction completed');

      res.json({
        success: true,
        message: 'Jira tickets extracted and stored successfully',
        data: {
          totalTickets: allTickets.length,
          extractedTickets: extractedTickets.length,
          storedTickets: storedTickets.length,
          errors: extractionErrors,
        },
      });
    } catch (error) {
      logger.logError('Error in Jira ticket extraction', error);

      res.status(500).json({
        success: false,
        message: 'Failed to extract Jira tickets',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// GET /api/jira-tickets
// Get all stored Jira tickets with optional filtering
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '50',
      assignee,
      reporter,
      priority,
      startDate,
      endDate,
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (assignee) {
      where.assignee = { contains: assignee as string, mode: 'insensitive' };
    }

    if (reporter) {
      where.reporter = { contains: reporter as string, mode: 'insensitive' };
    }

    if (priority) {
      where.priority = priority as string;
    }

    if (startDate || endDate) {
      where.createDate = {};
      if (startDate) {
        where.createDate.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createDate.lte = new Date(endDate as string);
      }
    }

    const [tickets, total] = await Promise.all([
      prisma.jiraTicket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.jiraTicket.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    logger.logError('Error fetching Jira tickets', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch Jira tickets',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/jira-tickets/unmapped-users
// Get all unique assignees from jira_tickets that don't have a mapping to system users
router.get('/unmapped-users', async (req: Request, res: Response) => {
  try {
    logger.logInfo('Fetching unmapped Jira users');

    // Get all unique assignees from jira_tickets
    const allJiraUsers = await prisma.jiraTicket.findMany({
      where: {
        assignee: { not: null },
      },
      select: {
        assignee: true,
      },
      distinct: ['assignee'],
    });

    // Get existing mappings
    const existingMappings = await prisma.jiraUserMapping.findMany({
      select: {
        jiraUsername: true,
      },
    });

    const mappedUsernames = new Set(existingMappings.map(m => m.jiraUsername));

    // Filter out already mapped users
    const unmappedUsers = allJiraUsers
      .map(u => u.assignee)
      .filter((username): username is string => username !== null)
      .filter(username => !mappedUsernames.has(username));

    // Get all system users for the dropdown
    const systemUsers = await prisma.user.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });

    const result = {
      unmappedUsers,
      systemUsers,
    };

    logger.logInfo(`Found ${result.unmappedUsers.length} unmapped Jira users`);
    res.json(result);
  } catch (error) {
    logger.logError('Error fetching unmapped Jira users', error);
    res.status(500).json({
      message: 'Failed to fetch unmapped Jira users',
    });
  }
});

// PATCH /api/jira-tickets/update-assignee-mapping
// Update assigneeId for all tickets with a specific assignee name
router.patch(
  '/update-assignee-mapping',
  async (req: Request, res: Response) => {
    try {
      const { assigneeName, userId } = req.body;

      if (!assigneeName || !userId) {
        return res.status(400).json({
          message: 'assigneeName and userId are required',
        });
      }

      logger.logInfo(
        `Updating assignee mapping for ${assigneeName} to user ${userId}`
      );

      // Verify the user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!user) {
        return res.status(404).json({
          message: 'Resource not found',
        });
      }

      // Create or update the mapping in the JiraUserMapping table
      const mapping = await prisma.jiraUserMapping.upsert({
        where: {
          jiraUsername: assigneeName,
        },
        update: {
          userId: userId,
          updatedAt: new Date(),
        },
        create: {
          jiraUsername: assigneeName,
          userId: userId,
        },
      });

      logger.logInfo(`Created/updated mapping: ${assigneeName} -> ${userId}`);

      res.json({
        message: `Successfully mapped ${assigneeName} to user ${userId}`,
        mapping: {
          id: mapping.id,
          jiraUsername: mapping.jiraUsername,
          userId: mapping.userId,
        },
      });
    } catch (error) {
      logger.logError('Error updating assignee mapping', error);
      res.status(500).json({
        message: 'Failed to update assignee mapping',
      });
    }
  }
);

// GET /api/jira-tickets/:jiraId
// Get a specific Jira ticket by Jira ID
router.get('/:jiraId', async (req: Request, res: Response) => {
  try {
    const { jiraId } = req.params;

    const ticket = await prisma.jiraTicket.findUnique({
      where: { jiraId },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Jira ticket not found',
      });
    }

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    logger.logError('Error fetching Jira ticket', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch Jira ticket',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// DELETE /api/jira-tickets/:jiraId
// Delete a specific Jira ticket
router.delete('/:jiraId', async (req: Request, res: Response) => {
  try {
    const { jiraId } = req.params;

    const ticket = await prisma.jiraTicket.delete({
      where: { jiraId },
    });

    logger.logInfo('Jira ticket deleted');

    res.json({
      success: true,
      message: 'Jira ticket deleted successfully',
      data: ticket,
    });
  } catch (error) {
    logger.logError('Error deleting Jira ticket', error);

    res.status(500).json({
      success: false,
      message: 'Failed to delete Jira ticket',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// DELETE /api/jira-tickets
// Delete all Jira tickets
router.delete('/', async (req: Request, res: Response) => {
  try {
    const result = await prisma.jiraTicket.deleteMany({});

    logger.logInfo('All Jira tickets deleted');

    res.json({
      success: true,
      message: 'All Jira tickets deleted successfully',
      data: { deletedCount: result.count },
    });
  } catch (error) {
    logger.logError('Error deleting all Jira tickets', error);

    res.status(500).json({
      success: false,
      message: 'Failed to delete all Jira tickets',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/jira-tickets/mappings
// Get all existing Jira user mappings
router.get('/mappings', async (req: Request, res: Response) => {
  try {
    logger.logInfo('Fetching Jira user mappings');

    const mappings = await prisma.jiraUserMapping.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        jiraUsername: 'asc',
      },
    });

    res.json({
      mappings: mappings.map(mapping => ({
        id: mapping.id,
        jiraUsername: mapping.jiraUsername,
        userId: mapping.userId,
        user: mapping.user,
        createdAt: mapping.createdAt,
        updatedAt: mapping.updatedAt,
      })),
    });
  } catch (error) {
    logger.logError('Error fetching Jira user mappings', error);
    res.status(500).json({
      message: 'Failed to fetch Jira user mappings',
    });
  }
});

// DELETE /api/jira-tickets/mappings/:mappingId
// Delete a Jira user mapping
router.delete('/mappings/:mappingId', async (req: Request, res: Response) => {
  try {
    const { mappingId } = req.params;

    logger.logInfo(`Deleting Jira user mapping: ${mappingId}`);

    const mapping = await prisma.jiraUserMapping.findUnique({
      where: { id: mappingId },
    });

    if (!mapping) {
      return res.status(404).json({
        message: 'Mapping not found',
      });
    }

    await prisma.jiraUserMapping.delete({
      where: { id: mappingId },
    });

    logger.logInfo(
      `Deleted mapping: ${mapping.jiraUsername} -> ${mapping.userId}`
    );

    res.json({
      message: `Successfully deleted mapping for ${mapping.jiraUsername}`,
    });
  } catch (error) {
    logger.logError('Error deleting Jira user mapping', error);
    res.status(500).json({
      message: 'Failed to delete Jira user mapping',
    });
  }
});

export default router;
