import { PrismaClient } from '@prisma/client';
import { Request, Response, Router } from 'express';
import { body, validationResult } from 'express-validator';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// Types
interface JiraConfigurationRequest {
  name: string;
  serverUrl: string;
  username: string;
  apiToken: string;
  jql: string;
  inProgressStatuses: string[];
  blockedStatuses: string[];
  reviewStatuses: string[];
  promotionStatuses: string[];
  refinementStatuses: string[];
  readyForDevelopmentStatuses: string[];
  ticketClosesStatuses: string[];
}

interface JiraConfigurationResponse {
  success: boolean;
  message: string;
  data?: any;
}

// Validation middleware for creating new configurations
const validateCreateJiraConfiguration = [
  body('name').notEmpty().withMessage('Name is required'),
  body('serverUrl').isURL().withMessage('Server URL must be a valid URL'),
  body('username').notEmpty().withMessage('Username is required'),
  body('apiToken').notEmpty().withMessage('API Token is required'),
  body('jql').notEmpty().withMessage('JQL query is required'),
  body('inProgressStatuses')
    .isArray()
    .withMessage('In Progress Statuses must be an array'),
  body('blockedStatuses')
    .isArray()
    .withMessage('Blocked Statuses must be an array'),
  body('reviewStatuses')
    .isArray()
    .withMessage('Review Statuses must be an array'),
  body('promotionStatuses')
    .isArray()
    .withMessage('Promotion Statuses must be an array'),
  body('refinementStatuses')
    .isArray()
    .withMessage('Refinement Statuses must be an array'),
  body('readyForDevelopmentStatuses')
    .isArray()
    .withMessage('Ready for Development Statuses must be an array'),
  body('ticketClosesStatuses')
    .isArray()
    .withMessage('Ticket Closes Statuses must be an array'),
];

// Validation middleware for updating configurations (API token is optional)
const validateUpdateJiraConfiguration = [
  body('name').notEmpty().withMessage('Name is required'),
  body('serverUrl').isURL().withMessage('Server URL must be a valid URL'),
  body('username').notEmpty().withMessage('Username is required'),
  body('jql').notEmpty().withMessage('JQL query is required'),
  body('inProgressStatuses')
    .isArray()
    .withMessage('In Progress Statuses must be an array'),
  body('blockedStatuses')
    .isArray()
    .withMessage('Blocked Statuses must be an array'),
  body('reviewStatuses')
    .isArray()
    .withMessage('Review Statuses must be an array'),
  body('promotionStatuses')
    .isArray()
    .withMessage('Promotion Statuses must be an array'),
  body('refinementStatuses')
    .isArray()
    .withMessage('Refinement Statuses must be an array'),
  body('readyForDevelopmentStatuses')
    .isArray()
    .withMessage('Ready for Development Statuses must be an array'),
  body('ticketClosesStatuses')
    .isArray()
    .withMessage('Ticket Closes Statuses must be an array'),
];

// GET /api/jira-configurations - Get all Jira configurations
router.get('/', async (req: Request, res: Response) => {
  try {
    const configurations = await prisma.jiraConfiguration.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        serverUrl: true,
        username: true,
        jql: true,
        inProgressStatuses: true,
        blockedStatuses: true,
        reviewStatuses: true,
        promotionStatuses: true,
        refinementStatuses: true,
        readyForDevelopmentStatuses: true,
        ticketClosesStatuses: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const response: JiraConfigurationResponse = {
      success: true,
      message: 'Jira configurations retrieved successfully',
      data: configurations,
    };

    res.json(response);
  } catch (error) {
    logger.logError('Error retrieving Jira configurations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve Jira configurations',
    });
  }
});

// GET /api/jira-configurations/:id - Get specific Jira configuration
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const configuration = await prisma.jiraConfiguration.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        serverUrl: true,
        username: true,
        jql: true,
        inProgressStatuses: true,
        blockedStatuses: true,
        reviewStatuses: true,
        promotionStatuses: true,
        refinementStatuses: true,
        readyForDevelopmentStatuses: true,
        ticketClosesStatuses: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!configuration) {
      return res.status(404).json({
        success: false,
        message: 'Jira configuration not found',
      });
    }

    const response: JiraConfigurationResponse = {
      success: true,
      message: 'Jira configuration retrieved successfully',
      data: configuration,
    };

    res.json(response);
  } catch (error) {
    logger.logError('Error retrieving Jira configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve Jira configuration',
    });
  }
});

// POST /api/jira-configurations - Create new Jira configuration
router.post(
  '/',
  validateCreateJiraConfiguration,
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const {
        name,
        serverUrl,
        username,
        apiToken,
        jql,
        inProgressStatuses,
        blockedStatuses,
        reviewStatuses,
        promotionStatuses,
        refinementStatuses,
        readyForDevelopmentStatuses,
        ticketClosesStatuses,
      }: JiraConfigurationRequest = req.body;

      const configuration = await prisma.jiraConfiguration.create({
        data: {
          name,
          serverUrl,
          username,
          apiToken,
          jql,
          inProgressStatuses,
          blockedStatuses,
          reviewStatuses,
          promotionStatuses,
          refinementStatuses,
          readyForDevelopmentStatuses,
          ticketClosesStatuses,
        },
        select: {
          id: true,
          name: true,
          serverUrl: true,
          username: true,
          jql: true,
          inProgressStatuses: true,
          blockedStatuses: true,
          reviewStatuses: true,
          promotionStatuses: true,
          refinementStatuses: true,
          readyForDevelopmentStatuses: true,
          ticketClosesStatuses: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const response: JiraConfigurationResponse = {
        success: true,
        message: 'Jira configuration created successfully',
        data: configuration,
      };

      res.status(201).json(response);
    } catch (error) {
      logger.logError('Error creating Jira configuration:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create Jira configuration',
      });
    }
  }
);

