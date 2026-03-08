/**
 * Unit tests for StatCard component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import StatCard from './StatCard';

const MockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <span data-testid="mock-icon" className={className} aria-hidden="true" />
);

describe('StatCard', () => {
  it('should render name and value', () => {
    render(
      <StatCard
        name="Total Users"
        value={42}
        icon={MockIcon}
        color="bg-blue-500"
      />
    );
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('should render string value', () => {
    render(
      <StatCard
        name="Status"
        value="Active"
        icon={MockIcon}
        color="bg-green-500"
      />
    );
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should render the icon', () => {
    render(
      <StatCard
        name="Metric"
        value="100"
        icon={MockIcon}
        color="bg-indigo-500"
      />
    );
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
  });

  it('should apply color class to icon container', () => {
    const { container } = render(
      <StatCard
        name="Test"
        value="0"
        icon={MockIcon}
        color="bg-red-600"
      />
    );
    const iconContainer = container.querySelector('#stat-card-test-icon-container');
    expect(iconContainer).toHaveClass('bg-red-600');
  });

  it('should generate stable id from name with spaces', () => {
    const { container } = render(
      <StatCard
        name="Some Metric Name"
        value="x"
        icon={MockIcon}
        color="bg-gray-500"
      />
    );
    expect(container.querySelector('#stat-card-some-metric-name')).toBeInTheDocument();
    expect(container.querySelector('#stat-card-some-metric-name-label')).toHaveTextContent('Some Metric Name');
    expect(container.querySelector('#stat-card-some-metric-name-value')).toHaveTextContent('x');
  });
});
