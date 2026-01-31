import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { monthlyAttendanceAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

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

interface AttendanceData {
  month: number;
  year: number;
  monthLabel: string;
  monthlyCompliant: boolean;
  weeklyCompliant: boolean | null;
  exceptionApproved: boolean | null;
  attendancePercentage: number | null;
  workingDays: number;
  presentInOffice: number;
  leavesAvailed: number;
  leaveNotificationsInTeamsChannel: number;
  reasonForNonCompliance: string | null;
  recordId: string | null;
}

interface AttendanceComplianceProps {
  userId?: string; // Optional: if provided, show attendance for this user; otherwise show for current user
}

const AttendanceCompliance: React.FC<AttendanceComplianceProps> = ({ userId }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const targetUserId = userId || user?.id || '';
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingComment, setEditingComment] = useState<{ recordId: string; monthLabel: string } | null>(null);
  const [commentText, setCommentText] = useState('');
  const [savingComment, setSavingComment] = useState(false);

  // Check if current user is a manager/admin and has access to view/edit comments
  const isManager = user?.role === 'MANAGER' || user?.role === 'ADMIN';
  const isViewingOwnData = !userId || userId === user?.id;
  const canEditComments = isManager && !isViewingOwnData;

  const {
    data: attendanceRecords,
    isLoading,
  } = useQuery({
    queryKey: ['user-attendance', targetUserId],
    queryFn: () => monthlyAttendanceAPI.getByUserId(targetUserId),
    enabled: !!targetUserId,
  });

  useEffect(() => {
    if (attendanceRecords?.data) {
      const now = new Date();
      const currentMonth = now.getMonth() + 1; // 1-12
      const currentYear = now.getFullYear();

      // Get last 12 months excluding current month
      const months: AttendanceData[] = [];
      for (let i = 1; i <= 12; i++) {
        let month = currentMonth - i;
        let year = currentYear;

        if (month <= 0) {
          month += 12;
          year -= 1;
        }

        // Find attendance record for this month/year
        const record = attendanceRecords.data.find(
          (r: any) => r.month === month && r.year === year
        );

        const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;
        
        let monthlyCompliant = false;
        let weeklyCompliant: boolean | null = null;
        let exceptionApproved: boolean | null = null;
        let attendancePercentage: number | null = null;
        let workingDays = 0;
        let presentInOffice = 0;
        let leavesAvailed = 0;
        let leaveNotificationsInTeamsChannel = 0;
        let reasonForNonCompliance: string | null = null;
        let recordId: string | null = null;

        if (record) {
          attendancePercentage = record.attendancePercentage || null;
          workingDays = record.workingDays || 0;
          presentInOffice = record.presentInOffice || 0;
          leavesAvailed = record.leavesAvailed || 0;
          leaveNotificationsInTeamsChannel = record.leaveNotificationsInTeamsChannel || 0;
          weeklyCompliant = record.weeklyCompliance;
          exceptionApproved = record.exceptionApproved;
          reasonForNonCompliance = record.reasonForNonCompliance || null;
          recordId = record.id || null;

          // Monthly compliance: 40% or more = compliant
          if (attendancePercentage !== null) {
            monthlyCompliant = attendancePercentage >= 40;
          }
        }

        months.push({
          month,
          year,
          monthLabel,
          monthlyCompliant,
          weeklyCompliant,
          exceptionApproved,
          attendancePercentage,
          workingDays,
          presentInOffice,
          leavesAvailed,
          leaveNotificationsInTeamsChannel,
          reasonForNonCompliance,
          recordId,
        });
      }

      // Reverse to show oldest to newest
      setAttendanceData(months.reverse());
      setLoading(false);
    } else if (!isLoading) {
      setLoading(false);
    }
  }, [attendanceRecords, isLoading]);

  if (loading || isLoading) {
    return (
      <div className='flex justify-center items-center py-12'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600'></div>
        <span className='ml-2 text-gray-600'>Loading attendance data...</span>
      </div>
    );
  }

  // Prepare chart data
  const chartData = attendanceData.map(data => ({
    month: data.monthLabel,
    attendancePercentage: data.attendancePercentage || 0,
    monthlyCompliant: data.monthlyCompliant,
    weeklyCompliant: data.weeklyCompliant,
    exceptionApproved: data.exceptionApproved,
  }));

  // Function to determine bar color based on rules
  const getBarColor = (data: AttendanceData): string => {
    // Rule 1: Exception approved = Grey
    if (data.exceptionApproved === true) {
      return '#9ca3af'; // Grey
    }
    
    // Rule 2: No exception approved + attendance < 40% = Red
    if (data.attendancePercentage !== null && data.attendancePercentage < 40) {
      return '#ef4444'; // Red
    }
    
    // Rule 3: No exception approved + attendance >= 40% + weekly compliance != "no" = Green
    if (data.attendancePercentage !== null && data.attendancePercentage >= 40 && data.weeklyCompliant !== false) {
      return '#10b981'; // Green
    }
    
    // Rule 4: No exception approved + attendance >= 40% + weekly compliance == "no" = Blue
    if (data.attendancePercentage !== null && data.attendancePercentage >= 40 && data.weeklyCompliant === false) {
      return '#3b82f6'; // Blue
    }
    
    // Default: Grey for no data
    return '#9ca3af'; // Grey
  };

  // Calculate summary statistics
  const totalMonths = attendanceData.length;
  const monthlyCompliantCount = attendanceData.filter(d => d.monthlyCompliant).length;
  const weeklyCompliantCount = attendanceData.filter(d => d.weeklyCompliant === true).length;
  const weeklyNonCompliantCount = attendanceData.filter(d => d.weeklyCompliant === false).length;
  const weeklyNotSetCount = attendanceData.filter(d => d.weeklyCompliant === null).length;

  const handleEditComment = (recordId: string, monthLabel: string, currentReason: string | null) => {
    setEditingComment({ recordId, monthLabel });
    setCommentText(currentReason || '');
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setCommentText('');
  };

  const handleSaveComment = async (recordId: string) => {
    if (!recordId) return;
    
    setSavingComment(true);
    try {
      await monthlyAttendanceAPI.updateComment(recordId, commentText.trim() || null);
      // Invalidate and refetch the attendance data
      await queryClient.invalidateQueries({ queryKey: ['user-attendance', targetUserId] });
      setEditingComment(null);
      setCommentText('');
    } catch (error: any) {
      console.error('Error saving comment:', error);
      alert(error.response?.data?.error || 'Failed to save comment');
    } finally {
      setSavingComment(false);
    }
  };

  return (
    <div className='space-y-6'>
      {/* Chart */}
      <div className='bg-white rounded-lg shadow p-6'>
        <h2 className='text-lg font-semibold text-gray-900 mb-4'>
          Attendance Compliance Over Last 12 Months
        </h2>
        <div className='mb-4'>
          <div className='text-sm text-gray-600 mb-3'>
            <p>
              <strong>Reference Line:</strong> The orange dashed line at 40% indicates the minimum threshold for monthly compliance.
            </p>
          </div>
          <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
            <h3 className='text-sm font-semibold text-gray-900 mb-3'>Color Legend:</h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3 text-sm'>
              <div className='flex items-center space-x-2'>
                <div className='w-6 h-6 rounded bg-gray-400 border border-gray-300'></div>
                <span className='text-gray-700'>Exception Approved</span>
              </div>
              <div className='flex items-center space-x-2'>
                <div className='w-6 h-6 rounded bg-red-500 border border-gray-300'></div>
                <span className='text-gray-700'>Monthly Compliance = No & Weekly Compliance = No</span>
              </div>
              <div className='flex items-center space-x-2'>
                <div className='w-6 h-6 rounded bg-green-500 border border-gray-300'></div>
                <span className='text-gray-700'>Monthly Compliance = Yes & Weekly Compliance = Yes</span>
              </div>
              <div className='flex items-center space-x-2'>
                <div className='w-6 h-6 rounded bg-blue-500 border border-gray-300'></div>
                <span className='text-gray-700'>Monthly Compliance = Yes & Weekly Compliance = No</span>
              </div>
            </div>
          </div>
        </div>
        <ResponsiveContainer width='100%' height={400}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis
              dataKey='month'
              angle={-45}
              textAnchor='end'
              height={80}
              interval={0}
            />
            <YAxis
              domain={[0, 100]}
              label={{ value: 'Attendance %', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = attendanceData.find(d => d.monthLabel === label);
                  if (!data) return null;

                  return (
                    <div className='bg-white p-3 border border-gray-200 rounded shadow-lg'>
                      <p className='font-semibold mb-2'>{label}</p>
                      <p className='text-sm'>
                        <span className='font-medium'>Attendance:</span>{' '}
                        {data.attendancePercentage !== null ? (
                          <>
                            <span
                              className={
                                data.monthlyCompliant ? 'text-green-600' : 'text-red-600'
                              }
                            >
                              {data.attendancePercentage.toFixed(1)}%
                            </span>
                            <span className='text-gray-500 ml-1'>
                              ({data.monthlyCompliant ? 'Compliant' : 'Non-Compliant'})
                            </span>
                          </>
                        ) : (
                          <span className='text-gray-500'>N/A</span>
                        )}
                      </p>
                      <p className='text-sm'>
                        <span className='font-medium'>Weekly:</span>{' '}
                        {data.weeklyCompliant === true ? (
                          <span className='text-green-600'>Compliant</span>
                        ) : data.weeklyCompliant === false ? (
                          <span className='text-red-600'>Non-Compliant</span>
                        ) : (
                          <span className='text-gray-500'>Not Set</span>
                        )}
                      </p>
                      <p className='text-sm'>
                        <span className='font-medium'>Exception Approved:</span>{' '}
                        {data.exceptionApproved === true ? (
                          <span className='text-gray-600'>Yes</span>
                        ) : data.exceptionApproved === false ? (
                          <span className='text-gray-500'>No</span>
                        ) : (
                          <span className='text-gray-500'>Not Set</span>
                        )}
                      </p>
                      <p className='text-sm text-gray-500 mt-1'>
                        Working Days: {data.workingDays} | Present: {data.presentInOffice} |
                        Leaves (BCS): {data.leavesAvailed} | Leaves (Teams): {data.leaveNotificationsInTeamsChannel}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <ReferenceLine y={40} stroke='#f59e0b' strokeWidth={2} strokeDasharray='5 5' label={{ value: '40% Threshold', position: 'right' }} />
            <Bar
              dataKey='attendancePercentage'
              name='Attendance %'
              fill='#8884d8'
            >
              {chartData.map((entry, index) => {
                const data = attendanceData[index];
                const color = getBarColor(data);
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={color}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Table */}
      <div className='bg-white rounded-lg shadow overflow-hidden'>
        <div className='px-6 py-4 border-b border-gray-200'>
          <div className='flex items-center justify-between'>
            <h2 className='text-lg font-semibold text-gray-900'>
              Monthly Attendance Details
            </h2>
            <div className='flex items-center space-x-2 text-sm text-gray-600'>
              <div className='flex items-center space-x-1'>
                <div className='w-4 h-4 rounded bg-red-50 border border-red-200'></div>
                <span>Highlighted rows require attention</span>
              </div>
            </div>
          </div>
          <div className='mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3'>
            <p className='text-sm text-amber-800'>
              <strong>Note:</strong> Rows are highlighted in red when Leaves (BCS) and Leaves (Teams) do not match.
            </p>
          </div>
        </div>
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Month/Year (Days)
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Present
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Leaves (BCS)
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Leaves (Teams)
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Attendance %
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Monthly Compliance
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Status
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Manager Comments
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {attendanceData.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className='px-6 py-12 text-center text-gray-500'
                  >
                    No attendance records found for the last 12 months.
                  </td>
                </tr>
              ) : (
                attendanceData.map((data, index) => {
                  // Determine if row should be highlighted (when BCS and Teams leaves don't match)
                  const shouldHighlight = data.leavesAvailed !== data.leaveNotificationsInTeamsChannel;
                  
                  // Determine reasons for highlighting
                  const highlightReasons: string[] = [];
                  if (shouldHighlight) {
                    highlightReasons.push(`Leaves (BCS): ${data.leavesAvailed} ≠ Leaves (Teams): ${data.leaveNotificationsInTeamsChannel}`);
                  }
                  
                  return (
                  <tr 
                    key={`${data.year}-${data.month}`} 
                    className={shouldHighlight ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}
                  >
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                      {data.monthLabel} ({data.workingDays})
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {data.presentInOffice}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {data.leavesAvailed}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {data.leaveNotificationsInTeamsChannel}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {data.attendancePercentage !== null
                        ? `${data.attendancePercentage.toFixed(1)}%`
                        : 'N/A'}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm'>
                      {data.attendancePercentage !== null ? (
                        data.monthlyCompliant ? (
                          <span className='inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800'>
                            Compliant
                          </span>
                        ) : (
                          <span className='inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800'>
                            Non-Compliant
                          </span>
                        )
                      ) : (
                        <span className='text-gray-500'>N/A</span>
                      )}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm'>
                      {shouldHighlight ? (
                        <div className='flex flex-col space-y-1'>
                          <span className='inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800'>
                            <svg className='w-3 h-3 mr-1' fill='currentColor' viewBox='0 0 20 20'>
                              <path fillRule='evenodd' d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z' clipRule='evenodd' />
                            </svg>
                            Attention Required
                          </span>
                          <div className='text-xs text-red-700 mt-1'>
                            {highlightReasons.join(', ')}
                          </div>
                        </div>
                      ) : (
                        <span className='inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800'>
                          <svg className='w-3 h-3 mr-1' fill='currentColor' viewBox='0 0 20 20'>
                            <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
                          </svg>
                          OK
                        </span>
                      )}
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-900'>
                      {editingComment?.recordId === data.recordId ? (
                        <div className='space-y-2'>
                          <textarea
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder='Enter comment...'
                            className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm'
                            rows={3}
                            disabled={savingComment}
                          />
                          <div className='flex space-x-2'>
                            <button
                              onClick={() => handleSaveComment(data.recordId!)}
                              disabled={savingComment || !data.recordId}
                              className='px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                              {savingComment ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              disabled={savingComment}
                              className='px-3 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className='flex items-start justify-between'>
                          <div className='flex-1'>
                            {data.reasonForNonCompliance ? (
                              <p className='text-sm text-gray-700 whitespace-pre-wrap'>{data.reasonForNonCompliance}</p>
                            ) : (
                              <p className='text-sm text-gray-400 italic'>No comment</p>
                            )}
                          </div>
                          {canEditComments && data.recordId && (
                            <button
                              onClick={() => handleEditComment(data.recordId!, data.monthLabel, data.reasonForNonCompliance)}
                              className='ml-2 px-2 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded'
                              title='Edit comment'
                            >
                              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
                              </svg>
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceCompliance;

