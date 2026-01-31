import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ToastNotification from '../components/Notification';
import { authAPI } from '../services/api';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('First name and last name are required');
      setLoading(false);
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      });

      console.log('Registration successful:', response.data);

      // Show success message and redirect to login
      setNotification({
        message:
          'Registration successful! Please log in with your new account.',
        type: 'success',
      });
      navigate('/login');
    } catch (err: any) {
      console.error('Registration error:', err);

      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.status === 409) {
        setError('An account with this email already exists');
      } else if (err.response?.status === 400) {
        setError('Please check your input and try again');
      } else if (err.code === 'NETWORK_ERROR') {
        setError('Network error. Please check your connection and try again');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id='register-page'
      className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'
    >
      <div id='register-container' className='max-w-md w-full space-y-8'>
        <div id='register-header'>
          <h2
            id='register-title'
            className='mt-6 text-center text-3xl font-extrabold text-gray-900'
          >
            Create your account
          </h2>
        </div>
        <form
          id='register-form'
          className='mt-8 space-y-6'
          onSubmit={handleSubmit}
        >
          {error && (
            <div
              id='register-error'
              className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded'
            >
              {error}
            </div>
          )}
          <div
            id='register-form-fields'
            className='rounded-md shadow-sm -space-y-px'
          >
            <div>
              <input
                id='register-first-name'
                name='firstName'
                type='text'
                required
                className='appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm'
                placeholder='First name'
                value={formData.firstName}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            <div>
              <input
                id='register-last-name'
                name='lastName'
                type='text'
                required
                className='appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm'
                placeholder='Last name'
                value={formData.lastName}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            <div>
              <input
                id='register-email'
                name='email'
                type='email'
                required
                className='appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm'
                placeholder='Email address'
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            <div>
              <input
                id='register-password'
                name='password'
                type='password'
                required
                minLength={6}
                className='appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm'
                placeholder='Password (min 6 characters)'
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <button
              id='register-submit-button'
              type='submit'
              disabled={loading}
              className='group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {loading ? (
                <div className='flex items-center'>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                  Creating account...
                </div>
              ) : (
                'Register'
              )}
            </button>
          </div>

          <div id='register-login-link' className='text-center'>
            <Link
              id='login-link'
              to='/login'
              className='font-medium text-indigo-600 hover:text-indigo-500'
            >
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
      {notification && (
        <ToastNotification
          message={notification.message}
          type={notification.type}
        />
      )}
    </div>
  );
};

export default Register;
