/**
 * CapitalGrid Frontend Marketplace Service API
 * Interface for communication with Express backend /api/marketplace
 */

const API_BASE = `${import.meta.env.VITE_API_URL || ''}/api/marketplace`;

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Marketplace API request failed');
  }
  return data;
};

/**
 * Retrieve all active marketplace listings
 */
export const getListings = async (token) => {
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
 * Create a new marketplace listing
 */
export const createListing = async (listingData, token) => {
  const response = await fetch(`${API_BASE}/list`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(listingData)
  });
  return handleResponse(response);
};

/**
 * Purchase an active marketplace listing
 */
export const buyListing = async (listingId, token) => {
  const response = await fetch(`${API_BASE}/buy/${listingId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  return handleResponse(response);
};
