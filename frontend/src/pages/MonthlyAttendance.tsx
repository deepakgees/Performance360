import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ToastNotification from '../components/Notification';
import { useAuth } from '../contexts/AuthContext';
import { monthlyAttendanceAPI, usersAPI, businessUnitsAPI } from '../services/api';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface MonthlyAttendance {
  id: string;
  userId: string;
  month: number;
  year: number;
  workingDays: number;
  presentInOffice: number;
  leavesAvailed: number;
  leaveNotificationsInTeamsChannel: number;
  attendancePercentage: number | null;
  weeklyCompliance: boolean | null;
  exceptionApproved: boolean | null;
  reasonForNonCompliance: string | null;
  createdAt: string;
  updatedAt: string;
  user: User;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

interface AttendanceFormProps {
  onClose: () => void;
  onSuccess: () => void;
  onError: (error: string) => void;
  editingRecord?: MonthlyAttendance | null;
}

const AttendanceForm: React.FC<AttendanceFormProps> = ({
  onClose,
  onSuccess,
  onError,
  editingRecord,
}) => {
  const [formData, setFormData] = useState({
    userId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    workingDays: 0,
    presentInOffice: 0,
    leavesAvailed: 0,
    leaveNotificationsInTeamsChannel: 0,
    weeklyCompliance: null as boolean | null,
    exceptionApproved: null as boolean | null,
    reasonForNonCompliance: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await usersAPI.getAll();
        setUsers(response.data);
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };
    loadUsers();
  }, []);

  useEffect(() => {
    if (editingRecord) {
      setFormData({
        userId: editingRecord.userId,
        month: editingRecord.month,
        year: editingRecord.year,
        workingDays: editingRecord.workingDays,
        presentInOffice: editingRecord.presentInOffice,
        leavesAvailed: editingRecord.leavesAvailed,
        leaveNotificationsInTeamsChannel: editingRecord.leaveNotificationsInTeamsChannel || 0,
        weeklyCompliance: editingRecord.weeklyCompliance,
        exceptionApproved: editingRecord.exceptionApproved,
        reasonForNonCompliance: editingRecord.reasonForNonCompliance || '',
      });
    }
  }, [editingRecord]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.userId) {
      newErrors.userId = 'Please select an employee';
    }

    if (formData.month < 1 || formData.month > 12) {
      newErrors.month = 'Month must be between 1 and 12';
    }

    if (formData.year < 2020 || formData.year > 2030) {
      newErrors.year = 'Year must be between 2020 and 2030';
    }

    if (formData.workingDays < 0 || formData.workingDays > 31) {
      newErrors.workingDays = 'Working days must be between 0 and 31';
    }

    if (formData.presentInOffice < 0) {
      newErrors.presentInOffice = 'Present in office cannot be negative';
    }

    if (formData.presentInOffice > formData.workingDays) {
      newErrors.presentInOffice =
        'Present in office cannot exceed working days';
    }

    if (formData.leavesAvailed < 0) {
      newErrors.leavesAvailed = 'Leaves availed cannot be negative';
    }

    if (formData.leavesAvailed > formData.workingDays) {
      newErrors.leavesAvailed = 'Leaves availed cannot exceed working days';
    }

    // Validate that leaves availed is a valid number (can be decimal)
    if (isNaN(formData.leavesAvailed)) {
      newErrors.leavesAvailed = 'Leaves availed must be a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      if (editingRecord) {
        await monthlyAttendanceAPI.update(editingRecord.id, {
          workingDays: formData.workingDays,
          presentInOffice: formData.presentInOffice,
          leavesAvailed: formData.leavesAvailed,
          leaveNotificationsInTeamsChannel: formData.leaveNotificationsInTeamsChannel,
          weeklyCompliance: formData.weeklyCompliance,
          exceptionApproved: formData.exceptionApproved,
          reasonForNonCompliance: formData.reasonForNonCompliance || undefined,
        });
      } else {
        await monthlyAttendanceAPI.create({
          userId: formData.userId,
          month: formData.month,
          year: formData.year,
          workingDays: formData.workingDays,
          presentInOffice: formData.presentInOffice,
          leavesAvailed: formData.leavesAvailed,
          leaveNotificationsInTeamsChannel: formData.leaveNotificationsInTeamsChannel,
          weeklyCompliance: formData.weeklyCompliance,
          exceptionApproved: formData.exceptionApproved,
          reasonForNonCompliance: formData.reasonForNonCompliance || undefined,
        });
      }
      onSuccess();
    } catch (error: any) {
      onError(
        error.response?.data?.error ||
          `Failed to ${editingRecord ? 'update' : 'create'} attendance record`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    let processedValue: any = value;

    if (name === 'month' || name === 'year' || name === 'workingDays' || name === 'presentInOffice') {
      processedValue = value === '' ? 0 : parseInt(value, 10);
    } else if (name === 'leavesAvailed' || name === 'leaveNotificationsInTeamsChannel') {
      processedValue = value === '' ? 0 : parseFloat(value);
    } else if (name === 'weeklyCompliance' || name === 'exceptionApproved') {
      if (value === '') processedValue = null;
      else if (value === 'true') processedValue = true;
      else processedValue = false;
    }

    setFormData(prev => ({ ...prev, [name]: processedValue }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      {!editingRecord && (
        <>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Employee *
            </label>
            <select
              name='userId'
              value={formData.userId}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.userId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value=''>Select an employee</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName} - {user.email}
                </option>
              ))}
            </select>
            {errors.userId && (
              <p className='text-red-500 text-xs mt-1'>{errors.userId}</p>
            )}
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Month *
              </label>
              <select
                name='month'
                value={formData.month}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.month ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                {MONTH_NAMES.map((month, index) => (
                  <option key={index + 1} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
              {errors.month && (
                <p className='text-red-500 text-xs mt-1'>{errors.month}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Year *
              </label>
              <input
                type='number'
                name='year'
                value={formData.year}
                onChange={handleInputChange}
                min='2020'
                max='2030'
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.year ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.year && (
                <p className='text-red-500 text-xs mt-1'>{errors.year}</p>
              )}
            </div>
          </div>
        </>
      )}

      <div className='grid grid-cols-4 gap-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Working Days *
          </label>
          <input
            type='number'
            name='workingDays'
            value={formData.workingDays}
            onChange={handleInputChange}
            min='0'
            max='31'
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.workingDays ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.workingDays && (
            <p className='text-red-500 text-xs mt-1'>{errors.workingDays}</p>
          )}
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Present in Office *
          </label>
          <input
            type='number'
            name='presentInOffice'
            value={formData.presentInOffice}
            onChange={handleInputChange}
            min='0'
            max={formData.workingDays}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.presentInOffice ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.presentInOffice && (
            <p className='text-red-500 text-xs mt-1'>
              {errors.presentInOffice}
            </p>
          )}
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Leaves Availed
          </label>
          <input
            type='number'
            name='leavesAvailed'
            value={formData.leavesAvailed}
            onChange={handleInputChange}
            min='0'
            max={formData.workingDays}
            step='0.5'
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.leavesAvailed ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.leavesAvailed && (
            <p className='text-red-500 text-xs mt-1'>{errors.leavesAvailed}</p>
          )}
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Leave Notifications in Teams Channel
          </label>
          <input
            type='number'
            name='leaveNotificationsInTeamsChannel'
            value={formData.leaveNotificationsInTeamsChannel}
            onChange={handleInputChange}
            min='0'
            step='0.5'
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.leaveNotificationsInTeamsChannel ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.leaveNotificationsInTeamsChannel && (
            <p className='text-red-500 text-xs mt-1'>{errors.leaveNotificationsInTeamsChannel}</p>
          )}
        </div>
      </div>

      <div>
        <label className='block text-sm font-medium text-gray-700 mb-1'>
          Weekly Compliance
        </label>
        <select
          name='weeklyCompliance'
          value={
            formData.weeklyCompliance === null
              ? ''
              : formData.weeklyCompliance.toString()
          }
          onChange={handleInputChange}
          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
        >
          <option value=''>Not Set</option>
          <option value='true'>Yes</option>
          <option value='false'>No</option>
        </select>
      </div>

      <div>
        <label className='block text-sm font-medium text-gray-700 mb-1'>
          Exception Approved
        </label>
        <select
          name='exceptionApproved'
          value={
            formData.exceptionApproved === null
              ? ''
              : formData.exceptionApproved.toString()
          }
          onChange={handleInputChange}
          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
        >
          <option value=''>Not Set</option>
          <option value='true'>Yes</option>
          <option value='false'>No</option>
        </select>
      </div>

      <div>
        <label className='block text-sm font-medium text-gray-700 mb-1'>
          Reason for Non-Compliance
        </label>
        <textarea
          name='reasonForNonCompliance'
          value={formData.reasonForNonCompliance}
          onChange={handleInputChange}
          rows={3}
          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
          placeholder='Enter reason for non-compliance (optional)'
        />
      </div>

      <div className='flex space-x-3 pt-4'>
        <button
          type='submit'
          disabled={loading}
          className='flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {loading
            ? editingRecord
              ? 'Updating...'
              : 'Creating...'
            : editingRecord
            ? 'Update Attendance'
            : 'Create Attendance'}
        </button>
        <button
          type='button'
          onClick={onClose}
          disabled={loading}
          className='flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

