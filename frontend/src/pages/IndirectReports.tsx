import {
  ChevronDownIcon,
  ChevronRightIcon,
  EnvelopeIcon,
  UserGroupIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import UserDetailsPage from '../components/UserDetailsPage';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI } from '../services/api';
import DirectReportsFeedbackTab from '../components/DirectReportsFeedbackTab';
import DirectReportsAttendanceTab from '../components/DirectReportsAttendanceTab';

interface IndirectReport {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  position?: string;
  lastLoginAt?: string;
  createdAt: string;
  manager: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  userTeams?: Array<{
    id: string;
    joinedAt: string;
    isActive: boolean;
    team: {
      id: string;
      name: string;
      description?: string;
    };
  }>;
}

interface ManagerGroup {
  manager: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  reports: IndirectReport[];
}

// interface Feedback {
//   id: string;
//   sender: {
//     id: string;
//     firstName: string;
//     lastName: string;
//     role: string;
//   };
//   year: string;
//   quarter: string;
//   status: string;
//   createdAt: string;
//   appreciation?: string;
//   improvement?: string;
//   wouldWorkAgain?: boolean;
//   team?: {
//     id: string;
//     name: string;
//   };
//   isAnonymous?: boolean;
// }

const IndirectReports: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'list' | 'feedback' | 'attendance'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [_sortField] = useState<
    'name' | 'teams' | 'role' | 'manager' | 'lastLogin'
  >('name');
  const [_sortDirection] = useState<'asc' | 'desc'>('asc');
  const [expandedManagers, setExpandedManagers] = useState<Set<string>>(
    new Set()
  );
  const [selectedUser, setSelectedUser] = useState<IndirectReport | null>(null);

  const {
    data: indirectReports,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['indirect-reports', user?.id],
    queryFn: usersAPI.getIndirectReports,
    enabled: !!user?.id, // Only run query if user is available
  });

  // Group reports by manager
  const groupedReports = React.useMemo(() => {
    if (!indirectReports?.data) return [];

    const groups: { [key: string]: ManagerGroup } = {};

    indirectReports.data.forEach((report: IndirectReport) => {
      // Skip reports without manager information
      if (!report.manager || !report.manager.id) {
        console.warn('Report without manager information:', report);
        return;
      }

      const managerId = report.manager.id;
      if (!groups[managerId]) {
        groups[managerId] = {
          manager: report.manager,
          reports: [],
        };
      }
      groups[managerId].reports.push(report);
    });

    // Convert to array and sort
    return Object.values(groups).sort((a, b) => {
      const aName =
        `${a.manager.firstName} ${a.manager.lastName}`.toLowerCase();
      const bName =
        `${b.manager.firstName} ${b.manager.lastName}`.toLowerCase();
      return aName.localeCompare(bName);
    });
  }, [indirectReports?.data]);

  // Filter grouped reports based on search term
  const filteredGroupedReports = React.useMemo(() => {
    if (!searchTerm) return groupedReports;

    return groupedReports.filter(group => {
      // Check if manager matches search
      const managerName =
        `${group.manager.firstName} ${group.manager.lastName}`.toLowerCase();
      const managerEmail = group.manager.email.toLowerCase();

      if (
        managerName.includes(searchTerm.toLowerCase()) ||
        managerEmail.includes(searchTerm.toLowerCase())
      ) {
        return true;
      }

      // Check if any reports match search
      return group.reports.some(report => {
        const reportName =
          `${report.firstName} ${report.lastName}`.toLowerCase();
        const reportEmail = report.email.toLowerCase();
        const reportTeams = (
          report.userTeams
            ?.filter(ut => ut.isActive)
            .map(ut => ut.team.name)
            .join(' ') || ''
        ).toLowerCase();
        const reportPosition = (report.position || '').toLowerCase();

        return (
          reportName.includes(searchTerm.toLowerCase()) ||
          reportEmail.includes(searchTerm.toLowerCase()) ||
          reportTeams.includes(searchTerm.toLowerCase()) ||
          reportPosition.includes(searchTerm.toLowerCase())
        );
      });
    });
  }, [groupedReports, searchTerm]);

  const toggleManagerExpansion = (managerId: string) => {
    if (!managerId) return; // Skip if managerId is undefined

    setExpandedManagers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(managerId)) {
        newSet.delete(managerId);
      } else {
        newSet.add(managerId);
      }
      return newSet;
    });
  };

  const expandAllManagers = () => {
    const allManagerIds = new Set(
      filteredGroupedReports.map(group => group.manager?.id).filter(id => id) // Filter out undefined IDs
    );
    setExpandedManagers(allManagerIds);
  };

  const collapseAllManagers = () => {
    setExpandedManagers(new Set());
  };

  const handleUserClick = (user: IndirectReport) => {
    setSelectedUser(user);
  };

  const handleBackClick = () => {
    setSelectedUser(null);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800';
      case 'MANAGER':
        return 'bg-blue-100 text-blue-800';
      case 'EMPLOYEE':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Flatten all indirect reports for use in feedback and attendance tabs
  // This must be called before any early returns (React Hooks rule)
  const allIndirectReports = React.useMemo(() => {
    if (!indirectReports?.data) return [];
    return indirectReports.data;
  }, [indirectReports?.data]);

  if (isLoading) {
    return (
      <div className='p-6'>
        <div className='max-w-7xl mx-auto'>
          <div className='flex items-center justify-center h-64'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600'></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='p-6'>
        <div className='max-w-7xl mx-auto'>
          <div className='bg-red-50 border border-red-200 rounded-md p-4'>
            <div className='flex'>
              <div className='flex-shrink-0'>
                <UserGroupIcon className='h-5 w-5 text-red-400' />
              </div>
              <div className='ml-3'>
                <h3 className='text-sm font-medium text-red-800'>
                  Error loading indirect reports
                </h3>
                <div className='mt-2 text-sm text-red-700'>
                  <p>
                    Unable to load your indirect reports. Please try again
                    later.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If a user is selected, show their details
  if (selectedUser) {
    return (
      <UserDetailsPage
        user={selectedUser}
        onBack={handleBackClick}
        backButtonText='Back to Indirect Reports'
        showManagerInfo={true}
      />
    );
  }

  const totalReports = filteredGroupedReports.reduce(
    (sum, group) => sum + group.reports.length,
    0
  );

  return (
    <div id='indirect-reports-page' className='p-6'>
      <div className='w-full max-w-none'>
        {/* Header */}
        <div className='mb-4'>
          <h1
            id='indirect-reports-title'
            className='text-xl font-bold text-gray-900'
          >
            My Indirect Reports
          </h1>
          <p className='mt-1 text-sm text-gray-600'>
            Team members who report to you through any number of management
            levels in the hierarchy
          </p>
        </div>

        {/* Tab Navigation */}
        <div className='bg-white rounded-lg shadow mb-4'>
          <div className='border-b border-gray-200'>
            <nav className='-mb-px flex flex-wrap px-6' aria-label='Tabs'>
              <button
                onClick={() => setActiveTab('list')}
                className={`py-3 px-2 border-b-2 font-medium text-xs transition-colors text-center min-w-0 max-w-32 ${
                  activeTab === 'list'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Indirect Reports
              </button>
              <button
                onClick={() => setActiveTab('feedback')}
                className={`py-3 px-2 border-b-2 font-medium text-xs transition-colors text-center min-w-0 max-w-32 ${
                  activeTab === 'feedback'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Quarterly Feedback
              </button>
              <button
                onClick={() => setActiveTab('attendance')}
                className={`py-3 px-2 border-b-2 font-medium text-xs transition-colors text-center min-w-0 max-w-32 ${
                  activeTab === 'attendance'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Attendance Compliance
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className='bg-white rounded-lg shadow'>
          {activeTab === 'list' && (
            <div className='p-6'>
              {/* Search and Stats */}
              <div className='mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                <div className='flex-1 max-w-sm'>
                  <label htmlFor='search' className='sr-only'>
                    Search indirect reports
                  </label>
                  <div className='relative'>
                    <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                      <UserGroupIcon className='h-5 w-5 text-gray-400' />
                    </div>
                    <input
                      id='search'
                      type='text'
                      placeholder='Search by name, email, teams, manager...'
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className='block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                    />
                  </div>
                </div>

                <div className='flex items-center space-x-4'>
                  <div className='text-sm text-gray-500'>
                    {totalReports} reports across {filteredGroupedReports.length}{' '}
                    managers
                  </div>
                  <div className='flex space-x-2'>
                    <button
                      onClick={expandAllManagers}
                      className='px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors'
                    >
                      Expand All
                    </button>
                    <button
                      onClick={collapseAllManagers}
                      className='px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors'
                    >
                      Collapse All
                    </button>
                  </div>
                </div>
              </div>

              {/* Reports Table */}
              <div className='bg-white shadow overflow-hidden sm:rounded-md'>
          {filteredGroupedReports.length === 0 ? (
            <div className='text-center py-12'>
              <UserGroupIcon className='mx-auto h-12 w-12 text-gray-400' />
              <h3 className='mt-2 text-sm font-medium text-gray-900'>
                {searchTerm
                  ? 'No indirect reports found'
                  : 'No indirect reports'}
              </h3>
              <p className='mt-1 text-sm text-gray-500'>
                {searchTerm
                  ? 'Try adjusting your search terms.'
                  : "You don't have any indirect reports yet."}
              </p>
            </div>
          ) : (
            <div className='divide-y divide-gray-200'>
              {filteredGroupedReports.map(group => {
                const isExpanded = expandedManagers.has(
                  group.manager?.id || ''
                );

                return (
                  <div
                    key={group.manager?.id || 'unknown'}
                    className='bg-gray-50'
                  >
                    {/* Manager Header */}
                    <div
                      className='px-4 py-4 sm:px-6 cursor-pointer hover:bg-gray-100 transition-colors'
                      onClick={() =>
                        toggleManagerExpansion(group.manager?.id || '')
                      }
                    >
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center'>
                          <div className='flex-shrink-0'>
                            {isExpanded ? (
                              <ChevronDownIcon className='h-5 w-5 text-gray-400' />
                            ) : (
                              <ChevronRightIcon className='h-5 w-5 text-gray-400' />
                            )}
                          </div>
                          <div className='ml-3'>
                            <div className='flex items-center'>
                              <p className='text-sm font-medium text-gray-900'>
                                {group.manager
                                  ? `${group.manager.firstName} ${group.manager.lastName}`
                                  : 'Unknown Manager'}
                              </p>
                              <span className='ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                                MANAGER
                              </span>
                            </div>
                            <div className='flex items-center mt-1'>
                              <EnvelopeIcon className='h-4 w-4 text-gray-400 mr-1' />
                              <p className='text-sm text-gray-500'>
                                {group.manager?.email || 'No email available'}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className='flex items-center space-x-4'>
                          <div className='text-sm text-gray-500'>
                            {group.reports.length} direct report
                            {group.reports.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Reports List */}
                    {isExpanded && (
                      <div className='bg-white border-t border-gray-200'>
                        <ul className='divide-y divide-gray-200'>
                          {group.reports.map((report: IndirectReport) => (
                            <li key={report.id}>
                              <button
                                onClick={() => handleUserClick(report)}
                                className='w-full px-4 py-4 sm:px-6 ml-8 hover:bg-gray-50 transition-colors duration-150 text-left'
                              >
                                <div className='flex items-center justify-between'>
                                  <div className='flex items-center'>
                                    <div className='flex-shrink-0'>
                                      <img
                                        className='h-10 w-10 rounded-full'
                                        src={`https://ui-avatars.com/api/?name=${report.firstName}+${report.lastName}&background=random`}
                                        alt={`${report.firstName} ${report.lastName}`}
                                      />
                                    </div>
                                    <div className='ml-4'>
                                      <div className='flex items-center'>
                                        <p className='text-sm font-medium text-gray-900'>
                                          {report.firstName} {report.lastName}
                                        </p>
                                        <span
                                          className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
                                            report.role
                                          )}`}
                                        >
                                          {report.role}
                                        </span>
                                      </div>
                                      <div className='flex items-center mt-1'>
                                        <EnvelopeIcon className='h-4 w-4 text-gray-400 mr-1' />
                                        <p className='text-sm text-gray-500'>
                                          {report.email}
                                        </p>
                                      </div>
                                      {(report.userTeams?.filter(
                                        ut => ut.isActive
                                      ).length ||
                                        report.position) && (
                                        <div className='flex items-center mt-1'>
                                          <UserIcon className='h-4 w-4 text-gray-400 mr-1' />
                                          <p className='text-sm text-gray-500'>
                                            {report.position}
                                            {report.userTeams?.filter(
                                              ut => ut.isActive
                                            ).length &&
                                              report.position &&
                                              ' • '}
                                            {report.userTeams
                                              ?.filter(ut => ut.isActive)
                                              .map(ut => ut.team.name)
                                              .join(', ')}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className='flex items-center space-x-4'>
                                    {report.lastLoginAt && (
                                      <div className='text-sm text-gray-500'>
                                        Last login:{' '}
                                        {formatDate(report.lastLoginAt)}
                                      </div>
                                    )}
                                    <div className='text-sm text-gray-500'>
                                      Member since:{' '}
                                      {formatDate(report.createdAt)}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
              </div>
            </div>
          )}

          {activeTab === 'feedback' && (
            <div className='p-6'>
              <DirectReportsFeedbackTab directReports={allIndirectReports} />
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className='p-6'>
              <DirectReportsAttendanceTab directReports={allIndirectReports} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IndirectReports;
