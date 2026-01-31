import React, { useEffect, useState } from 'react';
import ToastNotification from '../components/Notification';
import { useAuth } from '../contexts/AuthContext';
import { feedbackAPI, usersAPI } from '../services/api';

/**
 * Get the previous quarter and year based on current date
 * @returns Object with quarter (Q1-Q4) and year (string)
 */
const getPreviousQuarter = (): { quarter: string; year: string } => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentYear = now.getFullYear();

  let previousQuarter: string;
  let previousYear: number;

  if (currentMonth >= 1 && currentMonth <= 3) {
    // Q1 - previous quarter is Q4 of last year
    previousQuarter = 'Q4';
    previousYear = currentYear - 1;
  } else if (currentMonth >= 4 && currentMonth <= 6) {
    // Q2 - previous quarter is Q1 of current year
    previousQuarter = 'Q1';
    previousYear = currentYear;
  } else if (currentMonth >= 7 && currentMonth <= 9) {
    // Q3 - previous quarter is Q2 of current year
    previousQuarter = 'Q2';
    previousYear = currentYear;
  } else {
    // Q4 - previous quarter is Q3 of current year
    previousQuarter = 'Q3';
    previousYear = currentYear;
  }

  return {
    quarter: previousQuarter,
    year: previousYear.toString(),
  };
};

