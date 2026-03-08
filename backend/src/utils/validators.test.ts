/**
 * Unit tests for validators (express-validator chains)
 */

import { validationResult } from 'express-validator';
import {
  validateUserId,
  validateUserIdInBody,
  validateAssessmentId,
  validateFeedbackId,
  validateAchievementId,
} from './validators';

type Req = { params?: Record<string, string>; body?: Record<string, string> };

async function runValidation(chain: unknown, req: Req) {
  const middlewares = (Array.isArray(chain) ? chain : [chain]) as Array<
    (req: Req, res: unknown, next: () => void) => Promise<void>
  >;
  for (const middleware of middlewares) {
    await middleware(req, {}, () => {});
  }
  return validationResult(req as Parameters<typeof validationResult>[0]);
}

describe('validators', () => {
  describe('validateUserId', () => {
    it('should pass for valid CUID-like id', async () => {
      const req = { params: { id: 'clxyz123abc' } };
      const result = await runValidation(validateUserId, req);
      expect(result.isEmpty()).toBe(true);
    });

    it('should fail when id is empty', async () => {
      const req = { params: { id: '' } };
      const result = await runValidation(validateUserId, req);
      expect(result.isEmpty()).toBe(false);
      expect(result.array()[0].msg).toMatch(/required|invalid/i);
    });

    it('should fail when id has invalid characters', async () => {
      const req = { params: { id: 'invalid id!' } };
      const result = await runValidation(validateUserId, req);
      expect(result.isEmpty()).toBe(false);
    });
  });

  describe('validateUserIdInBody', () => {
    it('should pass for valid userId in body', async () => {
      const req = { body: { userId: 'user-123' } };
      const result = await runValidation(validateUserIdInBody as unknown, req);
      expect(result.isEmpty()).toBe(true);
    });
  });

  describe('validateAssessmentId', () => {
    it('should pass for valid assessment id', async () => {
      const req = { params: { id: 'assessment_1' } };
      const result = await runValidation(validateAssessmentId, req);
      expect(result.isEmpty()).toBe(true);
    });
  });

  describe('validateFeedbackId', () => {
    it('should pass for valid feedback id', async () => {
      const req = { params: { id: 'feedback-abc' } };
      const result = await runValidation(validateFeedbackId, req);
      expect(result.isEmpty()).toBe(true);
    });
  });

  describe('validateAchievementId', () => {
    it('should pass for valid achievement id', async () => {
      const req = { params: { id: 'achieve_1' } };
      const result = await runValidation(validateAchievementId, req);
      expect(result.isEmpty()).toBe(true);
    });
  });
});
