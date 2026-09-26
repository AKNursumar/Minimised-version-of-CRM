import api from './api';

export const opportunityService = {
  getAll: async (params = {}) => {
    const response = await api.get('/api/opportunities/', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/api/opportunities/${id}/`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/api/opportunities/', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/api/opportunities/${id}/`, data);
    return response.data;
  },

  patch: async (id, data) => {
    const response = await api.patch(`/api/opportunities/${id}/`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/api/opportunities/${id}/`);
    return response.data;
  },
};

export default opportunityService;
