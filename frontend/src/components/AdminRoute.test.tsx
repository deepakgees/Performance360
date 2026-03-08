/**
 * Unit tests for AdminRoute component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AdminRoute from './AdminRoute';

const mockUseAuth = jest.fn();
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const AdminContent = () => <div>Admin content</div>;

const renderWithRouter = () =>
  render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminContent />
            </AdminRoute>
          }
        />
        <Route path="/login" element={<div>Login page</div>} />
        <Route path="/" element={<div>Dashboard</div>} />
      </Routes>
    </MemoryRouter>
  );

describe('AdminRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading spinner when loading', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true });
    renderWithRouter();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByText('Admin content')).not.toBeInTheDocument();
  });

  it('should redirect to login when not authenticated', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    renderWithRouter();
    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('Admin content')).not.toBeInTheDocument();
  });

  it('should redirect to dashboard when user is not admin', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', role: 'MANAGER' },
      loading: false,
    });
    renderWithRouter();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Admin content')).not.toBeInTheDocument();
  });

  it('should render children when user is admin', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', role: 'ADMIN' },
      loading: false,
    });
    renderWithRouter();
    expect(screen.getByText('Admin content')).toBeInTheDocument();
  });
});
