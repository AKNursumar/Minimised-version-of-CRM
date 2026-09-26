import api from './api';

export const activityService = {
  getAll: async (params = {}) => {
    const response = await api.get('/api/activity-logs/', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/api/activity-logs/${id}/`);
    return response.data;
  },
};

export default activityService;
