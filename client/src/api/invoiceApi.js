import api from './api';

export const getInvoicesApi = async (params = {}) => {
  const { data } = await api.get('/invoices', { params });
  return data.data;
};

export const getInvoiceApi = async (id) => {
  const { data } = await api.get(`/invoices/${id}`);
  return data.data;
};

export const createInvoiceApi = async (payload) => {
  const { data } = await api.post('/invoices', payload);
  return data.data;
};

export const updateInvoiceApi = async (id, payload) => {
  const { data } = await api.put(`/invoices/${id}`, payload);
  return data.data;
};

export const updateInvoiceStatusApi = async (id, status) => {
  const { data } = await api.patch(`/invoices/${id}/status`, { status });
  return data.data;
};

export const deleteInvoiceApi = async (id) => {
  const { data } = await api.delete(`/invoices/${id}`);
  return data.data;
};
