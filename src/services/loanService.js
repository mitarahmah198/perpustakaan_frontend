import api from '../api/axios';

export const loanService = {
  getAll: () => api.get('/loans'),
  create: (data) => api.post('/loans', data),
  returnBook: (id, data) => api.post(`/loans/${id}/return`, data),
};

export default loanService;
