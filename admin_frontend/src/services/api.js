/**
 * API base: dev uses relative /api (Vite proxy → backend).
 * Production: set VITE_API_BASE, or defaults to backend on 127.0.0.1:5000.
 */
const API_ORIGIN =
  import.meta.env.VITE_API_BASE?.replace(/\/$/, '') ??
  (import.meta.env.DEV ? '' : 'http://127.0.0.1:5000');
const BASE_URL = API_ORIGIN ? `${API_ORIGIN}/api` : '/api';

const buildHeaders = (body) => {
  const token = localStorage.getItem('farmycure_token');
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  return token
    ? { ...(isFormData ? {} : { 'Content-Type': 'application/json' }), Authorization: `Bearer ${token}` }
    : isFormData
      ? {}
      : { 'Content-Type': 'application/json' };
};

const handleResponse = async (response) => {
  if (!response.ok) {
    if (response.status === 502 || response.status === 504) {
      throw new Error(
        'Backend not reachable on port 5000 (proxy 502). Open a terminal, run: cd Organic_02/backend && npm run dev — then reload this page.'
      );
    }
    const ct = response.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Request failed (${response.status})`);
    }
    const text = await response.text().catch(() => '');
    throw new Error(text.trim().slice(0, 160) || `Request failed (${response.status})`);
  }
  return response.json();
};

const fetchJson = async (url, init) => {
  try {
    const response = await fetch(url, init);
    return handleResponse(response);
  } catch (err) {
    const msg = err?.message || String(err);
    if (msg === 'Failed to fetch' || err?.name === 'TypeError') {
      throw new Error(
        'Cannot reach the API. Start the backend (npm run dev in Organic_02/backend, port 5000) and keep the admin dev server running.'
      );
    }
    throw err;
  }
};

const withAutoRefresh = async (input, init = {}) => {
  let response;
  try {
    response = await fetch(input, init);
  } catch (err) {
    const msg = err?.message || String(err);
    if (msg === 'Failed to fetch' || err?.name === 'TypeError') {
      throw new Error(
        'Cannot reach the API. Start the backend on port 5000 and reload this page.'
      );
    }
    throw err;
  }
  if (response.status !== 401) return handleResponse(response);
  const refreshToken = localStorage.getItem('farmycure_refresh_token');
  if (!refreshToken) return handleResponse(response);
  const refreshRes = await fetch(`${BASE_URL}/auth/refresh-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!refreshRes.ok) return handleResponse(response);
  const refreshData = await refreshRes.json();
  if (!refreshData.accessToken) return handleResponse(response);
  localStorage.setItem('farmycure_token', refreshData.accessToken);
  response = await fetch(input, { ...init, headers: buildHeaders(init.body) });
  return handleResponse(response);
};

export const api = {
  login: (data) =>
    fetchJson(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  // Products
  getProducts: () => withAutoRefresh(`${BASE_URL}/products`),

  createProduct: (data) =>
    withAutoRefresh(`${BASE_URL}/products`, {
      method: 'POST',
      headers: buildHeaders(data),
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),

  updateProduct: (id, data) =>
    withAutoRefresh(`${BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: buildHeaders(data),
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),

  deleteProduct: (id) =>
    withAutoRefresh(`${BASE_URL}/products/${id}`, {
      method: 'DELETE',
      headers: buildHeaders(),
    }),

  // Categories
  getCategories: () => withAutoRefresh(`${BASE_URL}/categories`),

  createCategory: (data) =>
    withAutoRefresh(`${BASE_URL}/categories`, {
      method: 'POST',
      headers: buildHeaders(data),
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),

  // Orders
  getOrders: () => withAutoRefresh(`${BASE_URL}/orders?scope=all`, { headers: buildHeaders() }),

  updateOrder: (id, data) =>
    withAutoRefresh(`${BASE_URL}/orders/${id}`, {
      method: 'PUT',
      headers: buildHeaders(data),
      body: JSON.stringify(data),
    }),

  updateOrderStatus: (id, status) =>
    withAutoRefresh(`${BASE_URL}/orders/${id}/status`, {
      method: 'PUT',
      headers: buildHeaders({}),
      body: JSON.stringify({ status }),
    }),
};
