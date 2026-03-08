/**
 * Unit tests for API service (api instance and API modules)
 */

import {
  api,
  authAPI,
  feedbackAPI,
  assessmentAPI,
  usersAPI,
  quarterlyPerformanceAPI,
  jiraUnmappedUsersAPI,
  jiraStatisticsAPI,
  teamsAPI,
  businessUnitsAPI,
  monthlyAttendanceAPI,
  sessionsAPI,
} from './api';

// Mock axios: factory runs first (hoisted). Create state inside factory so it exists when api loads.
jest.mock('axios', () => {
  const mockGet = jest.fn().mockResolvedValue({ data: {} });
  const mockPost = jest.fn().mockResolvedValue({ data: {} });
  const mockPatch = jest.fn().mockResolvedValue({ data: {} });
  const mockPut = jest.fn().mockResolvedValue({ data: {} });
  const mockDelete = jest.fn().mockResolvedValue({ data: {} });
  const state: { requestFulfilled: ((c: any) => any) | null; responseRejected: ((e: any) => any) | null } = {
    requestFulfilled: null,
    responseRejected: null,
  };
  (global as any).__apiMockState = state;
  return {
    create: (_config: unknown) => ({
      get: mockGet,
      post: mockPost,
      patch: mockPatch,
      put: mockPut,
      delete: mockDelete,
      defaults: { headers: { common: {} as Record<string, string> } },
      interceptors: {
        request: {
          use: (onFulfilled: (config: any) => any) => {
            state.requestFulfilled = onFulfilled;
            return 0;
          },
        },
        response: {
          use: (_onFulfilled: (res: any) => any, onRejected: (err: any) => any) => {
            state.responseRejected = onRejected;
            return 0;
          },
        },
      },
    }),
  };
});

