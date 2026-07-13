const API_BASE = `${import.meta.env.VITE_API_URL || ''}/api/contracts`;

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'API request operation failed');
  }
  return data;
};

export const publishContract = async (payload, token) => {
  const response = await fetch(`${API_BASE}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  return handleResponse(response);
};

export const getContracts = async (params, token) => {
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

export const getContractDetails = async (id, token) => {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  return handleResponse(response);
};
