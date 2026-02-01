import { ArrowLeftIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  assessmentAPI,
  feedbackAPI,
  quarterlyPerformanceAPI,
} from '../services/api';
import AchievementsObservations from './AchievementsObservations';
import AttendanceCompliance from './AttendanceCompliance';
import ColleagueFeedbackPastTable from './ColleagueFeedbackPastTable';
import ColleagueFeedbackTable from './ColleagueFeedbackTable';
import JiraStatisticsForUser from './JiraStatisticsForUser';
import ManagerFeedbackTable from './ManagerFeedbackTable';
import PerformanceTracking from './PerformanceTracking';
import SelfAssessmentsList from './SelfAssessmentsList';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  position?: string;
  lastLoginAt?: string;
  createdAt: string;
  manager?: {
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

interface UserDetailsPageProps {
  user: User;
  onBack: () => void;
  backButtonText: string;
  showManagerInfo?: boolean;
}

const UserDetailsPage: React.FC<UserDetailsPageProps> = ({
  user,
  onBack,
  backButtonText,
  showManagerInfo = false,
}) => {
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'achievements-observations'
    | 'assessments'
    | 'colleague-feedback'
    | 'manager-feedback'
    | 'colleague-provided'
    | 'performance-tracking'
    | 'jira-statistics'
    | 'attendance'
  >('overview');

  const { data: userColleagueFeedback, isLoading: colleagueFeedbackLoading } =
    useQuery({
      queryKey: ['user-colleague-feedback', user?.id],
      queryFn: () => feedbackAPI.getColleagueReceivedByUser(user!.id),
      enabled: !!user?.id,
    });

  const { data: userManagerFeedback, isLoading: managerFeedbackLoading } =
    useQuery({
      queryKey: ['user-manager-feedback', user?.id],
      queryFn: () => feedbackAPI.getManagerReceivedByUser(user!.id),
      enabled: !!user?.id,
    });

  const {
    data: userColleagueProvidedFeedback,
    isLoading: colleagueProvidedFeedbackLoading,
  } = useQuery({
    queryKey: ['user-colleague-provided-feedback', user?.id],
    queryFn: () => feedbackAPI.getColleagueSentByUser(user!.id),
    enabled: !!user?.id,
  });

  // Data fetching for overview charts
  const {
    data: userAssessments,
    isLoading: assessmentsLoading,
    // error: assessmentsError,
  } = useQuery({
    queryKey: ['user-assessments', user?.id],
    queryFn: () => assessmentAPI.getByUserId(user!.id),
    enabled: !!user?.id && activeTab === 'overview',
  });

  const {
    data: quarterlyPerformance,
    isLoading: quarterlyPerformanceLoading,
    // error: quarterlyPerformanceError,
  } = useQuery({
    queryKey: ['user-quarterly-performance', user?.id],
    queryFn: () => quarterlyPerformanceAPI.getByUserId(user!.id),
    enabled: !!user?.id && activeTab === 'overview',
  });

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

  // const getTabTitle = (tab: string) => {
  //   switch (tab) {
  //     case 'achievements-observations':
  //       return 'Achievements & Observations';
  //     case 'performance-tracking':
  //       return 'Quarterly Assessment';
  //     case 'assessments':
  //       return 'Self-assessment';
  //     case 'jira-statistics':
  //       return 'Jira Statistics';
  //     case 'colleague-feedback':
  //       return 'Feedbacks Received as Colleague';
  //     case 'manager-feedback':
  //       return 'Feedbacks Received as Manager';
  //     case 'colleague-provided':
  //       return 'Feedbacks Provided to Colleagues';
  //     default:
  //       return '';
  //   }
  // };

  // Process data for charts
  const processChartData = () => {
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    const currentDate = new Date();
    // const currentYear = currentDate.getFullYear();
    const _currentMonth = currentDate.getMonth(); // 0-11
    // const currentQuarter = Math.floor(currentMonth / 3); // 0-3

    const last5Quarters: string[] = [];

    // Generate last 5 quarters: Q1 2025, Q2 2025, Q3 2025, Q4 2025, Q1 2026
    // Starting from Q1 2025 as the minimal value
    const startYear = 2025;
    const startQuarter = 0; // Q1

    for (let i = 0; i < 5; i++) {
      const totalQuarters = startQuarter + i;
      const quarterIndex = totalQuarters % 4;
      const year = startYear + Math.floor(totalQuarters / 4);

      last5Quarters.push(`${quarters[quarterIndex]} ${year}`);
    }

    const chartData = last5Quarters.map(quarter => ({
      quarter,
      selfAssessment: 0,
      colleagueFeedback: 0,
      quarterlyAssessment: 0,
      managerFeedback: 0,
    }));

    // Debug logging
    console.log('Chart Data Processing:');
    console.log('Last 5 quarters:', last5Quarters);
    console.log('User Assessments:', userAssessments?.data);
    console.log('Colleague Feedback:', userColleagueFeedback?.data);
    console.log('Quarterly Performance:', quarterlyPerformance?.data);
    console.log('Manager Feedback:', userManagerFeedback?.data);

    // Log the structure of the data
    if (userAssessments?.data) {
      console.log('Assessment data structure:', userAssessments.data[0]);
    }
    if (userColleagueFeedback?.data) {
      console.log(
        'Colleague feedback data structure:',
        userColleagueFeedback.data[0]
      );
    }
    if (quarterlyPerformance?.data) {
      console.log(
        'Quarterly performance data structure:',
        quarterlyPerformance.data[0]
      );
    }
    if (userManagerFeedback?.data) {
      console.log(
        'Manager feedback data structure:',
        userManagerFeedback.data[0]
      );
    }

    // Process self-assessments - check for different possible rating fields
    if (userAssessments?.data) {
      userAssessments.data.forEach((assessment: any) => {
        console.log('Processing assessment:', assessment);
        const quarterKey = `${assessment.period || 'Q1 2024'}`;
        const quarterIndex = last5Quarters.findIndex(q => q === quarterKey);
        console.log(
          'Assessment quarter key:',
          quarterKey,
          'Index:',
          quarterIndex
        );

        if (quarterIndex !== -1) {
          // Extract rating from content.answers["1"] (question ID "1" is the rating question)
          let rating = 0;

          if (assessment.content?.answers && assessment.content.answers['1']) {
            rating = parseInt(assessment.content.answers['1']) || 0;
            console.log('Found rating in content.answers["1"]:', rating);
          } else {
            // Fallback to other possible rating field names
            rating =
              assessment.overallRating ||
              assessment.rating ||
              assessment.content?.overallRating ||
              0;
            console.log('Using fallback rating:', rating);
          }

          if (rating > 0) {
            chartData[quarterIndex].selfAssessment = rating;
            console.log(
              'Set self assessment rating:',
              rating,
              'for quarter:',
              quarterKey
            );
          } else {
            console.log('No valid rating found for assessment:', assessment);
          }
        }
      });
    }

    // Process colleague feedback
    if (userColleagueFeedback?.data) {
      const feedbackByQuarter: { [key: string]: number[] } = {};
      userColleagueFeedback.data.forEach((feedback: any) => {
        // The quarter field already contains "Q1", "Q2", etc., so don't add another "Q"
        const quarterKey = `${feedback.quarter} ${feedback.year}`;
        console.log(
          'Colleague feedback quarter key:',
          quarterKey,
          'Rating:',
          feedback.rating
        );
        if (!feedbackByQuarter[quarterKey]) {
          feedbackByQuarter[quarterKey] = [];
        }
        if (feedback.rating) {
          feedbackByQuarter[quarterKey].push(feedback.rating);
        }
      });

      Object.keys(feedbackByQuarter).forEach(quarterKey => {
        const quarterIndex = last5Quarters.findIndex(q => q === quarterKey);
        if (quarterIndex !== -1) {
          const ratings = feedbackByQuarter[quarterKey];
          chartData[quarterIndex].colleagueFeedback =
            ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
          console.log(
            'Set colleague feedback rating:',
            chartData[quarterIndex].colleagueFeedback,
            'for quarter:',
            quarterKey
          );
        } else {
          console.log(
            'Quarter not found in last5Quarters:',
            quarterKey,
            'Available quarters:',
            last5Quarters
          );
        }
      });
    }

    // Process quarterly assessments
    if (quarterlyPerformance?.data) {
      quarterlyPerformance.data.forEach((performance: any) => {
        // Check if quarter field already contains "Q" or if it's just a number
        const quarterKey = performance.quarter.startsWith('Q')
          ? `${performance.quarter} ${performance.year}`
          : `Q${performance.quarter} ${performance.year}`;
        console.log(
          'Quarterly performance quarter key:',
          quarterKey,
          'Rating:',
          performance.rating
        );
        const quarterIndex = last5Quarters.findIndex(q => q === quarterKey);
        if (quarterIndex !== -1 && performance.rating) {
          chartData[quarterIndex].quarterlyAssessment = performance.rating;
          console.log(
            'Set quarterly assessment rating:',
            performance.rating,
            'for quarter:',
            quarterKey
          );
        } else {
          console.log(
            'Quarterly performance quarter not found:',
            quarterKey,
            'Available quarters:',
            last5Quarters
          );
        }
      });
    }

    // Process manager feedback
    if (userManagerFeedback?.data) {
      const feedbackByQuarter: { [key: string]: number[] } = {};
      userManagerFeedback.data.forEach((feedback: any) => {
        // Check if quarter field already contains "Q" or if it's just a number
        const quarterKey = feedback.quarter.startsWith('Q')
          ? `${feedback.quarter} ${feedback.year}`
          : `Q${feedback.quarter} ${feedback.year}`;
        console.log(
          'Manager feedback quarter key:',
          quarterKey,
          'Rating:',
          feedback.managerOverallRating
        );
        if (!feedbackByQuarter[quarterKey]) {
          feedbackByQuarter[quarterKey] = [];
        }
        if (feedback.managerOverallRating) {
          feedbackByQuarter[quarterKey].push(feedback.managerOverallRating);
        }
      });

      Object.keys(feedbackByQuarter).forEach(quarterKey => {
        const quarterIndex = last5Quarters.findIndex(q => q === quarterKey);
        if (quarterIndex !== -1) {
          const ratings = feedbackByQuarter[quarterKey];
          chartData[quarterIndex].managerFeedback =
            ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
          console.log(
            'Set manager feedback rating:',
            chartData[quarterIndex].managerFeedback,
            'for quarter:',
            quarterKey
          );
        } else {
          console.log(
            'Manager feedback quarter not found:',
            quarterKey,
            'Available quarters:',
            last5Quarters
          );
        }
      });
    }

    console.log('Final chart data:', chartData);

    // Log each data point for debugging
    chartData.forEach((dataPoint, index) => {
      console.log(`Chart data point ${index}:`, dataPoint);
    });

    return chartData;
  };

  return (
    <div id='user-details-page' className='p-2'>
      <div className='w-full max-w-none'>
        {/* Header with back button */}
        <div className='mb-3'>
          <button
            onClick={onBack}
            className='flex items-center text-indigo-600 hover:text-indigo-800 mb-1'
          >
            <ArrowLeftIcon className='h-5 w-5 mr-2' />
            {backButtonText}
          </button>
          <div className='flex items-center'>
            <img
              className='h-12 w-12 rounded-full mr-3'
              src={`https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=random&size=48`}
              alt={`${user.firstName} ${user.lastName}`}
            />
            <div>
              <div className='flex items-center space-x-3'>
                <h1 className='text-xl font-bold text-gray-900'>
                  {user.firstName} {user.lastName}
                </h1>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
                    user.role
                  )}`}
                >
                  {user.role}
                </span>
                <div className='flex items-center text-gray-600'>
                  <span className='text-sm'>{user.email}</span>
                </div>
                {user.userTeams && user.userTeams.length > 0 && (
                  <div className='flex items-center text-gray-500'>
                    <span className='text-sm'>
                      •{' '}
                      {user.userTeams
                        .filter(ut => ut.isActive)
                        .map(ut => ut.team.name)
                        .join(', ')}
                    </span>
                  </div>
                )}
              </div>
              {showManagerInfo && user.manager && (
                <div className='flex items-center mt-1'>
                  <UserGroupIcon className='h-4 w-4 text-gray-400 mr-1' />
                  <p className='text-sm text-gray-500'>
                    Reports to:{' '}
                    {user.manager
                      ? `${user.manager.firstName} ${user.manager.lastName}`
                      : 'No manager assigned'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Navigation Tabs */}
        <div className='bg-white rounded-lg shadow mb-4'>
          <div className='border-b border-gray-200'>
            <nav className='-mb-px flex flex-wrap px-6' aria-label='Tabs'>
              {/* Overview Section */}
              <div className='flex flex-wrap space-x-2'>
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-3 px-2 border-b-2 font-medium text-xs transition-colors text-center min-w-0 max-w-32 ${
                    activeTab === 'overview'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Overview
                </button>
              </div>

              {/* Separator */}
              <div className='border-l border-gray-200 mx-2'></div>

              {/* First Section: Self-assessment, Achievements & Observations */}
              <div className='flex flex-wrap space-x-2'>
                <button
                  onClick={() => setActiveTab('assessments')}
                  className={`py-3 px-2 border-b-2 font-medium text-xs transition-colors text-center min-w-0 max-w-32 ${
                    activeTab === 'assessments'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Self-assessment
                </button>
                <button
                  onClick={() => setActiveTab('achievements-observations')}
                  className={`py-3 px-2 border-b-2 font-medium text-xs transition-colors text-center min-w-0 max-w-32 ${
                    activeTab === 'achievements-observations'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Achievements & Observations
                </button>
              </div>

              {/* Separator */}
              <div className='border-l border-gray-200 mx-2'></div>

              {/* Second Section: Feedbacks Received as Colleague, Feedbacks Received as Manager */}
              <div className='flex flex-wrap space-x-2'>
                <button
                  onClick={() => setActiveTab('colleague-feedback')}
                  className={`py-3 px-2 border-b-2 font-medium text-xs transition-colors text-center min-w-0 max-w-32 ${
                    activeTab === 'colleague-feedback'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Feedbacks Received as Colleague
                </button>
                {user?.role !== 'EMPLOYEE' && (
                  <button
                    onClick={() => setActiveTab('manager-feedback')}
                    className={`py-3 px-2 border-b-2 font-medium text-xs transition-colors text-center min-w-0 max-w-32 ${
                      activeTab === 'manager-feedback'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Feedbacks Received as Manager
                  </button>
                )}
              </div>

              {/* Separator */}
              <div className='border-l border-gray-200 mx-2'></div>

              {/* Third Section: Quarterly Assessment, Jira Statistics */}
              <div className='flex flex-wrap space-x-2'>
                <button
                  onClick={() => setActiveTab('performance-tracking')}
                  className={`py-3 px-2 border-b-2 font-medium text-xs transition-colors text-center min-w-0 max-w-32 ${
                    activeTab === 'performance-tracking'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Quarterly Assessment
                </button>
                <button
                  onClick={() => setActiveTab('jira-statistics')}
                  className={`py-3 px-2 border-b-2 font-medium text-xs transition-colors text-center min-w-0 max-w-32 ${
                    activeTab === 'jira-statistics'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Jira Statistics
                </button>
              </div>

              {/* Separator */}
              <div className='border-l border-gray-200 mx-2'></div>

              {/* Fourth Section: Feedbacks Provided to Colleagues */}
              <div className='flex flex-wrap space-x-2'>
                <button
                  onClick={() => setActiveTab('colleague-provided')}
                  className={`py-3 px-2 border-b-2 font-medium text-xs transition-colors text-center min-w-0 max-w-32 ${
                    activeTab === 'colleague-provided'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Feedbacks Provided to Colleagues
                </button>
              </div>

              {/* Separator */}
              <div className='border-l border-gray-200 mx-2'></div>

              {/* Fifth Section: Attendance */}
              <div className='flex flex-wrap space-x-2'>
                <button
                  onClick={() => setActiveTab('attendance')}
                  className={`py-3 px-2 border-b-2 font-medium text-xs transition-colors text-center min-w-0 max-w-32 ${
                    activeTab === 'attendance'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Attendance
                </button>
              </div>
            </nav>
          </div>
        </div>

        {/* Main Content Area - Full Width */}
        <div className='w-full'>
          <div className='bg-white rounded-lg shadow'>
            {/* Action Buttons Header */}
            <div className='border-b border-gray-200 px-6 py-4'>
              <div className='flex justify-end items-center'>
                {activeTab === 'achievements-observations' && (
                  <button
                    onClick={() => {
                      // Call the modal opening function from the AchievementsObservations component
                      if ((window as any).openAchievementsModal) {
                        (window as any).openAchievementsModal();
                      }
                    }}
                    className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                  >
                    <svg
                      className='h-4 w-4 mr-2'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M12 4v16m8-8H4'
                      />
                    </svg>
                    Add Achievement
                  </button>
                )}
                {activeTab === 'performance-tracking' && (
                  <button
                    onClick={() => {
                      // Call the modal opening function from the PerformanceTracking component
                      if ((window as any).openPerformanceModal) {
                        (window as any).openPerformanceModal();
                      }
                    }}
                    className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                  >
                    <svg
                      className='h-4 w-4 mr-2'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M12 4v16m8-8H4'
                      />
                    </svg>
                    Add Quarterly Assessment
                  </button>
                )}
              </div>
            </div>

            {/* Tab Content */}
            <div className='p-6'>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div>
                  {/* Loading State */}
                  {(assessmentsLoading ||
                    quarterlyPerformanceLoading ||
                    colleagueFeedbackLoading ||
                    managerFeedbackLoading) && (
                    <div className='flex items-center justify-center h-64'>
                      <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600'></div>
                      <span className='ml-3 text-gray-600'>
                        Loading chart data...
                      </span>
                    </div>
                  )}

                  {/* Charts */}
                  {!assessmentsLoading &&
                    !quarterlyPerformanceLoading &&
                    !colleagueFeedbackLoading &&
                    !managerFeedbackLoading && (
                      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                        {/* As Employee Chart */}
                        <div className='bg-white rounded-lg border p-6'>
                          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                            As Employee
                          </h3>
                          <div className='h-80'>
                            <ResponsiveContainer width='100%' height='100%'>
                              <LineChart data={processChartData()}>
                                <CartesianGrid strokeDasharray='3 3' />
                                <XAxis dataKey='quarter' />
                                <YAxis
                                  domain={[1, 5]}
                                  ticks={[1, 2, 3, 4, 5]}
                                />
                                <Tooltip />
                                <Legend />
                                <Line
                                  type='monotone'
                                  dataKey='selfAssessment'
                                  stroke='#3B82F6'
                                  strokeWidth={2}
                                  name='Self Assessment'
                                  connectNulls={false}
                                />
                                <Line
                                  type='monotone'
                                  dataKey='colleagueFeedback'
                                  stroke='#10B981'
                                  strokeWidth={2}
                                  name='Avg Rating by Colleagues'
                                  connectNulls={false}
                                />
                                <Line
                                  type='monotone'
                                  dataKey='quarterlyAssessment'
                                  stroke='#F59E0B'
                                  strokeWidth={2}
                                  name='Rating by Manager'
                                  connectNulls={false}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* As Manager Chart */}
                        <div className='bg-white rounded-lg border p-6'>
                          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                            As Manager
                          </h3>
                          <div className='h-80'>
                            <ResponsiveContainer width='100%' height='100%'>
                              <LineChart data={processChartData()}>
                                <CartesianGrid strokeDasharray='3 3' />
                                <XAxis dataKey='quarter' />
                                <YAxis
                                  domain={[1, 5]}
                                  ticks={[1, 2, 3, 4, 5]}
                                />
                                <Tooltip />
                                <Legend />
                                <Line
                                  type='monotone'
                                  dataKey='managerFeedback'
                                  stroke='#EF4444'
                                  strokeWidth={2}
                                  name='Rating as a Manager by sub-ordinates'
                                  connectNulls={false}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              )}

              {/* Achievements & Observations Tab */}
              {activeTab === 'achievements-observations' && (
                <AchievementsObservations userId={user?.id} />
              )}

              {/* Self-Assessments Tab */}
              {activeTab === 'assessments' && (
                <SelfAssessmentsList
                  userId={user?.id}
                  showDetailedView={true}
                />
              )}

              {/* Performance Tracking Tab */}
              {activeTab === 'performance-tracking' && (
                <PerformanceTracking userId={user?.id} />
              )}

              {/* Jira Statistics Tab */}
              {activeTab === 'jira-statistics' && (
                <JiraStatisticsForUser userId={user?.id} />
              )}

              {/* Colleague Feedback Tab */}
              {activeTab === 'colleague-feedback' && (
                <ColleagueFeedbackTable
                  feedbacks={userColleagueFeedback?.data || []}
                  loading={colleagueFeedbackLoading}
                />
              )}

              {/* Manager Feedback Tab */}
              {activeTab === 'manager-feedback' &&
                user?.role !== 'EMPLOYEE' && (
                  <ManagerFeedbackTable
                    feedbacks={userManagerFeedback?.data || []}
                    loading={managerFeedbackLoading}
                  />
                )}

              {/* Colleague Feedback Provided Tab */}
              {activeTab === 'colleague-provided' && (
                <ColleagueFeedbackPastTable
                  feedbacks={userColleagueProvidedFeedback?.data || []}
                  loading={colleagueProvidedFeedbackLoading}
                  showReceiver={true}
                />
              )}

              {/* Attendance Tab */}
              {activeTab === 'attendance' && (
                <AttendanceCompliance userId={user?.id} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsPage;
