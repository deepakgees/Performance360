/**
 * Unit tests for AuthContext (useAuth hook)
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { api } from '../services/api';

jest.mock('../services/api');

const mockApi = api as jest.Mocked<typeof api>;

const Consumer: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading</div>;
  return <div>User: {user ? user.email : 'none'}</div>;
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('useAuth throws when used outside AuthProvider', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const Thrower = () => {
      useAuth();
      return null;
    };
    expect(() => render(<Thrower />)).toThrow('useAuth must be used within an AuthProvider');
    consoleSpy.mockRestore();
  });

  it('AuthProvider provides loading then user when token is valid', async () => {
    localStorage.setItem('token', 'fake-token');
    mockApi.get = jest.fn().mockResolvedValue({
      data: {
        id: '1',
        email: 'u@test.com',
        firstName: 'U',
        lastName: 'Ser',
        role: 'EMPLOYEE',
      },
    });
    mockApi.defaults = { headers: { common: {} } } as never;

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    expect(screen.getByText('Loading')).toBeInTheDocument();
    await screen.findByText(/User: u@test\.com/);
    expect(mockApi.get).toHaveBeenCalledWith('/api/users/me');
  });

  it('AuthProvider sets loading false when no token', async () => {
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );
    await screen.findByText('User: none');
  });

  it('login throws with API error message', async () => {
    mockApi.post = jest.fn().mockRejectedValue({
      response: { data: { message: 'Invalid credentials' } },
    });
    mockApi.defaults = { headers: { common: {} } } as never;

    const LoginConsumer: React.FC = () => {
      const { login } = useAuth();
      const [err, setErr] = React.useState<string | null>(null);
      const run = async () => {
        try {
          await login('a@b.com', 'wrong');
        } catch (e: any) {
          setErr(e.message);
        }
      };
      return (
        <div>
          <button onClick={run}>Login</button>
          {err && <span data-testid="error">{err}</span>}
        </div>
      );
    };

    render(
      <AuthProvider>
        <LoginConsumer />
      </AuthProvider>
    );
    await screen.findByRole('button', { name: 'Login' });
    const btn = screen.getByRole('button', { name: 'Login' });
    btn.click();
    await screen.findByTestId('error');
    expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials');
  });

  it('login throws generic message when no response', async () => {
    mockApi.post = jest.fn().mockRejectedValue(new Error('Network error'));
    mockApi.defaults = { headers: { common: {} } } as never;

    const LoginConsumer: React.FC = () => {
      const { login } = useAuth();
      const [err, setErr] = React.useState<string | null>(null);
      const run = async () => {
        try {
          await login('a@b.com', 'wrong');
        } catch (e: any) {
          setErr(e.message);
        }
      };
      return (
        <div>
          <button onClick={run}>Login</button>
          {err && <span data-testid="error">{err}</span>}
        </div>
      );
    };

    render(
      <AuthProvider>
        <LoginConsumer />
      </AuthProvider>
    );
    await screen.findByRole('button', { name: 'Login' });
    const btn = screen.getByRole('button', { name: 'Login' });
    btn.click();
    await screen.findByTestId('error');
    expect(screen.getByTestId('error')).toHaveTextContent('Login failed');
  });

  it('register stores token and user on success', async () => {
    mockApi.post = jest.fn().mockResolvedValue({
      data: {
        token: 'new-token',
        user: {
          id: '2',
          email: 'r@test.com',
          firstName: 'R',
          lastName: 'User',
          role: 'EMPLOYEE',
        },
      },
    });
    mockApi.defaults = { headers: { common: {} } } as never;

    const RegisterConsumer: React.FC = () => {
      const { register, user } = useAuth();
      const [done, setDone] = React.useState(false);
      const run = async () => {
        await register({
          email: 'r@test.com',
          password: 'p',
          firstName: 'R',
          lastName: 'User',
        });
        setDone(true);
      };
      return (
        <div>
          <button onClick={run}>Register</button>
          {done && user && <span data-testid="email">{user.email}</span>}
        </div>
      );
    };

    render(
      <AuthProvider>
        <RegisterConsumer />
      </AuthProvider>
    );
    await screen.findByRole('button', { name: 'Register' });
    const btn = screen.getByRole('button', { name: 'Register' });
    btn.click();
    await screen.findByTestId('email');
    expect(screen.getByTestId('email')).toHaveTextContent('r@test.com');
    // Register success path: token and user set in context (user visible above)
    expect(mockApi.post).toHaveBeenCalledWith('/api/auth/register', expect.any(Object));
  });

  it('register throws with API error message', async () => {
    mockApi.post = jest.fn().mockRejectedValue({
      response: { data: { message: 'Email already registered' } },
    });
    mockApi.defaults = { headers: { common: {} } } as never;

    const RegisterConsumer: React.FC = () => {
      const { register } = useAuth();
      const [err, setErr] = React.useState<string | null>(null);
      const run = async () => {
        try {
          await register({
            email: 'r@test.com',
            password: 'p',
            firstName: 'R',
            lastName: 'User',
          });
        } catch (e: any) {
          setErr(e.message);
        }
      };
      return (
        <div>
          <button onClick={run}>Register</button>
          {err && <span data-testid="error">{err}</span>}
        </div>
      );
    };

    render(
      <AuthProvider>
        <RegisterConsumer />
      </AuthProvider>
    );
    await screen.findByRole('button', { name: 'Register' });
    const btn = screen.getByRole('button', { name: 'Register' });
    btn.click();
    await screen.findByTestId('error');
    expect(screen.getByTestId('error')).toHaveTextContent('Email already registered');
  });

  it('logout clears state and token even when API fails', async () => {
    localStorage.setItem('token', 't');
    mockApi.get = jest.fn().mockResolvedValue({
      data: { id: '1', email: 'u@test.com', firstName: 'U', lastName: 'Ser', role: 'EMPLOYEE' },
    });
    mockApi.post = jest.fn().mockRejectedValue(new Error('Network error'));
    mockApi.defaults = { headers: { common: {} } } as never;

    const LogoutConsumer: React.FC = () => {
      const { logout, user, token } = useAuth();
      return (
        <div>
          <button onClick={() => logout()}>Logout</button>
          <span data-testid="user">{user ? user.email : 'none'}</span>
          <span data-testid="token">{token || 'none'}</span>
        </div>
      );
    };

    render(
      <AuthProvider>
        <LogoutConsumer />
      </AuthProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('u@test.com');
    });
    expect(screen.getByTestId('token')).toHaveTextContent('t');
    const btn = screen.getByText('Logout');
    btn.click();
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('none');
    });
    expect(screen.getByTestId('token')).toHaveTextContent('none');
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('verifyToken clears state when token invalid', async () => {
    localStorage.setItem('token', 'bad-token');
    mockApi.get = jest.fn().mockRejectedValue(new Error('Unauthorized'));
    mockApi.defaults = { headers: { common: {} } } as never;

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    expect(screen.getByText('Loading')).toBeInTheDocument();
    await screen.findByText('User: none');
    expect(localStorage.getItem('token')).toBeNull();
  });
});