describe('api service', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    jest.clearAllMocks();
    api.get.mockResolvedValue({ data: {} });
    api.post.mockResolvedValue({ data: {} });
    api.patch.mockResolvedValue({ data: {} });
    api.put.mockResolvedValue({ data: {} });
    api.delete.mockResolvedValue({ data: {} });
    localStorage.clear();
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, href: '' },
      writable: true,
    });
  });

  describe('request interceptor', () => {
    it('adds Authorization header when token exists', async () => {
      localStorage.setItem('token', 'test-token');
      const config = { headers: {} };
      const fulfilled = (global as any).__apiMockState.requestFulfilled;
      expect(fulfilled).toBeDefined();
      const result = await fulfilled!(config);
      expect(result.headers.Authorization).toBe('Bearer test-token');
    });

    it('does not add Authorization when no token', async () => {
      const config = { headers: {} };
      const fulfilled = (global as any).__apiMockState.requestFulfilled;
      const result = await fulfilled!(config);
      expect(result.headers.Authorization).toBeUndefined();
    });
  });

  describe('response interceptor', () => {
    it('removes token and redirects on 401', async () => {
      localStorage.setItem('token', 'x');
      const rejected = (global as any).__apiMockState.responseRejected;
      expect(rejected).toBeDefined();
      const err = { response: { status: 401 } };
      await expect(rejected!(err)).rejects.toEqual(err);
      expect(localStorage.getItem('token')).toBeNull();
      expect(window.location.href).toBe('/login');
    });

    it('rejects non-401 errors', async () => {
      const rejected = (global as any).__apiMockState.responseRejected;
      const err = { response: { status: 500 } };
      await expect(rejected!(err)).rejects.toEqual(err);
    });
  });

  describe('authAPI', () => {
    it('login', async () => {
      await authAPI.login('a@b.com', 'pass');
      expect(api.post).toHaveBeenCalledWith('/api/auth/login', {
        email: 'a@b.com',
        password: 'pass',
      });
    });
    it('register', async () => {
      await authAPI.register({ email: 'a@b.com', password: 'p', firstName: 'A', lastName: 'B' });
      expect(api.post).toHaveBeenCalledWith('/api/auth/register', expect.any(Object));
    });
    it('changePassword', async () => {
      await authAPI.changePassword({ currentPassword: 'old', newPassword: 'new' });
      expect(api.patch).toHaveBeenCalledWith('/api/auth/change-password', {
        currentPassword: 'old',
        newPassword: 'new',
      });
    });
    it('verifyResetToken', async () => {
      await authAPI.verifyResetToken('t123');
      expect(api.get).toHaveBeenCalledWith('/api/auth/reset-password/t123');
    });
    it('resetPassword', async () => {
      await authAPI.resetPassword({ token: 't', password: 'new' });
      expect(api.post).toHaveBeenCalledWith('/api/auth/reset-password', {
        token: 't',
        password: 'new',
      });
    });
    it('logout', async () => {
      await authAPI.logout();
      expect(api.post).toHaveBeenCalledWith('/api/auth/logout');
    });
  });

  describe('feedbackAPI', () => {
    it('getColleagueReceived', async () => {
      await feedbackAPI.getColleagueReceived();
      expect(api.get).toHaveBeenCalledWith('/api/colleague-feedback/received');
    });
    it('getColleagueSent', async () => {
      await feedbackAPI.getColleagueSent();
      expect(api.get).toHaveBeenCalledWith('/api/colleague-feedback/sent');
    });
    it('getColleagueReceivedByUser', async () => {
      await feedbackAPI.getColleagueReceivedByUser('u1');
      expect(api.get).toHaveBeenCalledWith('/api/colleague-feedback/received/u1');
    });
    it('getColleagueSentByUser', async () => {
      await feedbackAPI.getColleagueSentByUser('u1');
      expect(api.get).toHaveBeenCalledWith('/api/colleague-feedback/sent/u1');
    });
    it('getManagerReceived', async () => {
      await feedbackAPI.getManagerReceived();
      expect(api.get).toHaveBeenCalledWith('/api/manager-feedback/received');
    });
    it('getManagerSent', async () => {
      await feedbackAPI.getManagerSent();
      expect(api.get).toHaveBeenCalledWith('/api/manager-feedback/sent');
    });
    it('getManagerReceivedByUser', async () => {
      await feedbackAPI.getManagerReceivedByUser('u1');
      expect(api.get).toHaveBeenCalledWith('/api/manager-feedback/received/u1');
    });
    it('getManagerSentByUser', async () => {
      await feedbackAPI.getManagerSentByUser('u1');
      expect(api.get).toHaveBeenCalledWith('/api/manager-feedback/sent/u1');
    });
    it('createColleague', async () => {
      await feedbackAPI.createColleague({ message: 'hi' });
      expect(api.post).toHaveBeenCalledWith('/api/colleague-feedback', { message: 'hi' });
    });
    it('createManager', async () => {
      await feedbackAPI.createManager({ message: 'hi' });
      expect(api.post).toHaveBeenCalledWith('/api/manager-feedback', { message: 'hi' });
    });
    it('updateColleagueStatus', async () => {
      await feedbackAPI.updateColleagueStatus('id1', 'ACKNOWLEDGED');
      expect(api.patch).toHaveBeenCalledWith('/api/colleague-feedback/id1/status', {
        status: 'ACKNOWLEDGED',
      });
    });
    it('updateManagerStatus', async () => {
      await feedbackAPI.updateManagerStatus('id1', 'ACKNOWLEDGED');
      expect(api.patch).toHaveBeenCalledWith('/api/manager-feedback/id1/status', {
        status: 'ACKNOWLEDGED',
      });
    });
  });

  describe('assessmentAPI', () => {
    it('getAll', async () => {
      await assessmentAPI.getAll();
      expect(api.get).toHaveBeenCalledWith('/api/assessments');
    });
    it('getByUserId', async () => {
      await assessmentAPI.getByUserId('u1');
      expect(api.get).toHaveBeenCalledWith('/api/assessments/user/u1');
    });
    it('getById', async () => {
      await assessmentAPI.getById('a1');
      expect(api.get).toHaveBeenCalledWith('/api/assessments/a1');
    });
    it('create', async () => {
      await assessmentAPI.create({ year: 2024 });
      expect(api.post).toHaveBeenCalledWith('/api/assessments', { year: 2024 });
    });
    it('update', async () => {
      await assessmentAPI.update('a1', { rating: 4 });
      expect(api.put).toHaveBeenCalledWith('/api/assessments/a1', { rating: 4 });
    });
    it('delete', async () => {
      await assessmentAPI.delete('a1');
      expect(api.delete).toHaveBeenCalledWith('/api/assessments/a1');
    });
  });

  describe('usersAPI', () => {
    it('getAll', async () => {
      await usersAPI.getAll();
      expect(api.get).toHaveBeenCalledWith('/api/users');
    });
    it('getById', async () => {
      await usersAPI.getById('u1');
      expect(api.get).toHaveBeenCalledWith('/api/users/u1');
    });
    it('getDirectReports', async () => {
      await usersAPI.getDirectReports();
      expect(api.get).toHaveBeenCalledWith('/api/users/direct-reports');
    });
    it('getIndirectReports', async () => {
      await usersAPI.getIndirectReports();
      expect(api.get).toHaveBeenCalledWith('/api/users/indirect-reports');
    });
    it('resetPassword', async () => {
      await usersAPI.resetPassword('u1', { password: 'new' });
      expect(api.patch).toHaveBeenCalledWith('/api/users/u1/reset-password', { password: 'new' });
    });
    it('updateManager', async () => {
      await usersAPI.updateManager('u1', 'm1');
      expect(api.patch).toHaveBeenCalledWith('/api/users/u1/manager', { managerId: 'm1' });
    });
    it('updateManager null', async () => {
      await usersAPI.updateManager('u1', null);
      expect(api.patch).toHaveBeenCalledWith('/api/users/u1/manager', { managerId: null });
    });
    it('delete', async () => {
      await usersAPI.delete('u1');
      expect(api.delete).toHaveBeenCalledWith('/api/users/u1');
    });
    it('create', async () => {
      await usersAPI.create({
        firstName: 'A',
        lastName: 'B',
        email: 'a@b.com',
        password: 'p',
        role: 'EMPLOYEE',
      });
      expect(api.post).toHaveBeenCalledWith('/api/users', expect.objectContaining({ email: 'a@b.com' }));
    });
    it('sendResetLink', async () => {
      await usersAPI.sendResetLink('u1');
      expect(api.post).toHaveBeenCalledWith('/api/users/u1/send-reset-link');
    });
  });

  describe('quarterlyPerformanceAPI', () => {
    it('getByUserId', async () => {
      await quarterlyPerformanceAPI.getByUserId('u1');
      expect(api.get).toHaveBeenCalledWith('/api/quarterly-performance/u1');
    });
    it('getById', async () => {
      await quarterlyPerformanceAPI.getById('q1');
      expect(api.get).toHaveBeenCalledWith('/api/quarterly-performance/q1');
    });
    it('create', async () => {
      await quarterlyPerformanceAPI.create({ userId: 'u1', quarter: 'Q1', year: 2024 } as any);
      expect(api.post).toHaveBeenCalledWith('/api/quarterly-performance', expect.any(Object));
    });
    it('update', async () => {
      await quarterlyPerformanceAPI.update('q1', {});
      expect(api.put).toHaveBeenCalledWith('/api/quarterly-performance/q1', {});
    });
    it('delete', async () => {
      await quarterlyPerformanceAPI.delete('q1');
      expect(api.delete).toHaveBeenCalledWith('/api/quarterly-performance/q1');
    });
  });

  describe('jiraUnmappedUsersAPI', () => {
    it('getUnmappedUsers', async () => {
      await jiraUnmappedUsersAPI.getUnmappedUsers();
      expect(api.get).toHaveBeenCalledWith('/api/jira-tickets/unmapped-users');
    });
    it('updateAssigneeMapping', async () => {
      await jiraUnmappedUsersAPI.updateAssigneeMapping('jira-user', 'u1');
      expect(api.patch).toHaveBeenCalledWith('/api/jira-tickets/update-assignee-mapping', {
        assigneeName: 'jira-user',
        userId: 'u1',
      });
    });
  });

  describe('jiraStatisticsAPI', () => {
    it('getMyStatistics', async () => {
      await jiraStatisticsAPI.getMyStatistics();
      expect(api.get).toHaveBeenCalledWith('/api/jira-statistics/my-statistics');
    });
    it('getUserStatistics', async () => {
      await jiraStatisticsAPI.getUserStatistics('u1');
      expect(api.get).toHaveBeenCalledWith('/api/jira-statistics/user-statistics/u1?');
    });
    it('getUserStatistics with params', async () => {
      await jiraStatisticsAPI.getUserStatistics(
        'u1',
        { startDate: '2024-01-01', endDate: '2024-12-31' },
        { page: 1, limit: 50 }
      );
      expect(api.get).toHaveBeenCalled();
      const url = (api.get.mock.calls[0] as any)[0];
      expect(url).toContain('user-statistics/u1');
      expect(url).toContain('startDate=2024-01-01');
      expect(url).toContain('endDate=2024-12-31');
      expect(url).toContain('page=1');
      expect(url).toContain('limit=50');
    });
    it('getMonthlyTrends', async () => {
      await jiraStatisticsAPI.getMonthlyTrends('u1');
      expect(api.get).toHaveBeenCalledWith('/api/jira-statistics/monthly-trends/u1');
    });
    it('getMonthlyTrendsData', async () => {
      await jiraStatisticsAPI.getMonthlyTrendsData('u1');
      expect(api.get).toHaveBeenCalledWith('/api/jira-statistics/monthly-trends-data/u1');
    });
    it('getTeamAverages', async () => {
      await jiraStatisticsAPI.getTeamAverages('u1');
      expect(api.get).toHaveBeenCalledWith('/api/jira-statistics/team-averages/u1');
    });
    it('getTeamStatistics', async () => {
      await jiraStatisticsAPI.getTeamStatistics('t1');
      expect(api.get).toHaveBeenCalledWith('/api/jira-statistics/team-statistics/t1?');
    });
    it('getTeamStatistics with memberIds', async () => {
      await jiraStatisticsAPI.getTeamStatistics(
        't1',
        { startDate: '2024-01-01', endDate: '2024-12-31', memberIds: ['m1', 'm2'] }
      );
      expect(api.get).toHaveBeenCalled();
      const url = (api.get.mock.calls[0] as any)[0];
      expect(url).toContain('memberIds=m1');
      expect(url).toContain('memberIds=m2');
    });
    it('getTeamMonthlyTrends', async () => {
      await jiraStatisticsAPI.getTeamMonthlyTrends('t1');
      expect(api.get).toHaveBeenCalledWith('/api/jira-statistics/team-monthly-trends/t1');
    });
  });

  describe('teamsAPI', () => {
    it('getAll', async () => {
      await teamsAPI.getAll();
      expect(api.get).toHaveBeenCalledWith('/api/teams');
    });
    it('getById', async () => {
      await teamsAPI.getById('t1');
      expect(api.get).toHaveBeenCalledWith('/api/teams/t1');
    });
    it('create', async () => {
      await teamsAPI.create({ name: 'T1', description: 'D' });
      expect(api.post).toHaveBeenCalledWith('/api/teams', { name: 'T1', description: 'D' });
    });
    it('update', async () => {
      await teamsAPI.update('t1', { name: 'T2' });
      expect(api.put).toHaveBeenCalledWith('/api/teams/t1', { name: 'T2' });
    });
    it('delete', async () => {
      await teamsAPI.delete('t1');
      expect(api.delete).toHaveBeenCalledWith('/api/teams/t1');
    });
    it('addMember', async () => {
      await teamsAPI.addMember('t1', 'u1');
      expect(api.post).toHaveBeenCalledWith('/api/teams/t1/members', { userId: 'u1' });
    });
    it('removeMember', async () => {
      await teamsAPI.removeMember('t1', 'u1');
      expect(api.delete).toHaveBeenCalledWith('/api/teams/t1/members/u1');
    });
  });

  describe('businessUnitsAPI', () => {
    it('getAll', async () => {
      await businessUnitsAPI.getAll();
      expect(api.get).toHaveBeenCalledWith('/api/business-units');
    });
    it('getById', async () => {
      await businessUnitsAPI.getById('b1');
      expect(api.get).toHaveBeenCalledWith('/api/business-units/b1');
    });
    it('getStatistics', async () => {
      await businessUnitsAPI.getStatistics('b1');
      expect(api.get).toHaveBeenCalledWith('/api/business-units/b1/statistics');
    });
    it('create', async () => {
      await businessUnitsAPI.create({ name: 'BU1' });
      expect(api.post).toHaveBeenCalledWith('/api/business-units', { name: 'BU1' });
    });
    it('update', async () => {
      await businessUnitsAPI.update('b1', { name: 'BU2' });
      expect(api.put).toHaveBeenCalledWith('/api/business-units/b1', { name: 'BU2' });
    });
    it('delete', async () => {
      await businessUnitsAPI.delete('b1');
      expect(api.delete).toHaveBeenCalledWith('/api/business-units/b1');
    });
    it('addMember', async () => {
      await businessUnitsAPI.addMember('b1', 'u1');
      expect(api.post).toHaveBeenCalledWith('/api/business-units/b1/members', { userId: 'u1' });
    });
    it('removeMember', async () => {
      await businessUnitsAPI.removeMember('b1', 'u1');
      expect(api.delete).toHaveBeenCalledWith('/api/business-units/b1/members/u1');
    });
    it('sendEmailToBusinessUnit', async () => {
      await businessUnitsAPI.sendEmailToBusinessUnit('b1', {
        subject: 'S',
        message: 'M',
      });
      expect(api.post).toHaveBeenCalledWith('/api/business-units/b1/send-email', {
        subject: 'S',
        message: 'M',
      });
    });
  });

  describe('monthlyAttendanceAPI', () => {
    it('getAll', async () => {
      await monthlyAttendanceAPI.getAll();
      expect(api.get).toHaveBeenCalledWith('/api/monthly-attendance');
    });
    it('getAll with filters', async () => {
      await monthlyAttendanceAPI.getAll({ userId: 'u1', year: 2024, month: 6 });
      expect(api.get).toHaveBeenCalledWith(
        '/api/monthly-attendance?userId=u1&year=2024&month=6'
      );
    });
    it('getByUserId', async () => {
      await monthlyAttendanceAPI.getByUserId('u1');
      expect(api.get).toHaveBeenCalledWith('/api/monthly-attendance/u1');
    });
    it('create', async () => {
      await monthlyAttendanceAPI.create({
        userId: 'u1',
        month: 6,
        year: 2024,
        workingDays: 22,
        presentInOffice: 20,
      });
      expect(api.post).toHaveBeenCalledWith('/api/monthly-attendance', expect.any(Object));
    });
    it('update', async () => {
      await monthlyAttendanceAPI.update('a1', { presentInOffice: 21 });
      expect(api.put).toHaveBeenCalledWith('/api/monthly-attendance/a1', {
        presentInOffice: 21,
      });
    });
    it('delete', async () => {
      await monthlyAttendanceAPI.delete('a1');
      expect(api.delete).toHaveBeenCalledWith('/api/monthly-attendance/a1');
    });
    it('bulkUpdate', async () => {
      await monthlyAttendanceAPI.bulkUpdate([
        {
          userId: 'u1',
          month: 6,
          year: 2024,
          workingDays: 22,
          presentInOffice: 20,
        },
      ]);
      expect(api.post).toHaveBeenCalledWith('/api/monthly-attendance/bulk', {
        records: expect.any(Array),
      });
    });
    it('updateComment', async () => {
      await monthlyAttendanceAPI.updateComment('a1', 'comment');
      expect(api.patch).toHaveBeenCalledWith('/api/monthly-attendance/a1/comment', {
        reasonForNonCompliance: 'comment',
      });
    });
    it('updateComment null', async () => {
      await monthlyAttendanceAPI.updateComment('a1', null);
      expect(api.patch).toHaveBeenCalledWith('/api/monthly-attendance/a1/comment', {
        reasonForNonCompliance: null,
      });
    });
  });

  describe('sessionsAPI', () => {
    it('getAll', async () => {
      await sessionsAPI.getAll();
      expect(api.get).toHaveBeenCalledWith('/api/sessions');
    });
    it('getAll with params', async () => {
      await sessionsAPI.getAll({
        page: 2,
        limit: 10,
        userId: 'u1',
        isActive: true,
      });
      expect(api.get).toHaveBeenCalled();
      const url = (api.get.mock.calls[0] as any)[0];
      expect(url).toContain('page=2');
      expect(url).toContain('limit=10');
      expect(url).toContain('userId=u1');
      expect(url).toContain('isActive=true');
    });
    it('getStats', async () => {
      await sessionsAPI.getStats();
      expect(api.get).toHaveBeenCalledWith('/api/sessions/stats');
    });
    it('getByUserId', async () => {
      await sessionsAPI.getByUserId('u1');
      expect(api.get).toHaveBeenCalledWith('/api/sessions/user/u1');
    });
    it('deactivate', async () => {
      await sessionsAPI.deactivate('s1');
      expect(api.patch).toHaveBeenCalledWith('/api/sessions/s1/deactivate');
    });
  });
});
