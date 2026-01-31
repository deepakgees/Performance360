import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { monthlyAttendanceAPI } from '../services/api';
import { UserIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface DirectReport {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  position?: string;
}

interface DirectReportsAttendanceTabProps {
  directReports: DirectReport[];
}

interface MonthData {
  month: number;
  year: number;
  label: string;
}

interface AttendanceStatus {
  userId: string;
  name: string;
  email: string;
  months: {
    [key: string]: {
      attendancePercentage: number | null;
      exceptionApproved: boolean | null;
    };
  };
}

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const DirectReportsAttendanceTab: React.FC<DirectReportsAttendanceTabProps> = ({
  directReports,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Fetch attendance data for all direct reports in parallel using a single query
  const { data: allAttendanceData, isLoading, error } = useQuery({
    queryKey: ['direct-reports-attendance', directReports.map(r => r.id).join(',')],
    queryFn: async () => {
      const results = await Promise.all(
        directReports.map(async (report) => {
          try {
            const response = await monthlyAttendanceAPI.getByUserId(report.id);
            return {
              userId: report.id,
              records: response.data || [],
            };
          } catch (error) {
            // Return empty data if any request fails
            return {
              userId: report.id,
              records: [],
            };
          }
        })
      );
      return results;
    },
    enabled: directReports.length > 0,
  });

  // Find the 4 most recent months that have attendance records across all direct reports
  const availableMonths = useMemo(() => {
    if (!allAttendanceData) return [];

    // Collect all unique month/year combinations from all direct reports
    const monthSet = new Set<string>();
    allAttendanceData.forEach((data: any) => {
      data.records.forEach((record: any) => {
        const key = `${record.year}-${record.month}`;
        monthSet.add(key);
      });
    });

    // Convert to array and sort by year and month (most recent first)
    const months: MonthData[] = Array.from(monthSet)
      .map((key) => {
        const [year, month] = key.split('-').map(Number);
        return {
          month,
          year,
          label: `${MONTH_NAMES[month - 1]} ${year}`,
        };
      })
      .sort((a, b) => {
        if (b.year !== a.year) return b.year - a.year;
        return b.month - a.month;
      })
      .slice(0, 4); // Get top 4 most recent months

    return months;
  }, [allAttendanceData]);

  // Process attendance status for each direct report
  const attendanceStatuses = useMemo(() => {
    const statuses: AttendanceStatus[] = [];

    directReports.forEach((report) => {
      const data = allAttendanceData?.find((d: any) => d.userId === report.id);
      const records = data?.records || [];

      const monthsData: { [key: string]: { attendancePercentage: number | null; exceptionApproved: boolean | null } } = {};

      // For each available month, find the corresponding record
      availableMonths.forEach((monthInfo) => {
        const record = records.find(
          (r: any) => r.month === monthInfo.month && r.year === monthInfo.year
        );

        const key = `${monthInfo.year}-${monthInfo.month}`;
        if (record) {
          monthsData[key] = {
            attendancePercentage: record.attendancePercentage || null,
            exceptionApproved: record.exceptionApproved,
          };
        } else {
          monthsData[key] = {
            attendancePercentage: null,
            exceptionApproved: null,
          };
        }
      });

      statuses.push({
        userId: report.id,
        name: `${report.firstName} ${report.lastName}`,
        email: report.email,
        months: monthsData,
      });
    });

    return statuses;
  }, [directReports, allAttendanceData, availableMonths]);

  // Filter by search term
  const filteredStatuses = attendanceStatuses.filter(status =>
    `${status.name} ${status.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort filtered statuses
  const sortedStatuses = useMemo(() => {
    const sorted = [...filteredStatuses].sort((a, b) => {
      let aValue: any, bValue: any;

      if (sortField === 'name') {
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
      } else {
        // Sort by month column
        const monthDataA = a.months[sortField];
        const monthDataB = b.months[sortField];

        // Handle exception approved - put them at the end or beginning based on direction
        if (monthDataA?.exceptionApproved === true && monthDataB?.exceptionApproved !== true) {
          return sortDirection === 'asc' ? 1 : -1;
        }
        if (monthDataA?.exceptionApproved !== true && monthDataB?.exceptionApproved === true) {
          return sortDirection === 'asc' ? -1 : 1;
        }

        // Compare percentages (null values go to the end)
        const percentageA = monthDataA?.attendancePercentage ?? -1;
        const percentageB = monthDataB?.attendancePercentage ?? -1;

        if (percentageA === -1 && percentageB !== -1) {
          return sortDirection === 'asc' ? 1 : -1;
        }
        if (percentageA !== -1 && percentageB === -1) {
          return sortDirection === 'asc' ? -1 : 1;
        }

        aValue = percentageA;
        bValue = percentageB;
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

  const handleSort = (field: string) => {
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

  // Error state is already available from useQuery
  const hasError = !!error;

  if (directReports.length === 0) {
    return (
      <div className='text-center py-12'>
        <UserIcon className='mx-auto h-12 w-12 text-gray-400' />
        <h3 className='mt-2 text-sm font-medium text-gray-900'>No direct reports</h3>
        <p className='mt-1 text-sm text-gray-500'>
          You don't have any direct reports yet.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className='mb-4'>
        <h2 className='text-lg font-semibold text-gray-900'>
          Attendance Compliance
        </h2>
        <p className='mt-1 text-sm text-gray-600'>
          Track attendance compliance for your direct reports across the last 4 months
        </p>
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
          <span className='ml-3 text-sm text-gray-600'>Loading attendance data...</span>
        </div>
      )}

      {/* Error State */}
      {hasError && !isLoading && (
        <div className='bg-red-50 border border-red-200 rounded-md p-4 mb-4'>
          <div className='text-sm text-red-800'>
            Some error occurred while loading attendance data. Please try again later.
          </div>
        </div>
      )}

      {/* Attendance Table */}
      {!isLoading && (
        <div className='bg-white shadow overflow-hidden sm:rounded-md'>
          {sortedStatuses.length === 0 ? (
            <div className='text-center py-12'>
              <UserIcon className='mx-auto h-12 w-12 text-gray-400' />
              <h3 className='mt-2 text-sm font-medium text-gray-900'>
                {searchTerm ? 'No direct reports found' : 'No attendance data'}
              </h3>
              <p className='mt-1 text-sm text-gray-500'>
                {searchTerm
                  ? 'Try adjusting your search terms.'
                  : 'No attendance data available.'}
              </p>
            </div>
          ) : availableMonths.length === 0 ? (
            <div className='text-center py-12'>
              <UserIcon className='mx-auto h-12 w-12 text-gray-400' />
              <h3 className='mt-2 text-sm font-medium text-gray-900'>
                No attendance records found
              </h3>
              <p className='mt-1 text-sm text-gray-500'>
                No attendance records are available for any direct reports.
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
                    {availableMonths.map((monthInfo) => {
                      const monthKey = `${monthInfo.year}-${monthInfo.month}`;
                      return (
                        <th
                          key={monthKey}
                          className='px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
                          onClick={() => handleSort(monthKey)}
                        >
                          <div className='flex items-center justify-center space-x-1'>
                            <span>{monthInfo.label}</span>
                            <SortIcon field={monthKey} />
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-gray-200'>
                  {sortedStatuses.map((status) => (
                    <tr key={status.userId} className='hover:bg-gray-50'>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='text-sm font-medium text-gray-900'>{status.name}</div>
                        <div className='text-sm text-gray-500'>{status.email}</div>
                      </td>
                      {availableMonths.map((monthInfo) => {
                        const key = `${monthInfo.year}-${monthInfo.month}`;
                        const monthData = status.months[key];

                        return (
                          <td
                            key={key}
                            className='px-6 py-4 whitespace-nowrap text-center'
                          >
                            {monthData ? (
                              monthData.exceptionApproved === true ? (
                                <span className='text-sm font-medium text-blue-600'>
                                  Exception Approved
                                </span>
                              ) : monthData.attendancePercentage !== null ? (
                                <span
                                  className={`text-sm font-medium ${
                                    monthData.attendancePercentage >= 40
                                      ? 'text-green-600'
                                      : 'text-red-600'
                                  }`}
                                >
                                  {monthData.attendancePercentage.toFixed(1)}%
                                </span>
                              ) : (
                                <span className='text-sm text-gray-400'>N/A</span>
                              )
                            ) : (
                              <span className='text-sm text-gray-400'>No data</span>
                            )}
                          </td>
                        );
                      })}
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

export default DirectReportsAttendanceTab;
