import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Login Page Component
 *
 * The main authentication page that allows users to sign in to the application.
 * This component provides a clean, user-friendly login form with proper
 * error handling and loading states.
 *
 * Features:
 * - Email and password authentication
 * - Form validation and error display
 * - Loading states during authentication
 * - Link to registration page for new users
 * - Automatic redirect to dashboard on successful login
 * - Responsive design for all screen sizes
 *
 * Authentication Flow:
 * 1. User enters email and password
 * 2. Form validates input
 * 3. Authentication request is sent to server
 * 4. On success: User is redirected to dashboard
 * 5. On error: Error message is displayed
 *
 * @component
 * @returns {JSX.Element} The login page with authentication form
 */
const Login: React.FC = () => {
  // Form state management
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Authentication context and navigation
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check for success message from navigation state (e.g., after password reset)
  useEffect(() => {
    if (location.state?.message) {
      setSuccess(location.state.message);
      // Clear the state to prevent showing the message again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  /**
   * Handle form submission for user authentication
   *
   * This function processes the login form submission by:
   * - Preventing default form behavior
   * - Clearing any previous errors
   * - Setting loading state
   * - Attempting to authenticate the user
   * - Handling success/error responses
   *
   * @param {React.FormEvent} e - Form submission event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Attempt to authenticate user
      await login(email, password);

      // Redirect to dashboard on successful login
      navigate('/');
    } catch (err: any) {
      // Display authentication error
      setError(err.message);
    } finally {
      // Reset loading state
      setLoading(false);
    }
  };

  return (
    <div
      id='login-page'
      className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'
    >
      <div id='login-container' className='max-w-md w-full space-y-8'>
        {/* Page header */}
        <div id='login-header'>
          <h2
            id='login-title'
            className='mt-6 text-center text-3xl font-extrabold text-gray-900'
          >
            Sign in to your account
          </h2>
          <p
            id='login-subtitle'
            className='mt-2 text-center text-sm text-gray-600'
          >
            Or{' '}
            <Link
              id='register-link'
              to='/register'
              className='font-medium text-indigo-600 hover:text-indigo-500'
            >
              create a new account
            </Link>
          </p>
        </div>

        {/* Login form */}
        <form
          id='login-form'
          className='mt-8 space-y-6'
          onSubmit={handleSubmit}
        >
          {/* Success message display */}
          {success && (
            <div id='login-success' className='rounded-md bg-green-50 p-4'>
              <div className='text-sm text-green-700'>{success}</div>
            </div>
          )}

          {/* Error message display */}
          {error && (
            <div id='login-error' className='rounded-md bg-red-50 p-4'>
              <div className='text-sm text-red-700'>{error}</div>
            </div>
          )}

          {/* Form fields */}
          <div
            id='login-form-fields'
            className='rounded-md shadow-sm -space-y-px'
          >
            {/* Email input field */}
            <div>
              <label htmlFor='login-email' className='sr-only'>
                Email address
              </label>
              <input
                id='login-email'
                name='email'
                type='email'
                autoComplete='email'
                required
                className='appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm'
                placeholder='Email address'
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Password input field */}
            <div>
              <label htmlFor='login-password' className='sr-only'>
                Password
              </label>
              <input
                id='login-password'
                name='password'
                type='password'
                autoComplete='current-password'
                required
                className='appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm'
                placeholder='Password'
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Submit button */}
          <div>
            <button
              id='login-submit-button'
              type='submit'
              disabled={loading}
              className='group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50'
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
