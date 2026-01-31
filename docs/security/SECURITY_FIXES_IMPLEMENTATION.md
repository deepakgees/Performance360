# Security Fixes Implementation Guide

This document provides step-by-step instructions and code fixes for all identified security vulnerabilities.

---

## 🔴 CRITICAL FIXES

### Fix 1: Restrict GET /api/users Endpoint

**File:** `backend/src/routes/users.ts`

**Current Code (Line 193):**

```typescript
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  // ❌ Returns ALL users to ANY authenticated user
  const users = await prisma.user.findMany({
    where: { isActive: true },
    // ... returns full user data
  });
  res.json(users);
});
```

**Fixed Code:**

```typescript
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    logger.logDebug('Fetching users', req.user!.id, 'GET', '/users');

    const currentUser = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, role: true },
    });

    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // ADMIN: Can see all users
    if (currentUser.role === 'ADMIN') {
      const users = await prisma.user.findMany({
        where: { isActive: true },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          position: true,
          avatar: true,
          lastLoginAt: true,
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          userTeams: {
            select: {
              id: true,
              joinedAt: true,
              isActive: true,
              team: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          },
        },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      });
      return res.json(users);
    }

    // MANAGER: Can see only their direct and indirect reports
    if (currentUser.role === 'MANAGER') {
      // Get all direct and indirect reports
      const directReports = await prisma.user.findMany({
        where: {
          managerId: currentUser.id,
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          position: true,
          avatar: true,
          lastLoginAt: true,
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          userTeams: {
            select: {
              id: true,
              joinedAt: true,
              isActive: true,
              team: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          },
        },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      });

      // Get indirect reports recursively
      const getAllIndirectReports = async (
        managerIds: string[]
      ): Promise<any[]> => {
        if (managerIds.length === 0) return [];

        const reports = await prisma.user.findMany({
          where: {
            managerId: { in: managerIds },
            isActive: true,
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            position: true,
            avatar: true,
            lastLoginAt: true,
            manager: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            userTeams: {
              select: {
                id: true,
                joinedAt: true,
                isActive: true,
                team: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                  },
                },
              },
            },
          },
          orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        });

        const reportIds = reports.map(user => user.id);
        const indirectReports = await getAllIndirectReports(reportIds);
        return [...reports, ...indirectReports];
      };

      const directReportIds = directReports.map(user => user.id);
      const indirectReports = await getAllIndirectReports(directReportIds);
      const allReports = [...directReports, ...indirectReports];

      return res.json(allReports);
    }

    // EMPLOYEE: Can only see limited info about themselves
    // Return empty array or just their own basic info
    return res.json([]);
  } catch (error) {
    logger.logError('Error fetching users', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
```

---

### Fix 2: Add Access Control to GET /api/users/:id

**File:** `backend/src/routes/users.ts`

**Current Code (Line 690):**

```typescript
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  // ❌ No access control
  const user = await prisma.user.findUnique({ where: { id } });
  res.json(user);
});
```

**Fixed Code:**