const MonthlyAttendance: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [attendances, setAttendances] = useState<MonthlyAttendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MonthlyAttendance | null>(
    null
  );
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning';
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'view' | 'bulk'>('view');
  const [filters, setFilters] = useState({
    employeeName: searchParams.get('employeeName') || '',
    year: searchParams.get('year') || '',
    month: searchParams.get('month') || '',
  });
  const [allAttendances, setAllAttendances] = useState<MonthlyAttendance[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Update filters when URL params change
  useEffect(() => {
    const employeeName = searchParams.get('employeeName') || '';
    const year = searchParams.get('year') || '';
    const month = searchParams.get('month') || '';
    setFilters({
      employeeName,
      year,
      month,
    });
  }, [searchParams]);

  // Load all attendance records on mount
  useEffect(() => {
    loadAttendances();
  }, []);

  // Filter attendances when filters change
  useEffect(() => {
    filterAttendances();
    setCurrentPage(1); // Reset to first page when filters change
  }, [allAttendances, filters.employeeName, filters.year, filters.month]);

  const loadAttendances = async () => {
    try {
      setLoading(true);
      // Load ALL attendance records (no filters by default)
      const response = await monthlyAttendanceAPI.getAll();
      setAllAttendances(response.data);
    } catch (error) {
      console.error('Error loading attendances:', error);
      setNotification({
        message: 'Failed to load attendance records',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAttendances = () => {
    let filtered = [...allAttendances];

    // Filter by year (if selected)
    if (filters.year) {
      const year = parseInt(filters.year);
      filtered = filtered.filter(attendance => attendance.year === year);
    }

    // Filter by month (if selected)
    if (filters.month) {
      const month = parseInt(filters.month);
      filtered = filtered.filter(attendance => attendance.month === month);
    }

    // Filter by employee name (firstName, lastName, or email) - client-side only
    if (filters.employeeName.trim()) {
      const searchTerm = filters.employeeName.toLowerCase().trim();
      filtered = filtered.filter(attendance => {
        const fullName = `${attendance.user.firstName} ${attendance.user.lastName}`.toLowerCase();
        const email = attendance.user.email.toLowerCase();
        return fullName.includes(searchTerm) || email.includes(searchTerm);
      });
    }

    setAttendances(filtered);
  };

  // Calculate pagination
  const totalPages = Math.ceil(attendances.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAttendances = attendances.slice(startIndex, endIndex);

  const handleCreate = () => {
    setEditingRecord(null);
    setShowFormModal(true);
  };

  const handleEdit = (record: MonthlyAttendance) => {
    setEditingRecord(record);
    setShowFormModal(true);
  };

  const handleDelete = async (id: string) => {
    const confirmMessage = `Are you sure you want to delete this attendance record?\n\nThis action cannot be undone.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setDeleteLoading(id);
      await monthlyAttendanceAPI.delete(id);
      setNotification({
        message: 'Attendance record deleted successfully!',
        type: 'success',
      });
      await loadAttendances();
    } catch (error) {
      console.error('Error deleting attendance:', error);
      setNotification({
        message: 'Failed to delete attendance record. Please try again.',
        type: 'error',
      });
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleFormSuccess = () => {
    setShowFormModal(false);
    setEditingRecord(null);
    setNotification({
      message: `Attendance record ${editingRecord ? 'updated' : 'created'} successfully!`,
      type: 'success',
    });
    loadAttendances();
  };

  const handleFormError = (error: string) => {
    setNotification({
      message: error,
      type: 'error',
    });
  };

  // Check for admin role
  if (user?.role !== 'ADMIN') {
    return (
      <div className='p-6'>
        <div className='max-w-2xl mx-auto'>
          <div className='bg-white rounded-lg shadow-md p-8 text-center'>
            <h2 className='text-xl font-semibold text-gray-900 mb-2'>
              Access Denied
            </h2>
            <p className='text-gray-600'>
              This page is restricted to administrators only.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Bulk Edit Component
  const BulkEditView: React.FC = () => {
    const [selectedBusinessUnit, setSelectedBusinessUnit] = useState<string>('');
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [businessUnits, setBusinessUnits] = useState<any[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [attendanceData, setAttendanceData] = useState<Record<string, {
      workingDays: number;
      presentInOffice: number;
      leavesAvailed: number;
      leaveNotificationsInTeamsChannel: number;
      weeklyCompliance: boolean | null;
      exceptionApproved: boolean | null;
      reasonForNonCompliance: string;
    }>>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [csvUploading, setCsvUploading] = useState(false);

    useEffect(() => {
      const loadBusinessUnits = async () => {
        try {
          const response = await businessUnitsAPI.getAll();
          setBusinessUnits(response.data);
        } catch (error) {
          console.error('Error loading business units:', error);
        }
      };
      loadBusinessUnits();
    }, []);

    useEffect(() => {
      const loadUsers = async () => {
        if (!selectedBusinessUnit) {
          setUsers([]);
          setAttendanceData({});
          return;
        }

        try {
          setLoading(true);
          const response = await usersAPI.getAll();
          const buUsers = response.data.filter((user: any) => 
            user.userBusinessUnits && user.userBusinessUnits.some((ubu: any) => 
              ubu.businessUnit.id === selectedBusinessUnit && ubu.isActive
            )
          );
          setUsers(buUsers);

          // Load existing attendance data
          const attendanceMap: Record<string, any> = {};
          for (const user of buUsers) {
            try {
              const attResponse = await monthlyAttendanceAPI.getByUserId(user.id);
              const filtered = attResponse.data.filter((att: MonthlyAttendance) => 
                att.year === selectedYear && att.month === selectedMonth
              );
              if (filtered && filtered.length > 0) {
                const att = filtered[0];
                attendanceMap[user.id] = {
                  workingDays: att.workingDays,
                  presentInOffice: att.presentInOffice,
                  leavesAvailed: att.leavesAvailed,
                  leaveNotificationsInTeamsChannel: att.leaveNotificationsInTeamsChannel || 0,
                  weeklyCompliance: att.weeklyCompliance,
                  exceptionApproved: att.exceptionApproved,
                  reasonForNonCompliance: att.reasonForNonCompliance || '',
                };
              } else {
                // Default values
                attendanceMap[user.id] = {
                  workingDays: 0,
                  presentInOffice: 0,
                  leavesAvailed: 0,
                  leaveNotificationsInTeamsChannel: 0,
                  weeklyCompliance: null,
                  exceptionApproved: null,
                  reasonForNonCompliance: '',
                };
              }
            } catch (error) {
              // No existing record, use defaults
              attendanceMap[user.id] = {
                workingDays: 0,
                presentInOffice: 0,
                leavesAvailed: 0,
                leaveNotificationsInTeamsChannel: 0,
                weeklyCompliance: null,
                exceptionApproved: null,
                reasonForNonCompliance: '',
              };
            }
          }
          setAttendanceData(attendanceMap);
        } catch (error) {
          console.error('Error loading users:', error);
          setNotification({
            message: 'Failed to load users. Please try again.',
            type: 'error',
          });
        } finally {
          setLoading(false);
        }
      };

      if (selectedBusinessUnit && selectedMonth && selectedYear) {
        loadUsers();
      }
    }, [selectedBusinessUnit, selectedMonth, selectedYear, businessUnits]);

    const handleCellChange = (userId: string, field: string, value: any) => {
      setAttendanceData(prev => ({
        ...prev,
        [userId]: {
          ...prev[userId],
          [field]: value,
        },
      }));
    };

    const handlePaste = (e: React.ClipboardEvent, startUserId: string) => {
      e.preventDefault();
      const paste = e.clipboardData.getData('text');
      const rows = paste.split('\n').filter(row => row.trim());
      
      const userList = users;
      const startIndex = userList.findIndex(u => u.id === startUserId);
      
      if (startIndex === -1) return;

      const newData = { ...attendanceData };
      
      rows.forEach((row, rowIndex) => {
        const userIndex = startIndex + rowIndex;
        if (userIndex >= userList.length) return;
        
        const user = userList[userIndex];
        const cells = row.split('\t').map(c => c.trim());
        
        // Expected order: Working Days, Present in Office, Leaves Availed, Leave Notifications in Teams, Weekly Compliance, Exception Approved, Reason
        if (cells.length >= 3) {
          newData[user.id] = {
            ...newData[user.id],
            workingDays: parseInt(cells[0]) || 0,
            presentInOffice: parseInt(cells[1]) || 0,
            leavesAvailed: parseFloat(cells[2]) || 0,
            leaveNotificationsInTeamsChannel: parseFloat(cells[3]) || 0,
            weeklyCompliance: cells[4] === 'Yes' || cells[4] === 'true' ? true : cells[4] === 'No' || cells[4] === 'false' ? false : null,
            exceptionApproved: cells[5] === 'Yes' || cells[5] === 'true' ? true : cells[5] === 'No' || cells[5] === 'false' ? false : null,
            reasonForNonCompliance: cells[6] || '',
          };
        }
      });
      
      setAttendanceData(newData);
    };

    const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!selectedBusinessUnit || !selectedMonth || !selectedYear) {
        setNotification({
          message: 'Please select Business Unit, Month, and Year before uploading CSV',
          type: 'error',
        });
        e.target.value = ''; // Reset file input
        return;
      }

      try {
        setCsvUploading(true);
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          setNotification({
            message: 'CSV file must have at least a header row and one data row',
            type: 'error',
          });
          e.target.value = '';
          return;
        }

        // Parse header - find column indices
        const header = lines[0].split(',').map(h => h.trim().toLowerCase());
        const emailIndex = header.findIndex(h => h === 'email' || h === 'email address' || h === 'email id');
        const workingDaysIndex = header.findIndex(h => h === 'working days' || h === 'workingdays' || h === 'working days in the month');
        const presentInOfficeIndex = header.findIndex(h => h === 'present in office' || h === 'presentinoffice' || h === 'present in office days');
        const leavesIndex = header.findIndex(h => h === 'leaves availed' || h === 'leaves' || h === 'leavesavailed');
        const leaveNotificationsIndex = header.findIndex(h => h === 'leave notifications in teams channel' || h === 'leave notifications' || h === 'leavenotificationsinteamschannel' || h === 'teams leave notifications');
        const weeklyComplianceIndex = header.findIndex(h => h === 'weekly compliance' || h === 'weeklycompliance');
        const exceptionApprovedIndex = header.findIndex(h => h === 'exception approved' || h === 'exceptional approval' || h === 'exceptionapproved');

        if (emailIndex === -1) {
          setNotification({
            message: 'CSV must have an "Email" column',
            type: 'error',
          });
          e.target.value = '';
          return;
        }

        // Parse data rows
        const updates: Record<string, {
          workingDays?: number;
          presentInOffice?: number;
          leavesAvailed?: number;
          leaveNotificationsInTeamsChannel?: number;
          weeklyCompliance?: boolean | null;
          exceptionApproved?: boolean | null;
        }> = {};
        const errors: string[] = [];

        for (let i = 1; i < lines.length; i++) {
          const cells = lines[i].split(',').map(c => c.trim());
          if (cells.length <= emailIndex) continue;

          const email = cells[emailIndex];
          if (!email) continue;

          const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
          if (!user) {
            errors.push(`User with email ${email} not found in selected business unit`);
            continue;
          }

          const update: any = {};

          // Parse Working Days
          if (workingDaysIndex !== -1 && cells[workingDaysIndex]) {
            const workingDays = parseInt(cells[workingDaysIndex]);
            if (!isNaN(workingDays) && workingDays >= 0) {
              update.workingDays = workingDays;
            } else if (cells[workingDaysIndex]) {
              errors.push(`Invalid working days for ${email}: ${cells[workingDaysIndex]}`);
            }
          }

          // Parse Present in Office
          if (presentInOfficeIndex !== -1 && cells[presentInOfficeIndex]) {
            const presentInOffice = parseInt(cells[presentInOfficeIndex]);
            if (!isNaN(presentInOffice) && presentInOffice >= 0) {
              update.presentInOffice = presentInOffice;
            } else if (cells[presentInOfficeIndex]) {
              errors.push(`Invalid present in office for ${email}: ${cells[presentInOfficeIndex]}`);
            }
          }

          // Parse Leaves Availed
          if (leavesIndex !== -1 && cells[leavesIndex]) {
            const leaves = parseFloat(cells[leavesIndex]);
            if (!isNaN(leaves) && leaves >= 0) {
              update.leavesAvailed = leaves;
            } else if (cells[leavesIndex]) {
              errors.push(`Invalid leaves availed for ${email}: ${cells[leavesIndex]}`);
            }
          }

          // Parse Leave Notifications in Teams Channel
          if (leaveNotificationsIndex !== -1 && cells[leaveNotificationsIndex]) {
            const leaveNotifications = parseFloat(cells[leaveNotificationsIndex]);
            if (!isNaN(leaveNotifications) && leaveNotifications >= 0) {
              update.leaveNotificationsInTeamsChannel = leaveNotifications;
            } else if (cells[leaveNotificationsIndex]) {
              errors.push(`Invalid leave notifications in teams channel for ${email}: ${cells[leaveNotificationsIndex]}`);
            }
          }

          // Parse Weekly Compliance
          if (weeklyComplianceIndex !== -1 && cells[weeklyComplianceIndex]) {
            const weeklyComplianceStr = cells[weeklyComplianceIndex].toLowerCase();
            if (weeklyComplianceStr === 'yes' || weeklyComplianceStr === 'true' || weeklyComplianceStr === '1') {
              update.weeklyCompliance = true;
            } else if (weeklyComplianceStr === 'no' || weeklyComplianceStr === 'false' || weeklyComplianceStr === '0') {
              update.weeklyCompliance = false;
            } else if (weeklyComplianceStr === '' || weeklyComplianceStr === 'not set' || weeklyComplianceStr === 'null') {
              update.weeklyCompliance = null;
            }
          }

          // Parse Exception Approved
          if (exceptionApprovedIndex !== -1 && cells[exceptionApprovedIndex]) {
            const exceptionApprovedStr = cells[exceptionApprovedIndex].toLowerCase();
            if (exceptionApprovedStr === 'yes' || exceptionApprovedStr === 'true' || exceptionApprovedStr === '1') {
              update.exceptionApproved = true;
            } else if (exceptionApprovedStr === 'no' || exceptionApprovedStr === 'false' || exceptionApprovedStr === '0') {
              update.exceptionApproved = false;
            } else if (exceptionApprovedStr === '' || exceptionApprovedStr === 'not set' || exceptionApprovedStr === 'null') {
              update.exceptionApproved = null;
            }
          }

          if (Object.keys(update).length > 0) {
            updates[user.id] = update;
          }
        }

        if (Object.keys(updates).length === 0) {
          setNotification({
            message: 'No valid records found in CSV file',
            type: 'error',
          });
          e.target.value = '';
          return;
        }

        // Update attendance data
        const newData = { ...attendanceData };
        Object.keys(updates).forEach(userId => {
          newData[userId] = {
            ...(newData[userId] || {
              workingDays: 0,
              presentInOffice: 0,
              leavesAvailed: 0,
              leaveNotificationsInTeamsChannel: 0,
              weeklyCompliance: null,
              exceptionApproved: null,
              reasonForNonCompliance: '',
            }),
            ...updates[userId],
          };
        });
        setAttendanceData(newData);

        // Automatically save to database after CSV upload
        const records = users
          .filter(user => newData[user.id])
          .map(user => {
            const data = newData[user.id];
            return {
              userId: user.id,
              month: selectedMonth,
              year: selectedYear,
              workingDays: data.workingDays,
              presentInOffice: data.presentInOffice,
              leavesAvailed: data.leavesAvailed,
              leaveNotificationsInTeamsChannel: data.leaveNotificationsInTeamsChannel || 0,
              weeklyCompliance: data.weeklyCompliance,
              exceptionApproved: data.exceptionApproved,
              reasonForNonCompliance: data.reasonForNonCompliance && data.reasonForNonCompliance.trim() ? data.reasonForNonCompliance : undefined,
            };
          });

        if (records.length > 0) {
          try {
            const response = await monthlyAttendanceAPI.bulkUpdate(records);
            if (errors.length > 0) {
              setNotification({
                message: `Saved ${response.data.success} records to database. ${errors.length} errors: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}`,
                type: 'warning',
              });
            } else {
              setNotification({
                message: `Successfully saved ${response.data.success} attendance record(s) to database!`,
                type: 'success',
              });
            }
            if (response.data.errors && response.data.errors.length > 0) {
              console.error('Some records had errors:', response.data.errors);
            }
            // Reload data to reflect saved changes
            const attendanceMap: Record<string, any> = {};
            for (const user of users) {
              try {
                const attResponse = await monthlyAttendanceAPI.getByUserId(user.id);
                const filtered = attResponse.data.filter((att: MonthlyAttendance) => 
                  att.year === selectedYear && att.month === selectedMonth
                );
                if (filtered && filtered.length > 0) {
                  const att = filtered[0];
                  attendanceMap[user.id] = {
                    workingDays: att.workingDays,
                    presentInOffice: att.presentInOffice,
                    leavesAvailed: att.leavesAvailed,
                    leaveNotificationsInTeamsChannel: att.leaveNotificationsInTeamsChannel || 0,
                    weeklyCompliance: att.weeklyCompliance,
                    exceptionApproved: att.exceptionApproved,
                    reasonForNonCompliance: att.reasonForNonCompliance || '',
                  };
                }
              } catch (error) {
                // Ignore
              }
            }
            setAttendanceData(attendanceMap);
          } catch (saveError: any) {
            console.error('Error saving CSV data:', saveError);
            setNotification({
              message: saveError.response?.data?.error || 'Failed to save CSV data to database. Please try again.',
              type: 'error',
            });
          }
        } else {
          if (errors.length > 0) {
            setNotification({
              message: `Updated ${Object.keys(updates).length} records in UI. ${errors.length} errors: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}. No records to save.`,
              type: 'warning',
            });
          } else {
            setNotification({
              message: 'No records to save to database.',
              type: 'warning',
            });
          }
        }
      } catch (error) {
        console.error('Error parsing CSV:', error);
        setNotification({
          message: 'Failed to parse CSV file. Please check the format.',
          type: 'error',
        });
      } finally {
        setCsvUploading(false);
        e.target.value = ''; // Reset file input
      }
    };

    const handleSave = async () => {
      if (!selectedBusinessUnit || !selectedMonth || !selectedYear) {
        setNotification({
          message: 'Please select Business Unit, Month, and Year',
          type: 'error',
        });
        return;
      }

      const records = users.map(user => {
        const data = attendanceData[user.id];
        if (!data) return null;
        
        return {
          userId: user.id,
          month: selectedMonth,
          year: selectedYear,
          workingDays: data.workingDays,
          presentInOffice: data.presentInOffice,
          leavesAvailed: data.leavesAvailed,
          leaveNotificationsInTeamsChannel: data.leaveNotificationsInTeamsChannel || 0,
          weeklyCompliance: data.weeklyCompliance,
          exceptionApproved: data.exceptionApproved,
          reasonForNonCompliance: data.reasonForNonCompliance || null,
        };
      }).filter(r => r !== null);

      if (records.length === 0) {
        setNotification({
          message: 'No data to save',
          type: 'error',
        });
        return;
      }

      try {
        setSaving(true);
        const response = await monthlyAttendanceAPI.bulkUpdate(records as any);
        setNotification({
          message: `Successfully saved ${response.data.success} attendance record(s)!`,
          type: 'success',
        });
        if (response.data.errors && response.data.errors.length > 0) {
          console.error('Some records had errors:', response.data.errors);
        }
        // Reload data
        const attendanceMap: Record<string, any> = {};
          for (const user of users) {
            try {
              const attResponse = await monthlyAttendanceAPI.getByUserId(user.id);
              const filtered = attResponse.data.filter((att: MonthlyAttendance) => 
                att.year === selectedYear && att.month === selectedMonth
              );
              if (filtered && filtered.length > 0) {
                const att = filtered[0];
              attendanceMap[user.id] = {
                workingDays: att.workingDays,
                presentInOffice: att.presentInOffice,
                leavesAvailed: att.leavesAvailed,
                leaveNotificationsInTeamsChannel: att.leaveNotificationsInTeamsChannel || 0,
                weeklyCompliance: att.weeklyCompliance,
                exceptionApproved: att.exceptionApproved,
                reasonForNonCompliance: att.reasonForNonCompliance || '',
              };
            }
          } catch (error) {
            // Ignore
          }
        }
        setAttendanceData(attendanceMap);
      } catch (error: any) {
        console.error('Error saving bulk attendance:', error);
        setNotification({
          message: error.response?.data?.error || 'Failed to save attendance records. Please try again.',
          type: 'error',
        });
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className='space-y-6'>
        <div className='bg-white rounded-lg shadow-md p-4'>
          <div className='grid grid-cols-3 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Business Unit *
              </label>
              <select
                value={selectedBusinessUnit}
                onChange={e => setSelectedBusinessUnit(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
              >
                <option value=''>Select Business Unit</option>
                {businessUnits.map(bu => (
                  <option key={bu.id} value={bu.id}>
                    {bu.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Month *
              </label>
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(parseInt(e.target.value))}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
              >
                {MONTH_NAMES.map((month, index) => (
                  <option key={index + 1} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Year *
              </label>
              <input
                type='number'
                value={selectedYear}
                onChange={e => setSelectedYear(parseInt(e.target.value))}
                min='2020'
                max='2030'
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className='flex justify-center items-center py-12 bg-white rounded-lg shadow-md'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600'></div>
            <span className='ml-2 text-gray-600'>Loading users...</span>
          </div>
        ) : users.length > 0 ? (
          <div className='bg-white rounded-lg shadow-md overflow-hidden'>
            <div className='p-4 bg-gray-50 border-b border-gray-200'>
              <div className='flex justify-between items-center mb-4'>
                <h3 className='text-lg font-semibold text-gray-900'>
                  Bulk Edit Attendance ({users.length} users)
                </h3>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className='bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {saving ? 'Saving...' : 'Save All'}
                </button>
              </div>
              <div className='flex items-center space-x-4'>
                <div className='flex-1'>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Upload CSV to Update Attendance
                  </label>
                  <div className='flex items-center space-x-2'>
                    <input
                      type='file'
                      accept='.csv'
                      onChange={handleCSVUpload}
                      disabled={csvUploading}
                      className='block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed'
                    />
                    <a
                      href='/templates/attendance-leaves-template.csv'
                      download='attendance-leaves-template.csv'
                      className='text-sm text-indigo-600 hover:text-indigo-800 underline whitespace-nowrap'
                    >
                      Download Template
                    </a>
                  </div>
                  <p className='text-xs text-gray-500 mt-2'>
                    CSV should have: Email (required), Working Days, Present in Office, Leaves Availed, Leave Notifications in Teams Channel, Weekly Compliance (Yes/No), Exception Approved (Yes/No). All fields except Email are optional.
                  </p>
                </div>
              </div>
            </div>
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-gray-200'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10'>
                      Employee
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Working Days
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Present in Office
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Leaves Availed
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Leave Notifications in Teams
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Weekly Compliance
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Exception Approved
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Reason for Non-Compliance
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-gray-200'>
                  {users.map(user => {
                    const data = attendanceData[user.id] || {
                      workingDays: 0,
                      presentInOffice: 0,
                      leavesAvailed: 0,
                      leaveNotificationsInTeamsChannel: 0,
                      weeklyCompliance: null,
                      exceptionApproved: null,
                      reasonForNonCompliance: '',
                    };
                    return (
                      <tr key={user.id} className='hover:bg-gray-50'>
                        <td className='px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white z-10'>
                          {user.firstName} {user.lastName}
                          <div className='text-xs text-gray-500'>{user.email}</div>
                        </td>
                        <td className='px-4 py-3 whitespace-nowrap'>
                          <input
                            type='number'
                            value={data.workingDays}
                            onChange={e => handleCellChange(user.id, 'workingDays', parseInt(e.target.value) || 0)}
                            onPaste={e => handlePaste(e, user.id)}
                            className='w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
                            min='0'
                            max='31'
                          />
                        </td>
                        <td className='px-4 py-3 whitespace-nowrap'>
                          <input
                            type='number'
                            value={data.presentInOffice}
                            onChange={e => handleCellChange(user.id, 'presentInOffice', parseInt(e.target.value) || 0)}
                            onPaste={e => handlePaste(e, user.id)}
                            className='w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
                            min='0'
                          />
                        </td>
                        <td className='px-4 py-3 whitespace-nowrap'>
                          <input
                            type='number'
                            step='0.5'
                            value={data.leavesAvailed}
                            onChange={e => handleCellChange(user.id, 'leavesAvailed', parseFloat(e.target.value) || 0)}
                            onPaste={e => handlePaste(e, user.id)}
                            className='w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
                            min='0'
                          />
                        </td>
                        <td className='px-4 py-3 whitespace-nowrap'>
                          <input
                            type='number'
                            step='0.5'
                            value={data.leaveNotificationsInTeamsChannel}
                            onChange={e => handleCellChange(user.id, 'leaveNotificationsInTeamsChannel', parseFloat(e.target.value) || 0)}
                            onPaste={e => handlePaste(e, user.id)}
                            className='w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
                            min='0'
                          />
                        </td>
                        <td className='px-4 py-3 whitespace-nowrap'>
                          <select
                            value={data.weeklyCompliance === null ? '' : data.weeklyCompliance.toString()}
                            onChange={e => {
                              const val = e.target.value === '' ? null : e.target.value === 'true';
                              handleCellChange(user.id, 'weeklyCompliance', val);
                            }}
                            className='w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
                          >
                            <option value=''>Not Set</option>
                            <option value='true'>Yes</option>
                            <option value='false'>No</option>
                          </select>
                        </td>
                        <td className='px-4 py-3 whitespace-nowrap'>
                          <select
                            value={data.exceptionApproved === null ? '' : data.exceptionApproved.toString()}
                            onChange={e => {
                              const val = e.target.value === '' ? null : e.target.value === 'true';
                              handleCellChange(user.id, 'exceptionApproved', val);
                            }}
                            className='w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
                          >
                            <option value=''>Not Set</option>
                            <option value='true'>Yes</option>
                            <option value='false'>No</option>
                          </select>
                        </td>
                        <td className='px-4 py-3 whitespace-nowrap'>
                          <input
                            type='text'
                            value={data.reasonForNonCompliance}
                            onChange={e => handleCellChange(user.id, 'reasonForNonCompliance', e.target.value)}
                            onPaste={e => handlePaste(e, user.id)}
                            placeholder='Reason...'
                            className='w-48 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className='p-4 bg-gray-50 border-t border-gray-200 text-sm text-gray-600'>
              <p className='mb-2'><strong>Tip:</strong> You can copy data from Excel and paste it directly into the table cells.</p>
              <p>Expected format (tab-separated): Working Days | Present in Office | Leaves Availed | Leave Notifications in Teams | Weekly Compliance (Yes/No) | Exception Approved (Yes/No) | Reason</p>
            </div>
          </div>
        ) : selectedBusinessUnit ? (
          <div className='bg-white rounded-lg shadow-md p-8 text-center'>
            <p className='text-gray-600'>No users found in this business unit.</p>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className='p-6'>
      <div className='max-w-7xl mx-auto'>
        <div className='flex justify-between items-center mb-6'>
          <h1 className='text-2xl font-bold text-gray-900'>
            Monthly Attendance Management
          </h1>
          {activeTab === 'view' && (
            <button
              onClick={handleCreate}
              className='bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-2'
            >
              <svg
                className='w-4 h-4'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 4v16m8-8H4'
                />
              </svg>
              <span>Add Attendance</span>
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className='mb-6 border-b border-gray-200'>
          <nav className='-mb-px flex space-x-8'>
            <button
              onClick={() => setActiveTab('view')}
              className={`${
                activeTab === 'view'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              View/Edit
            </button>
            <button
              onClick={() => setActiveTab('bulk')}
              className={`${
                activeTab === 'bulk'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Bulk Edit
            </button>
          </nav>
        </div>

        {activeTab === 'bulk' ? (
          <BulkEditView />
        ) : (
          <>
            {/* Filters */}
            <div className='bg-white rounded-lg shadow-md p-4 mb-6'>
          <div className='grid grid-cols-3 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Filter by Year
              </label>
              <input
                type='number'
                value={filters.year}
                onChange={e => {
                  const value = e.target.value;
                  setFilters({ ...filters, year: value === '' ? '' : value });
                }}
                placeholder='All years'
                min='2020'
                max='2030'
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Filter by Month
              </label>
              <select
                value={filters.month}
                onChange={e => setFilters({ ...filters, month: e.target.value })}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
              >
                <option value=''>All Months</option>
                {MONTH_NAMES.map((month, index) => (
                  <option key={index + 1} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Filter by Employee Name
              </label>
              <input
                type='text'
                value={filters.employeeName}
                onChange={e =>
                  setFilters({ ...filters, employeeName: e.target.value })
                }
                placeholder='Search by name or email...'
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
              />
            </div>
          </div>
        </div>

            {/* Attendance Table */}
            <div className='bg-white rounded-lg shadow-md overflow-hidden'>
          {loading ? (
            <div className='flex justify-center items-center py-12'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600'></div>
              <span className='ml-2 text-gray-600'>Loading attendance...</span>
            </div>
          ) : (
            <div>
              <table className='w-full divide-y divide-gray-200'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Employee
                    </th>
                    <th className='px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Month/Year
                    </th>
                    <th className='px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Working Days
                    </th>
                    <th className='px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Present
                    </th>
                    <th className='px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Leaves
                    </th>
                    <th className='px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Teams Notifications
                    </th>
                    <th className='px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Attendance %
                    </th>
                    <th className='px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Weekly Compliance
                    </th>
                    <th className='px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Exception Approved
                    </th>
                    <th className='px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-gray-200'>
                  {attendances.length === 0 ? (
                    <tr>
                      <td
                        colSpan={10}
                        className='px-2 py-8 text-center text-gray-500'
                      >
                        No attendance records found.
                      </td>
                    </tr>
                  ) : (
                    paginatedAttendances.map(attendance => (
                      <tr key={attendance.id} className='hover:bg-gray-50'>
                        <td className='px-2 py-2 whitespace-nowrap text-sm font-medium text-gray-900'>
                          {attendance.user.firstName} {attendance.user.lastName}
                        </td>
                        <td className='px-2 py-2 whitespace-nowrap text-sm text-gray-900'>
                          {MONTH_NAMES[attendance.month - 1]} {attendance.year}
                        </td>
                        <td className='px-2 py-2 whitespace-nowrap text-sm text-gray-900 text-center'>
                          {attendance.workingDays}
                        </td>
                        <td className='px-2 py-2 whitespace-nowrap text-sm text-gray-900 text-center'>
                          {attendance.presentInOffice}
                        </td>
                        <td className='px-2 py-2 whitespace-nowrap text-sm text-gray-900 text-center'>
                          {attendance.leavesAvailed}
                        </td>
                        <td className='px-2 py-2 whitespace-nowrap text-sm text-gray-900 text-center'>
                          {attendance.leaveNotificationsInTeamsChannel || 0}
                        </td>
                        <td className='px-2 py-2 whitespace-nowrap text-sm text-gray-900 text-center'>
                          {attendance.attendancePercentage !== null
                            ? `${attendance.attendancePercentage.toFixed(1)}%`
                            : 'N/A'}
                        </td>
                        <td className='px-2 py-2 whitespace-nowrap text-sm text-center'>
                          {attendance.weeklyCompliance === null ? (
                            <span className='text-gray-500 text-xs'>Not Set</span>
                          ) : attendance.weeklyCompliance ? (
                            <span className='inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800'>
                              Yes
                            </span>
                          ) : (
                            <span className='inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800'>
                              No
                            </span>
                          )}
                        </td>
                        <td className='px-2 py-2 whitespace-nowrap text-sm text-center'>
                          {attendance.exceptionApproved === null ? (
                            <span className='text-gray-500 text-xs'>Not Set</span>
                          ) : attendance.exceptionApproved ? (
                            <span className='inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800'>
                              Yes
                            </span>
                          ) : (
                            <span className='inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800'>
                              No
                            </span>
                          )}
                        </td>
                        <td className='px-2 py-2 whitespace-nowrap text-sm font-medium'>
                          <div className='flex flex-col space-y-0.5'>
                            <button
                              onClick={() => handleEdit(attendance)}
                              className='text-indigo-600 hover:text-indigo-900 text-xs'
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(attendance.id)}
                              disabled={deleteLoading === attendance.id}
                              className='text-red-600 hover:text-red-900 text-xs disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                              {deleteLoading === attendance.id
                                ? 'Deleting...'
                                : 'Delete'}
                            </button>
                            {attendance.reasonForNonCompliance && (
                              <button
                                onClick={() =>
                                  alert(
                                    `Reason: ${attendance.reasonForNonCompliance}`
                                  )
                                }
                                className='text-blue-600 hover:text-blue-900 text-xs'
                                title={attendance.reasonForNonCompliance}
                              >
                                View Reason
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination Controls */}
          {attendances.length > 0 && (
            <div className='bg-white px-4 py-3 border-t border-gray-200 sm:px-6'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-4'>
                  <div className='flex items-center space-x-2'>
                    <label className='text-sm text-gray-700'>Show:</label>
                    <select
                      value={itemsPerPage}
                      onChange={e => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className='border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span className='text-sm text-gray-500'>per page</span>
                  </div>
                  <div className='text-sm text-gray-700'>
                    Showing <span className='font-medium'>{startIndex + 1}</span> to{' '}
                    <span className='font-medium'>{Math.min(endIndex, attendances.length)}</span> of{' '}
                    <span className='font-medium'>{attendances.length}</span> records
                  </div>
                </div>
                <div className='flex items-center space-x-2'>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className='relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-md'
                  >
                    Previous
                  </button>
                  <span className='text-sm text-gray-700 px-3'>
                    Page <span className='font-medium'>{currentPage}</span> of{' '}
                    <span className='font-medium'>{totalPages || 1}</span>
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className='relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-md'
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

            {/* Form Modal */}
            {showFormModal && (
          <div className='fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50'>
            <div className='relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white'>
              <div className='mt-3'>
                <h3 className='text-lg font-medium text-gray-900 mb-4'>
                  {editingRecord ? 'Edit Attendance Record' : 'Add Attendance Record'}
                </h3>
                <AttendanceForm
                  onClose={() => {
                    setShowFormModal(false);
                    setEditingRecord(null);
                  }}
                  onSuccess={handleFormSuccess}
                  onError={handleFormError}
                  editingRecord={editingRecord}
                />
              </div>
            </div>
          </div>
            )}
          </>
        )}
      </div>

      {notification && (
        <ToastNotification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default MonthlyAttendance;

