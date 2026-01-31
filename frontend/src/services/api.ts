import axios from 'axios';

/**
 * API Configuration and Setup
 *
 * This file contains the centralized API configuration and service functions
 * for communicating with the backend server. It includes:
 * - Axios instance configuration
 * - Request/response interceptors for authentication
 * - Service functions for different API endpoints
 */

/**
 * Dynamically determine the API base URL
 * - If REACT_APP_API_URL is set, use that
 * - Otherwise, use the same host as the frontend with port 3001
 * - This assumes frontend and backend are on the same machine
 */
const getApiBaseURL = (): string => {
  // If environment variable is set, use that
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // Otherwise, use the same host as the frontend with backend port
  const currentHost = window.location.hostname;
  const backendPort = '3001';

  console.log('currentHost', currentHost);

  // If running on localhost, use localhost for backend too
  if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    return `http://localhost:${backendPort}`;
  }

  // For network access, use the same IP as the frontend
  return `http://${currentHost}:${backendPort}`;
};

/**
 * Axios instance configured for the application
 * Dynamically determines the API URL based on the current host
 */
export const api = axios.create({
  baseURL: getApiBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor
 *
 * Automatically adds the authentication token to all outgoing requests
 * if a token exists in localStorage. This ensures authenticated requests
 * are properly handled without manual token management in each API call.
 */
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 *
 * Handles authentication errors globally. If a 401 (Unauthorized) response
 * is received, it automatically removes the stored token and redirects
 * the user to the login page.
 */
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Authentication API Service
 *
 * Provides functions for user authentication including login and registration.
 * All functions return promises that resolve to axios response objects.
 */
export const authAPI = {
  /**
   * Authenticate a user with email and password
   * @param {string} email - User's email address
   * @param {string} password - User's password
   * @returns {Promise} Axios response with user data and token
   */
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),

  /**
   * Register a new user account
   * @param {Object} userData - User registration data
   * @param {string} userData.email - User's email address
   * @param {string} userData.password - User's password
   * @returns {Promise} Axios response with registration confirmation
   */
  register: (userData: any) => api.post('/api/auth/register', userData),

  /**
   * Change password for logged-in user
   * @param {Object} passwordData - Password change data
   * @param {string} passwordData.currentPassword - User's current password
   * @param {string} passwordData.newPassword - User's new password
   * @returns {Promise} Axios response with password change confirmation
   */
  changePassword: (passwordData: {
    currentPassword: string;
    newPassword: string;
  }) => api.patch('/api/auth/change-password', passwordData),

  /**
   * Verify password reset token
   * @param {string} token - Password reset token
   * @returns {Promise} Axios response with token validity
   */
  verifyResetToken: (token: string) =>
    api.get(`/api/auth/reset-password/${token}`),

  /**
   * Reset password using token
   * @param {Object} resetData - Password reset data
   * @param {string} resetData.token - Password reset token
   * @param {string} resetData.password - New password
   * @returns {Promise} Axios response with reset confirmation
   */
  resetPassword: (resetData: { token: string; password: string }) =>
    api.post('/api/auth/reset-password', resetData),

  /**
   * Logout current user
   * @returns {Promise} Axios response with logout confirmation
   */
  logout: () => api.post('/api/auth/logout'),
};

/**
 * Feedback API Service
 *
 * Provides functions for managing feedback between users including
 * creating, retrieving, and updating feedback status.
 */
export const feedbackAPI = {
  /**
   * Get all colleague feedback received by the current user
   */
  getColleagueReceived: () => api.get('/api/colleague-feedback/received'),

  /**
   * Get all colleague feedback sent by the current user
   */
  getColleagueSent: () => api.get('/api/colleague-feedback/sent'),

  /**
   * Get all colleague feedback received by a specific user (admin/manager only)
   */
  getColleagueReceivedByUser: (userId: string) =>
    api.get(`/api/colleague-feedback/received/${userId}`),

  /**
   * Get all colleague feedback sent by a specific user (admin/manager only)
   */
  getColleagueSentByUser: (userId: string) =>
    api.get(`/api/colleague-feedback/sent/${userId}`),

  /**
   * Get all manager feedback received by the current user
   */
  getManagerReceived: () => api.get('/api/manager-feedback/received'),

  /**
   * Get all manager feedback sent by the current user
   */
  getManagerSent: () => api.get('/api/manager-feedback/sent'),

  /**
   * Get all manager feedback received by a specific user (admin/manager only)
   */
  getManagerReceivedByUser: (userId: string) =>
    api.get(`/api/manager-feedback/received/${userId}`),

  /**
   * Create new colleague feedback
   */
  createColleague: (data: any) => api.post('/api/colleague-feedback', data),

  /**
   * Create new manager feedback
   */
  createManager: (data: any) => api.post('/api/manager-feedback', data),

  /**
   * Update the status of existing colleague feedback
   */
  updateColleagueStatus: (id: string, status: string) =>
    api.patch(`/api/colleague-feedback/${id}/status`, { status }),

  /**
   * Update the status of existing manager feedback
   */
  updateManagerStatus: (id: string, status: string) =>
    api.patch(`/api/manager-feedback/${id}/status`, { status }),
};

/**
 * Assessment API Service (V2)
 *
 * Provides functions for managing self-assessments using the new normalized structure.
 */
export const assessmentAPI = {
  /**
   * Get all self-assessments for the current user
   * @returns {Promise} Axios response with assessments list
   */
  getAll: () => api.get('/api/assessments'),

  /**
   * Get all self-assessments for a specific user (admin/manager only)
   * @param {string} userId - User ID
   * @returns {Promise} Axios response with assessments list
   */
  getByUserId: (userId: string) => api.get(`/api/assessments/user/${userId}`),

  /**
   * Get a specific assessment by ID
   * @param {string} id - Assessment ID
   * @returns {Promise} Axios response with assessment data
   */
  getById: (id: string) => api.get(`/api/assessments/${id}`),

  /**
   * Create a new self-assessment
   * @param {Object} data - Assessment data
   * @param {number} data.year - Assessment year (e.g., 2024)
   * @param {string} [data.quarter] - Assessment quarter (Q1, Q2, Q3, Q4, ANNUAL)
   * @param {number} [data.rating] - Self-rating (1-5 scale)
   * @param {string} [data.achievements] - Key achievements
   * @param {string} [data.improvements] - Areas for improvement
   * @param {string} [data.satisfactionLevel] - Satisfaction level enum
   * @param {string} [data.aspirations] - Career aspirations
   * @param {string} [data.suggestionsForTeam] - Team improvement suggestions
   * @returns {Promise} Axios response with created assessment
   */
  create: (data: any) => api.post('/api/assessments', data),

  /**
   * Update an existing assessment
   * @param {string} id - Assessment ID
   * @param {Object} data - Updated assessment data
   * @returns {Promise} Axios response with updated assessment
   */
  update: (id: string, data: any) => api.put(`/api/assessments/${id}`, data),

  /**
   * Delete an assessment
   * @param {string} id - Assessment ID
   * @returns {Promise} Axios response with deletion confirmation
   */
  delete: (id: string) => api.delete(`/api/assessments/${id}`),
};

/**
 * Users API Service
 *
 * Provides functions for managing users including
 * retrieving user lists, user information, and admin operations.
 */
export const usersAPI = {
  /**
   * Get all users (for feedback recipient selection)
   * @returns {Promise} Axios response with users list
   */
  getAll: () => api.get('/api/users'),

  /**
   * Get a specific user by ID
   * @param {string} id - User ID
   * @returns {Promise} Axios response with user data
   */
  getById: (id: string) => api.get(`/api/users/${id}`),

  /**
   * Get direct reports for current user (manager/admin only)
   * @returns {Promise} Axios response with direct reports list
   */
  getDirectReports: () => api.get('/api/users/direct-reports'),

  /**
   * Get indirect reports for current user (manager/admin only)
   * @returns {Promise} Axios response with indirect reports list
   */
  getIndirectReports: () => api.get('/api/users/indirect-reports'),

  /**
   * Reset a user's password (admin only)
   * @param {string} id - User ID
   * @param {Object} data - Password reset data
   * @param {string} data.password - New password
   * @returns {Promise} Axios response with password reset confirmation
   */
  resetPassword: (id: string, data: { password: string }) =>
    api.patch(`/api/users/${id}/reset-password`, data),

  /**
   * Update a user's manager (admin only)
   * @param {string} id - User ID
   * @param {string|null} managerId - Manager ID or null to remove manager
   * @returns {Promise} Axios response with manager update confirmation
   */
  updateManager: (id: string, managerId: string | null) =>
    api.patch(`/api/users/${id}/manager`, { managerId }),

  /**
   * Delete a user (admin only)
   * @param {string} id - User ID
   * @returns {Promise} Axios response with deletion confirmation
   */
  delete: (id: string) => api.delete(`/api/users/${id}`),

  /**
   * Create a new user (admin only)
   * @param {Object} userData - User creation data
   * @param {string} userData.firstName - User's first name
   * @param {string} userData.lastName - User's last name
   * @param {string} userData.email - User's email address
   * @param {string} userData.password - User's password
   * @param {string} userData.role - User's role ('EMPLOYEE', 'MANAGER', 'ADMIN')
   * @param {string} [userData.position] - User's position (optional)
   * @param {string} [userData.managerId] - Manager's ID (optional)
   * @returns {Promise} Axios response with created user data
   */
  create: (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
    position?: string;
    managerId?: string;
  }) => api.post('/api/users', userData),

  /**
   * Send password reset link to a user (admin only)
   * @param {string} id - User ID
   * @returns {Promise} Axios response with confirmation message
   */
  sendResetLink: (id: string) =>
    api.post(`/api/users/${id}/send-reset-link`),
};

