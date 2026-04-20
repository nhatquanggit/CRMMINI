import api from './api';

const BASE_URL = '/activities';

export const activityApi = {
  // List activities with filters
  list: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.customerId) params.append('customerId', filters.customerId);
    if (filters.dealId) params.append('dealId', filters.dealId);
    if (filters.type) params.append('type', filters.type);
    if (filters.fromDate) params.append('fromDate', filters.fromDate);
    if (filters.toDate) params.append('toDate', filters.toDate);

    return api.get(`${BASE_URL}?${params.toString()}`);
  },

  // Get activity detail
  get: (id) => api.get(`${BASE_URL}/${id}`),

  // Create activity
  create: (data) => api.post(BASE_URL, data),

  // Update activity
  update: (id, data) => api.put(`${BASE_URL}/${id}`, data),

  // Delete activity
  delete: (id) => api.delete(`${BASE_URL}/${id}`)
};

export default activityApi;
