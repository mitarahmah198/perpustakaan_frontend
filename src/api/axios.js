import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: {
    'Accept': 'application/json',
    // Content-Type sengaja tidak di-set di sini.
    // Axios akan otomatis menentukan:
    // - 'application/json' untuk objek/JSON biasa
    // - 'multipart/form-data; boundary=...' untuk FormData
  },
});

// Request Interceptor: Otomatis sisipkan Bearer Token jika tersimpan di LocalStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Tangani sanksi 401 Unauthenticated
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export default api;