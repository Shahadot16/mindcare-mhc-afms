import axios from 'axios';

const TOKEN_KEY = 'mhc_token';

export const tokenStore = {
  get: () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } },
  set: (t) => { try { localStorage.setItem(TOKEN_KEY, t); } catch { /* storage unavailable */ } },
  clear: () => { try { localStorage.removeItem(TOKEN_KEY); } catch { /* storage unavailable */ } },
};

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && tokenStore.get()) {
      tokenStore.clear();
      if (!location.pathname.startsWith('/login')) location.assign('/login?expired=1');
    }
    return Promise.reject(err);
  }
);

/** Turns any axios error into a readable message. */
export const errMsg = (err) =>
  err?.response?.data?.message || (err?.request && !err?.response ? 'Cannot reach the server. Is the backend running?' : err?.message) || 'Something went wrong';

export default api;
