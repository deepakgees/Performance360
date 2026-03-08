/**
 * Unit tests for RecentFeedback component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RecentFeedback from './RecentFeedback';
import { feedbackAPI } from '../services/api';

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));
jest.mock('../services/api');

const mockFeedbackAPI = feedbackAPI as jest.Mocked<typeof feedbackAPI>;

describe('RecentFeedback', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  it('should render title and empty state when no feedback', async () => {
    mockFeedbackAPI.getColleagueReceived = jest.fn().mockResolvedValue({ data: [] });
    render(
      <QueryClientProvider client={queryClient}>
        <RecentFeedback />
      </QueryClientProvider>
    );
    expect(screen.getByText('Recent Colleague Feedback')).toBeInTheDocument();
    await screen.findByText('No recent colleague feedback');
  });

  it('should render recent feedback list when data exists', async () => {
    mockFeedbackAPI.getColleagueReceived = jest.fn().mockResolvedValue({
      data: [
        {
          id: 'f1',
          title: 'Great work',
          rating: 5,
          sender: { firstName: 'John', lastName: 'Doe' },
        },
      ],
    });
    render(
      <QueryClientProvider client={queryClient}>
        <RecentFeedback />
      </QueryClientProvider>
    );
    await screen.findByText('Great work');
    expect(screen.getByText('Great work')).toBeInTheDocument();
  });
});
