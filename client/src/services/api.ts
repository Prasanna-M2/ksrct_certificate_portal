import axios from 'axios';

// Use environment variable VITE_API_URL if provided, else default to relative '/api'
const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ksrct_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor for 401 unauth
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect on login check failure, but clear token if invalid
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('ksrct_token');
        localStorage.removeItem('ksrct_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
