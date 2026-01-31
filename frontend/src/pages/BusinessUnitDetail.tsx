import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  PencilIcon,
  PlusIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { businessUnitsAPI } from '../services/api';

interface BusinessUnitStatistics {
  businessUnit: {
    id: string;
    name: string;
    description?: string;
    totalMembers: number;
  };
  attendance: {
    complianceRate: number;
    trends: Array<{
      month: string;
      year: number;
      monthNumber: number;
      complianceRate: number;
      compliantMembers: number;
      totalMembersWithData: number;
    }>;
  };
  feedbackCompletion: {
    selfAssessment: { completed: number; notCompleted: number };
    managerFeedback: { completed: number; notCompleted: number };
    colleagueFeedback: { provided: number; notProvided: number };
  };
  feedbackRatings: {
    averageSelfAssessment: number | null;
    averageManagerRating: number | null;
    averageColleagueRating: number | null;
  };
}

interface BusinessUnitMember {
  id: string;
  joinedAt: string;
  isActive: boolean;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    position?: string;
  };
}

interface BusinessUnit {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  userBusinessUnits: BusinessUnitMember[];
}

const COLORS = ['#8B5CF6', '#EF4444', '#10B981', '#F59E0B', '#3B82F6'];

const BusinessUnitDetail: React.FC = () => {
  const { businessUnitId } = useParams<{ businessUnitId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('members');
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');

  // Fetch business unit details
  const {
    data: businessUnitData,
    isLoading: isLoadingBusinessUnit,
    refetch: refetchBusinessUnit,
  } = useQuery({
    queryKey: ['business-unit', businessUnitId],
    queryFn: () => businessUnitsAPI.getById(businessUnitId!),
    enabled: !!businessUnitId,
  });

  // Fetch statistics
  const {
    data: statisticsData,
    isLoading: isLoadingStatistics,
  } = useQuery({
    queryKey: ['business-unit-statistics', businessUnitId],
    queryFn: () => businessUnitsAPI.getStatistics(businessUnitId!),
    enabled: !!businessUnitId,
  });

  const businessUnit: BusinessUnit | undefined = businessUnitData?.data;
  const statistics: BusinessUnitStatistics | undefined = statisticsData?.data;

  const activeMembers = businessUnit?.userBusinessUnits.filter(
    ub => ub.isActive
  ) || [];

  const handleEdit = () => {
    if (businessUnit) {
      setEditedName(businessUnit.name);
      setEditedDescription(businessUnit.description || '');
      setIsEditing(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!businessUnitId) return;

    try {
      await businessUnitsAPI.update(businessUnitId, {
        name: editedName,
        description: editedDescription,
      });
      setIsEditing(false);
      refetchBusinessUnit();
    } catch (error) {
      console.error('Error updating business unit:', error);
      window.alert('Failed to update business unit');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedName('');
    setEditedDescription('');
  };

  if (isLoadingBusinessUnit) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading business unit...</p>
        </div>
      </div>
    );
  }

  if (!businessUnit) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <p className='text-gray-600 mb-4'>Business unit not found</p>
          <button
            onClick={() => navigate('/settings/business-units')}
            className='px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700'
          >
            Back to Business Units
          </button>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const attendanceTrendData = statistics?.attendance.trends.map(trend => ({
    month: `${trend.month} ${trend.year}`,
    complianceRate: Math.round(trend.complianceRate * 100) / 100,
  })) || [];

  const selfAssessmentData = statistics
    ? [
        {
          name: 'Completed',
          value: statistics.feedbackCompletion.selfAssessment.completed,
        },
        {
          name: 'Not Completed',
          value: statistics.feedbackCompletion.selfAssessment.notCompleted,
        },
      ]
    : [];

  const managerFeedbackData = statistics
    ? [
        {
          name: 'Completed',
          value: statistics.feedbackCompletion.managerFeedback.completed,
        },
        {
          name: 'Not Completed',
          value: statistics.feedbackCompletion.managerFeedback.notCompleted,
        },
      ]
    : [];

  const colleagueFeedbackData = statistics
    ? [
        {
          name: 'Provided',
          value: statistics.feedbackCompletion.colleagueFeedback.provided,
        },
        {
          name: 'Not Provided',
          value: statistics.feedbackCompletion.colleagueFeedback.notProvided,
        },
      ]
    : [];

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Header */}
        <div className='mb-6'>
          <button
            onClick={() => navigate('/settings/business-units')}
            className='flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4'
          >
            <ArrowLeftIcon className='h-5 w-5' />
            <span>Back to Business Units</span>
          </button>

          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <div className='p-3 bg-purple-100 rounded-lg'>
                <BuildingOfficeIcon className='h-8 w-8 text-purple-600' />
              </div>
              <div>
                {isEditing ? (
                  <div className='space-y-2'>
                    <input
                      type='text'
                      value={editedName}
                      onChange={e => setEditedName(e.target.value)}
                      className='text-2xl font-bold text-gray-900 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500'
                    />
                    <textarea
                      value={editedDescription}
                      onChange={e => setEditedDescription(e.target.value)}
                      rows={2}
                      className='text-sm text-gray-600 w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500'
                      placeholder='Description (optional)'
                    />
                    <div className='flex space-x-2'>
                      <button
                        onClick={handleSaveEdit}
                        className='px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700'
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className='px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400'
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h1 className='text-2xl font-bold text-gray-900'>
                      {businessUnit.name}
                    </h1>
                    {businessUnit.description && (
                      <p className='text-sm text-gray-600 mt-1'>
                        {businessUnit.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className='flex items-center space-x-2'>
              <span className='text-sm text-gray-500'>
                {activeMembers.length} member
                {activeMembers.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className='mb-6 flex flex-wrap gap-2'>
          <button
            onClick={() => navigate('/settings/business-units')}
            className='flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors'
          >
            <PlusIcon className='h-5 w-5' />
            <span>Add Member</span>
          </button>
          {activeMembers.length > 0 && (
            <button
              onClick={() => {
                // Navigate to business units page and trigger email modal
                navigate('/settings/business-units');
              }}
              className='flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
            >
              <EnvelopeIcon className='h-5 w-5' />
              <span>Send Email</span>
            </button>
          )}
          {!isEditing && (
            <button
              onClick={handleEdit}
              className='flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors'
            >
              <PencilIcon className='h-5 w-5' />
              <span>Edit Details</span>
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className='bg-white rounded-lg shadow-md border border-gray-200 mb-6'>
          <div className='border-b border-gray-200'>
            <nav className='-mb-px flex flex-wrap px-6' aria-label='Tabs'>
              <button
                onClick={() => setActiveTab('members')}
                className={`py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'members'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Members
              </button>
              <button
                onClick={() => setActiveTab('attendance')}
                className={`py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'attendance'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Attendance Statistics
              </button>
              <button
                onClick={() => setActiveTab('feedback-completion')}
                className={`py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'feedback-completion'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Previous Qtr Feedback Completion
              </button>
              <button
                onClick={() => setActiveTab('feedback-overview')}
                className={`py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'feedback-overview'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Previous Quarter Feedback Overview
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className='p-6'>
            {/* Members Tab */}
            {activeTab === 'members' && (
              <div>
                <h2 className='text-lg font-semibold text-gray-900 mb-4'>
                  Members
                </h2>
                {activeMembers.length === 0 ? (
                  <p className='text-gray-500 text-center py-8'>No members yet</p>
                ) : (
                  <div className='space-y-3'>
                    {activeMembers.map(member => (
                      <div
                        key={member.id}
                        className='flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors'
                      >
                        <div className='flex items-center space-x-3'>
                          <div className='w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center'>
                            <UserIcon className='h-6 w-6 text-purple-600' />
                          </div>
                          <div>
                            <button
                              onClick={() =>
                                navigate(
                                  `/employee-profile?userId=${member.user.id}`
                                )
                              }
                              className='text-sm font-medium text-gray-900 hover:text-purple-600'
                            >
                              {member.user.firstName} {member.user.lastName}
                            </button>
                            <p className='text-xs text-gray-500'>
                              {member.user.email}
                            </p>
                            {member.user.position && (
                              <p className='text-xs text-gray-500'>
                                {member.user.position}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Attendance Statistics Tab */}
            {activeTab === 'attendance' && (
              <div>
                {isLoadingStatistics ? (
                  <div className='text-center py-12'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4'></div>
                    <p className='text-gray-600'>Loading statistics...</p>
                  </div>
                ) : statistics ? (
                  <div>
                    <h2 className='text-lg font-semibold text-gray-900 mb-4'>
                      Attendance Statistics
                    </h2>
                    <div className='mb-4'>
                      <div className='flex items-center space-x-4'>
                        <div>
                          <p className='text-sm text-gray-600'>Compliance Rate</p>
                          <p className='text-2xl font-bold text-purple-600'>
                            {Math.round(
                              statistics.attendance.complianceRate * 100
                            ) / 100}
                            %
                          </p>
                        </div>
                      </div>
                    </div>
                    {attendanceTrendData.length > 0 && (
                      <div className='h-80'>
                        <ResponsiveContainer width='100%' height='100%'>
                          <LineChart data={attendanceTrendData}>
                            <CartesianGrid strokeDasharray='3 3' />
                            <XAxis dataKey='month' />
                            <YAxis domain={[0, 100]} />
                            <Tooltip />
                            <Legend />
                            <Line
                              type='monotone'
                              dataKey='complianceRate'
                              stroke='#8B5CF6'
                              strokeWidth={2}
                              name='Compliance Rate (%)'
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className='text-gray-500 text-center py-8'>
                      No statistics available
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Previous Qtr Feedback Completion Tab */}
            {activeTab === 'feedback-completion' && (
              <div>
                {isLoadingStatistics ? (
                  <div className='text-center py-12'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4'></div>
                    <p className='text-gray-600'>Loading statistics...</p>
                  </div>
                ) : statistics ? (
                  <div>
                    <h2 className='text-lg font-semibold text-gray-900 mb-4'>
                      Feedback Completion (Previous Quarter)
                    </h2>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                      {/* Self Assessment */}
                      <div>
                        <h3 className='text-sm font-medium text-gray-700 mb-2'>
                          Self Assessment
                        </h3>
                        {selfAssessmentData.some(d => d.value > 0) ? (
                          <div className='h-72'>
                            <ResponsiveContainer width='100%' height='100%'>
                              <PieChart>
                                <Pie
                                  data={selfAssessmentData}
                                  cx='50%'
                                  cy='50%'
                                  labelLine={false}
                                  label={false}
                                  outerRadius={70}
                                  fill='#8884d8'
                                  dataKey='value'
                                >
                                  {selfAssessmentData.map((entry, index) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={COLORS[index % COLORS.length]}
                                    />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <p className='text-sm text-gray-500 text-center py-8'>
                            No data available
                          </p>
                        )}
                      </div>

                      {/* Manager Feedback */}
                      <div>
                        <h3 className='text-sm font-medium text-gray-700 mb-2'>
                          Manager Feedback
                        </h3>
                        {managerFeedbackData.some(d => d.value > 0) ? (
                          <div className='h-72'>
                            <ResponsiveContainer width='100%' height='100%'>
                              <PieChart>
                                <Pie
                                  data={managerFeedbackData}
                                  cx='50%'
                                  cy='50%'
                                  labelLine={false}
                                  label={false}
                                  outerRadius={70}
                                  fill='#8884d8'
                                  dataKey='value'
                                >
                                  {managerFeedbackData.map((entry, index) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={COLORS[index % COLORS.length]}
                                    />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <p className='text-sm text-gray-500 text-center py-8'>
                            No data available
                          </p>
                        )}
                      </div>

                      {/* Colleague Feedback */}
                      <div>
                        <h3 className='text-sm font-medium text-gray-700 mb-2'>
                          Colleague Feedback
                        </h3>
                        {colleagueFeedbackData.some(d => d.value > 0) ? (
                          <div className='h-72'>
                            <ResponsiveContainer width='100%' height='100%'>
                              <PieChart>
                                <Pie
                                  data={colleagueFeedbackData}
                                  cx='50%'
                                  cy='50%'
                                  labelLine={false}
                                  label={false}
                                  outerRadius={70}
                                  fill='#8884d8'
                                  dataKey='value'
                                >
                                  {colleagueFeedbackData.map((entry, index) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={COLORS[index % COLORS.length]}
                                    />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <p className='text-sm text-gray-500 text-center py-8'>
                            No data available
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Shared Legend */}
                    <div className='mt-6 flex justify-center'>
                      <div className='flex items-center space-x-8'>
                        <div className='flex items-center space-x-2'>
                          <div
                            className='w-4 h-4 rounded-full'
                            style={{ backgroundColor: COLORS[0] }}
                          ></div>
                          <span className='text-sm text-gray-700'>
                            Completed / Provided
                          </span>
                        </div>
                        <div className='flex items-center space-x-2'>
                          <div
                            className='w-4 h-4 rounded-full'
                            style={{ backgroundColor: COLORS[1] }}
                          ></div>
                          <span className='text-sm text-gray-700'>
                            Not Completed / Not Provided
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className='text-gray-500 text-center py-8'>
                      No statistics available
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Previous Quarter Feedback Overview Tab */}
            {activeTab === 'feedback-overview' && (
              <div>
                {isLoadingStatistics ? (
                  <div className='text-center py-12'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4'></div>
                    <p className='text-gray-600'>Loading statistics...</p>
                  </div>
                ) : statistics ? (
                  <div>
                    <h2 className='text-lg font-semibold text-gray-900 mb-4'>
                      Average Feedback Ratings
                    </h2>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                      <div className='text-center'>
                        <p className='text-sm text-gray-600 mb-2'>
                          Self Assessment
                        </p>
                        <p className='text-2xl font-bold text-purple-600'>
                          {statistics.feedbackRatings.averageSelfAssessment !==
                          null
                            ? statistics.feedbackRatings.averageSelfAssessment.toFixed(
                                2
                              )
                            : 'N/A'}
                        </p>
                      </div>
                      <div className='text-center'>
                        <p className='text-sm text-gray-600 mb-2'>
                          Manager Rating
                        </p>
                        <p className='text-2xl font-bold text-blue-600'>
                          {statistics.feedbackRatings.averageManagerRating !==
                          null
                            ? statistics.feedbackRatings.averageManagerRating.toFixed(
                                2
                              )
                            : 'N/A'}
                        </p>
                      </div>
                      <div className='text-center'>
                        <p className='text-sm text-gray-600 mb-2'>
                          Colleague Rating
                        </p>
                        <p className='text-2xl font-bold text-green-600'>
                          {statistics.feedbackRatings.averageColleagueRating !==
                          null
                            ? statistics.feedbackRatings.averageColleagueRating.toFixed(
                                2
                              )
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className='text-gray-500 text-center py-8'>
                      No statistics available
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessUnitDetail;
