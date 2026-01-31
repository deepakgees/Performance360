import {
  FunnelIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import React, { useCallback, useEffect, useState } from 'react';
import TeamCard from '../components/TeamCard';
import { teamsAPI } from '../services/api';

interface TeamMember {
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

interface Team {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  userTeams: TeamMember[];
}

const TeamManagement: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');

  const loadTeams = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await teamsAPI.getAll();
      setTeams(response.data);
    } catch (error) {
      console.error('Error loading teams:', error);
      setError('Failed to load teams. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const filterTeams = useCallback(() => {
    if (!searchTerm.trim()) {
      setFilteredTeams(teams);
      return;
    }

    const filtered = teams.filter(
      team =>
        team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (team.description &&
          team.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        team.userTeams.some(
          ut =>
            ut.user.firstName
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            ut.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ut.user.email.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );
    setFilteredTeams(filtered);
  }, [teams, searchTerm]);

  useEffect(() => {
    loadTeams();
  }, []);

  useEffect(() => {
    filterTeams();
  }, [teams, searchTerm, filterTeams]);

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      window.alert('Please enter a team name');
      return;
    }

    try {
      setIsLoading(true);
      await teamsAPI.create({
        name: newTeamName.trim(),
        description: newTeamDescription.trim() || undefined,
      });

      setNewTeamName('');
      setNewTeamDescription('');
      setIsCreatingTeam(false);
      loadTeams();
    } catch (error) {
      console.error('Error creating team:', error);
      window.alert('Failed to create team. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTeamUpdate = () => {
    loadTeams();
  };

  const handleMemberAdded = () => {
    loadTeams();
  };

  const handleMemberRemoved = () => {
    loadTeams();
  };

  if (isLoading && teams.length === 0) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading teams...</p>
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
                Team Management
              </h1>
              <p className='mt-2 text-gray-600'>
                Manage teams and their members across your organization
              </p>
            </div>
            <button
              onClick={() => setIsCreatingTeam(true)}
              className='flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
            >
              <PlusIcon className='h-5 w-5' />
              <span>Create Team</span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg'>
            <p className='text-red-800'>{error}</p>
            <button
              onClick={loadTeams}
              className='mt-2 text-sm text-red-600 hover:text-red-800 underline'
            >
              Try again
            </button>
          </div>
        )}

        {/* Create Team Modal */}
        {isCreatingTeam && (
          <div className='mb-6 p-6 bg-white rounded-lg shadow-md border border-gray-200'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>
              Create New Team
            </h3>
            <div className='space-y-4'>
              <div>
                <label
                  htmlFor='teamName'
                  className='block text-sm font-medium text-gray-700 mb-1'
                >
                  Team Name *
                </label>
                <input
                  type='text'
                  id='teamName'
                  value={newTeamName}
                  onChange={e => setNewTeamName(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='Enter team name'
                />
              </div>
              <div>
                <label
                  htmlFor='teamDescription'
                  className='block text-sm font-medium text-gray-700 mb-1'
                >
                  Description
                </label>
                <textarea
                  id='teamDescription'
                  value={newTeamDescription}
                  onChange={e => setNewTeamDescription(e.target.value)}
                  rows={3}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='Enter team description (optional)'
                />
              </div>
              <div className='flex items-center space-x-3'>
                <button
                  onClick={handleCreateTeam}
                  disabled={isLoading || !newTeamName.trim()}
                  className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {isLoading ? 'Creating...' : 'Create Team'}
                </button>
                <button
                  onClick={() => {
                    setIsCreatingTeam(false);
                    setNewTeamName('');
                    setNewTeamDescription('');
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
                placeholder='Search teams by name, description, or member...'
                className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>
            <div className='flex items-center space-x-2 text-sm text-gray-600'>
              <FunnelIcon className='h-4 w-4' />
              <span>
                {filteredTeams.length} team
                {filteredTeams.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Teams Grid */}
        {filteredTeams.length === 0 ? (
          <div className='text-center py-12'>
            <UsersIcon className='h-16 w-16 text-gray-300 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              {searchTerm ? 'No teams found' : 'No teams yet'}
            </h3>
            <p className='text-gray-600 mb-6'>
              {searchTerm
                ? 'Try adjusting your search terms'
                : 'Get started by creating your first team'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setIsCreatingTeam(true)}
                className='inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
              >
                <PlusIcon className='h-5 w-5' />
                <span>Create Team</span>
              </button>
            )}
          </div>
        ) : (
          <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {filteredTeams.map(team => (
              <TeamCard
                key={team.id}
                team={team}
                onTeamUpdate={handleTeamUpdate}
                onMemberAdded={handleMemberAdded}
                onMemberRemoved={handleMemberRemoved}
              />
            ))}
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && teams.length > 0 && (
          <div className='fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50'>
            <div className='bg-white rounded-lg p-6 shadow-lg'>
              <div className='flex items-center space-x-3'>
                <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600'></div>
                <span className='text-gray-700'>Loading...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamManagement;
