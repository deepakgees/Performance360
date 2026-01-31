/**
 * Unit tests for DirectReportsAttendanceTab component
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DirectReportsAttendanceTab from './DirectReportsAttendanceTab';
import { monthlyAttendanceAPI } from '../services/api';

// Mock the API service
jest.mock('../services/api');

const mockMonthlyAttendanceAPI = monthlyAttendanceAPI as jest.Mocked<typeof monthlyAttendanceAPI>;

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

const mockAttendanceRecords = [
  {
    id: 'att1',
    userId: 'user1',
    month: 11,
    year: 2024,
    attendancePercentage: 45.5,
    exceptionApproved: false,
  },
  {
    id: 'att2',
    userId: 'user1',
    month: 12,
    year: 2024,
    attendancePercentage: 50.0,
    exceptionApproved: false,
  },
  {
    id: 'att3',
    userId: 'user2',
    month: 11,
    year: 2024,
    attendancePercentage: 35.0,
    exceptionApproved: false,
  },
  {
    id: 'att4',
    userId: 'user2',
    month: 12,
    year: 2024,
    attendancePercentage: null,
    exceptionApproved: true,
  },
];

describe('DirectReportsAttendanceTab', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Mock API responses
    mockMonthlyAttendanceAPI.getByUserId = jest.fn().mockImplementation((userId: string) => {
      const userRecords = mockAttendanceRecords.filter(record => record.userId === userId);
      return Promise.resolve({ data: userRecords });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (directReports = mockDirectReports) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <DirectReportsAttendanceTab directReports={directReports} />
      </QueryClientProvider>
    );
  };

  it('should render empty state when no direct reports', () => {
    renderComponent([]);
    expect(screen.getByText(/no direct reports/i)).toBeInTheDocument();
  });

  it('should display header with attendance compliance title', () => {
    renderComponent();
    expect(screen.getByText(/attendance compliance/i)).toBeInTheDocument();
  });

  it('should display loading state initially', () => {
    // Delay the API response
    mockMonthlyAttendanceAPI.getByUserId = jest.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ data: [] }), 100))
    );

    renderComponent();
    expect(screen.getByText(/loading attendance data/i)).toBeInTheDocument();
  });

  it('should fetch attendance data for all direct reports', async () => {
    renderComponent();

    await waitFor(() => {
      expect(mockMonthlyAttendanceAPI.getByUserId).toHaveBeenCalledWith('user1');
      expect(mockMonthlyAttendanceAPI.getByUserId).toHaveBeenCalledWith('user2');
    });
  });

  it('should display attendance table with direct reports', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('should display attendance percentages correctly', async () => {
    renderComponent();

    await waitFor(() => {
      // Should display percentages for user1
      expect(screen.getByText(/45\.5%/i)).toBeInTheDocument();
      expect(screen.getByText(/50\.0%/i)).toBeInTheDocument();
    });
  });

  it('should display exception approved status', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/exception approved/i)).toBeInTheDocument();
    });
  });

  it('should display N/A for missing attendance data', async () => {
    // Mock records with null attendance percentage
    mockMonthlyAttendanceAPI.getByUserId = jest.fn().mockResolvedValue({
      data: [
        {
          id: 'att1',
          userId: 'user1',
          month: 11,
          year: 2024,
          attendancePercentage: null,
          exceptionApproved: false,
        },
      ],
    });

    renderComponent([mockDirectReports[0]]);

    await waitFor(() => {
      const naElements = screen.getAllByText(/n\/a/i);
      expect(naElements.length).toBeGreaterThan(0);
    });
  });

  it('should handle API errors gracefully', async () => {
    mockMonthlyAttendanceAPI.getByUserId = jest.fn().mockRejectedValue(new Error('API Error'));

    renderComponent();

    await waitFor(() => {
      // Component should still render, showing error state or empty data
      expect(screen.queryByText(/loading attendance data/i)).not.toBeInTheDocument();
    });
  });

  it('should show most recent 4 months in table headers', async () => {
    renderComponent();

    await waitFor(() => {
      // Should show month headers (e.g., "Dec 2024", "Nov 2024")
      const monthHeaders = screen.getAllByText(/\w{3} \d{4}/);
      expect(monthHeaders.length).toBeGreaterThan(0);
    });
  });

  it('should display search input', () => {
    renderComponent();
    expect(screen.getByPlaceholderText(/search by name or email/i)).toBeInTheDocument();
  });

  it('should show no attendance records message when no data available', async () => {
    mockMonthlyAttendanceAPI.getByUserId = jest.fn().mockResolvedValue({ data: [] });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/no attendance records found/i)).toBeInTheDocument();
    });
  });
});
