import api from './api';

export const followupService = {
  getAll: async (params = {}) => {
    const response = await api.get('/api/followups/', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/api/followups/${id}/`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/api/followups/', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/api/followups/${id}/`, data);
    return response.data;
  },

  patch: async (id, data) => {
    const response = await api.patch(`/api/followups/${id}/`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/api/followups/${id}/`);
    return response.data;
  },
};

export default followupService;
