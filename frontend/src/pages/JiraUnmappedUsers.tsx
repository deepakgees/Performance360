import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { jiraUnmappedUsersAPI } from '../services/api';

interface SystemUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface UnmappedUsersData {
  unmappedUsers: string[];
  systemUsers: SystemUser[];
}

const JiraUnmappedUsers: React.FC = () => {
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  // Fetch unmapped users and system users
  const { data, isLoading, error } = useQuery<UnmappedUsersData>({
    queryKey: ['jira-unmapped-users'],
    queryFn: async () => {
      const response = await jiraUnmappedUsersAPI.getUnmappedUsers();
      return response.data;
    },
  });

  // Update mapping mutation
  const updateMappingMutation = useMutation({
    mutationFn: async ({
      assigneeName,
      userId,
    }: {
      assigneeName: string;
      userId: string;
    }) => {
      const response = await jiraUnmappedUsersAPI.updateAssigneeMapping(
        assigneeName,
        userId
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      toast.success(
        `Successfully mapped ${variables.assigneeName} to selected user`
      );
      // Refetch the data to update the list
      queryClient.invalidateQueries({ queryKey: ['jira-unmapped-users'] });
      // Clear the mapping from local state
      setMappings(prev => {
        const newMappings = { ...prev };
        delete newMappings[variables.assigneeName];
        return newMappings;
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update mapping');
    },
  });

  const handleUpdateMapping = (assigneeName: string) => {
    const userId = mappings[assigneeName];
    if (!userId) {
      toast.error('Please select a system user first');
      return;
    }

    updateMappingMutation.mutate({ assigneeName, userId });
  };

  const handleUserSelect = (assigneeName: string, userId: string) => {
    setMappings(prev => ({
      ...prev,
      [assigneeName]: userId,
    }));
  };

  if (isLoading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='bg-red-50 border border-red-200 rounded-md p-4'>
        <div className='flex'>
          <div className='flex-shrink-0'>
            <svg
              className='h-5 w-5 text-red-400'
              viewBox='0 0 20 20'
              fill='currentColor'
            >
              <path
                fillRule='evenodd'
                d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                clipRule='evenodd'
              />
            </svg>
          </div>
          <div className='ml-3'>
            <h3 className='text-sm font-medium text-red-800'>
              Error loading unmapped users
            </h3>
            <div className='mt-2 text-sm text-red-700'>
              {error instanceof Error
                ? error.message
                : 'An unexpected error occurred'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.unmappedUsers.length === 0) {
    return (
      <div className='bg-green-50 border border-green-200 rounded-md p-4'>
        <div className='flex'>
          <div className='flex-shrink-0'>
            <svg
              className='h-5 w-5 text-green-400'
              viewBox='0 0 20 20'
              fill='currentColor'
            >
              <path
                fillRule='evenodd'
                d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                clipRule='evenodd'
              />
            </svg>
          </div>
          <div className='ml-3'>
            <h3 className='text-sm font-medium text-green-800'>
              No unmapped users found
            </h3>
            <div className='mt-2 text-sm text-green-700'>
              All Jira assignees have been mapped to system users.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold text-gray-900'>
          Jira Unmapped Users
        </h1>
        <p className='mt-2 text-sm text-gray-600'>
          Map Jira assignees to system users to enable proper reporting and
          analytics.
        </p>
      </div>

      <div className='bg-white shadow overflow-hidden sm:rounded-md'>
        <div className='px-4 py-5 sm:p-6'>
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Jira Assignee Name
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    System User
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {data.unmappedUsers.map(assigneeName => (
                  <tr key={assigneeName}>
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                      {assigneeName}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      <select
                        className='block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md'
                        value={mappings[assigneeName] || ''}
                        onChange={e =>
                          handleUserSelect(assigneeName, e.target.value)
                        }
                      >
                        <option value=''>Select a system user</option>
                        {data.systemUsers.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.firstName} {user.lastName} ({user.email})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      <button
                        onClick={() => handleUpdateMapping(assigneeName)}
                        disabled={
                          !mappings[assigneeName] ||
                          updateMappingMutation.isPending
                        }
                        className='inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
                      >
                        {updateMappingMutation.isPending ? (
                          <>
                            <svg
                              className='animate-spin -ml-1 mr-2 h-4 w-4 text-white'
                              xmlns='http://www.w3.org/2000/svg'
                              fill='none'
                              viewBox='0 0 24 24'
                            >
                              <circle
                                className='opacity-25'
                                cx='12'
                                cy='12'
                                r='10'
                                stroke='currentColor'
                                strokeWidth='4'
                              ></circle>
                              <path
                                className='opacity-75'
                                fill='currentColor'
                                d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                              ></path>
                            </svg>
                            Updating...
                          </>
                        ) : (
                          'Update Mapping'
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className='bg-blue-50 border border-blue-200 rounded-md p-4'>
        <div className='flex'>
          <div className='flex-shrink-0'>
            <svg
              className='h-5 w-5 text-blue-400'
              viewBox='0 0 20 20'
              fill='currentColor'
            >
              <path
                fillRule='evenodd'
                d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                clipRule='evenodd'
              />
            </svg>
          </div>
          <div className='ml-3'>
            <h3 className='text-sm font-medium text-blue-800'>How it works</h3>
            <div className='mt-2 text-sm text-blue-700'>
              <ul className='list-disc pl-5 space-y-1'>
                <li>
                  Select a system user from the dropdown for each unmapped Jira
                  assignee
                </li>
                <li>
                  Click "Update Mapping" to link the Jira assignee to the
                  selected system user
                </li>
                <li>
                  This will update the assigneeId field for all Jira tickets
                  with that assignee name
                </li>
                <li>
                  Once mapped, the assignee will no longer appear in this list
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JiraUnmappedUsers;
