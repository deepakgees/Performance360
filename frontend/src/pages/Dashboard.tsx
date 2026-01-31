import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { assessmentAPI, feedbackAPI } from '../services/api';
import ColleagueFeedbackPastTable from '../components/ColleagueFeedbackPastTable';
import JiraStatisticsForUser from '../components/JiraStatisticsForUser';
import ManagerFeedbackPastTable from '../components/ManagerFeedbackPastTable';
import SelfAssessmentsList from '../components/SelfAssessmentsList';
import AttendanceCompliance from '../components/AttendanceCompliance';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    | 'assessments'
    | 'jira-statistics'
    | 'colleague-provided'
    | 'manager-provided'
    | 'attendance'
  >('assessments');

  const {
    data: userColleagueProvidedFeedback,
    isLoading: colleagueProvidedFeedbackLoading,
  } = useQuery({
    queryKey: ['user-colleague-provided-feedback', user?.id],
    queryFn: () => feedbackAPI.getColleagueSent(),
    enabled: !!user?.id,
  });

  const {
    data: userManagerProvidedFeedback,
    isLoading: managerProvidedFeedbackLoading,
  } = useQuery({
    queryKey: ['user-manager-provided-feedback', user?.id],
    queryFn: () => feedbackAPI.getManagerSent(),
    enabled: !!user?.id,
  });

  return (
    <div id='dashboard-page' className='p-2'>
      <div className='w-full max-w-none'>
        {/* Header */}
        <div className='mb-3'>
          <h1
            id='dashboard-title'
            className='text-2xl font-bold text-gray-900 mb-2'
          >
            Dashboard
          </h1>
          <p id='dashboard-subtitle' className='text-sm text-gray-500'>
            View your performance data and feedback history
          </p>
        </div>

        {/* Top Navigation Tabs */}
        <div className='bg-white rounded-lg shadow mb-4'>
          <div className='border-b border-gray-200'>
            <nav className='-mb-px flex flex-wrap px-6' aria-label='Tabs'>
              {/* Self-assessment Tab */}
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

              {/* Jira Statistics Tab */}
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

              {/* Feedback Provided to Colleagues Tab */}
              <button
                onClick={() => setActiveTab('colleague-provided')}
                className={`py-3 px-2 border-b-2 font-medium text-xs transition-colors text-center min-w-0 max-w-32 ${
                  activeTab === 'colleague-provided'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Feedback Provided to Colleagues
              </button>

              {/* Feedback Provided to Manager Tab */}
              <button
                onClick={() => setActiveTab('manager-provided')}
                className={`py-3 px-2 border-b-2 font-medium text-xs transition-colors text-center min-w-0 max-w-32 ${
                  activeTab === 'manager-provided'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Feedback Provided to Manager
              </button>

              {/* Attendance Tab */}
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
            </nav>
          </div>
        </div>

        {/* Main Content Area */}
        <div className='w-full'>
          <div className='bg-white rounded-lg shadow'>
            {/* Action Buttons Header */}
            <div className='border-b border-gray-200 px-6 py-4'>
              <div className='flex justify-end items-center'>
              </div>
            </div>

            {/* Tab Content */}
            <div className='p-6'>
              {/* Self-Assessments Tab */}
              {activeTab === 'assessments' && (
                <SelfAssessmentsList
                  showDetailedView={true}
                />
              )}

              {/* Jira Statistics Tab */}
              {activeTab === 'jira-statistics' && user?.id && (
                <JiraStatisticsForUser userId={user.id} />
              )}

              {/* Colleague Feedback Provided Tab */}
              {activeTab === 'colleague-provided' && (
                <ColleagueFeedbackPastTable
                  feedbacks={userColleagueProvidedFeedback?.data || []}
                  loading={colleagueProvidedFeedbackLoading}
                  showReceiver={true}
                />
              )}

              {/* Manager Feedback Provided Tab */}
              {activeTab === 'manager-provided' && (
                <ManagerFeedbackPastTable
                  feedbacks={userManagerProvidedFeedback?.data || []}
                  loading={managerProvidedFeedbackLoading}
                />
              )}

              {/* Attendance Tab */}
              {activeTab === 'attendance' && <AttendanceCompliance />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
