import React, { useCallback, useEffect, useState } from 'react';
import ColleagueFeedbackPastTable from '../components/ColleagueFeedbackPastTable';
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

interface FeedbackItem {
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
  rating: number;
  year: string;
  quarter: string;
  status: string;
  isAnonymous: boolean;
  appreciation: string;
  improvement: string;
  wouldWorkAgain: boolean;
  createdAt: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
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
  userBusinessUnits?: Array<{
    id: string;
    joinedAt: string;
    isActive: boolean;
    businessUnit: {
      id: string;
      name: string;
      description?: string;
    };
  }>;
}

interface NewFeedback {
  receiverId: string;
  rating: number;
  year: string;
  quarter: string;
  isAnonymous: boolean;
  feedbackProvider: string;
  appreciation: string;
  improvement: string;
  wouldWorkAgain: boolean;
}

const ColleagueFeedback: React.FC = () => {
  const { user } = useAuth();
  const [sentFeedbacks, setSentFeedbacks] = useState<FeedbackItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserBusinessUnitIds, setCurrentUserBusinessUnitIds] = useState<Set<string>>(new Set());
  const [usersByBusinessUnit, setUsersByBusinessUnit] = useState<Record<string, { users: User[]; isMyBusinessUnit: boolean }>>({});
  const [sortedBusinessUnits, setSortedBusinessUnits] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'view' | 'create'>('view');

  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning';
  } | null>(null);
  // Get previous quarter as default
  const previousQuarter = getPreviousQuarter();

  const [newFeedback, setNewFeedback] = useState<NewFeedback>({
    receiverId: '',
    rating: 0,
    year: previousQuarter.year,
    quarter: previousQuarter.quarter,
    isAnonymous: false,
    feedbackProvider: '',
    appreciation: '',
    improvement: '',
    wouldWorkAgain: true,
  });

  const loadUsers = useCallback(async () => {
    try {
      // Get current user's business unit IDs first
      const currentUserResponse = await usersAPI.getById(user!.id);
      const currentUserBusUnits = (currentUserResponse.data.userBusinessUnits || [])
        .filter((ubu: any) => ubu.isActive);
      
      const currentUserBusUnitIds = new Set<string>(
        currentUserBusUnits.map((ubu: any) => String(ubu.businessUnit.id))
      );
      const currentUserBusUnitNames = new Set<string>(
        currentUserBusUnits.map((ubu: any) => String(ubu.businessUnit.name))
      );
      
      console.log('Current user ID:', user!.id);
      console.log('Current user business units:', currentUserBusUnits);
      console.log('Current user business unit IDs:', Array.from(currentUserBusUnitIds));
      console.log('Current user business unit names:', Array.from(currentUserBusUnitNames));
      
      setCurrentUserBusinessUnitIds(currentUserBusUnitIds);
      
      // Get all users (excluding current user)
      const response = await usersAPI.getAll();
      const allUsers = response.data.filter((u: User) => u.id !== user!.id);
      
      console.log('Total users (excluding self):', allUsers.length);
      
      // Group users by business unit
      const usersByBusinessUnit: Record<string, { users: User[]; isMyBusinessUnit: boolean }> = {};
      
      allUsers.forEach((userItem: User) => {
        const userBusinessUnits = (userItem.userBusinessUnits || [])
          .filter((ubu: any) => ubu.isActive);
        
        if (userBusinessUnits.length === 0) {
          // Users without business units go to "No Business Unit"
          if (!usersByBusinessUnit['No Business Unit']) {
            usersByBusinessUnit['No Business Unit'] = { users: [], isMyBusinessUnit: false };
          }
          usersByBusinessUnit['No Business Unit'].users.push(userItem);
        } else {
          userBusinessUnits.forEach((ubu: any) => {
            const buName = String(ubu.businessUnit.name);
            const buId = String(ubu.businessUnit.id);
            const isMyBusinessUnit = currentUserBusUnitIds.has(buId);
            
            if (!usersByBusinessUnit[buName]) {
              usersByBusinessUnit[buName] = { users: [], isMyBusinessUnit };
            }
            
            // Only add user if not already added (users can be in multiple BUs)
            if (!usersByBusinessUnit[buName].users.find(u => u.id === userItem.id)) {
              usersByBusinessUnit[buName].users.push(userItem);
            }
          });
        }
      });
      
      console.log('Users by business unit:', usersByBusinessUnit);
      
      // Sort users within each business unit alphabetically
      Object.keys(usersByBusinessUnit).forEach(buName => {
        usersByBusinessUnit[buName].users.sort((a, b) => {
          const aName = `${a.lastName} ${a.firstName}`.toLowerCase();
          const bName = `${b.lastName} ${b.firstName}`.toLowerCase();
          return aName.localeCompare(bName);
        });
      });
      
      // Sort business units: my business units first, then others alphabetically
      const sortedBusinessUnits = Object.keys(usersByBusinessUnit).sort((a, b) => {
        const aIsMine = usersByBusinessUnit[a].isMyBusinessUnit;
        const bIsMine = usersByBusinessUnit[b].isMyBusinessUnit;
        
        if (aIsMine && !bIsMine) return -1;
        if (!aIsMine && bIsMine) return 1;
        
        return a.localeCompare(b);
      });
      
      // Store the grouped data for rendering
      setUsers(allUsers); // Keep for compatibility
      setUsersByBusinessUnit(usersByBusinessUnit);
      setSortedBusinessUnits(sortedBusinessUnits);
      
      console.log('Users grouped by business unit:', usersByBusinessUnit);
      console.log('Sorted business units:', sortedBusinessUnits);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }, [user]);

  const loadSentFeedbacks = async () => {
    try {
      setLoading(true);
      const response = await feedbackAPI.getColleagueSent();
      setSentFeedbacks(response.data);
    } catch (error) {
      console.error('Error loading sent feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load sent feedbacks and users on component mount
  useEffect(() => {
    loadSentFeedbacks();
    loadUsers();
  }, [loadUsers]);

  // Update feedbackProvider when isAnonymous changes
  useEffect(() => {
    if (user) {
      setNewFeedback(prev => ({
        ...prev,
        feedbackProvider: prev.isAnonymous
          ? 'Anonymous'
          : `${user.firstName} ${user.lastName}`,
      }));
    }
  }, [newFeedback.isAnonymous, user]);

  const handleInputChange = (
    field: keyof NewFeedback,
    value: string | number | boolean
  ) => {
    setNewFeedback(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmitFeedback = async () => {
    if (
      !newFeedback.receiverId ||
      !newFeedback.year ||
      !newFeedback.quarter ||
      !newFeedback.appreciation ||
      !newFeedback.improvement ||
      !newFeedback.rating
    ) {
      setNotification({
        message: 'Please fill in all required fields.',
        type: 'warning',
      });
      return;
    }

    try {
      setSubmitting(true);
      await feedbackAPI.createColleague(newFeedback);

      setNotification({
        message: 'Feedback submitted successfully!',
        type: 'success',
      });

      // Reset form (keep previous quarter as default)
      setNewFeedback({
        receiverId: '',
        rating: 0,
        year: previousQuarter.year,
        quarter: previousQuarter.quarter,
        isAnonymous: false,
        feedbackProvider: '',
        appreciation: '',
        improvement: '',
        wouldWorkAgain: true,
      });

      // Switch to view tab and reload feedbacks
      setActiveTab('view');
      await loadSentFeedbacks();
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      
      // Extract error message from various possible locations
      let errorMessage = 'Failed to submit feedback. Please try again.';
      
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
              errorMessage = 'A feedback entry for this colleague, year, and quarter already exists. Please select a different period or edit the existing feedback.';
              break;
            case 'FOREIGN_KEY_VIOLATION':
              errorMessage = 'Invalid colleague or user information. Please refresh the page and try again.';
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
        message: errorMessage,
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id='colleague-feedback-page' className='p-6'>
      <div className='max-w-4xl mx-auto'>
        <h1
          id='colleague-feedback-title'
          className='text-2xl font-bold text-gray-900 mb-6'
        >
          Colleague Feedback
        </h1>

        {/* Tab Navigation */}
        <div id='feedback-tabs' className='border-b border-gray-200 mb-6'>
          <nav className='-mb-px flex space-x-8'>
            <button
              id='view-feedback-tab'
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
              id='create-feedback-tab'
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
          <div id='view-feedback-section'>
            <ColleagueFeedbackPastTable
              feedbacks={sentFeedbacks}
              loading={loading}
              title='Your Past Colleague Feedbacks'
              showReceiver={true}
            />
          </div>
        )}

        {/* Create New Feedback Tab */}
        {activeTab === 'create' && (
          <div id='create-feedback-section'>
            <div className='bg-white rounded-lg shadow-md p-6'>
              <h2
                id='new-feedback-title'
                className='text-xl font-semibold text-gray-900 mb-4'
              >
                Give New Colleague Feedback
              </h2>
              <p id='new-feedback-description' className='text-gray-600 mb-6'>
                Provide constructive feedback to help your colleagues grow and
                improve.
              </p>

              <div id='feedback-form' className='space-y-6'>
                {/* Anonymous Feedback Checkbox */}
                <div id='anonymous-feedback-section'>
                  <label className='flex items-center'>
                    <input
                      id='anonymous-checkbox'
                      type='checkbox'
                      checked={newFeedback.isAnonymous}
                      onChange={e =>
                        handleInputChange('isAnonymous', e.target.checked)
                      }
                      className='h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded'
                    />
                    <span className='ml-2 text-sm font-medium text-gray-700'>
                      Anonymous Colleague Feedback
                    </span>
                  </label>
                </div>

                {/* Feedback Provider */}
                <div id='feedback-provider-section'>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Colleague Feedback Provider
                  </label>
                  <input
                    id='feedback-provider-input'
                    type='text'
                    value={newFeedback.feedbackProvider}
                    readOnly
                    className='w-full p-3 border border-gray-300 rounded-md bg-gray-50 text-gray-500'
                  />
                  <p className='text-xs text-gray-500 mt-1'>
                    This field is automatically populated based on your
                    anonymous selection for colleague feedback.
                  </p>
                </div>

                {/* Recipient Selection */}
                <div id='recipient-selection-section'>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Select Colleague to Give Feedback To *
                  </label>
                  <select
                    id='recipient-select'
                    value={newFeedback.receiverId}
                    onChange={e =>
                      handleInputChange('receiverId', e.target.value)
                    }
                    className='w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                  >
                    <option value=''>
                      Select a colleague to give feedback to
                    </option>
                    {sortedBusinessUnits.length > 0 ? (
                      // Use pre-grouped data - user's business units first, then others
                      sortedBusinessUnits.map((buName: string) => {
                        const group = usersByBusinessUnit[buName];
                        if (!group || group.users.length === 0) return null;
                        
                        const label = group.isMyBusinessUnit
                          ? `★ ${buName} (${group.users.length})`
                          : `${buName} (${group.users.length})`;
                        
                        return (
                          <optgroup key={buName} label={label}>
                            {group.users.map(userItem => (
                              <option key={userItem.id} value={userItem.id}>
                                {userItem.firstName} {userItem.lastName}
                              </option>
                            ))}
                          </optgroup>
                        );
                      })
                    ) : (
                      // Fallback: if grouped data not available yet, show simple list
                      // Sort users: same business unit first, then others
                      (() => {
                        const myBusinessUnitUsers: User[] = [];
                        const otherUsers: User[] = [];
                        
                        users.forEach(userItem => {
                          const userBusinessUnitIds = new Set(
                            (userItem.userBusinessUnits || [])
                              .filter((ubu: any) => ubu.isActive)
                              .map((ubu: any) => String(ubu.businessUnit.id))
                          );
                          const sharesBusinessUnit = Array.from(currentUserBusinessUnitIds).some(
                            id => userBusinessUnitIds.has(id)
                          );
                          
                          if (sharesBusinessUnit) {
                            myBusinessUnitUsers.push(userItem);
                          } else {
                            otherUsers.push(userItem);
                          }
                        });
                        
                        // Sort within each group
                        myBusinessUnitUsers.sort((a, b) => {
                          const aName = `${a.lastName} ${a.firstName}`.toLowerCase();
                          const bName = `${b.lastName} ${b.firstName}`.toLowerCase();
                          return aName.localeCompare(bName);
                        });
                        
                        otherUsers.sort((a, b) => {
                          const aName = `${a.lastName} ${a.firstName}`.toLowerCase();
                          const bName = `${b.lastName} ${b.firstName}`.toLowerCase();
                          return aName.localeCompare(bName);
                        });
                        
                        return (
                          <>
                            {myBusinessUnitUsers.length > 0 && (
                              <optgroup label={`★ My Business Unit (${myBusinessUnitUsers.length})`}>
                                {myBusinessUnitUsers.map(userItem => (
                                  <option key={userItem.id} value={userItem.id}>
                                    {userItem.firstName} {userItem.lastName}
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            {otherUsers.length > 0 && (
                              <optgroup label={`Other Users (${otherUsers.length})`}>
                                {otherUsers.map(userItem => {
                                  const userBusinessUnits = (userItem.userBusinessUnits || [])
                                    .filter((ubu: any) => ubu.isActive)
                                    .map((ubu: any) => ubu.businessUnit.name);
                                  
                                  const displayName = `${userItem.firstName} ${userItem.lastName}`;
                                  const businessUnitLabel = userBusinessUnits.length > 0
                                    ? ` (${userBusinessUnits.join(', ')})`
                                    : '';
                                  
                                  return (
                                    <option key={userItem.id} value={userItem.id}>
                                      {displayName}
                                      {businessUnitLabel}
                                    </option>
                                  );
                                })}
                              </optgroup>
                            )}
                          </>
                        );
                      })()
                    )}
                  </select>
                  <p className='text-xs text-gray-500 mt-1'>
                    You can select any user in the system. Users are grouped by Business Unit, with your business unit(s) marked with ★ and listed first.
                  </p>
                </div>

                {/* Year */}
                <div id='feedback-year-section'>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Feedback Year *
                  </label>
                  <select
                    id='year-select'
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
                <div id='feedback-quarter-section'>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Feedback Quarter *
                  </label>
                  <select
                    id='quarter-select'
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

                {/* What do you appreciate most about this colleague */}
                <div id='appreciation-section'>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    What do you appreciate most about this colleague's work? *
                  </label>
                  <textarea
                    id='appreciation-textarea'
                    value={newFeedback.appreciation}
                    onChange={e =>
                      handleInputChange('appreciation', e.target.value)
                    }
                    placeholder='Share what you value and appreciate about this colleague...'
                    rows={4}
                    className='w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                  />
                </div>

                {/* What could this colleague improve */}
                <div id='improvement-section'>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    What could this colleague improve in their work? *
                  </label>
                  <textarea
                    id='improvement-textarea'
                    value={newFeedback.improvement}
                    onChange={e =>
                      handleInputChange('improvement', e.target.value)
                    }
                    placeholder='Provide constructive suggestions for improvement...'
                    rows={4}
                    className='w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                  />
                </div>

                {/* Overall Performance Rating */}
                <div id='rating-section'>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    How would you rate this colleague's overall work
                    performance? *
                  </label>
                  <div id='rating-buttons' className='flex space-x-2'>
                    {[1, 2, 3, 4, 5].map(rating => (
                      <button
                        key={rating}
                        id={`rating-button-${rating}`}
                        onClick={() => handleInputChange('rating', rating)}
                        className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${
                          newFeedback.rating === rating
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-300'
                        }`}
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                  <div className='flex justify-between text-sm text-gray-500 mt-1'>
                    <span>1 - Lowest</span>
                    <span>5 - Highest</span>
                  </div>
                </div>

                {/* Would you like to work with this colleague in future projects */}
                <div id='work-again-section'>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Would you like to work with this colleague again in future
                    projects? *
                  </label>
                  <div className='space-y-2'>
                    <label className='flex items-center'>
                      <input
                        id='work-again-yes'
                        type='radio'
                        name='wouldWorkAgain'
                        value='true'
                        checked={newFeedback.wouldWorkAgain === true}
                        onChange={() =>
                          handleInputChange('wouldWorkAgain', true)
                        }
                        className='h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300'
                      />
                      <span className='ml-2 text-sm text-gray-700'>Yes</span>
                    </label>
                    <label className='flex items-center'>
                      <input
                        id='work-again-no'
                        type='radio'
                        name='wouldWorkAgain'
                        value='false'
                        checked={newFeedback.wouldWorkAgain === false}
                        onChange={() =>
                          handleInputChange('wouldWorkAgain', false)
                        }
                        className='h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300'
                      />
                      <span className='ml-2 text-sm text-gray-700'>No</span>
                    </label>
                  </div>
                </div>

                {/* Submit Button */}
                <div
                  id='feedback-form-actions'
                  className='flex justify-end space-x-3'
                >
                  <button
                    id='cancel-feedback-button'
                    onClick={() => {
                      setNewFeedback({
                        receiverId: '',
                        rating: 0,
                        year: previousQuarter.year,
                        quarter: previousQuarter.quarter,
                        isAnonymous: false,
                        feedbackProvider: '',
                        appreciation: '',
                        improvement: '',
                        wouldWorkAgain: true,
                      });
                      setActiveTab('view');
                    }}
                    className='px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50'
                  >
                    Cancel
                  </button>
                  <button
                    id='submit-feedback-button'
                    onClick={handleSubmitFeedback}
                    disabled={submitting}
                    className='px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {submitting ? 'Submitting...' : 'Submit Colleague Feedback'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {notification && (
        <ToastNotification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default ColleagueFeedback;
