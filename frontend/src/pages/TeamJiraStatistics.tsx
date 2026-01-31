import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
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
    assignee?: string;
  }>;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalTickets: number;
    limit: number;
  };
  teamInfo: {
    teamId: string;
    teamName: string;
    memberCount: number;
    memberNames: Array<{
      id: string;
      name: string;
      email: string;
    }>;
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

const TeamJiraStatistics: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();

  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
  });

  // State for table sorting
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  // State for member selection
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
    new Set()
  );

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

  // Function to toggle line visibility
  const toggleLineVisibility = (lineKey: keyof typeof visibleLines) => {
    setVisibleLines(prev => ({
      ...prev,
      [lineKey]: !prev[lineKey],
    }));
  };

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
    const currentYear = now.getFullYear();
    const previousYear = currentYear - 1;

    return {
      startDate: `${previousYear}-01-01`,
      endDate: `${previousYear}-12-31`,
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

  // Set default date range to current quarter
  React.useEffect(() => {
    if (!dateRange.startDate && !dateRange.endDate) {
      const currentQuarter = getCurrentQuarter();
      setDateRange(currentQuarter);
    }
  }, [dateRange.startDate, dateRange.endDate]);

  // Member selection functions
  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(memberId)) {
        newSet.delete(memberId);
      } else {
        newSet.add(memberId);
      }
      return newSet;
    });
  };

  const selectAllMembers = () => {
    if (statistics?.teamInfo?.memberNames) {
      const allMemberIds = new Set(
        statistics.teamInfo.memberNames.map(member => member.id)
      );
      setSelectedMembers(allMemberIds);
    }
  };

  const deselectAllMembers = () => {
    setSelectedMembers(new Set());
  };

  // Sorting functions
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === 'asc'
    ) {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedTickets = () => {
    if (!statistics?.recentTickets || !sortConfig) {
      return statistics?.recentTickets || [];
    }

    return [...statistics.recentTickets].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.key) {
        case 'jiraId':
          aValue = a.jiraId;
          bValue = b.jiraId;
          break;
        case 'assignee':
          aValue = (a.assignee || '').toLowerCase();
          bValue = (b.assignee || '').toLowerCase();
          break;
        case 'priority':
          // Sort by priority order: High > Medium > Low
          const priorityOrder = { High: 3, Medium: 2, Low: 1 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          break;
        case 'originalEstimate':
          aValue = a.originalEstimate;
          bValue = b.originalEstimate;
          break;
        case 'refinementTime':
          aValue = a.refinementTime;
          bValue = b.refinementTime;
          break;
        case 'readyForDevelopmentTime':
          aValue = a.readyForDevelopmentTime;
          bValue = b.readyForDevelopmentTime;
          break;
        case 'inProgressTime':
          aValue = a.inProgressTime;
          bValue = b.inProgressTime;
          break;
        case 'blockedTime':
          aValue = a.blockedTime;
          bValue = b.blockedTime;
          break;
        case 'reviewTime':
          aValue = a.reviewTime;
          bValue = b.reviewTime;
          break;
        case 'promotionTime':
          aValue = a.promotionTime;
          bValue = b.promotionTime;
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  // Query for team statistics data
  const {
    data: statistics,
    isLoading,
    error,
    refetch,
  } = useQuery<JiraStatistics>({
    queryKey: [
      'team-jira-statistics',
      teamId,
      dateRange.startDate,
      dateRange.endDate,
      pagination.page,
      pagination.limit,
      Array.from(selectedMembers).sort().join(','),
    ],
    queryFn: async () => {
      const response = await jiraStatisticsAPI.getTeamStatistics(
        teamId!,
        {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          memberIds:
            selectedMembers.size > 0 ? Array.from(selectedMembers) : undefined,
        },
        {
          page: pagination.page,
          limit: pagination.limit,
        }
      );
      return response.data;
    },
    enabled: !!teamId && !!dateRange.startDate && !!dateRange.endDate,
  });

  // Query for quarterly trends data
  const {
    data: quarterlyTrendsData,
    isLoading: isLoadingTrends,
    error: trendsError,
  } = useQuery<QuarterlyTrendsData[]>({
    queryKey: ['team-jira-quarterly-trends', teamId],
    queryFn: async () => {
      const response = await jiraStatisticsAPI.getTeamMonthlyTrends(teamId!);
      return response.data;
    },
    enabled: !!teamId,
  });

  // Set default date range to last 365 days
  React.useEffect(() => {
    if (!dateRange.startDate && !dateRange.endDate) {
      const last365Days = getLast365Days();
      setDateRange(last365Days);
    }
  }, [dateRange.startDate, dateRange.endDate]);

  // Initialize selected members when team data is loaded
  React.useEffect(() => {
    if (statistics?.teamInfo?.memberNames && selectedMembers.size === 0) {
      const allMemberIds = new Set(
        statistics.teamInfo.memberNames.map(member => member.id)
      );
      setSelectedMembers(allMemberIds);
    }
  }, [statistics?.teamInfo?.memberNames, selectedMembers.size]);

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

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Helper function to format time in seconds to human readable format
  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes}m`;
    } else if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    } else {
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      return `${days}d ${hours}h`;
    }
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading team Jira statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='text-red-500 text-xl mb-4'>
            Error loading statistics
          </div>
          <button
            onClick={() => refetch()}
            className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='text-gray-500 text-xl'>No statistics available</div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center justify-between'>
            <div>
              <button
                onClick={() => navigate('/settings/teams')}
                className='text-blue-600 hover:text-blue-800 mb-2 flex items-center'
              >
                ← Back to Teams
              </button>
              <h1 className='text-3xl font-bold text-gray-900'>
                {statistics?.teamInfo?.teamName || 'Team'} Jira Statistics
              </h1>
              <p className='mt-2 text-gray-600'>
                Comprehensive Jira performance metrics for the team
              </p>
              {statistics.teamInfo && (
                <div className='mt-2'>
                  <div className='text-sm text-gray-500 mb-2'>
                    <span className='font-medium'>Team Members:</span>{' '}
                    {statistics.teamInfo.memberCount} members
                  </div>
                  <div className='flex flex-wrap items-center gap-2'>
                    <span className='text-xs text-gray-600 mr-2'>
                      Filter by member:
                    </span>
                    <div className='flex flex-wrap gap-1'>
                      {selectedMembers.size === 0 ? (
                        <span className='text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200'>
                          No members selected - showing all data
                        </span>
                      ) : (
                        statistics.teamInfo.memberNames.map(member => (
                          <button
                            key={member.id}
                            onClick={() => toggleMemberSelection(member.id)}
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                              selectedMembers.has(member.id)
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                            }`}
                            title={member.name}
                          >
                            <div
                              className={`w-2 h-2 rounded-full mr-1 ${
                                selectedMembers.has(member.id)
                                  ? 'bg-blue-500'
                                  : 'bg-gray-400'
                              }`}
                            />
                            {member.name
                              .split(' ')
                              .map(n => n[0])
                              .join('')
                              .toUpperCase()}
                          </button>
                        ))
                      )}
                    </div>
                    <div className='flex gap-1 ml-2'>
                      <button
                        onClick={selectAllMembers}
                        className='text-xs text-blue-600 hover:text-blue-800 underline'
                      >
                        Select All
                      </button>
                      <span className='text-xs text-gray-400'>|</span>
                      <button
                        onClick={deselectAllMembers}
                        className='text-xs text-blue-600 hover:text-blue-800 underline'
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Compact Filters */}
        <div className='bg-white shadow rounded-lg p-3 mb-8'>
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

        {/* Comprehensive Statistics Cards */}
        <div className='flex flex-wrap gap-2 mb-8'>
          {/* Resolved */}
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
                  {statistics.completedTickets}
                </div>
              </div>
            </div>
          </div>

          {/* Estimates */}
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
                  00M
                </div>
              </div>
            </div>
          </div>

          {/* Avg Refinement */}
          <div className='bg-white overflow-hidden shadow rounded-lg inline-block'>
            <div className='flex items-center'>
              <div className='flex-shrink-0'>
                <svg
                  className='h-3 w-3 text-purple-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
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

          {/* Avg Waiting */}
          <div className='bg-white overflow-hidden shadow rounded-lg inline-block'>
            <div className='flex items-center'>
              <div className='flex-shrink-0'>
                <svg
                  className='h-3 w-3 text-orange-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
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

          {/* Avg InProgress */}
          <div className='bg-white overflow-hidden shadow rounded-lg inline-block'>
            <div className='flex items-center'>
              <div className='flex-shrink-0'>
                <svg
                  className='h-3 w-3 text-blue-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
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

          {/* Avg Blocked */}
          <div className='bg-white overflow-hidden shadow rounded-lg inline-block'>
            <div className='flex items-center'>
              <div className='flex-shrink-0'>
                <svg
                  className='h-3 w-3 text-red-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
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

          {/* Avg Review */}
          <div className='bg-white overflow-hidden shadow rounded-lg inline-block'>
            <div className='flex items-center'>
              <div className='flex-shrink-0'>
                <svg
                  className='h-3 w-3 text-purple-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
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

          {/* Avg Resolution */}
          <div className='bg-white overflow-hidden shadow rounded-lg inline-block'>
            <div className='flex items-center px-2 py-1'>
              <div className='flex-shrink-0'>
                <svg
                  className='h-3 w-3 text-green-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
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

          {/* Avg Promotion */}
          <div className='bg-white overflow-hidden shadow rounded-lg inline-block'>
            <div className='flex items-center'>
              <div className='flex-shrink-0'>
                <svg
                  className='h-3 w-3 text-purple-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
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

        {/* Quarterly Trends Chart */}
        <div className='bg-white rounded-lg shadow p-6 mb-8'>
          <div className='mb-6'>
            <h3 className='text-lg font-bold text-gray-900 mb-1'>
              Quarterly Trends (Last 5 Complete Quarters)
            </h3>
            <p className='text-sm text-gray-600'>
              Average times for tickets completed each quarter
            </p>
          </div>

          {isLoadingTrends ? (
            <div className='flex justify-center items-center h-64'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
            </div>
          ) : trendsError ? (
            <div className='flex justify-center items-center h-64'>
              <div className='text-red-500'>Error loading trends data</div>
            </div>
          ) : quarterlyTrendsData && quarterlyTrendsData.length > 0 ? (
            <ResponsiveContainer width='100%' height={400}>
              <LineChart data={quarterlyTrendsData.slice(-5)}>
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
                    if (name === 'Resolved Tickets') {
                      return [value, name];
                    }
                    return [formatTime(value), name];
                  }}
                  labelFormatter={label => `Quarter: ${label}`}
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

          {/* Toggle Lines */}
          <div className='mt-6'>
            <h4 className='text-xs font-medium text-gray-700 mb-3'>
              Toggle Lines:
            </h4>
            <div className='flex flex-nowrap gap-3 overflow-x-auto'>
              <label className='flex items-center space-x-1 cursor-pointer flex-shrink-0'>
                <input
                  type='checkbox'
                  checked={visibleLines.refinement}
                  onChange={() => toggleLineVisibility('refinement')}
                  className='h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                />
                <div className='flex items-center space-x-1'>
                  <div className='w-3 h-0.5 bg-purple-500'></div>
                  <span className='text-xs text-gray-700'>Avg Refinement</span>
                </div>
              </label>

              <label className='flex items-center space-x-1 cursor-pointer flex-shrink-0'>
                <input
                  type='checkbox'
                  checked={visibleLines.waiting}
                  onChange={() => toggleLineVisibility('waiting')}
                  className='h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                />
                <div className='flex items-center space-x-1'>
                  <div className='w-3 h-0.5 bg-orange-500'></div>
                  <span className='text-xs text-gray-700'>Avg Waiting</span>
                </div>
              </label>

              <label className='flex items-center space-x-1 cursor-pointer flex-shrink-0'>
                <input
                  type='checkbox'
                  checked={visibleLines.inProgress}
                  onChange={() => toggleLineVisibility('inProgress')}
                  className='h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                />
                <div className='flex items-center space-x-1'>
                  <div className='w-3 h-0.5 bg-blue-500'></div>
                  <span className='text-xs text-gray-700'>Avg In Progress</span>
                </div>
              </label>

              <label className='flex items-center space-x-1 cursor-pointer flex-shrink-0'>
                <input
                  type='checkbox'
                  checked={visibleLines.blocked}
                  onChange={() => toggleLineVisibility('blocked')}
                  className='h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                />
                <div className='flex items-center space-x-1'>
                  <div className='w-3 h-0.5 bg-red-500'></div>
                  <span className='text-xs text-gray-700'>Avg Blocked</span>
                </div>
              </label>

              <label className='flex items-center space-x-1 cursor-pointer flex-shrink-0'>
                <input
                  type='checkbox'
                  checked={visibleLines.review}
                  onChange={() => toggleLineVisibility('review')}
                  className='h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                />
                <div className='flex items-center space-x-1'>
                  <div className='w-3 h-0.5 bg-indigo-500'></div>
                  <span className='text-xs text-gray-700'>Avg Review</span>
                </div>
              </label>

              <label className='flex items-center space-x-1 cursor-pointer flex-shrink-0'>
                <input
                  type='checkbox'
                  checked={visibleLines.resolution}
                  onChange={() => toggleLineVisibility('resolution')}
                  className='h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                />
                <div className='flex items-center space-x-1'>
                  <div className='w-3 h-0.5 bg-green-500'></div>
                  <span className='text-xs text-gray-700'>Avg Resolution</span>
                </div>
              </label>

              <label className='flex items-center space-x-1 cursor-pointer flex-shrink-0'>
                <input
                  type='checkbox'
                  checked={visibleLines.promotion}
                  onChange={() => toggleLineVisibility('promotion')}
                  className='h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                />
                <div className='flex items-center space-x-1'>
                  <div
                    className='w-3 h-0.5 bg-purple-500'
                    style={{ borderTop: '2px dashed' }}
                  ></div>
                  <span className='text-xs text-gray-700'>Avg Promotion</span>
                </div>
              </label>

              <label className='flex items-center space-x-1 cursor-pointer flex-shrink-0'>
                <input
                  type='checkbox'
                  checked={visibleLines.resolvedTickets}
                  onChange={() => toggleLineVisibility('resolvedTickets')}
                  className='h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                />
                <div className='flex items-center space-x-1'>
                  <div
                    className='w-3 h-0.5 bg-emerald-600'
                    style={{ borderTop: '2px dashed' }}
                  ></div>
                  <span className='text-xs text-gray-700'>
                    Resolved Tickets
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* All Tickets */}
        <div className='bg-white rounded-lg shadow p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-xl font-bold text-gray-900'>All Tickets</h3>
            <div className='flex items-center space-x-2 text-sm text-gray-600'>
              <span>Show</span>
              <select
                value={pagination.limit}
                onChange={e =>
                  setPagination(prev => ({
                    ...prev,
                    limit: parseInt(e.target.value),
                    page: 1,
                  }))
                }
                className='border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>per page</span>
              <span className='ml-4'>
                Showing{' '}
                {statistics
                  ? (statistics.pagination.currentPage - 1) *
                      statistics.pagination.limit +
                    1
                  : 0}{' '}
                to{' '}
                {statistics
                  ? Math.min(
                      statistics.pagination.currentPage *
                        statistics.pagination.limit,
                      statistics.pagination.totalTickets
                    )
                  : 0}
              </span>
              <span>of {statistics?.pagination.totalTickets || 0} tickets</span>
            </div>
          </div>
          {statistics.recentTickets.length === 0 ? (
            <div className='text-center py-8 text-gray-500'>
              No tickets found for the selected date range
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-gray-200'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th
                      className='px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16 cursor-pointer hover:bg-gray-100 select-none'
                      onClick={() => handleSort('jiraId')}
                    >
                      <div className='flex items-center space-x-1'>
                        <span>Ticket ID</span>
                        {sortConfig?.key === 'jiraId' && (
                          <span className='text-gray-400'>
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className='px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20 cursor-pointer hover:bg-gray-100 select-none'
                      onClick={() => handleSort('assignee')}
                    >
                      <div className='flex items-center space-x-1'>
                        <span>Assignee</span>
                        {sortConfig?.key === 'assignee' && (
                          <span className='text-gray-400'>
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className='px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12 cursor-pointer hover:bg-gray-100 select-none'
                      onClick={() => handleSort('priority')}
                    >
                      <div className='flex items-center space-x-1'>
                        <span>Priority</span>
                        {sortConfig?.key === 'priority' && (
                          <span className='text-gray-400'>
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className='px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16 cursor-pointer hover:bg-gray-100 select-none'
                      onClick={() => handleSort('status')}
                    >
                      <div className='flex items-center space-x-1'>
                        <span>Status</span>
                        {sortConfig?.key === 'status' && (
                          <span className='text-gray-400'>
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className='px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20 cursor-pointer hover:bg-gray-100 select-none'
                      onClick={() => handleSort('createDate')}
                    >
                      <div className='flex items-center space-x-1'>
                        <span>Created Date</span>
                        {sortConfig?.key === 'createDate' && (
                          <span className='text-gray-400'>
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className='px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20 cursor-pointer hover:bg-gray-100 select-none'
                      onClick={() => handleSort('endDate')}
                    >
                      <div className='flex items-center space-x-1'>
                        <span>End Date</span>
                        {sortConfig?.key === 'endDate' && (
                          <span className='text-gray-400'>
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className='px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-14 cursor-pointer hover:bg-gray-100 select-none'
                      onClick={() => handleSort('originalEstimate')}
                    >
                      <div className='flex items-center space-x-1'>
                        <span>Estimate</span>
                        {sortConfig?.key === 'originalEstimate' && (
                          <span className='text-gray-400'>
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className='px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-14 cursor-pointer hover:bg-gray-100 select-none'
                      onClick={() => handleSort('refinementTime')}
                    >
                      <div className='flex items-center space-x-1'>
                        <span>Refinement</span>
                        {sortConfig?.key === 'refinementTime' && (
                          <span className='text-gray-400'>
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className='px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-14 cursor-pointer hover:bg-gray-100 select-none'
                      onClick={() => handleSort('readyForDevelopmentTime')}
                    >
                      <div className='flex items-center space-x-1'>
                        <span>Waiting</span>
                        {sortConfig?.key === 'readyForDevelopmentTime' && (
                          <span className='text-gray-400'>
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className='px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-14 cursor-pointer hover:bg-gray-100 select-none'
                      onClick={() => handleSort('inProgressTime')}
                    >
                      <div className='flex items-center space-x-1'>
                        <span>In Progress</span>
                        {sortConfig?.key === 'inProgressTime' && (
                          <span className='text-gray-400'>
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className='px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-14 cursor-pointer hover:bg-gray-100 select-none'
                      onClick={() => handleSort('blockedTime')}
                    >
                      <div className='flex items-center space-x-1'>
                        <span>Blocked</span>
                        {sortConfig?.key === 'blockedTime' && (
                          <span className='text-gray-400'>
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className='px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-14 cursor-pointer hover:bg-gray-100 select-none'
                      onClick={() => handleSort('reviewTime')}
                    >
                      <div className='flex items-center space-x-1'>
                        <span>Review</span>
                        {sortConfig?.key === 'reviewTime' && (
                          <span className='text-gray-400'>
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className='px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-14 cursor-pointer hover:bg-gray-100 select-none'
                      onClick={() => handleSort('promotionTime')}
                    >
                      <div className='flex items-center space-x-1'>
                        <span>Promotion</span>
                        {sortConfig?.key === 'promotionTime' && (
                          <span className='text-gray-400'>
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className='px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32 cursor-pointer hover:bg-gray-100 select-none'
                      onClick={() => handleSort('title')}
                    >
                      <div className='flex items-center space-x-1'>
                        <span>Title</span>
                        {sortConfig?.key === 'title' && (
                          <span className='text-gray-400'>
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-gray-200'>
                  {getSortedTickets().map((ticket, index) => (
                    <tr key={index} className='hover:bg-gray-50'>
                      <td className='px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 w-16'>
                        <a
                          href={`https://nexontis.atlassian.net/browse/${ticket.jiraId}`}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-blue-600 hover:text-blue-800 hover:underline'
                        >
                          {ticket.jiraId}
                        </a>
                      </td>
                      <td className='px-3 py-4 whitespace-nowrap text-sm text-gray-500 w-20'>
                        {ticket.assignee || 'Unassigned'}
                      </td>
                      <td className='px-3 py-4 whitespace-nowrap text-sm text-gray-500 w-12'>
                        <span
                          className={`inline-flex px-1 py-1 text-xs font-semibold rounded-full ${
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
                      <td className='px-3 py-4 whitespace-nowrap text-sm text-gray-500 w-16'>
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
                      <td className='px-3 py-4 whitespace-nowrap text-sm text-gray-500 w-20'>
                        {ticket.createDate
                          ? new Date(ticket.createDate).toLocaleDateString()
                          : 'N/A'}
                      </td>
                      <td className='px-3 py-4 whitespace-nowrap text-sm text-gray-500 w-20'>
                        {ticket.endDate
                          ? new Date(ticket.endDate).toLocaleDateString()
                          : 'N/A'}
                      </td>
                      <td className='px-3 py-4 whitespace-nowrap text-sm text-gray-500 w-14'>
                        {ticket.originalEstimate > 0
                          ? formatTime(ticket.originalEstimate)
                          : 'NA'}
                      </td>
                      <td className='px-3 py-4 whitespace-nowrap text-sm text-gray-500 w-14'>
                        {formatTime(ticket.refinementTime)}
                      </td>
                      <td className='px-3 py-4 whitespace-nowrap text-sm text-gray-500 w-14'>
                        {formatTime(ticket.readyForDevelopmentTime)}
                      </td>
                      <td className='px-3 py-4 whitespace-nowrap text-sm text-gray-500 w-14'>
                        {formatTime(ticket.inProgressTime)}
                      </td>
                      <td className='px-3 py-4 whitespace-nowrap text-sm text-gray-500 w-14'>
                        {formatTime(ticket.blockedTime)}
                      </td>
                      <td className='px-3 py-4 whitespace-nowrap text-sm text-gray-500 w-14'>
                        {formatTime(ticket.reviewTime)}
                      </td>
                      <td className='px-3 py-4 whitespace-nowrap text-sm text-gray-500 w-14'>
                        {formatTime(ticket.promotionTime)}
                      </td>
                      <td className='px-3 py-4 text-sm text-gray-500 w-32 break-words'>
                        {ticket.title}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Navigation */}
          {statistics.pagination.totalPages > 1 && (
            <div className='mt-6 flex items-center justify-center'>
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
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamJiraStatistics;
