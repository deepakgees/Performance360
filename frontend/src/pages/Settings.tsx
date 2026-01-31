import React from 'react';
import { Outlet } from 'react-router-dom';

/**
 * Settings Page Component
 *
 * This is a parent route component that serves as a container for various settings pages.
 * It uses React Router's Outlet to render child routes within the settings section.
 *
 * @component
 * @returns {JSX.Element} The settings page layout with child route content
 */
const Settings: React.FC = () => {
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">
            Manage application settings and configurations
          </p>
        </div>
        
        {/* Child route content will be rendered here */}
        <Outlet />
      </div>
    </div>
  );
};

export default Settings; 