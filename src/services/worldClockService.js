/**
 * CapitalGrid Frontend World Clock Service API
 * Interface for communication with Express backend /api/world-clock
 */

const API_BASE = `${import.meta.env.VITE_API_URL || ''}/api/world-clock`;

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'World clock API request failed');
  }
  return data;
};

/**
 * Fetch the current server-authoritative World Clock state
 */
export const getWorldClock = async () => {
  const response = await fetch(`${API_BASE}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  return handleResponse(response);
};

/**
 * Update World Clock settings (Admin/Config)
 */
export const updateWorldClockSettings = async (settings, token) => {
  const response = await fetch(`${API_BASE}/settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(settings)
  });
  return handleResponse(response);
};
