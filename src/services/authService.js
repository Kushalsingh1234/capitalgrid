/**
 * CapitalGrid Frontend Authentication Service API
 * Interface for communication with Express backend /api/auth
 */

const API_BASE = `${import.meta.env.VITE_API_URL || ''}/api/auth`;

/**
 * Handle API responses and catch errors
 */
const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'API request operation failed');
  }
  return data;
};

/**
 * Email/Password registration
 */
export const registerUser = async (userData) => {
  const response = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  return handleResponse(response);
};

/**
 * Email/Password sign-in
 */
export const loginUser = async (credentials) => {
  const response = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  return handleResponse(response);
};

/**
 * Backend verification of Google OAuth credential token
 */
export const googleLoginUser = async (credentialToken) => {
  const response = await fetch(`${API_BASE}/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential: credentialToken })
  });
  return handleResponse(response);
};

/**
 * Retrieve verified logged-in user profile details
 */
export const getUserProfile = async (token) => {
  const response = await fetch(`${API_BASE}/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  return handleResponse(response);
};
