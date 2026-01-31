/**
 * @fileoverview Shared validation utilities
 *
 * This module provides reusable validation middleware for common
 * input validation scenarios like user IDs, email addresses, etc.
 *
 * @author Performance360 Team
 * @version 1.0.0
 */

import { param, body } from 'express-validator';

/**
 * Validates user ID format
 *
 * User IDs should be:
 * - Non-empty strings
 * - Between 1 and 100 characters
 * - Contain only alphanumeric characters, underscores, and hyphens
 * - Match typical CUID format patterns
 *
 * @example
 * router.get('/:id', validateUserId, handler);
 */
export const validateUserId = [
  param('id')
    .isString()
    .withMessage('User ID must be a string')
    .notEmpty()
    .withMessage('User ID is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('User ID must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('User ID contains invalid characters'),
];

/**
 * Validates userId in request body
 *
 * @example
 * router.post('/', body('userId').custom(validateUserIdInBody), handler);
 */
export const validateUserIdInBody = body('userId')
  .isString()
  .withMessage('User ID must be a string')
  .notEmpty()
  .withMessage('User ID is required')
  .isLength({ min: 1, max: 100 })
  .withMessage('User ID must be between 1 and 100 characters')
  .matches(/^[a-zA-Z0-9_-]+$/)
  .withMessage('User ID contains invalid characters');

/**
 * Validates assessment ID format
 */
export const validateAssessmentId = [
  param('id')
    .isString()
    .withMessage('Assessment ID must be a string')
    .notEmpty()
    .withMessage('Assessment ID is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Assessment ID must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Assessment ID contains invalid characters'),
];

/**
 * Validates feedback ID format
 */
export const validateFeedbackId = [
  param('id')
    .isString()
    .withMessage('Feedback ID must be a string')
    .notEmpty()
    .withMessage('Feedback ID is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Feedback ID must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Feedback ID contains invalid characters'),
];

/**
 * Validates achievement ID format
 */
export const validateAchievementId = [
  param('id')
    .isString()
    .withMessage('Achievement ID must be a string')
    .notEmpty()
    .withMessage('Achievement ID is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Achievement ID must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Achievement ID contains invalid characters'),
];

