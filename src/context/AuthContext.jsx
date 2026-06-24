import React, { createContext, useState, useEffect, useContext } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('cg_token') || null);

  // Check user validation on load if session token exists
  useEffect(() => {
    const bootstrapAuth = async () => {
      if (token) {
        try {
          const response = await authService.getUserProfile(token);
          if (response.success && response.user) {
            setUser(response.user);
          } else {
            // Invalid session state, clear storage
            clearSession();
          }
        } catch (error) {
          console.warn(`[Session Resume Failed] ${error.message}`);
          clearSession();
        }
      }
      setLoading(false);
    };

    bootstrapAuth();
  }, [token]);

  const clearSession = () => {
    localStorage.removeItem('cg_token');
    setToken(null);
    setUser(null);
  };

  /**
   * Login with email and password
   */
  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await authService.loginUser({ email, password });
      if (response.success && response.token) {
        localStorage.setItem('cg_token', response.token);
        setToken(response.token);
        setUser(response.user);
        return response;
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  /**
   * Register a new player account
   */
  const signup = async (fullName, email, password) => {
    setLoading(true);
    try {
      const response = await authService.registerUser({ fullName, email, password });
      if (response.success && response.token) {
        localStorage.setItem('cg_token', response.token);
        setToken(response.token);
        setUser(response.user);
        return response;
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  /**
   * Google pop-up verification login
   */
  const googleLogin = async (googleCredential) => {
    setLoading(true);
    try {
      const response = await authService.googleLoginUser(googleCredential);
      if (response.success && response.token) {
        localStorage.setItem('cg_token', response.token);
        setToken(response.token);
        setUser(response.user);
        return response;
      } else {
        throw new Error(response.message || 'Google Login failed');
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  /**
   * End player session
   */
  const logout = () => {
    clearSession();
  };

  /**
   * Update user state with startup information after creation
   */
  const updateUserStartupInfo = (startupId, country) => {
    if (user) {
      setUser(prev => ({
        ...prev,
        startupExists: true,
        startupId,
        country
      }));
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, token, login, signup, googleLogin, logout, updateUserStartupInfo }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be invoked within an AuthProvider component');
  }
  return context;
};