interface ManagerFeedbackItem {
  id: string;
  senderId: string;
  receiverId: string;
  sender: {
    firstName: string;
    lastName: string;
  };
  receiver: {
    firstName: string;
    lastName: string;
    position?: string;
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
  };
  year: string;
  quarter: string;
  feedbackProvider: string;
  managerSatisfaction?: string;
  leadershipStyle?: any;
  careerGrowth?: any;
  coachingCaring?: any;
  managerOverallRating?: number;
  appreciation?: string;
  improvementAreas?: string;
  createdAt: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
  position?: string;
  manager?: {
    id: string;
    firstName: string;
    lastName: string;
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

interface NewManagerFeedback {
  receiverId: string;
  year: string;
  quarter: string;
  feedbackProvider: string;
  managerSatisfaction?: string;
  leadershipStyle?: any;
  careerGrowth?: any;
  coachingCaring?: any;
  managerOverallRating?: number;
  appreciation?: string;
  improvementAreas?: string;
}

const ManagerFeedback: React.FC = () => {
  const { user } = useAuth();
  const [sentFeedbacks, setSentFeedbacks] = useState<ManagerFeedbackItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'view' | 'create'>('view');
  const [sortConfig, setSortConfig] = useState<{
    key:
      | 'year'
      | 'quarter'
      | 'manager'
      | 'satisfaction'
      | 'rating';
    direction: 'asc' | 'desc';
  }>({ key: 'quarter', direction: 'desc' });
  
  // Get previous quarter as default
  const previousQuarter = getPreviousQuarter();
  
  const [newFeedback, setNewFeedback] = useState<NewManagerFeedback>({
    receiverId: '',
    year: previousQuarter.year,
    quarter: previousQuarter.quarter,
    feedbackProvider: '',
    managerSatisfaction: '',
    leadershipStyle: {},
    careerGrowth: {},
    coachingCaring: {},
    managerOverallRating: undefined,
    appreciation: '',
    improvementAreas: '',
  });
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  useEffect(() => {
    loadSentFeedbacks();
    loadUsers();
  }, []);

  useEffect(() => {
    if (user) {
      setNewFeedback(prev => ({
        ...prev,
        feedbackProvider: `${user.firstName} ${user.lastName}`,
        receiverId: user.manager?.id || '',
      }));
    }
  }, [user]);

  const loadSentFeedbacks = async () => {
    try {
      setLoading(true);
      const response = await feedbackAPI.getManagerSent();
      setSentFeedbacks(response.data);
    } catch (error) {
      console.error('Error loading sent manager feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await usersAPI.getAll();
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleSort = (
    key:
      | 'year'
      | 'quarter'
      | 'manager'
      | 'satisfaction'
      | 'rating'
  ) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const getSortedFeedbacks = () => {
    if (!sentFeedbacks.length) return [];
    return [...sentFeedbacks].sort((a, b) => {
      let aValue: any, bValue: any;
      switch (sortConfig.key) {
        case 'year':
          aValue = parseInt(a.year) || 0;
          bValue = parseInt(b.year) || 0;
          break;
        case 'quarter':
          const aYear = parseInt(a.year) || 0;
          const bYear = parseInt(b.year) || 0;
          if (aYear !== bYear) {
            aValue = aYear;
            bValue = bYear;
          } else {
            aValue = a.quarter;
            bValue = b.quarter;
          }
          break;
        case 'manager':
          aValue =
            `${a.receiver.firstName} ${a.receiver.lastName}`.toLowerCase();
          bValue =
            `${b.receiver.firstName} ${b.receiver.lastName}`.toLowerCase();
          break;
        case 'satisfaction':
          aValue = a.managerSatisfaction || '';
          bValue = b.managerSatisfaction || '';
          break;
        case 'rating':
          aValue = a.managerOverallRating || 0;
          bValue = b.managerOverallRating || 0;
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

  const handleInputChange = (
    field: keyof NewManagerFeedback,
    value: string | number | boolean | any
  ) => {
    setNewFeedback(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLeadershipStyleChange = (statement: string, rating: string) => {
    setNewFeedback(prev => ({
      ...prev,
      leadershipStyle: {
        ...prev.leadershipStyle,
        [statement]: rating,
      },
    }));
  };

  const handleCareerGrowthChange = (statement: string, rating: string) => {
    setNewFeedback(prev => ({
      ...prev,
      careerGrowth: {
        ...prev.careerGrowth,
        [statement]: rating,
      },
    }));
  };

  const handleCoachingCaringChange = (statement: string, rating: string) => {
    setNewFeedback(prev => ({
      ...prev,
      coachingCaring: {
        ...prev.coachingCaring,
        [statement]: rating,
      },
    }));
  };

  const handleSubmitFeedback = async () => {
    if (
      !newFeedback.receiverId ||
      !newFeedback.year ||
      !newFeedback.quarter ||
      !newFeedback.managerSatisfaction
    ) {
      setNotification({
        type: 'error',
        message: 'Please fill in all required fields.',
      });
      return;
    }
    try {
      setSubmitting(true);
      await feedbackAPI.createManager(newFeedback);
      setNotification({
        type: 'success',
        message: 'Manager feedback submitted successfully!',
      });
      setNewFeedback({
        receiverId: '',
        year: previousQuarter.year,
        quarter: previousQuarter.quarter,
        feedbackProvider: '',
        managerSatisfaction: '',
        leadershipStyle: {},
        careerGrowth: {},
        coachingCaring: {},
        managerOverallRating: undefined,
        appreciation: '',
        improvementAreas: '',
      });
      setActiveTab('view');
      await loadSentFeedbacks();
    } catch (error: any) {
      console.error('Error submitting manager feedback:', error);
      
      // Extract error message from various possible locations
      let errorMessage = 'Failed to submit manager feedback. Please try again.';
      
      if (error.response) {
        // Check for validation errors
        if (error.response.data?.errors && Array.isArray(error.response.data.errors)) {
          const validationErrors = error.response.data.errors
            .map((err: any) => err.msg || err.message || `${err.param}: ${err.msg}`)
            .join(', ');
          errorMessage = `Validation error: ${validationErrors}`;
        } 
        // Check for error message
        else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
        // Check for error field
        else if (error.response.data?.error) {
          // Map error codes to user-friendly messages
          const errorCode = error.response.data.error;
          switch (errorCode) {
            case 'DUPLICATE_ENTRY':
              errorMessage = 'A feedback entry for this manager, year, and quarter already exists. Please select a different period or edit the existing feedback.';
              break;
            case 'FOREIGN_KEY_VIOLATION':
              errorMessage = 'Invalid manager or user information. Please refresh the page and try again.';
              break;
            case 'RECORD_NOT_FOUND':
              errorMessage = 'Required information not found. Please refresh the page and try again.';
              break;
            default:
              errorMessage = error.response.data.message || `Error: ${errorCode}`;
          }
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setNotification({
        type: 'error',
        message: errorMessage,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFeedbacks = sentFeedbacks;

  const renderFeedbackCard = (feedback: ManagerFeedbackItem) => (
    <div
      key={feedback.id}
      className='bg-white rounded-lg shadow-md p-6 border border-gray-200'
    >
      <div className='flex justify-between items-start mb-4'>
        <div>
          <h3 className='text-lg font-semibold text-gray-900'>
            To: {feedback.receiver.firstName} {feedback.receiver.lastName}
          </h3>
          <p className='text-sm text-gray-600'>
            {feedback.receiver.userTeams
              ?.filter(ut => ut.isActive)
              .map(ut => ut.team.name)
              .join(', ')}
            {feedback.receiver.position && ` • ${feedback.receiver.position}`}
          </p>
        </div>
        <div className='text-right'>
          {feedback.managerOverallRating && (
            <div className='text-yellow-500 text-lg'>
              {'★'.repeat(feedback.managerOverallRating) +
                '☆'.repeat(5 - feedback.managerOverallRating)}
            </div>
          )}
          <p className='text-sm text-gray-500'>
            {new Date(feedback.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className='mb-4'>
        <div className='flex justify-between items-center mb-2'>
          <span className='inline-block bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full'>
            {feedback.year} - {feedback.quarter}
          </span>
        </div>
      </div>
      {feedback.appreciation && (
        <div className='mt-4 p-3 bg-gray-50 rounded-md'>
          <h4 className='text-sm font-medium text-gray-700 mb-2'>
            Appreciation:
          </h4>
          <p className='text-sm text-gray-600 whitespace-pre-wrap'>
            {feedback.appreciation}
          </p>
        </div>
      )}
      {feedback.improvementAreas && (
        <div className='mt-4 p-3 bg-gray-50 rounded-md'>
          <h4 className='text-sm font-medium text-gray-700 mb-2'>
            Improvement Areas:
          </h4>
          <p className='text-sm text-gray-600 whitespace-pre-wrap'>
            {feedback.improvementAreas}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div id='manager-feedback-page' className='p-6'>
      <div className='max-w-4xl mx-auto'>
        <h1
          id='manager-feedback-title'
          className='text-2xl font-bold text-gray-900 mb-6'
        >
          Manager Feedback
        </h1>
        {/* Tab Navigation */}
        <div
          id='manager-feedback-tabs'
          className='border-b border-gray-200 mb-6'
        >
          <nav className='-mb-px flex space-x-8'>
            <button
              id='view-manager-feedback-tab'
              onClick={() => setActiveTab('view')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'view'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Past Feedbacks
            </button>
            <button
              id='create-manager-feedback-tab'
              onClick={() => setActiveTab('create')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'create'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Give New Feedback
            </button>
          </nav>
        </div>
        {/* View Past Feedbacks Tab */}
        {activeTab === 'view' && (
          <div id='view-manager-feedback-section'>
            <div className='bg-white rounded-lg shadow-md p-6'>
              <h2
                id='past-manager-feedback-title'
                className='text-xl font-semibold text-gray-900 mb-4'
              >
                Your Past Manager Feedbacks
              </h2>
              {loading ? (
                <div id='manager-feedback-loading' className='text-center py-8'>
                  <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto'></div>
                  <p className='mt-2 text-gray-600'>Loading feedback...</p>
                </div>
              ) : filteredFeedbacks.length === 0 ? (
                <div
                  id='no-manager-feedback-message'
                  className='text-center py-8'
                >
                  <p className='text-gray-500'>No feedback found.</p>
                </div>
              ) : (
                <div
                  id='manager-feedback-table-container'
                  className='overflow-x-auto'
                >
                  <table
                    id='manager-feedback-table'
                    className='min-w-full divide-y divide-gray-200'
                  >
                    <thead className='bg-gray-50'>
                      <tr>
                        <th
                          id='sort-manager-year-header'
                          className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
                          onClick={() => handleSort('year')}
                        >
                          <div className='flex items-center'>
                            Year
                            {sortConfig.key === 'year' && (
                              <span className='ml-1'>
                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                        <th
                          id='sort-manager-quarter-header'
                          className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
                          onClick={() => handleSort('quarter')}
                        >
                          <div className='flex items-center'>
                            Quarter
                            {sortConfig.key === 'quarter' && (
                              <span className='ml-1'>
                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                        <th
                          id='sort-manager-name-header'
                          className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
                          onClick={() => handleSort('manager')}
                        >
                          <div className='flex items-center'>
                            Manager
                            {sortConfig.key === 'manager' && (
                              <span className='ml-1'>
                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                        <th
                          id='sort-manager-satisfaction-header'
                          className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
                          onClick={() => handleSort('satisfaction')}
                        >
                          <div className='flex items-center'>
                            Satisfaction
                            {sortConfig.key === 'satisfaction' && (
                              <span className='ml-1'>
                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                        <th
                          id='sort-manager-rating-header'
                          className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
                          onClick={() => handleSort('rating')}
                        >
                          <div className='flex items-center'>
                            Rating
                            {sortConfig.key === 'rating' && (
                              <span className='ml-1'>
                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody
                      id='manager-feedback-table-body'
                      className='bg-white divide-y divide-gray-200'
                    >
                      {getSortedFeedbacks().map(feedback => (
                        <tr
                          key={feedback.id}
                          id={`manager-feedback-row-${feedback.id}`}
                          className='hover:bg-gray-50'
                        >
                          <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                            {feedback.year}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                            {feedback.quarter}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                            {feedback.receiver.firstName}{' '}
                            {feedback.receiver.lastName}
                            {feedback.receiver.userTeams?.filter(
                              ut => ut.isActive
                            ).length && (
                              <div className='text-xs text-gray-500'>
                                {feedback.receiver.userTeams
                                  ?.filter(ut => ut.isActive)
                                  .map(ut => ut.team.name)
                                  .join(', ')}
                              </div>
                            )}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                            {feedback.managerSatisfaction || 'N/A'}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                            {feedback.managerOverallRating ? (
                              <div className='flex items-center'>
                                <span className='text-lg font-semibold text-indigo-600 mr-1'>
                                  {feedback.managerOverallRating}
                                </span>
                                <span className='text-xs text-gray-500'>
                                  / 5
                                </span>
                              </div>
                            ) : (
                              'N/A'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
        {/* Create New Feedback Tab */}
        {activeTab === 'create' && (
          <div id='create-manager-feedback-section'>
            <div className='bg-white rounded-lg shadow-md p-6'>
              <h2
                id='new-manager-feedback-title'
                className='text-xl font-semibold text-gray-900 mb-4'
              >
                Give New Manager Feedback
              </h2>
              <p
                id='new-manager-feedback-description'
                className='text-gray-600 mb-6'
              >
                Provide constructive feedback to help your managers grow and
                improve.
              </p>
              <div id='manager-feedback-form' className='space-y-6'>
                {/* Feedback Provider */}
                <div id='manager-feedback-provider-section'>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Manager Feedback Provider
                  </label>
                  <input
                    id='manager-feedback-provider-input'
                    type='text'
                    value={newFeedback.feedbackProvider}
                    readOnly
                    className='w-full p-3 border border-gray-300 rounded-md bg-gray-50 text-gray-500'
                  />
                  <p className='text-xs text-gray-500 mt-1'>
                    This field is automatically populated with your name.
                  </p>
                </div>
                {/* Manager (auto-filled and read-only) */}
                <div id='manager-selection-section'>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Manager *
                  </label>
                  <input
                    id='manager-input'
                    type='text'
                    value={
                      user?.manager
                        ? `${user.manager.firstName} ${user.manager.lastName}`
                        : 'No manager assigned'
                    }
                    readOnly
                    className='w-full p-3 border border-gray-300 rounded-md bg-gray-50 text-gray-700'
                  />

                  {!user?.manager && (
                    <p
                      id='no-manager-error'
                      className='text-xs text-red-500 mt-1'
                    >
                      You need to have a manager assigned to give manager
                      feedback.
                    </p>
                  )}
                </div>
                {/* Year */}
                <div id='manager-feedback-year-section'>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Feedback Year *
                  </label>
                  <select
                    id='manager-year-select'
                    value={newFeedback.year}
                    onChange={e => handleInputChange('year', e.target.value)}
                    className='w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50'
                    disabled
                  >
                    <option value={previousQuarter.year}>
                      {previousQuarter.year}
                    </option>
                  </select>
                  <p className='text-xs text-gray-500 mt-1'>
                    Only the previous quarter ({previousQuarter.quarter} {previousQuarter.year}) can be selected for feedback.
                  </p>
                </div>
                {/* Quarter */}
                <div id='manager-feedback-quarter-section'>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Feedback Quarter *
                  </label>
                  <select
                    id='manager-quarter-select'
                    value={newFeedback.quarter}
                    onChange={e => handleInputChange('quarter', e.target.value)}
                    className='w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50'
                    disabled
                  >
                    <option value={previousQuarter.quarter}>
                      {previousQuarter.quarter} (
                      {previousQuarter.quarter === 'Q1' && 'January - March'}
                      {previousQuarter.quarter === 'Q2' && 'April - June'}
                      {previousQuarter.quarter === 'Q3' && 'July - September'}
                      {previousQuarter.quarter === 'Q4' && 'October - December'}
                      )
                    </option>
                  </select>
                  <p className='text-xs text-gray-500 mt-1'>
                    Only the previous quarter can be selected for feedback.
                  </p>
                </div>
                {/* Satisfaction radio group */}
                <div id='manager-satisfaction-section'>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    How satisfied are you with your manager? *
                  </label>
                  <div
                    id='satisfaction-options'
                    className='flex flex-col space-y-2'
                  >
                    {[
                      'Very Satisfied',
                      'Somewhat Satisfied',
                      'Neither satisfied nor dissatisfied',
                      'Somewhat dissatisfied',
                      'Very dissatisfied',
                    ].map(option => (
                      <label key={option} className='inline-flex items-center'>
                        <input
                          id={`satisfaction-${option
                            .toLowerCase()
                            .replace(/\s+/g, '-')}`}
                          type='radio'
                          name='managerSatisfaction'
                          value={option}
                          checked={newFeedback.managerSatisfaction === option}
                          onChange={e =>
                            handleInputChange(
                              'managerSatisfaction',
                              e.target.value
                            )
                          }
                          className='h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300'
                        />
                        <span className='ml-2 text-gray-700'>{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {/* Matrix fields (Image 1-5) */}
                {/* 1. Leadership style (Likert) */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    With regard to your manager's <b>leadership style</b>, how
                    strongly do you agree or disagree with the following?
                  </label>
                  <table className='min-w-full border text-center bg-gray-50'>
                    <thead>
                      <tr>
                        <th className='px-2 py-1'></th>
                        {[
                          'Strongly disagree',
                          'Disagree',
                          'Neither agree nor disagree',
                          'Agree',
                          'Strongly agree',
                        ].map(level => (
                          <th key={level} className='px-2 py-1 font-normal'>
                            {level}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        'Advocates for their employees',
                        'Respects their direct employees',
                        'Gives clear instructions when assigning tasks',
                        'Always makes themselves available when needed',
                        'Praises employees when they perform well',
                        'Always has a positive attitude when met with challenges',
                        'Has patience for lengthy discussions',
                      ].map(statement => (
                        <tr
                          key={statement}
                          className='bg-white even:bg-gray-50'
                        >
                          <td className='px-2 py-1 text-left'>{statement}</td>
                          {[
                            'Strongly disagree',
                            'Disagree',
                            'Neither agree nor disagree',
                            'Agree',
                            'Strongly agree',
                          ].map(level => (
                            <td key={level}>
                              <input
                                type='radio'
                                name={`leadership-${statement}`}
                                value={level}
                                checked={
                                  newFeedback.leadershipStyle?.[statement] ===
                                  level
                                }
                                onChange={() =>
                                  handleLeadershipStyleChange(statement, level)
                                }
                                className='h-4 w-4'
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* 4. Career growth (Likert) */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    With regard to your manager's advocacy for{' '}
                    <b>career growth</b>, how strongly do you agree or disagree
                    with the following?
                  </label>
                  <table className='min-w-full border text-center bg-gray-50'>
                    <thead>
                      <tr>
                        <th className='px-2 py-1'></th>
                        {[
                          'Strongly disagree',
                          'Disagree',
                          'Neither agree nor disagree',
                          'Agree',
                          'Strongly agree',
                        ].map(level => (
                          <th key={level} className='px-2 py-1 font-normal'>
                            {level}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        "I'm satisfied with my current career growth.",
                        'My manager is dedicated to my professional development.',
                        "I'm satisfied with the opportunities for me to apply my talents and expertise.",
                        "I'm satisfied with the job-related training my organization offers.",
                        'I have sufficient opportunity to grow in my career',
                      ].map(statement => (
                        <tr
                          key={statement}
                          className='bg-white even:bg-gray-50'
                        >
                          <td className='px-2 py-1 text-left'>{statement}</td>
                          {[
                            'Strongly disagree',
                            'Disagree',
                            'Neither agree nor disagree',
                            'Agree',
                            'Strongly agree',
                          ].map(level => (
                            <td key={level}>
                              <input
                                type='radio'
                                name={`career-${statement}`}
                                value={level}
                                checked={
                                  newFeedback.careerGrowth?.[statement] ===
                                  level
                                }
                                onChange={() =>
                                  handleCareerGrowthChange(statement, level)
                                }
                                className='h-4 w-4'
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Coaching and Caring (Likert) */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    With regard to your manager's <b>coaching and caring</b>,
                    how strongly do you agree or disagree with the following?
                  </label>
                  <table className='min-w-full border text-center bg-gray-50'>
                    <thead>
                      <tr>
                        <th className='px-2 py-1'></th>
                        {[
                          'Strongly disagree',
                          'Disagree',
                          'Neither agree nor disagree',
                          'Agree',
                          'Strongly agree',
                        ].map(level => (
                          <th key={level} className='px-2 py-1 font-normal'>
                            {level}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        'Respects my ideas',
                        'Makes me feel comfortable',
                        'Encourages me to think outside the box',
                        'Shows growth mindset',
                        'Supports my ideas',
                        'Shares useful resources',
                      ].map(statement => (
                        <tr
                          key={statement}
                          className='bg-white even:bg-gray-50'
                        >
                          <td className='px-2 py-1 text-left'>{statement}</td>
                          {[
                            'Strongly disagree',
                            'Disagree',
                            'Neither agree nor disagree',
                            'Agree',
                            'Strongly agree',
                          ].map(level => (
                            <td key={level}>
                              <input
                                type='radio'
                                name={`coaching-${statement}`}
                                value={level}
                                checked={
                                  newFeedback.coachingCaring?.[statement] ===
                                  level
                                }
                                onChange={() =>
                                  handleCoachingCaringChange(statement, level)
                                }
                                className='h-4 w-4'
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Manager overall rating (1-5) */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    How would you rate your manager on a scale of 5?
                  </label>
                  <div className='flex space-x-4'>
                    {[1, 2, 3, 4, 5].map(num => (
                      <label key={num} className='flex flex-col items-center'>
                        <input
                          type='radio'
                          name='managerOverallRating'
                          value={num}
                          checked={newFeedback.managerOverallRating === num}
                          onChange={e =>
                            handleInputChange(
                              'managerOverallRating',
                              parseInt(e.target.value)
                            )
                          }
                          className='h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300'
                        />
                        <span className='mt-1 text-xs text-gray-700'>
                          {num}
                        </span>
                      </label>
                    ))}
                  </div>
                  <div className='flex justify-between text-xs text-gray-500 mt-1'>
                    <span>1 - Lowest</span>
                    <span>5 - Highest</span>
                  </div>
                </div>
                {/* Appreciation */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Appreciation
                  </label>
                  <textarea
                    id='appreciation-textarea'
                    value={newFeedback.appreciation || ''}
                    onChange={e =>
                      handleInputChange('appreciation', e.target.value)
                    }
                    placeholder='Please share what you appreciate about your manager...'
                    className='w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-vertical'
                    rows={4}
                  />
                  <p className='text-xs text-gray-500 mt-1'>
                    This is optional but can provide valuable positive feedback for your manager.
                  </p>
                </div>
                {/* Improvement Areas */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Improvement Areas
                  </label>
                  <textarea
                    id='improvement-areas-textarea'
                    value={newFeedback.improvementAreas || ''}
                    onChange={e =>
                      handleInputChange('improvementAreas', e.target.value)
                    }
                    placeholder='Please share areas where your manager could improve...'
                    className='w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-vertical'
                    rows={4}
                  />
                  <p className='text-xs text-gray-500 mt-1'>
                    This is optional but can provide valuable constructive feedback for your manager's development.
                  </p>
                </div>
                {/* Submit Button */}
                <div className='flex justify-end space-x-3'>
                  <button
                    onClick={() => {
                      setNewFeedback({
                        receiverId: '',
                        year: previousQuarter.year,
                        quarter: previousQuarter.quarter,
                        feedbackProvider: '',
                        managerSatisfaction: '',
                        leadershipStyle: {},
                        careerGrowth: {},
                        coachingCaring: {},
                        managerOverallRating: undefined,
                        appreciation: '',
                        improvementAreas: '',
                      });
                      setActiveTab('view');
                    }}
                    className='px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50'
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitFeedback}
                    disabled={submitting}
                    className='px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {submitting ? 'Submitting...' : 'Submit Manager Feedback'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {notification && (
        <ToastNotification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default ManagerFeedback;
