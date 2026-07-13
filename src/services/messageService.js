/**
 * CapitalGrid B2B Messaging Service API
 */

const API_BASE = `${import.meta.env.VITE_API_URL || ''}/api/messages`;

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }
  return data;
};

export const getConversations = async (searchQuery = '', token) => {
  const response = await fetch(`${API_BASE}/conversations?search=${encodeURIComponent(searchQuery)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  return handleResponse(response);
};

export const startConversation = async (targetCompanyId, category, token) => {
  const response = await fetch(`${API_BASE}/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ targetCompanyId, category })
  });
  return handleResponse(response);
};

export const getMessages = async (conversationId, token) => {
  const response = await fetch(`${API_BASE}/conversations/${conversationId}/messages`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  return handleResponse(response);
};

export const sendMessage = async (conversationId, { content, type, contractRef }, token) => {
  const response = await fetch(`${API_BASE}/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ content, type, contractRef })
  });
  return handleResponse(response);
};

export const markAsRead = async (conversationId, token) => {
  const response = await fetch(`${API_BASE}/conversations/${conversationId}/read`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  return handleResponse(response);
};

export const getUnreadCount = async (token) => {
  const response = await fetch(`${API_BASE}/unread-count`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  return handleResponse(response);
};

export const getUnreadWithCompany = async (companyId, token) => {
  const response = await fetch(`${API_BASE}/unread-with/${companyId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  return handleResponse(response);
};
