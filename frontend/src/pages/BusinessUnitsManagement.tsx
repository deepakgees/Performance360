import {
  FunnelIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import React, { useCallback, useEffect, useState } from 'react';
import BusinessUnitCard from '../components/BusinessUnitCard';
import { businessUnitsAPI } from '../services/api';

interface BusinessUnitMember {
  id: string;
  joinedAt: string;
  isActive: boolean;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    position?: string;
  };
}

interface BusinessUnit {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  userBusinessUnits: BusinessUnitMember[];
}

const BusinessUnitsManagement: React.FC = () => {
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [filteredBusinessUnits, setFilteredBusinessUnits] = useState<
    BusinessUnit[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatingBusinessUnit, setIsCreatingBusinessUnit] = useState(false);
  const [newBusinessUnitName, setNewBusinessUnitName] = useState('');
  const [newBusinessUnitDescription, setNewBusinessUnitDescription] =
    useState('');

  const loadBusinessUnits = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await businessUnitsAPI.getAll();
      setBusinessUnits(response.data);
    } catch (error) {
      console.error('Error loading business units:', error);
      setError('Failed to load business units. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const filterBusinessUnits = useCallback(() => {
    if (!searchTerm.trim()) {
      setFilteredBusinessUnits(businessUnits);
      return;
    }

    const filtered = businessUnits.filter(
      businessUnit =>
        businessUnit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (businessUnit.description &&
          businessUnit.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        businessUnit.userBusinessUnits.some(
          ub =>
            ub.user.firstName
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            ub.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ub.user.email.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );
    setFilteredBusinessUnits(filtered);
  }, [businessUnits, searchTerm]);

  useEffect(() => {
    loadBusinessUnits();
  }, []);

  useEffect(() => {
    filterBusinessUnits();
  }, [businessUnits, searchTerm, filterBusinessUnits]);

  const handleCreateBusinessUnit = async () => {
    if (!newBusinessUnitName.trim()) {
      window.alert('Please enter a business unit name');
      return;
    }

    try {
      setIsLoading(true);
      await businessUnitsAPI.create({
        name: newBusinessUnitName.trim(),
        description: newBusinessUnitDescription.trim() || undefined,
      });

      setNewBusinessUnitName('');
      setNewBusinessUnitDescription('');
      setIsCreatingBusinessUnit(false);
      loadBusinessUnits();
    } catch (error) {
      console.error('Error creating business unit:', error);
      window.alert('Failed to create business unit. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBusinessUnitUpdate = () => {
    loadBusinessUnits();
  };

  const handleMemberAdded = () => {
    loadBusinessUnits();
  };

  const handleMemberRemoved = () => {
    loadBusinessUnits();
  };

  if (isLoading && businessUnits.length === 0) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading business units...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>
                Business Units Management
              </h1>
              <p className='mt-2 text-gray-600'>
                Manage business units and assign users to them
              </p>
            </div>
            <button
              onClick={() => setIsCreatingBusinessUnit(true)}
              className='flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors'
            >
              <PlusIcon className='h-5 w-5' />
              <span>Create Business Unit</span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg'>
            <p className='text-red-800'>{error}</p>
            <button
              onClick={loadBusinessUnits}
              className='mt-2 text-sm text-red-600 hover:text-red-800 underline'
            >
              Try again
            </button>
          </div>
        )}

        {/* Create Business Unit Modal */}
        {isCreatingBusinessUnit && (
          <div className='mb-6 p-6 bg-white rounded-lg shadow-md border border-gray-200'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>
              Create New Business Unit
            </h3>
            <div className='space-y-4'>
              <div>
                <label
                  htmlFor='businessUnitName'
                  className='block text-sm font-medium text-gray-700 mb-1'
                >
                  Business Unit Name *
                </label>
                <input
                  type='text'
                  id='businessUnitName'
                  value={newBusinessUnitName}
                  onChange={e => setNewBusinessUnitName(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500'
                  placeholder='Enter business unit name (e.g., GroupHosting, Reinsurance)'
                />
              </div>
              <div>
                <label
                  htmlFor='businessUnitDescription'
                  className='block text-sm font-medium text-gray-700 mb-1'
                >
                  Description
                </label>
                <textarea
                  id='businessUnitDescription'
                  value={newBusinessUnitDescription}
                  onChange={e => setNewBusinessUnitDescription(e.target.value)}
                  rows={3}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500'
                  placeholder='Enter business unit description (optional)'
                />
              </div>
              <div className='flex items-center space-x-3'>
                <button
                  onClick={handleCreateBusinessUnit}
                  disabled={isLoading || !newBusinessUnitName.trim()}
                  className='px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {isLoading ? 'Creating...' : 'Create Business Unit'}
                </button>
                <button
                  onClick={() => {
                    setIsCreatingBusinessUnit(false);
                    setNewBusinessUnitName('');
                    setNewBusinessUnitDescription('');
                  }}
                  className='px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400'
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className='mb-6'>
          <div className='flex items-center space-x-4'>
            <div className='flex-1 relative'>
              <MagnifyingGlassIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400' />
              <input
                type='text'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder='Search business units by name, description, or member...'
                className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500'
              />
            </div>
            <div className='flex items-center space-x-2 text-sm text-gray-600'>
              <FunnelIcon className='h-4 w-4' />
              <span>
                {filteredBusinessUnits.length} business unit
                {filteredBusinessUnits.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Business Units Grid */}
        {filteredBusinessUnits.length === 0 ? (
          <div className='text-center py-12'>
            <BuildingOfficeIcon className='h-16 w-16 text-gray-300 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              {searchTerm ? 'No business units found' : 'No business units yet'}
            </h3>
            <p className='text-gray-600 mb-6'>
              {searchTerm
                ? 'Try adjusting your search terms'
                : 'Get started by creating your first business unit'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setIsCreatingBusinessUnit(true)}
                className='inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors'
              >
                <PlusIcon className='h-5 w-5' />
                <span>Create Business Unit</span>
              </button>
            )}
          </div>
        ) : (
          <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {filteredBusinessUnits.map(businessUnit => (
              <BusinessUnitCard
                key={businessUnit.id}
                businessUnit={businessUnit}
                onBusinessUnitUpdate={handleBusinessUnitUpdate}
                onMemberAdded={handleMemberAdded}
                onMemberRemoved={handleMemberRemoved}
              />
            ))}
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && businessUnits.length > 0 && (
          <div className='fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50'>
            <div className='bg-white rounded-lg p-6 shadow-lg'>
              <div className='flex items-center space-x-3'>
                <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600'></div>
                <span className='text-gray-700'>Loading...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessUnitsManagement;

