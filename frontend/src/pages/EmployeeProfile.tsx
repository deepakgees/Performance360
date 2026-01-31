import { MagnifyingGlassIcon, UserIcon } from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import UserDetailsPage from '../components/UserDetailsPage';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI } from '../services/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  position?: string;
  lastLoginAt?: string;
  createdAt: string;
  manager?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
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
}

const EmployeeProfile: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const {
    data: allUsers,
    isLoading: usersLoading,
    error: usersError,
  } = useQuery({
    queryKey: ['all-users'],
    queryFn: usersAPI.getAll,
    enabled: !!user?.id,
  });

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

  const handleSearch = () => {
    if (!searchTerm.trim() || !allUsers?.data) return;

    setIsSearching(true);

    // Filter users based on search term
    const filtered = allUsers.data.filter((user: User) =>
      `${user.firstName} ${user.lastName} ${user.email} ${user.position || ''}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );

    setSearchResults(filtered);
    setIsSearching(false);
  };

  const handleUserSelect = (selectedUser: User) => {
    setSelectedUser(selectedUser);
  };

  const handleBackClick = () => {
    setSelectedUser(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  if (usersLoading) {
    return (
      <div className='p-6'>
        <div className='max-w-7xl mx-auto'>
          <div className='flex items-center justify-center h-64'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600'></div>
          </div>
        </div>
      </div>
    );
  }

  if (usersError) {
    return (
      <div className='p-6'>
        <div className='max-w-7xl mx-auto'>
          <div className='bg-red-50 border border-red-200 rounded-md p-4'>
            <div className='flex'>
              <div className='flex-shrink-0'>
                <UserIcon className='h-5 w-5 text-red-400' />
              </div>
              <div className='ml-3'>
                <h3 className='text-sm font-medium text-red-800'>
                  Error loading users
                </h3>
                <div className='mt-2 text-sm text-red-700'>
                  <p>Unable to load users. Please try again later.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If a user is selected, show their details
  if (selectedUser) {
    return (
      <UserDetailsPage
        user={selectedUser}
        onBack={handleBackClick}
        backButtonText='Back to Employee Search'
        showManagerInfo={true}
      />
    );
  }

  return (
    <div id='employee-profile-page' className='p-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>Employee Profile</h1>
          <p className='mt-2 text-gray-600'>
            Search for an employee to view their detailed profile and
            performance data.
          </p>
        </div>

        {/* Search Section */}
        <div className='bg-white rounded-lg shadow mb-6'>
          <div className='p-6'>
            <div className='flex flex-col sm:flex-row gap-4'>
              <div className='flex-1'>
                <label
                  htmlFor='search'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  Search Employee
                </label>
                <div className='relative'>
                  <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                    <MagnifyingGlassIcon className='h-5 w-5 text-gray-400' />
                  </div>
                  <input
                    type='text'
                    id='search'
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder='Search by name, email, or position...'
                    className='block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                  />
                </div>
              </div>
              <div className='flex items-end'>
                <button
                  onClick={handleSearch}
                  disabled={!searchTerm.trim() || isSearching}
                  className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {isSearching ? (
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                  ) : (
                    <MagnifyingGlassIcon className='h-4 w-4 mr-2' />
                  )}
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className='bg-white rounded-lg shadow'>
            <div className='px-6 py-4 border-b border-gray-200'>
              <h3 className='text-lg font-medium text-gray-900'>
                Search Results ({searchResults.length})
              </h3>
            </div>
            <div className='divide-y divide-gray-200'>
              {searchResults.map((user: User) => (
                <div key={user.id} className='p-6 hover:bg-gray-50'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-4'>
                      <img
                        className='h-12 w-12 rounded-full'
                        src={`https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=random&size=48`}
                        alt={`${user.firstName} ${user.lastName}`}
                      />
                      <div>
                        <div className='flex items-center space-x-3'>
                          <h4 className='text-lg font-medium text-gray-900'>
                            {user.firstName} {user.lastName}
                          </h4>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              user.role === 'ADMIN'
                                ? 'bg-red-100 text-red-800'
                                : user.role === 'MANAGER'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {user.role}
                          </span>
                        </div>
                        <div className='flex items-center space-x-4 mt-1'>
                          <p className='text-sm text-gray-600'>{user.email}</p>
                          {user.position && (
                            <p className='text-sm text-gray-500'>
                              {user.position}
                            </p>
                          )}
                          {user.userTeams && user.userTeams.length > 0 && (
                            <p className='text-sm text-gray-500'>
                              {user.userTeams
                                .filter(ut => ut.isActive)
                                .map(ut => ut.team.name)
                                .join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUserSelect(user)}
                      className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                    >
                      Load Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {searchTerm && searchResults.length === 0 && !isSearching && (
          <div className='bg-white rounded-lg shadow p-6 text-center'>
            <UserIcon className='h-12 w-12 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              No employees found
            </h3>
            <p className='text-gray-600'>
              Try adjusting your search terms or check the spelling.
            </p>
          </div>
        )}

        {/* Initial State */}
        {!searchTerm && (
          <div className='bg-white rounded-lg shadow p-6 text-center'>
            <UserIcon className='h-12 w-12 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              Search for an Employee
            </h3>
            <p className='text-gray-600'>
              Enter a name, email, or position to find and view employee
              profiles.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeProfile;
