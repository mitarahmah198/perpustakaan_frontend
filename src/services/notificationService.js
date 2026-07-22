import api from '../api/axios';

export const notificationService = {
  getAll: () => api.get('/notifications'),
  send: (data) => api.post('/notifications', data),
  markAsRead: (id) => api.post(`/notifications/${id}/read`),
  delete: (id) => api.delete(`/notifications/${id}`),
};

export default notificationService;
