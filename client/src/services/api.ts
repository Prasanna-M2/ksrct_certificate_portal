import axios from 'axios';

// Create a real Axios instance for backend communications
export const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ksrct_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Unauthenticated or Server Errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token if unauthenticated
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('ksrct_token');
        localStorage.removeItem('ksrct_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
