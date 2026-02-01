import React, { useCallback, useEffect, useState } from 'react';
import { assessmentAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// interface Question {
//   id: string;
//   text: string;
//   category: string;
//   type: 'rating' | 'text' | 'satisfaction';
// }

interface Assessment {
  id: string;
  userId: string;
  year: number;
  quarter: string | null;
  rating: number | null;
  achievements: string | null;
  improvements: string | null;
  satisfactionLevel: string | null;
  aspirations: string | null;
  suggestionsForTeam: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SelfAssessmentsListProps {
  userId?: string; // Optional - if provided, fetches assessments for specific user (for managers)
  showDetailedView?: boolean; // Optional - if true, shows detailed table view, otherwise shows compact list
  title?: string; // Optional - custom title for the component
}

// Assessment Detail Modal Component
interface AssessmentDetailModalProps {
  assessment: Assessment | null;
  isOpen: boolean;
  onClose: () => void;
}

// Assessment Edit Modal Component
interface AssessmentEditModalProps {
  assessment: Assessment | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const AssessmentDetailModal: React.FC<AssessmentDetailModalProps> = ({
  assessment,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !assessment) return null;

  const formatSatisfactionLevel = (level: string | null): string => {
    if (!level) return 'N/A';
    const map: Record<string, string> = {
      VERY_SATISFIED: 'Very Satisfied',
      SOMEWHAT_SATISFIED: 'Somewhat Satisfied',
      NEITHER: 'Neither',
      SOMEWHAT_DISSATISFIED: 'Somewhat Dissatisfied',
      VERY_DISSATISFIED: 'Very Dissatisfied',
    };
    return map[level] || level;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className='fixed inset-0 z-50 overflow-y-auto'>
      <div className='flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0'>
        {/* Background overlay */}
        <div
          className='fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75'
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className='inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full'>
          {/* Header */}
          <div className='bg-indigo-600 px-6 py-4 flex justify-between items-center'>
            <h3 className='text-lg font-medium text-white'>
              Self-Assessment Details - {assessment.quarter || 'Annual'} {assessment.year}
            </h3>
            <button
              onClick={onClose}
              className='text-white hover:text-gray-200 focus:outline-none'
            >
              <svg
                className='h-6 w-6'
                fill='none'
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path d='M6 18L18 6M6 6l12 12'></path>
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className='px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto'>
            <div className='space-y-6'>
              {/* Period Info */}
              <div className='grid grid-cols-2 gap-4 pb-4 border-b'>
                <div>
                  <label className='text-sm font-medium text-gray-500'>Year</label>
                  <p className='mt-1 text-sm text-gray-900'>{assessment.year}</p>
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-500'>Quarter</label>
                  <p className='mt-1 text-sm text-gray-900'>
                    {assessment.quarter || 'Annual'}
                  </p>
                </div>
              </div>

              {/* Rating */}
              <div className='pb-4 border-b'>
                <label className='text-sm font-medium text-gray-500'>Self-Rating</label>
                <div className='mt-1'>
                  {assessment.rating ? (
                    <div className='flex items-center'>
                      <span className='text-2xl font-semibold text-indigo-600 mr-2'>
                        {assessment.rating}
                      </span>
                      <span className='text-sm text-gray-500'>/ 5</span>
                    </div>
                  ) : (
                    <p className='text-sm text-gray-500'>Not provided</p>
                  )}
                </div>
              </div>

              {/* Achievements */}
              <div className='pb-4 border-b'>
                <label className='text-sm font-medium text-gray-500'>
                  Key Achievements
                </label>
                <p className='mt-1 text-sm text-gray-900 whitespace-pre-wrap'>
                  {assessment.achievements || 'Not provided'}
                </p>
              </div>

              {/* Improvements */}
              <div className='pb-4 border-b'>
                <label className='text-sm font-medium text-gray-500'>
                  Areas for Improvement
                </label>
                <p className='mt-1 text-sm text-gray-900 whitespace-pre-wrap'>
                  {assessment.improvements || 'Not provided'}
                </p>
              </div>

              {/* Satisfaction Level */}
              <div className='pb-4 border-b'>
                <label className='text-sm font-medium text-gray-500'>
                  Satisfaction Level
                </label>
                <p className='mt-1 text-sm text-gray-900'>
                  {formatSatisfactionLevel(assessment.satisfactionLevel)}
                </p>
              </div>

              {/* Aspirations */}
              {assessment.aspirations && (
                <div className='pb-4 border-b'>
                  <label className='text-sm font-medium text-gray-500'>
                    Career Aspirations
                  </label>
                  <p className='mt-1 text-sm text-gray-900 whitespace-pre-wrap'>
                    {assessment.aspirations}
                  </p>
                </div>
              )}

              {/* Team Suggestions */}
              <div className='pb-4 border-b'>
                <label className='text-sm font-medium text-gray-500'>
                  Suggestions for Team
                </label>
                <p className='mt-1 text-sm text-gray-900 whitespace-pre-wrap'>
                  {assessment.suggestionsForTeam || 'Not provided'}
                </p>
              </div>

              {/* Timestamps */}
              <div className='grid grid-cols-2 gap-4 pt-4'>
                <div>
                  <label className='text-sm font-medium text-gray-500'>Created At</label>
                  <p className='mt-1 text-xs text-gray-500'>
                    {formatDate(assessment.createdAt)}
                  </p>
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-500'>Last Updated</label>
                  <p className='mt-1 text-xs text-gray-500'>
                    {formatDate(assessment.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className='bg-gray-50 px-6 py-3 flex justify-end'>
            <button
              onClick={onClose}
              className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AssessmentEditModal: React.FC<AssessmentEditModalProps> = ({
  assessment,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<Assessment>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (assessment) {
      setFormData({
        year: assessment.year,
        quarter: assessment.quarter,
        rating: assessment.rating,
        achievements: assessment.achievements || '',
        improvements: assessment.improvements || '',
        satisfactionLevel: assessment.satisfactionLevel,
        aspirations: assessment.aspirations || '',
        suggestionsForTeam: assessment.suggestionsForTeam || '',
      });
    }
  }, [assessment]);

  if (!isOpen || !assessment) return null;

  const satisfactionOptions = [
    { value: 'VERY_SATISFIED', label: 'Very Satisfied' },
    { value: 'SOMEWHAT_SATISFIED', label: 'Somewhat Satisfied' },
    { value: 'NEITHER', label: 'Neither' },
    { value: 'SOMEWHAT_DISSATISFIED', label: 'Somewhat Dissatisfied' },
    { value: 'VERY_DISSATISFIED', label: 'Very Dissatisfied' },
  ];

  const quarterOptions = ['Q1', 'Q2', 'Q3', 'Q4', 'ANNUAL'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const updateData: any = {};
      if (formData.year !== undefined) updateData.year = formData.year;
      if (formData.quarter !== undefined) updateData.quarter = formData.quarter && formData.quarter.trim() !== '' ? formData.quarter : null;
      if (formData.rating !== undefined) updateData.rating = formData.rating || null;
      if (formData.achievements !== undefined) updateData.achievements = formData.achievements && formData.achievements.trim() !== '' ? formData.achievements : null;
      if (formData.improvements !== undefined) updateData.improvements = formData.improvements && formData.improvements.trim() !== '' ? formData.improvements : null;
      if (formData.satisfactionLevel !== undefined) updateData.satisfactionLevel = formData.satisfactionLevel && formData.satisfactionLevel.trim() !== '' ? formData.satisfactionLevel : null;
      if (formData.aspirations !== undefined) updateData.aspirations = formData.aspirations && formData.aspirations.trim() !== '' ? formData.aspirations : null;
      if (formData.suggestionsForTeam !== undefined) updateData.suggestionsForTeam = formData.suggestionsForTeam && formData.suggestionsForTeam.trim() !== '' ? formData.suggestionsForTeam : null;

      console.log('Updating assessment:', assessment.id, 'with data:', updateData);
      const response = await assessmentAPI.update(assessment.id, updateData);
      console.log('Update response:', response);
      
      onSave();
      onClose();
    } catch (err: any) {
      console.error('Error updating assessment:', err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.errors?.[0]?.msg ||
                          err.message || 
                          'Failed to update assessment';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='fixed inset-0 z-50 overflow-y-auto'>
      <div className='flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0'>
        {/* Background overlay */}
        <div
          className='fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75'
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className='inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full'>
          {/* Header */}
          <div className='bg-green-600 px-6 py-4 flex justify-between items-center'>
            <h3 className='text-lg font-medium text-white'>
              Edit Self-Assessment - {assessment.quarter || 'Annual'} {assessment.year}
            </h3>
            <button
              onClick={onClose}
              className='text-white hover:text-gray-200 focus:outline-none'
            >
              <svg
                className='h-6 w-6'
                fill='none'
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path d='M6 18L18 6M6 6l12 12'></path>
              </svg>
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit}>
            <div className='px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto'>
              {error && (
                <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded-md'>
                  <p className='text-sm text-red-800'>{error}</p>
                </div>
              )}

              <div className='space-y-6'>
                {/* Year and Quarter */}
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Year *
                    </label>
                    <input
                      type='number'
                      required
                      min='2000'
                      max='2100'
                      value={formData.year || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, year: parseInt(e.target.value) })
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Quarter
                    </label>
                    <select
                      value={formData.quarter || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          quarter: e.target.value || null,
                        })
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500'
                    >
                      <option value=''>Select Quarter</option>
                      {quarterOptions.map((q) => (
                        <option key={q} value={q}>
                          {q}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Rating */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Self-Rating (1-5)
                  </label>
                  <input
                    type='number'
                    min='1'
                    max='5'
                    value={formData.rating || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rating: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500'
                  />
                </div>

                {/* Achievements */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Key Achievements
                  </label>
                  <textarea
                    rows={4}
                    value={formData.achievements || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, achievements: e.target.value })
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500'
                  />
                </div>

                {/* Improvements */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Areas for Improvement
                  </label>
                  <textarea
                    rows={4}
                    value={formData.improvements || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, improvements: e.target.value })
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500'
                  />
                </div>

                {/* Satisfaction Level */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Satisfaction Level
                  </label>
                  <select
                    value={formData.satisfactionLevel || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        satisfactionLevel: e.target.value || null,
                      })
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500'
                  >
                    <option value=''>Select Satisfaction Level</option>
                    {satisfactionOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Aspirations */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Career Aspirations
                  </label>
                  <textarea
                    rows={3}
                    value={formData.aspirations || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, aspirations: e.target.value })
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500'
                  />
                </div>

                {/* Team Suggestions */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Suggestions for Team
                  </label>
                  <textarea
                    rows={3}
                    value={formData.suggestionsForTeam || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, suggestionsForTeam: e.target.value })
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500'
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className='bg-gray-50 px-6 py-3 flex justify-end space-x-3'>
              <button
                type='button'
                onClick={onClose}
                disabled={saving}
                className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50'
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={saving}
                className='px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50'
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const SelfAssessmentsList: React.FC<SelfAssessmentsListProps> = ({
  userId,
  showDetailedView = false,
  title: _title = 'Self-Assessments',
}) => {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: 'year' | 'quarter' | 'rating' | 'satisfaction';
    direction: 'asc' | 'desc';
  }>({ key: 'quarter', direction: 'desc' });

  const loadAssessments = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Loading assessments for userId:', userId);
      const response = userId
        ? await assessmentAPI.getByUserId(userId)
        : await assessmentAPI.getAll();
      console.log('Assessment response:', response);
      setAssessments(response.data || []);
    } catch (error) {
      console.error('Error loading assessments:', error);
      setAssessments([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadAssessments();
  }, [loadAssessments]);

  const handleSort = (key: 'year' | 'quarter' | 'rating' | 'satisfaction') => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleViewAssessment = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setIsModalOpen(true);
  };

  const handleEditAssessment = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAssessment(null);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedAssessment(null);
  };

  const handleSaveAssessment = () => {
    loadAssessments();
  };

  const getSortedAssessments = () => {
    if (!assessments || !assessments.length) return [];

    return [...assessments].sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortConfig.key) {
        case 'year':
          aValue = a.year;
          bValue = b.year;
          break;
        case 'quarter':
          // Sort by year first, then by quarter
          if (a.year !== b.year) {
            aValue = a.year;
            bValue = b.year;
          } else {
            aValue = a.quarter || '';
            bValue = b.quarter || '';
          }
          break;
        case 'rating':
          aValue = a.rating || 0;
          bValue = b.rating || 0;
          break;
        case 'satisfaction':
          aValue = a.satisfactionLevel || '';
          bValue = b.satisfactionLevel || '';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Helper function to truncate text and return both truncated and full text
  const truncateText = (text: string | null, maxLength: number = 50) => {
    if (!text || text === 'N/A') return { display: 'N/A', full: text };
    if (text.length <= maxLength) return { display: text, full: text };
    return {
      display: text.substring(0, maxLength) + '...',
      full: text,
    };
  };

  if (loading) {
    return (
      <div className='flex justify-center py-4'>
        <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600'></div>
      </div>
    );
  }

  if (!assessments || assessments.length === 0) {
    return (
      <div>
        <p className='text-gray-500 text-center py-4'>No self-assessments found</p>
      </div>
    );
  }

  // Helper function to format satisfaction level
  const formatSatisfactionLevel = (level: string | null): string => {
    if (!level) return 'N/A';
    const map: Record<string, string> = {
      VERY_SATISFIED: 'Very Satisfied',
      SOMEWHAT_SATISFIED: 'Somewhat Satisfied',
      NEITHER: 'Neither',
      SOMEWHAT_DISSATISFIED: 'Somewhat Dissatisfied',
      VERY_DISSATISFIED: 'Very Dissatisfied',
    };
    return map[level] || level;
  };

  // Compact view (for DirectReports page)
  if (!showDetailedView) {
    return (
      <div>
        <div className='space-y-3'>
          {getSortedAssessments().map((assessment: Assessment) => (
            <div
              key={assessment.id}
              className='border border-gray-200 rounded-md p-3'
            >
              <div className='flex justify-between items-start'>
                <div>
                  <h3 className='font-medium text-gray-900'>
                    {assessment.quarter
                      ? `${assessment.quarter} ${assessment.year}`
                      : `Annual ${assessment.year}`}
                  </h3>
                  <p className='text-sm text-gray-500'>
                    Rating: {assessment.rating || 'N/A'} | Satisfaction:{' '}
                    {formatSatisfactionLevel(assessment.satisfactionLevel)}
                  </p>
                </div>
              </div>
              <p className='text-xs text-gray-400 mt-1'>
                Created: {formatDate(assessment.createdAt)}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Detailed table view (for SelfAssessment page)
  return (
    <div className='w-full'>
      {/* Table Container with Horizontal Scroll */}
      <div className='overflow-x-auto overflow-y-visible'>
        <div className='inline-block min-w-full align-middle'>
          <div className='overflow-hidden border border-gray-200 rounded-lg'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th
                    className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 sticky left-0 bg-gray-50 z-10 min-w-[60px]'
                    onClick={() => handleSort('year')}
                  >
                    <div className='flex items-center'>
                      Year
                      {sortConfig.key === 'year' && (
                        <span className='ml-1'>
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 min-w-[80px]'
                    onClick={() => handleSort('quarter')}
                  >
                    <div className='flex items-center'>
                      Qtr
                      {sortConfig.key === 'quarter' && (
                        <span className='ml-1'>
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 min-w-[80px]'
                    onClick={() => handleSort('rating')}
                  >
                    <div className='flex items-center'>
                      Rating
                      {sortConfig.key === 'rating' && (
                        <span className='ml-1'>
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 min-w-[200px] max-w-[200px]'>
                    Achievements
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 min-w-[200px] max-w-[200px]'>
                    Improvements
                  </th>
                  <th
                    className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 border-r border-gray-200 min-w-[140px]'
                    onClick={() => handleSort('satisfaction')}
                  >
                    <div className='flex items-center'>
                      Satisfaction
                      {sortConfig.key === 'satisfaction' && (
                        <span className='ml-1'>
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 min-w-[200px] max-w-[200px]'>
                    Aspirations
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px] max-w-[200px]'>
                    Suggestions
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px] sticky right-0 bg-gray-50 z-10'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {getSortedAssessments().map(assessment => {
                  const rating = assessment.rating || 'N/A';
                  const achievements = truncateText(assessment.achievements, 50);
                  const improvements = truncateText(assessment.improvements, 50);
                  const satisfaction = formatSatisfactionLevel(assessment.satisfactionLevel);
                  const aspirations = truncateText(assessment.aspirations, 50);
                  const suggestions = truncateText(assessment.suggestionsForTeam, 50);
                  const quarter = assessment.quarter || 'N/A';
                  const year = assessment.year;

                  return (
                    <tr
                      key={assessment.id}
                      className='hover:bg-gray-50'
                    >
                      <td className='px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-200 sticky left-0 bg-white z-10'>
                        {year}
                      </td>
                      <td className='px-4 py-3 text-sm text-gray-900 border-r border-gray-200'>
                        {quarter}
                      </td>
                      <td className='px-4 py-3 text-sm text-gray-900 border-r border-gray-200'>
                        {rating !== 'N/A' ? (
                          <div className='flex items-center'>
                            <span className='text-lg font-semibold text-indigo-600 mr-1'>
                              {rating}
                            </span>
                            <span className='text-xs text-gray-500'>/ 5</span>
                          </div>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td className='px-4 py-3 text-sm text-gray-900 border-r border-gray-200'>
                        <div
                          className='truncate'
                          title={achievements.full !== 'N/A' && achievements.full ? achievements.full : undefined}
                        >
                          {achievements.display}
                        </div>
                      </td>
                      <td className='px-4 py-3 text-sm text-gray-900 border-r border-gray-200'>
                        <div
                          className='truncate'
                          title={improvements.full !== 'N/A' && improvements.full ? improvements.full : undefined}
                        >
                          {improvements.display}
                        </div>
                      </td>
                      <td className='px-4 py-3 text-sm text-gray-900 border-r border-gray-200'>
                        {satisfaction !== 'N/A' ? (
                          <span className='px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs whitespace-nowrap'>
                            {satisfaction}
                          </span>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td className='px-4 py-3 text-sm text-gray-900 border-r border-gray-200'>
                        <div
                          className='truncate'
                          title={aspirations.full !== 'N/A' && aspirations.full ? aspirations.full : undefined}
                        >
                          {aspirations.display}
                        </div>
                      </td>
                      <td className='px-4 py-3 text-sm text-gray-900'>
                        <div
                          className='truncate'
                          title={suggestions.full !== 'N/A' && suggestions.full ? suggestions.full : undefined}
                        >
                          {suggestions.display}
                        </div>
                      </td>
                      <td className='px-4 py-3 text-sm text-gray-900 sticky right-0 bg-white z-10'>
                        <div className='flex space-x-2'>
                          <button
                            onClick={() => handleViewAssessment(assessment)}
                            className='px-3 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                          >
                            View
                          </button>
                          {user?.role === 'ADMIN' && (
                            <button
                              onClick={() => handleEditAssessment(assessment)}
                              className='px-3 py-1 text-xs font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Assessment Detail Modal */}
      <AssessmentDetailModal
        assessment={selectedAssessment}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      {/* Assessment Edit Modal */}
      <AssessmentEditModal
        assessment={selectedAssessment}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleSaveAssessment}
      />
    </div>
  );
};

export default SelfAssessmentsList;
