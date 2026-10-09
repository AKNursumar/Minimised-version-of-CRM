import axios from 'axios';

const BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor to attach JWT access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh and 401s
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Do not attempt refresh on login or refresh endpoints
    const isAuthUrl =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/refresh') ||
      originalRequest?.url?.includes('/token');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthUrl) {
      const refreshToken = localStorage.getItem('refresh_token');

      if (!refreshToken) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(
          `${BASE_URL}/api/auth/refresh/`,
          { refresh: refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const newAccessToken = response.data.access;
        localStorage.setItem('access_token', newAccessToken);

        api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Helper to extract a friendly error message from API response
export const getErrorMessage = (error, defaultMsg = 'An unexpected error occurred.') => {
  if (!error) return defaultMsg;

  // 1. Client-side or gateway request timeout
  if (
    error.code === 'ECONNABORTED' ||
    error.message?.toLowerCase().includes('timeout') ||
    error.name === 'AbortError' ||
    error.code === 'ERR_CANCELED'
  ) {
    return 'The request timed out. The server took too long to respond. Please try again.';
  }

  // 2. HTTP response received from backend
  if (error.response) {
    const { status, data } = error.response;

    // Prefer explicit backend messages from JSON response if present
    const explicitMsg =
      (typeof data === 'string' && data) ||
      data?.message ||
      data?.detail ||
      data?.error;

    if (status === 401) {
      return 'Session expired or unauthorized. Please log in again.';
    }
    if (status === 403) {
      return explicitMsg || 'You do not have permission to perform this action.';
    }
    if (status === 404) {
      return explicitMsg || 'The requested record or resource was not found.';
    }
    if (status === 409) {
      return explicitMsg || 'The request could not be completed due to a conflict or pending task.';
    }
    if (status === 503) {
      return explicitMsg || 'Task processing service is temporarily unavailable. Please try again shortly.';
    }
    if (status === 500) {
      return explicitMsg || 'Internal server error. Please try again later or contact your administrator.';
    }

    if (explicitMsg) return explicitMsg;

    // DRF field validation errors: { field: ["error message"] }
    if (typeof data === 'object' && data !== null) {
      const keys = Object.keys(data);
      if (keys.length > 0) {
        const firstKey = keys[0];
        const val = data[firstKey];
        if (Array.isArray(val) && val.length > 0) {
          return `${firstKey.replace(/_/g, ' ')}: ${val[0]}`;
        }
        if (typeof val === 'string') return `${firstKey.replace(/_/g, ' ')}: ${val}`;
      }
    }
    return `Server responded with error (${status})`;
  } else if (error.request) {
    // 3. Genuine network failure (no response received from server)
    return 'Cannot reach the server. Please check your network connection and ensure the backend is running.';
  }

  return error.message || defaultMsg;
};

export default api;
