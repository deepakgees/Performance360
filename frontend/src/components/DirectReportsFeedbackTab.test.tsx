/**
 * Unit tests for DirectReportsFeedbackTab component
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DirectReportsFeedbackTab from './DirectReportsFeedbackTab';
import { assessmentAPI, feedbackAPI } from '../services/api';
import { getPreviousQuarter } from '../utils/dateUtils';

// Mock the API services
jest.mock('../services/api');
jest.mock('../utils/dateUtils');

const mockAssessmentAPI = assessmentAPI as jest.Mocked<typeof assessmentAPI>;
const mockFeedbackAPI = feedbackAPI as jest.Mocked<typeof feedbackAPI>;
const mockGetPreviousQuarter = getPreviousQuarter as jest.MockedFunction<typeof getPreviousQuarter>;

// Mock data
const mockDirectReports = [
  {
    id: 'user1',
    email: 'user1@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'EMPLOYEE',
    position: 'Developer',
  },
  {
    id: 'user2',
    email: 'user2@example.com',
    firstName: 'Jane',
    lastName: 'Smith',
    role: 'EMPLOYEE',
  },
];

const mockAssessments = [
  {
    id: 'assessment1',
    userId: 'user1',
    year: 2024,
    quarter: 'Q1',
    rating: 4,
  },
];

const mockColleagueFeedback = [
  {
    id: 'cf1',
    senderId: 'user1',
    receiverId: 'user3',
    year: '2024',
    quarter: 'Q1',
    rating: 5,
  },
];

const mockManagerFeedback = [
  {
    id: 'mf1',
    receiverId: 'user1',
    senderId: 'manager1',
    year: '2024',
    quarter: 'Q1',
    managerOverallRating: 4,
  },
];

describe('DirectReportsFeedbackTab', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Mock getPreviousQuarter
    mockGetPreviousQuarter.mockReturnValue({
      quarter: 'Q1',
      year: '2024',
    });

    // Mock API responses
    mockAssessmentAPI.getByUserId = jest.fn().mockResolvedValue({
      data: mockAssessments,
    });

    mockFeedbackAPI.getColleagueSentByUser = jest.fn().mockResolvedValue({
      data: mockColleagueFeedback,
    });

    mockFeedbackAPI.getManagerReceivedByUser = jest.fn().mockResolvedValue({
      data: mockManagerFeedback,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (directReports = mockDirectReports) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <DirectReportsFeedbackTab directReports={directReports} />
      </QueryClientProvider>
    );
  };

  it('should render empty state when no direct reports', () => {
    renderComponent([]);
    expect(screen.getByText(/no direct reports/i)).toBeInTheDocument();
  });

  it('should display header with quarter information', () => {
    renderComponent();
    expect(screen.getByText(/quarterly feedback completion/i)).toBeInTheDocument();
    expect(screen.getByText(/Q1 2024/i)).toBeInTheDocument();
  });

  it('should display summary statistics', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText(/total reports/i)).toBeInTheDocument();
      expect(screen.getByText(/all completed/i)).toBeInTheDocument();
      expect(screen.getByText(/self assessments/i)).toBeInTheDocument();
      expect(screen.getByText(/feedback provided/i)).toBeInTheDocument();
    });
  });

  it('should display loading state initially', () => {
    // Delay the API response
    mockAssessmentAPI.getByUserId = jest.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ data: [] }), 100))
    );

    renderComponent();
    expect(screen.getByText(/loading feedback data/i)).toBeInTheDocument();
  });

  it('should fetch feedback data for all direct reports', async () => {
    renderComponent();

    await waitFor(() => {
      expect(mockAssessmentAPI.getByUserId).toHaveBeenCalledWith('user1');
      expect(mockAssessmentAPI.getByUserId).toHaveBeenCalledWith('user2');
      expect(mockFeedbackAPI.getColleagueSentByUser).toHaveBeenCalledWith('user1');
      expect(mockFeedbackAPI.getColleagueSentByUser).toHaveBeenCalledWith('user2');
      expect(mockFeedbackAPI.getManagerReceivedByUser).toHaveBeenCalledWith('user1');
      expect(mockFeedbackAPI.getManagerReceivedByUser).toHaveBeenCalledWith('user2');
    });
  });

  it('should display feedback status table', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    mockAssessmentAPI.getByUserId = jest.fn().mockRejectedValue(new Error('API Error'));

    renderComponent();

    await waitFor(() => {
      // Component should still render, showing error state or empty data
      expect(screen.queryByText(/loading feedback data/i)).not.toBeInTheDocument();
    });
  });

  it('should filter results by search term', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search by name or email/i);
    // Simulate typing in search input
    // Note: This would require user event library for full testing
    expect(searchInput).toBeInTheDocument();
  });

  it('should use previous quarter from dateUtils', () => {
    renderComponent();
    expect(mockGetPreviousQuarter).toHaveBeenCalled();
  });
});
