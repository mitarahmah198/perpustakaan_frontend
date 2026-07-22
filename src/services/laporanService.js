import api from '../api/axios';

export const laporanService = {
  getReportData: () => api.get('/loans'),
};

export default laporanService;