/**
 * Quarterly Performance API Service
 *
 * Provides functions for managing quarterly performance records including
 * creating, reading, updating, and deleting performance data.
 */
export const quarterlyPerformanceAPI = {
  /**
   * Get all quarterly performance records for a specific user
   * @param {string} userId - User ID
   * @returns {Promise} Axios response with performance records list
   */
  getByUserId: (userId: string) =>
    api.get(`/api/quarterly-performance/${userId}`),

  /**
   * Get a specific performance record by ID
   * @param {string} id - Performance record ID
   * @returns {Promise} Axios response with performance record data
   */
  getById: (id: string) => api.get(`/api/quarterly-performance/${id}`),

  /**
   * Create a new quarterly performance record
   * @param {Object} data - Performance record data
   * @param {string} data.userId - User ID
   * @param {string} data.quarter - Quarter (Q1, Q2, Q3, Q4)
   * @param {number} data.year - Year
   * @param {boolean} data.isCritical - Whether user is critical member
   * @param {string} data.managerComment - Manager's comment
   * @param {string} data.hrbpComment - HRBP's comment
   * @param {string} data.nextActionPlanManager - Manager's action plan
   * @param {string} data.nextActionPlanHrbp - HRBP's action plan
   * @returns {Promise} Axios response with created performance record
   */
  create: (data: any) => api.post('/api/quarterly-performance', data),

  /**
   * Update an existing quarterly performance record
   * @param {string} id - Performance record ID
   * @param {Object} data - Updated performance record data
   * @returns {Promise} Axios response with updated performance record
   */
  update: (id: string, data: any) =>
    api.put(`/api/quarterly-performance/${id}`, data),

  /**
   * Delete a quarterly performance record (admin only)
   * @param {string} id - Performance record ID
   * @returns {Promise} Axios response with deletion confirmation
   */
  delete: (id: string) => api.delete(`/api/quarterly-performance/${id}`),
};

