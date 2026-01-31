/**
 * @fileoverview Access control utility functions
 *
 * This module provides shared utility functions for checking user access permissions,
 * particularly for manager-employee relationships and indirect report verification.
 *
 * @author Performance360 Team
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const prisma = new PrismaClient();

/**
 * Check if a user is an indirect report of another user
 *
 * This function recursively checks if an employee is an indirect report
 * (reports through one or more management levels) of a manager.
 *
 * @param managerId - The ID of the potential manager
 * @param employeeId - The ID of the potential employee
 * @returns Promise<boolean> - True if employee is an indirect report of manager
 *
 * @example
 * const hasAccess = await checkIndirectReport(managerId, employeeId);
 * if (hasAccess) {
 *   // Allow access
 * }
 */
export async function checkIndirectReport(
  managerId: string,
  employeeId: string
): Promise<boolean> {
  try {
    // Get all direct reports of the manager
    const directReports = await prisma.user.findMany({
      where: { managerId, isActive: true },
      select: { id: true },
    });

    // For each direct report, check if they have the employee as a direct or indirect report
    for (const directReport of directReports) {
      // Check if the employee is a direct report of this direct report
      const isDirectReport = await prisma.user.findFirst({
        where: {
          id: employeeId,
          managerId: directReport.id,
          isActive: true,
        },
      });

      if (isDirectReport) {
        return true;
      }

      // Recursively check if the employee is an indirect report of this direct report
      const isIndirectReport = await checkIndirectReport(
        directReport.id,
        employeeId
      );
      if (isIndirectReport) {
        return true;
      }
    }

    return false;
  } catch (error) {
    logger.logError('Error checking indirect report relationship:', error);
    return false;
  }
}

/**
 * Check if a user has access to view another user's data
 *
 * This function checks if the current user (manager/admin) has permission
 * to view data for the target user based on their role and relationship.
 *
 * @param currentUserId - The ID of the current user making the request
 * @param currentUserRole - The role of the current user (ADMIN, MANAGER, EMPLOYEE)
 * @param targetUserId - The ID of the user whose data is being requested
 * @returns Promise<boolean> - True if access is allowed
 *
 * @example
 * const hasAccess = await checkUserAccess(currentUserId, currentUserRole, targetUserId);
 * if (!hasAccess) {
 *   return res.status(403).json({ message: 'Access denied' });
 * }
 */
export async function checkUserAccess(
  currentUserId: string,
  currentUserRole: string,
  targetUserId: string
): Promise<boolean> {
  // User can always access their own data
  if (currentUserId === targetUserId) {
    return true;
  }

  // Admin can access any user's data
  if (currentUserRole === 'ADMIN') {
    return true;
  }

  // Manager can only access their direct/indirect reports
  if (currentUserRole === 'MANAGER') {
    // Check if it's a direct report
    const directReport = await prisma.user.findFirst({
      where: {
        id: targetUserId,
        managerId: currentUserId,
        isActive: true,
      },
    });

    if (directReport) {
      return true;
    }

    // Check if it's an indirect report
    return await checkIndirectReport(currentUserId, targetUserId);
  }

  // Employee can only access their own data
  return false;
}

