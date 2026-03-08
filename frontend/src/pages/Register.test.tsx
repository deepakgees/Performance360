/**
 * Unit tests for Register page component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import Register from './Register';
import { authAPI } from '../services/api';

jest.mock('../services/api');

const mockAuthAPI = authAPI as jest.Mocked<typeof authAPI>;
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Register', () => {
  let consoleSpy: { log: jest.SpiedFunction<typeof console.log>; error: jest.SpiedFunction<typeof console.error> };

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy = {
      log: jest.spyOn(console, 'log').mockImplementation(() => {}),
      error: jest.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    consoleSpy.log.mockRestore();
    consoleSpy.error.mockRestore();
  });

  it('should render register form and link to login', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    expect(
      screen.getByRole('heading', { name: /create your account/i })
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText('First name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Last name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/password \(min 6 characters\)/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /already have an account/i })).toHaveAttribute(
      'href',
      '/login'
    );
  });

  it('should show error when first name and last name are empty', async () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    await userEvent.type(screen.getByPlaceholderText('Email address'), 'a@b.com');
    await userEvent.type(screen.getByPlaceholderText(/password/i), 'password1');
    await userEvent.click(screen.getByRole('button', { name: /register/i }));
    expect(
      screen.getByText('First name and last name are required')
    ).toBeInTheDocument();
    expect(mockAuthAPI.register).not.toHaveBeenCalled();
  });

  it('should show error when password is too short', async () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    await userEvent.type(screen.getByPlaceholderText('First name'), 'John');
    await userEvent.type(screen.getByPlaceholderText('Last name'), 'Doe');
    await userEvent.type(screen.getByPlaceholderText('Email address'), 'a@b.com');
    await userEvent.type(screen.getByPlaceholderText(/password/i), '12345');
    await userEvent.click(screen.getByRole('button', { name: /register/i }));
    expect(
      screen.getByText('Password must be at least 6 characters long')
    ).toBeInTheDocument();
    expect(mockAuthAPI.register).not.toHaveBeenCalled();
  });

  it('should call register and show success on success', async () => {
    mockAuthAPI.register.mockResolvedValue({ data: {} } as never);
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    await userEvent.type(screen.getByPlaceholderText('First name'), 'John');
    await userEvent.type(screen.getByPlaceholderText('Last name'), 'Doe');
    await userEvent.type(screen.getByPlaceholderText('Email address'), 'john@example.com');
    await userEvent.type(screen.getByPlaceholderText(/password/i), 'password1');
    await userEvent.click(screen.getByRole('button', { name: /register/i }));
    await screen.findByText(/registration successful/i);
    expect(mockAuthAPI.register).toHaveBeenCalledWith({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password1',
    });
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('should show error when registration fails', async () => {
    mockAuthAPI.register.mockRejectedValue({
      response: { data: { message: 'Email already exists' } },
    });
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    await userEvent.type(screen.getByPlaceholderText('First name'), 'John');
    await userEvent.type(screen.getByPlaceholderText('Last name'), 'Doe');
    await userEvent.type(screen.getByPlaceholderText('Email address'), 'john@example.com');
    await userEvent.type(screen.getByPlaceholderText(/password/i), 'password1');
    await userEvent.click(screen.getByRole('button', { name: /register/i }));
    await screen.findByText('Email already exists');
    expect(screen.getByText('Email already exists')).toBeInTheDocument();
  });

  it('should show error for 409 conflict', async () => {
    mockAuthAPI.register.mockRejectedValue({ response: { status: 409 } });
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    await userEvent.type(screen.getByPlaceholderText('First name'), 'John');
    await userEvent.type(screen.getByPlaceholderText('Last name'), 'Doe');
    await userEvent.type(screen.getByPlaceholderText('Email address'), 'john@example.com');
    await userEvent.type(screen.getByPlaceholderText(/password/i), 'password1');
    await userEvent.click(screen.getByRole('button', { name: /register/i }));
    await screen.findByText(/account with this email already exists/i);
  });

  it('should show error for 400 bad request', async () => {
    mockAuthAPI.register.mockRejectedValue({ response: { status: 400 } });
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    await userEvent.type(screen.getByPlaceholderText('First name'), 'John');
    await userEvent.type(screen.getByPlaceholderText('Last name'), 'Doe');
    await userEvent.type(screen.getByPlaceholderText('Email address'), 'john@example.com');
    await userEvent.type(screen.getByPlaceholderText(/password/i), 'password1');
    await userEvent.click(screen.getByRole('button', { name: /register/i }));
    await screen.findByText(/check your input and try again/i);
  });

  it('should show error for network error', async () => {
    mockAuthAPI.register.mockRejectedValue({ code: 'NETWORK_ERROR' });
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    await userEvent.type(screen.getByPlaceholderText('First name'), 'John');
    await userEvent.type(screen.getByPlaceholderText('Last name'), 'Doe');
    await userEvent.type(screen.getByPlaceholderText('Email address'), 'john@example.com');
    await userEvent.type(screen.getByPlaceholderText(/password/i), 'password1');
    await userEvent.click(screen.getByRole('button', { name: /register/i }));
    await screen.findByText(/network error/i);
  });

  it('should show generic error when no specific message', async () => {
    mockAuthAPI.register.mockRejectedValue(new Error('Unknown'));
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    await userEvent.type(screen.getByPlaceholderText('First name'), 'John');
    await userEvent.type(screen.getByPlaceholderText('Last name'), 'Doe');
    await userEvent.type(screen.getByPlaceholderText('Email address'), 'john@example.com');
    await userEvent.type(screen.getByPlaceholderText(/password/i), 'password1');
    await userEvent.click(screen.getByRole('button', { name: /register/i }));
    await screen.findByText(/registration failed/i);
  });
});
