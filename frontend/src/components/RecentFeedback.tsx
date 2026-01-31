import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { feedbackAPI } from '../services/api';

const RecentFeedback: React.FC = () => {
  const { user } = useAuth();

  const { data: feedback } = useQuery({
    queryKey: ['feedback-received', user?.id],
    queryFn: feedbackAPI.getColleagueReceived,
    enabled: !!user?.id,
  });

  const recentFeedback = feedback?.data?.slice(0, 5) || [];

  return (
    <div id='recent-feedback-card' className='bg-white shadow rounded-lg'>
      <div className='px-4 py-5 sm:p-6'>
        <div
          id='recent-feedback-header'
          className='flex items-center justify-between'
        >
          <h3
            id='recent-feedback-title'
            className='text-lg leading-6 font-medium text-gray-900'
          >
            Recent Colleague Feedback
          </h3>
          <ChatBubbleLeftRightIcon className='h-5 w-5 text-gray-400' />
        </div>

        <div id='recent-feedback-content' className='mt-5'>
          {recentFeedback.length === 0 ? (
            <p id='no-recent-feedback' className='text-gray-500 text-sm'>
              No recent colleague feedback
            </p>
          ) : (
            <div id='recent-feedback-list' className='space-y-4'>
              {recentFeedback.map((item: any) => (
                <div
                  key={item.id}
                  id={`recent-feedback-item-${item.id}`}
                  className='border-l-4 border-blue-400 pl-4'
                >
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm font-medium text-gray-900'>
                        {item.title}
                      </p>
                      <p className='text-sm text-gray-500'>
                        From: {item.sender?.firstName} {item.sender?.lastName}
                      </p>
                    </div>
                    <span className='text-xs text-gray-400'>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecentFeedback;
