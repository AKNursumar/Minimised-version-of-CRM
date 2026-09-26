import api from './api';

export const authService = {
  login: async (username, password) => {
    const response = await api.post('/api/auth/login/', { username, password });
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/api/auth/me/');
    return response.data;
  },

  refreshToken: async (refresh) => {
    const response = await api.post('/api/auth/refresh/', { refresh });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },
};

export default authService;
