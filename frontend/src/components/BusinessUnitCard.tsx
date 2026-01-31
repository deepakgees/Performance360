import {
  ChevronDownIcon,
  ChevronRightIcon,
  PlusIcon,
  TrashIcon,
  UserMinusIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { businessUnitsAPI, usersAPI } from '../services/api';

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

interface BusinessUnitCardProps {
  businessUnit: BusinessUnit;
  onBusinessUnitUpdate: () => void;
  onMemberAdded: () => void;
  onMemberRemoved: () => void;
}

const BusinessUnitCard: React.FC<BusinessUnitCardProps> = ({
  businessUnit,
  onBusinessUnitUpdate,
  onMemberAdded,
  onMemberRemoved,
}) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
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
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [isSendingEmails, setIsSendingEmails] = useState(false);

  const activeMembers = businessUnit.userBusinessUnits.filter(
    ub => ub.isActive
  );

  const handleAddMember = async () => {
    if (!selectedUserId) return;

    try {
      setIsLoading(true);
      await businessUnitsAPI.addMember(
        businessUnit.id,
        selectedUserId
      );
      // Success - user has been added (and removed from any other business unit if they were in one)
      onMemberAdded();
      setIsAddingMember(false);
      setSelectedUserId('');
    } catch (error: any) {
      console.error('Error adding member:', error);
      const errorMessage =
        error.response?.data?.message ||
        'Failed to add member to business unit';
      window.alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (
      !window.confirm(
        'Are you sure you want to remove this member from the business unit?'
      )
    ) {
      return;
    }

    try {
      setIsLoading(true);
      await businessUnitsAPI.removeMember(businessUnit.id, userId);
      onMemberRemoved();
    } catch (error) {
      console.error('Error removing member:', error);
      window.alert('Failed to remove member from business unit');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBusinessUnit = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete the business unit "${businessUnit.name}"? This will remove all members from the business unit.`
      )
    ) {
      return;
    }

    try {
      setIsLoading(true);
      await businessUnitsAPI.delete(businessUnit.id);
      onBusinessUnitUpdate();
    } catch (error) {
      console.error('Error deleting business unit:', error);
      window.alert('Failed to delete business unit');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const [usersResponse, businessUnitsResponse] = await Promise.all([
        usersAPI.getAll(),
        businessUnitsAPI.getAll(),
      ]);
      const allUsers = usersResponse.data;
      const allBusinessUnits = businessUnitsResponse.data;

      // Filter out users who are already in this business unit
      const currentMemberIds = businessUnit.userBusinessUnits.map(
        ub => ub.user.id
      );

      // Create a set of user IDs who are in any other active business unit
      const usersInOtherBusinessUnits = new Set<string>();
      allBusinessUnits.forEach((bu: any) => {
        // Skip the current business unit
        if (bu.id === businessUnit.id) return;
        
        bu.userBusinessUnits
          .filter((ub: any) => ub.isActive)
          .forEach((ub: any) => {
            usersInOtherBusinessUnits.add(ub.user.id);
          });
      });

      // Filter out users who are:
      // 1. Already in this business unit
      // 2. Already in any other active business unit
      const available = allUsers.filter(
        (user: { id: string }) =>
          !currentMemberIds.includes(user.id) &&
          !usersInOtherBusinessUnits.has(user.id)
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

  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailMessage.trim()) {
      window.alert('Please fill in both subject and message fields');
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to send this email to all ${activeMembers.length} members of "${businessUnit.name}"? Each user will receive a personalized email with a password reset link.`
      )
    ) {
      return;
    }

    try {
      setIsSendingEmails(true);
      const response = await businessUnitsAPI.sendEmailToBusinessUnit(
        businessUnit.id,
        {
          subject: emailSubject.trim(),
          message: emailMessage.trim(),
        }
      );

      const { successful, failed, totalUsers } = response.data;
      let message = `Email sending completed!\n\n`;
      message += `Total users: ${totalUsers}\n`;
      message += `Successful: ${successful}\n`;
      message += `Failed: ${failed}`;

      if (failed > 0) {
        message += `\n\nSome emails failed to send. Please check the email configuration.`;
      }

      window.alert(message);
      setIsSendingEmail(false);
      setEmailSubject('');
      setEmailMessage('');
    } catch (error: any) {
      console.error('Error sending emails:', error);
      const errorMessage =
        error.response?.data?.message ||
        'Failed to send emails. Please try again.';
      window.alert(errorMessage);
    } finally {
      setIsSendingEmails(false);
    }
  };

  return (
    <div className='bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden'>
      {/* Business Unit Header */}
      <div className='p-4 border-b border-gray-200'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-3'>
            <div className='p-2 bg-purple-100 rounded-lg'>
              <BuildingOfficeIcon className='h-6 w-6 text-purple-600' />
            </div>
            <div>
              <h3
                className='text-lg font-semibold text-gray-900 cursor-pointer hover:text-purple-600 transition-colors'
                onClick={() =>
                  navigate(`/settings/business-units/${businessUnit.id}`)
                }
              >
                {businessUnit.name}
              </h3>
              {businessUnit.description && (
                <p className='text-sm text-gray-600 mt-1'>
                  {businessUnit.description}
                </p>
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

      {/* Business Unit Actions */}
      <div className='px-4 py-3 bg-gray-50 border-b border-gray-200'>
        <div className='flex items-center justify-between space-x-2'>
          <button
            onClick={openAddMemberModal}
            className='flex items-center space-x-1 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors'
          >
            <PlusIcon className='h-4 w-4' />
            <span>Add Member</span>
          </button>
          {activeMembers.length > 0 && (
            <button
              onClick={() => setIsSendingEmail(true)}
              className='flex items-center space-x-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
            >
              <EnvelopeIcon className='h-4 w-4' />
              <span>Send Email</span>
            </button>
          )}
          <button
            onClick={handleDeleteBusinessUnit}
            disabled={isLoading}
            className='flex items-center space-x-1 px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50'
          >
            <TrashIcon className='h-4 w-4' />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Add Member Modal */}
      {isAddingMember && (
        <div className='px-4 py-3 bg-purple-50 border-b border-gray-200'>
          <div className='space-y-3'>
            <h4 className='text-sm font-medium text-gray-900'>
              Add Member to Business Unit
            </h4>
            <div className='space-y-2'>
              <select
                value={selectedUserId}
                onChange={e => setSelectedUserId(e.target.value)}
                className='w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500'
              >
                <option value=''>Select a user...</option>
                {availableUsers.length === 0 ? (
                  <option value='' disabled>
                    No available users (all users are already assigned to business units)
                  </option>
                ) : (
                  availableUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.email})
                    </option>
                  ))
                )}
              </select>
              {availableUsers.length === 0 && (
                <p className='text-xs text-gray-500 mt-1'>
                  All users are already assigned to business units. Remove a user from another business unit first to assign them here.
                </p>
              )}
              <div className='flex items-center space-x-2'>
                <button
                  onClick={handleAddMember}
                  disabled={!selectedUserId || isLoading}
                  className='flex-1 px-3 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed'
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

      {/* Send Email Modal */}
      {isSendingEmail && (
        <div className='px-4 py-3 bg-blue-50 border-b border-gray-200'>
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <h4 className='text-sm font-medium text-gray-900'>
                Send Email to Business Unit Members
              </h4>
              <button
                onClick={() => {
                  setIsSendingEmail(false);
                  setEmailSubject('');
                  setEmailMessage('');
                }}
                className='text-gray-500 hover:text-gray-700'
              >
                ×
              </button>
            </div>
            <p className='text-xs text-gray-600'>
              This will send a customized email to all {activeMembers.length} active members of "{businessUnit.name}". Each user will receive a personalized email with a password reset link.
            </p>
            <div className='space-y-2'>
              <div>
                <label className='block text-xs font-medium text-gray-700 mb-1'>
                  Email Subject *
                </label>
                <input
                  type='text'
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                  placeholder='Enter email subject...'
                  className='w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
              <div>
                <label className='block text-xs font-medium text-gray-700 mb-1'>
                  Email Message * (HTML supported)
                </label>
                <textarea
                  value={emailMessage}
                  onChange={e => setEmailMessage(e.target.value)}
                  placeholder='Enter your custom message here. HTML is supported. Each user will also receive a password reset link.'
                  rows={6}
                  className='w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
                <p className='text-xs text-gray-500 mt-1'>
                  Example: &lt;p&gt;Hello team, this is an important announcement...&lt;/p&gt;
                </p>
              </div>
              <div className='flex items-center space-x-2'>
                <button
                  onClick={handleSendEmail}
                  disabled={
                    !emailSubject.trim() ||
                    !emailMessage.trim() ||
                    isSendingEmails
                  }
                  className='flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {isSendingEmails ? 'Sending...' : 'Send Email'}
                </button>
                <button
                  onClick={() => {
                    setIsSendingEmail(false);
                    setEmailSubject('');
                    setEmailMessage('');
                  }}
                  disabled={isSendingEmails}
                  className='flex-1 px-3 py-2 text-sm bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50'
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Business Unit Members */}
      {isExpanded && (
        <div className='p-4'>
          {activeMembers.length === 0 ? (
            <div className='text-center py-8 text-gray-500'>
              <BuildingOfficeIcon className='h-12 w-12 mx-auto mb-3 text-gray-300' />
              <p>No members in this business unit yet</p>
              <p className='text-sm'>Click "Add Member" to get started</p>
            </div>
          ) : (
            <div className='space-y-3'>
              <h4 className='text-sm font-medium text-gray-900 mb-3'>
                Business Unit Members
              </h4>
              {activeMembers.map(member => (
                <div
                  key={member.id}
                  className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'
                >
                  <div className='flex items-center space-x-3'>
                    <div className='w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center'>
                      <span className='text-sm font-medium text-purple-600'>
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
                      Joined:{' '}
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleRemoveMember(member.user.id)}
                      disabled={isLoading}
                      className='p-1 text-red-600 hover:bg-red-100 rounded disabled:opacity-50'
                      title='Remove from business unit'
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

export default BusinessUnitCard;

