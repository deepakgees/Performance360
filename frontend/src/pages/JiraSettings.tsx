import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import Notification from '../components/Notification';
import { api } from '../services/api';

interface JiraConfiguration {
  id: string;
  name: string;
  serverUrl: string;
  username: string;
  jql: string;
  inProgressStatuses: string[];
  blockedStatuses: string[];
  reviewStatuses: string[];
  promotionStatuses: string[];
  refinementStatuses: string[];
  readyForDevelopmentStatuses: string[];
  ticketClosesStatuses?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateJiraConfigurationRequest {
  name: string;
  serverUrl: string;
  username: string;
  apiToken: string;
  jql: string;
  inProgressStatuses: string[];
  blockedStatuses: string[];
  reviewStatuses: string[];
  promotionStatuses: string[];
  refinementStatuses: string[];
  readyForDevelopmentStatuses: string[];
  ticketClosesStatuses: string[];
}

const JiraSettings: React.FC = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingConfiguration, setEditingConfiguration] =
    useState<JiraConfiguration | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [syncingConfigurationId, setSyncingConfigurationId] = useState<
    string | null
  >(null);
  const queryClient = useQueryClient();

  // Form state
  const [formData, setFormData] = useState<CreateJiraConfigurationRequest>({
    name: '',
    serverUrl: '',
    username: '',
    apiToken: '',
    jql: '',
    inProgressStatuses: [''],
    blockedStatuses: [''],
    reviewStatuses: [''],
    promotionStatuses: [''],
    refinementStatuses: [''],
    readyForDevelopmentStatuses: [''],
    ticketClosesStatuses: [''],
  });

  // Fetch Jira configurations
  const {
    data: configurations,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['jira-configurations'],
    queryFn: async () => {
      const response = await api.get('/api/jira-configurations');
      return response.data.data as JiraConfiguration[];
    },
  });

  // Create Jira configuration mutation
  const createConfigurationMutation = useMutation({
    mutationFn: async (data: CreateJiraConfigurationRequest) => {
      const response = await api.post('/api/jira-configurations', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jira-configurations'] });
      setNotification({
        type: 'success',
        message: 'Jira configuration created successfully',
      });
      setShowAddForm(false);
      resetForm();
    },
    onError: (error: any) => {
      setNotification({
        type: 'error',
        message:
          error.response?.data?.message ||
          'Failed to create Jira configuration',
      });
    },
  });

  // Toggle configuration status mutation
  const toggleConfigurationMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch(`/api/jira-configurations/${id}/toggle`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jira-configurations'] });
      setNotification({
        type: 'success',
        message: 'Configuration status updated successfully',
      });
    },
    onError: (error: any) => {
      setNotification({
        type: 'error',
        message:
          error.response?.data?.message ||
          'Failed to update configuration status',
      });
    },
  });

  // Update Jira configuration mutation
  const updateConfigurationMutation = useMutation({
    mutationFn: async (data: {
      id: string;
      config: CreateJiraConfigurationRequest;
    }) => {
      const response = await api.put(
        `/api/jira-configurations/${data.id}`,
        data.config
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jira-configurations'] });
      setNotification({
        type: 'success',
        message: 'Jira configuration updated successfully',
      });
      setShowEditForm(false);
      setEditingConfiguration(null);
      resetForm();
    },
    onError: (error: any) => {
      setNotification({
        type: 'error',
        message:
          error.response?.data?.message ||
          'Failed to update Jira configuration',
      });
    },
  });

  // Delete configuration mutation
  const deleteConfigurationMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/api/jira-configurations/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jira-configurations'] });
      setNotification({
        type: 'success',
        message: 'Jira configuration deleted successfully',
      });
    },
    onError: (error: any) => {
      setNotification({
        type: 'error',
        message:
          error.response?.data?.message ||
          'Failed to delete Jira configuration',
      });
    },
  });

  // Sync tickets mutation
  const syncTicketsMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/api/jira-configurations/${id}/sync`);
      return response.data;
    },
    onSuccess: data => {
      setSyncingConfigurationId(null);
      setNotification({
        type: 'success',
        message: `Tickets synced successfully! Found ${
          data.data?.totalTickets || 0
        } tickets.`,
      });
    },
    onError: (error: any) => {
      setSyncingConfigurationId(null);
      setNotification({
        type: 'error',
        message:
          error.response?.data?.message || 'Failed to sync tickets from Jira',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      serverUrl: '',
      username: '',
      apiToken: '',
      jql: '',
      inProgressStatuses: [''],
      blockedStatuses: [''],
      reviewStatuses: [''],
      promotionStatuses: [''],
      refinementStatuses: [''],
      readyForDevelopmentStatuses: [''],
      ticketClosesStatuses: [''],
    });
  };

  const handleInputChange = (
    field: keyof CreateJiraConfigurationRequest,
    value: any
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayInputChange = (
    field:
      | 'inProgressStatuses'
      | 'blockedStatuses'
      | 'reviewStatuses'
      | 'promotionStatuses'
      | 'refinementStatuses'
      | 'readyForDevelopmentStatuses'
      | 'ticketClosesStatuses',
    index: number,
    value: string
  ) => {
    setFormData(prev => {
      const newArray = [...prev[field]];
      newArray[index] = value;
      return { ...prev, [field]: newArray };
    });
  };

  const addArrayItem = (
    field:
      | 'inProgressStatuses'
      | 'blockedStatuses'
      | 'reviewStatuses'
      | 'promotionStatuses'
      | 'refinementStatuses'
      | 'readyForDevelopmentStatuses'
      | 'ticketClosesStatuses'
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], ''],
    }));
  };

  const removeArrayItem = (
    field:
      | 'inProgressStatuses'
      | 'blockedStatuses'
      | 'reviewStatuses'
      | 'promotionStatuses'
      | 'refinementStatuses'
      | 'readyForDevelopmentStatuses'
      | 'ticketClosesStatuses',
    index: number
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Filter out empty status values
    const filteredData = {
      ...formData,
      inProgressStatuses: formData.inProgressStatuses.filter(
        status => status.trim() !== ''
      ),
      blockedStatuses: formData.blockedStatuses.filter(
        status => status.trim() !== ''
      ),
      reviewStatuses: formData.reviewStatuses.filter(
        status => status.trim() !== ''
      ),
      promotionStatuses: formData.promotionStatuses.filter(
        status => status.trim() !== ''
      ),
      refinementStatuses: formData.refinementStatuses.filter(
        status => status.trim() !== ''
      ),
      readyForDevelopmentStatuses: formData.readyForDevelopmentStatuses.filter(
        status => status.trim() !== ''
      ),
      ticketClosesStatuses: formData.ticketClosesStatuses.filter(
        status => status.trim() !== ''
      ),
    };

    if (showEditForm && editingConfiguration) {
      updateConfigurationMutation.mutate({
        id: editingConfiguration.id,
        config: filteredData,
      });
    } else {
      createConfigurationMutation.mutate(filteredData);
    }
  };

  const handleToggleStatus = (id: string) => {
    if (
      window.confirm(
        'Are you sure you want to toggle this configuration status?'
      )
    ) {
      toggleConfigurationMutation.mutate(id);
    }
  };

  const handleEdit = (config: JiraConfiguration) => {
    setEditingConfiguration(config);
    setFormData({
      name: config.name,
      serverUrl: config.serverUrl,
      username: config.username,
      apiToken: '', // Don't populate API token for security
      jql: config.jql,
      inProgressStatuses:
        config.inProgressStatuses.length > 0 ? config.inProgressStatuses : [''],
      blockedStatuses:
        config.blockedStatuses.length > 0 ? config.blockedStatuses : [''],
      reviewStatuses:
        config.reviewStatuses.length > 0 ? config.reviewStatuses : [''],
      promotionStatuses:
        config.promotionStatuses.length > 0 ? config.promotionStatuses : [''],
      refinementStatuses:
        config.refinementStatuses.length > 0 ? config.refinementStatuses : [''],
      readyForDevelopmentStatuses:
        config.readyForDevelopmentStatuses.length > 0
          ? config.readyForDevelopmentStatuses
          : [''],
      ticketClosesStatuses:
        config.ticketClosesStatuses && config.ticketClosesStatuses.length > 0
          ? config.ticketClosesStatuses
          : [''],
    });
    setShowEditForm(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete the configuration "${name}"?`
      )
    ) {
      deleteConfigurationMutation.mutate(id);
    }
  };

  const handleSync = (id: string, name: string) => {
    if (
      window.confirm(
        `Are you sure you want to sync tickets from "${name}"? This may take a few moments.`
      )
    ) {
      setSyncingConfigurationId(id);
      syncTicketsMutation.mutate(id);
    }
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
              Error loading Jira configurations
            </h3>
            <div className='mt-2 text-sm text-red-700'>
              Failed to load Jira configurations. Please try again.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Global Sync Overlay */}
      {syncingConfigurationId && (
        <div className='fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center'>
          <div className='bg-white rounded-lg p-8 shadow-xl max-w-md w-full mx-4'>
            <div className='flex items-center justify-center mb-4'>
              <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600'></div>
            </div>
            <h3 className='text-lg font-medium text-gray-900 text-center mb-2'>
              Syncing Jira Tickets
            </h3>
            <p className='text-sm text-gray-600 text-center'>
              Please wait while we sync tickets from{' '}
              <strong>
                {configurations?.find(c => c.id === syncingConfigurationId)
                  ?.name || 'Jira'}
              </strong>
              . This may take a few moments...
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>
            Jira Configurations
          </h1>
          <p className='mt-1 text-sm text-gray-600'>
            Manage Jira project configurations for ticket extraction
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          disabled={syncingConfigurationId !== null}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            syncingConfigurationId !== null
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          Add New Configuration
        </button>
      </div>

      {/* Configurations List */}
      <div className='bg-white shadow rounded-lg'>
        <div className='px-6 py-4 border-b border-gray-200'>
          <h2 className='text-lg font-medium text-gray-900'>
            Configured Projects
          </h2>
        </div>
        <div className='divide-y divide-gray-200'>
          {configurations && configurations.length > 0 ? (
            configurations.map(config => (
              <div key={config.id} className='px-6 py-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex-1'>
                    <div className='flex items-center space-x-3'>
                      <h3 className='text-lg font-medium text-gray-900'>
                        {config.name}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          config.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {config.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className='mt-2 text-sm text-gray-600'>
                      <p>
                        <strong>Server:</strong> {config.serverUrl}
                      </p>
                      <p>
                        <strong>Username:</strong> {config.username}
                      </p>
                      <p>
                        <strong>JQL:</strong> {config.jql}
                      </p>
                      <p>
                        <strong>Created:</strong>{' '}
                        {new Date(config.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className='mt-3 text-sm text-gray-600'>
                      <div className='grid grid-cols-2 gap-4'>
                        <div>
                          <strong>In Progress Statuses:</strong>
                          <div className='flex flex-wrap gap-1 mt-1'>
                            {config.inProgressStatuses.map((status, index) => (
                              <span
                                key={index}
                                className='bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs'
                              >
                                {status}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <strong>Blocked Statuses:</strong>
                          <div className='flex flex-wrap gap-1 mt-1'>
                            {config.blockedStatuses.map((status, index) => (
                              <span
                                key={index}
                                className='bg-red-100 text-red-800 px-2 py-1 rounded text-xs'
                              >
                                {status}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <strong>Review Statuses:</strong>
                          <div className='flex flex-wrap gap-1 mt-1'>
                            {config.reviewStatuses.map((status, index) => (
                              <span
                                key={index}
                                className='bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs'
                              >
                                {status}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <strong>Promotion Statuses:</strong>
                          <div className='flex flex-wrap gap-1 mt-1'>
                            {config.promotionStatuses.map((status, index) => (
                              <span
                                key={index}
                                className='bg-green-100 text-green-800 px-2 py-1 rounded text-xs'
                              >
                                {status}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <strong>Refinement Statuses:</strong>
                          <div className='flex flex-wrap gap-1 mt-1'>
                            {config.refinementStatuses.map((status, index) => (
                              <span
                                key={index}
                                className='bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs'
                              >
                                {status}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <strong>Ready for Development Statuses:</strong>
                          <div className='flex flex-wrap gap-1 mt-1'>
                            {config.readyForDevelopmentStatuses.map(
                              (status, index) => (
                                <span
                                  key={index}
                                  className='bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs'
                                >
                                  {status}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                        <div>
                          <strong>Ticket Closes Statuses:</strong>
                          <div className='flex flex-wrap gap-1 mt-1'>
                            {(config.ticketClosesStatuses || []).map(
                              (status, index) => (
                                <span
                                  key={index}
                                  className='bg-red-100 text-red-800 px-2 py-1 rounded text-xs'
                                >
                                  {status}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className='flex space-x-2'>
                    <button
                      onClick={() => handleEdit(config)}
                      disabled={syncingConfigurationId !== null}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        syncingConfigurationId !== null
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                      }`}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(config.id)}
                      disabled={syncingConfigurationId !== null}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        syncingConfigurationId !== null
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : config.isActive
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {config.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDelete(config.id, config.name)}
                      disabled={syncingConfigurationId !== null}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        syncingConfigurationId !== null
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => handleSync(config.id, config.name)}
                      disabled={syncingConfigurationId === config.id}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        syncingConfigurationId === config.id
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                      }`}
                    >
                      {syncingConfigurationId === config.id ? (
                        <div className='flex items-center space-x-2'>
                          <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600'></div>
                          <span>Syncing...</span>
                        </div>
                      ) : (
                        'Sync Tickets'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className='px-6 py-8 text-center'>
              <svg
                className='mx-auto h-12 w-12 text-gray-400'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                />
              </svg>
              <h3 className='mt-2 text-sm font-medium text-gray-900'>
                No configurations
              </h3>
              <p className='mt-1 text-sm text-gray-500'>
                Get started by creating a new Jira configuration.
              </p>
              <div className='mt-6'>
                <button
                  onClick={() => setShowAddForm(true)}
                  className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors'
                >
                  Add Configuration
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Configuration Modal */}
      {showAddForm && (
        <div className='fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50'>
          <div className='relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white'>
            <div className='mt-3'>
              <h3 className='text-lg font-medium text-gray-900 mb-4'>
                Add New Jira Configuration
              </h3>

              <form onSubmit={handleSubmit} className='space-y-4'>
                {/* Basic Information */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700'>
                      Configuration Name
                    </label>
                    <input
                      type='text'
                      value={formData.name}
                      onChange={e => handleInputChange('name', e.target.value)}
                      className='mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                      required
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700'>
                      Jira Server URL
                    </label>
                    <input
                      type='url'
                      value={formData.serverUrl}
                      onChange={e =>
                        handleInputChange('serverUrl', e.target.value)
                      }
                      className='mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                      placeholder='https://your-domain.atlassian.net'
                      required
                    />
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700'>
                      Username
                    </label>
                    <input
                      type='email'
                      value={formData.username}
                      onChange={e =>
                        handleInputChange('username', e.target.value)
                      }
                      className='mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                      placeholder='your-email@domain.com'
                      required
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700'>
                      API Token
                    </label>
                    <input
                      type='password'
                      value={formData.apiToken}
                      onChange={e =>
                        handleInputChange('apiToken', e.target.value)
                      }
                      className='mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700'>
                    JQL Query
                  </label>
                  <textarea
                    value={formData.jql}
                    onChange={e => handleInputChange('jql', e.target.value)}
                    className='mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                    rows={3}
                    placeholder="project = 'PROJ' AND created >= '2024-01-01'"
                    required
                  />
                </div>

                {/* Status Arrays */}
                <div className='space-y-4'>
                  <h4 className='text-md font-medium text-gray-900'>
                    Status Mappings
                  </h4>

                  {/* Refinement Statuses */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Refinement Statuses
                    </label>
                    {formData.refinementStatuses.map((status, index) => (
                      <div key={index} className='flex space-x-2 mb-2'>
                        <input
                          type='text'
                          value={status}
                          onChange={e =>
                            handleArrayInputChange(
                              'refinementStatuses',
                              index,
                              e.target.value
                            )
                          }
                          className='flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                          placeholder='e.g., Refinement, Backlog Grooming'
                        />
                        {formData.refinementStatuses.length > 1 && (
                          <button
                            type='button'
                            onClick={() =>
                              removeArrayItem('refinementStatuses', index)
                            }
                            className='px-3 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200'
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type='button'
                      onClick={() => addArrayItem('refinementStatuses')}
                      className='text-sm text-blue-600 hover:text-blue-800'
                    >
                      + Add Status
                    </button>
                  </div>

                  {/* Ready for Development Statuses */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Ready for Development Statuses
                    </label>
                    {formData.readyForDevelopmentStatuses.map(
                      (status, index) => (
                        <div key={index} className='flex space-x-2 mb-2'>
                          <input
                            type='text'
                            value={status}
                            onChange={e =>
                              handleArrayInputChange(
                                'readyForDevelopmentStatuses',
                                index,
                                e.target.value
                              )
                            }
                            className='flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                            placeholder='e.g., Ready, To Do'
                          />
                          {formData.readyForDevelopmentStatuses.length > 1 && (
                            <button
                              type='button'
                              onClick={() =>
                                removeArrayItem(
                                  'readyForDevelopmentStatuses',
                                  index
                                )
                              }
                              className='px-3 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200'
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      )
                    )}
                    <button
                      type='button'
                      onClick={() =>
                        addArrayItem('readyForDevelopmentStatuses')
                      }
                      className='text-sm text-blue-600 hover:text-blue-800'
                    >
                      + Add Status
                    </button>
                  </div>

                  {/* In Progress Statuses */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      In Progress Statuses
                    </label>
                    {formData.inProgressStatuses.map((status, index) => (
                      <div key={index} className='flex space-x-2 mb-2'>
                        <input
                          type='text'
                          value={status}
                          onChange={e =>
                            handleArrayInputChange(
                              'inProgressStatuses',
                              index,
                              e.target.value
                            )
                          }
                          className='flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                          placeholder='e.g., In Progress, Development'
                        />
                        {formData.inProgressStatuses.length > 1 && (
                          <button
                            type='button'
                            onClick={() =>
                              removeArrayItem('inProgressStatuses', index)
                            }
                            className='px-3 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200'
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type='button'
                      onClick={() => addArrayItem('inProgressStatuses')}
                      className='text-sm text-blue-600 hover:text-blue-800'
                    >
                      + Add Status
                    </button>
                  </div>

                  {/* Blocked Statuses */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Blocked Statuses
                    </label>
                    {formData.blockedStatuses.map((status, index) => (
                      <div key={index} className='flex space-x-2 mb-2'>
                        <input
                          type='text'
                          value={status}
                          onChange={e =>
                            handleArrayInputChange(
                              'blockedStatuses',
                              index,
                              e.target.value
                            )
                          }
                          className='flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                          placeholder='e.g., Blocked, On Hold'
                        />
                        {formData.blockedStatuses.length > 1 && (
                          <button
                            type='button'
                            onClick={() =>
                              removeArrayItem('blockedStatuses', index)
                            }
                            className='px-3 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200'
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type='button'
                      onClick={() => addArrayItem('blockedStatuses')}
                      className='text-sm text-blue-600 hover:text-blue-800'
                    >
                      + Add Status
                    </button>
                  </div>

                  {/* Review Statuses */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Review Statuses
                    </label>
                    {formData.reviewStatuses.map((status, index) => (
                      <div key={index} className='flex space-x-2 mb-2'>
                        <input
                          type='text'
                          value={status}
                          onChange={e =>
                            handleArrayInputChange(
                              'reviewStatuses',
                              index,
                              e.target.value
                            )
                          }
                          className='flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                          placeholder='e.g., Code Review, Review'
                        />
                        {formData.reviewStatuses.length > 1 && (
                          <button
                            type='button'
                            onClick={() =>
                              removeArrayItem('reviewStatuses', index)
                            }
                            className='px-3 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200'
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type='button'
                      onClick={() => addArrayItem('reviewStatuses')}
                      className='text-sm text-blue-600 hover:text-blue-800'
                    >
                      + Add Status
                    </button>
                  </div>

                  {/* Promotion Statuses */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Promotion Statuses
                    </label>
                    {formData.promotionStatuses.map((status, index) => (
                      <div key={index} className='flex space-x-2 mb-2'>
                        <input
                          type='text'
                          value={status}
                          onChange={e =>
                            handleArrayInputChange(
                              'promotionStatuses',
                              index,
                              e.target.value
                            )
                          }
                          className='flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                          placeholder='e.g., Done, Resolved'
                        />
                        {formData.promotionStatuses.length > 1 && (
                          <button
                            type='button'
                            onClick={() =>
                              removeArrayItem('promotionStatuses', index)
                            }
                            className='px-3 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200'
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type='button'
                      onClick={() => addArrayItem('promotionStatuses')}
                      className='text-sm text-blue-600 hover:text-blue-800'
                    >
                      + Add Status
                    </button>
                  </div>

                  {/* Ticket Closes Statuses */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Ticket Closes Statuses
                    </label>
                    {formData.ticketClosesStatuses.map((status, index) => (
                      <div key={index} className='flex space-x-2 mb-2'>
                        <input
                          type='text'
                          value={status}
                          onChange={e =>
                            handleArrayInputChange(
                              'ticketClosesStatuses',
                              index,
                              e.target.value
                            )
                          }
                          className='flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                          placeholder='e.g., Done, Resolved'
                        />
                        {formData.ticketClosesStatuses.length > 1 && (
                          <button
                            type='button'
                            onClick={() =>
                              removeArrayItem('ticketClosesStatuses', index)
                            }
                            className='px-3 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200'
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type='button'
                      onClick={() => addArrayItem('ticketClosesStatuses')}
                      className='text-sm text-blue-600 hover:text-blue-800'
                    >
                      + Add Status
                    </button>
                  </div>
                </div>

                {/* Form Actions */}
                <div className='flex justify-end space-x-3 pt-4'>
                  <button
                    type='button'
                    onClick={() => {
                      setShowAddForm(false);
                      resetForm();
                    }}
                    className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors'
                  >
                    Cancel
                  </button>
                  <button
                    type='submit'
                    disabled={createConfigurationMutation.isPending}
                    className='px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50'
                  >
                    {createConfigurationMutation.isPending
                      ? 'Creating...'
                      : 'Create Configuration'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Configuration Modal */}
      {showEditForm && editingConfiguration && (
        <div className='fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50'>
          <div className='relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white'>
            <div className='mt-3'>
              <h3 className='text-lg font-medium text-gray-900 mb-4'>
                Edit Jira Configuration
              </h3>

              <form onSubmit={handleSubmit} className='space-y-4'>
                {/* Basic Information */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700'>
                      Configuration Name
                    </label>
                    <input
                      type='text'
                      value={formData.name}
                      onChange={e => handleInputChange('name', e.target.value)}
                      className='mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                      required
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700'>
                      Jira Server URL
                    </label>
                    <input
                      type='url'
                      value={formData.serverUrl}
                      onChange={e =>
                        handleInputChange('serverUrl', e.target.value)
                      }
                      className='mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                      placeholder='https://your-domain.atlassian.net'
                      required
                    />
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700'>
                      Username
                    </label>
                    <input
                      type='email'
                      value={formData.username}
                      onChange={e =>
                        handleInputChange('username', e.target.value)
                      }
                      className='mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                      placeholder='your-email@domain.com'
                      required
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700'>
                      API Token
                    </label>
                    <input
                      type='password'
                      value={formData.apiToken}
                      onChange={e =>
                        handleInputChange('apiToken', e.target.value)
                      }
                      className='mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                      placeholder='Leave blank to keep existing token'
                    />
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700'>
                    JQL Query
                  </label>
                  <textarea
                    value={formData.jql}
                    onChange={e => handleInputChange('jql', e.target.value)}
                    className='mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                    rows={3}
                    placeholder="project = 'PROJ' AND created >= '2024-01-01'"
                    required
                  />
                </div>

                {/* Status Arrays */}
                <div className='space-y-4'>
                  <h4 className='text-md font-medium text-gray-900'>
                    Status Mappings
                  </h4>

                  {/* Refinement Statuses */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Refinement Statuses
                    </label>
                    {formData.refinementStatuses.map((status, index) => (
                      <div key={index} className='flex space-x-2 mb-2'>
                        <input
                          type='text'
                          value={status}
                          onChange={e =>
                            handleArrayInputChange(
                              'refinementStatuses',
                              index,
                              e.target.value
                            )
                          }
                          className='flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                          placeholder='e.g., Refinement, Backlog Grooming'
                        />
                        {formData.refinementStatuses.length > 1 && (
                          <button
                            type='button'
                            onClick={() =>
                              removeArrayItem('refinementStatuses', index)
                            }
                            className='px-3 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200'
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type='button'
                      onClick={() => addArrayItem('refinementStatuses')}
                      className='text-sm text-blue-600 hover:text-blue-800'
                    >
                      + Add Status
                    </button>
                  </div>

                  {/* Ready for Development Statuses */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Ready for Development Statuses
                    </label>
                    {formData.readyForDevelopmentStatuses.map(
                      (status, index) => (
                        <div key={index} className='flex space-x-2 mb-2'>
                          <input
                            type='text'
                            value={status}
                            onChange={e =>
                              handleArrayInputChange(
                                'readyForDevelopmentStatuses',
                                index,
                                e.target.value
                              )
                            }
                            className='flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                            placeholder='e.g., Ready, To Do'
                          />
                          {formData.readyForDevelopmentStatuses.length > 1 && (
                            <button
                              type='button'
                              onClick={() =>
                                removeArrayItem(
                                  'readyForDevelopmentStatuses',
                                  index
                                )
                              }
                              className='px-3 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200'
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      )
                    )}
                    <button
                      type='button'
                      onClick={() =>
                        addArrayItem('readyForDevelopmentStatuses')
                      }
                      className='text-sm text-blue-600 hover:text-blue-800'
                    >
                      + Add Status
                    </button>
                  </div>

                  {/* In Progress Statuses */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      In Progress Statuses
                    </label>
                    {formData.inProgressStatuses.map((status, index) => (
                      <div key={index} className='flex space-x-2 mb-2'>
                        <input
                          type='text'
                          value={status}
                          onChange={e =>
                            handleArrayInputChange(
                              'inProgressStatuses',
                              index,
                              e.target.value
                            )
                          }
                          className='flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                          placeholder='e.g., In Progress, Development'
                        />
                        {formData.inProgressStatuses.length > 1 && (
                          <button
                            type='button'
                            onClick={() =>
                              removeArrayItem('inProgressStatuses', index)
                            }
                            className='px-3 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200'
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type='button'
                      onClick={() => addArrayItem('inProgressStatuses')}
                      className='text-sm text-blue-600 hover:text-blue-800'
                    >
                      + Add Status
                    </button>
                  </div>

                  {/* Blocked Statuses */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Blocked Statuses
                    </label>
                    {formData.blockedStatuses.map((status, index) => (
                      <div key={index} className='flex space-x-2 mb-2'>
                        <input
                          type='text'
                          value={status}
                          onChange={e =>
                            handleArrayInputChange(
                              'blockedStatuses',
                              index,
                              e.target.value
                            )
                          }
                          className='flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                          placeholder='e.g., Blocked, On Hold'
                        />
                        {formData.blockedStatuses.length > 1 && (
                          <button
                            type='button'
                            onClick={() =>
                              removeArrayItem('blockedStatuses', index)
                            }
                            className='px-3 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200'
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type='button'
                      onClick={() => addArrayItem('blockedStatuses')}
                      className='text-sm text-blue-600 hover:text-blue-800'
                    >
                      + Add Status
                    </button>
                  </div>

                  {/* Review Statuses */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Review Statuses
                    </label>
                    {formData.reviewStatuses.map((status, index) => (
                      <div key={index} className='flex space-x-2 mb-2'>
                        <input
                          type='text'
                          value={status}
                          onChange={e =>
                            handleArrayInputChange(
                              'reviewStatuses',
                              index,
                              e.target.value
                            )
                          }
                          className='flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                          placeholder='e.g., Code Review, Review'
                        />
                        {formData.reviewStatuses.length > 1 && (
                          <button
                            type='button'
                            onClick={() =>
                              removeArrayItem('reviewStatuses', index)
                            }
                            className='px-3 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200'
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type='button'
                      onClick={() => addArrayItem('reviewStatuses')}
                      className='text-sm text-blue-600 hover:text-blue-800'
                    >
                      + Add Status
                    </button>
                  </div>

                  {/* Promotion Statuses */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Promotion Statuses
                    </label>
                    {formData.promotionStatuses.map((status, index) => (
                      <div key={index} className='flex space-x-2 mb-2'>
                        <input
                          type='text'
                          value={status}
                          onChange={e =>
                            handleArrayInputChange(
                              'promotionStatuses',
                              index,
                              e.target.value
                            )
                          }
                          className='flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                          placeholder='e.g., Done, Resolved'
                        />
                        {formData.promotionStatuses.length > 1 && (
                          <button
                            type='button'
                            onClick={() =>
                              removeArrayItem('promotionStatuses', index)
                            }
                            className='px-3 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200'
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type='button'
                      onClick={() => addArrayItem('promotionStatuses')}
                      className='text-sm text-blue-600 hover:text-blue-800'
                    >
                      + Add Status
                    </button>
                  </div>

                  {/* Ticket Closes Statuses */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Ticket Closes Statuses
                    </label>
                    {formData.ticketClosesStatuses.map((status, index) => (
                      <div key={index} className='flex space-x-2 mb-2'>
                        <input
                          type='text'
                          value={status}
                          onChange={e =>
                            handleArrayInputChange(
                              'ticketClosesStatuses',
                              index,
                              e.target.value
                            )
                          }
                          className='flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                          placeholder='e.g., Done, Resolved'
                        />
                        {formData.ticketClosesStatuses.length > 1 && (
                          <button
                            type='button'
                            onClick={() =>
                              removeArrayItem('ticketClosesStatuses', index)
                            }
                            className='px-3 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200'
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type='button'
                      onClick={() => addArrayItem('ticketClosesStatuses')}
                      className='text-sm text-blue-600 hover:text-blue-800'
                    >
                      + Add Status
                    </button>
                  </div>
                </div>

                {/* Form Actions */}
                <div className='flex justify-end space-x-3 pt-4'>
                  <button
                    type='button'
                    onClick={() => {
                      setShowEditForm(false);
                      setEditingConfiguration(null);
                      resetForm();
                    }}
                    className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors'
                  >
                    Cancel
                  </button>
                  <button
                    type='submit'
                    disabled={updateConfigurationMutation.isPending}
                    className='px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50'
                  >
                    {updateConfigurationMutation.isPending
                      ? 'Updating...'
                      : 'Update Configuration'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default JiraSettings;
