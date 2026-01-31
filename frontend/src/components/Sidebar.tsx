import {
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  BuildingOfficeIcon,
  CalendarIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClipboardDocumentListIcon,
  CogIcon,
  HomeIcon,
  LockClosedIcon,
  UserGroupIcon,
  UserIcon,
  UsersIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

/**
 * Sidebar Component
 *
 * The main navigation sidebar that provides access to all application features.
 * This component displays the app logo, navigation menu, and user profile section
 * with logout functionality.
 *
 * Features:
 * - Responsive design (hidden on mobile devices)
 * - Active route highlighting
 * - Icon-based navigation for better UX
 * - User profile display with avatar
 * - Logout functionality
 * - Smooth hover effects and transitions
 * - Collapsible "Provide feedbacks" section
 * - Collapsible sidebar with toggle functionality
 *
 * Navigation Structure:
 * - Dashboard: Main overview page
 * - Provide feedbacks: Collapsible section containing feedback options
 * - Profile: User profile settings
 *
 * @component
 * @param {boolean} isCollapsed - Whether the sidebar is collapsed
 * @param {function} onToggle - Function to toggle the sidebar state
 * @returns {JSX.Element} The application sidebar navigation
 */
const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const { user, logout } = useAuth();
  const [isFeedbackExpanded, setIsFeedbackExpanded] = useState(false);
  const [isReportsExpanded, setIsReportsExpanded] = useState(false);
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);

  /**
   * Feedback navigation items configuration
   * These items will be grouped under the "Provide feedbacks" collapsible section
   */
  const feedbackItems = [
    {
      name: 'Colleague Feedback',
      href: '/colleague-feedback',
      icon: ChatBubbleLeftRightIcon,
    },
    {
      name: 'Manager Feedback',
      href: '/manager-feedback',
      icon: ChatBubbleLeftRightIcon,
    },
    {
      name: 'Self Assessment',
      href: '/self-assessment',
      icon: ClipboardDocumentListIcon,
    },
  ];

  /**
   * Reports navigation items configuration
   * These items will be grouped under the "My Reports" collapsible section
   */
  const reportsItems = [
    {
      name: 'My Direct Reports',
      href: '/direct-reports',
      icon: UserIcon,
    },
    {
      name: 'My Indirect Reports',
      href: '/indirect-reports',
      icon: UserGroupIcon,
    },
  ];

  /**
   * Settings navigation items configuration
   * These items will be grouped under the "Settings" collapsible section
   */
  const settingsItems = [
    {
      name: 'Users',
      href: '/settings/users',
      icon: UsersIcon,
    },
    {
      name: 'Teams',
      href: '/settings/teams',
      icon: UserGroupIcon,
    },
    {
      name: 'Business Units',
      href: '/settings/business-units',
      icon: BuildingOfficeIcon,
    },
    {
      name: 'Monthly Attendance',
      href: '/settings/monthly-attendance',
      icon: CalendarIcon,
    },
    {
      name: 'Jira Configurations',
      href: '/settings/jira',
      icon: ChartBarIcon,
    },
    {
      name: 'Jira Unmapped Users',
      href: '/settings/jira-unmapped-users',
      icon: UserIcon,
    },
    {
      name: 'Sessions',
      href: '/settings/sessions',
      icon: LockClosedIcon,
    },
  ];

  /**
   * Main navigation items configuration
   * Each item includes a name, route path, and corresponding icon
   */
  const navigation = [{ name: 'Dashboard', href: '/', icon: HomeIcon }];

  return (
    <div
      id='app-sidebar'
      className={`hidden md:flex md:flex-shrink-0 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className='flex flex-col w-full'>
        <div className='flex flex-col h-0 flex-1 bg-gray-800'>
          {/* Main navigation area */}
          <div className='flex-1 flex flex-col pt-5 pb-4 overflow-y-auto'>
            {/* App logo/brand and toggle button */}
            <div
              id='sidebar-brand'
              className='flex items-center justify-between flex-shrink-0 px-4'
            >
              {!isCollapsed && (
                <h1 id='app-title' className='text-white text-xl font-bold'>
                  Performance360
                </h1>
              )}
              <button
                onClick={onToggle}
                className='p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white'
                title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isCollapsed ? (
                  <Bars3Icon className='h-6 w-6' />
                ) : (
                  <XMarkIcon className='h-6 w-6' />
                )}
              </button>
            </div>

            {/* Navigation menu */}
            <nav
              id='sidebar-navigation'
              className='mt-5 flex-1 px-2 bg-gray-800 space-y-1'
            >
              {/* Dashboard */}
              <NavLink
                key='dashboard'
                id='nav-dashboard'
                to='/'
                className={({ isActive }) =>
                  `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`
                }
                title={isCollapsed ? 'Dashboard' : undefined}
              >
                <HomeIcon className='mr-3 flex-shrink-0 h-6 w-6' />
                {!isCollapsed && 'Dashboard'}
              </NavLink>

              {/* Employee Profile - only for admin users */}
              {user?.role === 'ADMIN' && (
                <NavLink
                  key='employee-profile'
                  id='nav-employee-profile'
                  to='/employee-profile'
                  className={({ isActive }) =>
                    `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`
                  }
                  title={isCollapsed ? 'Employee Profile' : undefined}
                >
                  <UserIcon className='mr-3 flex-shrink-0 h-6 w-6' />
                  {!isCollapsed && 'Employee Profile'}
                </NavLink>
              )}

              {/* Provide feedbacks collapsible section */}
              <div className='space-y-1'>
                <button
                  onClick={() =>
                    !isCollapsed && setIsFeedbackExpanded(!isFeedbackExpanded)
                  }
                  className='group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white'
                  title={isCollapsed ? 'Provide feedbacks' : undefined}
                >
                  <ChatBubbleLeftRightIcon className='mr-3 flex-shrink-0 h-6 w-6' />
                  {!isCollapsed && (
                    <>
                      <span className='flex-1 text-left'>
                        Provide feedbacks
                      </span>
                      {isFeedbackExpanded ? (
                        <ChevronDownIcon className='h-4 w-4' />
                      ) : (
                        <ChevronRightIcon className='h-4 w-4' />
                      )}
                    </>
                  )}
                </button>

                {/* Feedback sub-items */}
                {isFeedbackExpanded && !isCollapsed && (
                  <div className='ml-6 space-y-1'>
                    {feedbackItems.map(item => (
                      <NavLink
                        key={item.name}
                        id={`nav-${item.name
                          .toLowerCase()
                          .replace(/\s+/g, '-')}`}
                        to={item.href}
                        className={({ isActive }) =>
                          `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                            isActive
                              ? 'bg-gray-900 text-white'
                              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                          }`
                        }
                      >
                        <item.icon className='mr-3 flex-shrink-0 h-5 w-5' />
                        {item.name}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>

              {/* My Reports collapsible section - only for manager/admin users */}
              {(user?.role === 'MANAGER' || user?.role === 'ADMIN') && (
                <div className='space-y-1'>
                  <button
                    onClick={() =>
                      !isCollapsed && setIsReportsExpanded(!isReportsExpanded)
                    }
                    className='group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white'
                    title={isCollapsed ? 'My Reports' : undefined}
                  >
                    <UserGroupIcon className='mr-3 flex-shrink-0 h-6 w-6' />
                    {!isCollapsed && (
                      <>
                        <span className='flex-1 text-left'>My Reports</span>
                        {isReportsExpanded ? (
                          <ChevronDownIcon className='h-4 w-4' />
                        ) : (
                          <ChevronRightIcon className='h-4 w-4' />
                        )}
                      </>
                    )}
                  </button>

                  {/* Reports sub-items */}
                  {isReportsExpanded && !isCollapsed && (
                    <div className='ml-6 space-y-1'>
                      {reportsItems.map(item => (
                        <NavLink
                          key={item.name}
                          id={`nav-${item.name
                            .toLowerCase()
                            .replace(/\s+/g, '-')}`}
                          to={item.href}
                          className={({ isActive }) =>
                            `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                              isActive
                                ? 'bg-gray-900 text-white'
                                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                            }`
                          }
                        >
                          <item.icon className='mr-3 flex-shrink-0 h-5 w-5' />
                          {item.name}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Settings collapsible section - only for admin users */}
              {user?.role === 'ADMIN' && (
                <div className='space-y-1'>
                  <button
                    onClick={() =>
                      !isCollapsed && setIsSettingsExpanded(!isSettingsExpanded)
                    }
                    className='group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white'
                    title={isCollapsed ? 'Settings' : undefined}
                  >
                    <CogIcon className='mr-3 flex-shrink-0 h-6 w-6' />
                    {!isCollapsed && (
                      <>
                        <span className='flex-1 text-left'>Settings</span>
                        {isSettingsExpanded ? (
                          <ChevronDownIcon className='h-4 w-4' />
                        ) : (
                          <ChevronRightIcon className='h-4 w-4' />
                        )}
                      </>
                    )}
                  </button>

                  {/* Settings sub-items */}
                  {isSettingsExpanded && !isCollapsed && (
                    <div className='ml-6 space-y-1'>
                      {settingsItems.map(item => (
                        <NavLink
                          key={item.name}
                          id={`nav-${item.name
                            .toLowerCase()
                            .replace(/\s+/g, '-')}`}
                          to={item.href}
                          className={({ isActive }) =>
                            `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                              isActive
                                ? 'bg-gray-900 text-white'
                                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                            }`
                          }
                        >
                          <item.icon className='mr-3 flex-shrink-0 h-5 w-5' />
                          {item.name}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Other navigation items */}
              {navigation.slice(1).map(item => (
                <NavLink
                  key={item.name}
                  id={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                  to={item.href}
                  className={({ isActive }) =>
                    `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`
                  }
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon className='mr-3 flex-shrink-0 h-6 w-6' />
                  {!isCollapsed && item.name}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Reset Password link - just above user section */}
          <div className='flex-shrink-0 px-2 pb-2'>
            <NavLink
              key='reset-password'
              id='nav-reset-password'
              to='/profile'
              className={({ isActive }) =>
                `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  isActive
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`
              }
              title={isCollapsed ? 'Reset Password' : undefined}
            >
              <LockClosedIcon className='mr-3 flex-shrink-0 h-6 w-6' />
              {!isCollapsed && 'Reset Password'}
            </NavLink>
          </div>

          {/* User profile and logout section */}
          <div
            id='sidebar-user-section'
            className='flex-shrink-0 flex bg-gray-700 p-4'
          >
            <div className='flex items-center'>
              {/* User avatar */}
              <div>
                <img
                  id='sidebar-user-avatar'
                  className='inline-block h-9 w-9 rounded-full'
                  src={`https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=random`}
                  alt={`${user?.firstName} ${user?.lastName}`}
                />
              </div>

              {/* User information */}
              {!isCollapsed && (
                <div id='sidebar-user-info' className='ml-3'>
                  <p
                    id='sidebar-user-name'
                    className='text-sm font-medium text-white'
                  >
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p
                    id='sidebar-user-role'
                    className='text-xs font-medium text-gray-300'
                  >
                    {user?.role}
                  </p>
                </div>
              )}
            </div>

            {/* Logout button */}
            <button
              id='logout-button'
              onClick={logout}
              className='ml-auto flex-shrink-0 bg-gray-600 p-1 rounded-md text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white'
              title='Logout'
            >
              <ArrowRightOnRectangleIcon className='h-6 w-6' />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
