import api from './api';

export const userService = {
  getAll: async () => {
    const response = await api.get('/api/users/');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/api/users/${id}/`);
    return response.data;
  },
};

export default userService;
