/**
 * CapitalGrid Frontend Supply Agreement Service API
 */

const API_BASE = `${import.meta.env.VITE_API_URL || ''}/api/agreements`;

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Agreement operation failed');
  }
  return data;
};

export const createProposal = async (data, token) => {
  const response = await fetch(`${API_BASE}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  return handleResponse(response);
};

export const counterProposal = async (id, data, token) => {
  const response = await fetch(`${API_BASE}/${id}/counter`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  return handleResponse(response);
};

export const getAgreementDetails = async (id, token) => {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  return handleResponse(response);
};

export const getAgreementsList = async (params = {}, token) => {
  const { tab = 'Offers', search = '', page = 1, limit = 10 } = params;
  const url = `${API_BASE}?tab=${encodeURIComponent(tab)}&search=${encodeURIComponent(search)}&page=${page}&limit=${limit}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  return handleResponse(response);
};

export const acceptAgreement = async (id, token) => {
  const response = await fetch(`${API_BASE}/${id}/accept`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  return handleResponse(response);
};

export const rejectAgreement = async (id, token) => {
  const response = await fetch(`${API_BASE}/${id}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  return handleResponse(response);
};

export const cancelAgreement = async (id, token) => {
  const response = await fetch(`${API_BASE}/${id}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  return handleResponse(response);
};

export const sendAgreementDelivery = async (id, token) => {
  const response = await fetch(`${API_BASE}/${id}/deliveries/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  return handleResponse(response);
};

export const acceptAgreementDelivery = async (id, token) => {
  const response = await fetch(`${API_BASE}/deliveries/${id}/accept`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  return handleResponse(response);
};

export const rejectAgreementDelivery = async (id, reason, token) => {
  const response = await fetch(`${API_BASE}/deliveries/${id}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ reason })
  });
  return handleResponse(response);
};

export const retractAgreement = async (id, token) => {
  const response = await fetch(`${API_BASE}/${id}/retract`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  return handleResponse(response);
};

export const terminateAgreement = async (id, chargeCompensation, token) => {
  const response = await fetch(`${API_BASE}/${id}/terminate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ chargeCompensation })
  });
  return handleResponse(response);
};

export const getAgreementDeliveries = async (id, token) => {
  const response = await fetch(`${API_BASE}/${id}/deliveries`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  return handleResponse(response);
};
