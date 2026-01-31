import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ToastNotificationProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose?: () => void;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({
  message,
  type,
  duration = 5000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // For error messages, show longer (10 seconds) to ensure user sees them
    const displayDuration = type === 'error' ? 10000 : duration;
    
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) {
        onClose();
      }
    }, displayDuration);

    return () => clearTimeout(timer);
  }, [duration, onClose, type]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-100 border-green-400 text-green-700';
      case 'error':
        return 'bg-red-100 border-red-400 text-red-700';
      case 'warning':
        return 'bg-yellow-100 border-yellow-400 text-yellow-700';
      case 'info':
        return 'bg-blue-100 border-blue-400 text-blue-700';
      default:
        return 'bg-gray-100 border-gray-400 text-gray-700';
    }
  };

  if (!isVisible) return null;

  const notificationContent = (
    <div
      className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[9999] px-4 py-3 rounded-md border ${getTypeStyles()} shadow-lg transition-all duration-300 ease-in-out min-w-[300px] max-w-[600px]`}
      style={{
        animation: 'slideInUp 0.3s ease-out',
        position: 'fixed',
        bottom: '1rem',
        left: '50%',
        transform: 'translateX(-50%)',
      }}
      data-testid={`${type}-notification`}
      role="alert"
      aria-live="assertive"
    >
      <div className='flex items-center space-x-2'>
        <span className='text-sm font-medium'>{message}</span>
        <button
          onClick={() => {
            setIsVisible(false);
            if (onClose) onClose();
          }}
          className='ml-2 text-current hover:opacity-70 focus:outline-none'
          aria-label="Close notification"
        >
          <svg
            className='w-4 h-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M6 18L18 6M6 6l12 12'
            />
          </svg>
        </button>
      </div>
    </div>
  );

  // Use portal to render at document body level to ensure it's always visible
  if (typeof window !== 'undefined' && window.document) {
    return createPortal(notificationContent, document.body);
  }

  return notificationContent;
};

export default ToastNotification;
