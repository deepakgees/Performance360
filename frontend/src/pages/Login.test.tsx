/**
 * Unit tests for Login page component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import Login from './Login';

const mockLogin = jest.fn();
const mockNavigate = jest.fn();
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin }),
}));
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

function renderLogin(initialEntries = ['/login']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Login />
    </MemoryRouter>
  );
}

describe('Login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render login form with title and link to register', () => {
    renderLogin();
    expect(
      screen.getByRole('heading', { name: /sign in to your account/i })
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    const registerLink = screen.getByRole('link', { name: /create a new account/i });
    expect(registerLink).toHaveAttribute('href', '/register');
  });

  it('should update email and password on input', async () => {
    renderLogin();
    await userEvent.type(screen.getByPlaceholderText('Email address'), 'a@b.com');
    await userEvent.type(screen.getByPlaceholderText('Password'), 'pass123');
    expect(screen.getByPlaceholderText('Email address')).toHaveValue('a@b.com');
    expect(screen.getByPlaceholderText('Password')).toHaveValue('pass123');
  });

  it('should call login and navigate on submit', async () => {
    mockLogin.mockResolvedValue(undefined);
    renderLogin();
    await userEvent.type(screen.getByPlaceholderText('Email address'), 'a@b.com');
    await userEvent.type(screen.getByPlaceholderText('Password'), 'pass123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await screen.findByText(/signing in/i);
    expect(mockLogin).toHaveBeenCalledWith('a@b.com', 'pass123');
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('should show error when login fails', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid credentials'));
    renderLogin();
    await userEvent.type(screen.getByPlaceholderText('Email address'), 'a@b.com');
    await userEvent.type(screen.getByPlaceholderText('Password'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await screen.findByText('Invalid credentials');
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  });

  it('should show success message from location state', () => {
    const state = { message: 'Password reset successful' };
    render(
      <MemoryRouter initialEntries={[{ pathname: '/login', state }]}>
        <Login />
      </MemoryRouter>
    );
    expect(screen.getByText('Password reset successful')).toBeInTheDocument();
  });
});
