import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', // Match the backend server URL
});

// Add a request interceptor to attach the JWT token
api.interceptors.request.use(
  (config) => {
    const authData = localStorage.getItem('Udaan.auth');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        if (parsed.token) {
          config.headers.Authorization = `Bearer ${parsed.token}`;
        }
      } catch (e) {
        console.error('Failed to parse auth data for token', e);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration/unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error('API 401 Unauthorized error at:', error.config?.url, error.response?.data);
      // Only clear session and reload if error is NOT from auth endpoints (/auth/me, /auth/login, etc.)
      const requestUrl = error.config?.url || '';
      if (!requestUrl.includes('/auth/me') && !requestUrl.includes('/auth/verify-otp') && !requestUrl.includes('/auth/login')) {
        localStorage.removeItem('Udaan.auth');
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
