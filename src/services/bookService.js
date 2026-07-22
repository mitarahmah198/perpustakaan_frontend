import api from '../api/axios';

export const bookService = {
  getAll: () => api.get('/books'),
  getById: (id) => api.get(`/books/${id}`),
  create: (data) => api.post('/books', data),
  // Diubah: pakai POST + _method spoofing karena FormData berisi file
  update: (id, data) => api.post(`/books/${id}`, data),
  delete: (id) => api.delete(`/books/${id}`),
};

export default bookService;