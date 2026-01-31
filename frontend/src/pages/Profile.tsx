import React, { useState } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

/**
 * Profile Page Component
 *
 * Allows logged-in users to change their password.
 * This component provides a secure password change form with proper
 * validation and error handling.
 *
 * Features:
 * - Current password verification
 * - New password with strength requirements
 * - Password confirmation
 * - Form validation and error display
 * - Loading states during password change
 * - Success/error notifications
 * - Responsive design for all screen sizes
 *
 * Password Requirements:
 * - Minimum 6 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 *
 * @component
 * @returns {JSX.Element} The profile page with password change form
 */
const Profile: React.FC = () => {
  // Form state management
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * Validate password strength
   *
   * Checks if the password meets the requirements:
   * - Minimum 6 characters
   * - At least one uppercase letter
   * - At least one lowercase letter
   * - At least one number
   *
   * @param {string} password - Password to validate
   * @returns {string|null} Error message if validation fails, null if valid
   */
  const validatePassword = (password: string): string | null => {
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  /**
   * Handle form submission for password change
   *
   * This function processes the password change form submission by:
   * - Validating all form fields
   * - Checking password strength
   * - Verifying password confirmation
   * - Attempting to change the password
   * - Handling success/error responses
   *
   * @param {React.FormEvent} e - Form submission event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate new password
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match');
      return;
    }

    // Check if new password is different from current
    if (currentPassword === newPassword) {
      setError('New password must be different from current password');
      return;
    }

    setLoading(true);

    try {
      // Attempt to change password
      await authAPI.changePassword({
        currentPassword,
        newPassword,
      });

      // Show success message
      toast.success('Password changed successfully!');

      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
    } catch (err: any) {
      // Display error message
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        'Failed to change password. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      // Reset loading state
      setLoading(false);
    }
  };

  return (
    <div id='profile-page' className='max-w-2xl mx-auto'>
      {/* Page header */}
      <div id='profile-header' className='mb-8'>
        <h1
          id='profile-title'
          className='text-3xl font-bold text-gray-900'
        >
          Reset Password
        </h1>
        <p
          id='profile-subtitle'
          className='mt-2 text-sm text-gray-600'
        >
          Change your password by providing your current password and a new password
        </p>
      </div>

      {/* Password change form */}
      <div id='password-change-card' className='bg-white shadow rounded-lg p-6'>
        <h2 className='text-lg font-medium text-gray-900 mb-6'>
          Change Password
        </h2>

        <form
          id='password-change-form'
          className='space-y-6'
          onSubmit={handleSubmit}
        >
          {/* Error message display */}
          {error && (
            <div
              id='password-error'
              className='rounded-md bg-red-50 p-4'
            >
              <div className='text-sm text-red-700'>{error}</div>
            </div>
          )}

          {/* Current password field */}
          <div>
            <label
              htmlFor='current-password'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Current Password
            </label>
            <input
              id='current-password'
              name='currentPassword'
              type='password'
              autoComplete='current-password'
              required
              className='appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
              placeholder='Enter your current password'
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* New password field */}
          <div>
            <label
              htmlFor='new-password'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              New Password
            </label>
            <input
              id='new-password'
              name='newPassword'
              type='password'
              autoComplete='new-password'
              required
              className='appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
              placeholder='Enter your new password'
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              disabled={loading}
            />
            <p className='mt-2 text-sm text-gray-500'>
              Password must be at least 6 characters and contain at least one
              uppercase letter, one lowercase letter, and one number.
            </p>
          </div>

          {/* Confirm password field */}
          <div>
            <label
              htmlFor='confirm-password'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Confirm New Password
            </label>
            <input
              id='confirm-password'
              name='confirmPassword'
              type='password'
              autoComplete='new-password'
              required
              className='appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
              placeholder='Confirm your new password'
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Submit button */}
          <div>
            <button
              id='password-change-submit-button'
              type='submit'
              disabled={loading}
              className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {loading ? 'Changing Password...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;

