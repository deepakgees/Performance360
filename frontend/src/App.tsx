import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import AdminRoute from './components/AdminRoute';
import Layout from './components/Layout';
import ManagerRoute from './components/ManagerRoute';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';
import BusinessUnitDetail from './pages/BusinessUnitDetail';
import BusinessUnitsManagement from './pages/BusinessUnitsManagement';
import ColleagueFeedback from './pages/ColleagueFeedback';
import Dashboard from './pages/Dashboard';
import DirectReports from './pages/DirectReports';
import EmployeeProfile from './pages/EmployeeProfile';
import IndirectReports from './pages/IndirectReports';
import JiraSettings from './pages/JiraSettings';

import JiraUnmappedUsers from './pages/JiraUnmappedUsers';
import Login from './pages/Login';
import ManagerFeedback from './pages/ManagerFeedback';
import MonthlyAttendance from './pages/MonthlyAttendance';
import Profile from './pages/Profile';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import SelfAssessment from './pages/SelfAssessment';
import Settings from './pages/Settings';
import Sessions from './pages/Sessions';
import TeamJiraStatistics from './pages/TeamJiraStatistics';
import TeamManagement from './pages/TeamManagement';
import Users from './pages/Users';

/**
 * QueryClient configuration for React Query
 * Provides global settings for data fetching, caching, and error handling
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Retry failed requests once
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
    },
  },
});

/**
 * Main Application Component
 *
 * This is the root component that sets up the application structure including:
 * - React Query for server state management
 * - Authentication context for user state
 * - React Router for navigation
 * - Protected routes for authenticated users
 *
 * @component
 * @returns {JSX.Element} The main application layout with routing
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className='min-h-screen bg-gray-50'>
            <Routes>
              {/* Public Routes - No authentication required */}
              <Route path='/login' element={<Login />} />
              <Route path='/register' element={<Register />} />
              <Route path='/reset-password' element={<ResetPassword />} />

              {/* Protected Routes - Authentication required */}
              <Route
                path='/'
                element={
                  <PrivateRoute>
                    <Layout />
                  </PrivateRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route
                  path='colleague-feedback'
                  element={<ColleagueFeedback />}
                />
                <Route path='manager-feedback' element={<ManagerFeedback />} />
                <Route path='self-assessment' element={<SelfAssessment />} />
                <Route path='profile' element={<Profile />} />
              </Route>

              {/* Manager-only Routes - MANAGER or ADMIN role required */}
              <Route
                path='/direct-reports'
                element={
                  <ManagerRoute>
                    <Layout />
                  </ManagerRoute>
                }
              >
                <Route index element={<DirectReports />} />
              </Route>
              <Route
                path='/indirect-reports'
                element={
                  <ManagerRoute>
                    <Layout />
                  </ManagerRoute>
                }
              >
                <Route index element={<IndirectReports />} />
              </Route>

              {/* Admin-only Routes - ADMIN role required */}
              <Route
                path='/settings'
                element={
                  <AdminRoute>
                    <Layout />
                  </AdminRoute>
                }
              >
                <Route index element={<Settings />} />
                <Route path='users' element={<Users />} />
                <Route path='teams' element={<TeamManagement />} />
                <Route
                  path='teams/:teamId/statistics'
                  element={<TeamJiraStatistics />}
                />
                <Route
                  path='business-units'
                  element={<BusinessUnitsManagement />}
                />
                <Route
                  path='business-units/:businessUnitId'
                  element={<BusinessUnitDetail />}
                />
                <Route path='jira' element={<JiraSettings />} />
                <Route
                  path='jira-unmapped-users'
                  element={<JiraUnmappedUsers />}
                />
                <Route
                  path='monthly-attendance'
                  element={<MonthlyAttendance />}
                />
                <Route path='sessions' element={<Sessions />} />
              </Route>

              {/* Employee Profile Route - ADMIN role required */}
              <Route
                path='/employee-profile'
                element={
                  <AdminRoute>
                    <Layout />
                  </AdminRoute>
                }
              >
                <Route index element={<EmployeeProfile />} />
              </Route>
            </Routes>
          </div>
        </Router>
        <Toaster position='top-right' />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
