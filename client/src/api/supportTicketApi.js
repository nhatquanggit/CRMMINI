import api from './api';

export const getSupportTicketsApi = async (params = {}) => {
  const { data } = await api.get('/support-tickets', { params });
  return data.data;
};

export const getSupportTicketApi = async (id) => {
  const { data } = await api.get(`/support-tickets/${id}`);
  return data.data;
};

export const createSupportTicketApi = async (payload) => {
  const { data } = await api.post('/support-tickets', payload);
  return data.data;
};

export const updateSupportTicketApi = async (id, payload) => {
  const { data } = await api.put(`/support-tickets/${id}`, payload);
  return data.data;
};

export const deleteSupportTicketApi = async (id) => {
  const { data } = await api.delete(`/support-tickets/${id}`);
  return data.data;
};
