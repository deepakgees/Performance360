import React, { useState } from 'react';

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

interface ColleagueFeedbackPastTableProps {
  feedbacks: FeedbackItem[];
  loading: boolean;
  title?: string;
  showReceiver?: boolean; // If true, show receiver info, if false, show sender info
}

const ColleagueFeedbackPastTable: React.FC<ColleagueFeedbackPastTableProps> = ({
  feedbacks,
  loading,
  title = 'Past Colleague Feedbacks',
  showReceiver = false,
}) => {
  const [sortConfig, setSortConfig] = useState<{
    key: 'year' | 'quarter' | 'rating' | 'colleague' | 'readyToWork';
    direction: 'asc' | 'desc';
  }>({ key: 'quarter', direction: 'desc' });

  const handleSort = (
    key: 'year' | 'quarter' | 'rating' | 'colleague' | 'readyToWork'
  ) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const getSortedFeedbacks = () => {
    if (!feedbacks) return [];

    return [...feedbacks].sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortConfig.key) {
        case 'year':
          aValue = a.year;
          bValue = b.year;
          break;
        case 'quarter':
          aValue = a.quarter;
          bValue = b.quarter;
          break;
        case 'rating':
          aValue = a.rating || 0;
          bValue = b.rating || 0;
          break;

        case 'colleague':
          if (showReceiver) {
            aValue =
              `${a.receiver.firstName} ${a.receiver.lastName}`.toLowerCase();
            bValue =
              `${b.receiver.firstName} ${b.receiver.lastName}`.toLowerCase();
          } else {
            aValue = `${a.sender.firstName} ${a.sender.lastName}`.toLowerCase();
            bValue = `${b.sender.firstName} ${b.sender.lastName}`.toLowerCase();
          }
          break;
        case 'readyToWork':
          aValue = a.wouldWorkAgain ? 1 : 0;
          bValue = b.wouldWorkAgain ? 1 : 0;
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

  const getRatingStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  if (loading) {
    return (
      <div className='bg-white rounded-lg shadow-md p-6'>
        <div className='text-center py-8'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto'></div>
          <p className='mt-2 text-gray-600'>Loading feedback...</p>
        </div>
      </div>
    );
  }

  const sortedFeedbacks = getSortedFeedbacks();

  if (sortedFeedbacks.length === 0) {
    return (
      <div className='bg-white rounded-lg shadow-md p-6'>
        <div className='text-center py-8'>
          <p className='text-gray-500'>No feedback found.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className='w-full px-6 pb-6'>
        <table className='w-full border border-gray-200'>
          <thead className='bg-gray-50'>
            <tr>
              <th
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 w-16'
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
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 min-w-[80px]'
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
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 min-w-[120px]'
                onClick={() => handleSort('colleague')}
              >
                <div className='flex items-center'>
                  {showReceiver ? 'To' : 'From'}
                  {sortConfig.key === 'colleague' && (
                    <span className='ml-1'>
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 min-w-[80px]'
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
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 flex-1'>
                Appreciation
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 flex-1'>
                Improvement
              </th>
              <th
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 min-w-[120px]'
                onClick={() => handleSort('readyToWork')}
              >
                <div className='flex items-center'>
                  Would Work Again
                  {sortConfig.key === 'readyToWork' && (
                    <span className='ml-1'>
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className='bg-white'>
            {sortedFeedbacks.map(feedback => (
              <tr
                key={feedback.id}
                className='hover:bg-gray-50 border-b border-gray-200'
              >
                <td className='px-6 py-4 text-sm font-medium text-gray-900 border-r border-gray-200'>
                  {feedback.year}
                </td>
                <td className='px-6 py-4 text-sm text-gray-900 border-r border-gray-200'>
                  {feedback.quarter}
                </td>
                <td className='px-6 py-4 text-sm font-medium text-gray-900 border-r border-gray-200'>
                  {feedback.isAnonymous
                    ? 'Anonymous'
                    : showReceiver
                    ? `${feedback.receiver.firstName} ${feedback.receiver.lastName}`
                    : `${feedback.sender.firstName} ${feedback.sender.lastName}`}
                </td>
                <td className='px-6 py-4 text-sm text-gray-900 border-r border-gray-200'>
                  <div className='flex items-center'>
                    <span className='text-lg font-semibold text-indigo-600 mr-1'>
                      {feedback.rating}
                    </span>
                    <span className='text-xs text-gray-500'>/ 5</span>
                  </div>
                </td>
                <td className='px-6 py-4 text-sm text-gray-900 border-r border-gray-200'>
                  <div className='break-words'>
                    {feedback.appreciation ? (
                      <div title={feedback.appreciation}>
                        {feedback.appreciation}
                      </div>
                    ) : (
                      'N/A'
                    )}
                  </div>
                </td>
                <td className='px-6 py-4 text-sm text-gray-900 border-r border-gray-200'>
                  <div className='break-words'>
                    {feedback.improvement ? (
                      <div title={feedback.improvement}>
                        {feedback.improvement}
                      </div>
                    ) : (
                      'N/A'
                    )}
                  </div>
                </td>
                <td className='px-6 py-4 text-sm text-gray-900'>
                  {feedback.wouldWorkAgain ? 'Yes' : 'No'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ColleagueFeedbackPastTable;
