import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Private Route Component Props
 *
 * Defines the props interface for the PrivateRoute component.
 */
interface PrivateRouteProps {
  children: React.ReactNode; // Child components to render if authenticated
}

/**
 * Private Route Component
 *
 * A higher-order component that protects routes requiring authentication.
 * This component ensures that only authenticated users can access protected
 * routes by checking the user's authentication status.
 *
 * Features:
 * - Automatic redirect to login page for unauthenticated users
 * - Loading state while checking authentication
 * - Seamless integration with React Router
 *
 * Usage:
 * ```jsx
 * <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
 * ```
 *
 * @param {PrivateRouteProps} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authenticated
 * @returns {JSX.Element} Protected route content or redirect
 */
const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
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

  // Render protected content if user is authenticated
  return <>{children}</>;
};

export default PrivateRoute;