```typescript
router.get(
  '/:id',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const currentUserId = req.user!.id;

      logger.logDebug('Fetching user by ID', id, 'GET', `/users/${id}`);

      // Get current user's role
      const currentUser = await prisma.user.findUnique({
        where: { id: currentUserId },
        select: { id: true, role: true },
      });

      if (!currentUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if user is trying to access their own profile
      if (currentUserId === id) {
        const user = await prisma.user.findUnique({
          where: { id },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            position: true,
            avatar: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
            manager: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            employees: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
            userTeams: {
              select: {
                id: true,
                joinedAt: true,
                isActive: true,
                team: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                  },
                },
              },
            },
          },
        });

        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        return res.json(user);
      }

      // ADMIN: Can access any user
      if (currentUser.role === 'ADMIN') {
        const user = await prisma.user.findUnique({
          where: { id },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            position: true,
            avatar: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
            manager: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            employees: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
            userTeams: {
              select: {
                id: true,
                joinedAt: true,
                isActive: true,
                team: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                  },
                },
              },
            },
          },
        });

        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        return res.json(user);
      }

      // MANAGER: Can only access their direct/indirect reports
      if (currentUser.role === 'MANAGER') {
        // Check if it's a direct report
        const directReport = await prisma.user.findFirst({
          where: {
            id: id,
            managerId: currentUserId,
          },
        });

        if (directReport) {
          const user = await prisma.user.findUnique({
            where: { id },
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              position: true,
              avatar: true,
              isActive: true,
              lastLoginAt: true,
              createdAt: true,
              manager: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
              employees: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  role: true,
                },
              },
              userTeams: {
                select: {
                  id: true,
                  joinedAt: true,
                  isActive: true,
                  team: {
                    select: {
                      id: true,
                      name: true,
                      description: true,
                    },
                  },
                },
              },
            },
          });

          if (!user) {
            return res.status(404).json({ message: 'User not found' });
          }

          return res.json(user);
        }

        // Check if it's an indirect report (reuse helper function from assessments)
        const isIndirectReport = await checkIndirectReport(currentUserId, id);
        if (isIndirectReport) {
          const user = await prisma.user.findUnique({
            where: { id },
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              position: true,
              avatar: true,
              isActive: true,
              lastLoginAt: true,
              createdAt: true,
              manager: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
              employees: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  role: true,
                },
              },
              userTeams: {
                select: {
                  id: true,
                  joinedAt: true,
                  isActive: true,
                  team: {
                    select: {
                      id: true,
                      name: true,
                      description: true,
                    },
                  },
                },
              },
            },
          });

          if (!user) {
            return res.status(404).json({ message: 'User not found' });
          }

          return res.json(user);
        }

        return res.status(403).json({
          message:
            'Access denied. You can only view your own profile or your reports.',
        });
      }

      // EMPLOYEE: Can only access their own profile
      return res.status(403).json({
        message: 'Access denied. You can only view your own profile.',
      });
    } catch (error) {
      logger.logError('Error fetching user', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Add helper function (reuse from assessments.ts or create shared utility)
async function checkIndirectReport(
  managerId: string,
  employeeId: string
): Promise<boolean> {
  try {
    const directReports = await prisma.user.findMany({
      where: { managerId },
      select: { id: true },
    });

    for (const directReport of directReports) {
      const isDirectReport = await prisma.user.findFirst({
        where: {
          id: employeeId,
          managerId: directReport.id,
        },
      });

      if (isDirectReport) {
        return true;
      }

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
```

---

### Fix 3: Fix Quarterly Performance Access Control

**File:** `backend/src/routes/quarterly-performance.ts`

**Current Code (Line 13):**

```typescript
if (
  currentUser.role !== 'ADMIN' &&
  currentUser.role !== 'MANAGER' &&
  currentUser.id !== userId
) {
  return res.status(403).json({ error: 'Access denied...' });
}
// ❌ No check if manager has access to this specific user
```

**Fixed Code:**

