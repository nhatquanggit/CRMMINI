import api from './api';

const BASE_URL = '/tasks';

export const taskApi = {
  // List tasks with filters
  list: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.customerId) params.append('customerId', filters.customerId);
    if (filters.dealId) params.append('dealId', filters.dealId);
    if (filters.assignedTo) params.append('assignedTo', filters.assignedTo);
    if (filters.status) params.append('status', filters.status);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.fromDate) params.append('fromDate', filters.fromDate);
    if (filters.toDate) params.append('toDate', filters.toDate);
    if (filters.isOverdue) params.append('isOverdue', filters.isOverdue);
    if (filters.orderBy) params.append('orderBy', filters.orderBy);

    return api.get(`${BASE_URL}?${params.toString()}`);
  },

  // Get task detail
  get: (id) => api.get(`${BASE_URL}/${id}`),

  // Create task
  create: (data) => api.post(BASE_URL, data),

  // Update task
  update: (id, data) => api.put(`${BASE_URL}/${id}`, data),

  // Update task status (quick action)
  updateStatus: (id, status) => api.patch(`${BASE_URL}/${id}/status`, { status }),

  // Delete task
  delete: (id) => api.delete(`${BASE_URL}/${id}`),

  // Get user stats
  getStats: () => api.get(`${BASE_URL}/stats/user`)
};

export default taskApi;
