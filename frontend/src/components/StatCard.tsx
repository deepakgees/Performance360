import React from 'react';

interface StatCardProps {
  name: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({
  name,
  value,
  icon: Icon,
  color,
}) => {
  const cardId = `stat-card-${name.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div id={cardId} className='bg-white overflow-hidden shadow rounded-lg'>
      <div className='p-5'>
        <div className='flex items-center'>
          <div className='flex-shrink-0'>
            <div
              id={`${cardId}-icon-container`}
              className={`${color} rounded-md p-3`}
            >
              <Icon className='h-6 w-6 text-white' />
            </div>
          </div>
          <div className='ml-5 w-0 flex-1'>
            <dl>
              <dt
                id={`${cardId}-label`}
                className='text-sm font-medium text-gray-500 truncate'
              >
                {name}
              </dt>
              <dd
                id={`${cardId}-value`}
                className='text-lg font-medium text-gray-900'
              >
                {value}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
