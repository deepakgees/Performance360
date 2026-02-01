import { XMarkIcon } from '@heroicons/react/24/outline';
import React, { useMemo, useState } from 'react';

interface ManagerFeedback {
  id: string;
  receiver: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  year: string;
  quarter: string;
  createdAt: string;
  managerSatisfaction?: string;
  leadershipStyle?: any;
  careerGrowth?: any;
  coachingCaring?: any;
  managerOverallRating?: number;
  appreciation?: string;
  improvementAreas?: string;
  team?: {
    id: string;
    name: string;
  };
}

interface ManagerFeedbackPastTableProps {
  feedbacks: ManagerFeedback[];
  loading: boolean;
  title?: string;
}

type SortField = 'to' | 'year' | 'quarter' | 'rating' | 'satisfaction';
type SortDirection = 'asc' | 'desc';

const ManagerFeedbackPastTable: React.FC<ManagerFeedbackPastTableProps> = ({
  feedbacks,
  loading,
  title: _title = 'Feedbacks Provided to Manager',
}) => {
  const [sortConfig, setSortConfig] = useState<{
    field: SortField;
    direction: SortDirection;
  }>({ field: 'year', direction: 'desc' });

  const [selectedFeedback, setSelectedFeedback] =
    useState<ManagerFeedback | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSort = (field: SortField) => {
    setSortConfig(prev => ({
      field,
      direction:
        prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleRowClick = (feedback: ManagerFeedback) => {
    setSelectedFeedback(feedback);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedFeedback(null);
  };

  const sortedFeedbacks = useMemo(() => {
    if (!feedbacks || feedbacks.length === 0) return [];

    return [...feedbacks].sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortConfig.field) {
        case 'to':
          aValue = `${a.receiver.firstName} ${a.receiver.lastName}`.toLowerCase();
          bValue = `${b.receiver.firstName} ${b.receiver.lastName}`.toLowerCase();
          break;
        case 'year':
          aValue = parseInt(a.year) || 0;
          bValue = parseInt(b.year) || 0;
          break;
        case 'quarter':
          // Sort by year first, then by quarter
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
        case 'rating':
          aValue = a.managerOverallRating || 0;
          bValue = b.managerOverallRating || 0;
          break;
        case 'satisfaction':
          aValue = (a.managerSatisfaction || '').toLowerCase();
          bValue = (b.managerSatisfaction || '').toLowerCase();
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
  }, [feedbacks, sortConfig]);

  // Helper function to get summary text for complex data (commented out for future use)
  // const getLeadershipSummary = (feedback: ManagerFeedback) => {
  //   if (!feedback.leadershipStyle) return 'N/A';
  //   const styles = [];
  //   if (
  //     feedback.leadershipStyle &&
  //     Object.keys(feedback.leadershipStyle).length > 0
  //   ) {
  //     styles.push('Style 1');
  //   }
  //   return styles.length > 0 ? `${styles.length} style(s)` : 'N/A';
  // };

  // const getCareerGrowthSummary = (feedback: ManagerFeedback) => {
  //   if (!feedback.careerGrowth) return 'N/A';
  //   const keys = Object.keys(feedback.careerGrowth);
  //   if (keys.length > 0) {
  //     return `${keys.length} item(s)`;
  //   }
  //   return 'N/A';
  // };

  // const getCoachingCaringSummary = (feedback: ManagerFeedback) => {
  //   if (!feedback.coachingCaring) return 'N/A';
  //   const keys = Object.keys(feedback.coachingCaring);
  //   return keys.length > 0 ? `${keys.length} item(s)` : 'N/A';
  // };

  if (loading) {
    return (
      <div>
        <div className='flex justify-center py-4'>
          <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600'></div>
        </div>
      </div>
    );
  }

  if (!feedbacks || feedbacks.length === 0) {
    return (
      <div>
        <p className='text-gray-500 text-center py-4'>
          No manager feedback provided
        </p>
      </div>
    );
  }

  const getSortIcon = (field: SortField) => {
    if (sortConfig.field !== field) {
      return <span className='ml-1 text-gray-400'>↕</span>;
    }
    return sortConfig.direction === 'asc' ? (
      <span className='ml-1 text-indigo-600'>↑</span>
    ) : (
      <span className='ml-1 text-indigo-600'>↓</span>
    );
  };

  return (
    <div>
      <div className='w-full px-6 pb-6'>
        <table className='w-full border border-gray-200'>
          <thead className='bg-gray-50'>
            <tr>
              <th
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 w-20'
                onClick={() => handleSort('to')}
              >
                <div className='flex items-center'>
                  To
                  {getSortIcon('to')}
                </div>
              </th>
              <th
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 w-16'
                onClick={() => handleSort('year')}
              >
                <div className='flex items-center'>
                  Year
                  {getSortIcon('year')}
                </div>
              </th>
              <th
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 w-20'
                onClick={() => handleSort('quarter')}
              >
                <div className='flex items-center'>
                  Quarter
                  {getSortIcon('quarter')}
                </div>
              </th>
              <th
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 w-24'
                onClick={() => handleSort('rating')}
              >
                <div className='flex items-center'>
                  Overall Rating
                  {getSortIcon('rating')}
                </div>
              </th>
              <th
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 w-32'
                onClick={() => handleSort('satisfaction')}
              >
                <div className='flex items-center'>
                  Manager Satisfaction
                  {getSortIcon('satisfaction')}
                </div>
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200'>
                Appreciation
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200'>
                Improvement Areas
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24'>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className='bg-white'>
            {sortedFeedbacks.map((feedback: ManagerFeedback) => (
              <tr
                key={feedback.id}
                className='hover:bg-gray-50 border-b border-gray-200 cursor-pointer'
                onClick={() => handleRowClick(feedback)}
              >
                <td className='px-6 py-4 text-sm font-medium text-gray-900 border-r border-gray-200 w-20'>
                  {`${feedback.receiver.firstName} ${feedback.receiver.lastName}`}
                </td>
                <td className='px-6 py-4 text-sm text-gray-900 border-r border-gray-200 w-16'>
                  {feedback.year}
                </td>
                <td className='px-6 py-4 text-sm text-gray-900 border-r border-gray-200 w-20'>
                  {feedback.quarter}
                </td>
                <td className='px-6 py-4 text-sm text-gray-900 border-r border-gray-200 w-24'>
                  {feedback.managerOverallRating ? (
                    <div className='flex items-center'>
                      <span className='text-lg font-semibold text-indigo-600 mr-1'>
                        {feedback.managerOverallRating}
                      </span>
                      <span className='text-xs text-gray-500'>/ 5</span>
                    </div>
                  ) : (
                    'N/A'
                  )}
                </td>
                <td className='px-6 py-4 text-sm text-gray-900 border-r border-gray-200 w-32'>
                  <div className='break-words'>
                    {feedback.managerSatisfaction ? (
                      <div title={feedback.managerSatisfaction}>
                        {feedback.managerSatisfaction}
                      </div>
                    ) : (
                      'N/A'
                    )}
                  </div>
                </td>
                <td className='px-6 py-4 text-sm text-gray-900 border-r border-gray-200'>
                  <div className='break-words'>
                    {feedback.appreciation ? (
                      <div>{feedback.appreciation}</div>
                    ) : (
                      'N/A'
                    )}
                  </div>
                </td>
                <td className='px-6 py-4 text-sm text-gray-900 border-r border-gray-200'>
                  <div className='break-words'>
                    {feedback.improvementAreas ? (
                      <div>{feedback.improvementAreas}</div>
                    ) : (
                      'N/A'
                    )}
                  </div>
                </td>
                <td className='px-6 py-4 text-sm text-gray-900 w-24'>
                  <button
                    className='text-indigo-600 hover:text-indigo-900 font-medium'
                    onClick={e => {
                      e.stopPropagation();
                      handleRowClick(feedback);
                    }}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for detailed view */}
      {isModalOpen && selectedFeedback && (
        <div className='fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50'>
          <div className='relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white'>
            <div className='flex justify-between items-center mb-4'>
              <h3 className='text-lg font-semibold text-gray-900'>
                Feedback Details
              </h3>
              <button
                onClick={closeModal}
                className='text-gray-400 hover:text-gray-600'
              >
                <XMarkIcon className='h-6 w-6' />
              </button>
            </div>

            <div className='space-y-6'>
              {/* Basic Information */}
              <div className='bg-gray-50 p-4 rounded-lg'>
                <h4 className='font-semibold text-gray-900 mb-2'>
                  Basic Information
                </h4>
                <div className='grid grid-cols-2 gap-4 text-sm'>
                  <div>
                    <span className='font-medium text-gray-600'>To:</span>
                    <span className='ml-2'>
                      {`${selectedFeedback.receiver.firstName} ${selectedFeedback.receiver.lastName}`}
                    </span>
                  </div>
                  <div>
                    <span className='font-medium text-gray-600'>Period:</span>
                    <span className='ml-2'>
                      {selectedFeedback.year} - {selectedFeedback.quarter}
                    </span>
                  </div>
                  <div>
                    <span className='font-medium text-gray-600'>
                      Overall Rating:
                    </span>
                    <span className='ml-2'>
                      {selectedFeedback.managerOverallRating ? (
                        <span className='text-indigo-600 font-semibold'>
                          {selectedFeedback.managerOverallRating}/5
                        </span>
                      ) : (
                        'N/A'
                      )}
                    </span>
                  </div>
                  <div>
                    <span className='font-medium text-gray-600'>
                      Satisfaction:
                    </span>
                    <span className='ml-2'>
                      {selectedFeedback.managerSatisfaction || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Leadership Style */}
              {selectedFeedback.leadershipStyle && (
                <div className='bg-blue-50 p-4 rounded-lg'>
                  <h4 className='font-semibold text-gray-900 mb-2'>
                    Leadership Style
                  </h4>
                  <div className='space-y-3'>
                    <div className='bg-white p-3 rounded border'>
                      <h5 className='font-medium text-blue-800 mb-1'>
                        Leadership Style
                      </h5>
                      <div className='text-sm'>
                        {Object.entries(selectedFeedback.leadershipStyle).map(
                          ([key, value]) => (
                            <div key={key} className='mb-2'>
                              <span className='font-medium text-gray-600'>
                                {key
                                  .replace(/([A-Z])/g, ' $1')
                                  .replace(/^./, str => str.toUpperCase())}
                                :
                              </span>
                              <span className='ml-2 text-gray-700'>
                                {String(value)}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Career Growth */}
              {selectedFeedback.careerGrowth && (
                <div className='bg-green-50 p-4 rounded-lg'>
                  <h4 className='font-semibold text-gray-900 mb-2'>
                    Career Growth
                  </h4>
                  <div className='bg-white p-3 rounded border'>
                    <div className='text-sm space-y-2'>
                      {Object.entries(selectedFeedback.careerGrowth).map(
                        ([key, value]) => (
                          <div key={key}>
                            <span className='font-medium text-gray-600'>
                              {key
                                .replace(/([A-Z])/g, ' $1')
                                .replace(/^./, str => str.toUpperCase())}
                              :
                            </span>
                            <div className='ml-2 mt-1'>
                              {Array.isArray(value) ? (
                                <ul className='list-disc list-inside text-gray-700'>
                                  {value.map((item: string, index: number) => (
                                    <li key={index}>{item}</li>
                                  ))}
                                </ul>
                              ) : (
                                <p className='text-gray-700'>{String(value)}</p>
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Coaching & Caring */}
              {selectedFeedback.coachingCaring && (
                <div className='bg-purple-50 p-4 rounded-lg'>
                  <h4 className='font-semibold text-gray-900 mb-2'>
                    Coaching & Caring
                  </h4>
                  <div className='bg-white p-3 rounded border'>
                    <div className='text-sm space-y-2'>
                      {Object.entries(selectedFeedback.coachingCaring).map(
                        ([key, value]) => (
                          <div key={key}>
                            <span className='font-medium text-gray-600'>
                              {key
                                .replace(/([A-Z])/g, ' $1')
                                .replace(/^./, str => str.toUpperCase())}
                              :
                            </span>
                            <p className='ml-2 mt-1 text-gray-700'>
                              {String(value)}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Appreciation */}
              {selectedFeedback.appreciation && (
                <div className='bg-yellow-50 p-4 rounded-lg'>
                  <h4 className='font-semibold text-gray-900 mb-2'>
                    Appreciation
                  </h4>
                  <div className='bg-white p-3 rounded border'>
                    <p className='text-sm text-gray-700'>
                      {selectedFeedback.appreciation}
                    </p>
                  </div>
                </div>
              )}

              {/* Improvement Areas */}
              {selectedFeedback.improvementAreas && (
                <div className='bg-orange-50 p-4 rounded-lg'>
                  <h4 className='font-semibold text-gray-900 mb-2'>
                    Improvement Areas
                  </h4>
                  <div className='bg-white p-3 rounded border'>
                    <p className='text-sm text-gray-700'>
                      {selectedFeedback.improvementAreas}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className='mt-6 flex justify-end'>
              <button
                onClick={closeModal}
                className='px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors'
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerFeedbackPastTable;

