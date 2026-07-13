const API_BASE = '/api/loans';

export const getLoanEligibility = async (token) => {
  const response = await fetch(`${API_BASE}/eligibility`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch loan eligibility.');
  }
  return response.json();
};

export const getActiveLoans = async (token) => {
  const response = await fetch(`${API_BASE}/active`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch active loans.');
  }
  return response.json();
};

export const getLoanHistory = async (token) => {
  const response = await fetch(`${API_BASE}/history`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch loan history.');
  }
  return response.json();
};

export const applyForLoan = async (loanData, token) => {
  const response = await fetch(`${API_BASE}/apply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(loanData)
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to apply for loan.');
  }
  return response.json();
};

export const repayLoan = async (loanId, amount, token) => {
  const response = await fetch(`${API_BASE}/${loanId}/repay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ amount })
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to repay loan.');
  }
  return response.json();
};
