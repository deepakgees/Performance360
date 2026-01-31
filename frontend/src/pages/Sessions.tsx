import React, { useEffect, useState } from 'react';
import { sessionsAPI } from '../services/api';
import ToastNotification from '../components/Notification';

interface Session {
  id: string;
  userId: string;
  token: string;
  ipAddress?: string;
  userAgent?: string;
  lastActivityAt: string;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

interface SessionStats {
  totalSessions: number;
  activeSessions: number;
  expiredSessions: number;
  sessionsToday: number;
  uniqueUsers: number;
}

const Sessions: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterActive, setFilterActive] = useState<boolean | undefined>(
    undefined
  );
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  useEffect(() => {
    loadSessions();
    loadStats();
  }, [page, filterActive]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const response = await sessionsAPI.getAll({
        page,
        limit: 50,
        isActive: filterActive,
      });
      setSessions(response.data.sessions);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error: any) {
      setNotification({
        message: error.response?.data?.message || 'Failed to load sessions',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await sessionsAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load session statistics:', error);
    }
  };

  const handleDeactivate = async (sessionId: string) => {
    try {
      await sessionsAPI.deactivate(sessionId);
      setNotification({
        message: 'Session deactivated successfully',
        type: 'success',
      });
      loadSessions();
      loadStats();
    } catch (error: any) {
      setNotification({
        message:
          error.response?.data?.message || 'Failed to deactivate session',
        type: 'error',
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className='p-6'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold text-gray-900'>User Sessions</h1>
        <p className='mt-2 text-sm text-gray-600'>
          Track and manage all user sessions in the system
        </p>
      </div>

      {notification && (
        <ToastNotification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className='grid grid-cols-1 md:grid-cols-5 gap-4 mb-6'>
          <div className='bg-white rounded-lg shadow p-4'>
            <div className='text-sm font-medium text-gray-500'>
              Total Sessions
            </div>
            <div className='text-2xl font-bold text-gray-900'>
              {stats.totalSessions}
            </div>
          </div>
          <div className='bg-white rounded-lg shadow p-4'>
            <div className='text-sm font-medium text-gray-500'>
              Active Sessions
            </div>
            <div className='text-2xl font-bold text-green-600'>
              {stats.activeSessions}
            </div>
          </div>
          <div className='bg-white rounded-lg shadow p-4'>
            <div className='text-sm font-medium text-gray-500'>
              Expired Sessions
            </div>
            <div className='text-2xl font-bold text-red-600'>
              {stats.expiredSessions}
            </div>
          </div>
          <div className='bg-white rounded-lg shadow p-4'>
            <div className='text-sm font-medium text-gray-500'>
              Sessions Today
            </div>
            <div className='text-2xl font-bold text-blue-600'>
              {stats.sessionsToday}
            </div>
          </div>
          <div className='bg-white rounded-lg shadow p-4'>
            <div className='text-sm font-medium text-gray-500'>
              Unique Users
            </div>
            <div className='text-2xl font-bold text-purple-600'>
              {stats.uniqueUsers}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className='bg-white rounded-lg shadow mb-6 p-4'>
        <div className='flex items-center space-x-4'>
          <label className='text-sm font-medium text-gray-700'>
            Filter by Status:
          </label>
          <select
            value={filterActive === undefined ? 'all' : filterActive.toString()}
            onChange={e => {
              const value = e.target.value;
              setFilterActive(
                value === 'all' ? undefined : value === 'true'
              );
              setPage(1);
            }}
            className='border border-gray-300 rounded-md px-3 py-2 text-sm'
          >
            <option value='all'>All</option>
            <option value='true'>Active</option>
            <option value='false'>Inactive</option>
          </select>
        </div>
      </div>

      {/* Sessions Table */}
      <div className='bg-white rounded-lg shadow overflow-hidden'>
        {loading ? (
          <div className='p-8 text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto'></div>
            <p className='mt-4 text-gray-600'>Loading sessions...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className='p-8 text-center text-gray-500'>
            No sessions found
          </div>
        ) : (
          <>
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-gray-200'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      User
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      IP Address
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      User Agent
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Last Activity
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Expires At
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Time Remaining
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Status
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-gray-200'>
                  {sessions.map(session => (
                    <tr key={session.id}>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='text-sm font-medium text-gray-900'>
                          {session.user.firstName} {session.user.lastName}
                        </div>
                        <div className='text-sm text-gray-500'>
                          {session.user.email}
                        </div>
                        <div className='text-xs text-gray-400'>
                          {session.user.role}
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                        {session.ipAddress || 'N/A'}
                      </td>
                      <td className='px-6 py-4 text-sm text-gray-500 max-w-xs truncate'>
                        {session.userAgent || 'N/A'}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                        {formatDate(session.lastActivityAt)}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                        {formatDate(session.expiresAt)}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm'>
                        <span
                          className={
                            isExpired(session.expiresAt)
                              ? 'text-red-600 font-medium'
                              : 'text-gray-900'
                          }
                        >
                          {getTimeRemaining(session.expiresAt)}
                        </span>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            session.isActive && !isExpired(session.expiresAt)
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {session.isActive && !isExpired(session.expiresAt)
                            ? 'Active'
                            : 'Inactive'}
                        </span>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                        {session.isActive && !isExpired(session.expiresAt) && (
                          <button
                            onClick={() => handleDeactivate(session.id)}
                            className='text-red-600 hover:text-red-900'
                          >
                            Deactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className='bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6'>
                <div className='flex-1 flex justify-between sm:hidden'>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className='relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className='ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    Next
                  </button>
                </div>
                <div className='hidden sm:flex-1 sm:flex sm:items-center sm:justify-between'>
                  <div>
                    <p className='text-sm text-gray-700'>
                      Page <span className='font-medium'>{page}</span> of{' '}
                      <span className='font-medium'>{totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav
                      className='relative z-0 inline-flex rounded-md shadow-sm -space-x-px'
                      aria-label='Pagination'
                    >
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className='relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className='relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Sessions;
