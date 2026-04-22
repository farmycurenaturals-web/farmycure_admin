import axios from 'axios';
const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim();
const API = rawApiUrl ? (rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl) : '';
const API_BASE = API || '';
console.log('API URL:', import.meta.env.VITE_API_URL);
const session = sessionStorage;

const getAccessToken = () => session.getItem('farmycure_token');
const getRefreshToken = () => session.getItem('farmycure_refresh_token');

const buildAuthHeaders = () => {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token found');

  try {
    if (import.meta.env.DEV) {
      console.log('Request:', { url: `${API_BASE}/api/auth/refresh-token`, data: { refreshToken } });
    }
    const res = await axios.post(
      `${API_BASE}/api/auth/refresh-token`,
      { refreshToken },
      { headers: { 'Content-Type': 'application/json' } }
    );
    if (import.meta.env.DEV) {
      console.log('Response:', { url: `${API_BASE}/api/auth/refresh-token`, status: res.status, data: res.data });
    }

    const nextToken = res.data?.accessToken || res.data?.token;
    if (nextToken) session.setItem('farmycure_token', nextToken);
    return nextToken;
  } catch (e) {
    session.removeItem('farmycure_token');
    session.removeItem('farmycure_refresh_token');
    session.removeItem('farmycure_user');
    throw e;
  }
};

export const apiAdmin = {
  getWithAutoRefresh: async (path) => {
    const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
    try {
      if (import.meta.env.DEV) {
        console.log('Request:', { url, method: 'GET' });
      }
      const response = await axios.get(url, { headers: buildAuthHeaders() });
      if (import.meta.env.DEV) {
        console.log('Response:', { url, status: response.status, data: response.data });
      }
      return response;
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        await refreshAccessToken();
        const response = await axios.get(url, { headers: buildAuthHeaders() });
        if (import.meta.env.DEV) {
          console.log('Response:', { url, status: response.status, data: response.data });
        }
        return response;
      }
      err.message = err?.response?.data?.message || err?.message || 'Request failed';
      throw err;
    }
  },
};

