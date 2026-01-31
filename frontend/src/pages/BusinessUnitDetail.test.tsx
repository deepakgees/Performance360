/**
 * Unit tests for BusinessUnitDetail component
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import BusinessUnitDetail from './BusinessUnitDetail';
import { businessUnitsAPI } from '../services/api';

// Mock the API service
jest.mock('../services/api');

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ businessUnitId: 'test-bu-id' }),
  useNavigate: () => mockNavigate,
}));

const mockBusinessUnitsAPI = businessUnitsAPI as jest.Mocked<typeof businessUnitsAPI>;

// Mock data
const mockBusinessUnit = {
  id: 'test-bu-id',
  name: 'Test Business Unit',
  description: 'Test Description',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  userBusinessUnits: [
    {
      id: 'ubu1',
      joinedAt: '2024-01-01T00:00:00Z',
      isActive: true,
      user: {
        id: 'user1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        role: 'EMPLOYEE',
        position: 'Developer',
      },
    },
    {
      id: 'ubu2',
      joinedAt: '2024-01-02T00:00:00Z',
      isActive: true,
      user: {
        id: 'user2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        role: 'EMPLOYEE',
        position: 'Designer',
      },
    },
  ],
};

const mockStatistics = {
  businessUnit: {
    id: 'test-bu-id',
    name: 'Test Business Unit',
    description: 'Test Description',
    totalMembers: 2,
  },
  attendance: {
    complianceRate: 85.5,
    trends: [
      {
        month: 'Jan',
        year: 2024,
        monthNumber: 1,
        complianceRate: 80.0,
        compliantMembers: 2,
        totalMembersWithData: 2,
      },
      {
        month: 'Feb',
        year: 2024,
        monthNumber: 2,
        complianceRate: 90.0,
        compliantMembers: 2,
        totalMembersWithData: 2,
      },
    ],
  },
  feedbackCompletion: {
    selfAssessment: {
      completed: 2,
      notCompleted: 0,
    },
    managerFeedback: {
      completed: 1,
      notCompleted: 1,
    },
    colleagueFeedback: {
      provided: 2,
      notProvided: 0,
    },
  },
  feedbackRatings: {
    averageSelfAssessment: 4.5,
    averageManagerRating: 4.0,
    averageColleagueRating: 4.2,
  },
};

describe('BusinessUnitDetail', () => {
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
    mockBusinessUnitsAPI.getById = jest.fn().mockResolvedValue({
      data: mockBusinessUnit,
    });

    mockBusinessUnitsAPI.getStatistics = jest.fn().mockResolvedValue({
      data: mockStatistics,
    });

    mockBusinessUnitsAPI.update = jest.fn().mockResolvedValue({});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <BusinessUnitDetail />
        </QueryClientProvider>
      </BrowserRouter>
    );
  };

  it('should display loading state initially', () => {
    // Delay the API response
    mockBusinessUnitsAPI.getById = jest.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ data: mockBusinessUnit }), 100))
    );

    renderComponent();
    expect(screen.getByText(/loading business unit/i)).toBeInTheDocument();
  });

  it('should fetch business unit data', async () => {
    renderComponent();

    await waitFor(() => {
      expect(mockBusinessUnitsAPI.getById).toHaveBeenCalledWith('test-bu-id');
    });
  });

  it('should fetch statistics data', async () => {
    renderComponent();

    await waitFor(() => {
      expect(mockBusinessUnitsAPI.getStatistics).toHaveBeenCalledWith('test-bu-id');
    });
  });

  it('should display business unit name and description', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test Business Unit')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
    });
  });

  it('should display member count', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/2 member/i)).toBeInTheDocument();
    });
  });

  it('should display members tab content', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Members')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('should display attendance statistics tab', async () => {
    renderComponent();

    await waitFor(() => {
      const attendanceTab = screen.getByText('Attendance Statistics');
      fireEvent.click(attendanceTab);
      
      expect(screen.getByText(/compliance rate/i)).toBeInTheDocument();
    });
  });

  it('should display feedback completion tab', async () => {
    renderComponent();

    await waitFor(() => {
      const feedbackTab = screen.getByText('Previous Qtr Feedback Completion');
      fireEvent.click(feedbackTab);
      
      expect(screen.getByText(/feedback completion/i)).toBeInTheDocument();
    });
  });

  it('should display feedback overview tab', async () => {
    renderComponent();

    await waitFor(() => {
      const overviewTab = screen.getByText('Previous Quarter Feedback Overview');
      fireEvent.click(overviewTab);
      
      expect(screen.getByText(/average feedback ratings/i)).toBeInTheDocument();
    });
  });

  it('should allow editing business unit details', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test Business Unit')).toBeInTheDocument();
    });

    const editButton = screen.getByText('Edit Details');
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Business Unit')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
    });
  });

  it('should handle edit save', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test Business Unit')).toBeInTheDocument();
    });

    const editButton = screen.getByText('Edit Details');
    fireEvent.click(editButton);

    await waitFor(() => {
      const nameInput = screen.getByDisplayValue('Test Business Unit');
      fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
    });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockBusinessUnitsAPI.update).toHaveBeenCalledWith('test-bu-id', {
        name: 'Updated Name',
        description: 'Test Description',
      });
    });
  });

  it('should handle edit cancel', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test Business Unit')).toBeInTheDocument();
    });

    const editButton = screen.getByText('Edit Details');
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Business Unit')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.getByText('Test Business Unit')).toBeInTheDocument();
      expect(screen.queryByDisplayValue('Test Business Unit')).not.toBeInTheDocument();
    });
  });

  it('should display error message when business unit not found', async () => {
    mockBusinessUnitsAPI.getById = jest.fn().mockResolvedValue({
      data: null,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/business unit not found/i)).toBeInTheDocument();
    });
  });

  it('should display back button', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/back to business units/i)).toBeInTheDocument();
    });
  });
});
