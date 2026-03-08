/**
 * Unit tests for Header component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import Header from './Header';

describe('Header', () => {
  it('should render the header element', () => {
    render(<Header />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(document.getElementById('app-header')).toBeInTheDocument();
  });
});
