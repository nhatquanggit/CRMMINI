import api from './api';

export const getQuotesApi = async (params = {}) => {
  const { data } = await api.get('/quotes', { params });
  return data.data;
};

export const getQuoteApi = async (id) => {
  const { data } = await api.get(`/quotes/${id}`);
  return data.data;
};

export const createQuoteApi = async (payload) => {
  const { data } = await api.post('/quotes', payload);
  return data.data;
};

export const updateQuoteApi = async (id, payload) => {
  const { data } = await api.put(`/quotes/${id}`, payload);
  return data.data;
};

export const updateQuoteStatusApi = async (id, status) => {
  const { data } = await api.patch(`/quotes/${id}/status`, { status });
  return data.data;
};

export const deleteQuoteApi = async (id) => {
  const { data } = await api.delete(`/quotes/${id}`);
  return data.data;
};
