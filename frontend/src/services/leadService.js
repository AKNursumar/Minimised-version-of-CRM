import api from './api';

export const leadService = {
  getAll: async (params = {}) => {
    const response = await api.get('/api/leads/', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/api/leads/${id}/`);
    return response.data;
  },

  create: async (leadData) => {
    const response = await api.post('/api/leads/', leadData);
    return response.data;
  },

  update: async (id, leadData) => {
    const response = await api.put(`/api/leads/${id}/`, leadData);
    return response.data;
  },

  patch: async (id, leadData) => {
    const response = await api.patch(`/api/leads/${id}/`, leadData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/api/leads/${id}/`);
    return response.data;
  },

  exportCsv: async (params = {}) => {
    const response = await api.get('/api/leads/export-csv/', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};

export default leadService;