```typescript
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { user: currentUser } = req as any;

    // User can always view their own performance
    if (currentUser.id === userId) {
      const performances = await prisma.quarterlyPerformance.findMany({
        where: { userId: userId },
        orderBy: [{ year: 'desc' }, { quarter: 'asc' }],
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
      });
      return res.json(performances);
    }

    // ADMIN: Can view any user's performance
    if (currentUser.role === 'ADMIN') {
      const performances = await prisma.quarterlyPerformance.findMany({
        where: { userId: userId },
        orderBy: [{ year: 'desc' }, { quarter: 'asc' }],
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
      });
      return res.json(performances);
    }

    // MANAGER: Can only view their direct/indirect reports' performance
    if (currentUser.role === 'MANAGER') {
      // Check if it's a direct report
      const directReport = await prisma.user.findFirst({
        where: {
          id: userId,
          managerId: currentUser.id,
        },
      });

      if (directReport) {
        const performances = await prisma.quarterlyPerformance.findMany({
          where: { userId: userId },
          orderBy: [{ year: 'desc' }, { quarter: 'asc' }],
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
        });
        return res.json(performances);
      }

      // Check if it's an indirect report
      const isIndirectReport = await checkIndirectReport(
        currentUser.id,
        userId
      );
      if (isIndirectReport) {
        const performances = await prisma.quarterlyPerformance.findMany({
          where: { userId: userId },
          orderBy: [{ year: 'desc' }, { quarter: 'asc' }],
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
        });
        return res.json(performances);
      }

      return res.status(403).json({
        error:
          'Access denied. You can only view performance data for your direct or indirect reports.',
      });
    }

    // EMPLOYEE: Can only view their own performance
    return res.status(403).json({
      error:
        'Access denied. Only managers, admins, or the user themselves can view performance data.',
    });
  } catch (error) {
    logger.logError('Error fetching quarterly performance:', error);
    res
      .status(500)
      .json({ error: 'Failed to fetch quarterly performance data' });
  }
});

// Add helper function (same as in assessments.ts)
async function checkIndirectReport(
  managerId: string,
  employeeId: string
): Promise<boolean> {
  try {
    const directReports = await prisma.user.findMany({
      where: { managerId },
      select: { id: true },
    });

    for (const directReport of directReports) {
      const isDirectReport = await prisma.user.findFirst({
        where: {
          id: employeeId,
          managerId: directReport.id,
        },
      });

      if (isDirectReport) {
        return true;
      }

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
```

---

### Fix 4: Fix Feedback Endpoints Access Control

**File:** `backend/src/routes/colleague-feedback.ts`

**Current Code (Lines 312, 361):**

```typescript
if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
  return res.status(403).json({ message: 'Forbidden' });
}
// ❌ No check if manager has access to this userId
```

**Fixed Code:**

```typescript
router.get(
  '/received/:userId',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { user: currentUser } = req as any;
      const { userId } = req.params;

      // User can always view their own feedback
      if (currentUser.id === userId) {
        const feedback = await prisma.colleagueFeedback.findMany({
          where: { receiverId: userId },
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
        return res.json(feedback);
      }

      // ADMIN: Can view any user's feedback
      if (currentUser.role === 'ADMIN') {
        const feedback = await prisma.colleagueFeedback.findMany({
          where: { receiverId: userId },
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
        return res.json(feedback);
      }

      // MANAGER: Can only view their direct/indirect reports' feedback
      if (currentUser.role === 'MANAGER') {
        // Check if it's a direct report
        const directReport = await prisma.user.findFirst({
          where: {
            id: userId,
            managerId: currentUser.id,
          },
        });

        if (directReport) {
          const feedback = await prisma.colleagueFeedback.findMany({
            where: { receiverId: userId },
            include: {
              sender: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  role: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          });
          return res.json(feedback);
        }

        // Check if it's an indirect report
        const isIndirectReport = await checkIndirectReport(
          currentUser.id,
          userId
        );
        if (isIndirectReport) {
          const feedback = await prisma.colleagueFeedback.findMany({
            where: { receiverId: userId },
            include: {
              sender: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  role: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          });
          return res.json(feedback);
        }

        return res.status(403).json({
          message:
            'Access denied. You can only view feedback for your direct or indirect reports.',
        });
      }

      return res.status(403).json({ message: 'Forbidden' });
    } catch (error) {
      console.error(
        'Error fetching received colleague feedback for user:',
        error
      );
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Apply same fix to /sent/:userId endpoint
router.get(
  '/sent/:userId',
  authenticateToken,
  async (req: Request, res: Response) => {
    // Same access control logic as above
    // ... (similar implementation)
  }
);
```

**Apply the same fix to:** `backend/src/routes/manager-feedback.ts:222`

---

### Fix 5: Add Authentication to Achievements Endpoint

**File:** `backend/src/routes/achievements-observations.ts`

**Current Code (Line 59):**

```typescript
router.get('/:userId', async (req: Request, res: Response) => {
  // ❌ No authenticateToken middleware
```

**Fixed Code:**

