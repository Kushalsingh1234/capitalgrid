const API_BASE = `${import.meta.env.VITE_API_URL || ''}/api/retail`;

export const getRetailStatus = async (token) => {
  const res = await fetch(`${API_BASE}/status`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
};

export const transferInventory = async (productId, quantity, token) => {
  const res = await fetch(`${API_BASE}/inventory/transfer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ productId, quantity })
  });
  return res.json();
};

export const updatePricing = async (productId, sellingPrice, token) => {
  const res = await fetch(`${API_BASE}/pricing/update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ productId, sellingPrice })
  });
  return res.json();
};

export const startSalesCycle = async (selectedProducts, token) => {
  const res = await fetch(`${API_BASE}/cycle/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ selectedProducts })
  });
  return res.json();
};

export const stopSalesCycle = async (token) => {
  const res = await fetch(`${API_BASE}/cycle/stop`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
};

export const completeSalesCycle = async (token) => {
  const res = await fetch(`${API_BASE}/cycle/complete`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
};
