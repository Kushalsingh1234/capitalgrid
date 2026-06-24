/**
 * CapitalGrid Frontend Employee Service API
 * Interface for communication with Express backend /api/employee
 */

const API_BASE = `${import.meta.env.VITE_API_URL || ''}/api/employee`;

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Employee API request failed');
  }
  return data;
};

/**
 * Retrieve the current startup's employees
 */
export const getMyEmployees = async (token) => {
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
 * Hire an employee role for the startup
 */
export const hireEmployee = async (employeeType, token) => {
  const response = await fetch(`${API_BASE}/hire`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ employeeType })
  });
  return handleResponse(response);
};

/**
 * Fire an employee role for the startup
 */
export const fireEmployee = async (employeeType, token) => {
  const response = await fetch(`${API_BASE}/fire`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ employeeType })
  });
  return handleResponse(response);
};
