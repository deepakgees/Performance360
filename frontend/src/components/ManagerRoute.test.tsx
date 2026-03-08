/**
 * Unit tests for ManagerRoute component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ManagerRoute from './ManagerRoute';

const mockUseAuth = jest.fn();
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const ManagerContent = () => <div>Manager content</div>;

const renderWithRouter = () =>
  render(
    <MemoryRouter initialEntries={['/manager']}>
      <Routes>
        <Route
          path="/manager"
          element={
            <ManagerRoute>
              <ManagerContent />
            </ManagerRoute>
          }
        />
        <Route path="/login" element={<div>Login page</div>} />
        <Route path="/" element={<div>Dashboard</div>} />
      </Routes>
    </MemoryRouter>
  );

describe('ManagerRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading spinner when loading', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true });
    renderWithRouter();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByText('Manager content')).not.toBeInTheDocument();
  });

  it('should redirect to login when not authenticated', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    renderWithRouter();
    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('Manager content')).not.toBeInTheDocument();
  });

  it('should redirect to dashboard when user is employee', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', role: 'EMPLOYEE' },
      loading: false,
    });
    renderWithRouter();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Manager content')).not.toBeInTheDocument();
  });

  it('should render children when user is manager', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', role: 'MANAGER' },
      loading: false,
    });
    renderWithRouter();
    expect(screen.getByText('Manager content')).toBeInTheDocument();
  });

  it('should render children when user is admin', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', role: 'ADMIN' },
      loading: false,
    });
    renderWithRouter();
    expect(screen.getByText('Manager content')).toBeInTheDocument();
  });
});
