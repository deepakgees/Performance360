import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/api';

/**
 * Reset Password Page Component
 *
 * Allows users to reset their password using a token received via email.
 * This component verifies the token and provides a form to set a new password.
 *
 * Features:
 * - Token verification on page load
 * - Password reset form with validation
 * - Error handling and loading states
 * - Automatic redirect to login on success
 * - Responsive design
 *
 * @component
 * @returns {JSX.Element} The password reset page
 */
const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  // Verify token on component mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('No reset token provided. Please check your email link.');
        setVerifying(false);
        return;
      }

      try {
        const response = await authAPI.verifyResetToken(token);
        if (response.data.valid) {
          setTokenValid(true);
          setUserEmail(response.data.email);
        } else {
          setError('Invalid or expired reset token. Please request a new one.');
        }
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
            'Invalid or expired reset token. Please request a new one.'
        );
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  /**
   * Handle form submission for password reset
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!password) {
      setError('Password is required');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setError(
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      );
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!token) {
      setError('Reset token is missing');
      return;
    }

    setLoading(true);

    try {
      await authAPI.resetPassword({ token, password });
      // Redirect to login page with success message
      navigate('/login', {
        state: { message: 'Password reset successfully! Please login with your new password.' },
      });
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Failed to reset password. Please try again or request a new reset link.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while verifying token
  if (verifying) {
    return (
      <div
        id='reset-password-page'
        className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'
      >
        <div className='max-w-md w-full text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Verifying reset token...</p>
        </div>
      </div>
    );
  }

  // Show error if token is invalid
  if (!tokenValid) {
    return (
      <div
        id='reset-password-page'
        className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'
      >
        <div className='max-w-md w-full space-y-8'>
          <div className='bg-white rounded-lg shadow-md p-8'>
            <h2 className='text-2xl font-bold text-gray-900 mb-4'>
              Invalid Reset Link
            </h2>
            <div className='rounded-md bg-red-50 p-4 mb-4'>
              <div className='text-sm text-red-700'>{error}</div>
            </div>
            <p className='text-sm text-gray-600 mb-4'>
              The password reset link is invalid or has expired. Please request
              a new password reset link.
            </p>
            <Link
              to='/login'
              className='inline-block w-full text-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id='reset-password-page'
      className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'
    >
      <div id='reset-password-container' className='max-w-md w-full space-y-8'>
        {/* Page header */}
        <div id='reset-password-header'>
          <h2
            id='reset-password-title'
            className='mt-6 text-center text-3xl font-extrabold text-gray-900'
          >
            Reset Your Password
          </h2>
          <p
            id='reset-password-subtitle'
            className='mt-2 text-center text-sm text-gray-600'
          >
            Enter your new password for{' '}
            <span className='font-medium'>{userEmail}</span>
          </p>
        </div>

        {/* Reset password form */}
        <form
          id='reset-password-form'
          className='mt-8 space-y-6'
          onSubmit={handleSubmit}
        >
          {/* Error message display */}
          {error && (
            <div id='reset-password-error' className='rounded-md bg-red-50 p-4'>
              <div className='text-sm text-red-700'>{error}</div>
            </div>
          )}

          {/* Form fields */}
          <div
            id='reset-password-form-fields'
            className='rounded-md shadow-sm -space-y-px'
          >
            {/* New password input field */}
            <div>
              <label htmlFor='reset-password-new' className='sr-only'>
                New Password
              </label>
              <input
                id='reset-password-new'
                name='password'
                type='password'
                autoComplete='new-password'
                required
                className='appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm'
                placeholder='New Password'
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Confirm password input field */}
            <div>
              <label htmlFor='reset-password-confirm' className='sr-only'>
                Confirm Password
              </label>
              <input
                id='reset-password-confirm'
                name='confirmPassword'
                type='password'
                autoComplete='new-password'
                required
                className='appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm'
                placeholder='Confirm Password'
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Password requirements */}
          <div className='text-xs text-gray-500'>
            <p>Password must:</p>
            <ul className='list-disc list-inside mt-1'>
              <li>Be at least 6 characters long</li>
              <li>Contain at least one uppercase letter</li>
              <li>Contain at least one lowercase letter</li>
              <li>Contain at least one number</li>
            </ul>
          </div>

          {/* Submit button */}
          <div>
            <button
              id='reset-password-submit-button'
              type='submit'
              disabled={loading}
              className='group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50'
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </div>

          {/* Back to login link */}
          <div className='text-center'>
            <Link
              to='/login'
              className='text-sm font-medium text-indigo-600 hover:text-indigo-500'
            >
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;

