import api from './api';

export const contactService = {
  getAll: async (params = {}) => {
    const response = await api.get('/api/contacts/', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/api/contacts/${id}/`);
    return response.data;
  },

  create: async (contactData) => {
    const response = await api.post('/api/contacts/', contactData);
    return response.data;
  },

  update: async (id, contactData) => {
    const response = await api.put(`/api/contacts/${id}/`, contactData);
    return response.data;
  },

  patch: async (id, contactData) => {
    const response = await api.patch(`/api/contacts/${id}/`, contactData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/api/contacts/${id}/`);
    return response.data;
  },

  exportCsv: async (params = {}) => {
    const response = await api.get('/api/contacts/export-csv/', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  getTimeline: async (id, params = {}) => {
    const response = await api.get(`/api/contacts/${id}/timeline/`, { params });
    return response.data;
  },

  addNote: async (id, noteData) => {
    const response = await api.post(`/api/contacts/${id}/notes/`, noteData);
    return response.data;
  },
};

export default contactService;
