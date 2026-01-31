import React from 'react';

/**
 * Header Component
 *
 * The top navigation bar that appears on all authenticated pages.
 * This component displays user information, welcome message, and
 * provides access to notifications and user-related actions.
 *
 * Features:
 * - Personalized welcome message with user's first name
 * - User avatar generated from name initials
 * - User role display
 * - Notification bell icon (placeholder for future functionality)
 * - Responsive design that adapts to different screen sizes
 *
 * The component uses the authentication context to access current
 * user information and displays it in a clean, professional layout.
 *
 * @component
 * @returns {JSX.Element} The application header with user information
 */
const Header: React.FC = () => {
  return (
    <header
      id='app-header'
      className='bg-white shadow-sm border-b border-gray-200'
    >
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-end items-center h-16'>
          {/* Empty header - content removed for cleaner interface */}
        </div>
      </div>
    </header>
  );
};

export default Header;