```typescript
router.get(
  '/:userId',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { user: currentUser } = req as any;
      const { page = '1', limit = '10' } = req.query;

      // User can always view their own achievements
      if (currentUser.id === userId) {
        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);
        const skip = (pageNum - 1) * limitNum;

        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, firstName: true, lastName: true, email: true },
        });

        if (!user) {
          return res.status(404).json({
            success: false,
            message: 'User not found',
          });
        }

        const achievements = await prisma.achievementsAndObservations.findMany({
          where: { userId },
          include: {
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { date: 'desc' },
          skip,
          take: limitNum,
        });

        const total = await prisma.achievementsAndObservations.count({
          where: { userId },
        });

        return res.json({
          success: true,
          data: {
            achievements,
            pagination: {
              page: pageNum,
              limit: limitNum,
              total,
              pages: Math.ceil(total / limitNum),
            },
            user,
          },
        });
      }

      // ADMIN: Can view any user's achievements
      if (currentUser.role === 'ADMIN') {
        // ... (same logic as above)
      }

      // MANAGER: Can only view their direct/indirect reports' achievements
      if (currentUser.role === 'MANAGER') {
        // Check if it's a direct or indirect report
        const directReport = await prisma.user.findFirst({
          where: {
            id: userId,
            managerId: currentUser.id,
          },
        });

        if (!directReport) {
          const isIndirectReport = await checkIndirectReport(
            currentUser.id,
            userId
          );
          if (!isIndirectReport) {
            return res.status(403).json({
              success: false,
              message:
                'Access denied. You can only view achievements for your direct or indirect reports.',
            });
          }
        }

        // ... (fetch and return achievements)
      }

      return res.status(403).json({
        success: false,
        message: 'Access denied.',
      });
    } catch (error) {
      logger.logError('Error retrieving achievements and observations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve achievements and observations',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);
```

---

## 🟠 HIGH PRIORITY FIXES

### Fix 6: Add Rate Limiting

**Install package:**

```bash
npm install express-rate-limit
```

**File:** `backend/src/middleware/rateLimiter.ts` (new file)

```typescript
import rateLimit from 'express-rate-limit';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
```

**File:** `backend/src/routes/auth.ts`

```typescript
import { authRateLimiter } from '../middleware/rateLimiter';

router.post(
  '/login',
  authRateLimiter, // Add rate limiter
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  async (req: Request, res: Response) => {
    // ... existing code
  }
);
```

---

### Fix 7: Reduce JWT Token Expiration

**File:** `backend/src/routes/auth.ts`

**Current Code:**

```typescript
{
  expiresIn: '24h';
} // ❌ Too long
```

**Fixed Code:**

```typescript
// Short-lived access token
const token = jwt.sign(
  { id: user.id, email: user.email, role: user.role },
  process.env.JWT_SECRET!,
  { expiresIn: '1h' } // ✅ Reduced to 1 hour
);

// Optional: Add refresh token for longer sessions
const refreshToken = jwt.sign(
  { id: user.id, type: 'refresh' },
  process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!,
  { expiresIn: '7d' }
);

res.json({
  message: 'Login successful',
  user: userData,
  token,
  refreshToken, // Include refresh token
});
```

---

## Testing the Fixes

After implementing all fixes, test the following scenarios:

1. **Employee Access Test:**

   ```bash
   # As employee, try to access another employee's data
   curl -H "Authorization: Bearer <employee_token>" \
     http://localhost:5000/api/users/<other_employee_id>
   # Should return 403 Forbidden
   ```

2. **Manager Access Test:**

   ```bash
   # As manager, try to access employee outside their hierarchy
   curl -H "Authorization: Bearer <manager_token>" \
     http://localhost:5000/api/users/<unrelated_employee_id>
   # Should return 403 Forbidden
   ```

3. **Rate Limiting Test:**
   ```bash
   # Try 6 login attempts rapidly
   for i in {1..6}; do
     curl -X POST http://localhost:5000/api/auth/login \
       -H "Content-Type: application/json" \
       -d '{"email":"test@example.com","password":"wrong"}'
   done
   # 6th attempt should be rate limited
   ```

---

## Next Steps

1. Implement all critical fixes
2. Test each fix thoroughly
3. Run security tests
4. Conduct second security audit
5. Deploy to production

---

_This implementation guide provides code-level fixes for all identified security vulnerabilities._
