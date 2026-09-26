import api from './api';

export const notificationService = {
  getAll: async (params = {}) => {
    const response = await api.get('/api/email-notifications/', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/api/email-notifications/${id}/`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/api/email-notifications/', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/api/email-notifications/${id}/`, data);
    return response.data;
  },

  patch: async (id, data) => {
    const response = await api.patch(`/api/email-notifications/${id}/`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/api/email-notifications/${id}/`);
    return response.data;
  },

  resend: async (id) => {
    const response = await api.post(`/api/email-notifications/${id}/resend/`);
    return response.data;
  },
};

export default notificationService;
