import axios from 'axios';
const API = import.meta.env.VITE_API_URL;
console.log('API URL:', import.meta.env.VITE_API_URL);

const getAccessToken = () => localStorage.getItem('farmycure_token');
const getRefreshToken = () => localStorage.getItem('farmycure_refresh_token');

const buildAuthHeaders = () => {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token found');

  try {
    if (import.meta.env.DEV) {
      console.log('Request:', { url: `${API}/api/auth/refresh-token`, data: { refreshToken } });
    }
    const res = await axios.post(
      `${API}/api/auth/refresh-token`,
      { refreshToken },
      { headers: { 'Content-Type': 'application/json' } }
    );
    if (import.meta.env.DEV) {
      console.log('Response:', { url: `${API}/api/auth/refresh-token`, status: res.status, data: res.data });
    }

    const nextToken = res.data?.accessToken || res.data?.token;
    if (nextToken) localStorage.setItem('farmycure_token', nextToken);
    return nextToken;
  } catch (e) {
    localStorage.removeItem('farmycure_token');
    localStorage.removeItem('farmycure_refresh_token');
    localStorage.removeItem('farmycure_user');
    throw e;
  }
};

export const apiAdmin = {
  getWithAutoRefresh: async (path) => {
    const url = path.startsWith('http') ? path : `${API}${path}`;
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

