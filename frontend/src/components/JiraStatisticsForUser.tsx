import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { jiraStatisticsAPI } from '../services/api';

interface JiraStatistics {
  totalTickets: number;
  completedTickets: number;
  inProgressTickets: number;
  averageTicketResolutionTime: number;
  totalTimeSpent: number;
  ticketsByPriority: {
    high: number;
    medium: number;
    low: number;
  };
  ticketsByStatus: {
    inProgress: number;
    blocked: number;
    review: number;
    refinement: number;
    readyForDevelopment: number;
    promotion: number;
  };
  recentTickets: Array<{
    jiraId: string;
    title: string;
    priority: string;
    status: string;
    createDate: string;
    endDate?: string;
    originalEstimate: number;
    refinementTime: number;
    readyForDevelopmentTime: number;
    inProgressTime: number;
    blockedTime: number;
    reviewTime: number;
    promotionTime: number;
  }>;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalTickets: number;
    limit: number;
  };
}

interface QuarterlyTrendsData {
  quarter: string;
  refinement: number;
  waiting: number;
  inProgress: number;
  blocked: number;
  review: number;
  resolution: number;
  promotion: number;
  resolvedTickets: number;
}

interface JiraStatisticsForUserProps {
  userId: string;
}

const JiraStatisticsForUser: React.FC<JiraStatisticsForUserProps> = ({
  userId,
}) => {
  const { user: currentUser } = useAuth();
  const isViewingOwnData = currentUser?.id === userId;
  
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });

  // Set default date range to last 365 days
  React.useEffect(() => {
    if (!dateRange.startDate && !dateRange.endDate) {
      const last365Days = getLast365Days();
      setDateRange(last365Days);
    }
  }, [dateRange.startDate, dateRange.endDate]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
  });

  // State for tracking which lines are visible in the graph
  const [visibleLines, setVisibleLines] = useState({
    refinement: false,
    waiting: false,
    inProgress: false,
    blocked: false,
    review: false,
    resolution: false,
    promotion: false,
    resolvedTickets: true,
  });

  // State for view toggle (quarterly vs monthly)
  const [viewType, setViewType] = useState<'quarterly' | 'monthly'>(
    'quarterly'
  );

  // Helper functions to calculate date ranges
  const getCurrentQuarter = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Determine quarter
    const quarter = Math.floor(currentMonth / 3);
    const quarterStartMonth = quarter * 3;

    const startDate = new Date(currentYear, quarterStartMonth, 1);
    const endDate = new Date(currentYear, quarterStartMonth + 3, 0); // Last day of the quarter

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  };

  const getPreviousQuarter = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Determine previous quarter
    let quarter = Math.floor(currentMonth / 3) - 1;
    let year = currentYear;

    if (quarter < 0) {
      quarter = 3; // Q4 of previous year
      year = currentYear - 1;
    }

    const quarterStartMonth = quarter * 3;

    const startDate = new Date(year, quarterStartMonth, 1);
    const endDate = new Date(year, quarterStartMonth + 3, 0);

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  };

  const getPreviousYear = () => {
    const now = new Date();
    const previousYear = now.getFullYear() - 1;

    const startDate = new Date(previousYear, 0, 1); // January 1st
    const endDate = new Date(previousYear, 11, 31); // December 31st

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  };

  const getLast30Days = () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return {
      startDate: thirtyDaysAgo.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0],
    };
  };

  const getLast90Days = () => {
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    return {
      startDate: ninetyDaysAgo.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0],
    };
  };

  const getLast168Days = () => {
    const now = new Date();
    const oneHundredSixtyEightDaysAgo = new Date(
      now.getTime() - 168 * 24 * 60 * 60 * 1000
    );

    return {
      startDate: oneHundredSixtyEightDaysAgo.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0],
    };
  };

  const getLast365Days = () => {
    const now = new Date();
    const threeHundredSixtyFiveDaysAgo = new Date(
      now.getTime() - 365 * 24 * 60 * 60 * 1000
    );

    return {
      startDate: threeHundredSixtyFiveDaysAgo.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0],
    };
  };

  const handleQuickFilter = (
    filterType:
      | 'currentQuarter'
      | 'previousQuarter'
      | 'previousYear'
      | 'last30Days'
      | 'last90Days'
      | 'last168Days'
      | 'last365Days'
  ) => {
    let newDateRange;

    switch (filterType) {
      case 'currentQuarter':
        newDateRange = getCurrentQuarter();
        break;
      case 'previousQuarter':
        newDateRange = getPreviousQuarter();
        break;
      case 'previousYear':
        newDateRange = getPreviousYear();
        break;
      case 'last30Days':
        newDateRange = getLast30Days();
        break;
      case 'last90Days':
        newDateRange = getLast90Days();
        break;
      case 'last168Days':
        newDateRange = getLast168Days();
        break;
      case 'last365Days':
        newDateRange = getLast365Days();
        break;
      default:
        return;
    }

    setDateRange(newDateRange);
  };

  const {
    data: statistics,
    isLoading,
    error,
    refetch,
  } = useQuery<JiraStatistics>({
    queryKey: [
      'jira-statistics',
      userId,
      isViewingOwnData ? 'my-statistics' : 'user-statistics',
      dateRange.startDate,
      dateRange.endDate,
      pagination.page,
      pagination.limit,
    ],
    queryFn: async () => {
      // Use getMyStatistics for current user, getUserStatistics for others
      if (isViewingOwnData) {
        // getMyStatistics doesn't support date filtering, so we get all data
        const response = await jiraStatisticsAPI.getMyStatistics();
        return response.data;
      } else {
        const response = await jiraStatisticsAPI.getUserStatistics(
          userId,
          {
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
          },
          {
            page: pagination.page,
            limit: pagination.limit,
          }
        );
        return response.data;
      }
    },
    // Enable query: for own data, just need userId; for others, need date range too
    enabled: !!userId && (isViewingOwnData || (!!dateRange.startDate && !!dateRange.endDate)),
  });

  // Query for quarterly trends data
  const {
    data: quarterlyTrendsData,
    isLoading: isLoadingTrends,
    error: trendsError,
  } = useQuery<QuarterlyTrendsData[]>({
    queryKey: ['jira-quarterly-trends', userId],
    queryFn: async () => {
      const response = await jiraStatisticsAPI.getMonthlyTrends(userId);
      return response.data;
    },
    enabled: !!userId && viewType === 'quarterly',
  });

  // Query for monthly trends data
  const {
    data: monthlyTrendsData,
    isLoading: isLoadingMonthlyTrends,
    error: monthlyTrendsError,
  } = useQuery<QuarterlyTrendsData[]>({
    queryKey: ['jira-monthly-trends', userId],
    queryFn: async () => {
      const response = await jiraStatisticsAPI.getMonthlyTrendsData(userId);
      return response.data;
    },
    enabled: !!userId && viewType === 'monthly',
  });

  const handleDateRangeChange = (
    field: 'startDate' | 'endDate',
    value: string
  ) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleApplyDateRange = () => {
    if (dateRange.startDate && dateRange.endDate) {
      // Reset to first page when applying new date range
      setPagination(prev => ({ ...prev, page: 1 }));
      refetch();
    }
  };

  // Handle legend click to toggle line visibility
  const handleLegendClick = (dataKey: string) => {
    setVisibleLines(prev => ({
      ...prev,
      [dataKey]: !prev[dataKey as keyof typeof prev],
    }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit: number) => {
    setPagination(_prev => ({ page: 1, limit: newLimit }));
  };

  const formatTime = (seconds: number) => {
    const days = Math.floor(seconds / 86400); // 86400 seconds = 24 hours
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    let result = '';
    if (days > 0) {
      result += `${days}D `;
    }
    if (hours > 0 || days > 0) {
      result += `${hours.toString().padStart(2, '0')}H `;
    }
    result += `${minutes.toString().padStart(2, '0')}M`;

    return result;
  };

  // const formatDate = (dateString: string) => {
  //   return new Date(dateString).toLocaleDateString();
  // };

  if (!dateRange.startDate || !dateRange.endDate) {
    return (
      <div className='space-y-4'>
        {/* Compact Filters */}
        <div className='bg-white shadow rounded-lg p-3'>
          <div className='flex flex-wrap items-center gap-2 mb-3'>
            <span className='text-sm font-medium text-gray-700 mr-2'>
              Quick Filters:
            </span>
            <button
              onClick={() => handleQuickFilter('currentQuarter')}
              className='px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200'
            >
              Current Quarter
            </button>
            <button
              onClick={() => handleQuickFilter('previousQuarter')}
              className='px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200'
            >
              Previous Quarter
            </button>
            <button
              onClick={() => handleQuickFilter('previousYear')}
              className='px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200'
            >
              Previous Year
            </button>
            <button
              onClick={() => handleQuickFilter('last30Days')}
              className='px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200'
            >
              Last 30 Days
            </button>
            <button
              onClick={() => handleQuickFilter('last90Days')}
              className='px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200'
            >
              Last 90 Days
            </button>
            <button
              onClick={() => handleQuickFilter('last168Days')}
              className='px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200'
            >
              Last 168 Days
            </button>
            <button
              onClick={() => handleQuickFilter('last365Days')}
              className='px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200'
            >
              Last 365 Days
            </button>
          </div>

          <div className='flex flex-wrap items-center gap-2'>
            <span className='text-sm font-medium text-gray-700 mr-2'>
              Custom Range:
            </span>
            <input
              type='date'
              value={dateRange.startDate}
              onChange={e => handleDateRangeChange('startDate', e.target.value)}
              className='px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500'
              placeholder='Start Date'
            />
            <span className='text-xs text-gray-500'>to</span>
            <input
              type='date'
              value={dateRange.endDate}
              onChange={e => handleDateRangeChange('endDate', e.target.value)}
              className='px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500'
              placeholder='End Date'
            />
            <button
              onClick={handleApplyDateRange}
              disabled={!dateRange.startDate || !dateRange.endDate}
              className='px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='bg-red-50 border border-red-200 rounded-md p-4'>
        <div className='flex'>
          <div className='flex-shrink-0'>
            <svg
              className='h-5 w-5 text-red-400'
              viewBox='0 0 20 20'
              fill='currentColor'
            >
              <path
                fillRule='evenodd'
                d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                clipRule='evenodd'
              />
            </svg>
          </div>
          <div className='ml-3'>
            <h3 className='text-sm font-medium text-red-800'>
              Error loading Jira statistics
            </h3>
            <div className='mt-2 text-sm text-red-700'>
              {error instanceof Error
                ? error.message
                : 'An unexpected error occurred'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className='bg-yellow-50 border border-yellow-200 rounded-md p-4'>
        <div className='flex'>
          <div className='flex-shrink-0'>
            <svg
              className='h-5 w-5 text-yellow-400'
              viewBox='0 0 20 20'
              fill='currentColor'
            >
              <path
                fillRule='evenodd'
                d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                clipRule='evenodd'
              />
            </svg>
          </div>
          <div className='ml-3'>
            <h3 className='text-sm font-medium text-yellow-800'>
              No Jira statistics available
            </h3>
            <div className='mt-2 text-sm text-yellow-700'>
              No Jira tickets found for this user in the selected time range.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Compact Filters */}
      <div className='bg-white shadow rounded-lg p-3'>
        <div className='flex flex-wrap items-center gap-2 mb-3'>
          <span className='text-sm font-medium text-gray-700 mr-2'>
            Quick Filters:
          </span>
          <button
            onClick={() => handleQuickFilter('currentQuarter')}
            className='px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200'
          >
            Current Quarter
          </button>
          <button
            onClick={() => handleQuickFilter('previousQuarter')}
            className='px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200'
          >
            Previous Quarter
          </button>
          <button
            onClick={() => handleQuickFilter('previousYear')}
            className='px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200'
          >
            Previous Year
          </button>
          <button
            onClick={() => handleQuickFilter('last30Days')}
            className='px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200'
          >
            Last 30 Days
          </button>
          <button
            onClick={() => handleQuickFilter('last90Days')}
            className='px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200'
          >
            Last 90 Days
          </button>
          <button
            onClick={() => handleQuickFilter('last168Days')}
            className='px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200'
          >
            Last 168 Days
          </button>
          <button
            onClick={() => handleQuickFilter('last365Days')}
            className='px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200'
          >
            Last 365 Days
          </button>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <span className='text-sm font-medium text-gray-700 mr-2'>
            Custom Range:
          </span>
          <input
            type='date'
            value={dateRange.startDate}
            onChange={e => handleDateRangeChange('startDate', e.target.value)}
            className='px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500'
            placeholder='Start Date'
          />
          <span className='text-xs text-gray-500'>to</span>
          <input
            type='date'
            value={dateRange.endDate}
            onChange={e => handleDateRangeChange('endDate', e.target.value)}
            className='px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500'
            placeholder='End Date'
          />
          <button
            onClick={handleApplyDateRange}
            disabled={!dateRange.startDate || !dateRange.endDate}
            className='px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            Apply
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className='flex flex-wrap gap-2'>
        {/* Resolved Tickets */}
        <div className='bg-white overflow-hidden shadow rounded-lg inline-block'>
          <div className='flex items-center px-2 py-1'>
            <div className='flex-shrink-0'>
              <svg
                className='h-3 w-3 text-green-600'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
            </div>
            <div className='ml-1'>
              <div className='text-xs font-medium text-gray-500 leading-tight'>
                Resolved
              </div>
              <div className='text-sm font-medium text-gray-900 leading-tight'>
                {statistics.totalTickets}
              </div>
            </div>
          </div>
        </div>

        {/* Sum of Estimates */}
        <div className='bg-white overflow-hidden shadow rounded-lg inline-block'>
          <div className='flex items-center px-2 py-1'>
            <div className='flex-shrink-0'>
              <svg
                className='h-3 w-3 text-blue-600'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1'
                />
              </svg>
            </div>
            <div className='ml-1'>
              <div className='text-xs font-medium text-gray-500 leading-tight'>
                Estimates
              </div>
              <div className='text-sm font-medium text-gray-900 leading-tight'>
                {formatTime(statistics.totalTimeSpent)}
              </div>
            </div>
          </div>
        </div>

        {/* Average Refinement Time */}
        <div className='bg-white overflow-hidden shadow rounded-lg inline-block'>
          <div className='flex items-center px-2 py-1'>
            <div className='flex-shrink-0'>
              <svg
                className='h-3 w-3 text-purple-600'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z'
                />
              </svg>
            </div>
            <div className='ml-1'>
              <div className='text-xs font-medium text-gray-500 leading-tight'>
                Avg Refinement
              </div>
              <div className='text-sm font-medium text-gray-900 leading-tight'>
                {formatTime(statistics.ticketsByStatus.refinement)}
              </div>
            </div>
          </div>
        </div>

        {/* Average Waiting For Pickup Time */}
        <div className='bg-white overflow-hidden shadow rounded-lg inline-block'>
          <div className='flex items-center px-2 py-1'>
            <div className='flex-shrink-0'>
              <svg
                className='h-3 w-3 text-yellow-600'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
            </div>
            <div className='ml-1'>
              <div className='text-xs font-medium text-gray-500 leading-tight'>
                Avg Waiting
              </div>
              <div className='text-sm font-medium text-gray-900 leading-tight'>
                {formatTime(statistics.ticketsByStatus.readyForDevelopment)}
              </div>
            </div>
          </div>
        </div>

        {/* Average InProgress Time */}
        <div className='bg-white overflow-hidden shadow rounded-lg inline-block'>
          <div className='flex items-center px-2 py-1'>
            <div className='flex-shrink-0'>
              <svg
                className='h-3 w-3 text-blue-600'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M13 10V3L4 14h7v7l9-11h-7z'
                />
              </svg>
            </div>
            <div className='ml-1'>
              <div className='text-xs font-medium text-gray-500 leading-tight'>
                Avg InProgress
              </div>
              <div className='text-sm font-medium text-gray-900 leading-tight'>
                {formatTime(statistics.ticketsByStatus.inProgress)}
              </div>
            </div>
          </div>
        </div>

        {/* Average Blocked Time */}
        <div className='bg-white overflow-hidden shadow rounded-lg inline-block'>
          <div className='flex items-center px-2 py-1'>
            <div className='flex-shrink-0'>
              <svg
                className='h-3 w-3 text-red-600'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                />
              </svg>
            </div>
            <div className='ml-1'>
              <div className='text-xs font-medium text-gray-500 leading-tight'>
                Avg Blocked
              </div>
              <div className='text-sm font-medium text-gray-900 leading-tight'>
                {formatTime(statistics.ticketsByStatus.blocked)}
              </div>
            </div>
          </div>
        </div>

        {/* Average Review Time */}
        <div className='bg-white overflow-hidden shadow rounded-lg inline-block'>
          <div className='flex items-center px-2 py-1'>
            <div className='flex-shrink-0'>
              <svg
                className='h-3 w-3 text-indigo-600'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
                />
              </svg>
            </div>
            <div className='ml-1'>
              <div className='text-xs font-medium text-gray-500 leading-tight'>
                Avg Review
              </div>
              <div className='text-sm font-medium text-gray-900 leading-tight'>
                {formatTime(statistics.ticketsByStatus.review)}
              </div>
            </div>
          </div>
        </div>

        {/* Average Ticket Resolution Time */}
        <div className='bg-white overflow-hidden shadow rounded-lg inline-block'>
          <div className='flex items-center px-2 py-1'>
            <div className='flex-shrink-0'>
              <svg
                className='h-3 w-3 text-green-600'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M7 11l5-5m0 0l5 5m-5-5v12'
                />
              </svg>
            </div>
            <div className='ml-1'>
              <div className='text-xs font-medium text-gray-500 leading-tight'>
                Avg Resolution
              </div>
              <div className='text-sm font-medium text-gray-900 leading-tight'>
                {formatTime(statistics.averageTicketResolutionTime)}
              </div>
            </div>
          </div>
        </div>

        {/* Average Promotion Time */}
        <div className='bg-white overflow-hidden shadow rounded-lg inline-block'>
          <div className='flex items-center px-2 py-1'>
            <div className='flex-shrink-0'>
              <svg
                className='h-3 w-3 text-purple-600'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M13 10V3L4 14h7v7l9-11h-7z'
                />
              </svg>
            </div>
            <div className='ml-1'>
              <div className='text-xs font-medium text-gray-500 leading-tight'>
                Avg Promotion
              </div>
              <div className='text-sm font-medium text-gray-900 leading-tight'>
                {formatTime(statistics.ticketsByStatus.promotion)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trends Graph */}
      <div className='bg-white shadow rounded-lg'>
        <div className='px-6 py-4 border-b border-gray-200'>
          <div className='flex justify-between items-center'>
            <div>
              <h3 className='text-lg font-medium text-gray-900'>
                {viewType === 'quarterly'
                  ? 'Quarterly Trends (Last 5 Quarters)'
                  : 'Monthly Trends (Last 5 Months)'}
              </h3>
              <p className='text-sm text-gray-500 mt-1'>
                Average times for tickets completed each{' '}
                {viewType === 'quarterly' ? 'quarter' : 'month'}
              </p>
            </div>
            <div className='flex items-center space-x-2'>
              <span className='text-sm font-medium text-gray-700'>View:</span>
              <div className='flex bg-gray-100 rounded-lg p-1'>
                <button
                  onClick={() => setViewType('quarterly')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    viewType === 'quarterly'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Quarterly
                </button>
                <button
                  onClick={() => setViewType('monthly')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    viewType === 'monthly'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Monthly
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className='p-6'>
          {isLoadingTrends || isLoadingMonthlyTrends ? (
            <div className='flex justify-center items-center h-64'>
              <div className='text-gray-500'>Loading trends data...</div>
            </div>
          ) : trendsError || monthlyTrendsError ? (
            <div className='flex justify-center items-center h-64'>
              <div className='text-red-500'>Error loading trends data</div>
            </div>
          ) : (viewType === 'quarterly' &&
              quarterlyTrendsData &&
              quarterlyTrendsData.length > 0) ||
            (viewType === 'monthly' &&
              monthlyTrendsData &&
              monthlyTrendsData.length > 0) ? (
            <ResponsiveContainer width='100%' height={400}>
              <LineChart
                data={
                  viewType === 'quarterly'
                    ? quarterlyTrendsData
                    : monthlyTrendsData
                }
              >
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis
                  dataKey='quarter'
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor='end'
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    return [value, name];
                  }}
                  labelFormatter={label =>
                    `${
                      viewType === 'quarterly' ? 'Quarter' : 'Month'
                    }: ${label}`
                  }
                />
                {visibleLines.refinement && (
                  <Line
                    type='monotone'
                    dataKey='refinement'
                    stroke='#8B5CF6'
                    strokeWidth={2}
                    name='Avg Refinement'
                    dot={{ r: 4 }}
                  />
                )}
                {visibleLines.waiting && (
                  <Line
                    type='monotone'
                    dataKey='waiting'
                    stroke='#F59E0B'
                    strokeWidth={2}
                    name='Avg Waiting'
                    dot={{ r: 4 }}
                  />
                )}
                {visibleLines.inProgress && (
                  <Line
                    type='monotone'
                    dataKey='inProgress'
                    stroke='#3B82F6'
                    strokeWidth={2}
                    name='Avg In Progress'
                    dot={{ r: 4 }}
                  />
                )}
                {visibleLines.blocked && (
                  <Line
                    type='monotone'
                    dataKey='blocked'
                    stroke='#EF4444'
                    strokeWidth={2}
                    name='Avg Blocked'
                    dot={{ r: 4 }}
                  />
                )}
                {visibleLines.review && (
                  <Line
                    type='monotone'
                    dataKey='review'
                    stroke='#6366F1'
                    strokeWidth={2}
                    name='Avg Review'
                    dot={{ r: 4 }}
                  />
                )}
                {visibleLines.resolution && (
                  <Line
                    type='monotone'
                    dataKey='resolution'
                    stroke='#10B981'
                    strokeWidth={2}
                    name='Avg Resolution'
                    dot={{ r: 4 }}
                  />
                )}
                {visibleLines.promotion && (
                  <Line
                    type='monotone'
                    dataKey='promotion'
                    stroke='#8B5CF6'
                    strokeWidth={2}
                    name='Avg Promotion'
                    dot={{ r: 4 }}
                    strokeDasharray='5 5'
                  />
                )}
                {visibleLines.resolvedTickets && (
                  <Line
                    type='monotone'
                    dataKey='resolvedTickets'
                    stroke='#059669'
                    strokeWidth={2}
                    name='Resolved Tickets'
                    dot={{ r: 4 }}
                    strokeDasharray='10 5'
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className='flex justify-center items-center h-64'>
              <div className='text-gray-500'>No trends data available</div>
            </div>
          )}

          {/* Custom Legend with Checkboxes */}
          {((viewType === 'quarterly' &&
            quarterlyTrendsData &&
            quarterlyTrendsData.length > 0) ||
            (viewType === 'monthly' &&
              monthlyTrendsData &&
              monthlyTrendsData.length > 0)) && (
            <div className='mt-4 border-t border-gray-200 pt-4'>
              <div className='text-sm font-medium text-gray-700 mb-3'>
                Toggle Lines:
              </div>
              <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3'>
                {/* Refinement */}
                <label className='flex items-center space-x-2 cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={visibleLines.refinement}
                    onChange={() => handleLegendClick('refinement')}
                    className='rounded border-gray-300 text-purple-600 focus:ring-purple-500'
                  />
                  <div className='flex items-center space-x-1'>
                    <div className='w-3 h-0.5 bg-purple-600'></div>
                    <span className='text-xs text-gray-600'>
                      Avg Refinement
                    </span>
                  </div>
                </label>

                {/* Waiting */}
                <label className='flex items-center space-x-2 cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={visibleLines.waiting}
                    onChange={() => handleLegendClick('waiting')}
                    className='rounded border-gray-300 text-orange-600 focus:ring-orange-500'
                  />
                  <div className='flex items-center space-x-1'>
                    <div className='w-3 h-0.5 bg-orange-500'></div>
                    <span className='text-xs text-gray-600'>Avg Waiting</span>
                  </div>
                </label>

                {/* In Progress */}
                <label className='flex items-center space-x-2 cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={visibleLines.inProgress}
                    onChange={() => handleLegendClick('inProgress')}
                    className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                  />
                  <div className='flex items-center space-x-1'>
                    <div className='w-3 h-0.5 bg-blue-500'></div>
                    <span className='text-xs text-gray-600'>
                      Avg In Progress
                    </span>
                  </div>
                </label>

                {/* Blocked */}
                <label className='flex items-center space-x-2 cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={visibleLines.blocked}
                    onChange={() => handleLegendClick('blocked')}
                    className='rounded border-gray-300 text-red-600 focus:ring-red-500'
                  />
                  <div className='flex items-center space-x-1'>
                    <div className='w-3 h-0.5 bg-red-500'></div>
                    <span className='text-xs text-gray-600'>Avg Blocked</span>
                  </div>
                </label>

                {/* Review */}
                <label className='flex items-center space-x-2 cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={visibleLines.review}
                    onChange={() => handleLegendClick('review')}
                    className='rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
                  />
                  <div className='flex items-center space-x-1'>
                    <div className='w-3 h-0.5 bg-indigo-500'></div>
                    <span className='text-xs text-gray-600'>Avg Review</span>
                  </div>
                </label>

                {/* Resolution */}
                <label className='flex items-center space-x-2 cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={visibleLines.resolution}
                    onChange={() => handleLegendClick('resolution')}
                    className='rounded border-gray-300 text-green-600 focus:ring-green-500'
                  />
                  <div className='flex items-center space-x-1'>
                    <div className='w-3 h-0.5 bg-green-500'></div>
                    <span className='text-xs text-gray-600'>
                      Avg Resolution
                    </span>
                  </div>
                </label>

                {/* Promotion */}
                <label className='flex items-center space-x-2 cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={visibleLines.promotion}
                    onChange={() => handleLegendClick('promotion')}
                    className='rounded border-gray-300 text-purple-600 focus:ring-purple-500'
                  />
                  <div className='flex items-center space-x-1'>
                    <div className='w-3 h-0.5 bg-purple-600 border-dashed border-t-2 border-purple-600'></div>
                    <span className='text-xs text-gray-600'>Avg Promotion</span>
                  </div>
                </label>

                {/* Resolved Tickets */}
                <label className='flex items-center space-x-2 cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={visibleLines.resolvedTickets}
                    onChange={() => handleLegendClick('resolvedTickets')}
                    className='rounded border-gray-300 text-emerald-600 focus:ring-emerald-500'
                  />
                  <div className='flex items-center space-x-1'>
                    <div className='w-3 h-0.5 bg-emerald-600 border-dashed border-t-2 border-emerald-600'></div>
                    <span className='text-xs text-gray-600'>
                      Resolved Tickets
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Tickets */}
      <div className='bg-white shadow rounded-lg'>
        <div className='px-6 py-4 border-b border-gray-200'>
          <div className='flex justify-between items-center'>
            <h3 className='text-lg font-medium text-gray-900'>All Tickets</h3>
            {statistics.pagination && (
              <div className='flex items-center space-x-4'>
                <div className='flex items-center space-x-2'>
                  <label className='text-sm text-gray-700'>Show:</label>
                  <select
                    value={pagination.limit}
                    onChange={e => handleLimitChange(Number(e.target.value))}
                    className='border border-gray-300 rounded px-2 py-1 text-sm'
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                  </select>
                  <span className='text-sm text-gray-500'>per page</span>
                </div>
                <div className='text-sm text-gray-500'>
                  Showing{' '}
                  {(statistics.pagination.currentPage - 1) *
                    statistics.pagination.limit +
                    1}{' '}
                  to{' '}
                  {Math.min(
                    statistics.pagination.currentPage *
                      statistics.pagination.limit,
                    statistics.pagination.totalTickets
                  )}{' '}
                  of {statistics.pagination.totalTickets} tickets
                </div>
              </div>
            )}
          </div>
        </div>
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20'>
                  Ticket ID
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16'>
                  Priority
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20'>
                  Status
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20'>
                  Created Date
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20'>
                  End Date
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20'>
                  Estimate
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20'>
                  Refinement
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20'>
                  Waiting / ToDo
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20'>
                  In Progress
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20'>
                  Blocked
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20'>
                  Review
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20'>
                  Promotion
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32'>
                  Title
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {statistics.recentTickets.map(ticket => (
                <tr key={ticket.jiraId}>
                  <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 w-20'>
                    <a
                      href={`https://nexontis.atlassian.net/browse/${ticket.jiraId}`}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-blue-600 hover:text-blue-800 hover:underline'
                    >
                      {ticket.jiraId}
                    </a>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 w-16'>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        ticket.priority === 'High'
                          ? 'bg-red-100 text-red-800'
                          : ticket.priority === 'Medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {ticket.priority}
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 w-20'>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        ticket.status === 'Done' ||
                        ticket.status === 'Completed' ||
                        ticket.status === 'Closed'
                          ? 'bg-green-100 text-green-800'
                          : ticket.status === 'Live' ||
                            ticket.status === 'In Progress' ||
                            ticket.status === 'Active'
                          ? 'bg-blue-100 text-blue-800'
                          : ticket.status === 'Cancelled' ||
                            ticket.status === 'Rejected'
                          ? 'bg-red-100 text-red-800'
                          : ticket.status === 'To Do' ||
                            ticket.status === 'Open'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 w-20'>
                    {ticket.createDate
                      ? new Date(ticket.createDate).toLocaleDateString()
                      : 'N/A'}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 w-20'>
                    {ticket.endDate
                      ? new Date(ticket.endDate).toLocaleDateString()
                      : 'N/A'}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 w-20'>
                    {ticket.originalEstimate > 0
                      ? formatTime(ticket.originalEstimate)
                      : 'NA'}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 w-20'>
                    {formatTime(ticket.refinementTime)}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 w-20'>
                    {formatTime(ticket.readyForDevelopmentTime)}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 w-20'>
                    {formatTime(ticket.inProgressTime)}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 w-20'>
                    {formatTime(ticket.blockedTime)}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 w-20'>
                    {formatTime(ticket.reviewTime)}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 w-20'>
                    {formatTime(ticket.promotionTime)}
                  </td>
                  <td className='px-6 py-4 text-sm text-gray-500 w-32 truncate'>
                    {ticket.title}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {statistics.pagination && statistics.pagination.totalPages > 1 && (
          <div className='px-6 py-4 border-t border-gray-200'>
            <div className='flex items-center justify-center'>
              <div className='flex space-x-2'>
                <button
                  onClick={() =>
                    handlePageChange(statistics.pagination.currentPage - 1)
                  }
                  disabled={statistics.pagination.currentPage === 1}
                  className='px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  Previous
                </button>
                <span className='px-3 py-1 text-sm text-gray-700'>
                  Page {statistics.pagination.currentPage} of{' '}
                  {statistics.pagination.totalPages}
                </span>
                <button
                  onClick={() =>
                    handlePageChange(statistics.pagination.currentPage + 1)
                  }
                  disabled={
                    statistics.pagination.currentPage ===
                    statistics.pagination.totalPages
                  }
                  className='px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JiraStatisticsForUser;
