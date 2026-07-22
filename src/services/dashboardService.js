import api from '../api/axios';

export const dashboardService = {
  getStats: () => api.get('/dashboard'),
};

export default dashboardService;
