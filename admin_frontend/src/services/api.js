const API = import.meta.env.VITE_API_URL;
const BASE_URL = `${API}/api`;
const LOCAL_CATEGORIES_KEY = 'farmycure_admin_categories_cache';

console.log('API URL:', import.meta.env.VITE_API_URL);

const debugLog = (...args) => {
  if (import.meta.env.DEV) console.log(...args);
};

export const resolveApiImageUrl = (value) => {
  const image = String(value || '').trim();
  if (!image) return '';
  if (image.startsWith('/uploads')) return `${API}${image}`;
  return image;
};

const normalizeProduct = (product = {}) => {
  const variants = Array.isArray(product.variants)
    ? product.variants.map((variant) => ({
        ...variant,
        image: resolveApiImageUrl(variant?.image),
      }))
    : [];
  const fallbackImage = variants.find((v) => v?.image)?.image || '';
  return {
    ...product,
    name: product.name || product.title || product.productCode || '',
    title: product.title || product.name || '',
    image: resolveApiImageUrl(product.image) || fallbackImage,
    variants,
  };
};

const readLocalCategories = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_CATEGORIES_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeLocalCategories = (categories) => {
  localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(categories));
};

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
        'Backend not reachable. Check VITE_API_URL and backend deployment health.'
      );
    }
    const ct = response.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Request failed (${response.status})`);
    }
    const text = await response.text().catch(() => '');
    const clean = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);
    throw new Error(`Request failed (${response.status})${clean ? `: ${clean}` : ''}`);
  }
  return response.json();
};

const fetchJson = async (url, init) => {
  try {
    debugLog('Request:', { url, method: init?.method || 'GET', data: init?.body || null });
    const response = await fetch(url, init);
    debugLog('Response:', { url, status: response.status, ok: response.ok });
    return handleResponse(response);
  } catch (err) {
    const msg = err?.message || String(err);
    if (msg === 'Failed to fetch' || err?.name === 'TypeError') {
      throw new Error(
        'Cannot reach the API. Verify VITE_API_URL and network access.'
      );
    }
    throw err;
  }
};

const withAutoRefresh = async (input, init = {}) => {
  let response;
  try {
    debugLog('Request:', { url: input, method: init?.method || 'GET', data: init?.body || null });
    response = await fetch(input, init);
    debugLog('Response:', { url: input, status: response.status, ok: response.ok });
  } catch (err) {
    const msg = err?.message || String(err);
    if (msg === 'Failed to fetch' || err?.name === 'TypeError') {
      throw new Error(
        'Cannot reach the API. Verify VITE_API_URL and reload this page.'
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
  login: async (data) => {
    const payload = {
      username: String(data?.username || '').trim(),
      password: String(data?.password || '').trim(),
    };
    try {
      return await fetchJson(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      // Backward compatibility for deployed backend expecting email instead of username.
      if (String(err?.message || '').includes('Invalid credentials') && payload.username) {
        return fetchJson(`${BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, email: payload.username }),
        });
      }
      throw err;
    }
  },

  // Products
  getProducts: async () => {
    const data = await withAutoRefresh(`${BASE_URL}/products`);
    const list = Array.isArray(data) ? data : data?.products || [];
    return list.map(normalizeProduct);
  },

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
  getCategories: async () => {
    try {
      const data = await withAutoRefresh(`${BASE_URL}/categories`);
      const list = Array.isArray(data) ? data : data?.categories || [];
      if (list.length) {
        writeLocalCategories(list);
      }
      return list;
    } catch (err) {
      if (String(err?.message || '').includes('(404)')) {
        const products = await api.getProducts().catch(() => []);
        const derived = [...new Set(products.map((p) => p.category).filter(Boolean))].map((cat) => ({
          _id: `derived-${cat}`,
          name: cat,
          slug: String(cat).toLowerCase().replace(/\s+/g, '-'),
          categoryCode: String(cat).toLowerCase().replace(/\s+/g, '-'),
        }));
        const local = readLocalCategories();
        return [...derived, ...local];
      }
      throw err;
    }
  },

  createCategory: async (data) => {
    try {
      return await withAutoRefresh(`${BASE_URL}/categories`, {
        method: 'POST',
        headers: buildHeaders(data),
        body: data instanceof FormData ? data : JSON.stringify(data),
      });
    } catch (err) {
      if (String(err?.message || '').includes('(404)')) {
        const payload = data instanceof FormData ? Object.fromEntries(data.entries()) : data;
        const localCategory = {
          _id: `local-${Date.now()}`,
          name: payload?.name || 'New Category',
          slug: payload?.slug || String(payload?.name || '').toLowerCase().replace(/\s+/g, '-'),
          categoryCode: payload?.categoryCode || payload?.slug,
          description: payload?.description || '',
          image: resolveApiImageUrl(payload?.image || payload?.imageUrl || ''),
        };
        const current = readLocalCategories();
        writeLocalCategories([localCategory, ...current]);
        return localCategory;
      }
      throw err;
    }
  },

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
