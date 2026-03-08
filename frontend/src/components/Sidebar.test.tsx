/**
 * Unit tests for Sidebar component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import Sidebar from './Sidebar';

const mockLogout = jest.fn();
const mockOnToggle = jest.fn();
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: '1',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      role: 'ADMIN',
    },
    logout: mockLogout,
  }),
}));

describe('Sidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render sidebar with app title when not collapsed', () => {
    render(
      <MemoryRouter>
        <Sidebar isCollapsed={false} onToggle={mockOnToggle} />
      </MemoryRouter>
    );
    expect(document.getElementById('app-sidebar')).toBeInTheDocument();
    expect(screen.getByText('Performance360')).toBeInTheDocument();
  });

  it('should not show app title when collapsed', () => {
    render(
      <MemoryRouter>
        <Sidebar isCollapsed={true} onToggle={mockOnToggle} />
      </MemoryRouter>
    );
    expect(screen.queryByText('Performance360')).not.toBeInTheDocument();
  });

  it('should call onToggle when toggle button is clicked', async () => {
    render(
      <MemoryRouter>
        <Sidebar isCollapsed={false} onToggle={mockOnToggle} />
      </MemoryRouter>
    );
    const toggleBtn = screen.getByTitle('Collapse sidebar');
    await userEvent.click(toggleBtn);
    expect(mockOnToggle).toHaveBeenCalledTimes(1);
  });

  it('should show Dashboard link', () => {
    render(
      <MemoryRouter>
        <Sidebar isCollapsed={false} onToggle={mockOnToggle} />
      </MemoryRouter>
    );
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    expect(dashboardLink).toHaveAttribute('href', '/');
  });

  it('should show Employee Profile link for admin user', () => {
    render(
      <MemoryRouter>
        <Sidebar isCollapsed={false} onToggle={mockOnToggle} />
      </MemoryRouter>
    );
    expect(screen.getByRole('link', { name: /employee profile/i })).toHaveAttribute(
      'href',
      '/employee-profile'
    );
  });

  it('should expand Provide feedbacks section when clicked', async () => {
    render(
      <MemoryRouter>
        <Sidebar isCollapsed={false} onToggle={mockOnToggle} />
      </MemoryRouter>
    );
    const feedbackButton = screen.getByText('Provide feedbacks');
    await userEvent.click(feedbackButton);
    expect(screen.getByRole('link', { name: /colleague feedback/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /manager feedback/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /self assessment/i })).toBeInTheDocument();
  });

  it('should expand My Reports and Settings sections when clicked', async () => {
    render(
      <MemoryRouter>
        <Sidebar isCollapsed={false} onToggle={mockOnToggle} />
      </MemoryRouter>
    );
    await userEvent.click(screen.getByText('My Reports'));
    expect(screen.getByRole('link', { name: /my direct reports/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /my indirect reports/i })).toBeInTheDocument();
    await userEvent.click(screen.getByText('Settings'));
    expect(screen.getByRole('link', { name: /^users$/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^teams$/i })).toBeInTheDocument();
  });
});
