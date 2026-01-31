import {
  ExclamationTriangleIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { quarterlyPerformanceAPI } from '../services/api';

interface QuarterlyPerformance {
  id: string;
  userId: string;
  quarter: string;
  year: number;
  rating?: number;
  isCritical: boolean;
  managerComment?: string;
  hrbpComment?: string;
  nextActionPlanManager?: string;
  nextActionPlanHrbp?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface PerformanceTrackingProps {
  userId: string;
  title?: string;
}

interface PerformanceFormData {
  quarter: string;
  year: number;
  rating?: number;
  isCritical: boolean;
  managerComment: string;
  hrbpComment: string;
  nextActionPlanManager: string;
  nextActionPlanHrbp: string;
}

const PerformanceTracking: React.FC<PerformanceTrackingProps> = ({
  userId,
  title = 'Performance Tracking',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerformance, setEditingPerformance] =
    useState<QuarterlyPerformance | null>(null);
  const [formData, setFormData] = useState<PerformanceFormData>({
    quarter: 'Q1',
    year: new Date().getFullYear(),
    rating: undefined,
    isCritical: false,
    managerComment: '',
    hrbpComment: '',
    nextActionPlanManager: '',
    nextActionPlanHrbp: '',
  });

  const queryClient = useQueryClient();

  const {
    data: performances,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['quarterly-performance', userId],
    queryFn: () => quarterlyPerformanceAPI.getByUserId(userId),
    enabled: !!userId,
  });

  const createMutation = useMutation({
    mutationFn: (data: PerformanceFormData) =>
      quarterlyPerformanceAPI.create({
        userId,
        ...data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['quarterly-performance', userId],
      });
      setIsModalOpen(false);
      resetForm();
      toast.success('Performance record created successfully');
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Failed to create performance record';
      toast.error(errorMessage);
      console.error('Error creating performance record:', error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<PerformanceFormData> }) =>
      quarterlyPerformanceAPI.update(data.id, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['quarterly-performance', userId],
      });
      setIsModalOpen(false);
      setEditingPerformance(null);
      resetForm();
      toast.success('Performance record updated successfully');
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Failed to update performance record';
      toast.error(errorMessage);
      console.error('Error updating performance record:', error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => quarterlyPerformanceAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['quarterly-performance', userId],
      });
    },
  });

  const resetForm = () => {
    setFormData({
      quarter: 'Q1',
      year: new Date().getFullYear(),
      rating: undefined,
      isCritical: false,
      managerComment: '',
      hrbpComment: '',
      nextActionPlanManager: '',
      nextActionPlanHrbp: '',
    });
    setEditingPerformance(null);
  };

  const handleOpenModal = () => {
    setEditingPerformance(null);
    resetForm();
    setIsModalOpen(true);
  };

  // Expose modal opening function globally
  useEffect(() => {
    (window as any).openPerformanceModal = handleOpenModal;
    return () => {
      delete (window as any).openPerformanceModal;
    };
  }, []);

  const handleAddNew = () => {
    setEditingPerformance(null);
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (performance: QuarterlyPerformance) => {
    setEditingPerformance(performance);
    setFormData({
      quarter: performance.quarter,
      year: performance.year,
      rating: performance.rating,
      isCritical: performance.isCritical,
      managerComment: performance.managerComment || '',
      hrbpComment: performance.hrbpComment || '',
      nextActionPlanManager: performance.nextActionPlanManager || '',
      nextActionPlanHrbp: performance.nextActionPlanHrbp || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (
      window.confirm('Are you sure you want to delete this performance record?')
    ) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Clean up the form data to remove undefined values
    const cleanFormData = Object.fromEntries(
      Object.entries(formData).filter(([_, value]) => value !== undefined)
    ) as Partial<PerformanceFormData>;

    if (editingPerformance) {
      updateMutation.mutate({
        id: editingPerformance.id,
        updates: cleanFormData,
      });
    } else {
      createMutation.mutate(cleanFormData as PerformanceFormData);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600'></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='bg-red-50 border border-red-200 rounded-md p-4'>
        <div className='flex'>
          <ExclamationTriangleIcon className='h-5 w-5 text-red-400' />
          <div className='ml-3'>
            <h3 className='text-sm font-medium text-red-800'>
              Error loading performance data
            </h3>
            <div className='mt-2 text-sm text-red-700'>
              <p>
                Unable to load performance tracking data. Please try again
                later.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Performance Table */}
      <div className='w-full'>
        {performances?.data?.length === 0 ? (
          <div className='text-center py-12'>
            <p className='text-gray-500'>No performance records found.</p>
          </div>
        ) : (
          <div className='overflow-x-auto border border-gray-200 rounded-lg'>
            <table className='w-full border border-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200'>
                    Quarter/Year
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200'>
                    Rating
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200'>
                    Critical
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200'>
                    Manager Comment
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200'>
                    Next Action Plan
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white'>
                {performances?.data?.map(
                  (performance: QuarterlyPerformance) => (
                    <tr
                      key={performance.id}
                      className='hover:bg-gray-50 border-b border-gray-200'
                    >
                      <td className='px-4 py-4 text-sm font-medium text-gray-900 border-r border-gray-200'>
                        {performance.quarter} {performance.year}
                      </td>
                      <td className='px-4 py-4 text-sm text-gray-900 border-r border-gray-200'>
                        {performance.rating ? (
                          <div className='flex items-center'>
                            <span className='text-lg font-semibold text-indigo-600 mr-1'>
                              {performance.rating}
                            </span>
                            <span className='text-xs text-gray-500'>/ 5</span>
                          </div>
                        ) : (
                          <span className='text-gray-400'>-</span>
                        )}
                      </td>
                      <td className='px-4 py-4 text-sm text-gray-900 border-r border-gray-200'>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            performance.isCritical
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {performance.isCritical ? 'Yes' : 'No'}
                        </span>
                      </td>
                                             <td className='px-4 py-4 text-sm text-gray-900 border-r border-gray-200'>
                         <div className='break-words max-w-xs'>
                           {performance.managerComment ? (
                             <div
                               title={performance.managerComment}
                               className='truncate'
                             >
                               {performance.managerComment}
                             </div>
                           ) : (
                             'N/A'
                           )}
                         </div>
                       </td>
                       <td className='px-4 py-4 text-sm text-gray-900 border-r border-gray-200'>
                         <div className='break-words max-w-xs'>
                           {performance.nextActionPlanManager ? (
                             <div
                               title={performance.nextActionPlanManager}
                               className='truncate'
                             >
                               {performance.nextActionPlanManager}
                             </div>
                           ) : (
                             'N/A'
                           )}
                         </div>
                       </td>
                       <td className='px-4 py-4 text-sm font-medium'>
                         <div className='flex space-x-2'>
                           <button
                             onClick={() => handleEdit(performance)}
                             className='text-indigo-600 hover:text-indigo-900'
                           >
                             <PencilIcon className='h-4 w-4' />
                           </button>
                           <button
                             onClick={() => handleDelete(performance.id)}
                             className='text-red-600 hover:text-red-900'
                           >
                             <TrashIcon className='h-4 w-4' />
                           </button>
                         </div>
                       </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Add/Edit */}
      {isModalOpen && (
        <div className='fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50'>
          <div className='relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white'>
            <div className='mt-3'>
              <h3 className='text-lg font-medium text-gray-900 mb-4'>
                {editingPerformance
                  ? 'Edit Performance Record'
                  : 'Add Performance Record'}
              </h3>

              <form onSubmit={handleSubmit} className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700'>
                      Quarter
                    </label>
                    <select
                      value={formData.quarter}
                      onChange={e =>
                        setFormData({ ...formData, quarter: e.target.value })
                      }
                      className='mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                      required
                    >
                      <option value='Q1'>Q1</option>
                      <option value='Q2'>Q2</option>
                      <option value='Q3'>Q3</option>
                      <option value='Q4'>Q4</option>
                    </select>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700'>
                      Year
                    </label>
                    <input
                      type='number'
                      value={formData.year}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          year: parseInt(e.target.value),
                        })
                      }
                      min='2020'
                      max='2030'
                      className='mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                      required
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700'>
                      Rating (1-5)
                    </label>
                    <select
                      value={formData.rating || ''}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          rating: e.target.value
                            ? parseInt(e.target.value)
                            : undefined,
                        })
                      }
                      className='mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                    >
                      <option value=''>No Rating</option>
                      <option value='1'>1 - Poor</option>
                      <option value='2'>2 - Below Average</option>
                      <option value='3'>3 - Average</option>
                      <option value='4'>4 - Above Average</option>
                      <option value='5'>5 - Excellent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className='flex items-center'>
                    <input
                      type='checkbox'
                      checked={formData.isCritical}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          isCritical: e.target.checked,
                        })
                      }
                      className='h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded'
                    />
                    <span className='ml-2 text-sm text-gray-700'>
                      Critical Member
                    </span>
                  </label>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700'>
                    Manager Comment
                  </label>
                  <textarea
                    value={formData.managerComment}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        managerComment: e.target.value,
                      })
                    }
                    rows={3}
                    className='mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700'>
                    HRBP Comment
                  </label>
                  <textarea
                    value={formData.hrbpComment}
                    onChange={e =>
                      setFormData({ ...formData, hrbpComment: e.target.value })
                    }
                    rows={3}
                    className='mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700'>
                    Next Action Plan for Manager
                  </label>
                  <textarea
                    value={formData.nextActionPlanManager}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        nextActionPlanManager: e.target.value,
                      })
                    }
                    rows={3}
                    className='mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700'>
                    Next Action Plan for HRBP
                  </label>
                  <textarea
                    value={formData.nextActionPlanHrbp}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        nextActionPlanHrbp: e.target.value,
                      })
                    }
                    rows={3}
                    className='mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                  />
                </div>

                <div className='flex justify-end space-x-3 pt-4'>
                  <button
                    type='button'
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingPerformance(null);
                      resetForm();
                    }}
                    className='px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                  >
                    Cancel
                  </button>
                  <button
                    type='submit'
                    disabled={
                      createMutation.isPending || updateMutation.isPending
                    }
                    className='px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50'
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

export default PerformanceTracking;
