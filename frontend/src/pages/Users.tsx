import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ToastNotification from '../components/Notification';
import { useAuth } from '../contexts/AuthContext';
import { monthlyAttendanceAPI, usersAPI } from '../services/api';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  position?: string;
  role: string;
  createdAt: string;
  manager?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  userTeams?: Array<{
    id: string;
    joinedAt: string;
    isActive: boolean;
    team: {
      id: string;
      name: string;
      description?: string;
    };
  }>;
  userBusinessUnits?: Array<{
    id: string;
    joinedAt: string;
    isActive: boolean;
    businessUnit: {
      id: string;
      name: string;
      description?: string;
    };
  }>;
}

type SortField = 'name' | 'email' | 'role' | 'manager';
type SortDirection = 'asc' | 'desc';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

// Helper function to get previous month and year
const getPreviousMonth = () => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentYear = now.getFullYear();
  
  if (currentMonth === 1) {
    return { month: 12, year: currentYear - 1 };
  } else {
    return { month: currentMonth - 1, year: currentYear };
  }
};

interface CreateUserFormProps {
  onClose: () => void;
  onSuccess: (user: User) => void;
  onError: (error: string) => void;
}

const CreateUserForm: React.FC<CreateUserFormProps> = ({
  onClose,
  onSuccess,
  onError,
}) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'EMPLOYEE' as 'EMPLOYEE' | 'MANAGER' | 'ADMIN',
    position: '',
    managerId: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [managers, setManagers] = useState<User[]>([]);

  useEffect(() => {
    // Load managers for the dropdown
    const loadManagers = async () => {
      try {
        const response = await usersAPI.getAll();
        const managerUsers = response.data.filter(
          (user: User) => user.role === 'MANAGER' || user.role === 'ADMIN'
        );
        setManagers(managerUsers);
      } catch (error) {
        console.error('Error loading managers:', error);
      }
    };
    loadManagers();
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const userData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
        position: formData.position.trim() || undefined,
        managerId: formData.managerId || undefined,
      };

      const response = await usersAPI.create(userData);
      onSuccess(response.data);
    } catch (error: any) {
      onError(error.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div className='grid grid-cols-2 gap-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            First Name *
          </label>
          <input
            type='text'
            name='firstName'
            value={formData.firstName}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.firstName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder='Enter first name'
          />
          {errors.firstName && (
            <p className='text-red-500 text-xs mt-1'>{errors.firstName}</p>
          )}
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Last Name *
          </label>
          <input
            type='text'
            name='lastName'
            value={formData.lastName}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.lastName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder='Enter last name'
          />
          {errors.lastName && (
            <p className='text-red-500 text-xs mt-1'>{errors.lastName}</p>
          )}
        </div>
      </div>

      <div>
        <label className='block text-sm font-medium text-gray-700 mb-1'>
          Email *
        </label>
        <input
          type='email'
          name='email'
          value={formData.email}
          onChange={handleInputChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            errors.email ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder='Enter email address'
        />
        {errors.email && (
          <p className='text-red-500 text-xs mt-1'>{errors.email}</p>
        )}
      </div>

      <div>
        <label className='block text-sm font-medium text-gray-700 mb-1'>
          Position
        </label>
        <input
          type='text'
          name='position'
          value={formData.position}
          onChange={handleInputChange}
          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
          placeholder='Enter position (optional)'
        />
      </div>

      <div>
        <label className='block text-sm font-medium text-gray-700 mb-1'>
          Role *
        </label>
        <select
          name='role'
          value={formData.role}
          onChange={handleInputChange}
          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
        >
          <option value='EMPLOYEE'>Employee</option>
          <option value='MANAGER'>Manager</option>
          <option value='ADMIN'>Admin</option>
        </select>
      </div>

      <div>
        <label className='block text-sm font-medium text-gray-700 mb-1'>
          Manager
        </label>
        <select
          name='managerId'
          value={formData.managerId}
          onChange={handleInputChange}
          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
        >
          <option value=''>Select a manager (optional)</option>
          {managers.map(manager => (
            <option key={manager.id} value={manager.id}>
              {manager.firstName} {manager.lastName} - {manager.email}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className='block text-sm font-medium text-gray-700 mb-1'>
          Password *
        </label>
        <input
          type='password'
          name='password'
          value={formData.password}
          onChange={handleInputChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            errors.password ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder='Enter password (min 6 characters)'
        />
        {errors.password && (
          <p className='text-red-500 text-xs mt-1'>{errors.password}</p>
        )}
      </div>

      <div>
        <label className='block text-sm font-medium text-gray-700 mb-1'>
          Confirm Password *
        </label>
        <input
          type='password'
          name='confirmPassword'
          value={formData.confirmPassword}
          onChange={handleInputChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder='Confirm password'
        />
        {errors.confirmPassword && (
          <p className='text-red-500 text-xs mt-1'>{errors.confirmPassword}</p>
        )}
      </div>

      <div className='flex space-x-3 pt-4'>
        <button
          type='submit'
          disabled={loading}
          className='flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {loading ? 'Creating...' : 'Create User'}
        </button>
        <button
          type='button'
          onClick={onClose}
          disabled={loading}
          className='flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

const Users: React.FC = () => {
  const { user } = useAuth();
  const _navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]); // Store all users for filtering
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filters, setFilters] = useState({
    businessUnit: '',
    manager: '',
    role: '',
    team: '',
  });
  const [showResetModal, setShowResetModal] = useState(false);
  const [showEditManagerModal, setShowEditManagerModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [editManagerLoading, setEditManagerLoading] = useState(false);
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedUserForAttendance, setSelectedUserForAttendance] = useState<User | null>(null);
  const [sendResetLinkLoading, setSendResetLinkLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning';
  } | null>(null);

  const applyFilters = useCallback((userList: User[]) => {
    let filtered = [...userList];

    // Filter by business unit
    if (filters.businessUnit) {
      filtered = filtered.filter(user =>
        user.userBusinessUnits?.some(
          ub => ub.businessUnit.id === filters.businessUnit && ub.isActive
        )
      );
    }

    // Filter by manager
    if (filters.manager) {
      filtered = filtered.filter(user => user.manager?.id === filters.manager);
    }

    // Filter by role
    if (filters.role) {
      filtered = filtered.filter(user => user.role === filters.role);
    }

    // Filter by team
    if (filters.team) {
      filtered = filtered.filter(user =>
        user.userTeams?.some(
          ut => ut.team.id === filters.team && ut.isActive
        )
      );
    }

    setUsers(filtered);
  }, [filters]);

  // Load data on component mount
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getAll();
      setAllUsers(response.data);
      applyFilters(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  }, [applyFilters]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Get unique values for filter dropdowns
  const getUniqueBusinessUnits = () => {
    const businessUnits = new Map<string, { id: string; name: string }>();
    allUsers.forEach(user => {
      user.userBusinessUnits?.forEach(ub => {
        if (ub.isActive && !businessUnits.has(ub.businessUnit.id)) {
          businessUnits.set(ub.businessUnit.id, {
            id: ub.businessUnit.id,
            name: ub.businessUnit.name,
          });
        }
      });
    });
    return Array.from(businessUnits.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  };

  const getUniqueManagers = () => {
    const managers = new Map<string, { id: string; name: string }>();
    allUsers.forEach(user => {
      if (user.manager && !managers.has(user.manager.id)) {
        managers.set(user.manager.id, {
          id: user.manager.id,
          name: `${user.manager.firstName} ${user.manager.lastName}`,
        });
      }
    });
    return Array.from(managers.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  };

  const getUniqueTeams = () => {
    const teams = new Map<string, { id: string; name: string }>();
    allUsers.forEach(user => {
      user.userTeams?.forEach(ut => {
        if (ut.isActive && !teams.has(ut.team.id)) {
          teams.set(ut.team.id, {
            id: ut.team.id,
            name: ut.team.name,
          });
        }
      });
    });
    return Array.from(teams.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  };

  const getUniqueRoles = () => {
    const roles = new Set<string>();
    allUsers.forEach(user => {
      if (user.role) {
        roles.add(user.role);
      }
    });
    return Array.from(roles).sort();
  };

  const sortedUsers = [...users].sort((a, b) => {
    let aValue: string;
    let bValue: string;

    switch (sortField) {
      case 'name':
        aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
        bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
        break;
      case 'email':
        aValue = a.email.toLowerCase();
        bValue = b.email.toLowerCase();
        break;
      case 'role':
        aValue = a.role.toLowerCase();
        bValue = b.role.toLowerCase();
        break;
      case 'manager':
        aValue = a.manager
          ? `${a.manager.firstName} ${a.manager.lastName}`.toLowerCase()
          : '';
        bValue = b.manager
          ? `${b.manager.firstName} ${b.manager.lastName}`.toLowerCase()
          : '';
        break;
      default:
        return 0;
    }

    if (sortDirection === 'asc') {
      return aValue.localeCompare(bValue);
    } else {
      return bValue.localeCompare(aValue);
    }
  });

  const handleResetPassword = async () => {
    if (!selectedUser) return;

    if (!newPassword.trim()) {
      setNotification({
        message: 'Please enter a new password.',
        type: 'warning',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setNotification({ message: 'Passwords do not match.', type: 'error' });
      return;
    }

    if (newPassword.length < 6) {
      setNotification({
        message: 'Password must be at least 6 characters long.',
        type: 'error',
      });
      return;
    }

    try {
      setResetLoading(true);
      await usersAPI.resetPassword(selectedUser.id, { password: newPassword });
      setNotification({
        message: 'Password reset successfully!',
        type: 'success',
      });
      setShowResetModal(false);
      setSelectedUser(null);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error resetting password:', error);
      setNotification({
        message: 'Failed to reset password. Please try again.',
        type: 'error',
      });
    } finally {
      setResetLoading(false);
    }
  };

  const handleEditManager = async () => {
    if (!selectedUser) return;

    try {
      setEditManagerLoading(true);
      await usersAPI.updateManager(selectedUser.id, selectedManagerId || null);
      setNotification({
        message: 'Manager updated successfully!',
        type: 'success',
      });
      setShowEditManagerModal(false);
      setSelectedUser(null);
      setSelectedManagerId('');
      await loadUsers(); // Reload users to get updated data
    } catch (error) {
      console.error('Error updating manager:', error);
      setNotification({
        message: 'Failed to update manager. Please try again.',
        type: 'error',
      });
    } finally {
      setEditManagerLoading(false);
    }
  };

  const handleDeleteUser = async (userToDelete: User) => {
    const confirmMessage = `Are you sure you want to delete ${userToDelete.firstName} ${userToDelete.lastName}?\n\nThis action cannot be undone.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setDeleteLoading(true);
      await usersAPI.delete(userToDelete.id);
      setNotification({
        message: 'User deleted successfully!',
        type: 'success',
      });
      await loadUsers(); // Reload users to get updated data
    } catch (error) {
      console.error('Error deleting user:', error);
      setNotification({
        message: 'Failed to delete user. Please try again.',
        type: 'error',
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSendResetLink = async (userToReset: User) => {
    try {
      setSendResetLinkLoading(userToReset.id);
      await usersAPI.sendResetLink(userToReset.id);
      setNotification({
        message: `Password reset link sent successfully to ${userToReset.email}`,
        type: 'success',
      });
    } catch (error: any) {
      console.error('Error sending reset link:', error);
      setNotification({
        message:
          error.response?.data?.message ||
          'Failed to send reset link. Please try again.',
        type: 'error',
      });
    } finally {
      setSendResetLinkLoading(null);
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <svg
          className='w-4 h-4 text-gray-400'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4'
          />
        </svg>
      );
    }

    return sortDirection === 'asc' ? (
      <svg
        className='w-4 h-4 text-indigo-600'
        fill='none'
        stroke='currentColor'
        viewBox='0 0 24 24'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={2}
          d='M5 15l7-7 7 7'
        />
      </svg>
    ) : (
      <svg
        className='w-4 h-4 text-indigo-600'
        fill='none'
        stroke='currentColor'
        viewBox='0 0 24 24'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={2}
          d='M19 9l-7 7-7-7'
        />
      </svg>
    );
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800';
      case 'MANAGER':
        return 'bg-blue-100 text-blue-800';
      case 'USER':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Check for admin role
  if (user?.role !== 'ADMIN') {
    return (
      <div className='p-6'>
        <div className='max-w-2xl mx-auto'>
          <div className='bg-white rounded-lg shadow-md p-8 text-center'>
            <h2 className='text-xl font-semibold text-gray-900 mb-2'>
              Access Denied
            </h2>
            <p className='text-gray-600'>
              This page is restricted to administrators only.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id='users-page'>
      <div className='max-w-7xl mx-auto'>
        <div className='flex justify-between items-center mb-6'>
          <h1 id='users-title' className='text-2xl font-bold text-gray-900'>
            User Management
          </h1>
          {user?.role === 'ADMIN' && (
            <button
              id='add-user-button'
              onClick={() => setShowCreateUserModal(true)}
              className='bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-2'
            >
              <svg
                className='w-4 h-4'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 4v16m8-8H4'
                />
              </svg>
              <span>Add User</span>
            </button>
          )}
        </div>

        {/* Filters */}
        <div className='bg-white rounded-lg shadow-md p-4 mb-6'>
          <div className='grid grid-cols-4 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Filter by Business Unit
              </label>
              <select
                value={filters.businessUnit}
                onChange={e =>
                  setFilters({ ...filters, businessUnit: e.target.value })
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
              >
                <option value=''>All Business Units</option>
                {getUniqueBusinessUnits().map(bu => (
                  <option key={bu.id} value={bu.id}>
                    {bu.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Filter by Manager
              </label>
              <select
                value={filters.manager}
                onChange={e =>
                  setFilters({ ...filters, manager: e.target.value })
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
              >
                <option value=''>All Managers</option>
                {getUniqueManagers().map(manager => (
                  <option key={manager.id} value={manager.id}>
                    {manager.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Filter by Role
              </label>
              <select
                value={filters.role}
                onChange={e =>
                  setFilters({ ...filters, role: e.target.value })
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
              >
                <option value=''>All Roles</option>
                {getUniqueRoles().map(role => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Filter by Team
              </label>
              <select
                value={filters.team}
                onChange={e =>
                  setFilters({ ...filters, team: e.target.value })
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
              >
                <option value=''>All Teams</option>
                {getUniqueTeams().map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear Filters Button */}
          {(filters.businessUnit ||
            filters.manager ||
            filters.role ||
            filters.team) && (
            <div className='mt-4'>
              <button
                onClick={() =>
                  setFilters({
                    businessUnit: '',
                    manager: '',
                    role: '',
                    team: '',
                  })
                }
                className='text-sm text-indigo-600 hover:text-indigo-900'
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>

        {/* Users Table */}
        <div
          id='users-table-container'
          className='bg-white rounded-lg shadow-md overflow-hidden'
        >
          {loading ? (
            <div
              id='users-loading'
              className='flex justify-center items-center py-12'
            >
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600'></div>
              <span className='ml-2 text-gray-600'>Loading users...</span>
            </div>
          ) : (
            <div id='users-table-wrapper' className='overflow-x-auto'>
              <table
                id='users-table'
                className='min-w-full divide-y divide-gray-200'
              >
                <thead className='bg-gray-50'>
                  <tr>
                    <th
                      id='sort-name-header'
                      scope='col'
                      className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
                      onClick={() => handleSort('name')}
                    >
                      <div className='flex items-center space-x-1'>
                        <span>Name</span>
                        {getSortIcon('name')}
                      </div>
                    </th>
                    <th
                      id='sort-manager-header'
                      scope='col'
                      className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
                      onClick={() => handleSort('manager')}
                    >
                      <div className='flex items-center space-x-1'>
                        <span>Manager</span>
                        {getSortIcon('manager')}
                      </div>
                    </th>
                    <th
                      id='sort-role-header'
                      scope='col'
                      className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
                      onClick={() => handleSort('role')}
                    >
                      <div className='flex items-center space-x-1'>
                        <span>Role</span>
                        {getSortIcon('role')}
                      </div>
                    </th>
                    <th
                      id='actions-header'
                      scope='col'
                      className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                    >
                      Actions
                    </th>
                    <th
                      id='sort-email-header'
                      scope='col'
                      className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
                      onClick={() => handleSort('email')}
                    >
                      <div className='flex items-center space-x-1'>
                        <span>Email</span>
                        {getSortIcon('email')}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody
                  id='users-table-body'
                  className='bg-white divide-y divide-gray-200'
                >
                  {sortedUsers.length === 0 ? (
                    <tr id='no-users-row'>
                      <td
                        colSpan={5}
                        className='px-6 py-12 text-center text-gray-500'
                      >
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    sortedUsers.map(userItem => (
                      <tr
                        key={userItem.id}
                        id={`user-row-${userItem.id}`}
                        className='hover:bg-gray-50'
                      >
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='flex items-center'>
                            <div className='flex-shrink-0 h-10 w-10'>
                              <div className='h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center'>
                                <span className='text-sm font-medium text-white'>
                                  {userItem.firstName.charAt(0)}
                                  {userItem.lastName.charAt(0)}
                                </span>
                              </div>
                            </div>
                            <div className='ml-4'>
                              <div className='text-sm font-medium text-gray-900'>
                                {userItem.firstName} {userItem.lastName}
                              </div>
                              <div className='text-sm text-gray-500'>
                                {userItem.position || 'No position'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                          {userItem.manager
                            ? `${userItem.manager.firstName} ${userItem.manager.lastName}`
                            : '-'}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(
                              userItem.role
                            )}`}
                          >
                            {userItem.role}
                          </span>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                          <div className='flex flex-col space-y-1'>
                            <button
                              onClick={() => {
                                setSelectedUser(userItem);
                                setShowResetModal(true);
                              }}
                              className='text-indigo-600 hover:text-indigo-900 text-xs'
                            >
                              Reset Password
                            </button>
                            <button
                              onClick={() => handleSendResetLink(userItem)}
                              disabled={sendResetLinkLoading === userItem.id}
                              className='text-green-600 hover:text-green-900 text-xs disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                              {sendResetLinkLoading === userItem.id
                                ? 'Sending...'
                                : 'Send Reset Link'}
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(userItem);
                                setSelectedManagerId(
                                  userItem.manager?.id || ''
                                );
                                setShowEditManagerModal(true);
                              }}
                              className='text-blue-600 hover:text-blue-900 text-xs'
                            >
                              Edit Manager
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUserForAttendance(userItem);
                                setShowAttendanceModal(true);
                              }}
                              className='text-purple-600 hover:text-purple-900 text-xs'
                            >
                              Update Attendance
                            </button>
                            <button
                              onClick={() => handleDeleteUser(userItem)}
                              disabled={deleteLoading}
                              className='text-red-600 hover:text-red-900 text-xs disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                              {deleteLoading ? 'Deleting...' : 'Delete User'}
                            </button>
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                          {userItem.email}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Reset Password Modal */}
      {showResetModal && selectedUser && (
        <div className='fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 w-full max-w-md'>
            <h2 className='text-xl font-semibold mb-4'>Reset Password</h2>
            <div className='mb-4'>
              <p className='text-sm text-gray-600'>
                Reset password for:{' '}
                <span className='font-medium'>
                  {selectedUser.firstName} {selectedUser.lastName}
                </span>
              </p>
              <p className='text-sm text-gray-500'>{selectedUser.email}</p>
            </div>
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  New Password *
                </label>
                <input
                  type='password'
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder='Enter new password'
                  className='w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Confirm Password *
                </label>
                <input
                  type='password'
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder='Confirm new password'
                  className='w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                />
              </div>

              <div className='flex space-x-3'>
                <button
                  onClick={handleResetPassword}
                  disabled={resetLoading}
                  className='flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {resetLoading ? 'Resetting...' : 'Reset Password'}
                </button>
                <button
                  onClick={() => {
                    setShowResetModal(false);
                    setSelectedUser(null);
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  disabled={resetLoading}
                  className='flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Manager Modal */}
      {showEditManagerModal && selectedUser && (
        <div className='fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 w-full max-w-md'>
            <h2 className='text-xl font-semibold mb-4'>Edit Manager</h2>
            <div className='mb-4'>
              <p className='text-sm text-gray-600'>
                Update manager for:{' '}
                <span className='font-medium'>
                  {selectedUser.firstName} {selectedUser.lastName}
                </span>
              </p>
              <p className='text-sm text-gray-500'>{selectedUser.email}</p>
            </div>
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Manager
                </label>
                <select
                  value={selectedManagerId}
                  onChange={e => setSelectedManagerId(e.target.value)}
                  className='w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                >
                  <option value=''>No manager (remove current manager)</option>
                  {users
                    .filter(
                      user =>
                        (user.role === 'MANAGER' || user.role === 'ADMIN') &&
                        user.id !== selectedUser.id
                    )
                    .map(user => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} - {user.email} (
                        {user.role})
                      </option>
                    ))}
                </select>
                <p className='text-xs text-gray-500 mt-1'>
                  Only users with MANAGER or ADMIN role can be selected. Users
                  cannot be their own manager.
                </p>
              </div>

              <div className='flex space-x-3'>
                <button
                  onClick={handleEditManager}
                  disabled={editManagerLoading}
                  className='flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {editManagerLoading ? 'Updating...' : 'Update Manager'}
                </button>
                <button
                  onClick={() => {
                    setShowEditManagerModal(false);
                    setSelectedUser(null);
                    setSelectedManagerId('');
                  }}
                  disabled={editManagerLoading}
                  className='flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Create User Modal */}
      {showCreateUserModal && (
        <div className='fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50'>
          <div className='relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white'>
            <div className='mt-3'>
              <h3 className='text-lg font-medium text-gray-900 mb-4'>
                Add New User
              </h3>
              <CreateUserForm
                onClose={() => setShowCreateUserModal(false)}
                onSuccess={newUser => {
                  setUsers([...users, newUser]);
                  setShowCreateUserModal(false);
                  setNotification({
                    message: 'User created successfully',
                    type: 'success',
                  });
                }}
                onError={error => {
                  setNotification({
                    message: error,
                    type: 'error',
                  });
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Attendance Modal */}
      {showAttendanceModal && selectedUserForAttendance && (
        <AttendanceModal
          user={selectedUserForAttendance}
          onClose={() => {
            setShowAttendanceModal(false);
            setSelectedUserForAttendance(null);
          }}
          onSuccess={() => {
            setShowAttendanceModal(false);
            setSelectedUserForAttendance(null);
            setNotification({
              message: 'Attendance record created successfully!',
              type: 'success',
            });
          }}
          onError={(error: string) => {
            setNotification({
              message: error,
              type: 'error',
            });
          }}
        />
      )}

      {notification && (
        <ToastNotification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

// Attendance Modal Component
interface AttendanceModalProps {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const AttendanceModal: React.FC<AttendanceModalProps> = ({
  user,
  onClose,
  onSuccess,
  onError,
}) => {
  const previousMonth = getPreviousMonth();
  const [formData, setFormData] = useState({
    month: previousMonth.month,
    year: previousMonth.year,
    workingDays: 0,
    presentInOffice: 0,
    leavesAvailed: 0 as number,
    weeklyCompliance: null as boolean | null,
    exceptionApproved: null as boolean | null,
    reasonForNonCompliance: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.month < 1 || formData.month > 12) {
      newErrors.month = 'Month must be between 1 and 12';
    }

    if (formData.year < 2020 || formData.year > 2030) {
      newErrors.year = 'Year must be between 2020 and 2030';
    }

    if (formData.workingDays < 0 || formData.workingDays > 31) {
      newErrors.workingDays = 'Working days must be between 0 and 31';
    }

    if (formData.presentInOffice < 0) {
      newErrors.presentInOffice = 'Present in office cannot be negative';
    }

    if (formData.presentInOffice > formData.workingDays) {
      newErrors.presentInOffice =
        'Present in office cannot exceed working days';
    }

    if (formData.leavesAvailed < 0) {
      newErrors.leavesAvailed = 'Leaves availed cannot be negative';
    }

    if (formData.leavesAvailed > formData.workingDays) {
      newErrors.leavesAvailed = 'Leaves availed cannot exceed working days';
    }

    // Validate that leaves availed is a valid number (can be decimal)
    if (isNaN(formData.leavesAvailed)) {
      newErrors.leavesAvailed = 'Leaves availed must be a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await monthlyAttendanceAPI.create({
        userId: user.id,
        month: formData.month,
        year: formData.year,
        workingDays: formData.workingDays,
        presentInOffice: formData.presentInOffice,
        leavesAvailed: formData.leavesAvailed,
        weeklyCompliance: formData.weeklyCompliance,
        reasonForNonCompliance: formData.reasonForNonCompliance || undefined,
      });
      onSuccess();
    } catch (error: any) {
      onError(
        error.response?.data?.error || 'Failed to create attendance record'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    let processedValue: any = value;

    if (name === 'month' || name === 'year' || name === 'workingDays' || name === 'presentInOffice') {
      processedValue = value === '' ? 0 : parseInt(value, 10);
    } else if (name === 'leavesAvailed') {
      processedValue = value === '' ? 0 : parseFloat(value);
    } else if (name === 'weeklyCompliance' || name === 'exceptionApproved') {
      if (value === '') processedValue = null;
      else if (value === 'true') processedValue = true;
      else processedValue = false;
    }

    setFormData(prev => ({ ...prev, [name]: processedValue }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className='fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50'>
      <div className='relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white'>
        <div className='mt-3'>
          <div className='flex justify-between items-center mb-4'>
            <h3 className='text-lg font-medium text-gray-900'>
              Add Attendance Record
            </h3>
            <button
              onClick={onClose}
              className='text-gray-400 hover:text-gray-600'
            >
              <svg
                className='w-6 h-6'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </button>
          </div>
          <div className='mb-4 p-3 bg-gray-50 rounded-md'>
            <p className='text-sm text-gray-600'>
              <span className='font-medium'>Employee:</span>{' '}
              {user.firstName} {user.lastName} ({user.email})
            </p>
          </div>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Month *
                </label>
                <select
                  name='month'
                  value={formData.month}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.month ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  {MONTH_NAMES.map((month, index) => (
                    <option key={index + 1} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
                {errors.month && (
                  <p className='text-red-500 text-xs mt-1'>{errors.month}</p>
                )}
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Year *
                </label>
                <input
                  type='number'
                  name='year'
                  value={formData.year}
                  onChange={handleInputChange}
                  min='2020'
                  max='2030'
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.year ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.year && (
                  <p className='text-red-500 text-xs mt-1'>{errors.year}</p>
                )}
              </div>
            </div>

            <div className='grid grid-cols-3 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Working Days *
                </label>
                <input
                  type='number'
                  name='workingDays'
                  value={formData.workingDays}
                  onChange={handleInputChange}
                  min='0'
                  max='31'
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.workingDays ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.workingDays && (
                  <p className='text-red-500 text-xs mt-1'>
                    {errors.workingDays}
                  </p>
                )}
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Present in Office *
                </label>
                <input
                  type='number'
                  name='presentInOffice'
                  value={formData.presentInOffice}
                  onChange={handleInputChange}
                  min='0'
                  max={formData.workingDays}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.presentInOffice ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.presentInOffice && (
                  <p className='text-red-500 text-xs mt-1'>
                    {errors.presentInOffice}
                  </p>
                )}
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Leaves Availed
                </label>
                <input
                  type='number'
                  name='leavesAvailed'
                  value={formData.leavesAvailed}
                  onChange={handleInputChange}
                  min='0'
                  max={formData.workingDays}
                  step='0.5'
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.leavesAvailed ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.leavesAvailed && (
                  <p className='text-red-500 text-xs mt-1'>
                    {errors.leavesAvailed}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Weekly Compliance
              </label>
              <select
                name='weeklyCompliance'
                value={
                  formData.weeklyCompliance === null
                    ? ''
                    : formData.weeklyCompliance.toString()
                }
                onChange={handleInputChange}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
              >
                <option value=''>Not Set</option>
                <option value='true'>Yes</option>
                <option value='false'>No</option>
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Exception Approved
              </label>
              <select
                name='exceptionApproved'
                value={
                  formData.exceptionApproved === null
                    ? ''
                    : formData.exceptionApproved.toString()
                }
                onChange={handleInputChange}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
              >
                <option value=''>Not Set</option>
                <option value='true'>Yes</option>
                <option value='false'>No</option>
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Reason for Non-Compliance
              </label>
              <textarea
                name='reasonForNonCompliance'
                value={formData.reasonForNonCompliance}
                onChange={handleInputChange}
                rows={3}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                placeholder='Enter reason for non-compliance (optional)'
              />
            </div>

            <div className='flex space-x-3 pt-4'>
              <button
                type='submit'
                disabled={loading}
                className='flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {loading ? 'Creating...' : 'Create Attendance'}
              </button>
              <button
                type='button'
                onClick={onClose}
                disabled={loading}
                className='flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Users;
