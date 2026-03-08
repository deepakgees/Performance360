/**
 * Unit tests for ResetPassword page component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ResetPassword from './ResetPassword';
import { authAPI } from '../services/api';

jest.mock('../services/api');

const mockAuthAPI = authAPI as jest.Mocked<typeof authAPI>;

function renderResetPassword(initialEntry = '/reset-password') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <ResetPassword />
    </MemoryRouter>
  );
}

describe('ResetPassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show error when no token in URL', async () => {
    renderResetPassword('/reset-password');
    await screen.findByText(/no reset token provided/i);
    expect(screen.getByText(/no reset token provided/i)).toBeInTheDocument();
  });

  it('should show invalid token error when verification fails', async () => {
    mockAuthAPI.verifyResetToken = jest.fn().mockRejectedValue(new Error('Invalid'));
    renderResetPassword('/reset-password?token=bad-token');
    await screen.findByText(/invalid or expired reset token/i);
    expect(mockAuthAPI.verifyResetToken).toHaveBeenCalledWith('bad-token');
  });

  it('should show form when token is valid', async () => {
    mockAuthAPI.verifyResetToken = jest.fn().mockResolvedValue({
      data: { valid: true, email: 'user@example.com' },
    });
    renderResetPassword('/reset-password?token=valid-token');
    await screen.findByPlaceholderText(/new password/i);
    expect(screen.getByPlaceholderText(/new password/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
  });
});