/**
 * Jira Unmapped Users API Service
 *
 * Provides functions for managing Jira user mappings including
 * retrieving unmapped users and updating assignee mappings.
 */
export const jiraUnmappedUsersAPI = {
  /**
   * Get all unmapped Jira users and system users for mapping
   * @returns {Promise} Axios response with unmapped users and system users
   */
  getUnmappedUsers: () => api.get('/api/jira-tickets/unmapped-users'),

  /**
   * Update assignee mapping for a specific Jira user
   * @param {string} assigneeName - Jira assignee name
   * @param {string} userId - System user ID to map to
   * @returns {Promise} Axios response with mapping update confirmation
   */
  updateAssigneeMapping: (assigneeName: string, userId: string) =>
    api.patch('/api/jira-tickets/update-assignee-mapping', {
      assigneeName,
      userId,
    }),
};

/**
 * Jira Statistics API Service
 *
 * Provides functions for retrieving Jira statistics and metrics
 * for the current user's tickets and performance.
 */
export const jiraStatisticsAPI = {
  /**
   * Get Jira statistics for the current user
   * @returns {Promise} Axios response with Jira statistics data
   */
  getMyStatistics: () => api.get('/api/jira-statistics/my-statistics'),

  /**
   * Get Jira statistics for a specific user
   * @param {string} userId - The ID of the user to get statistics for
   * @param {Object} dateRange - Optional date range parameters
   * @param {string} dateRange.startDate - Start date in YYYY-MM-DD format
   * @param {string} dateRange.endDate - End date in YYYY-MM-DD format
   * @param {Object} pagination - Optional pagination parameters
   * @param {number} pagination.page - Page number (default: 1)
   * @param {number} pagination.limit - Number of tickets per page (default: 50)
   * @returns {Promise} Axios response with Jira statistics data
   */
  getUserStatistics: (
    userId: string,
    dateRange?: { startDate: string; endDate: string },
    pagination?: { page: number; limit: number }
  ) => {
    const params = new URLSearchParams();
    if (dateRange?.startDate) params.append('startDate', dateRange.startDate);
    if (dateRange?.endDate) params.append('endDate', dateRange.endDate);
    if (pagination?.page) params.append('page', pagination.page.toString());
    if (pagination?.limit) params.append('limit', pagination.limit.toString());

    return api.get(
      `/api/jira-statistics/user-statistics/${userId}?${params.toString()}`
    );
  },

  /**
   * Get monthly trends for Jira statistics over the last year
   * @param {string} userId - The ID of the user to get monthly trends for
   * @returns {Promise} Axios response with monthly trends data
   */
  getMonthlyTrends: (userId: string) =>
    api.get(`/api/jira-statistics/monthly-trends/${userId}`),

  /**
   * Get monthly trends data for Jira statistics over the last 5 months
   * @param {string} userId - The ID of the user to get monthly trends data for
   * @returns {Promise} Axios response with monthly trends data
   */
  getMonthlyTrendsData: (userId: string) =>
    api.get(`/api/jira-statistics/monthly-trends-data/${userId}`),

  /**
   * Get team average statistics for a user's teams
   * @param {string} userId - The ID of the user to get team averages for
   * @returns {Promise} Axios response with team averages data
   */
  getTeamAverages: (userId: string) =>
    api.get(`/api/jira-statistics/team-averages/${userId}`),

  /**
   * Get comprehensive Jira statistics for a specific team
   * @param {string} teamId - The ID of the team to get statistics for
   * @param {Object} dateRange - Optional date range parameters
   * @param {string} dateRange.startDate - Start date in YYYY-MM-DD format
   * @param {string} dateRange.endDate - End date in YYYY-MM-DD format
   * @param {Object} pagination - Optional pagination parameters
   * @param {number} pagination.page - Page number (default: 1)
   * @param {number} pagination.limit - Number of tickets per page (default: 50)
   * @returns {Promise} Axios response with team Jira statistics data
   */
  getTeamStatistics: (
    teamId: string,
    dateRange?: { startDate: string; endDate: string; memberIds?: string[] },
    pagination?: { page: number; limit: number }
  ) => {
    const params = new URLSearchParams();
    if (dateRange?.startDate) params.append('startDate', dateRange.startDate);
    if (dateRange?.endDate) params.append('endDate', dateRange.endDate);
    if (dateRange?.memberIds && dateRange.memberIds.length > 0) {
      dateRange.memberIds.forEach(id => params.append('memberIds', id));
    }
    if (pagination?.page) params.append('page', pagination.page.toString());
    if (pagination?.limit) params.append('limit', pagination.limit.toString());

    return api.get(
      `/api/jira-statistics/team-statistics/${teamId}?${params.toString()}`
    );
  },

  /**
   * Get monthly trends for team Jira statistics over the last year
   * @param {string} teamId - The ID of the team to get monthly trends for
   * @returns {Promise} Axios response with team monthly trends data
   */
  getTeamMonthlyTrends: (teamId: string) =>
    api.get(`/api/jira-statistics/team-monthly-trends/${teamId}`),
};

