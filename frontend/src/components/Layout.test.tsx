/**
 * Unit tests for Layout component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import Layout from './Layout';

jest.mock('./Sidebar', () => {
  const MockSidebar: React.FC<{
    isCollapsed: boolean;
    onToggle: () => void;
  }> = ({ isCollapsed, onToggle }) => (
    <div data-testid="sidebar">
      <span data-testid="sidebar-collapsed">{String(isCollapsed)}</span>
      <button type="button" onClick={onToggle}>
        Toggle sidebar
      </button>
    </div>
  );
  return MockSidebar;
});

describe('Layout', () => {
  it('should render layout structure with main content area', () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<div>Page content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(document.getElementById('app-layout')).toBeInTheDocument();
    expect(document.getElementById('main-content-area')).toBeInTheDocument();
    expect(document.getElementById('main-content')).toBeInTheDocument();
    expect(document.getElementById('content-container')).toBeInTheDocument();
    expect(screen.getByText('Page content')).toBeInTheDocument();
  });

  it('should render Sidebar and pass toggle handler', () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<div>Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-collapsed')).toHaveTextContent('false');
  });

  it('should toggle sidebar when toggle button is clicked', async () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<div>Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    const toggleBtn = screen.getByRole('button', { name: /toggle sidebar/i });
    await userEvent.click(toggleBtn);
    expect(screen.getByTestId('sidebar-collapsed')).toHaveTextContent('true');
    await userEvent.click(toggleBtn);
    expect(screen.getByTestId('sidebar-collapsed')).toHaveTextContent('false');
  });
});
