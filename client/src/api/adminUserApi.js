import api from './api';

const BASE = '/admin/users';

const adminUserApi = {
  list: (params = {}) => api.get(BASE, { params }),
  get: (id) => api.get(`${BASE}/${id}`),
  updateRole: (id, role) => api.patch(`${BASE}/${id}/role`, { role }),
  setActive: (id, isActive) => api.patch(`${BASE}/${id}/active`, { isActive }),
  remove: (id) => api.delete(`${BASE}/${id}`)
};

export default adminUserApi;
