import api from './api';

export const analyticsService = {
  getSummary: async () => {
    const response = await api.get('/api/reports/analytics/');
    return response.data;
  },
};

export default analyticsService;
