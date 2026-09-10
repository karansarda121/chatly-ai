import axios from 'axios';

export const SESSION_INVALID_EVENT = 'chatly:session-invalid';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('chatly_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // A protected API request returning 401 means the stored login is unusable.
    // Remove it once and let AuthProvider redirect protected pages to Login.
    const message = error.response?.data?.message;
    const isInvalidSession = [
      'Authentication is required.',
      'Your session is no longer valid.',
      'Your session is invalid or has expired.',
    ].includes(message);

    if (isInvalidSession && localStorage.getItem('chatly_token')) {
      localStorage.removeItem('chatly_token');
      localStorage.removeItem('chatly_user');
      window.dispatchEvent(new Event(SESSION_INVALID_EVENT));
    }

    return Promise.reject(error);
  },
);

export default api;