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

/**
 * Retrieve National Commodity Reserve (NCR) catalog
 */
export const getNcrCatalog = async (token) => {
  const response = await fetch(`${API_BASE}/ncr/catalog`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  return handleResponse(response);
};

/**
 * Purchase a product from NCR
 */
export const buyFromNcr = async (tradeData, token) => {
  const response = await fetch(`${API_BASE}/ncr/buy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(tradeData)
  });
  return handleResponse(response);
};

/**
 * Sell a product to NCR
 */
export const sellToNcr = async (tradeData, token) => {
  const response = await fetch(`${API_BASE}/ncr/sell`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(tradeData)
  });
  return handleResponse(response);
};
