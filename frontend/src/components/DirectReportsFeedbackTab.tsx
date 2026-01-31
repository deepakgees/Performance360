import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircleIcon, XCircleIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { assessmentAPI, feedbackAPI } from '../services/api';
import { getPreviousQuarter } from '../utils/dateUtils';
import { UserIcon } from '@heroicons/react/24/outline';

interface DirectReport {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  position?: string;
}

interface DirectReportsFeedbackTabProps {
  directReports: DirectReport[];
}

interface FeedbackStatus {
  userId: string;
  name: string;
  email: string;
  selfAssessment: boolean;
  colleagueFeedback: boolean;
  managerFeedback: boolean;
  allCompleted: boolean;
}

const DirectReportsFeedbackTab: React.FC<DirectReportsFeedbackTabProps> = ({
  directReports,
}) => {
  const previousQuarter = getPreviousQuarter();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'name' | 'selfAssessment' | 'colleagueFeedback' | 'managerFeedback' | 'status'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Fetch data for all direct reports in parallel using a single query
  const { data: allFeedbackData, isLoading, error } = useQuery({
    queryKey: ['direct-reports-feedback', directReports.map(r => r.id).join(','), previousQuarter.year, previousQuarter.quarter],
    queryFn: async () => {
      const results = await Promise.all(
        directReports.map(async (report) => {
          try {
            const [assessments, colleagueFeedback, managerFeedback] = await Promise.all([
              assessmentAPI.getByUserId(report.id),
              feedbackAPI.getColleagueSentByUser(report.id),
              feedbackAPI.getManagerReceivedByUser(report.id),
            ]);

            return {
              userId: report.id,
              assessments: assessments.data || [],
              colleagueFeedback: colleagueFeedback.data || [],
              managerFeedback: managerFeedback.data || [],
            };
          } catch (error) {
            // Return empty data if any request fails
            return {
              userId: report.id,
              assessments: [],
              colleagueFeedback: [],
              managerFeedback: [],
            };
          }
        })
      );
      return results;
    },
    enabled: directReports.length > 0,
  });

  // Process feedback status for each direct report
  const feedbackStatuses = useMemo(() => {
    const statuses: FeedbackStatus[] = [];

    directReports.forEach((report) => {
      const data = allFeedbackData?.find((d: any) => d.userId === report.id);

      if (!data) {
        statuses.push({
          userId: report.id,
          name: `${report.firstName} ${report.lastName}`,
          email: report.email,
          selfAssessment: false,
          colleagueFeedback: false,
          managerFeedback: false,
          allCompleted: false,
        });
        return;
      }

      // Check Self Assessment
      const hasSelfAssessment = data.assessments.some(
        (assessment: any) =>
          assessment.year === parseInt(previousQuarter.year) &&
          assessment.quarter === previousQuarter.quarter
      );

      // Check Colleague Feedback sent (at least one sent in the quarter)
      const hasColleagueFeedback = data.colleagueFeedback.some(
        (feedback: any) =>
          feedback.year === previousQuarter.year &&
          feedback.quarter === previousQuarter.quarter
      );

      // Check Manager Feedback received (at least one received in the quarter)
      const hasManagerFeedback = data.managerFeedback.some(
        (feedback: any) =>
          feedback.year === previousQuarter.year &&
          feedback.quarter === previousQuarter.quarter
      );

      const allCompleted = hasSelfAssessment && hasColleagueFeedback && hasManagerFeedback;

      statuses.push({
        userId: report.id,
        name: `${report.firstName} ${report.lastName}`,
        email: report.email,
        selfAssessment: hasSelfAssessment,
        colleagueFeedback: hasColleagueFeedback,
        managerFeedback: hasManagerFeedback,
        allCompleted,
      });
    });

    return statuses;
  }, [directReports, allFeedbackData, previousQuarter]);

  // Filter by search term
  const filteredStatuses = feedbackStatuses.filter(status =>
    `${status.name} ${status.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort filtered statuses
  const sortedStatuses = useMemo(() => {
    const sorted = [...filteredStatuses].sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'selfAssessment':
          aValue = a.selfAssessment ? 1 : 0;
          bValue = b.selfAssessment ? 1 : 0;
          break;
        case 'colleagueFeedback':
          aValue = a.colleagueFeedback ? 1 : 0;
          bValue = b.colleagueFeedback ? 1 : 0;
          break;
        case 'managerFeedback':
          aValue = a.managerFeedback ? 1 : 0;
          bValue = b.managerFeedback ? 1 : 0;
          break;
        case 'status':
          aValue = a.allCompleted ? 1 : 0;
          bValue = b.allCompleted ? 1 : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return sorted;
  }, [filteredStatuses, sortField, sortDirection]);

  const handleSort = (field: 'name' | 'selfAssessment' | 'colleagueFeedback' | 'managerFeedback' | 'status') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) {
      return <ChevronUpIcon className='h-4 w-4 text-gray-400 opacity-0' />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUpIcon className='h-4 w-4 text-indigo-600' />
    ) : (
      <ChevronDownIcon className='h-4 w-4 text-indigo-600' />
    );
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const total = feedbackStatuses.length;
    const completed = feedbackStatuses.filter(s => s.allCompleted).length;
    const selfAssessmentCount = feedbackStatuses.filter(s => s.selfAssessment).length;
    const colleagueFeedbackCount = feedbackStatuses.filter(s => s.colleagueFeedback).length;
    const managerFeedbackCount = feedbackStatuses.filter(s => s.managerFeedback).length;

    return {
      total,
      completed,
      selfAssessmentCount,
      colleagueFeedbackCount,
      managerFeedbackCount,
    };
  }, [feedbackStatuses]);

  // Error state is already available from useQuery
  const hasError = !!error;

  if (directReports.length === 0) {
    return (
      <div className='text-center py-12'>
        <UserIcon className='mx-auto h-12 w-12 text-gray-400' />
        <h3 className='mt-2 text-sm font-medium text-gray-900'>
          No direct reports
        </h3>
        <p className='mt-1 text-sm text-gray-500'>
          You don't have any direct reports yet.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header with Quarter Info */}
      <div className='mb-4'>
        <h2 className='text-lg font-semibold text-gray-900'>
          Quarterly Feedback Completion - {previousQuarter.quarter} {previousQuarter.year}
        </h2>
        <p className='mt-1 text-sm text-gray-600'>
          Track completion status of quarterly feedback for your direct reports
        </p>
      </div>

      {/* Summary Statistics */}
      <div className='mb-6 grid grid-cols-1 md:grid-cols-4 gap-4'>
        <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
          <div className='text-sm font-medium text-blue-800'>Total Reports</div>
          <div className='mt-1 text-2xl font-bold text-blue-900'>{stats.total}</div>
        </div>
        <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
          <div className='text-sm font-medium text-green-800'>All Completed</div>
          <div className='mt-1 text-2xl font-bold text-green-900'>
            {stats.completed} ({stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%)
          </div>
        </div>
        <div className='bg-purple-50 border border-purple-200 rounded-lg p-4'>
          <div className='text-sm font-medium text-purple-800'>Self Assessments</div>
          <div className='mt-1 text-2xl font-bold text-purple-900'>
            {stats.selfAssessmentCount} ({stats.total > 0 ? Math.round((stats.selfAssessmentCount / stats.total) * 100) : 0}%)
          </div>
        </div>
        <div className='bg-orange-50 border border-orange-200 rounded-lg p-4'>
          <div className='text-sm font-medium text-orange-800'>Feedback Provided</div>
          <div className='mt-1 text-2xl font-bold text-orange-900'>
            {stats.colleagueFeedbackCount} ({stats.total > 0 ? Math.round((stats.colleagueFeedbackCount / stats.total) * 100) : 0}%)
          </div>
        </div>
      </div>

      {/* Search */}
      <div className='mb-4'>
        <div className='relative'>
          <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
            <UserIcon className='h-5 w-5 text-gray-400' />
          </div>
          <input
            type='text'
            placeholder='Search by name or email...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className='block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className='flex items-center justify-center py-12'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600'></div>
          <span className='ml-3 text-sm text-gray-600'>Loading feedback data...</span>
        </div>
      )}

      {/* Error State */}
      {hasError && !isLoading && (
        <div className='bg-red-50 border border-red-200 rounded-md p-4 mb-4'>
          <div className='text-sm text-red-800'>
            Some error occurred while loading feedback data. Please try again later.
          </div>
        </div>
      )}

      {/* Feedback Table */}
      {!isLoading && (
        <div className='bg-white shadow overflow-hidden sm:rounded-md'>
          {sortedStatuses.length === 0 ? (
            <div className='text-center py-12'>
              <UserIcon className='mx-auto h-12 w-12 text-gray-400' />
              <h3 className='mt-2 text-sm font-medium text-gray-900'>
                {searchTerm ? 'No direct reports found' : 'No feedback data'}
              </h3>
              <p className='mt-1 text-sm text-gray-500'>
                {searchTerm
                  ? 'Try adjusting your search terms.'
                  : 'No feedback data available for the selected quarter.'}
              </p>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-gray-200'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th 
                      className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
                      onClick={() => handleSort('name')}
                    >
                      <div className='flex items-center space-x-1'>
                        <span>Name</span>
                        <SortIcon field='name' />
                      </div>
                    </th>
                    <th 
                      className='px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
                      onClick={() => handleSort('selfAssessment')}
                    >
                      <div className='flex items-center justify-center space-x-1'>
                        <span>Self Assessment</span>
                        <SortIcon field='selfAssessment' />
                      </div>
                    </th>
                    <th 
                      className='px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
                      onClick={() => handleSort('colleagueFeedback')}
                    >
                      <div className='flex items-center justify-center space-x-1'>
                        <span>Colleague Feedback</span>
                        <SortIcon field='colleagueFeedback' />
                      </div>
                    </th>
                    <th 
                      className='px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
                      onClick={() => handleSort('managerFeedback')}
                    >
                      <div className='flex items-center justify-center space-x-1'>
                        <span>Manager Feedback</span>
                        <SortIcon field='managerFeedback' />
                      </div>
                    </th>
                    <th 
                      className='px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
                      onClick={() => handleSort('status')}
                    >
                      <div className='flex items-center justify-center space-x-1'>
                        <span>Status</span>
                        <SortIcon field='status' />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-gray-200'>
                  {sortedStatuses.map((status) => (
                    <tr key={status.userId} className='hover:bg-gray-50'>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='text-sm font-medium text-gray-900'>{status.name}</div>
                        <div className='text-sm text-gray-500'>{status.email}</div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-center'>
                        {status.selfAssessment ? (
                          <CheckCircleIcon className='h-5 w-5 text-green-500 mx-auto' />
                        ) : (
                          <XCircleIcon className='h-5 w-5 text-red-500 mx-auto' />
                        )}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-center'>
                        {status.colleagueFeedback ? (
                          <CheckCircleIcon className='h-5 w-5 text-green-500 mx-auto' />
                        ) : (
                          <XCircleIcon className='h-5 w-5 text-red-500 mx-auto' />
                        )}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-center'>
                        {status.managerFeedback ? (
                          <CheckCircleIcon className='h-5 w-5 text-green-500 mx-auto' />
                        ) : (
                          <XCircleIcon className='h-5 w-5 text-red-500 mx-auto' />
                        )}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-center'>
                        {status.allCompleted ? (
                          <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                            Complete
                          </span>
                        ) : (
                          <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800'>
                            Incomplete
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DirectReportsFeedbackTab;