/**
 * Teams API Service
 *
 * Provides functions for managing teams including
 * creating, reading, updating, and deleting teams and team memberships.
 */
export const teamsAPI = {
  /**
   * Get all active teams with their members
   * @returns {Promise} Axios response with teams list
   */
  getAll: () => api.get('/api/teams'),

  /**
   * Get a specific team by ID with its members
   * @param {string} id - Team ID
   * @returns {Promise} Axios response with team data
   */
  getById: (id: string) => api.get(`/api/teams/${id}`),

  /**
   * Create a new team (admin only)
   * @param {Object} data - Team data
   * @param {string} data.name - Team name
   * @param {string} [data.description] - Team description
   * @returns {Promise} Axios response with created team
   */
  create: (data: { name: string; description?: string }) =>
    api.post('/api/teams', data),

  /**
   * Update an existing team (admin only)
   * @param {string} id - Team ID
   * @param {Object} data - Updated team data
   * @param {string} [data.name] - New team name
   * @param {string} [data.description] - New team description
   * @returns {Promise} Axios response with updated team
   */
  update: (id: string, data: { name?: string; description?: string }) =>
    api.put(`/api/teams/${id}`, data),

  /**
   * Delete a team (admin only)
   * @param {string} id - Team ID
   * @returns {Promise} Axios response with deletion confirmation
   */
  delete: (id: string) => api.delete(`/api/teams/${id}`),

  /**
   * Add a user to a team (admin only)
   * @param {string} teamId - Team ID
   * @param {string} userId - User ID to add
   * @returns {Promise} Axios response with team membership confirmation
   */
  addMember: (teamId: string, userId: string) =>
    api.post(`/api/teams/${teamId}/members`, { userId }),

  /**
   * Remove a user from a team (admin only)
   * @param {string} teamId - Team ID
   * @param {string} userId - User ID to remove
   * @returns {Promise} Axios response with removal confirmation
   */
  removeMember: (teamId: string, userId: string) =>
    api.delete(`/api/teams/${teamId}/members/${userId}`),
};

