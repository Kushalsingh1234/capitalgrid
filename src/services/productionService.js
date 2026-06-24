/**
 * CapitalGrid Frontend Production Service API
 * Interface for communication with Express backend /api/production
 */

const API_BASE = `${import.meta.env.VITE_API_URL || ''}/api/production`;

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Production API request failed');
  }
  return data;
};

/**
 * Notify the server that a production run has completed.
 * Adds items to the startup inventory.
 */
export const completeProduction = async (productData, token) => {
  const response = await fetch(`${API_BASE}/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(productData)
  });
  return handleResponse(response);
};

/**
 * Retrieve the startup's current inventory.
 */
export const getInventory = async (token) => {
  const response = await fetch(`${API_BASE}/inventory`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  return handleResponse(response);
};
