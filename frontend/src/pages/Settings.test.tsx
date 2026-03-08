/**
 * Unit tests for Settings page component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Settings from './Settings';

describe('Settings', () => {
  it('should render Settings title and description', () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<Settings />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(
      screen.getByText('Manage application settings and configurations')
    ).toBeInTheDocument();
  });

  it('should render Outlet for child routes', () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<Settings />}>
            <Route index element={<div>Child content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });
});