/**
 * Business Units API Service
 *
 * Provides functions for managing business units including
 * creating, reading, updating, and deleting business units and user assignments.
 */
export const businessUnitsAPI = {
  /**
   * Get all active business units with their members
   * @returns {Promise} Axios response with business units list
   */
  getAll: () => api.get('/api/business-units'),

  /**
   * Get a specific business unit by ID with its members
   * @param {string} id - Business Unit ID
   * @returns {Promise} Axios response with business unit data
   */
  getById: (id: string) => api.get(`/api/business-units/${id}`),

  /**
   * Get comprehensive statistics for a business unit
   * @param {string} id - Business Unit ID
   * @returns {Promise} Axios response with business unit statistics
   */
  getStatistics: (id: string) =>
    api.get(`/api/business-units/${id}/statistics`),

  /**
   * Create a new business unit (admin only)
   * @param {Object} data - Business unit data
   * @param {string} data.name - Business unit name
   * @param {string} [data.description] - Business unit description
   * @returns {Promise} Axios response with created business unit
   */
  create: (data: { name: string; description?: string }) =>
    api.post('/api/business-units', data),

  /**
   * Update an existing business unit (admin only)
   * @param {string} id - Business Unit ID
   * @param {Object} data - Updated business unit data
   * @param {string} [data.name] - New business unit name
   * @param {string} [data.description] - New business unit description
   * @returns {Promise} Axios response with updated business unit
   */
  update: (id: string, data: { name?: string; description?: string }) =>
    api.put(`/api/business-units/${id}`, data),

  /**
   * Delete a business unit (admin only)
   * @param {string} id - Business Unit ID
   * @returns {Promise} Axios response with deletion confirmation
   */
  delete: (id: string) => api.delete(`/api/business-units/${id}`),

  /**
   * Add a user to a business unit (admin only)
   * @param {string} businessUnitId - Business Unit ID
   * @param {string} userId - User ID to add
   * @returns {Promise} Axios response with business unit membership confirmation
   */
  addMember: (businessUnitId: string, userId: string) =>
    api.post(`/api/business-units/${businessUnitId}/members`, { userId }),

  /**
   * Remove a user from a business unit (admin only)
   * @param {string} businessUnitId - Business Unit ID
   * @param {string} userId - User ID to remove
   * @returns {Promise} Axios response with removal confirmation
   */
  removeMember: (businessUnitId: string, userId: string) =>
    api.delete(`/api/business-units/${businessUnitId}/members/${userId}`),

  /**
   * Send customized email to all users in a business unit with password reset links (admin only)
   * @param {string} businessUnitId - Business Unit ID
   * @param {Object} emailData - Email data
   * @param {string} emailData.subject - Email subject
   * @param {string} emailData.message - Custom message content (HTML supported)
   * @returns {Promise} Axios response with email sending results
   */
  sendEmailToBusinessUnit: (
    businessUnitId: string,
    emailData: { subject: string; message: string }
  ) =>
    api.post(`/api/business-units/${businessUnitId}/send-email`, emailData),
};

