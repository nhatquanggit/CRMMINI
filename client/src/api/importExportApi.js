import api from './api';

const importExportApi = {
  /**
   * Download exported customers as .xlsx blob
   */
  downloadCustomers: () =>
    api.get('/export/customers', { responseType: 'blob' }),

  /**
   * Download exported deals as .xlsx blob
   */
  downloadDeals: () =>
    api.get('/export/deals', { responseType: 'blob' }),

  /**
   * Upload a .xlsx/.csv file for customer import
   * @param {File} file
   * @param {(pct: number) => void} onProgress
   */
  importCustomers: (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/import/customers', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (ev) => {
        if (onProgress && ev.total) {
          onProgress(Math.round((ev.loaded * 100) / ev.total));
        }
      }
    });
  }
};

export default importExportApi;
