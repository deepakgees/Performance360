import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Manager Route Component Props
 *
 * Defines the props interface for the ManagerRoute component.
 */
interface ManagerRouteProps {
  children: React.ReactNode; // Child components to render if user is manager or admin
}

/**
 * Manager Route Component
 *
 * A higher-order component that protects routes requiring MANAGER or ADMIN role.
 * This component ensures that only users with MANAGER or ADMIN role can access
 * manager-only routes by checking the user's role.
 *
 * Features:
 * - Automatic redirect to dashboard for non-manager users
 * - Loading state while checking authentication
 * - Seamless integration with React Router
 *
 * Usage:
 * ```jsx
 * <Route path="/direct-reports" element={<ManagerRoute><DirectReports /></ManagerRoute>} />
 * ```
 *
 * @param {ManagerRouteProps} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if user is manager or admin
 * @returns {JSX.Element} Manager-only route content or redirect
 */
const ManagerRoute: React.FC<ManagerRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  // Show loading spinner while checking authentication status
  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900'></div>
      </div>
    );
  }

  // Redirect to login page if user is not authenticated
  if (!user) {
    return <Navigate to='/login' replace />;
  }

  // Redirect to dashboard if user is not a manager or admin
  if (user.role !== 'MANAGER' && user.role !== 'ADMIN') {
    return <Navigate to='/' replace />;
  }

  // Render manager-only content if user is authenticated and has MANAGER or ADMIN role
  return <>{children}</>;
};

export default ManagerRoute;
