import React, { useState } from 'react';
import ToastNotification from '../components/Notification';
import SelfAssessmentsList from '../components/SelfAssessmentsList';
import { assessmentAPI } from '../services/api';

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

interface Question {
  id: string;
  text: string;
  category: string;
  type: 'rating' | 'text' | 'satisfaction';
}

interface Assessment {
  id: string;
  title: string;
  description: string;
  questions: Question[];
}

interface AssessmentData {
  quarter: string;
  year: string;
  answers: Record<string, any>;
}

const SelfAssessment: React.FC = () => {
  // Get previous quarter as default
  const previousQuarter = getPreviousQuarter();
  
  const [currentAssessment, setCurrentAssessment] = useState<Assessment | null>(
    null
  );
  const [assessmentData, setAssessmentData] = useState<AssessmentData>({
    quarter: previousQuarter.quarter,
    year: previousQuarter.year,
    answers: {},
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'view' | 'create'>('view');
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning';
  } | null>(null);

  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
  const years = Array.from({ length: 5 }, (_, i) =>
    (new Date().getFullYear() - 2 + i).toString()
  );
  const satisfactionOptions = [
    'Very Satisfied',
    'Somewhat Satisfied',
    'Neither Satisfied nor Dissatisfied',
    'Somewhat Dissatisfied',
    'Very Dissatisfied',
  ];

  const mockAssessment: Assessment = {
    id: '1',
    title: 'Quarterly Self Assessment',
    description:
      'Evaluate your performance and achievements for the selected quarter',
    questions: [
      {
        id: '1',
        text: 'How would you rate yourself between 1 to 5? (1 is lowest and 5 is highest)',
        category: 'self-rating',
        type: 'rating',
      },
      {
        id: '2',
        text: 'What are your key achievements in this quarter?',
        category: 'achievements',
        type: 'text',
      },
      {
        id: '3',
        text: 'What do you feel that you need to improve?',
        category: 'improvement',
        type: 'text',
      },
      {
        id: '4',
        text: 'How satisfied are you with your work?',
        category: 'satisfaction',
        type: 'satisfaction',
      },
      {
        id: '5',
        text: 'Do you have any specific expectations from the company in the current or next year (for example, any opportunities, support, growth etc)?',
        category: 'aspirations',
        type: 'text',
      },
      {
        id: '6',
        text: 'If you have power to change something in the team then what would you change?',
        category: 'team-changes',
        type: 'text',
      },
    ],
  };

  const handleQuarterChange = (quarter: string) => {
    setAssessmentData(prev => ({
      ...prev,
      quarter,
    }));
  };

  const handleYearChange = (year: string) => {
    setAssessmentData(prev => ({
      ...prev,
      year,
    }));
  };

  const checkExistingAssessment = () => {
    // This function is no longer needed since the SelfAssessmentsList component handles this
    return false;
  };

  const handleStartAssessment = () => {
    if (!assessmentData.quarter) {
      setNotification({
        message: 'Please select a quarter before starting the assessment.',
        type: 'warning',
      });
      return;
    }

    const existingAssessment = checkExistingAssessment();
    if (existingAssessment) {
      setNotification({
        message: `You already have an assessment for ${assessmentData.quarter} ${assessmentData.year}. Please select a different quarter or year.`,
        type: 'warning',
      });
      return;
    }

    setCurrentAssessment(mockAssessment);
    setCurrentStep(0);
    setAssessmentData(prev => ({
      ...prev,
      answers: {},
    }));
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    setAssessmentData(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: value,
      },
    }));
  };

  const handleNext = () => {
    if (
      currentAssessment &&
      currentStep < currentAssessment.questions.length - 1
    ) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      // Map answers to new structure
      const ratingQuestion = mockAssessment.questions.find(
        q => q.type === 'rating'
      );
      const achievementsQuestion = mockAssessment.questions.find(
        q => q.category === 'achievements'
      );
      const improvementsQuestion = mockAssessment.questions.find(
        q => q.category === 'improvement'
      );
      const satisfactionQuestion = mockAssessment.questions.find(
        q => q.type === 'satisfaction'
      );
      const aspirationsQuestion = mockAssessment.questions.find(
        q => q.category === 'aspirations'
      );
      const suggestionsQuestion = mockAssessment.questions.find(
        q => q.category === 'team-changes'
      );

      // Map satisfaction level to enum format
      const satisfactionMap: Record<string, string> = {
        'Very Satisfied': 'VERY_SATISFIED',
        'Somewhat Satisfied': 'SOMEWHAT_SATISFIED',
        'Neither Satisfied nor Dissatisfied': 'NEITHER',
        'Somewhat Dissatisfied': 'SOMEWHAT_DISSATISFIED',
        'Very Dissatisfied': 'VERY_DISSATISFIED',
      };

      // Create the assessment data structure using new format
      const assessmentDataToSubmit = {
        year: parseInt(assessmentData.year),
        quarter: assessmentData.quarter || null,
        rating: ratingQuestion?.id
          ? assessmentData.answers[ratingQuestion.id]
          : null,
        achievements: achievementsQuestion?.id
          ? assessmentData.answers[achievementsQuestion.id]
          : null,
        improvements: improvementsQuestion?.id
          ? assessmentData.answers[improvementsQuestion.id]
          : null,
        satisfactionLevel:
          satisfactionQuestion?.id &&
          assessmentData.answers[satisfactionQuestion.id]
            ? satisfactionMap[
                assessmentData.answers[satisfactionQuestion.id]
              ] || null
            : null,
        aspirations: aspirationsQuestion?.id
          ? assessmentData.answers[aspirationsQuestion.id]
          : null,
        suggestionsForTeam: suggestionsQuestion?.id
          ? assessmentData.answers[suggestionsQuestion.id]
          : null,
      };

      // Create the assessment
      await assessmentAPI.create(assessmentDataToSubmit);

      setNotification({
        message: 'Assessment submitted successfully!',
        type: 'success',
      });
      setCurrentAssessment(null);
      setAssessmentData({
        quarter: previousQuarter.quarter,
        year: previousQuarter.year,
        answers: {},
      });
      setCurrentStep(0);
      setActiveTab('view');
    } catch (error: any) {
      console.error('Error submitting assessment:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      
      // Extract error message from various possible locations
      let errorMessage = 'Failed to submit assessment. Please try again.';
      
      if (error.response?.data) {
        const responseData = error.response.data;
        
        // First, check for error code to provide user-friendly messages
        if (responseData.error) {
          const errorCode = responseData.error;
          switch (errorCode) {
            case 'DUPLICATE_ENTRY':
            case 'DUPLICATE_ASSESSMENT':
              errorMessage = 'An assessment for this period already exists. Please select a different period or edit the existing assessment.';
              break;
            case 'FOREIGN_KEY_VIOLATION':
              errorMessage = 'Invalid user information. Please refresh the page and try again.';
              break;
            case 'RECORD_NOT_FOUND':
              errorMessage = 'Required information not found. Please refresh the page and try again.';
              break;
            case 'INVALID_YEAR':
              errorMessage = 'Invalid year format. Please select a valid year.';
              break;
            default:
              // Use message if available, otherwise use error code
              errorMessage = responseData.message || `Error: ${errorCode}`;
          }
        }
        // Check for validation errors array
        else if (responseData.errors && Array.isArray(responseData.errors)) {
          const validationErrors = responseData.errors
            .map((err: any) => err.msg || err.message || `${err.param}: ${err.msg}`)
            .join(', ');
          errorMessage = `Validation error: ${validationErrors}`;
        } 
        // Check for error message as fallback
        else if (responseData.message) {
          errorMessage = responseData.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.log('Setting notification with message:', errorMessage);
      console.log('Full error object:', JSON.stringify(error, null, 2));
      
      // Set notification immediately
      setNotification({
        message: errorMessage,
        type: 'error',
      });
      
      // Force a re-render check
      console.log('Notification should be set. Check UI for error message.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question: Question) => {
    const currentAnswer = assessmentData.answers[question.id];

    if (question.type === 'rating') {
      return (
        <div className='space-y-4'>
          <p className='text-lg font-medium text-gray-900'>{question.text}</p>
          <div className='flex space-x-4'>
            {[1, 2, 3, 4, 5].map(rating => (
              <button
                key={rating}
                onClick={() => handleAnswerChange(question.id, rating)}
                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${
                  currentAnswer === rating
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-300'
                }`}
              >
                {rating}
              </button>
            ))}
          </div>
          <div className='flex justify-between text-sm text-gray-500'>
            <span>Lowest (1)</span>
            <span>Highest (5)</span>
          </div>
        </div>
      );
    }

    if (question.type === 'satisfaction') {
      return (
        <div className='space-y-4'>
          <p className='text-lg font-medium text-gray-900'>{question.text}</p>
          <div className='space-y-3'>
            {satisfactionOptions.map((option, index) => (
              <label
                key={index}
                className='flex items-center space-x-3 cursor-pointer'
              >
                <input
                  type='radio'
                  name={question.id}
                  value={option}
                  checked={currentAnswer === option}
                  onChange={e =>
                    handleAnswerChange(question.id, e.target.value)
                  }
                  className='w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500'
                />
                <span className='text-gray-700'>{option}</span>
              </label>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className='space-y-4'>
        <p className='text-lg font-medium text-gray-900'>{question.text}</p>
        <textarea
          value={currentAnswer || ''}
          onChange={e => handleAnswerChange(question.id, e.target.value)}
          className='w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
          rows={4}
          placeholder='Enter your answer...'
        />
      </div>
    );
  };

  // If currently taking an assessment, show the assessment interface
  if (currentAssessment) {
    const currentQuestion = currentAssessment.questions[currentStep];
    const progress =
      ((currentStep + 1) / currentAssessment.questions.length) * 100;

    return (
      <div className='p-6'>
        <div className='max-w-2xl mx-auto'>
          <div className='mb-6'>
            <h1 className='text-2xl font-bold text-gray-900 mb-2'>
              {currentAssessment.title}
            </h1>
            <p className='text-sm text-gray-600 mb-2'>
              {assessmentData.quarter} {assessmentData.year}
            </p>
            <div className='flex items-center justify-between text-sm text-gray-600'>
              <span>
                Question {currentStep + 1} of{' '}
                {currentAssessment.questions.length}
              </span>
              <span>{Math.round(progress)}% complete</span>
            </div>

            <div className='w-full bg-gray-200 rounded-full h-2 mt-2'>
              <div
                className='bg-indigo-600 h-2 rounded-full transition-all duration-300'
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          <div className='bg-white rounded-lg shadow-md p-6'>
            {/* Inline Error Banner */}
            {notification && notification.type === 'error' && (
              <div className='mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-md'>
                <div className='flex'>
                  <div className='flex-shrink-0'>
                    <svg
                      className='h-5 w-5 text-red-400'
                      viewBox='0 0 20 20'
                      fill='currentColor'
                    >
                      <path
                        fillRule='evenodd'
                        d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                        clipRule='evenodd'
                      />
                    </svg>
                  </div>
                  <div className='ml-3 flex-1'>
                    <p className='text-sm font-medium text-red-800'>
                      {notification.message}
                    </p>
                  </div>
                  <div className='ml-auto pl-3'>
                    <button
                      onClick={() => setNotification(null)}
                      className='inline-flex text-red-400 hover:text-red-600'
                    >
                      <svg
                        className='h-5 w-5'
                        viewBox='0 0 20 20'
                        fill='currentColor'
                      >
                        <path
                          fillRule='evenodd'
                          d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {renderQuestion(currentQuestion)}

            <div className='flex justify-between mt-8'>
              <button
                onClick={() => {
                  setCurrentAssessment(null);
                  setAssessmentData({
                    quarter: previousQuarter.quarter,
                    year: previousQuarter.year,
                    answers: {},
                  });
                  setCurrentStep(0);
                }}
                className='px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50'
              >
                Cancel
              </button>

              <div className='flex space-x-3'>
                <button
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className='px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  Previous
                </button>

                {currentStep === currentAssessment.questions.length - 1 ? (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className='px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {submitting ? 'Submitting...' : 'Submit Assessment'}
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className='px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main view with tabs
  return (
    <div id='self-assessment-page' className='p-6'>
      <div className='max-w-7xl mx-auto'>
        <h1
          id='self-assessment-title'
          className='text-2xl font-bold text-gray-900 mb-6'
        >
          Self Assessment
        </h1>

        {/* Tab Navigation */}
        <div
          id='self-assessment-tabs'
          className='border-b border-gray-200 mb-6'
        >
          <nav className='-mb-px flex space-x-8'>
            <button
              id='view-assessments-tab'
              onClick={() => setActiveTab('view')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'view'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Past Self-assessments
            </button>
            <button
              id='create-assessment-tab'
              onClick={() => setActiveTab('create')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'create'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Create New Assessment
            </button>
          </nav>
        </div>

        {/* View Assessments Tab */}
        {activeTab === 'view' && (
          <div id='view-assessments-section'>
            <div className='bg-white rounded-lg shadow-md'>
              <SelfAssessmentsList
                showDetailedView={true}
                title='Your Self Assessments'
              />
            </div>
          </div>
        )}

        {/* Create New Assessment Tab */}
        {activeTab === 'create' && (
          <div>
            <div className='bg-white rounded-lg shadow-md p-6'>
              {/* Inline Error Banner at top of form */}
              {notification && notification.type === 'error' && (
                <div className='mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-md'>
                  <div className='flex'>
                    <div className='flex-shrink-0'>
                      <svg
                        className='h-5 w-5 text-red-400'
                        viewBox='0 0 20 20'
                        fill='currentColor'
                      >
                        <path
                          fillRule='evenodd'
                          d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </div>
                    <div className='ml-3 flex-1'>
                      <p className='text-sm font-medium text-red-800'>
                        {notification.message}
                      </p>
                    </div>
                    <div className='ml-auto pl-3'>
                      <button
                        onClick={() => setNotification(null)}
                        className='inline-flex text-red-400 hover:text-red-600'
                      >
                        <svg
                          className='h-5 w-5'
                          viewBox='0 0 20 20'
                          fill='currentColor'
                        >
                          <path
                            fillRule='evenodd'
                            d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                            clipRule='evenodd'
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              <h2 className='text-xl font-semibold text-gray-900 mb-4'>
                Create New Assessment
              </h2>
              <p className='text-gray-600 mb-6'>
                Select a quarter and year to start your self-assessment.
              </p>

              {/* Quarter and Year Selection */}
              <div className='space-y-4 mb-6'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Select Quarter *
                  </label>
                  <div className='grid grid-cols-2 gap-3'>
                    {quarters.map(quarter => {
                      const isPreviousQuarter = quarter === previousQuarter.quarter;
                      const isSelected = assessmentData.quarter === quarter;
                      return (
                        <button
                          key={quarter}
                          onClick={() => isPreviousQuarter && handleQuarterChange(quarter)}
                          disabled={true}
                          className={`p-3 border rounded-md text-center ${
                            isPreviousQuarter
                              ? 'bg-indigo-600 text-white border-indigo-600 cursor-default'
                              : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
                          }`}
                        >
                          {quarter}
                          {isPreviousQuarter && (
                            <span className='block text-xs mt-1 opacity-90'>
                              {quarter === 'Q1' && '(January - March)'}
                              {quarter === 'Q2' && '(April - June)'}
                              {quarter === 'Q3' && '(July - September)'}
                              {quarter === 'Q4' && '(October - December)'}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <p className='text-xs text-gray-500 mt-2'>
                    Only the previous quarter ({previousQuarter.quarter} {previousQuarter.year}) can be selected for assessment.
                  </p>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Select Year
                  </label>
                  <select
                    id='year'
                    value={assessmentData.year}
                    onChange={e => handleYearChange(e.target.value)}
                    className='w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50'
                    disabled
                  >
                    <option value={previousQuarter.year}>
                      {previousQuarter.year}
                    </option>
                  </select>
                  <p className='text-xs text-gray-500 mt-1'>
                    Only the previous quarter's year can be selected.
                  </p>
                </div>
              </div>

              {/* Check for existing assessment */}
              {assessmentData.quarter && checkExistingAssessment() && (
                <div className='mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md'>
                  <div className='flex'>
                    <div className='flex-shrink-0'>
                      <svg
                        className='h-5 w-5 text-yellow-400'
                        viewBox='0 0 20 20'
                        fill='currentColor'
                      >
                        <path
                          fillRule='evenodd'
                          d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </div>
                    <div className='ml-3'>
                      <h3 className='text-sm font-medium text-yellow-800'>
                        Assessment Already Exists
                      </h3>
                      <div className='mt-2 text-sm text-yellow-700'>
                        <p>
                          You already have an assessment for{' '}
                          {assessmentData.quarter} {assessmentData.year}. Please
                          select a different quarter or year, or view your
                          existing assessment in the "View Assessments" tab.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className='space-y-4'>
                <div className='flex items-center text-sm text-gray-600'>
                  <span className='w-4 h-4 bg-indigo-100 text-indigo-800 rounded-full flex items-center justify-center mr-2'>
                    {mockAssessment.questions.length}
                  </span>
                  {mockAssessment.questions.length} questions
                </div>

                <div className='flex items-center text-sm text-gray-600'>
                  <span className='w-4 h-4 bg-green-100 text-green-800 rounded-full flex items-center justify-center mr-2'>
                    ~
                  </span>
                  Estimated time: 10-15 minutes
                </div>
              </div>

              <button
                onClick={handleStartAssessment}
                disabled={!assessmentData.quarter || checkExistingAssessment()}
                className='mt-6 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                Start Assessment
              </button>
            </div>
          </div>
        )}
      </div>
      {notification && (
        <ToastNotification
          message={notification.message}
          type={notification.type}
          onClose={() => {
            console.log('Notification closed');
            setNotification(null);
          }}
        />
      )}
    </div>
  );
};

export default SelfAssessment;
