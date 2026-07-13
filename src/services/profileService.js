const API_BASE = `${import.meta.env.VITE_API_URL || ''}/api/profile`;

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'API request operation failed');
  }
  return data;
};

export const getPublicProfile = async (id, token) => {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  return handleResponse(response);
};
