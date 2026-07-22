import api from '../api/axios';

export const staffService = {
  getAll: () => api.get('/staff'),
  create: (data) => api.post('/staff', data),
  delete: (id) => api.delete(`/staff/${id}`),
};

export default staffService;
