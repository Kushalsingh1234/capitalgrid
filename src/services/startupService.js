/**
 * CapitalGrid Frontend Startup Service API
 * Interface for communication with Express backend /api/startup
 */

const API_BASE = `${import.meta.env.VITE_API_URL || ''}/api/startup`;

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
 * Create a new player Startup
 */
export const createStartup = async (startupData, token) => {
  const response = await fetch(`${API_BASE}/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(startupData)
  });
  return handleResponse(response);
};

/**
 * Retrieve the active user's Startup details
 */
export const getMyStartup = async (token) => {
  const response = await fetch(`${API_BASE}/my-startup`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  return handleResponse(response);
};
