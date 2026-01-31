import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Admin Route Component Props
 *
 * Defines the props interface for the AdminRoute component.
 */
interface AdminRouteProps {
  children: React.ReactNode; // Child components to render if user is admin
}

/**
 * Admin Route Component
 *
 * A higher-order component that protects routes requiring ADMIN role.
 * This component ensures that only users with ADMIN role can access
 * admin-only routes by checking the user's role.
 *
 * Features:
 * - Automatic redirect to dashboard for non-admin users
 * - Loading state while checking authentication
 * - Seamless integration with React Router
 *
 * Usage:
 * ```jsx
 * <Route path="/users" element={<AdminRoute><Users /></AdminRoute>} />
 * ```
 *
 * @param {AdminRouteProps} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if user is admin
 * @returns {JSX.Element} Admin-only route content or redirect
 */
const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
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

  // Redirect to dashboard if user is not an admin
  if (user.role !== 'ADMIN') {
    return <Navigate to='/' replace />;
  }

  // Render admin-only content if user is authenticated and has ADMIN role
  return <>{children}</>;
};

export default AdminRoute;