/**
 * Monthly Attendance API Service
 *
 * Provides functions for managing monthly attendance records including
 * creating, reading, updating, and deleting attendance data.
 */
export const monthlyAttendanceAPI = {
  /**
   * Get all monthly attendance records (admin only)
   * @param {Object} filters - Optional filters
   * @param {string} filters.userId - Filter by user ID
   * @param {number} filters.year - Filter by year
   * @param {number} filters.month - Filter by month (1-12)
   * @returns {Promise} Axios response with attendance records list
   */
  getAll: (filters?: { userId?: string; year?: number; month?: number }) => {
    const params = new URLSearchParams();
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.month) params.append('month', filters.month.toString());
    
    const queryString = params.toString();
    return api.get(`/api/monthly-attendance${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Get all monthly attendance records for a specific user
   * @param {string} userId - User ID
   * @returns {Promise} Axios response with attendance records list
   */
  getByUserId: (userId: string) =>
    api.get(`/api/monthly-attendance/${userId}`),

  /**
   * Create a new monthly attendance record (admin only)
   * @param {Object} data - Attendance record data
   * @param {string} data.userId - User ID
   * @param {number} data.month - Month (1-12)
   * @param {number} data.year - Year
   * @param {number} data.workingDays - Number of working days in the month
   * @param {number} data.presentInOffice - Number of days user came to office
   * @param {number} [data.leavesAvailed] - Number of leaves availed (default: 0)
   * @param {number} [data.leaveNotificationsInTeamsChannel] - Number of leaves as notified in teams chats (default: 0)
   * @param {boolean} [data.weeklyCompliance] - Weekly compliance (true/false/null)
   * @param {boolean} [data.exceptionApproved] - Exception approved (true/false/null)
   * @param {string} [data.reasonForNonCompliance] - Reason for non-compliance
   * @returns {Promise} Axios response with created attendance record
   */
  create: (data: {
    userId: string;
    month: number;
    year: number;
    workingDays: number;
    presentInOffice: number;
    leavesAvailed?: number;
    leaveNotificationsInTeamsChannel?: number;
    weeklyCompliance?: boolean | null;
    exceptionApproved?: boolean | null;
    reasonForNonCompliance?: string;
  }) => api.post('/api/monthly-attendance', data),

  /**
   * Update an existing monthly attendance record (admin only)
   * @param {string} id - Attendance record ID
   * @param {Object} data - Updated attendance record data
   * @param {number} [data.workingDays] - Number of working days
   * @param {number} [data.presentInOffice] - Number of days present
   * @param {number} [data.leavesAvailed] - Number of leaves availed
   * @param {number} [data.leaveNotificationsInTeamsChannel] - Number of leaves as notified in teams chats
   * @param {boolean} [data.weeklyCompliance] - Weekly compliance
   * @param {boolean} [data.exceptionApproved] - Exception approved
   * @param {string} [data.reasonForNonCompliance] - Reason for non-compliance
   * @returns {Promise} Axios response with updated attendance record
   */
  update: (id: string, data: {
    workingDays?: number;
    presentInOffice?: number;
    leavesAvailed?: number;
    leaveNotificationsInTeamsChannel?: number;
    weeklyCompliance?: boolean | null;
    exceptionApproved?: boolean | null;
    reasonForNonCompliance?: string;
  }) => api.put(`/api/monthly-attendance/${id}`, data),

  /**
   * Delete a monthly attendance record (admin only)
   * @param {string} id - Attendance record ID
   * @returns {Promise} Axios response with deletion confirmation
   */
  delete: (id: string) => api.delete(`/api/monthly-attendance/${id}`),

  /**
   * Bulk create or update monthly attendance records (admin only)
   * @param {Array} records - Array of attendance records to create/update
   * @returns {Promise} Axios response with bulk update results
   */
  bulkUpdate: (records: Array<{
    userId: string;
    month: number;
    year: number;
    workingDays: number;
    presentInOffice: number;
    leavesAvailed?: number;
    leaveNotificationsInTeamsChannel?: number;
    weeklyCompliance?: boolean | null;
    exceptionApproved?: boolean | null;
    reasonForNonCompliance?: string;
  }>) => api.post('/api/monthly-attendance/bulk', { records }),

  /**
   * Update manager comment (reasonForNonCompliance) for a monthly attendance record (managers only)
   * @param {string} id - Attendance record ID
   * @param {string} reasonForNonCompliance - Manager's comment
   * @returns {Promise} Axios response with updated attendance record
   */
  updateComment: (id: string, reasonForNonCompliance: string | null) =>
    api.patch(`/api/monthly-attendance/${id}/comment`, { reasonForNonCompliance }),
};

/**
 * Sessions API Service (Admin only)
 *
 * Provides functions for viewing and managing user sessions.
 */
export const sessionsAPI = {
  /**
   * Get all sessions with pagination (admin only)
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 50, max: 100)
   * @param {string} params.userId - Filter by user ID (optional)
   * @param {boolean} params.isActive - Filter by active status (optional)
   * @returns {Promise} Axios response with sessions list and pagination metadata
   */
  getAll: (params?: {
    page?: number;
    limit?: number;
    userId?: string;
    isActive?: boolean;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.isActive !== undefined)
      queryParams.append('isActive', params.isActive.toString());

    const queryString = queryParams.toString();
    return api.get(`/api/sessions${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Get session statistics (admin only)
   * @returns {Promise} Axios response with session statistics
   */
  getStats: () => api.get('/api/sessions/stats'),

  /**
   * Get sessions for a specific user (admin only)
   * @param {string} userId - User ID
   * @returns {Promise} Axios response with user sessions list
   */
  getByUserId: (userId: string) => api.get(`/api/sessions/user/${userId}`),

  /**
   * Deactivate a session (admin only)
   * @param {string} sessionId - Session ID
   * @returns {Promise} Axios response with deactivation confirmation
   */
  deactivate: (sessionId: string) =>
    api.patch(`/api/sessions/${sessionId}/deactivate`),
};
