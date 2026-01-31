import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

/**
 * Layout Component
 *
 * The main layout wrapper for authenticated pages in the application.
 * This component provides the consistent structure for all protected routes
 * including the sidebar navigation and main content area.
 *
 * Structure:
 * - Sidebar: Navigation menu on the left side (collapsible)
 * - Main Content: Scrollable area for page content
 *
 * The component uses React Router's Outlet to render nested routes
 * and provides a responsive layout with proper overflow handling.
 * The sidebar can be collapsed to save space and provide more room for content.
 *
 * @component
 * @returns {JSX.Element} The main application layout structure
 */
const Layout: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div id='app-layout' className='flex h-screen bg-gray-100'>
      {/* Left sidebar navigation */}
      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />

      {/* Main content area */}
      <div
        id='main-content-area'
        className='flex-1 flex flex-col overflow-hidden'
      >
        {/* Main content area with scrolling */}
        <main
          id='main-content'
          className='flex-1 overflow-x-hidden overflow-y-auto bg-gray-50'
        >
          <div id='content-container' className='w-full px-6 py-8'>
            {/* Render nested routes using React Router Outlet */}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
