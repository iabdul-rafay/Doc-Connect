import axios from 'axios';

// In dev, VITE_API_URL is empty and requests go through the Vite proxy to :5000.
const baseURL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '') + '/api/v1';

const api = axios.create({ baseURL });

// Attach the saved JWT to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Surface a consistent error message and auto-logout on expired sessions.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || 'Something went wrong. Please try again.';
    if (status === 401 && localStorage.getItem('dc_token')) {
      localStorage.removeItem('dc_token');
      localStorage.removeItem('dc_user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login?expired=1');
      }
    }
    return Promise.reject(new Error(message));
  }
);

// Build an absolute URL for an uploaded asset (avatars).
export function assetUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const root = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
  return root + path;
}

export default api;
