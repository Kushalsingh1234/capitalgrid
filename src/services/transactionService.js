/**
 * CapitalGrid Frontend Transaction Service API
 * Interface for communication with Express backend /api/transaction
 */

const API_BASE = `${import.meta.env.VITE_API_URL || ''}/api/transaction`;

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Transaction API request failed');
  }
  return data;
};

/**
 * Retrieve the active player's transaction history logs
 */
export const getMyTransactions = async (token) => {
  const response = await fetch(`${API_BASE}/my-history`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  return handleResponse(response);
};
