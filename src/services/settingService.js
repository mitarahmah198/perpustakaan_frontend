import api from '../api/axios';

export const settingService = {
  getAll: () => api.get('/settings'),
  update: (data) => api.post('/settings', data),
};

export default settingService;
