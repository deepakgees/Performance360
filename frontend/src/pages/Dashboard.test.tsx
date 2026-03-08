/**
 * Unit tests for Dashboard page component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import Dashboard from './Dashboard';
import { feedbackAPI } from '../services/api';

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'u@test.com', firstName: 'U', lastName: 'Ser', role: 'EMPLOYEE' },
  }),
}));
jest.mock('../services/api');

// Mock heavy child components to avoid API calls and console noise
jest.mock('../components/SelfAssessmentsList', () => () => (
  <div data-testid="mock-self-assessments-list">Self Assessments</div>
));
jest.mock('../components/JiraStatisticsForUser', () => ({ userId }: { userId: string }) => (
  <div data-testid="mock-jira-statistics">Jira Statistics for {userId}</div>
));
jest.mock('../components/ColleagueFeedbackPastTable', () => () => (
  <div data-testid="mock-colleague-feedback-past">Colleague Feedback Past</div>
));
jest.mock('../components/ManagerFeedbackPastTable', () => () => (
  <div data-testid="mock-manager-feedback-past">Manager Feedback Past</div>
));
jest.mock('../components/AttendanceCompliance', () => () => (
  <div data-testid="mock-attendance-compliance">Attendance Compliance</div>
));

const mockFeedbackAPI = feedbackAPI as jest.Mocked<typeof feedbackAPI>;

describe('Dashboard', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    mockFeedbackAPI.getColleagueSent = jest.fn().mockResolvedValue({ data: [] });
    mockFeedbackAPI.getManagerSent = jest.fn().mockResolvedValue({ data: [] });
  });

  const renderDashboard = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <Dashboard />
      </QueryClientProvider>
    );

  it('should render dashboard title and subtitle', () => {
    renderDashboard();
    expect(
      screen.getByRole('heading', { name: /dashboard/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText('View your performance data and feedback history')
    ).toBeInTheDocument();
  });

  it('should render all tabs', () => {
    renderDashboard();
    expect(screen.getByRole('button', { name: /self-assessment/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /jira statistics/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /feedback provided to colleagues/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /feedback provided to manager/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /attendance/i })).toBeInTheDocument();
  });

  it('should switch to Jira Statistics tab when clicked', async () => {
    renderDashboard();
    await userEvent.click(screen.getByRole('button', { name: /jira statistics/i }));
    expect(screen.getByRole('button', { name: /jira statistics/i })).toHaveClass(
      'border-indigo-500'
    );
  });

  it('should switch to Attendance tab when clicked', async () => {
    renderDashboard();
    await userEvent.click(screen.getByRole('button', { name: /attendance/i }));
    expect(screen.getByRole('button', { name: /attendance/i })).toHaveClass(
      'border-indigo-500'
    );
  });

  it('should have assessments tab active by default', () => {
    renderDashboard();
    expect(screen.getByRole('button', { name: /self-assessment/i })).toHaveClass(
      'border-indigo-500'
    );
  });
});
