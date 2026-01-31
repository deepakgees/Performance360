import {
  CalendarIcon,
  HandThumbDownIcon,
  HandThumbUpIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

interface Achievement {
  id: string;
  userId: string;
  date: string;
  achievement: string;
  observation: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface AchievementsResponse {
  success: boolean;
  data: {
    achievements: Achievement[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

interface CreateAchievementRequest {
  userId: string;
  date: string;
  achievement: string;
  observation: string;
}

interface UpdateAchievementRequest {
  date?: string;
  achievement?: string;
  observation?: string;
}

interface AchievementsObservationsProps {
  userId: string;
  title?: string;
  onAddButtonClick?: () => void;
}

const AchievementsObservations: React.FC<AchievementsObservationsProps> = ({
  userId,
  title = 'Achievements & Observations',
  onAddButtonClick,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] =
    useState<Achievement | null>(null);
  const [formData, setFormData] = useState<CreateAchievementRequest>({
    userId: userId || '',
    date: new Date().toISOString().split('T')[0],
    achievement: '',
    observation: '',
  });

  const queryClient = useQueryClient();

  // Listen for add button click from parent
  useEffect(() => {
    const handleAddClick = () => {
      handleOpenModal();
    };

    // Store the handler in a way that parent can call it
    (window as any).openAchievementsModal = handleAddClick;

    return () => {
      delete (window as any).openAchievementsModal;
    };
  }, []);

  // Fetch achievements and observations
  const {
    data: achievementsData,
    isLoading,
    error,
  } = useQuery<AchievementsResponse>({
    queryKey: ['achievements-observations', userId],
    queryFn: () =>
      api.get(`/api/achievements-observations/${userId}`).then(res => res.data),
    enabled: !!userId,
  });

  // Create achievement mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateAchievementRequest) =>
      api.post('/api/achievements-observations', data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['achievements-observations', userId],
      });
      handleCloseModal();
    },
  });

  // Update achievement mutation
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateAchievementRequest;
    }) =>
      api
        .put(`/api/achievements-observations/${id}`, data)
        .then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['achievements-observations', userId],
      });
      handleCloseModal();
    },
  });

  // Delete achievement mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/api/achievements-observations/${id}`).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['achievements-observations', userId],
      });
    },
  });

  const handleOpenModal = (achievement?: Achievement) => {
    if (achievement) {
      setEditingAchievement(achievement);
      setFormData({
        userId: userId || '',
        date: new Date(achievement.date).toISOString().split('T')[0],
        achievement: achievement.achievement,
        observation: achievement.observation,
      });
    } else {
      setEditingAchievement(null);
      setFormData({
        userId: userId || '',
        date: new Date().toISOString().split('T')[0],
        achievement: '',
        observation: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAchievement(null);
    setFormData({
      userId: userId || '',
      date: new Date().toISOString().split('T')[0],
      achievement: '',
      observation: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingAchievement) {
      updateMutation.mutate({
        id: editingAchievement.id,
        data: {
          date: formData.date,
          achievement: formData.achievement,
          observation: formData.observation,
        },
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this achievement?')) {
      deleteMutation.mutate(id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Show message when no user is selected
  if (!userId) {
    return (
      <div className='p-6'>
        <div className='bg-blue-50 border border-blue-200 rounded-md p-4'>
          <div className='text-blue-800'>
            Please select a user to view their achievements and observations.
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className='p-6'>
        <div className='flex items-center justify-center h-32'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600'></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='p-6'>
        <div className='bg-red-50 border border-red-200 rounded-md p-4'>
          <div className='text-red-800'>
            Error loading achievements and observations. Please try again later.
          </div>
        </div>
      </div>
    );
  }

  const achievements = achievementsData?.data?.achievements || [];

  return (
    <div className='p-6'>
      {/* Achievements Table */}
      <div className='bg-white shadow overflow-hidden sm:rounded-md'>
        {achievements.length === 0 ? (
          <div className='text-center py-12'>
            <CalendarIcon className='mx-auto h-12 w-12 text-gray-400' />
            <h3 className='mt-2 text-sm font-medium text-gray-900'>
              No achievements recorded
            </h3>
            <p className='mt-1 text-sm text-gray-500'>
              Get started by adding the first achievement and observation.
            </p>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Date
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <div className='flex items-center'>
                      <HandThumbUpIcon className='h-4 w-4 mr-1 text-green-500' />
                      Achievement
                    </div>
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <div className='flex items-center'>
                      <HandThumbDownIcon className='h-4 w-4 mr-1 text-red-500' />
                      Observation
                    </div>
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Created By
                  </th>
                  <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {achievements.map(achievement => (
                  <tr key={achievement.id} className='hover:bg-gray-50'>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {formatDate(achievement.date)}
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-900'>
                      <div className='max-w-xs'>{achievement.achievement}</div>
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-900'>
                      <div className='max-w-xs'>{achievement.observation}</div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      <div className='flex items-center'>
                        <UserIcon className='h-4 w-4 text-gray-400 mr-2' />
                        {achievement.creator.firstName}{' '}
                        {achievement.creator.lastName}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                      <div className='flex justify-end space-x-2'>
                        <button
                          onClick={() => handleOpenModal(achievement)}
                          className='text-indigo-600 hover:text-indigo-900'
                        >
                          <PencilIcon className='h-4 w-4' />
                        </button>
                        <button
                          onClick={() => handleDelete(achievement.id)}
                          className='text-red-600 hover:text-red-900'
                        >
                          <TrashIcon className='h-4 w-4' />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className='fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50'>
          <div className='relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white'>
            <div className='mt-3'>
              <h3 className='text-lg font-medium text-gray-900 mb-4'>
                {editingAchievement ? 'Edit Achievement' : 'Add Achievement'}
              </h3>

              <form onSubmit={handleSubmit} className='space-y-4'>
                <div>
                  <label
                    htmlFor='date'
                    className='block text-sm font-medium text-gray-700'
                  >
                    Date
                  </label>
                  <input
                    type='date'
                    id='date'
                    value={formData.date}
                    onChange={e =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    required
                    className='mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500'
                  />
                </div>

                <div>
                  <label
                    htmlFor='achievement'
                    className='block text-sm font-medium text-gray-700'
                  >
                    <div className='flex items-center'>
                      <HandThumbUpIcon className='h-4 w-4 mr-1 text-green-500' />
                      Achievement
                    </div>
                  </label>
                  <textarea
                    id='achievement'
                    value={formData.achievement}
                    onChange={e =>
                      setFormData({ ...formData, achievement: e.target.value })
                    }
                    required
                    rows={3}
                    className='mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500'
                    placeholder='Describe the achievement...'
                  />
                </div>

                <div>
                  <label
                    htmlFor='observation'
                    className='block text-sm font-medium text-gray-700'
                  >
                    <div className='flex items-center'>
                      <HandThumbDownIcon className='h-4 w-4 mr-1 text-red-500' />
                      Observation
                    </div>
                  </label>
                  <textarea
                    id='observation'
                    value={formData.observation}
                    onChange={e =>
                      setFormData({ ...formData, observation: e.target.value })
                    }
                    required
                    rows={3}
                    className='mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500'
                    placeholder='Add your observation...'
                  />
                </div>

                <div className='flex justify-end space-x-3 pt-4'>
                  <button
                    type='button'
                    onClick={handleCloseModal}
                    className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                  >
                    Cancel
                  </button>
                  <button
                    type='submit'
                    disabled={
                      createMutation.isPending || updateMutation.isPending
                    }
                    className='px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50'
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? 'Saving...'
                      : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AchievementsObservations;
