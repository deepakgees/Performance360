import {
  ChartBarIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PlusIcon,
  TrashIcon,
  UserMinusIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { teamsAPI, usersAPI } from '../services/api';

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

interface TeamCardProps {
  team: Team;
  onTeamUpdate: () => void;
  onMemberAdded: () => void;
  onMemberRemoved: () => void;
}

const TeamCard: React.FC<TeamCardProps> = ({
  team,
  onTeamUpdate,
  onMemberAdded,
  onMemberRemoved,
}) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<
    Array<{
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    }>
  >([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const activeMembers = team.userTeams.filter(ut => ut.isActive);

  const handleAddMember = async () => {
    if (!selectedUserId) return;

    try {
      setIsLoading(true);
      await teamsAPI.addMember(team.id, selectedUserId);
      onMemberAdded();
      setIsAddingMember(false);
      setSelectedUserId('');
    } catch (error) {
      console.error('Error adding member:', error);
      window.alert('Failed to add member to team');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (
      !window.confirm(
        'Are you sure you want to remove this member from the team?'
      )
    ) {
      return;
    }

    try {
      setIsLoading(true);
      await teamsAPI.removeMember(team.id, userId);
      onMemberRemoved();
    } catch (error) {
      console.error('Error removing member:', error);
      window.alert('Failed to remove member from team');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete the team "${team.name}"? This will remove all members from the team.`
      )
    ) {
      return;
    }

    try {
      setIsLoading(true);
      await teamsAPI.delete(team.id);
      onTeamUpdate();
    } catch (error) {
      console.error('Error deleting team:', error);
      window.alert('Failed to delete team');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const response = await usersAPI.getAll();
      const allUsers = response.data;

      // Filter out users who are already in this team
      const currentMemberIds = team.userTeams.map(ut => ut.user.id);
      const available = allUsers.filter(
        (user: { id: string }) => !currentMemberIds.includes(user.id)
      );

      setAvailableUsers(available);
    } catch (error) {
      console.error('Error loading users:', error);
      window.alert('Failed to load available users');
    }
  };

  const openAddMemberModal = () => {
    setIsAddingMember(true);
    loadAvailableUsers();
  };

  const handleViewStatistics = () => {
    navigate(`/settings/teams/${team.id}/statistics`);
  };

  return (
    <div className='bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden'>
      {/* Team Header */}
      <div className='p-4 border-b border-gray-200'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-3'>
            <div className='p-2 bg-blue-100 rounded-lg'>
              <UsersIcon className='h-6 w-6 text-blue-600' />
            </div>
            <div>
              <h3 className='text-lg font-semibold text-gray-900'>
                {team.name}
              </h3>
              {team.description && (
                <p className='text-sm text-gray-600 mt-1'>{team.description}</p>
              )}
            </div>
          </div>

          <div className='flex items-center space-x-2'>
            <span className='text-sm text-gray-500'>
              {activeMembers.length} member
              {activeMembers.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className='p-1 hover:bg-gray-100 rounded'
            >
              {isExpanded ? (
                <ChevronDownIcon className='h-4 w-4 text-gray-500' />
              ) : (
                <ChevronRightIcon className='h-4 w-4 text-gray-500' />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Team Actions */}
      <div className='px-4 py-3 bg-gray-50 border-b border-gray-200'>
        <div className='flex items-center justify-between space-x-2'>
          <div className='flex items-center space-x-2'>
            <button
              onClick={handleViewStatistics}
              className='flex items-center space-x-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors'
            >
              <ChartBarIcon className='h-4 w-4' />
              <span>View Statistics</span>
            </button>
            <button
              onClick={openAddMemberModal}
              className='flex items-center space-x-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
            >
              <PlusIcon className='h-4 w-4' />
              <span>Add Member</span>
            </button>
          </div>
          <button
            onClick={handleDeleteTeam}
            disabled={isLoading}
            className='flex items-center space-x-1 px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50'
          >
            <TrashIcon className='h-4 w-4' />
            <span>Delete Team</span>
          </button>
        </div>
      </div>

      {/* Add Member Modal */}
      {isAddingMember && (
        <div className='px-4 py-3 bg-blue-50 border-b border-gray-200'>
          <div className='space-y-3'>
            <h4 className='text-sm font-medium text-gray-900'>
              Add Member to Team
            </h4>
            <div className='space-y-2'>
              <select
                value={selectedUserId}
                onChange={e => setSelectedUserId(e.target.value)}
                className='w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value=''>Select a user...</option>
                {availableUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.email})
                  </option>
                ))}
              </select>
              <div className='flex items-center space-x-2'>
                <button
                  onClick={handleAddMember}
                  disabled={!selectedUserId || isLoading}
                  className='flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {isLoading ? 'Adding...' : 'Add'}
                </button>
                <button
                  onClick={() => {
                    setIsAddingMember(false);
                    setSelectedUserId('');
                  }}
                  className='flex-1 px-3 py-2 text-sm bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400'
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Members */}
      {isExpanded && (
        <div className='p-4'>
          {activeMembers.length === 0 ? (
            <div className='text-center py-8 text-gray-500'>
              <UsersIcon className='h-12 w-12 mx-auto mb-3 text-gray-300' />
              <p>No members in this team yet</p>
              <p className='text-sm'>Click "Add Member" to get started</p>
            </div>
          ) : (
            <div className='space-y-3'>
              <h4 className='text-sm font-medium text-gray-900 mb-3'>
                Team Members
              </h4>
              {activeMembers.map(member => (
                <div
                  key={member.id}
                  className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'
                >
                  <div className='flex items-center space-x-3'>
                    <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
                      <span className='text-sm font-medium text-blue-600'>
                        {member.user.firstName[0]}
                        {member.user.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <p className='text-sm font-medium text-gray-900'>
                        {member.user.firstName} {member.user.lastName}
                      </p>
                      <p className='text-xs text-gray-500'>
                        {member.user.email}
                      </p>
                      {member.user.position && (
                        <p className='text-xs text-gray-500'>
                          {member.user.position}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className='flex items-center space-x-2'>
                    <span className='text-xs text-gray-500'>
                      Joined: {new Date(member.joinedAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleRemoveMember(member.user.id)}
                      disabled={isLoading}
                      className='p-1 text-red-600 hover:bg-red-100 rounded disabled:opacity-50'
                      title='Remove from team'
                    >
                      <UserMinusIcon className='h-4 w-4' />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeamCard;
