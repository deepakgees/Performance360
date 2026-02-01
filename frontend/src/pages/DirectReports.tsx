import { EnvelopeIcon, UserIcon } from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import UserDetailsPage from '../components/UserDetailsPage';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI } from '../services/api';
import DirectReportsFeedbackTab from '../components/DirectReportsFeedbackTab';
import DirectReportsAttendanceTab from '../components/DirectReportsAttendanceTab';

interface DirectReport {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  position?: string;
  lastLoginAt?: string;
  createdAt: string;
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

const DirectReports: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'list' | 'feedback' | 'attendance'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField] = useState<
    'name' | 'teams' | 'role' | 'lastLogin'
  >('name');
  const [sortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedUser, setSelectedUser] = useState<DirectReport | null>(null);

  const {
    data: directReports,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['direct-reports', user?.id],
    queryFn: usersAPI.getDirectReports,
    enabled: !!user?.id,
  });

  const filteredReports =
    directReports?.data?.filter((report: DirectReport) =>
      `${report.firstName} ${report.lastName} ${report.email} ${
        report.userTeams
          ?.filter(ut => ut.isActive)
          .map(ut => ut.team.name)
          .join(' ') || ''
      } ${report.position || ''}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    ) || [];

  const sortedReports = [...filteredReports].sort(
    (a: DirectReport, b: DirectReport) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case 'name':
          aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
          bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
          break;
        case 'teams':
          aValue = (
            a.userTeams
              ?.filter(ut => ut.isActive)
              .map(ut => ut.team.name)
              .join(', ') || ''
          ).toLowerCase();
          bValue = (
            b.userTeams
              ?.filter(ut => ut.isActive)
              .map(ut => ut.team.name)
              .join(', ') || ''
          ).toLowerCase();
          break;
        case 'role':
          aValue = a.role.toLowerCase();
          bValue = b.role.toLowerCase();
          break;
        case 'lastLogin':
          aValue = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0;
          bValue = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0;
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
    }
  );

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

  const handleUserClick = (user: DirectReport) => {
    setSelectedUser(user);
  };

  const handleBackClick = () => {
    setSelectedUser(null);
  };

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
                <UserIcon className='h-5 w-5 text-red-400' />
              </div>
              <div className='ml-3'>
                <h3 className='text-sm font-medium text-red-800'>
                  Error loading direct reports
                </h3>
                <div className='mt-2 text-sm text-red-700'>
                  <p>
                    Unable to load your direct reports. Please try again later.
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
        backButtonText='Back to Direct Reports'
        showManagerInfo={false}
      />
    );
  }

  // Main direct reports list view
  return (
    <div id='direct-reports-page' className='p-4'>
      <div className='w-full max-w-none'>
        {/* Header */}
        <div className='mb-4'>
          <h1
            id='direct-reports-title'
            className='text-xl font-bold text-gray-900'
          >
            My Direct Reports
          </h1>
          <p className='mt-1 text-sm text-gray-600'>
            Team members who report directly to you
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
                Direct Reports
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
              <div className='mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                <div className='flex-1 max-w-sm'>
                  <label htmlFor='search' className='sr-only'>
                    Search direct reports
                  </label>
                  <div className='relative'>
                    <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                      <UserIcon className='h-5 w-5 text-gray-400' />
                    </div>
                    <input
                      id='search'
                      type='text'
                      placeholder='Search by name, email, teams...'
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className='block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                    />
                  </div>
                </div>

                <div className='flex items-center space-x-4'>
                  <div className='text-sm text-gray-500'>
                    {filteredReports.length} of {directReports?.data?.length || 0}{' '}
                    direct reports
                  </div>
                </div>
              </div>

              {/* Reports Table */}
              <div className='bg-white shadow overflow-hidden sm:rounded-md'>
                {sortedReports.length === 0 ? (
                  <div className='text-center py-12'>
                    <UserIcon className='mx-auto h-12 w-12 text-gray-400' />
                    <h3 className='mt-2 text-sm font-medium text-gray-900'>
                      {searchTerm ? 'No direct reports found' : 'No direct reports'}
                    </h3>
                    <p className='mt-1 text-sm text-gray-500'>
                      {searchTerm
                        ? 'Try adjusting your search terms.'
                        : "You don't have any direct reports yet."}
                    </p>
                  </div>
                ) : (
                  <ul className='divide-y divide-gray-200'>
                    {sortedReports.map((report: DirectReport) => (
                      <li key={report.id}>
                        <button
                          onClick={() => handleUserClick(report)}
                          className='w-full px-4 py-3 sm:px-6 hover:bg-gray-50 transition-colors duration-150'
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
                              <div className='ml-4 flex-1'>
                                <div className='flex items-center space-x-3'>
                                  <p className='text-sm font-medium text-gray-900'>
                                    {report.firstName} {report.lastName}
                                  </p>
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
                                      report.role
                                    )}`}
                                  >
                                    {report.role}
                                  </span>
                                  <div className='flex items-center text-gray-500'>
                                    <EnvelopeIcon className='h-3 w-3 mr-1' />
                                    <span className='text-sm'>{report.email}</span>
                                  </div>
                                  {(report.userTeams?.filter(ut => ut.isActive)
                                    .length ||
                                    report.position) && (
                                    <div className='flex items-center text-gray-500'>
                                      <UserIcon className='h-3 w-3 mr-1' />
                                      <span className='text-sm'>
                                        {report.position}
                                        {report.userTeams?.filter(ut => ut.isActive)
                                          .length &&
                                          report.position &&
                                          ' • '}
                                        {report.userTeams
                                          ?.filter(ut => ut.isActive)
                                          .map(ut => ut.team.name)
                                          .join(', ')}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className='flex items-center space-x-4'>
                              {report.lastLoginAt && (
                                <div className='text-sm text-gray-500'>
                                  Last login: {formatDate(report.lastLoginAt)}
                                </div>
                              )}
                              <div className='text-sm text-gray-500'>
                                Member since: {formatDate(report.createdAt)}
                              </div>
                            </div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {activeTab === 'feedback' && (
            <div className='p-6'>
              <DirectReportsFeedbackTab directReports={directReports?.data || []} />
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className='p-6'>
              <DirectReportsAttendanceTab directReports={directReports?.data || []} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DirectReports;
