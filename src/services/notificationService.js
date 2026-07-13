/**
 * CapitalGrid Frontend Notification Service API
 * Interface for communication with Express backend /api/notifications
 */

const API_BASE = `${import.meta.env.VITE_API_URL || ''}/api/notifications`;

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'API request operation failed');
  }
  return data;
};

/**
 * Retrieve notifications
 */
export const getNotifications = async (token) => {
  const response = await fetch(`${API_BASE}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  return handleResponse(response);
};

/**
 * Mark notifications as read
 */
export const markNotificationsAsRead = async (token) => {
  const response = await fetch(`${API_BASE}/read`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  return handleResponse(response);
};