// PUT /api/jira-configurations/:id - Update Jira configuration
router.put(
  '/:id',
  validateUpdateJiraConfiguration,
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const {
        name,
        serverUrl,
        username,
        apiToken,
        jql,
        inProgressStatuses,
        blockedStatuses,
        reviewStatuses,
        promotionStatuses,
        refinementStatuses,
        readyForDevelopmentStatuses,
        ticketClosesStatuses,
      }: JiraConfigurationRequest = req.body;

      // Check if configuration exists
      const existingConfiguration = await prisma.jiraConfiguration.findUnique({
        where: { id },
      });

      if (!existingConfiguration) {
        return res.status(404).json({
          success: false,
          message: 'Jira configuration not found',
        });
      }

      // Prepare update data, only include apiToken if it's provided
      const updateData: any = {
        name,
        serverUrl,
        username,
        jql,
        inProgressStatuses,
        blockedStatuses,
        reviewStatuses,
        promotionStatuses,
        refinementStatuses,
        readyForDevelopmentStatuses,
        ticketClosesStatuses,
      };

      // Only update apiToken if it's provided (not empty)
      if (apiToken && apiToken.trim() !== '') {
        updateData.apiToken = apiToken;
      }

      const configuration = await prisma.jiraConfiguration.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          serverUrl: true,
          username: true,
          jql: true,
          inProgressStatuses: true,
          blockedStatuses: true,
          reviewStatuses: true,
          promotionStatuses: true,
          refinementStatuses: true,
          readyForDevelopmentStatuses: true,
          ticketClosesStatuses: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const response: JiraConfigurationResponse = {
        success: true,
        message: 'Jira configuration updated successfully',
        data: configuration,
      };

      res.json(response);
    } catch (error) {
      logger.logError('Error updating Jira configuration:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update Jira configuration',
      });
    }
  }
);

// PATCH /api/jira-configurations/:id/toggle - Toggle configuration active status
router.patch('/:id/toggle', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if configuration exists
    const existingConfiguration = await prisma.jiraConfiguration.findUnique({
      where: { id },
    });

    if (!existingConfiguration) {
      return res.status(404).json({
        success: false,
        message: 'Jira configuration not found',
      });
    }

    const configuration = await prisma.jiraConfiguration.update({
      where: { id },
      data: {
        isActive: !existingConfiguration.isActive,
      },
      select: {
        id: true,
        name: true,
        serverUrl: true,
        username: true,
        jql: true,
        inProgressStatuses: true,
        blockedStatuses: true,
        reviewStatuses: true,
        promotionStatuses: true,
        refinementStatuses: true,
        readyForDevelopmentStatuses: true,
        ticketClosesStatuses: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const response: JiraConfigurationResponse = {
      success: true,
      message: `Jira configuration ${
        configuration.isActive ? 'activated' : 'deactivated'
      } successfully`,
      data: configuration,
    };

    res.json(response);
  } catch (error) {
    logger.logError('Error toggling Jira configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle Jira configuration',
    });
  }
});

// DELETE /api/jira-configurations/:id - Delete Jira configuration
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if configuration exists
    const existingConfiguration = await prisma.jiraConfiguration.findUnique({
      where: { id },
    });

    if (!existingConfiguration) {
      return res.status(404).json({
        success: false,
        message: 'Jira configuration not found',
      });
    }

    await prisma.jiraConfiguration.delete({
      where: { id },
    });

    const response: JiraConfigurationResponse = {
      success: true,
      message: 'Jira configuration deleted successfully',
    };

    res.json(response);
  } catch (error) {
    logger.logError('Error deleting Jira configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete Jira configuration',
    });
  }
});

// Sync tickets from Jira for a specific configuration
router.post('/:id/sync', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    // Find the configuration
    const configuration = await prisma.jiraConfiguration.findUnique({
      where: { id },
    });

    if (!configuration) {
      return res.status(404).json({
        success: false,
        message: 'Jira configuration not found',
      });
    }

    if (!configuration.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot sync tickets from inactive configuration',
      });
    }

    logger.logInfo(`Starting sync for configuration: ${configuration.name}`);

    // Call the existing jira-tickets extraction API with configuration details
    const extractionPayload = {
      jql: configuration.jql,
      server: configuration.serverUrl,
      username: configuration.username,
      apiToken: configuration.apiToken, // Using apiToken for modern Jira authentication
      // Remove status mappings since they'll be determined per ticket based on configuration
    };

    // Make internal API call to the jira-tickets extraction endpoint
    const response = await fetch(
      `${req.protocol}://${req.get('host')}/api/jira-tickets/extract`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: req.headers.authorization || '',
        },
        body: JSON.stringify(extractionPayload),
      }
    );

    const extractionResult = await response.json();

    if (!response.ok) {
      logger.logError('Jira extraction API call failed', {
        configurationId: id,
        status: response.status,
        error: extractionResult,
      });

      return res.status(response.status).json({
        success: false,
        message: 'Failed to sync tickets from Jira',
        error:
          (extractionResult as any).message || 'Extraction API call failed',
      });
    }

    logger.logInfo(`Sync completed for configuration: ${configuration.name}`);

    res.json({
      success: true,
      message: 'Tickets synced successfully',
      data: {
        configurationId: id,
        configurationName: configuration.name,
        ...(extractionResult as any).data,
        syncedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.logError('Error syncing tickets from Jira', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync tickets from Jira',
      error:
        process.env.NODE_ENV === 'development'
          ? (error as Error).message
          : undefined,
    });
  }
});

export default router;
