import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import { api } from '../services/api';

/**
 * User Interface
 *
 * Defines the structure of user data used throughout the application.
 * This interface represents the user information returned from the API.
 */
interface User {
  id: string; // Unique user identifier
  email: string; // User's email address
  firstName: string; // User's first name
  lastName: string; // User's last name
  role: string; // User's role in the system
  position?: string; // User's position (optional)
  manager?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  userTeams?: Array<{
    id: string;
    joinedAt: string;
    isActive: boolean;
    team: {
      id: string;
      name: string;
      description?: string;
    };
  }>;
}

/**
 * Authentication Context Type
 *
 * Defines the shape of the authentication context that provides
 * authentication state and methods to child components.
 */
interface AuthContextType {
  user: User | null; // Current user data or null if not authenticated
  token: string | null; // Authentication token or null if not authenticated
  login: (email: string, password: string) => Promise<void>; // Login function
  register: (userData: RegisterData) => Promise<void>; // Registration function
  logout: () => void; // Logout function
  loading: boolean; // Loading state for authentication operations
}

/**
 * Registration Data Interface
 *
 * Defines the data structure required for user registration.
 */
interface RegisterData {
  email: string; // User's email address
  password: string; // User's password
  firstName: string; // User's first name
  lastName: string; // User's last name
  role?: string; // User's role (optional, may be set by system)
}

/**
 * Authentication Context
 *
 * React context for managing authentication state across the application.
 * Provides user data, authentication token, and authentication methods.
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Custom hook to use the authentication context
 *
 * This hook provides access to the authentication context and ensures
 * it's used within the AuthProvider component.
 *
 * @returns {AuthContextType} The authentication context value
 * @throws {Error} If used outside of AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Authentication Provider Component
 *
 * This component provides authentication state and methods to all child components.
 * It manages user authentication, token storage, and API authentication headers.
 *
 * Features:
 * - Automatic token verification on app load
 * - Persistent authentication across browser sessions
 * - Centralized authentication state management
 * - Automatic API header management
 *
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Child components to wrap
 * @returns {JSX.Element} AuthProvider component
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Authentication state
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('token')
  );
  const [loading, setLoading] = useState(true);

  /**
   * Effect to initialize authentication state
   *
   * Runs on component mount and when token changes:
   * - Sets up API authorization headers if token exists
   * - Verifies token validity with the server
   * - Handles invalid tokens by clearing authentication state
   */
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Verify token and get user data
      verifyToken();
    } else {
      setLoading(false);
    }
  }, [token]);

  /**
   * Verify authentication token with the server
   *
   * Makes an API call to verify the stored token and retrieve current user data.
   * If the token is invalid, it clears the authentication state.
   */
  const verifyToken = async () => {
    try {
      const response = await api.get('/api/users/me');
      setUser(response.data);
    } catch (error) {
      // Token is invalid, clear authentication state
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Authenticate user with email and password
   *
   * @param {string} email - User's email address
   * @param {string} password - User's password
   * @returns {Promise<void>} Promise that resolves when login is successful
   * @throws {Error} If login fails
   */
  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { token: newToken, user: userData } = response.data;

      // Store token and update state
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  /**
   * Register a new user account
   *
   * @param {RegisterData} userData - User registration data
   * @returns {Promise<void>} Promise that resolves when registration is successful
   * @throws {Error} If registration fails
   */
  const register = async (userData: RegisterData) => {
    try {
      const response = await api.post('/api/auth/register', userData);
      const { token: newToken, user: newUser } = response.data;

      // Store token and update state
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(newUser);
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  /**
   * Logout current user
   *
   * Clears authentication state and removes stored token.
   * This function can be called to sign out the current user.
   */
  const logout = async () => {
    try {
      // Call logout endpoint to deactivate session on server
      await api.post('/api/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API call failed:', error);
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      delete api.defaults.headers.common['Authorization'];
    }
  };

  // Context value object
  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
