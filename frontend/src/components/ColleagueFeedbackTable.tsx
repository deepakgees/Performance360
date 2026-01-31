import React from 'react';

interface Feedback {
  id: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  year: string;
  quarter: string;
  status: string;
  createdAt: string;
  appreciation?: string;
  improvement?: string;
  wouldWorkAgain?: boolean;
  team?: {
    id: string;
    name: string;
  };
  isAnonymous?: boolean;
  rating?: number;
}

interface ColleagueFeedbackTableProps {
  feedbacks: Feedback[];
  loading: boolean;
  title?: string;
}

const ColleagueFeedbackTable: React.FC<ColleagueFeedbackTableProps> = ({
  feedbacks,
  loading,
  title = 'Feedbacks Received as Colleague',
}) => {
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
          No colleague feedback received
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className='w-full px-6 pb-6'>
        <table className='w-full border border-gray-200'>
          <thead className='bg-gray-50'>
            <tr>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200'>
                From
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200'>
                Year
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200'>
                Quarter
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200'>
                Rating
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200'>
                Appreciation
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Improvement
              </th>
            </tr>
          </thead>
          <tbody className='bg-white'>
            {feedbacks.map((feedback: Feedback) => (
              <tr
                key={feedback.id}
                className='hover:bg-gray-50 border-b border-gray-200'
              >
                <td className='px-6 py-4 text-sm font-medium text-gray-900 border-r border-gray-200'>
                  {feedback.isAnonymous
                    ? 'Anonymous'
                    : `${feedback.sender.firstName} ${feedback.sender.lastName}`}
                </td>
                <td className='px-6 py-4 text-sm text-gray-900 border-r border-gray-200'>
                  {feedback.year}
                </td>
                <td className='px-6 py-4 text-sm text-gray-900 border-r border-gray-200'>
                  {feedback.quarter}
                </td>
                <td className='px-6 py-4 text-sm text-gray-900 border-r border-gray-200'>
                  {feedback.rating ? (
                    <div className='flex items-center'>
                      <span className='text-lg font-semibold text-indigo-600 mr-1'>
                        {feedback.rating}
                      </span>
                      <span className='text-xs text-gray-500'>/ 5</span>
                    </div>
                  ) : (
                    'N/A'
                  )}
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
                <td className='px-6 py-4 text-sm text-gray-900'>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ColleagueFeedbackTable;
