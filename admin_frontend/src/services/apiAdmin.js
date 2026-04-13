import axios from 'axios';

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
    const res = await axios.post(
      '/api/auth/refresh-token',
      { refreshToken },
      { headers: { 'Content-Type': 'application/json' } }
    );

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
    try {
      return await axios.get(path, { headers: buildAuthHeaders() });
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        await refreshAccessToken();
        return await axios.get(path, { headers: buildAuthHeaders() });
      }
      throw err;
    }
  },
};

