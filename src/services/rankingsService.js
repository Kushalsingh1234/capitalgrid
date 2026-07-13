/**
 * CapitalGrid Frontend Rankings Service API
 * Interface for communication with Express backend /api/rankings
 */

const API_BASE = `${import.meta.env.VITE_API_URL || ''}/api/rankings`;

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'API request operation failed');
  }
  return data;
};

/**
 * Retrieve rankings list
 */
export const getRankings = async (params, token) => {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE}?${query}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  return handleResponse(response);
};

/**
 * Retrieve player's summary rank
 */
export const getMyRankingSummary = async (token) => {
  const response = await fetch(`${API_BASE}/my-summary`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  return handleResponse(response);
};
